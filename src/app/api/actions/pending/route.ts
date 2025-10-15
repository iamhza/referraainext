import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('referra-local-dev');

    // Get user's organization
    const user = await db.collection('users').findOne({
      email: session.user.email
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Fetch all pending actions for the user's organization
    // For case managers: show actions they created or are assigned to them
    // For providers: show actions for their provider account
    const actions = await db.collection('actions')
      .aggregate([
        {
          $match: {
            status: 'pending',
            $or: [
              { createdBy: session.user.id },
              { 'routing.recipientIds': session.user.id }
            ]
          }
        },
        // Lookup client info to get client name
        {
          $lookup: {
            from: 'clients',
            localField: 'clientId',
            foreignField: '_id',
            as: 'client'
          }
        },
        {
          $unwind: {
            path: '$client',
            preserveNullAndEmptyArrays: true
          }
        },
        // Add client name to action
        {
          $addFields: {
            clientName: {
              $concat: [
                { $ifNull: ['$client.firstName', ''] },
                ' ',
                { $ifNull: ['$client.lastName', ''] }
              ]
            }
          }
        },
        // Sort by urgency and target date
        {
          $sort: {
            urgency: -1, // issue > urgent > normal
            targetDate: 1 // earliest first
          }
        },
        // Project only needed fields
        {
          $project: {
            client: 0 // Remove full client object
          }
        }
      ])
      .toArray();

    // Convert ObjectIds to strings for JSON serialization
    const serializedActions = actions.map(action => ({
      ...action,
      _id: action._id.toString(),
      clientId: action.clientId?.toString() || action.clientId,
      createdAt: action.createdAt?.toISOString?.() || action.createdAt,
      updatedAt: action.updatedAt?.toISOString?.() || action.updatedAt,
      targetDate: action.targetDate?.toISOString?.() || action.targetDate,
      scheduledDate: action.scheduledDate?.toISOString?.() || action.scheduledDate,
      completedAt: action.completedAt?.toISOString?.() || action.completedAt
    }));

    return NextResponse.json({ 
      actions: serializedActions,
      count: serializedActions.length
    });

  } catch (error) {
    console.error('Error fetching pending actions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending actions' },
      { status: 500 }
    );
  }
}

