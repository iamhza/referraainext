import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * GET /api/tasks
 * Fetch all tasks for the current user (as owner or assignee)
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const memberId = member._id.toString();

    // Fetch all tasks where user is owner OR assignee
    const tasks = await db.collection('tasks').aggregate([
      {
        $match: {
          organizationId: member.organizationId,
          $or: [
            { ownerMemberId: memberId },
            { assigneeMemberId: memberId },
          ],
        },
      },
      
      // Join with client (if linked)
      {
        $lookup: {
          from: 'clients',
          let: { clientIdStr: '$clientId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $ne: ['$$clientIdStr', null] },
                    { $eq: [{ $toString: '$_id' }, '$$clientIdStr'] }
                  ]
                }
              }
            }
          ],
          as: 'client',
        },
      },
      { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
      
      // Join with owner member
      {
        $lookup: {
          from: 'org_members',
          let: { ownerIdStr: '$ownerMemberId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: [{ $toString: '$_id' }, '$$ownerIdStr'] }
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user',
              }
            },
            { $unwind: '$user' }
          ],
          as: 'owner',
        },
      },
      { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
      
      // Join with assignee member
      {
        $lookup: {
          from: 'org_members',
          let: { assigneeIdStr: '$assigneeMemberId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: [{ $toString: '$_id' }, '$$assigneeIdStr'] }
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user',
              }
            },
            { $unwind: '$user' }
          ],
          as: 'assignee',
        },
      },
      { $unwind: { path: '$assignee', preserveNullAndEmptyArrays: true } },
      
      // Project final shape
      {
        $project: {
          _id: { $toString: '$_id' },
          organizationId: 1,
          ownerMemberId: 1,
          assigneeMemberId: 1,
          title: 1,
          description: 1,
          status: 1,
          dueDate: 1,
          clientId: 1,
          serviceRelationshipId: 1,
          issueId: 1,
          createdAt: 1,
          completedAt: 1,
          completedByMemberId: 1,
          
          owner: {
            _id: { $toString: '$owner._id' },
            name: '$owner.user.name',
          },
          
          assignee: {
            _id: { $toString: '$assignee._id' },
            name: '$assignee.user.name',
          },
          
          client: {
            _id: { $toString: '$client._id' },
            firstName: '$client.identity.firstName',
            lastName: '$client.identity.lastName',
          },
        },
      },
      
      // Sort: TODO first, then by due date, then by created date
      {
        $addFields: {
          sortPriority: {
            $switch: {
              branches: [
                { case: { $eq: ['$status', 'TODO'] }, then: 1 },
                { case: { $eq: ['$status', 'IN_PROGRESS'] }, then: 2 },
                { case: { $eq: ['$status', 'DONE'] }, then: 3 },
                { case: { $eq: ['$status', 'CANCELLED'] }, then: 4 },
              ],
              default: 5
            }
          }
        }
      },
      {
        $sort: {
          sortPriority: 1,
          dueDate: 1,
          createdAt: -1,
        },
      },
      {
        $project: {
          sortPriority: 0,
        },
      },
    ]).toArray();

    return NextResponse.json({
      success: true,
      tasks,
    });

  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 * Create a new task
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, assigneeMemberId, dueDate, clientId, serviceRelationshipId, issueId } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      );
    }

    if (!assigneeMemberId) {
      return NextResponse.json(
        { error: 'Assignee is required' },
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

    // Create new task
    const newTask = {
      organizationId: member.organizationId,
      ownerMemberId: member._id.toString(),
      assigneeMemberId,
      title: title.trim(),
      description: description?.trim() || null,
      status: 'TODO',
      dueDate: dueDate ? new Date(dueDate) : null,
      clientId: clientId || null,
      serviceRelationshipId: serviceRelationshipId || null,
      issueId: issueId || null,
      createdAt: new Date(),
    };

    const result = await db.collection('tasks').insertOne(newTask);

    // If linked to an issue, update the issue's relatedTaskIds
    if (issueId) {
      await db.collection('issues').updateOne(
        { _id: new ObjectId(issueId) },
        { $addToSet: { relatedTaskIds: result.insertedId.toString() } }
      );
    }

    return NextResponse.json({
      success: true,
      taskId: result.insertedId.toString(),
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

