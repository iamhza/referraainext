import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';

/**
 * GET /api/issues/[id]
 * Fetch a single issue with all comments and task details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

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

    // Fetch issue with full details
    const issues = await db.collection('issues').aggregate([
      {
        $match: {
          _id: new ObjectId(id),
          organizationId: member.organizationId,
        },
      },
      
      // Join with service_relationships
      {
        $lookup: {
          from: 'service_relationships',
          let: { srId: { $toObjectId: '$serviceRelationshipId' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$srId'] } } }
          ],
          as: 'serviceRelationship',
        },
      },
      { $unwind: { path: '$serviceRelationship', preserveNullAndEmptyArrays: true } },
      
      // Join with clients
      {
        $lookup: {
          from: 'clients',
          let: { clientIdStr: '$clientId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: [{ $toString: '$_id' }, '$$clientIdStr'] }
              }
            }
          ],
          as: 'client',
        },
      },
      { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
      
      // Join with providers (convert string ID to ObjectId)
      {
        $lookup: {
          from: 'providers',
          let: { providerId: { $toObjectId: '$serviceRelationship.providerId' } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$providerId'] }
              }
            }
          ],
          as: 'provider',
        },
      },
      { $unwind: { path: '$provider', preserveNullAndEmptyArrays: true } },
      
      // Join with services (convert string ID to ObjectId)
      {
        $lookup: {
          from: 'services',
          let: { serviceId: { $toObjectId: '$serviceRelationship.serviceId' } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$serviceId'] }
              }
            }
          ],
          as: 'service',
        },
      },
      { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
      
      // Join with tasks
      {
        $lookup: {
          from: 'tasks',
          let: { issueIdStr: { $toString: '$_id' } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$issueId', '$$issueIdStr'] }
              }
            }
          ],
          as: 'tasks',
        },
      },
      
      // Project final shape
      {
        $project: {
          _id: { $toString: '$_id' },
          organizationId: 1,
          serviceRelationshipId: { $toString: '$serviceRelationshipId' },
          clientId: { $toString: '$clientId' },
          type: 1,
          status: 1,
          comments: 1,
          relatedTaskIds: 1,
          createdByMemberId: 1,
          createdAt: 1,
          resolvedByMemberId: 1,
          resolvedAt: 1,
          
          // Client details
          client: {
            _id: { $toString: '$client._id' },
            firstName: '$client.identity.firstName',
            lastName: '$client.identity.lastName',
            email: '$client.contact.email',
          },
          
          // Provider details (with fallback to denormalized name)
          provider: {
            _id: { $toString: '$provider._id' },
            name: { 
              $ifNull: [
                '$provider.legalName', 
                { $ifNull: ['$serviceRelationship.providerName', 'Unknown Provider'] }
              ] 
            },
            email: '$provider.contacts.email',
            phone: '$provider.contacts.phone',
          },
          
          // Service details (with fallback to denormalized name or serviceType)
          service: {
            _id: { $toString: '$service._id' },
            name: { 
              $ifNull: [
                '$service.name', 
                { $ifNull: ['$serviceRelationship.serviceName', '$serviceRelationship.serviceType'] }
              ] 
            },
            category: { $ifNull: ['$service.category', 'Uncategorized'] },
          },
          
          // Service relationship details
          serviceRelationship: {
            _id: { $toString: '$serviceRelationship._id' },
            status: '$serviceRelationship.status',
            startDate: '$serviceRelationship.startDate',
            endDate: '$serviceRelationship.endDate',
          },
          
          // Linked tasks
          tasks: {
            $map: {
              input: '$tasks',
              as: 'task',
              in: {
                _id: { $toString: '$$task._id' },
                title: '$$task.title',
                status: '$$task.status',
                dueDate: '$$task.dueDate',
              }
            }
          },
        },
      },
    ]).toArray();

    if (issues.length === 0) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    const issue = issues[0];

    // Organize comments into threaded structure
    const commentsMap = new Map();
    const rootComments: any[] = [];

    // First pass: Create a map of all comments
    issue.comments.forEach((comment: any) => {
      commentsMap.set(comment._id, { ...comment, replies: [] });
    });

    // Second pass: Build the tree structure
    issue.comments.forEach((comment: any) => {
      const commentWithReplies = commentsMap.get(comment._id);
      if (comment.parentCommentId) {
        const parent = commentsMap.get(comment.parentCommentId);
        if (parent) {
          parent.replies.push(commentWithReplies);
        } else {
          // Parent not found, treat as root
          rootComments.push(commentWithReplies);
        }
      } else {
        // No parent, it's a root comment
        rootComments.push(commentWithReplies);
      }
    });

    // Replace flat comments with threaded structure
    issue.comments = rootComments;

    return NextResponse.json({
      success: true,
      issue,
    });

  } catch (error) {
    console.error('Error fetching issue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/issues/[id]
 * Update issue status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
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

    // Build update doc
    const updateDoc: any = {
      status,
    };

    // If resolving, record who and when
    if (status === 'RESOLVED') {
      updateDoc.resolvedByMemberId = member._id.toString();
      updateDoc.resolvedAt = new Date();
    }

    // Update issue
    const result = await db.collection('issues').updateOne(
      {
        _id: new ObjectId(id),
        organizationId: member.organizationId,
      },
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating issue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

