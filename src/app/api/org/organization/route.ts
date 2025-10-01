/**
 * Organization details API
 * Handles fetching organization information
 */

import { NextRequest, NextResponse } from 'next/server';
import { withOrgAuth } from '@/lib/api-auth';
import clientPromise from '@/lib/mongodb';

// GET /api/org/organization - Get current user's organization details
export const GET = withOrgAuth(async (user, request: NextRequest) => {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');

    // Get organization details
    const organization = await db.collection('organizations').findOne({
      _id: user.orgContext.orgId
    });

    if (!organization) {
      // If no organization found, return basic info from user context
      return NextResponse.json({ 
        success: true,
        organization: {
          id: user.orgContext.orgId,
          name: user.orgContext.organization?.name || 'Your Organization',
          domain: null,
          createdAt: new Date(),
          settings: {}
        }
      });
    }

    return NextResponse.json({ 
      success: true,
      organization: {
        id: organization._id,
        name: organization.name,
        domain: organization.domain,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
        settings: organization.settings || {},
        userCount: organization.userCount || 0,
        description: organization.description || ''
      }
    });

  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' }, 
      { status: 500 }
    );
  }
});

// PUT /api/org/organization - Update organization details
export const PUT = withOrgAuth(async (user, request: NextRequest) => {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    const updates = await request.json();

    // Validate required fields
    if (updates.name && !updates.name.trim()) {
      return NextResponse.json(
        { error: 'Organization name cannot be empty' }, 
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData = {
      ...updates,
      updatedAt: new Date(),
      updatedBy: user.id
    };

    // Remove fields that shouldn't be updated via this endpoint
    delete updateData.id;
    delete updateData._id;
    delete updateData.createdAt;

    // Update organization
    const result = await db.collection('organizations').updateOne(
      { _id: user.orgContext.orgId },
      { 
        $set: updateData,
        $setOnInsert: { 
          createdAt: new Date(),
          _id: user.orgContext.orgId
        }
      },
      { upsert: true }
    );

    if (result.matchedCount === 0 && result.upsertedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update organization' }, 
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Organization updated successfully',
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount
    });

  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json(
      { error: 'Failed to update organization' }, 
      { status: 500 }
    );
  }
});
