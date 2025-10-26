import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';
import { getAuthenticatedUser } from '@/lib/auth/helpers';

const COLLECTION = 'referrals';

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user || !['case_manager', 'platform_admin', 'provider', 'platform_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const client = await clientPromise;
  const db = client.db('referradb');
  const { searchParams } = new URL(req.url);
  
  // Check if this is a request for a specific referral
  const id = searchParams.get('id');
  if (id) {
    try {
      const referral = await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
      if (!referral) return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
      return NextResponse.json({ referral });
    } catch (error) {
      return NextResponse.json({ error: 'Invalid referral ID' }, { status: 400 });
    }
  }
  
  // Check if this is a request for referrals for a specific client
  const clientId = searchParams.get('clientId');
  const status = searchParams.get('status');
  
  let query: any = {};
  
  if (clientId) {
    // The client ID might be stored in different ways across referrals
    // Use $or to check multiple possibilities
    query['$or'] = [
      { 'clientInfo._id': clientId },
      { 'clientInfo.clientId': clientId },
      { 'clientId': clientId }
    ];
    console.log('Searching for referrals with clientId:', clientId);
  }
  
  if (status) {
    if (status === 'active') {
      // For 'active' status, include multiple statuses that represent active referrals
      query.status = { $in: ['accepted', 'in_progress', 'active', 'pending'] };
    } else if (status === 'completed') {
      query.status = 'completed';
    } else if (status === 'all') {
      // For 'all' status, don't filter by status at all
      // No need to add anything to the query
    } else {
      query.status = status;
    }
  }
  
  // Filter by role
  if (user.role === 'case_manager') {
    query.caseManagerId = user.id;
  } else if (user.role === 'provider') {
    // For providers, show referrals that have been assigned to them AND are in appropriate status
    // Include 'matched' status so providers can see referrals that admin has assigned but case manager hasn't confirmed yet
    query.$and = [
      { 
        $or: [
          { providerId: user.id },
          { assignedProvider: user.id }
        ]
      },
      {
        status: { 
          $in: ['confirmed', 'in_progress', 'active', 'accepted', 'completed'] 
        }
      }
    ];
  }
  
  try {
    const referrals = await db.collection(COLLECTION).find(query).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ referrals });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user || !['case_manager', 'platform_admin', 'platform_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const data = await req.json();
    
    // console.log('📥 API RECEIVED REFERRAL DATA:', JSON.stringify(data, null, 2));
    
    if (!data.clientInfo || !data.serviceDetails) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db('referradb');
    const now = new Date().toISOString();
    
    // Fetch case manager details - handle potential ObjectId issues
    let caseManager = null;
    try {
      // Try to find by _id first if it's a valid ObjectId
      caseManager = await db.collection('users').findOne({ 
        $or: [
          { _id: new ObjectId(user.id) },
          { user_id: user.id },
          { id: user.id },
          { auth_id: user.id },
          { email: user.email }
        ]
      });
    } catch (error) {
      // If ObjectId conversion fails, try alternative lookups
      caseManager = await db.collection('users').findOne({ 
        $or: [
          { user_id: user.id },
          { id: user.id },
          { auth_id: user.id },
          { email: user.email }
        ]
      });
    }
    
    // Create or update client in clients collection
    let clientId;
    if (data.clientInfo._id) {
      // If client already has an ID, check if it exists in the clients collection
      try {
        const existingClient = await db.collection('clients').findOne({ 
          _id: new ObjectId(data.clientInfo._id) 
        });
        
        if (existingClient) {
          // Client exists, use their existing ID
          clientId = data.clientInfo._id;
        } else {
          // ID provided but client doesn't exist, create new client
          const clientData = {
            ...data.clientInfo,
            createdAt: now,
            updatedAt: now,
            caseManagerId: user.id,
            source: 'created_from_referral',
            referralDate: now
          };
          delete clientData._id; // Remove the ID so MongoDB can generate a new one
          const clientResult = await db.collection('clients').insertOne(clientData);
          clientId = clientResult.insertedId;
        }
      } catch (idError) {
        // Invalid ID format, create a new client
        const clientData = {
          ...data.clientInfo,
          createdAt: now,
          updatedAt: now,
          caseManagerId: user.id,
          source: 'created_from_referral',
          referralDate: now
        };
        delete clientData._id;
        const clientResult = await db.collection('clients').insertOne(clientData);
        clientId = clientResult.insertedId;
      }
    } else {
      // No client ID, check if client exists by matching name, DOB, etc.
      const existingClient = await db.collection('clients').findOne({
        firstName: data.clientInfo.firstName,
        lastName: data.clientInfo.lastName,
        ...(data.clientInfo.dateOfBirth ? { dateOfBirth: data.clientInfo.dateOfBirth } : {})
      });
      
      if (existingClient) {
        // Client already exists
        clientId = existingClient._id;
      } else {
        // Create new client
        const clientData = {
          ...data.clientInfo,
          createdAt: now,
          updatedAt: now,
          caseManagerId: user.id,
          source: 'created_from_referral',
          referralDate: now
        };
        const clientResult = await db.collection('clients').insertOne(clientData);
        clientId = clientResult.insertedId;
      }
    }
    
    // Update clientInfo with the correct client ID
    data.clientInfo._id = clientId.toString();
    
    const referral = {
      ...data,
      caseManagerId: user.id,
      caseManager: {
        id: user.id,
        name: caseManager?.name || user.email,
        email: caseManager?.email || user.email
      },
      status: 'submitted',
      createdAt: now,
      updatedAt: now,
      progressPercentage: 0
    };
    
    // console.log('💾 SAVING TO DATABASE:', JSON.stringify(referral, null, 2));
    
    const result = await db.collection(COLLECTION).insertOne(referral);
    
    return NextResponse.json({ ...referral, _id: result.insertedId }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create referral:", error);
    return NextResponse.json({ error: 'Failed to create referral' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !['case_manager', 'platform_admin', 'platform_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing referral id' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db('referradb');
    let filter: any = { _id: new ObjectId(id) };
    
    if (user.role !== 'platform_admin') {
      // Only allow case manager to delete their own referrals
      filter.caseManagerId = user.id;
    }
    
    const result = await db.collection('referrals').deleteOne(filter);
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Referral not found or unauthorized' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting referral:', error);
    return NextResponse.json({ error: 'Error deleting referral' }, { status: 500 });
  }
} 