import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import { ObjectId } from 'mongodb';

/**
 * Admin endpoint to cleanup problematic client records
 * Use this to fix clients that can't be deleted through normal UI
 */
export async function DELETE(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getAuthenticatedUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');
    const force = url.searchParams.get('force') === 'true';

    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId parameter' }, { status: 400 });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(clientId)) {
      return NextResponse.json({ error: 'Invalid client ID format' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // First, get info about the problematic client
    const problematicClient = await db.collection('clients').findOne({
      _id: new ObjectId(clientId)
    });

    if (!problematicClient) {
      return NextResponse.json({ 
        error: 'Client not found',
        clientId 
      }, { status: 404 });
    }

    console.log('🔍 Problematic client data:', {
      id: problematicClient._id,
      firstName: problematicClient.firstName,
      lastName: problematicClient.lastName,
      createdBy: problematicClient.createdBy,
      source: problematicClient.source,
      currentUser: user.id,
      userRole: user.role
    });

    // Check if user has permission to delete this client
    const userRole = user.role;
    const canDelete = 
      userRole === 'platform_admin' || 
      force ||
      (userRole === 'provider' && problematicClient.createdBy === user.id) ||
      (userRole === 'case_manager' && problematicClient.caseManagerId === user.id);

    if (!canDelete) {
      return NextResponse.json({ 
        error: 'Permission denied',
        details: {
          userRole,
          clientCreatedBy: problematicClient.createdBy,
          clientCaseManagerId: problematicClient.caseManagerId,
          currentUserId: user.id
        }
      }, { status: 403 });
    }

    // Delete the client
    const deleteResult = await db.collection('clients').deleteOne({
      _id: new ObjectId(clientId)
    });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
    }

    // Also cleanup any related pending connections
    const pendingConnectionsResult = await db.collection('pending_connections').deleteMany({
      $or: [
        { clientMatchKey: { $regex: problematicClient.firstName || '', $options: 'i' } },
        { clientMatchKey: { $regex: problematicClient.lastName || '', $options: 'i' } }
      ]
    });

    console.log('✅ Cleanup completed:', {
      clientDeleted: deleteResult.deletedCount,
      pendingConnectionsDeleted: pendingConnectionsResult.deletedCount
    });

    return NextResponse.json({
      success: true,
      clientDeleted: deleteResult.deletedCount,
      pendingConnectionsDeleted: pendingConnectionsResult.deletedCount,
      clientData: {
        id: problematicClient._id,
        name: `${problematicClient.firstName || 'Unknown'} ${problematicClient.lastName || 'Client'}`,
        createdBy: problematicClient.createdBy,
        source: problematicClient.source
      }
    });

  } catch (error) {
    console.error('❌ Cleanup error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET endpoint to inspect problematic client without deleting
 */
export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getAuthenticatedUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');

    if (!clientId || !ObjectId.isValid(clientId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    const problematicClient = await db.collection('clients').findOne({
      _id: new ObjectId(clientId)
    });

    if (!problematicClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Check for related pending connections
    const relatedConnections = await db.collection('pending_connections').find({
      $or: [
        { clientMatchKey: { $regex: problematicClient.firstName || '', $options: 'i' } },
        { clientMatchKey: { $regex: problematicClient.lastName || '', $options: 'i' } }
      ]
    }).toArray();

    return NextResponse.json({
      client: {
        id: problematicClient._id,
        firstName: problematicClient.firstName,
        lastName: problematicClient.lastName,
        dateOfBirth: problematicClient.dateOfBirth,
        pmi: problematicClient.pmi,
        createdBy: problematicClient.createdBy,
        source: problematicClient.source,
        caseManagerId: problematicClient.caseManagerId,
        currentProvider: problematicClient.currentProvider,
        hasPendingConnection: problematicClient.hasPendingConnection,
        pendingConnectionId: problematicClient.pendingConnectionId
      },
      relatedConnections: relatedConnections.length,
      canDelete: {
        isAdmin: user.role === 'platform_admin',
        isCreator: problematicClient.createdBy === user.id,
        isCaseManager: problematicClient.caseManagerId === user.id
      }
    });

  } catch (error) {
    console.error('❌ Inspect error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
