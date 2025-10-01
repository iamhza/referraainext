import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import { capitalizeName, formatServiceType } from '@/lib/formatting';
import { auditConversationAccess } from '@/lib/hipaa-audit';
import { getUnreadMessageCount } from '@/lib/secure-messaging';

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getAuthenticatedUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = user.role;
    const userId = user.id;

    if (userRole !== 'case_manager' && userRole !== 'platform_admin' && userRole !== 'provider') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // ENHANCED WORKSPACE: Get pending connections and conversations
    
    // Step 1: Get pending connections for this user
    const pendingConnections = await db.collection('pending_connections').find({
      ...(userRole === 'case_manager' 
        ? { caseManagerId: userId }
        : { providerId: userId }
      ),
      status: 'pending'
    }).sort({ createdAt: -1 }).toArray();

    console.log(`🔔 Found ${pendingConnections.length} pending connections for ${userRole}`);

    // NEW APPROACH: Start with shared clients, then find communications
    
    // Step 1: Find all clients where current user is involved
    let clientQuery: any = {};
    if (userRole === 'case_manager') {
      clientQuery = { caseManagerId: userId };
    } else if (userRole === 'provider') {
      clientQuery = { currentProvider: userId };
    }
    
    // PRODUCTION-OPTIMIZED: Combined query approach
    // First try to get shared clients efficiently
    const sharedClients = await db.collection('clients').find({
      ...clientQuery,
      ...(userRole === 'case_manager' 
        ? { currentProvider: { $exists: true, $ne: null } }
        : { caseManagerId: { $exists: true, $ne: null } }
      )
    }).limit(50).toArray(); // Limit for performance

    // FALLBACK: Get referral communications directly if no shared clients
    let directReferrals: any[] = [];
    if (sharedClients.length === 0) {
      directReferrals = await db.collection('referrals').find({
        ...(userRole === 'case_manager' 
          ? { caseManagerId: userId }
          : { 
              $or: [
                { assignedProvider: userId },
                { providerId: userId }
              ]
            }
        ),
        comments: { $exists: true, $ne: [] }
      }).sort({ 'comments.0.createdAt': -1 }).limit(20).toArray(); // Most recent first, limited
    }

    // Step 2: Process communications
    const clientConversations: Array<{client: any, communications: any[]}> = [];
    
    // Process communications efficiently
    if (sharedClients.length > 0) {
      // Process shared clients with batch queries
      for (const sharedClient of sharedClients) {
        await processClientCommunications(sharedClient);
      }
    } else {
      // Process direct referrals (already fetched above)
      for (const referral of directReferrals) {
        const pseudoClient = {
          _id: referral.clientInfo?._id || referral._id,
          firstName: referral.clientInfo?.firstName || 'Unknown',
          lastName: referral.clientInfo?.lastName || 'Client',
          dateOfBirth: referral.clientInfo?.dateOfBirth || '',
          currentProvider: referral.assignedProvider || referral.providerId
        };
        
        await processClientCommunications(pseudoClient, [referral]);
      }
    }

    // Helper function to process communications for a client
    async function processClientCommunications(sharedClient: any, existingReferrals?: any[]) {
      let referralComms = existingReferrals;
      
      if (!referralComms) {
        // Find referral-based communications for this client (optimized query)
        const clientKey = `${sharedClient.firstName || ''}|${sharedClient.lastName || ''}|${sharedClient.dateOfBirth || ''}`.toLowerCase();
        
        referralComms = await db.collection('referrals').find({
          $or: [
            { 'clientInfo._id': sharedClient._id },
            { 'clientInfo.clientId': sharedClient._id },
            { 'clientInfo.clientMatchKey': clientKey },
            { clientId: sharedClient._id }
          ],
          comments: { $exists: true, $ne: [] },
          ...(userRole === 'case_manager' 
            ? { caseManagerId: userId }
            : { 
                $or: [
                  { assignedProvider: userId },
                  { providerId: userId }
                ]
              }
          )
        }).sort({ 'comments.0.createdAt': -1 }).limit(10).toArray(); // Limit per client
      }

      // Add to conversations if we have communications
      if (referralComms && referralComms.length > 0) {
        clientConversations.push({
          client: sharedClient,
          communications: referralComms
        });
      }
    }

    // Step 3: Transform into conversation format (keeping existing structure for now)
    const conversations = [];
    
    for (const { client: sharedClient, communications } of clientConversations) {
      for (const comm of communications) {
        // Process each communication to extract conversation data
        const lastComment = comm.comments && comm.comments.length > 0 
          ? comm.comments.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
          : null;

        if (!lastComment) continue;

        // Count unread messages (messages from other users in last 24 hours)
        const unreadCount = comm.comments ? comm.comments.filter((comment: any) => {
          return comment.authorId !== userId && 
                 new Date(comment.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000);
        }).length : 0;

        // Determine urgency based on category and timing
        let urgencyScore = 1;
        if (lastComment.category === 'issue' || lastComment.priority === 'urgent') urgencyScore = 3;
        else if (lastComment.category === 'request' || lastComment.priority === 'important') urgencyScore = 2;

        // Determine conversation status and origin
        const conversationStatus = getConversationStatus(comm);
        const originType = getOriginType(comm);

        // Create conversation entry
        const conversation = {
          _id: comm._id.toString(),
          referralId: comm._id.toString(),
          clientId: sharedClient._id.toString(),
          clientName: `${sharedClient.firstName || ''} ${sharedClient.lastName || ''}`.trim(),
          
          // Service details
          serviceType: comm.serviceDetails?.type || 'Communication',
          status: comm.status || 'existing_service',
          
          // Provider information (from referral or client)
          providerId: comm.assignedProvider || comm.providerId || sharedClient.currentProvider,
          providerName: comm.providerInfo?.name || comm.providerInfo?.organization || 'Provider',
          
          // Communication metadata
          conversationStatus,
          originType,
          
          // Activity tracking
          lastActivity: lastComment.createdAt,
          lastMessage: {
            content: lastComment.content,
            authorName: lastComment.authorName,
            authorType: lastComment.authorType,
            category: lastComment.category,
            priority: lastComment.priority,
            timestamp: lastComment.createdAt
          },
          
          // Engagement metrics
          unreadCount,
          urgencyScore,
          totalMessages: comm.comments?.length || 0,
          totalComments: comm.comments?.length || 0,
          
          // Routing
          workspaceUrl: userRole === 'case_manager' 
            ? `/case-manager/referrals/${comm._id.toString()}/workspace`
            : `/provider/referrals/${comm._id.toString()}/workspace`,
          
          // Status flags
          isUrgent: urgencyScore >= 3,
          isRecentActivity: new Date().getTime() - new Date(lastComment.createdAt).getTime() < 2 * 60 * 60 * 1000, // 2 hours
          needsAttention: unreadCount > 0 || urgencyScore >= 2
        };

        conversations.push(conversation);
      }
    }

    // Helper functions
    function getConversationStatus(referral: any): string {
      if (!referral.status) return 'ongoing_care';
      
      switch (referral.status) {
        case 'under_review':
        case 'provider_selection_required':
        case 'matched':
        case 'pending_confirmation':
          return 'referral_active';
        case 'confirmed':
          // Check if services have started (heuristic: if comments span > 2 weeks, likely ongoing)
          if (referral.comments && referral.comments.length > 3) {
            const firstComment = new Date(referral.comments[0]?.createdAt || referral.createdAt);
            const daysSinceStart = (Date.now() - firstComment.getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceStart > 14 ? 'ongoing_care' : 'services_starting';
          }
          return 'services_starting';
        case 'in_progress':
        case 'active':
        case 'completed':
          return 'ongoing_care';
        default:
          return 'ongoing_care';
      }
    }

    function getOriginType(referral: any): string {
      // Check if this was auto-created from connection (provisional flag)
      if (referral.provisional) {
        return 'existing_services';
      }
      // Otherwise, it's a formal referral
      return 'referral_based';
    }

    console.log(`📊 Generated ${conversations.length} conversations from client-centric approach`);

    // Sort conversations by urgency and activity
    conversations.sort((a, b) => {
      // First by urgency score (higher = more urgent)  
      if (a.urgencyScore !== b.urgencyScore) {
        return b.urgencyScore - a.urgencyScore;
      }
      // Then by last activity (most recent first)
      return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
    });

    // Add computed fields for better UX and apply formatting
    const enhancedConversations = conversations.map(conv => {
      const lastActivityDate = new Date(conv.lastActivity);
      const now = new Date();
      const hoursDiff = (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60);
      
      return {
        ...conv,
        // Apply proper formatting to names and text
        clientName: capitalizeName(conv.clientName || 'Unknown Client'),
        serviceType: formatServiceType(conv.serviceType || 'Unknown Service'),
        providerName: capitalizeName(conv.providerName || 'Provider TBD'),
        lastMessage: conv.lastMessage ? {
          ...conv.lastMessage,
          authorName: capitalizeName(conv.lastMessage.authorName || 'Unknown Author')
        } : null,
        isUrgent: conv.urgencyScore >= 3,
        isRecentActivity: hoursDiff <= 2,
        needsAttention: conv.unreadCount > 0 || (hoursDiff <= 1 && conv.lastMessage?.authorType === 'case_manager'),
        timeAgo: formatTimeAgo(lastActivityDate)
      };
    });

    // Transform pending connections for UI
    const formattedPendingConnections = pendingConnections.map(pc => ({
      _id: pc._id.toString(),
      clientName: pc.clientName,
      clientMatchKey: pc.clientMatchKey,
      caseManagerId: pc.caseManagerId,
      providerId: pc.providerId,
      initiatedBy: pc.initiatedBy,
      createdAt: pc.createdAt,
      isFromCurrentUser: pc.initiatedBy === userId,
      counterpartType: userRole === 'case_manager' ? 'provider' : 'case_manager',
      timeAgo: formatTimeAgo(new Date(pc.createdAt))
    }));

    // Group conversations by client
    const clientGroups = new Map();
    
    enhancedConversations.forEach(conv => {
      const clientKey = `${conv.clientId}_${conv.clientName}`;
      
      if (!clientGroups.has(clientKey)) {
        clientGroups.set(clientKey, {
          clientId: conv.clientId,
          clientName: conv.clientName,
          conversations: [],
          lastActivity: conv.lastActivity,
          totalUnreadCount: 0,
          hasUrgent: false,
          needsAttention: false,
          timeAgo: conv.timeAgo
        });
      }
      
      const group = clientGroups.get(clientKey);
      group.conversations.push(conv);
      group.totalUnreadCount += conv.unreadCount;
      group.hasUrgent = group.hasUrgent || conv.isUrgent;
      group.needsAttention = group.needsAttention || conv.needsAttention;
      
      // Keep the most recent activity
      if (new Date(conv.lastActivity) > new Date(group.lastActivity)) {
        group.lastActivity = conv.lastActivity;
        group.timeAgo = conv.timeAgo;
      }
    });

    // Convert to array and sort by priority
    const groupedConversations = Array.from(clientGroups.values()).sort((a, b) => {
      // First by urgency
      if (a.hasUrgent !== b.hasUrgent) {
        return a.hasUrgent ? -1 : 1;
      }
      // Then by attention needed
      if (a.needsAttention !== b.needsAttention) {
        return a.needsAttention ? -1 : 1;
      }
      // Finally by last activity
      return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
    });

    return NextResponse.json({
      success: true,
      conversations: enhancedConversations, // Keep for backward compatibility
      groupedConversations,
      pendingConnections: formattedPendingConnections,
      stats: {
        total: enhancedConversations.length,
        totalClients: groupedConversations.length,
        urgent: enhancedConversations.filter(c => c.isUrgent).length,
        needsAttention: enhancedConversations.filter(c => c.needsAttention).length,
        pending: formattedPendingConnections.length,
        inbox: enhancedConversations.filter(c => c.needsAttention).length + formattedPendingConnections.length
      }
    });

  } catch (error) {
    console.error('Error fetching workspace conversations:', error);
    return NextResponse.json({ error: 'Error fetching conversations' }, { status: 500 });
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
} 