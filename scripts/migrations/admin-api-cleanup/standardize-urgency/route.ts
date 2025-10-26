import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb/client';

import { getAuthenticatedUser } from '@/lib/auth/helpers';


export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'platform_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Analyze current urgency values
    const urgencyAnalysis = await db.collection('referrals').aggregate([
      {
        $group: {
          _id: '$serviceDetails.urgency',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();

    return NextResponse.json({ 
      urgencyAnalysis,
      message: 'Current urgency values in referrals collection'
    });
  } catch (error) {
    console.error('Error analyzing urgency values:', error);
    return NextResponse.json({ error: 'Failed to analyze urgency values' }, { status: 500 });
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
      // Standardize urgency values
      const urgencyMapping = {
        // High urgency variations
        'high': 'high',
        'High': 'high',
        'HIGH': 'high',
        'urgent': 'high',
        'Urgent': 'high',
        'URGENT': 'high',
        'critical': 'high',
        'Critical': 'high',
        'CRITICAL': 'high',
        'emergency': 'high',
        'Emergency': 'high',
        'EMERGENCY': 'high',
        'immediate': 'high',
        'Immediate': 'high',
        'IMMEDIATE': 'high',
        'asap': 'high',
        'ASAP': 'high',
        'priority': 'high',
        'Priority': 'high',
        'PRIORITY': 'high',
        
        // Medium urgency variations
        'medium': 'medium',
        'Medium': 'medium',
        'MEDIUM': 'medium',
        'moderate': 'medium',
        'Moderate': 'medium',
        'MODERATE': 'medium',
        'normal': 'medium',
        'Normal': 'medium',
        'NORMAL': 'medium',
        'standard': 'medium',
        'Standard': 'medium',
        'STANDARD': 'medium',
        
        // Low urgency variations
        'low': 'low',
        'Low': 'low',
        'LOW': 'low',
        'routine': 'low',
        'Routine': 'low',
        'ROUTINE': 'low',
        'non-urgent': 'low',
        'Non-urgent': 'low',
        'NON-URGENT': 'low',
        'nonurgent': 'low',
        'Nonurgent': 'low',
        'NONURGENT': 'low',
        'not urgent': 'low',
        'Not urgent': 'low',
        'NOT URGENT': 'low',
        'not-urgent': 'low',
        'Not-urgent': 'low',
        'NOT-URGENT': 'low'
      };

      let updatedCount = 0;
      let skippedCount = 0;

      // Update each urgency value
      for (const [oldValue, newValue] of Object.entries(urgencyMapping)) {
        if (oldValue !== newValue) {
          const result = await db.collection('referrals').updateMany(
            { 'serviceDetails.urgency': oldValue },
            { $set: { 'serviceDetails.urgency': newValue } }
          );
          updatedCount += result.modifiedCount;
        }
      }

      // Set default for null/undefined values
      const nullResult = await db.collection('referrals').updateMany(
        { 
          $or: [
            { 'serviceDetails.urgency': null },
            { 'serviceDetails.urgency': { $exists: false } },
            { 'serviceDetails.urgency': '' }
          ]
        },
        { $set: { 'serviceDetails.urgency': 'medium' } }
      );
      updatedCount += nullResult.modifiedCount;

      // Get final analysis
      const finalAnalysis = await db.collection('referrals').aggregate([
        {
          $group: {
            _id: '$serviceDetails.urgency',
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
        message: 'Urgency values standardized successfully'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error standardizing urgency values:', error);
    return NextResponse.json({ error: 'Failed to standardize urgency values' }, { status: 500 });
  }
} 