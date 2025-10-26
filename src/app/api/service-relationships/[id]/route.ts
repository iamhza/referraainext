import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';

/**
 * GET /api/service-relationships/[id]
 * Fetch detailed information for a single service relationship
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

    const { id: serviceRelationshipId } = params;
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

    // Fetch service relationship with populated fields
    const serviceRel = await db.collection('service_relationships').aggregate([
      {
        $match: {
          _id: new ObjectId(serviceRelationshipId),
          organizationId: member.organizationId, // Tenant isolation
        }
      },
      // Join with clients
      {
        $lookup: {
          from: 'clients',
          let: { clientId: { $toObjectId: '$clientId' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$clientId'] } } },
            { $project: { 
              firstName: '$identity.firstName', 
              lastName: '$identity.lastName',
              _id: 1
            }}
          ],
          as: 'client'
        }
      },
      { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
      
      // Join with providers
      {
        $lookup: {
          from: 'providers',
          let: { providerId: { $toObjectId: '$providerId' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$providerId'] } } },
            { $project: { 
              legalName: 1,
              contacts: 1,
              _id: 1
            }}
          ],
          as: 'provider'
        }
      },
      { $unwind: { path: '$provider', preserveNullAndEmptyArrays: true } },
      
      // Join with services
      {
        $lookup: {
          from: 'services',
          let: { serviceId: { $toObjectId: '$serviceId' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$serviceId'] } } },
            { $project: { name: 1, category: 1 }}
          ],
          as: 'service'
        }
      },
      { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
      
      // Join with authorizations
      {
        $lookup: {
          from: 'authorizations',
          let: { svcRelId: { $toString: '$_id' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$serviceRelationshipId', '$$svcRelId'] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: 'authArray'
        }
      },
      
      // Count active issues
      {
        $lookup: {
          from: 'issues',
          let: { svcRelId: { $toString: '$_id' } },
          pipeline: [
            { $match: { 
              $expr: { 
                $and: [
                  { $eq: ['$serviceRelationshipId', '$$svcRelId'] },
                  { $in: ['$status', ['OPEN', 'IN_PROGRESS']] }
                ]
              }
            }},
            { $count: 'count' }
          ],
          as: 'activeIssues'
        }
      },
      
      // Project final shape
      {
        $project: {
          _id: { $toString: '$_id' },
          organizationId: 1,
          clientId: 1,
          providerId: 1,
          serviceId: 1,
          serviceType: 1,
          status: 1,
          startDate: 1,
          endDate: 1,
          lastActivityAt: 1,
          createdAt: 1,
          
          // Populated fields
          clientName: {
            $concat: [
              { $ifNull: ['$client.firstName', ''] },
              ' ',
              { $ifNull: ['$client.lastName', ''] }
            ]
          },
          providerName: { $ifNull: ['$provider.legalName', 'Unknown Provider'] },
          providerEmail: '$provider.contacts.email',
          providerPhone: '$provider.contacts.phone',
          serviceName: '$service.name',
          serviceCategory: '$service.category',
          
          // Authorization
          authorization: {
            $cond: {
              if: { $gt: [{ $size: { $ifNull: ['$authArray', []] } }, 0] },
              then: {
                $let: {
                  vars: { auth: { $arrayElemAt: ['$authArray', 0] } },
                  in: {
                    status: '$$auth.status',
                    startDate: '$$auth.startDate',
                    endDate: '$$auth.endDate',
                    units: '$$auth.units',
                    unitType: '$$auth.unitType',
                    daysUntilExpiration: {
                      $cond: {
                        if: '$$auth.endDate',
                        then: {
                          $dateDiff: {
                            startDate: new Date(),
                            endDate: '$$auth.endDate',
                            unit: 'day'
                          }
                        },
                        else: null
                      }
                    }
                  }
                }
              },
              else: null
            }
          },
          
          // Counts
          activeIssuesCount: { 
            $ifNull: [{ $arrayElemAt: ['$activeIssues.count', 0] }, 0] 
          },
        }
      }
    ]).toArray();

    if (!serviceRel || serviceRel.length === 0) {
      return NextResponse.json(
        { error: 'Service relationship not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      serviceRelationship: serviceRel[0],
    });

  } catch (error) {
    console.error('Error fetching service relationship:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: serviceRelationshipId } = params;
    const updates = await request.json();

    const client = await clientPromise;
    const db = client.db('referradb');

    // Security: Verify user has access to this service relationship
    const serviceRelationship = await db.collection('service_relationships').findOne({
      _id: new ObjectId(serviceRelationshipId)
    });

    if (!serviceRelationship) {
      return NextResponse.json({ error: 'Service relationship not found' }, { status: 404 });
    }

    // Verify user is the case manager for this service relationship
    if (serviceRelationship.caseManagerId !== user.id) {
      console.log('Access denied: user is not the case manager');
      return NextResponse.json({ error: 'Forbidden - not your service relationship' }, { status: 403 });
    }

    // Build update object
    const updateDoc: any = {
      updatedAt: new Date().toISOString(),
    };

    // Only allow specific fields to be updated
    if (updates.status) {
      updateDoc.status = updates.status;
    }
    // Note: flag field removed - use issues collection instead
    if (updates.pendingReason !== undefined) {
      updateDoc.pendingReason = updates.pendingReason;
    }
    if (updates.pauseReason !== undefined) {
      updateDoc.pauseReason = updates.pauseReason;
    }
    if (updates.closeReason !== undefined) {
      updateDoc.closeReason = updates.closeReason;
    }

    // Update lastActivityAt when status changes
    if (updates.status) {
      updateDoc.lastActivityAt = new Date().toISOString();
    }

    const result = await db.collection('service_relationships').updateOne(
      { _id: new ObjectId(serviceRelationshipId) },
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Service relationship not found' }, { status: 404 });
    }

    console.log('✅ Updated service relationship:', serviceRelationshipId, updateDoc);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating service relationship:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
