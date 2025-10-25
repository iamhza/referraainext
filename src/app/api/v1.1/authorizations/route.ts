/**
 * V1.1 Authorizations API
 * 
 * Manages service funding authorizations with lifecycle:
 * DRAFT → SUBMITTED → APPROVED/DENIED → EXPIRED
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

type AuthorizationStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'DENIED' | 'EXPIRED';
type UnitType = 'HOURS_PER_WEEK' | 'HOURS_PER_MONTH' | 'VISITS_PER_WEEK' | 'VISITS_PER_MONTH' | 'DAYS';

// GET /api/v1.1/authorizations - List authorizations
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const serviceRelationshipId = searchParams.get('serviceRelationshipId');
    const status = searchParams.get('status');

    const client = await clientPromise;
    const db = client.db('referradb');

    // Build query
    const query: any = {
      organizationId: user.organizationId
    };

    if (clientId) {
      query.clientId = clientId;
    }

    if (serviceRelationshipId) {
      query.serviceRelationshipId = serviceRelationshipId;
    }

    if (status) {
      query.status = status;
    }

    const authorizations = await db.collection('authorizations')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      authorizations: authorizations.map(auth => ({
        ...auth,
        _id: auth._id.toString()
      })),
      count: authorizations.length
    });
  } catch (error) {
    console.error('Error fetching authorizations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/v1.1/authorizations - Create authorization
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only case managers and admins can create authorizations
    if (user.role !== 'CASE_MANAGER' && user.role !== 'SUPERVISOR' && user.role !== 'ORG_ADMIN' && user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.clientId || !data.serviceRelationshipId) {
      return NextResponse.json({ 
        error: 'Missing required fields: clientId, serviceRelationshipId' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Verify service relationship exists and belongs to organization
    const serviceRelationship = await db.collection('service_relationships').findOne({
      _id: new ObjectId(data.serviceRelationshipId)
    });

    if (!serviceRelationship) {
      return NextResponse.json({ error: 'Service relationship not found' }, { status: 404 });
    }

    if (serviceRelationship.organizationId !== user.organizationId && user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get org_member for creator
    const orgMember = await db.collection('org_members').findOne({
      userId: user.id,
      organizationId: user.organizationId
    });

    // Create authorization
    const authorization = {
      organizationId: user.organizationId,
      clientId: data.clientId,
      serviceRelationshipId: data.serviceRelationshipId,
      
      status: (data.status || 'DRAFT') as AuthorizationStatus,
      
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      units: data.units || null,
      unitType: (data.unitType || 'HOURS_PER_WEEK') as UnitType,
      approvalNumber: data.approvalNumber || null,
      
      submittedAt: data.status === 'SUBMITTED' ? new Date() : null,
      submittedBy: data.status === 'SUBMITTED' ? orgMember?._id.toString() : null,
      approvalDate: null,
      approvedBy: null,
      
      createdBy: orgMember?._id.toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('authorizations').insertOne(authorization);

    console.log('✅ Created authorization:', result.insertedId);

    return NextResponse.json({
      success: true,
      authorizationId: result.insertedId.toString()
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating authorization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

