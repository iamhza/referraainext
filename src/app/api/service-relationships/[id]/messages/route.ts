import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb/client';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import { ObjectId } from 'mongodb';

const DB_NAME = 'referradb';

/**
 * GET /api/service-relationships/[id]/messages
 * Fetch all messages for a service relationship
 * HIPAA-compliant with organization isolation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const serviceRelationshipId = params.id;
    
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const organizationId = user.organizationId;

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // Verify user has access to this service relationship
    const serviceRel = await db.collection('service_relationships').findOne({
      _id: new ObjectId(serviceRelationshipId),
      organizationId,
    });

    if (!serviceRel) {
      return NextResponse.json(
        { error: 'Service relationship not found or access denied' },
        { status: 404 }
      );
    }

    // TODO: Additional access control - verify case manager or provider user

    // Fetch messages with sender details
    const messages = await db.collection('service_messages').aggregate([
      {
        $match: {
          organizationId,
          serviceRelationshipId,
        }
      },
      { $sort: { createdAt: 1 } }, // Chronological order
      
      // Lookup sender details from org_members
      {
        $lookup: {
          from: 'org_members',
          localField: 'senderMemberId',
          foreignField: '_id',
          as: 'senderMember',
        }
      },
      { $unwind: { path: '$senderMember', preserveNullAndEmptyArrays: true } },
      
      // Lookup user details
      {
        $lookup: {
          from: 'users',
          localField: 'senderMember.userId',
          foreignField: '_id',
          as: 'senderUser',
        }
      },
      { $unwind: { path: '$senderUser', preserveNullAndEmptyArrays: true } },
      
      // Lookup linked issue if exists
      {
        $lookup: {
          from: 'issues',
          let: { linkedIssueId: { $toObjectId: '$linkedIssueId' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$linkedIssueId'] } } },
            { $project: { _id: 1, type: 1, status: 1, createdAt: 1 } }
          ],
          as: 'linkedIssue',
        }
      },
      { $unwind: { path: '$linkedIssue', preserveNullAndEmptyArrays: true } },
      
      // Project fields
      {
        $project: {
          _id: { $toString: '$_id' },
          organizationId: 1,
          serviceRelationshipId: 1,
          clientId: 1,
          content: 1,
          senderMemberId: 1,
          senderType: 1,
          senderName: { $ifNull: ['$senderUser.name', 'Unknown User'] },
          senderEmail: '$senderUser.email',
          linkedIssueId: 1,
          isIssueTrigger: 1,
          linkedIssue: 1,
          readAt: 1,
          readByMemberId: 1,
          createdAt: 1,
        }
      }
    ]).toArray();

    return NextResponse.json({
      success: true,
      messages,
      count: messages.length,
    });

  } catch (error) {
    console.error('Error fetching service messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/service-relationships/[id]/messages
 * Create a new message in the service thread
 * HIPAA-compliant with audit logging
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const serviceRelationshipId = params.id;
    
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = user.organizationId;

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // Get user's member record
    const member = await db.collection('org_members').findOne({
      userId: user.id,
      organizationId,
      isActive: true,
    });

    if (!member) {
      return NextResponse.json({ error: 'User not found in organization' }, { status: 403 });
    }

    const memberId = member._id.toString();

    // Verify service relationship exists and user has access
    const serviceRel = await db.collection('service_relationships').findOne({
      _id: new ObjectId(serviceRelationshipId),
      organizationId,
    });

    if (!serviceRel) {
      return NextResponse.json(
        { error: 'Service relationship not found or access denied' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { content, linkedIssueId } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Determine sender type
    const senderType = user.role === 'PROVIDER_USER' ? 'PROVIDER_USER' : 'CASE_MANAGER';

    // Create message
    const message = {
      organizationId,
      serviceRelationshipId,
      clientId: serviceRel.clientId,
      content: content.trim(),
      senderMemberId: memberId,
      senderType,
      linkedIssueId: linkedIssueId || undefined,
      isIssueTrigger: false,
      createdAt: new Date(),
    };

    const result = await db.collection('service_messages').insertOne(message);

    // Audit log for PHI access
    await db.collection('audit_log').insertOne({
      organizationId,
      actorMemberId: memberId,
      eventType: 'MESSAGE_SENT',
      subjectType: 'SERVICE_RELATIONSHIP',
      subjectId: serviceRelationshipId,
      at: new Date(),
      details: {
        clientId: serviceRel.clientId,
        messageId: result.insertedId.toString(),
      }
    });

    return NextResponse.json({
      success: true,
      message: {
        _id: result.insertedId.toString(),
        ...message,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating service message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

