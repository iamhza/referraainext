/**
 * Organization-scoped referrals API
 * Handles referral data with proper multi-tenant isolation
 */

import { NextRequest, NextResponse } from 'next/server';
import { withOrgAuth } from '@/lib/auth/api-auth';
import { getOrgReferrals, getOrgFilter } from '@/lib/organizations/utils';
import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';

export const GET = withOrgAuth(async (user, request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const clientId = searchParams.get('clientId');
  const status = searchParams.get('status');

  try {
    const client = await clientPromise;
    const db = client.db('referradb');

    // Single referral request
    if (id) {
      const objectId = new ObjectId(id);
      const orgFilter = getOrgFilter(user.orgContext.orgId);
      
      const referral = await db.collection('referrals').findOne({
        _id: objectId,
        ...orgFilter
      });

      if (!referral) {
        return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
      }

      return NextResponse.json({ referral });
    }

    // Build query with organization filter
    let query = getOrgFilter(user.orgContext.orgId);

    // Add client filter if specified
    if (clientId) {
      query['$or'] = [
        { 'clientInfo._id': clientId },
        { 'clientInfo.clientId': clientId },
        { 'clientId': clientId }
      ];
    }

    // Add status filter if specified
    if (status && status !== 'all') {
      if (status === 'active') {
        query.status = { $in: ['accepted', 'in_progress', 'active', 'pending'] };
      } else {
        query.status = status;
      }
    }

    // Role-based filtering
    if (user.orgContext.role === 'case_manager') {
      // Case managers only see their own referrals
      query.caseManagerId = user.id;
    } else if (user.orgContext.role === 'supervisor') {
      // Supervisors see referrals from their team
      if (user.orgContext.teamId) {
        // Get team members and include their referrals
        const teamMembers = await db.collection('user_profiles')
          .find({ team_id: user.orgContext.teamId })
          .toArray();
        
        const teamMemberIds = teamMembers.map(member => member.id);
        query.caseManagerId = { $in: teamMemberIds };
      }
    }
    // org_admin and admin see all org referrals (no additional filter needed)

    const referrals = await db.collection('referrals')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ 
      referrals,
      total: referrals.length,
      organization: user.orgContext.orgId
    });

  } catch (error) {
    console.error('Error fetching organization referrals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referrals' }, 
      { status: 500 }
    );
  }
});

export const POST = withOrgAuth(async (user, request: NextRequest) => {
  try {
    const data = await request.json();
    const client = await clientPromise;
    const db = client.db('referradb');

    // Validate that user can create referrals
    if (!['case_manager', 'org_admin', 'platform_admin'].includes(user.orgContext.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create referrals' }, 
        { status: 403 }
      );
    }

    const now = new Date();

    // Handle client creation/update if needed
    let clientId;
    if (data.clientInfo?._id) {
      // Verify client belongs to the organization
      const existingClient = await db.collection('clients').findOne({
        _id: new ObjectId(data.clientInfo._id),
        orgId: user.orgContext.orgId
      });

      if (existingClient) {
        clientId = data.clientInfo._id;
      } else {
        return NextResponse.json(
          { error: 'Client not found in organization' }, 
          { status: 404 }
        );
      }
    } else {
      // Create new client with organization context
      const clientData = {
        ...data.clientInfo,
        orgId: user.orgContext.orgId,
        caseManagerId: user.id,
        createdBy: user.id,
        createdAt: now,
        updatedAt: now,
        source: 'created_from_referral'
      };

      const clientResult = await db.collection('clients').insertOne(clientData);
      clientId = clientResult.insertedId;
    }

    // Create referral with organization context
    const referralData = {
      ...data,
      clientInfo: {
        ...data.clientInfo,
        _id: clientId.toString()
      },
      orgId: user.orgContext.orgId,
      caseManagerId: user.id,
      caseManager: {
        id: user.id,
        name: user.orgContext.fullName || user.email,
        email: user.email
      },
      status: 'submitted',
      createdAt: now,
      updatedAt: now,
      progressPercentage: 0
    };

    const result = await db.collection('referrals').insertOne(referralData);

    return NextResponse.json({
      success: true,
      referralId: result.insertedId,
      clientId: clientId,
      message: 'Referral created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating referral:', error);
    return NextResponse.json(
      { error: 'Failed to create referral' }, 
      { status: 500 }
    );
  }
});
