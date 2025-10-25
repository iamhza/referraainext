import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * GET /api/case-manager/service-relationships
 * 
 * Fetches all service relationships for the current case manager,
 * with client and provider details joined.
 * 
 * Security:
 * - Verifies user authentication
 * - Filters by case manager ID
 * - Filters by organization ID (multi-tenant isolation)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization ID and role from org_members (v1.1 data model)
    const client = await clientPromise;
    const db = client.db('referradb');
    
    const orgMember = await db.collection('org_members').findOne({ userId: user.id });
    if (!orgMember || !orgMember.organizationId) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 403 });
    }
    
    // Verify user is a case manager (check v1.1 role from org_members)
    const role = orgMember.role.toUpperCase();
    if (role !== 'CASE_MANAGER') {
      console.log('Access denied: user role is', role);
      return NextResponse.json({ error: 'Forbidden - case manager role required' }, { status: 403 });
    }
    
    const organizationId = orgMember.organizationId.toString();
    console.log('Fetching service relationships for case manager:', user.id, 'org:', organizationId);
    
    // Fetch service relationships with client and provider details
    const serviceRelationships = await db
      .collection('service_relationships')
      .aggregate([
        // SECURITY: Match case manager's relationships AND organization
        {
          $match: {
            caseManagerId: user.id,
            organizationId: organizationId, // Multi-tenant isolation
          },
        },
        
        // Join with clients collection (with organization security check)
        {
          $lookup: {
            from: 'clients',
            let: { clientId: { $toObjectId: '$clientId' } },
            pipeline: [
              {
                $match: {
                  $expr: { 
                    $and: [
                      { $eq: ['$_id', '$$clientId'] },
                      { $eq: ['$caseManagerId', user.id] } // Security: only case manager's clients
                    ]
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  // v1.1 nested structure
                  firstName: '$identity.firstName',
                  lastName: '$identity.lastName',
                  email: '$contact.email',
                  phone: '$contact.phone',
                },
              },
            ],
            as: 'client',
          },
        },
        {
          $unwind: {
            path: '$client',
            preserveNullAndEmptyArrays: true,
          },
        },
        
        // Join with providers collection
        {
          $lookup: {
            from: 'providers',
            let: { providerId: { $toObjectId: '$providerId' } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$providerId'] },
                },
              },
              {
                $project: {
                  name: 1,
                },
              },
            ],
            as: 'provider',
          },
        },
        {
          $unwind: {
            path: '$provider',
            preserveNullAndEmptyArrays: true,
          },
        },
        
        // Join with services collection
        {
          $lookup: {
            from: 'services',
            let: { serviceId: { $toObjectId: '$serviceId' } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$serviceId'] },
                },
              },
              {
                $project: {
                  name: 1,
                  category: 1,
                  id: 1,
                  residential: 1,
                },
              },
            ],
            as: 'service',
          },
        },
        {
          $unwind: {
            path: '$service',
            preserveNullAndEmptyArrays: true,
          },
        },
        
        // Join with authorizations collection (get most recent active authorization)
        {
          $lookup: {
            from: 'authorizations',
            let: { serviceRelId: { $toString: '$_id' } },
            pipeline: [
              {
                $match: {
                  $expr: { 
                    $and: [
                      { $eq: ['$serviceRelationshipId', '$$serviceRelId'] },
                      { $eq: ['$organizationId', organizationId] } // Security: same org
                    ]
                  },
                },
              },
              { $sort: { createdAt: -1 } },
              { $limit: 1 }
            ],
            as: 'authorization',
          },
        },
        {
          $unwind: {
            path: '$authorization',
            preserveNullAndEmptyArrays: true,
          },
        },
        
        // Join with actions collection (count open actions)
        {
          $lookup: {
            from: 'actions',
            let: { serviceRelId: { $toString: '$_id' } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$subjectType', 'SERVICE_RELATIONSHIP'] },
                      { $eq: ['$subjectId', '$$serviceRelId'] },
                      { $eq: ['$status', 'OPEN'] },
                      { $eq: ['$organizationId', organizationId] } // Security: same org
                    ]
                  }
                }
              },
              { $count: 'count' }
            ],
            as: 'actionsCount',
          },
        },
        
        // Join with documents collection (count documents)
        {
          $lookup: {
            from: 'documents',
            let: { serviceRelId: { $toString: '$_id' } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$serviceRelationshipId', '$$serviceRelId'] },
                      { $eq: ['$organizationId', organizationId] } // Security: same org
                    ]
                  }
                }
              },
              { $count: 'count' }
            ],
            as: 'documentsCount',
          },
        },
        
        // Join with issues collection (count open/in-progress issues)
        {
          $lookup: {
            from: 'issues',
            let: { serviceRelId: { $toString: '$_id' } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$serviceRelationshipId', '$$serviceRelId'] },
                      { $eq: ['$organizationId', organizationId] }, // Security: same org
                      { $in: ['$status', ['OPEN', 'IN_PROGRESS']] } // Only active issues
                    ]
                  }
                }
              },
              { $count: 'count' }
            ],
            as: 'issuesCount',
          },
        },
        
        // Add provider name, service name, and computed fields
        {
          $addFields: {
            providerName: { $ifNull: ['$provider.name', 'Provider TBD'] },
            serviceName: { $ifNull: ['$service.name', '$serviceType'] }, // Fallback to serviceType string
            serviceCategory: '$service.category',
            
            // Authorization details with expiration calculation
            authorization: {
              $cond: {
                if: { $ne: ['$authorization', null] },
                then: {
                  status: '$authorization.status',
                  units: '$authorization.units',
                  unitType: '$authorization.unitType',
                  startDate: '$authorization.startDate',
                  endDate: '$authorization.endDate',
                  approvalNumber: '$authorization.approvalNumber',
                  daysUntilExpiration: {
                    $cond: {
                      if: { $ne: ['$authorization.endDate', null] },
                      then: {
                        $dateDiff: {
                          startDate: new Date(),
                          endDate: { $toDate: '$authorization.endDate' },
                          unit: 'day'
                        }
                      },
                      else: null
                    }
                  }
                },
                else: null
              }
            },
            
            // Open actions count
            openActionsCount: { 
              $ifNull: [
                { $arrayElemAt: ['$actionsCount.count', 0] }, 
                0
              ]
            },
            
            // Documents count
            documentsCount: {
              $ifNull: [
                { $arrayElemAt: ['$documentsCount.count', 0] },
                0
              ]
            },
            
            // Active issues count (OPEN or IN_PROGRESS)
            activeIssuesCount: {
              $ifNull: [
                { $arrayElemAt: ['$issuesCount.count', 0] },
                0
              ]
            }
          },
        },
        
        // Remove joined objects (we only need the denormalized fields)
        {
          $project: {
            provider: 0,
            service: 0,
            actionsCount: 0,
            documentsCount: 0,
            issuesCount: 0,
          },
        },
        
        // Sort by client name, then by service type
        // Note: these are the projected fields, not the nested originals
        {
          $sort: {
            'client.firstName': 1,
            'client.lastName': 1,
            serviceType: 1,
          },
        },
      ])
      .toArray();

    console.log('Found', serviceRelationships.length, 'service relationships');

    return NextResponse.json({
      serviceRelationships: serviceRelationships.map(sr => ({
        ...sr,
        _id: sr._id.toString(),
        clientId: sr.clientId,
        providerId: sr.providerId,
        client: sr.client ? {
          ...sr.client,
          _id: sr.client._id.toString(),
        } : null,
      })),
    });
  } catch (error) {
    console.error('Error fetching service relationships:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
