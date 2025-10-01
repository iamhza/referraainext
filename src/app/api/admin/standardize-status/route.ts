import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

import { getAuthenticatedUser } from '@/lib/nextauth-helpers';


export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'platform_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Analyze current status values
    const statusAnalysis = await db.collection('referrals').aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();

    return NextResponse.json({ 
      statusAnalysis,
      message: 'Current status values in referrals collection'
    });
  } catch (error) {
    console.error('Error analyzing status values:', error);
    return NextResponse.json({ error: 'Failed to analyze status values' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'platform_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action } = await req.json();
    const client = await clientPromise;
    const db = client.db('referradb');

    if (action === 'standardize') {
      // Standardize status values
      const statusMapping = {
        // Initial review status variations
        'pending': 'submitted',
        'Pending': 'submitted',
        'PENDING': 'submitted',
        'under review': 'submitted',
        'Under Review': 'submitted',
        'UNDER REVIEW': 'submitted',
        'under_review': 'submitted',
        
        // Provider selection variations
        'provider_selection_required': 'provider_selection_required',
        'Provider Selection Required': 'provider_selection_required',
        'PROVIDER_SELECTION_REQUIRED': 'provider_selection_required',
        'select provider': 'provider_selection_required',
        'Select Provider': 'provider_selection_required',
        'SELECT PROVIDER': 'provider_selection_required',
        
        // Matched status variations
        'matched': 'matched',
        'Matched': 'matched',
        'MATCHED': 'matched',
        'provider selected': 'matched',
        'Provider Selected': 'matched',
        'PROVIDER SELECTED': 'matched',
        
        // Pending confirmation variations
        'pending_confirmation': 'pending_confirmation',
        'Pending Confirmation': 'pending_confirmation',
        'PENDING_CONFIRMATION': 'pending_confirmation',
        'waiting confirmation': 'pending_confirmation',
        'Waiting Confirmation': 'pending_confirmation',
        'WAITING CONFIRMATION': 'pending_confirmation',
        
        // Confirmed status variations
        'confirmed': 'confirmed',
        'Confirmed': 'confirmed',
        'CONFIRMED': 'confirmed',
        'accepted': 'confirmed',
        'Accepted': 'confirmed',
        'ACCEPTED': 'confirmed',
        
        // In progress variations
        'in_progress': 'in_progress',
        'In Progress': 'in_progress',
        'IN_PROGRESS': 'in_progress',
        'active': 'in_progress',
        'Active': 'in_progress',
        'ACTIVE': 'in_progress',
        'working': 'in_progress',
        'Working': 'in_progress',
        'WORKING': 'in_progress',
        
        // Completed variations
        'completed': 'completed',
        'Completed': 'completed',
        'COMPLETED': 'completed',
        'finished': 'completed',
        'Finished': 'completed',
        'FINISHED': 'completed',
        'done': 'completed',
        'Done': 'completed',
        'DONE': 'completed',
        
        // Cancelled variations
        'cancelled': 'cancelled',
        'Cancelled': 'cancelled',
        'CANCELLED': 'cancelled',
        'canceled': 'cancelled',
        'Canceled': 'cancelled',
        'CANCELED': 'cancelled',
        
        // Rejected variations
        'rejected': 'rejected',
        'Rejected': 'rejected',
        'REJECTED': 'rejected',
        'declined': 'rejected',
        'Declined': 'rejected',
        'DECLINED': 'rejected',
        
        // Expired variations
        'expired': 'expired',
        'Expired': 'expired',
        'EXPIRED': 'expired',
        'timeout': 'expired',
        'Timeout': 'expired',
        'TIMEOUT': 'expired'
      };

      let updatedCount = 0;
      let skippedCount = 0;

      // Update each status value
      for (const [oldValue, newValue] of Object.entries(statusMapping)) {
        if (oldValue !== newValue) {
          const result = await db.collection('referrals').updateMany(
            { status: oldValue },
            { $set: { status: newValue } }
          );
          updatedCount += result.modifiedCount;
        }
      }

      // Set default for null/undefined values
      const nullResult = await db.collection('referrals').updateMany(
        { 
          $or: [
            { status: null },
            { status: { $exists: false } },
            { status: '' }
          ]
        },
        { $set: { status: 'submitted' } }
      );
      updatedCount += nullResult.modifiedCount;

      // Get final analysis
      const finalAnalysis = await db.collection('referrals').aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]).toArray();

      return NextResponse.json({
        success: true,
        updatedCount,
        skippedCount,
        finalAnalysis,
        message: 'Status values standardized successfully'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error standardizing status values:', error);
    return NextResponse.json({ error: 'Failed to standardize status values' }, { status: 500 });
  }
} 