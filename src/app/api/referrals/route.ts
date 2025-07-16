import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const COLLECTION = 'referrals';

async function getSession() {
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
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || !['case_manager', 'admin', 'provider'].includes(session.user.user_metadata?.role)) {
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
  if (session.user.user_metadata?.role === 'case_manager') {
    query.caseManagerId = session.user.id;
  } else if (session.user.user_metadata?.role === 'provider') {
    query.providerId = session.user.id;
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
  const session = await getSession();
  if (!session || !['case_manager', 'admin'].includes(session.user.user_metadata?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const data = await req.json();
    
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
          { _id: new ObjectId(session.user.id) },
          { user_id: session.user.id },
          { id: session.user.id },
          { auth_id: session.user.id },
          { email: session.user.email }
        ]
      });
    } catch (error) {
      // If ObjectId conversion fails, try alternative lookups
      caseManager = await db.collection('users').findOne({ 
        $or: [
          { user_id: session.user.id },
          { id: session.user.id },
          { auth_id: session.user.id },
          { email: session.user.email }
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
            caseManagerId: session.user.id,
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
          caseManagerId: session.user.id,
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
          caseManagerId: session.user.id,
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
      caseManagerId: session.user.id,
      caseManager: {
        id: session.user.id,
        name: caseManager?.name || session.user.user_metadata?.name || session.user.email,
        email: caseManager?.email || session.user.email
      },
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      progressPercentage: 0
    };
    
    const result = await db.collection(COLLECTION).insertOne(referral);
    
    return NextResponse.json({ ...referral, _id: result.insertedId }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create referral:", error);
    return NextResponse.json({ error: 'Failed to create referral' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { id, ...update } = await req.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Missing referral ID' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Get the existing referral to check permissions
    const existingReferral = await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
    
    if (!existingReferral) {
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    }
    
    // Check permissions based on role
    const userRole = session.user.user_metadata?.role;
    const userId = session.user.id;
    
    const canUpdate = 
      userRole === 'admin' || 
      (userRole === 'case_manager' && existingReferral.caseManagerId === userId) ||
      (userRole === 'provider' && existingReferral.providerId === userId);
    
    if (!canUpdate) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    
    // Update the referral
    const result = await db.collection(COLLECTION).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...update, updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    );
    
    if (!result || !result.value) {
      return NextResponse.json({ error: 'Referral not found or failed to update' }, { status: 404 });
      }
    
    return NextResponse.json({ success: true, referral: result.value });
  } catch (error) {
    console.error('Error updating referral:', error);
    return NextResponse.json({ error: 'Failed to update referral' }, { status: 500 });
  }
}

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
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userRole = session.user.user_metadata?.role;
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing referral id' }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db('referradb');
    let filter: any = { _id: new ObjectId(id) };
    if (userRole !== 'admin') {
      // Only allow case manager to delete their own referrals
      filter.caseManagerId = session.user.id;
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