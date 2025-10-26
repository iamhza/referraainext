/**
 * Individual Client Update Request API
 * Creates workspace message for a specific client's active referrals
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';
import { createSecureMessage } from '@/lib/services/messaging';

interface UpdateRequestBody {
  message?: string;
  category?: 'follow_up_required' | 'status_update' | 'document_request';
  priority?: 'normal' | 'important' | 'urgent';
  referralId?: string;  // Optional: target specific referral
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !['case_manager', 'supervisor', 'org_admin', 'platform_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = params.id;
    const body: UpdateRequestBody = await request.json();
    const {
      message = 'Hi! Could you please provide an update on the current progress and status?',
      category = 'follow_up_required',
      priority = 'normal',
      referralId
    } = body;

    const client = await clientPromise;
    const db = client.db('referradb');

    // Verify client exists and user has access
    const clientDoc = await db.collection('clients').findOne({
      _id: new ObjectId(clientId),
      // Ensure user has access to this client
      ...(user.role === 'case_manager' ? { caseManagerId: user.id } : {}),
      ...(user.org_id ? { orgId: user.org_id } : {})
    });

    if (!clientDoc) {
      return NextResponse.json({ error: 'Client not found or access denied' }, { status: 404 });
    }

    let referralsQuery: any = {
      clientId: clientId,
      status: { $in: ['accepted', 'active', 'sent_to_provider', 'matched'] },
      providerId: { $exists: true, $ne: null }
    };

    // If specific referral ID provided, target that one
    if (referralId) {
      referralsQuery._id = new ObjectId(referralId);
    }

    // Find active referrals for this client
    const activeReferrals = await db.collection('referrals').find(referralsQuery).toArray();

    if (activeReferrals.length === 0) {
      return NextResponse.json({ 
        error: 'No active referrals with providers found for this client',
        clientName: clientDoc.name || 'Unknown Client'
      }, { status: 404 });
    }

    const results = [];
    const errors = [];

    // Create secure workspace message for each active referral
    for (const referral of activeReferrals) {
      try {
        // Use the existing secure messaging system
        const authorName = user.email?.split('@')[0] || 'Case Manager';
        const messageResult = await createSecureMessage({
          referralId: referral._id.toString(),
          clientId: clientId,
          authorId: user.id,
          authorName,
          authorType: 'case_manager',
          content: `UPDATE REQUEST: ${message}`,
          category,
          priority,
          isInternal: false
        });
        
        // Create notification for the provider
        if (referral.providerId) {
          await db.collection('notifications').insertOne({
            userId: referral.providerId,
            type: 'update_request',
            title: 'Update Request',
            message: `Update requested for ${clientDoc.name || 'client'}`,
            referralId: referral._id.toString(),
            clientId: clientId,
            requestedBy: user.id,
            createdAt: new Date().toISOString(),
            read: false,
            priority
          });
        }

        if (messageResult.success) {
          results.push({
            referralId: referral._id.toString(),
            providerId: referral.providerId,
            messageId: messageResult.messageId.toString(),
            success: true
          });
        } else {
          errors.push({
            referralId: referral._id.toString(),
            error: messageResult.message || 'Failed to create secure message'
          });
        }

      } catch (error) {
        console.error(`Error creating update request for referral ${referral._id}:`, error);
        errors.push({
          referralId: referral._id.toString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Update request sent for ${clientDoc.name || 'client'}`,
      clientId,
      clientName: clientDoc.name || 'Unknown Client',
      results,
      errors: errors.length > 0 ? errors : undefined,
      workspaceUrl: results.length > 0 ? `/case-manager/referrals/${results[0].referralId}/workspace` : null
    });

  } catch (error) {
    console.error('Error processing individual update request:', error);
    return NextResponse.json({ 
      error: 'Failed to process update request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
