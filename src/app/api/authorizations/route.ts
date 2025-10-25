import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * POST /api/authorizations
 * Create a new authorization
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Get user's organization
    const orgMember = await db.collection('org_members').findOne({ userId: user.id });
    if (!orgMember || !orgMember.organizationId) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 403 });
    }
    
    const organizationId = orgMember.organizationId.toString();
    
    // Parse request body
    const body = await request.json();
    const { serviceRelationshipId, status, startDate, endDate, units, unitType } = body;
    
    // Validate required fields
    if (!serviceRelationshipId || !startDate || !endDate || !units || !unitType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Verify service relationship belongs to this org and case manager
    const serviceRel = await db.collection('service_relationships').findOne({
      _id: new ObjectId(serviceRelationshipId),
      organizationId: organizationId,
      caseManagerId: user.id,
    });
    
    if (!serviceRel) {
      return NextResponse.json(
        { error: 'Service relationship not found' },
        { status: 404 }
      );
    }
    
    // Create authorization
    const authorization = {
      _id: new ObjectId(),
      organizationId: organizationId,
      clientId: serviceRel.clientId,
      serviceRelationshipId: serviceRelationshipId,
      status: status || 'DRAFT',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      units: parseInt(units),
      unitType: unitType,
      ...(status === 'SUBMITTED' && { submittedAt: new Date() }),
      createdByMemberId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.collection('authorizations').insertOne(authorization);
    
    return NextResponse.json({
      authorization: {
        ...authorization,
        _id: authorization._id.toString(),
      },
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating authorization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/authorizations
 * List all authorizations for case manager
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Get user's organization
    const orgMember = await db.collection('org_members').findOne({ userId: user.id });
    if (!orgMember || !orgMember.organizationId) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 403 });
    }
    
    const organizationId = orgMember.organizationId.toString();
    
    // Get all authorizations for this org's service relationships
    const authorizations = await db
      .collection('authorizations')
      .find({ organizationId: organizationId })
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json({
      authorizations: authorizations.map(auth => ({
        ...auth,
        _id: auth._id.toString(),
      })),
    });
    
  } catch (error) {
    console.error('Error fetching authorizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

