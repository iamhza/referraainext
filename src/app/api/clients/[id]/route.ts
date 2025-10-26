import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import clientPromise from '@/lib/mongodb/client';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import { ObjectId } from 'mongodb';
import { getSecureClient, updateSecureClient, deleteSecureClient } from '@/lib/clients/secure';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.error('=== DELETE ROUTE HIT ===', params.id);
    
    const user = await getAuthenticatedUser();
  if (!user || !['case_manager', 'platform_admin', 'provider'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = params.id;
    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // First, get the client to see its structure and check if it exists
    const clientDoc = await db.collection('clients').findOne({ _id: new ObjectId(clientId) });
    // HIPAA COMPLIANT: Log only non-PHI identifiers for debugging
    console.error('CLIENT LOOKUP:', { clientId, found: !!clientDoc, status: clientDoc?.status, role: user.role });
    
    if (!clientDoc) {
      return NextResponse.json({ 
        error: 'Client not found' 
      }, { status: 404 });
    }

    // Role-based deletion permissions
    const userRole = user.role;
    if (userRole === 'provider') {
      // Providers can only delete clients they created (imported OR manually added), not from referrals
      const canDelete = (
        clientDoc.createdBy === user.id && 
        clientDoc.source !== 'created_from_referral'
      );
      
      if (!canDelete) {
        const isFromReferral = clientDoc.source === 'created_from_referral';
        const notOwner = clientDoc.createdBy !== user.id;
        
        let errorMessage = 'Cannot delete this client. ';
        if (isFromReferral) {
          errorMessage += 'You can only delete clients you imported or added manually, not clients assigned through referrals.';
        } else if (notOwner) {
          errorMessage += 'You can only delete clients you created yourself.';
        } else {
          errorMessage += 'You do not have permission to delete this client.';
        }
        
        return NextResponse.json({ 
          error: errorMessage 
        }, { status: 403 });
      }
    }

    // Check if client has active referrals
    const activeReferrals = await db.collection('referrals').find({
      $or: [
        { 'clientInfo._id': clientId },
        { 'clientInfo.clientId': clientId },
        { clientId: clientId }
      ],
      status: { $in: ['pending', 'matched', 'confirmed', 'in_progress', 'active'] }
    }).toArray();

    if (activeReferrals.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete client with active referrals. Please complete or cancel existing referrals first.' 
      }, { status: 400 });
    }

    // Use secure client deletion with HIPAA audit logging
    const result = await deleteSecureClient(clientId, user.id, user.role);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Revalidate case manager pages to ensure fresh data
    revalidatePath('/case-manager');

    return NextResponse.json({ 
      success: true, 
      message: 'Client deleted successfully',
      deletedId: clientId,
      cleanupDetails: {
        pendingConnectionsCleaned: result.pendingConnectionsCleaned || 0,
        referralsCleaned: result.referralsCleaned || 0
      }
    });

  } catch (error: any) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}

// GET endpoint for fetching individual client details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
  if (!user || !['case_manager', 'platform_admin', 'provider'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = params.id;
    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Use secure client access with HIPAA audit logging
    console.log('📖 GET - Fetching client:', clientId);
    const clientDoc = await getSecureClient(clientId, user.id, user.role);
    
    if (!clientDoc) {
      console.error('❌ GET - Client not found:', clientId);
      return NextResponse.json({ 
        error: 'Client not found or you do not have permission to view this client' 
      }, { status: 404 });
    }

    console.log('✅ GET - Retrieved client:', {
      id: clientDoc._id,
      name: `${clientDoc.firstName} ${clientDoc.lastName}`,
      dateOfBirth: clientDoc.dateOfBirth,
      updatedAt: clientDoc.updatedAt,
      caseManagerId: clientDoc.caseManagerId
    });

    // Additional role-based access check after decryption
    console.log('🔐 Permission check:', {
      userRole: user.role,
      userId: user.id,
      clientCaseManagerId: clientDoc.caseManagerId,
      hasPermission: user.role !== 'case_manager' || clientDoc.caseManagerId === user.id
    });

    if (user.role === 'case_manager' && clientDoc.caseManagerId !== user.id) {
      console.error('❌ Permission denied - Case manager ID mismatch:', {
        expectedUserId: user.id,
        clientCaseManagerId: clientDoc.caseManagerId
      });
      return NextResponse.json({ 
        error: 'You do not have permission to view this client' 
      }, { status: 403 });
    } else if (user.role === 'provider' && clientDoc.currentProvider !== user.id) {
      return NextResponse.json({ 
        error: 'You do not have permission to view this client' 
      }, { status: 403 });
    }

    return NextResponse.json({ client: clientDoc });

  } catch (error: any) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

// PATCH endpoint for updating individual client details
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
  if (!user || !['case_manager', 'platform_admin', 'provider'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = params.id;
    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const updateData = await request.json();
    console.log('📝 PATCH - Updating client:', {
      clientId,
      updateKeys: Object.keys(updateData),
      dateOfBirth: updateData.dateOfBirth,
      firstName: updateData.firstName,
      lastName: updateData.lastName
    });

    // Verify the client exists before updating
    const existingClient = await getSecureClient(clientId, user.id, user.role);
    if (!existingClient) {
      console.error('❌ PATCH - Client not found:', clientId);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    console.log('✅ PATCH - Found existing client:', {
      id: existingClient._id,
      name: `${existingClient.firstName} ${existingClient.lastName}`
    });

    // Use secure client update with HIPAA audit logging
    const result = await updateSecureClient(clientId, updateData, user.id, user.role);
    
    if (!result.success) {
      console.error('❌ Secure client update failed:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log('✅ Client updated successfully');
    
    // Fetch the updated client to return it
    const updatedClient = await getSecureClient(clientId, user.id, user.role);
    
    // Revalidate case manager pages to ensure fresh data
    revalidatePath('/case-manager');
    revalidatePath(`/case-manager/clients/${clientId}`);
    
    return NextResponse.json({ 
      success: true,
      message: 'Client updated successfully',
      client: updatedClient 
    });

  } catch (error: any) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}