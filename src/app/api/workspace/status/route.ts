/**
 * Workspace Status API
 * Returns message status for multiple clients
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !['case_manager', 'supervisor', 'org_admin', 'platform_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientIds } = await request.json();

    if (!Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json({ error: 'Client IDs required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    const statuses: Record<string, any> = {};

    // Process each client
    for (const clientId of clientIds) {
      try {
        // Find active referrals for this client
        const activeReferrals = await db.collection('referrals').find({
          clientId: clientId,
          status: { $in: ['accepted', 'active', 'sent_to_provider', 'matched'] },
          providerId: { $exists: true, $ne: null }
        }).toArray();

        if (activeReferrals.length === 0) {
          statuses[clientId] = {
            clientId,
            unreadMessages: 0,
            pendingUpdateRequests: 0,
            hasActiveConversation: false,
            needsAttention: false
          };
          continue;
        }

        const referralIds = activeReferrals.map(r => r._id.toString());

        // Count unread messages from secure_messages (messages from provider that case manager hasn't read)
        const unreadMessages = await db.collection('secure_messages').countDocuments({
          referralId: { $in: referralIds },
          authorType: 'provider',
          'readBy.userId': { $ne: user.id }
        });

        // Count pending update requests (update requests without responses in secure_messages)
        const updateRequests = await db.collection('secure_messages').find({
          referralId: { $in: referralIds },
          authorType: 'case_manager',
          content: { $regex: '^UPDATE REQUEST:' }, // Our update requests start with this
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        }).toArray();

        let pendingUpdateRequests = 0;
        for (const request of updateRequests) {
          // Check if provider has responded since the request
          const responses = await db.collection('secure_messages').countDocuments({
            referralId: request.referralId,
            authorType: 'provider',
            createdAt: { $gt: request.createdAt }
          });
          if (responses === 0) {
            pendingUpdateRequests++;
          }
        }

        // Get last message timestamp from secure_messages
        const lastMessage = await db.collection('secure_messages')
          .findOne(
            { referralId: { $in: referralIds } },
            { sort: { createdAt: -1 } }
          );

        const hasActiveConversation = activeReferrals.length > 0;
        const needsAttention = unreadMessages > 0 || pendingUpdateRequests > 0;

        statuses[clientId] = {
          clientId,
          unreadMessages,
          pendingUpdateRequests,
          lastMessageAt: lastMessage?.createdAt,
          hasActiveConversation,
          needsAttention
        };

      } catch (error) {
        console.error(`Error processing workspace status for client ${clientId}:`, error);
        statuses[clientId] = {
          clientId,
          unreadMessages: 0,
          pendingUpdateRequests: 0,
          hasActiveConversation: false,
          needsAttention: false,
          error: 'Failed to load status'
        };
      }
    }

    return NextResponse.json({
      success: true,
      statuses
    });

  } catch (error) {
    console.error('Error fetching workspace statuses:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch workspace statuses' 
    }, { status: 500 });
  }
}
