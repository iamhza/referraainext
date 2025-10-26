/**
 * Bulk Update Request API
 * Creates workspace messages for multiple clients/referrals
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';
import { createSecureMessage } from '@/lib/services/messaging';

interface UpdateRequestBody {
  clientIds?: string[];           // Specific clients (optional)
  message?: string;              // Custom message (optional)
  category?: 'follow_up_required' | 'status_update' | 'document_request';
  priority?: 'normal' | 'important' | 'urgent';
  requestAll?: boolean;          // Request updates for all clients
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !['case_manager', 'supervisor', 'org_admin', 'platform_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: UpdateRequestBody = await request.json();
    const {
      clientIds = [],
      message = 'Hi! Could you please provide an update on the current progress and status?',
      category = 'follow_up_required',
      priority = 'normal',
      requestAll = false
    } = body;

    const client = await clientPromise;
    const db = client.db('referradb');

    // Build query to find clients
    let clientQuery: any = {};
    
    if (requestAll) {
      // Request updates for all clients assigned to this case manager
      if (user.role === 'case_manager') {
        clientQuery = { caseManagerId: user.id };
      } else if (user.role === 'supervisor' || user.role === 'org_admin') {
        // For supervisors/org admins, get all clients in their organization
        clientQuery = { orgId: user.org_id };
      }
    } else if (clientIds.length > 0) {
      // Request updates for specific clients
      clientQuery = { 
        _id: { $in: clientIds.map(id => new ObjectId(id)) },
        // Ensure user has access to these clients
        ...(user.role === 'case_manager' ? { caseManagerId: user.id } : {}),
        ...(user.org_id ? { orgId: user.org_id } : {})
      };
    } else {
      return NextResponse.json({ error: 'No clients specified' }, { status: 400 });
    }

    // Find clients with active referrals
    const clients = await db.collection('clients').find(clientQuery).toArray();
    
    if (clients.length === 0) {
      return NextResponse.json({ error: 'No accessible clients found' }, { status: 404 });
    }

    const results = [];
    const errors = [];

    // For each client, find their active referrals and create workspace messages
    for (const clientDoc of clients) {
      try {
        // Find active referrals for this client
        const activeReferrals = await db.collection('referrals').find({
          clientId: clientDoc._id.toString(),
          status: { $in: ['accepted', 'active', 'sent_to_provider', 'matched'] },
          providerId: { $exists: true, $ne: null }
        }).toArray();

        if (activeReferrals.length === 0) {
          errors.push({
            clientId: clientDoc._id.toString(),
            clientName: clientDoc.name || 'Unknown Client',
            error: 'No active referrals with providers found'
          });
          continue;
        }

        // Create secure workspace message for each active referral
        for (const referral of activeReferrals) {
          // Use the existing secure messaging system
          const authorName = user.email?.split('@')[0] || 'Case Manager';
          const messageResult = await createSecureMessage({
            referralId: referral._id.toString(),
            clientId: clientDoc._id.toString(),
            authorId: user.id,
            authorName,
            authorType: 'case_manager',
            content: `UPDATE REQUEST: ${message}`,
            category,
            priority,
            isInternal: false
          });
          
          // Create notification record for the provider
          if (referral.providerId) {
            await db.collection('notifications').insertOne({
              userId: referral.providerId,
              type: 'update_request',
              title: 'Update Request',
              message: `Update requested for ${clientDoc.name || 'client'}`,
              referralId: referral._id.toString(),
              clientId: clientDoc._id.toString(),
              requestedBy: user.id,
              createdAt: new Date().toISOString(),
              read: false,
              priority
            });
          }

          if (messageResult.success) {
            results.push({
              clientId: clientDoc._id.toString(),
              clientName: clientDoc.name || 'Unknown Client',
              referralId: referral._id.toString(),
              providerId: referral.providerId,
              messageId: messageResult.messageId.toString(),
              success: true
            });
          } else {
            errors.push({
              clientId: clientDoc._id.toString(),
              clientName: clientDoc.name || 'Unknown Client',
              error: messageResult.message || 'Failed to create secure message'
            });
          }
        }
      } catch (error) {
        console.error(`Error creating update request for client ${clientDoc._id}:`, error);
        errors.push({
          clientId: clientDoc._id.toString(),
          clientName: clientDoc.name || 'Unknown Client',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Update requests sent for ${results.length} referral${results.length !== 1 ? 's' : ''}`,
      results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        totalRequested: requestAll ? clients.length : clientIds.length,
        successful: results.length,
        failed: errors.length
      }
    });

  } catch (error) {
    console.error('Error processing update requests:', error);
    return NextResponse.json({ 
      error: 'Failed to process update requests',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
