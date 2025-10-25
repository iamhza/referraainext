import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * POST /api/issues
 * Create a new issue
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { serviceRelationshipId, clientId, type, initialComment, sourceMessageId } = body;

    if (!serviceRelationshipId || !clientId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: serviceRelationshipId, clientId, type' },
        { status: 400 }
      );
    }

    if (!initialComment || !initialComment.trim()) {
      return NextResponse.json(
        { error: 'Initial comment is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Get user's member record
    const member = await db.collection('org_members').findOne({
      userId: user.id,
      isActive: true,
    });

    if (!member) {
      return NextResponse.json({ error: 'User not found in organization' }, { status: 404 });
    }

    // Create new issue with initial comment
    const now = new Date();
    const commentId = new ObjectId().toString();  // ✅ String for schema validation
    
    const newIssue = {
      organizationId: member.organizationId,
      serviceRelationshipId,
      clientId,
      type,
      status: 'OPEN' as const,
      comments: [{
        _id: commentId,
        content: initialComment.trim(),
        createdByMemberId: member._id.toString(),
        createdAt: now,
      }],
      relatedTaskIds: [],
      sourceMessageId: sourceMessageId || undefined, // Bidirectional link
      relatedMessageIds: sourceMessageId ? [sourceMessageId] : [],
      createdByMemberId: member._id.toString(),
      createdAt: now,
    };

    const result = await db.collection('issues').insertOne(newIssue);
    const newIssueId = result.insertedId.toString();

    // If this issue was created from a message, update the message with bidirectional link
    if (sourceMessageId) {
      try {
        await db.collection('service_messages').updateOne(
          { _id: new ObjectId(sourceMessageId) },
          {
            $set: {
              linkedIssueId: newIssueId,
              isIssueTrigger: true,
            }
          }
        );
      } catch (msgError) {
        console.error('Error linking message to issue:', msgError);
        // Don't fail the issue creation if message link fails
      }
    }

    return NextResponse.json({
      success: true,
      issueId: newIssueId,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating issue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

