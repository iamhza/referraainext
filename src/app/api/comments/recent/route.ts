import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb/client';

import { getAuthenticatedUser } from '@/lib/auth/helpers';
// GET: Fetch recent comments (last 7 days) across all referrals for dashboard
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
    
    // Only case managers and admins can view dashboard
    const userRole = user.role;
    if (userRole !== 'case_manager' && userRole !== 'platform_admin') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const days = parseInt(searchParams.get('days') || '7');
    const userId = user.id;
    
    // Calculate date threshold for "recent" (default: last 7 days)
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // More efficient pipeline focusing on recent activity
    const pipeline = [
      // Match referrals that the case manager has access to
      {
        $match: userRole === 'platform_admin' ? {} : { caseManagerId: userId }
      },
      // Only include referrals that have been updated recently or have recent comments
      {
        $match: {
          $or: [
            { updatedAt: { $gte: dateThreshold.toISOString() } },
            { 'comments.createdAt': { $gte: dateThreshold.toISOString() } }
          ]
        }
      },
      // Unwind comments array to work with individual comments
      {
        $unwind: {
          path: '$comments',
          preserveNullAndEmptyArrays: false
        }
      },
      // Filter to only recent comments (last 7 days by default)
      {
        $match: {
          'comments.createdAt': { $gte: dateThreshold.toISOString() }
        }
      },
      // Sort comments by creation date (most recent first)
      {
        $sort: { 'comments.createdAt': -1 }
      },
      // Limit to recent comments
      {
        $limit: limit
      },
      // Lookup client information using clientInfo._id
      {
        $lookup: {
          from: 'clients',
          localField: 'clientInfo._id',
          foreignField: '_id',
          as: 'client'
        }
      },
      // Lookup provider information if available
      {
        $lookup: {
          from: 'providers',
          localField: 'providerId',
          foreignField: '_id',
          as: 'provider'
        }
      },
      // Project the fields we need
      {
        $project: {
          _id: '$comments._id',
          content: '$comments.content',
          authorId: '$comments.authorId',
          authorName: '$comments.authorName',
          authorType: '$comments.authorType',
          category: '$comments.category',
          priority: '$comments.priority',
          createdAt: '$comments.createdAt',
          referralId: '$_id',
          referralStatus: '$status',
          clientId: '$clientInfo._id',
          clientName: {
            $concat: [
              { $arrayElemAt: ['$client.firstName', 0] },
              ' ',
              { $arrayElemAt: ['$client.lastName', 0] }
            ]
          },
          serviceType: '$serviceDetails.type',
          providerName: {
            $cond: {
              if: { $gt: [{ $size: '$provider' }, 0] },
              then: { $arrayElemAt: ['$provider.name', 0] },
              else: null
            }
          },
          urgency: '$serviceDetails.urgency',
          // Add time-based flags
          isToday: {
            $gte: ['$comments.createdAt', new Date().toISOString().split('T')[0]]
          },
          hoursAgo: {
            $divide: [
              { $subtract: [new Date(), { $dateFromString: { dateString: '$comments.createdAt' } }] },
              3600000 // Convert milliseconds to hours
            ]
          }
        }
      }
    ];
    
    const recentComments = await db.collection('referrals').aggregate(pipeline).toArray();
    
    // Group by time periods for better organization
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Format the response with time grouping
    const formattedComments = recentComments.map(comment => {
      const commentDate = new Date(comment.createdAt);
      let timeGroup = 'older';
      
      if (commentDate >= today) {
        timeGroup = 'today';
      } else if (commentDate >= yesterday) {
        timeGroup = 'yesterday';
      } else if (commentDate >= thisWeek) {
        timeGroup = 'thisWeek';
      }
      
      return {
        id: comment._id,
        content: comment.content,
        authorName: comment.authorName,
        authorType: comment.authorType,
        category: comment.category || 'general',
        priority: comment.priority || 'normal',
        createdAt: comment.createdAt,
        referralId: comment.referralId,
        referralStatus: comment.referralStatus,
        clientId: comment.clientId,
        clientName: comment.clientName || 'Unknown Client',
        serviceType: comment.serviceType || 'Unknown Service',
        providerName: comment.providerName,
        urgency: comment.urgency,
        timeGroup,
        isToday: comment.isToday,
        hoursAgo: Math.floor(comment.hoursAgo || 0)
      };
    });
    
    // Group comments by time period
    const groupedComments = {
      today: formattedComments.filter(c => c.timeGroup === 'today'),
      yesterday: formattedComments.filter(c => c.timeGroup === 'yesterday'),
      thisWeek: formattedComments.filter(c => c.timeGroup === 'thisWeek'),
      older: formattedComments.filter(c => c.timeGroup === 'older')
    };
    
    return NextResponse.json({ 
      success: true, 
      comments: formattedComments,
      groupedComments,
      total: formattedComments.length,
      summary: {
        totalToday: groupedComments.today.length,
        totalYesterday: groupedComments.yesterday.length,
        totalThisWeek: groupedComments.thisWeek.length,
        totalOlder: groupedComments.older.length,
        dateRange: {
          from: dateThreshold.toISOString(),
          to: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error fetching recent comments:', error);
    return NextResponse.json({ error: 'Error fetching recent comments' }, { status: 500 });
  }
} 