import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';
import type { Action, ActionType } from '@/types/actions';
import { getSecureActionComments } from '@/lib/services/action-comments';

// GET /api/clients/[clientId]/actions - Fetch all actions for a client
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: clientId } = params;
    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Verify client exists and user has access
    const clientDoc = await db.collection('clients').findOne({
      _id: new ObjectId(clientId),
      // Add organization/access checks here if needed
    });

    if (!clientDoc) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Fetch actions for this client with dynamic creator name lookup
    // Support both v1.1 (subjectType/subjectId) and legacy (clientId) data models
    const actions = await db.collection('actions')
      .aggregate([
        {
          $match: {
            $or: [
              { clientId }, // Legacy: direct client match
              { subjectType: 'SERVICE_RELATIONSHIP' }, // v1.1: match service relationships (we'll filter by client later)
              { subjectType: 'REFERRAL' } // v1.1: match referrals
            ]
          }
        },
        // For v1.1 actions, lookup the service_relationship to get clientId
        {
          $lookup: {
            from: 'service_relationships',
            let: { subjectId: '$subjectId', subjectType: '$subjectType' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$$subjectType', 'SERVICE_RELATIONSHIP'] },
                      { $eq: [{ $toString: '$_id' }, '$$subjectId'] }
                    ]
                  }
                }
              }
            ],
            as: 'serviceRelationship'
          }
        },
        {
          $unwind: {
            path: '$serviceRelationship',
            preserveNullAndEmptyArrays: true
          }
        },
        // Filter to only actions for this client
        {
          $match: {
            $or: [
              { clientId }, // Legacy direct match
              { 'serviceRelationship.clientId': clientId } // v1.1 via service relationship
            ]
          }
        },
        // Lookup user who created the action
        // v1.1 uses createdByMemberId (org_members), legacy uses createdBy (users)
        {
          $lookup: {
            from: 'org_members',
            let: { memberId: '$createdByMemberId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: [{ $toString: '$_id' }, '$$memberId'] },
                      { $eq: ['$_id', '$$memberId'] }
                    ]
                  }
                }
              },
              // Join with users to get name
              {
                $lookup: {
                  from: 'users',
                  localField: 'userId',
                  foreignField: '_id',
                  as: 'user'
                }
              },
              {
                $unwind: {
                  path: '$user',
                  preserveNullAndEmptyArrays: true
                }
              }
            ],
            as: 'memberInfo'
          }
        },
        {
          $unwind: {
            path: '$memberInfo',
            preserveNullAndEmptyArrays: true
          }
        },
        // Also lookup legacy createdBy field
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
        // Dynamically set createdByName from user document
        // v1.1 uses memberInfo.user, legacy uses creator
        {
          $addFields: {
            createdByName: {
              $ifNull: [
                '$memberInfo.user.name', // v1.1 from org_members -> users
                { $ifNull: [
                  '$memberInfo.user.user_metadata.full_name',
                  { $ifNull: [
                    '$memberInfo.user.email',
                    { $ifNull: [
                      '$creator.user_metadata.full_name', // Legacy from users
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
                    ]}
                  ]}
                ]}
              ]
            }
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $project: {
            creator: 0, // Remove full creator object
            serviceRelationship: 0, // Remove lookup data
            memberInfo: 0 // Remove v1.1 member info
          }
        }
      ])
      .toArray();

    console.log(`✅ Found ${actions.length} actions for client ${clientId}`);
    if (actions.length > 0) {
      console.log('📋 Sample action:', {
        id: actions[0]._id,
        type: actions[0].type,
        subjectType: actions[0].subjectType,
        subjectId: actions[0].subjectId,
        contextId: actions[0].contextId,
        status: actions[0].status,
        createdByName: actions[0].createdByName
      });
    }

    // Attach secure comments to each action
    const actionsWithComments = await Promise.all(
      actions.map(async (action) => {
        try {
          const secureComments = await getSecureActionComments(action._id.toString(), user.id, user.role);
          return {
            ...action,
            comments: secureComments
          };
        } catch (error) {
          console.error(`Error fetching comments for action ${action._id}:`, error);
          return {
            ...action,
            comments: []
          };
        }
      })
    );

    return NextResponse.json({ actions: actionsWithComments });
  } catch (error) {
    console.error('Error fetching actions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch actions' },
      { status: 500 }
    );
  }
}

