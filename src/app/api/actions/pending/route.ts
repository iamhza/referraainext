import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb/client';
import { getAuthenticatedUser } from '@/lib/auth/helpers';

export async function GET() {
  try {
    const authUser = await getAuthenticatedUser();
    
    console.log('🔐 Auth user:', authUser ? authUser.email : 'null');
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Get user's full document
    const user = await db.collection('users').findOne({
      email: authUser.email
    });
    
    console.log('👤 Found user:', user ? user.email : 'not found');

    if (!user) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }
    
    if (!user?.organizationId && !user?.org_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    
    const userId = user._id.toString();

    // Fetch all pending actions for the user's organization
    // For case managers: show actions they created or are assigned to them
    // For providers: show actions for their provider account
    
    console.log('🔍 Querying actions for user ID:', userId);
    
    // Get user's org membership to find their memberId
    const orgMember = await db.collection('org_members').findOne({
      userId: userId,
      organizationId: user.organizationId || user.org_id,
      isActive: true
    });
    
    if (!orgMember) {
      return NextResponse.json({ error: 'Organization membership not found' }, { status: 404 });
    }
    
    const memberId = orgMember._id.toString();
    console.log('🎫 Member ID:', memberId);

    const actions = await db.collection('actions')
      .aggregate([
        {
          $match: {
            organizationId: user.organizationId || user.org_id,
            status: 'OPEN', // v1.1 uses OPEN instead of pending
            createdByMemberId: memberId // v1.1 uses memberId
          }
        },
        // Convert clientId string to ObjectId for lookup
        {
          $addFields: {
            clientObjectId: { $toObjectId: '$clientId' }
          }
        },
        // Lookup client info to get client name
        {
          $lookup: {
            from: 'clients',
            localField: 'clientObjectId',
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
        // Lookup user who created the action to get their current name
        {
          $lookup: {
            from: 'users',
            let: { creatorId: '$createdBy' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: [{ $toString: '$_id' }, '$$creatorId'] },
                      { $eq: ['$_id', '$$creatorId'] }
                    ]
                  }
                }
              }
            ],
            as: 'creator'
          }
        },
        {
          $unwind: {
            path: '$creator',
            preserveNullAndEmptyArrays: true
          }
        },
        // Add client name and dynamic creator name
        {
          $addFields: {
            clientName: {
              $concat: [
                { $ifNull: ['$client.firstName', { $ifNull: ['$client.encryptedPHI.firstName', ''] }] },
                ' ',
                { $ifNull: ['$client.lastName', { $ifNull: ['$client.encryptedPHI.lastName', ''] }] }
              ]
            },
            // Dynamically get creator's name from user document
            createdByName: {
              $ifNull: [
                '$creator.user_metadata.full_name',
                { $ifNull: [
                  '$creator.user_metadata.fullName',
                  { $ifNull: [
                    '$creator.user_metadata.name',
                    { $ifNull: [
                      '$creator.name',
                      '$creator.email'
                    ]}
                  ]}
                ]}
              ]
            }
          }
        },
        // Sort by priority and dueAt (v1.1 fields)
        {
          $sort: {
            priority: -1, // CRITICAL > HIGH > NORMAL
            dueAt: 1 // earliest first
          }
        },
        // Project only needed fields
        {
          $project: {
            client: 0, // Remove full client object
            creator: 0 // Remove full creator object
          }
        }
      ])
      .toArray();

    console.log('✅ Found', actions.length, 'pending actions');
    
    // Convert ObjectIds to strings for JSON serialization (v1.1 fields)
    const serializedActions = actions.map(action => ({
      ...action,
      _id: action._id.toString(),
      subjectId: action.subjectId?.toString() || action.subjectId,
      createdAt: action.createdAt?.toISOString?.() || action.createdAt,
      dueAt: action.dueAt?.toISOString?.() || action.dueAt,
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

