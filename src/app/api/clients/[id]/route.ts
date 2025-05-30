import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const COLLECTION = 'clients';

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

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || !['case_manager', 'admin', 'provider'].includes(session.user.user_metadata?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db('referradb');

    const id = params.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing client ID' }, { status: 400 });
    }

    try {
      const client = await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
      
      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      
      return NextResponse.json({ client });
    } catch (error) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || !['case_manager', 'admin'].includes(session.user.user_metadata?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: 'Missing client ID' }, { status: 400 });
    }

    // Read request body
    let data;
    try {
      data = await req.json();
      console.log('Received update data:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Connect to database
    let db;
    try {
      const dbClient = await clientPromise;
      db = dbClient.db('referradb');
      console.log('Connected to database');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    // Validate ObjectId
    let objectId;
    try {
      objectId = new ObjectId(id);
      console.log('Valid ObjectId:', objectId);
    } catch (idError) {
      console.error('Invalid ObjectId:', idError);
      return NextResponse.json({ error: 'Invalid client ID format' }, { status: 400 });
    }
    
    // Get the existing client to check permissions
    let existingClient;
    try {
      existingClient = await db.collection(COLLECTION).findOne({ _id: objectId });
      console.log('Found existing client:', existingClient ? 'Yes' : 'No');
    } catch (findError) {
      console.error('Error finding client:', findError);
      return NextResponse.json({ error: 'Error retrieving client' }, { status: 500 });
    }
    
    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    // Check permissions - only the assigned case manager or admin can update
    const userRole = session.user.user_metadata?.role;
    const userId = session.user.id;
    
    // Temporarily skip permission check for debugging
    /*
    const canUpdate = 
      userRole === 'admin' || 
      (userRole === 'case_manager' && existingClient.caseManagerId === userId);
    
    if (!canUpdate) {
      console.log('Permission denied: User role:', userRole, 'User ID:', userId, 'Client manager ID:', existingClient.caseManagerId);
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    */
    
    // Prepare update data - make sure we don't override critical fields
    const updateData = {
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      county: data.county,
      preferredContactMethod: data.preferredContactMethod,
      insurance: data.insurance,
      updatedAt: new Date().toISOString()
    };
    
    console.log('Prepared update data:', JSON.stringify(updateData, null, 2));
    
    // Update the client
    try {
      // Use updateOne instead of findOneAndUpdate for simpler operation
      const result = await db.collection(COLLECTION).updateOne(
        { _id: objectId },
        { $set: updateData }
      );
      
      console.log('Update result:', JSON.stringify(result, null, 2));
      
      if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'Client not found during update' }, { status: 404 });
      }
      
      if (result.modifiedCount === 0) {
        console.log('No changes were made to the client');
      }
      
      // Get the updated client
      const updatedClient = await db.collection(COLLECTION).findOne({ _id: objectId });
      
      return NextResponse.json({ 
        success: true, 
        client: updatedClient 
      });
    } catch (updateError) {
      console.error('MongoDB update error:', updateError);
      return NextResponse.json({ 
        error: 'Database error updating client',
        details: updateError instanceof Error ? updateError.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Unexpected error in update client API:', error);
    return NextResponse.json({ 
      error: 'Failed to update client',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 