// POST /api/clients/[clientId]/actions - Create a new action
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: clientId } = params;
    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Check if request is FormData (for file uploads) or JSON
    const contentType = request.headers.get('content-type');
    let body: any;
    let hasFiles = false;
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData for file uploads
      const formData = await request.formData();
      body = {};
      const files: File[] = [];
      
      // Extract form data
      for (const [key, value] of formData.entries()) {
        if (key === 'files') {
          files.push(value as File);
          hasFiles = true;
        } else if (key.startsWith('data.')) {
          const dataKey = key.replace('data.', '');
          if (!body.data) body.data = {};
          body.data[dataKey] = value;
        } else {
          body[key] = value;
        }
      }
      
      if (hasFiles) {
        body.files = files;
      }
    } else {
      // Handle JSON
      body = await request.json();
    }
    
    const {
      type,
      title,
      description,
      notes,
      urgency = 'normal',
      requiresROI = false,
      data = {},
      targetDate,
      scheduledDate,
      // Context fields
      contextType = 'general',
      contextId,
      providerId,
      serviceType,
      files
    } = body;

    if (!type || !title) {
      return NextResponse.json(
        { error: 'Action type and title are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Verify client exists
    const clientDoc = await db.collection('clients').findOne({
      _id: new ObjectId(clientId),
    });

    if (!clientDoc) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Create the action
    const now = new Date().toISOString();
    const action: Omit<Action, '_id'> = {
      clientId,
      // Context Information
      contextType: contextType as 'referral' | 'connection' | 'general',
      contextId,
      providerId,
      serviceType,
      // Action Details
      type: type as ActionType,
      title,
      description,
      notes,
      status: 'pending',
      urgency,
      createdBy: user.id,
      createdByRole: user.role as 'case_manager' | 'provider',
      createdByName: '', // Will be dynamically looked up from users collection
      createdAt: now,
      updatedAt: now,
      targetDate,
      scheduledDate,
      data,
      requiresROI,
      roiApproved: false,
      attachments: [],
      comments: [],
      // Routing Information
      routing: {
        primaryRecipient: providerId ? 'provider' : 'case_manager',
        recipientIds: providerId ? [providerId, user.id] : [user.id]
      }
    };

    const result = await db.collection('actions').insertOne(action);
    const createdAction = { ...action, _id: result.insertedId };

    // Handle file attachments if present
    if (hasFiles && files && files.length > 0) {
      const attachments = [];
      
      for (const file of files) {
        // For now, we'll store file metadata
        // In a full implementation, you'd upload to GridFS or cloud storage
        const attachment = {
          _id: new ObjectId().toString(),
          filename: `${Date.now()}_${file.name}`,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          uploadedAt: now,
          uploadedBy: user.id
        };
        
        attachments.push(attachment);
      }
      
      // Update action with attachments
      await db.collection('actions').updateOne(
        { _id: result.insertedId },
        { $set: { attachments } }
      );
      
      createdAction.attachments = attachments;
    }

    // Create timeline entry
    await db.collection('timeline_events').insertOne({
      clientId,
      contextType,
      contextId,
      providerId,
      type: 'action_created',
      description: `${title} action created`,
      createdBy: user.id,
      createdByName: user.email,
      createdByRole: user.role,
      createdAt: now,
      metadata: {
        actionId: result.insertedId,
        actionType: type,
        actionTitle: title,
        contextType,
        contextId,
        serviceType,
        hasAttachments: hasFiles && files && files.length > 0,
        attachmentCount: hasFiles && files ? files.length : 0
      }
    });

    return NextResponse.json({ action: createdAction }, { status: 201 });
  } catch (error) {
    console.error('Error creating action:', error);
    return NextResponse.json(
      { error: 'Failed to create action' },
      { status: 500 }
    );
  }
}
