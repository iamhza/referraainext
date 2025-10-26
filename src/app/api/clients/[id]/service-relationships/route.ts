import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';
import { createAuditLog } from '@/lib/audit/utils';

/**
 * GET /api/clients/[id]/service-relationships
 * 
 * Fetches all service relationships for a specific client.
 * 
 * Security:
 * - Verifies user authentication
 * - Verifies user has access to this client (case manager ownership)
 * - Logs access for HIPAA compliance
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

    const { id: clientId } = params;

    const client = await clientPromise;
    const db = client.db('referradb');
    
    // SECURITY: Verify user has access to this client
    const clientDoc = await db.collection('clients').findOne({
      _id: new ObjectId(clientId)
    });
    
    if (!clientDoc) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    // Verify case manager ownership
    if (user.role === 'case_manager' && clientDoc.caseManagerId !== user.id) {
      await createAuditLog({
        userId: user.id,
        userRole: user.role,
        action: 'access_denied',
        resourceType: 'service_relationships',
        resourceId: clientId,
        success: false,
        details: { reason: 'Not assigned case manager' }
      });
      return NextResponse.json({ error: 'Forbidden - not your client' }, { status: 403 });
    }
    
    // TODO: Add provider authorization check when needed
    
    const serviceRelationshipsCollection = db.collection('service_relationships');

    // Fetch all service relationships for this client
    const serviceRelationships = await serviceRelationshipsCollection
      .find({ clientId })
      .sort({ createdAt: -1 })
      .toArray();

    // Transform for frontend
    const transformed = serviceRelationships.map((sr) => ({
      ...sr,
      _id: sr._id.toString(),
    }));

    // Audit log the access for HIPAA compliance
    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'service_relationships_viewed',
      resourceType: 'service_relationships',
      resourceId: clientId,
      success: true,
      details: { 
        count: transformed.length,
        clientId: clientId
      }
    });

    return NextResponse.json({
      serviceRelationships: transformed,
    });
  } catch (error) {
    console.error('Error fetching service relationships:', error);
    
    // Audit log the error
    try {
      const user = await getAuthenticatedUser();
      if (user) {
        await createAuditLog({
          userId: user.id,
          userRole: user.role,
          action: 'service_relationships_error',
          resourceType: 'service_relationships',
          resourceId: params.id,
          success: false,
          details: { 
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    } catch (auditError) {
      console.error('Failed to log audit error:', auditError);
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

