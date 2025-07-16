import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { validateClientData, validateObjectId, validateRequestSize } from '@/lib/validation';
import { logger, getRequestContext } from '@/lib/logger';
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

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
  // Apply rate limiting
  const rateLimitResponse = applyRateLimit(req, 'client_read', RATE_LIMITS.read);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

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
  // Apply rate limiting
  const rateLimitResponse = applyRateLimit(req, 'client_update', RATE_LIMITS.write);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const session = await getSession();
  if (!session || !['case_manager', 'admin'].includes(session.user.user_metadata?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: 'Missing client ID' }, { status: 400 });
    }

    // Validate request size
    const contentLength = parseInt(req.headers.get('content-length') || '0');
    try {
      validateRequestSize(contentLength);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Request too large' }, { status: 413 });
    }

    // Read and validate request body
    let data;
    try {
      data = await req.json();
      console.log('Received update data:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Validate and sanitize input data
    try {
      data = validateClientData(data);
    } catch (validationError) {
      console.error('Input validation error:', validationError);
      return NextResponse.json({ 
        error: validationError instanceof Error ? validationError.message : 'Invalid input data' 
      }, { status: 400 });
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
      objectId = validateObjectId(id);
      console.log('Valid ObjectId:', objectId);
    } catch (idError) {
      console.error('Invalid ObjectId:', idError);
      return NextResponse.json({ error: idError instanceof Error ? idError.message : 'Invalid client ID format' }, { status: 400 });
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
    
    const canUpdate = 
      userRole === 'admin' || 
      (userRole === 'case_manager' && existingClient.caseManagerId === userId);
    
    if (!canUpdate) {
      const context = getRequestContext(req, session);
      logger.permissionDenied('Client update permission denied', {
        ...context,
        attemptedClientId: id,
        clientManagerId: existingClient.caseManagerId,
      });
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    
    // Calculate profile completion
    const profileComplete = !!(
      data.firstName && 
      data.lastName &&
      data.phone && 
      data.email && 
      data.address && 
      data.city &&
      data.state &&
      data.county
    );

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
      profileComplete,
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
      const context = getRequestContext(req, session);
      logger.databaseError('MongoDB update error', updateError as Error, {
        ...context,
        operation: 'client_update',
        clientId: id,
      });
      return NextResponse.json({ 
        error: 'Database error updating client',
      }, { status: 500 });
    }
  } catch (error) {
         const context = getRequestContext(req, session);
     logger.error('Unexpected error in update client API', error as Error, {
       ...context,
       operation: 'client_update',
       clientId: params.id,
     });
    return NextResponse.json({ 
      error: 'Failed to update client',
    }, { status: 500 });
  }
} 