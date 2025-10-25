import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import clientPromise from '@/lib/mongodb';

/**
 * GET /api/workspace/issues
 * 
 * Fetches all issues visible to the current user, grouped by client
 * with Active/Archived subfolders for the workspace sidebar.
 * 
 * Response Structure:
 * {
 *   clients: [
 *     {
 *       clientId: string,
 *       clientName: string,
 *       active: Issue[],      // OPEN or IN_PROGRESS
 *       archived: Issue[]     // RESOLVED or CANCELLED
 *     }
 *   ]
 * }
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Get user's organization and memberId
    const member = await db.collection('org_members').findOne({
      userId: user.id,
      isActive: true,
    });

    if (!member) {
      return NextResponse.json({ error: 'User not found in organization' }, { status: 404 });
    }

    const { organizationId, _id: memberId } = member;

    // Fetch all issues for this organization with service relationship details
    const issues = await db.collection('issues').aggregate([
      {
        $match: {
          organizationId,
        },
      },
      
      // Join with service_relationships to get provider and service info
      {
        $lookup: {
          from: 'service_relationships',
          let: { srId: { $toObjectId: '$serviceRelationshipId' } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$srId'] }
              }
            }
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
                $expr: {
                  $eq: [{ $toString: '$_id' }, '$$clientIdStr']
                }
              }
            }
          ],
          as: 'client',
        },
      },
      { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
      
      // Join with providers (convert string ID to ObjectId for comparison)
      {
        $lookup: {
          from: 'providers',
          let: { 
            providerId: { 
              $cond: [
                { $ne: ['$serviceRelationship.providerId', null] },
                { $toObjectId: '$serviceRelationship.providerId' },
                null
              ]
            }
          },
          pipeline: [
            {
              $match: {
                $expr: { 
                  $and: [
                    { $ne: ['$$providerId', null] },
                    { $eq: ['$_id', '$$providerId'] }
                  ]
                }
              }
            },
            {
              $project: {
                legalName: 1,
                dba: 1,
              }
            }
          ],
          as: 'provider',
        },
      },
      { $unwind: { path: '$provider', preserveNullAndEmptyArrays: true } },
      
      // Join with services (convert string ID to ObjectId for comparison)
      {
        $lookup: {
          from: 'services',
          let: { 
            serviceId: { 
              $cond: [
                { $ne: ['$serviceRelationship.serviceId', null] },
                { $toObjectId: '$serviceRelationship.serviceId' },
                null
              ]
            }
          },
          pipeline: [
            {
              $match: {
                $expr: { 
                  $and: [
                    { $ne: ['$$serviceId', null] },
                    { $eq: ['$_id', '$$serviceId'] }
                  ]
                }
              }
            },
            {
              $project: {
                name: 1,
                category: 1,
              }
            }
          ],
          as: 'service',
        },
      },
      { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
      
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
          clientName: {
            $concat: [
              { $ifNull: ['$client.identity.firstName', ''] },
              ' ',
              { $ifNull: ['$client.identity.lastName', ''] }
            ]
          },
          
          // Provider details (with proper fallback chain)
          providerName: { 
            $ifNull: [
              { $ifNull: ['$provider.legalName', '$provider.dba'] },
              { $ifNull: ['$serviceRelationship.providerName', 'Unknown Provider'] }
            ] 
          },
          
          // Service details (with proper fallback chain)
          serviceName: { 
            $ifNull: [
              '$service.name',
              { $ifNull: ['$serviceRelationship.serviceName', '$serviceRelationship.serviceType'] }
            ] 
          },
          serviceType: { $ifNull: ['$serviceRelationship.serviceType', 'Unknown'] },
        },
      },
      
      // Sort by created date (newest first)
      { $sort: { createdAt: -1 } },
    ]).toArray();

    // Group issues by client with Active/Archived subfolders
    const clientsMap = new Map<string, any>();

    for (const issue of issues) {
      const { clientId, clientName, status } = issue;
      
      if (!clientsMap.has(clientId)) {
        clientsMap.set(clientId, {
          clientId,
          clientName,
          active: [],
          archived: [],
        });
      }

      const clientGroup = clientsMap.get(clientId)!;
      
      // Active = OPEN or IN_PROGRESS
      if (status === 'OPEN' || status === 'IN_PROGRESS') {
        clientGroup.active.push(issue);
      } 
      // Archived = RESOLVED or CANCELLED
      else if (status === 'RESOLVED' || status === 'CANCELLED') {
        clientGroup.archived.push(issue);
      }
    }

    const clients = Array.from(clientsMap.values());

    return NextResponse.json({
      success: true,
      clients,
      stats: {
        totalClients: clients.length,
        totalIssues: issues.length,
        activeIssues: issues.filter(i => i.status === 'OPEN' || i.status === 'IN_PROGRESS').length,
        archivedIssues: issues.filter(i => i.status === 'RESOLVED' || i.status === 'CANCELLED').length,
      },
    });

  } catch (error) {
    console.error('Error fetching workspace issues:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

