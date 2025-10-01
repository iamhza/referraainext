import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = params.id;
    if (!clientId) {
      return NextResponse.json({ error: 'Client ID required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Get client details to build timeline
    const clientDoc = await db.collection('clients').findOne({ 
      _id: new ObjectId(clientId) 
    });
    
    if (!clientDoc) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Build timeline events from various sources
    const events = [];

    // 1. Client creation event
    if (clientDoc.created_at || clientDoc.createdAt) {
      events.push({
        id: `client-created-${clientId}`,
        type: 'system',
        title: 'Client added',
        description: 'Client added to your caseload',
        actor: 'System',
        timestamp: clientDoc.created_at || clientDoc.createdAt
      });
    }

    // Helper function to format status labels consistently
    const getStatusLabel = (status: string): string => {
      if (!status) return 'Unknown';
      
      // Use consistent formatting - no underscores, proper capitalization
      const statusMap: { [key: string]: string } = {
        'UNPLACED': 'Unplaced',
        'UNPLACED_NEW': 'Unplaced',
        'REFERRAL_SENT': 'Referral Sent',
        'IN_PROCESS': 'In Process',
        'ACTIVE_STABLE': 'Active',
        'ACTIVE_NEEDS_ATTENTION': 'Needs Attention',
        'ACTIVE_FRUSTRATED': 'Needs Attention',
        'CLOSED_DISCHARGED': 'Closed/Discharged'
      };
      
      return statusMap[status] || status
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    // Helper function to format service types
    const getServiceTypeLabel = (serviceType: string): string => {
      if (!serviceType) return 'Service';
      
      // Convert from database format to user-friendly format
      const serviceMap: { [key: string]: string } = {
        'mental_health': 'Mental Health',
        'substance_abuse': 'Substance Abuse',
        'housing': 'Housing',
        'employment': 'Employment',
        'healthcare': 'Healthcare',
        'legal': 'Legal Services',
        'financial': 'Financial Assistance',
        'transportation': 'Transportation',
        'education': 'Education',
        'childcare': 'Childcare',
        'senior_services': 'Senior Services',
        'disability_services': 'Disability Services',
        'food_assistance': 'Food Assistance',
        'crisis_intervention': 'Crisis Intervention'
      };

      return serviceMap[serviceType] || serviceType.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    };

    // Helper function to format referral status
    const getReferralStatusLabel = (status: string): string => {
      if (!status) return 'Unknown';
      
      const statusMap: { [key: string]: string } = {
        'draft': 'Draft',
        'submitted': 'Submitted',
        'matched': 'Matched',
        'selection_required': 'Selection Required',
        'sent_to_provider': 'Sent to Provider',
        'accepted': 'Accepted',
        'active': 'Active',
        'completed': 'Completed',
        'rejected': 'Rejected',
        'cancelled': 'Cancelled',
        'expired': 'Expired'
      };

      return statusMap[status] || status.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    };

    // 2. Status change events (if we track these)
    if (clientDoc.updated_at || clientDoc.updatedAt) {
      const createdTime = new Date(clientDoc.created_at || clientDoc.createdAt).getTime();
      const updatedTime = new Date(clientDoc.updated_at || clientDoc.updatedAt).getTime();
      
      // Only add status change if it's different from creation time
      if (updatedTime > createdTime + 1000) { // 1 second difference
        const statusLabel = getStatusLabel(clientDoc.status);
        events.push({
          id: `client-updated-${clientId}`,
          type: 'client',
          title: `Status updated to ${statusLabel}`,
          description: 'Client status was updated',
          actor: 'Case Manager',
          timestamp: clientDoc.updated_at || clientDoc.updatedAt
        });
      }
    }

    // 3. Referrals created for this client
    const referrals = await db.collection('referrals').find({
      $or: [
        { 'clientInfo._id': clientId },
        { clientId: clientId }
      ]
    }).toArray();

    for (const referral of referrals) {
      const serviceLabel = getServiceTypeLabel(referral.serviceDetails?.type || referral.serviceType);
      const urgencyText = referral.urgency ? ` (${referral.urgency.charAt(0).toUpperCase() + referral.urgency.slice(1)} priority)` : '';
      
      events.push({
        id: `referral-${referral._id}`,
        type: 'referral',
        title: 'Referral submitted',
        description: `${serviceLabel} referral submitted${urgencyText}`,
        actor: 'Case Manager',
        timestamp: referral.createdAt || referral.created_at
      });

      // Add referral status changes
      if (referral.status && referral.status !== 'draft' && referral.status !== 'submitted') {
        const statusLabel = getReferralStatusLabel(referral.status);
        events.push({
          id: `referral-status-${referral._id}`,
          type: 'referral',
          title: `Referral ${statusLabel.toLowerCase()}`,
          description: `${serviceLabel} referral status changed to ${statusLabel}`,
          actor: referral.status === 'accepted' || referral.status === 'rejected' ? 'Provider' : 'System',
          timestamp: referral.updatedAt || referral.updated_at || referral.createdAt
        });
      }

      // Add provider assignment event if exists
      if (referral.assignedProvider || referral.providerId) {
        const providerName = referral.assignedProviderName || referral.providerInfo?.name || 'provider';
        events.push({
          id: `referral-assigned-${referral._id}`,
          type: 'connection',
          title: 'Provider assigned',
          description: `${serviceLabel} referral assigned to ${providerName}`,
          actor: 'System',
          timestamp: referral.updatedAt || referral.updated_at || referral.createdAt
        });
      }

      // Add network posting event if referral was posted to network
      if (referral.isOpenToNetwork) {
        events.push({
          id: `referral-network-${referral._id}`,
          type: 'system',
          title: 'Posted to network',
          description: `${serviceLabel} referral posted to live provider network`,
          actor: 'Case Manager',
          timestamp: referral.networkPostedAt || referral.updatedAt || referral.updated_at
        });
      }
    }

    // 4. Recent messages related to this client
    const messages = await db.collection('secure_messages').find({
      clientId: clientId
    }).limit(10).sort({ createdAt: -1 }).toArray();

    for (const message of messages) {
      const actorName = message.authorName || 
        (message.authorType === 'case_manager' ? 'Case Manager' : 
         message.authorType === 'provider' ? 'Provider' : 'System');

      // Add different types of messages to timeline
      if (message.content && message.content.includes('UPDATE REQUEST:')) {
        // Extract the actual request content after the prefix
        const requestContent = message.content.replace('UPDATE REQUEST: ', '');
        events.push({
          id: `message-${message._id}`,
          type: 'communication',
          title: 'Update requested',
          description: `Update request: "${requestContent.substring(0, 50)}${requestContent.length > 50 ? '...' : ''}"`,
          actor: actorName,
          timestamp: message.createdAt
        });
      } else if (message.category === 'status_update') {
        events.push({
          id: `message-status-${message._id}`,
          type: 'communication',
          title: 'Status update received',
          description: 'Provider sent a status update',
          actor: actorName,
          timestamp: message.createdAt
        });
      } else if (message.category === 'general') {
        // Only add general messages if they seem important (longer than 20 chars)
        if (message.content && message.content.length > 20) {
          events.push({
            id: `message-general-${message._id}`,
            type: 'communication',
            title: 'Message exchanged',
            description: `${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
            actor: actorName,
            timestamp: message.createdAt
          });
        }
      }
    }

    // 5. Add connection events from connections collection
    try {
      const connections = await db.collection('connections').find({
        $or: [
          { 'clientInfo.firstName': clientDoc.firstName, 'clientInfo.lastName': clientDoc.lastName },
          { clientId: clientId }
        ]
      }).toArray();

      for (const connection of connections) {
        if (connection.isActivated) {
          events.push({
            id: `connection-${connection._id}`,
            type: 'connection',
            title: 'Provider connection established',
            description: `Successfully connected with ${connection.providerInfo?.name || 'provider'}`,
            actor: 'System',
            timestamp: connection.activatedAt || connection.updatedAt || connection.createdAt
          });
        } else if (connection.status === 'pending') {
          events.push({
            id: `connection-pending-${connection._id}`,
            type: 'connection',
            title: 'Provider connection initiated',
            description: `Connection initiated with ${connection.providerInfo?.name || 'provider'}`,
            actor: 'System',
            timestamp: connection.createdAt
          });
        }
      }
    } catch (connectionError) {
      console.log('Note: Could not fetch connection events:', connectionError);
    }

    // 6. Add action events from actions collection
    try {
      const actions = await db.collection('actions').find({
        clientId: clientId
      }).sort({ createdAt: -1 }).toArray();

      for (const action of actions) {
        events.push({
          id: `action-${action._id}`,
          type: 'action',
          title: action.title || `${action.type} action`,
          description: action.description || action.notes,
          actor: action.createdByName || 'Unknown',
          timestamp: action.createdAt,
          actionType: action.type,
          urgency: action.urgency || 'normal'
        });
      }
    } catch (actionError) {
      console.log('Note: Could not fetch action events:', actionError);
    }

    // 7. Add document events from events collection (uploads and deletions)
    try {
      const documentEvents = await db.collection('events').find({
        clientId: new ObjectId(clientId),
        type: { $in: ['document_upload', 'document_delete'] }
      }).sort({ createdAt: -1 }).toArray();

      for (const docEvent of documentEvents) {
        const isUpload = docEvent.type === 'document_upload';
        events.push({
          id: `document-${docEvent._id}`,
          type: 'document',
          title: isUpload ? 'Document uploaded' : 'Document deleted',
          description: docEvent.description || `Document: ${docEvent.metadata?.documentName || 'Unknown'}`,
          actor: docEvent.metadata?.uploadedBy || docEvent.metadata?.deletedBy || 'Unknown',
          timestamp: docEvent.createdAt,
          metadata: {
            documentName: docEvent.metadata?.documentName,
            documentType: docEvent.metadata?.documentType,
            contextType: docEvent.metadata?.contextType,
            isEncrypted: docEvent.metadata?.isEncrypted || docEvent.metadata?.wasEncrypted,
            action: isUpload ? 'upload' : 'delete'
          }
        });
      }
    } catch (documentError) {
      console.log('Note: Could not fetch document events:', documentError);
    }

    // 8. Add timeline events from timeline_events collection (action-related events, excluding comments)
    try {
      const timelineEvents = await db.collection('timeline_events').find({
        clientId: clientId,
        // Exclude comment-related events from Timeline
        type: { $nin: ['action_comment_added', 'action_comment_deleted'] }
      }).sort({ createdAt: -1 }).toArray();

      for (const timelineEvent of timelineEvents) {
        events.push({
          id: `timeline-${timelineEvent._id}`,
          type: timelineEvent.type || 'system',
          title: timelineEvent.description || 'Timeline event',
          description: timelineEvent.metadata ? 
            `Action: ${timelineEvent.metadata.actionTitle || timelineEvent.metadata.actionType}` : 
            undefined,
          actor: timelineEvent.createdByName || 'Unknown',
          timestamp: timelineEvent.createdAt,
          actionType: timelineEvent.metadata?.actionType,
          metadata: timelineEvent.metadata
        });
      }
    } catch (timelineError) {
      console.log('Note: Could not fetch timeline events:', timelineError);
    }

    // 9. Add client status change events (if we have status history)
    if (clientDoc.statusHistory && Array.isArray(clientDoc.statusHistory)) {
      for (const statusChange of clientDoc.statusHistory) {
        events.push({
          id: `status-${statusChange.timestamp || Date.now()}`,
          type: 'status_change',
          title: `Status changed to ${getStatusLabel(statusChange.status)}`,
          description: statusChange.reason || 'Client status updated',
          actor: statusChange.changedBy || 'System',
          timestamp: statusChange.timestamp || statusChange.date || clientDoc.updatedAt,
          status: statusChange.status
        });
      }
    }

    // Sort events by timestamp (oldest first - chronological timeline)
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return NextResponse.json({ 
      success: true, 
      events: events.slice(0, 20) // Limit to 20 most recent events
    });

  } catch (error) {
    console.error('Error fetching client timeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline events' },
      { status: 500 }
    );
  }
}
