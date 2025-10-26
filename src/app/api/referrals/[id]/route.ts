import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import clientPromise from '@/lib/mongodb/client';

// Update a specific referral
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('PATCH request received for referral ID:', params.id);
  try {
    // 1. Verify authentication
    const user = await getAuthenticatedUser();
    if (!user) {
      console.log('No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = user.role;
    const userId = user.id;
    console.log('User role:', userRole, 'User ID:', userId);

    // 2. Get the update data from request body
    const update = await request.json();
    console.log('Update data:', update);

    // 3. Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("referradb");

    // 4. Get the existing referral to check permissions
    const existingReferral = await db.collection("referrals").findOne({
      _id: new ObjectId(params.id)
    });

    if (!existingReferral) {
      console.log('Referral not found in database');
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    }

    console.log('Found existing referral:', existingReferral._id);

    // 5. Check permissions based on role
    const canUpdate = 
      userRole === 'platform_admin' || 
      (userRole === 'case_manager' && existingReferral.caseManagerId === userId) ||
      (userRole === 'provider' && existingReferral.providerId === userId);

    if (!canUpdate) {
      console.log('Permission denied for user:', userId);
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // 6. Prepare update data
    let updateData = { ...update, updatedAt: new Date().toISOString() };
    
    // 7. If assigning a provider and status is not already matched, update status to matched
    if (update.assignedProvider && existingReferral.status !== 'matched') {
      updateData.status = 'matched';
      console.log('Provider assigned, updating status to matched');
    }
    
    // 8. Check if referral is being accepted/activated - create connection
    const shouldCreateConnection = 
      (updateData.status === 'accepted' || updateData.status === 'active') &&
      updateData.assignedProvider &&
      !existingReferral.convertedConnectionId; // Prevent duplicate connections
    
    console.log('Attempting to update referral with data:', updateData);
    
    const result = await db.collection("referrals").findOneAndUpdate(
      { _id: new ObjectId(params.id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    console.log('findOneAndUpdate result:', result);

    if (!result) {
      console.log('Failed to update referral in database - result is null');
      return NextResponse.json({ error: 'Referral not found or failed to update' }, { status: 404 });
    }

    // 9. Create connection if referral was accepted/activated
    let connectionId = null;
    if (shouldCreateConnection) {
      console.log('Creating connection for accepted/active referral');
      
      try {
        const connection = {
          clientId: existingReferral.clientInfo?._id || existingReferral.clientId,
          providerId: updateData.assignedProvider,
          providerName: updateData.assignedProviderName || existingReferral.assignedProviderName || 'Unknown Provider',
          serviceType: existingReferral.serviceType || 'Service',
          status: 'active',
          createdAt: new Date().toISOString(),
          sourceReferralId: existingReferral._id,
          // Service metadata from referral
          pmi: existingReferral.pmi,
          connectionType: 'referral_conversion',
          establishedBy: userId,
          establishedDate: new Date().toISOString()
        };

        // Don't create separate connection - the active referral IS the connection
        // Just mark that this referral represents an active service connection
        await db.collection("referrals").updateOne(
          { _id: new ObjectId(params.id) },
          { $set: { 
            isActiveConnection: true,
            connectionEstablishedAt: new Date().toISOString(),
            connectionEstablishedBy: userId
          } }
        );
        
        connectionId = existingReferral._id; // The referral itself is the connection
        
        console.log('Connection created successfully:', connectionId);
        
        // Create timeline event for connection creation
        await db.collection('timeline_events').insertOne({
          clientId: connection.clientId,
          contextType: 'connection',
          contextId: connectionId.toString(),
          providerId: connection.providerId,
          type: 'connection_created',
          description: `Service connection established with ${connection.providerName}`,
          createdBy: userId,
          createdByName: user.email,
          createdByRole: userRole,
          createdAt: new Date().toISOString(),
          metadata: {
            sourceReferralId: existingReferral._id,
            serviceType: connection.serviceType,
            connectionType: 'referral_conversion'
          }
        });
        
      } catch (connectionError) {
        console.error('Error creating connection:', connectionError);
        // Don't fail the referral update if connection creation fails
      }
    }

    console.log('Successfully updated referral');
    return NextResponse.json({ 
      success: true, 
      referral: result,
      connectionCreated: !!connectionId,
      connectionId 
    });
  } catch (error) {
    console.error('Error updating referral:', error);
    return NextResponse.json({ error: 'Failed to update referral' }, { status: 500 });
  }
}

// Delete a specific referral
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verify authentication
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("referradb");

    // 3. Verify ownership of the referral
    const referral = await db.collection("referrals").findOne({
      _id: new ObjectId(params.id),
      caseManagerId: user.id
    });

    if (!referral) {
      return NextResponse.json(
        { error: 'Referral not found or unauthorized' },
        { status: 404 }
      );
    }

    // 4. Delete the referral
    await db.collection("referrals").deleteOne({
      _id: new ObjectId(params.id),
      caseManagerId: user.id
    });

    // 5. Return success response
    return NextResponse.json({
      success: true,
      message: 'Referral deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting referral:', error);
    return NextResponse.json(
      { error: 'Error deleting referral' },
      { status: 500 }
    );
  }
}

// Fetch a specific referral
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verify authentication
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = user.id;
    const userRole = user.role;
    // 2. Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("referradb");
    // 3. Find the referral (no role filter)
    const referral = await db.collection("referrals").findOne({
      _id: new ObjectId(params.id)
    });
    if (!referral) {
      return NextResponse.json(
        { error: 'Referral not found' },
        { status: 404 }
      );
    }
    // 4. Fetch provider name if missing but we have an assigned provider
    if ((referral.assignedProvider || referral.providerId) && !referral.assignedProviderName && !referral.providerName) {
      const providerIdToFetch = referral.assignedProvider || referral.providerId;
      try {
        // Look up provider in MongoDB users collection
        const provider = await db.collection('users').findOne({ 
          _id: new ObjectId(providerIdToFetch),
          role: 'provider'
        });

        if (provider) {
          referral.assignedProviderName = provider.name || provider.email || 'Unknown Provider';
          referral.assignedProviderOrganization = provider.organization || 'Unknown Organization';
        }
      } catch (providerError) {
        console.log('Could not fetch provider details:', providerError);
        // Continue without provider details
      }
    }

    // 5. Check access
    if (userRole === 'platform_admin') {
      return NextResponse.json({ success: true, referral });
    } else if (userRole === 'case_manager' && referral.caseManagerId === userId) {
      return NextResponse.json({ success: true, referral });
    } else if (userRole === 'provider') {
      // For providers, check if they're assigned AND referral is in appropriate status
      const isAssigned = referral.providerId === userId || referral.assignedProvider === userId;
      const hasAccess = isAssigned && ['confirmed', 'in_progress', 'active', 'accepted', 'completed'].includes(referral.status);
      
      if (hasAccess) {
        return NextResponse.json({ success: true, referral });
      } else {
        return NextResponse.json(
          { error: 'Unauthorized - Referral not assigned or not in accessible status' },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error('Error fetching referral:', error);
    return NextResponse.json(
      { error: 'Error fetching referral' },
      { status: 500 }
    );
  }
} 