import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb/client';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import { encryptPHI } from '@/lib/shared/encryption';
import { createAuditLog } from '@/lib/audit/hipaa';

export async function POST(request: Request) {
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
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { clientMatchKey, caseManagerId, providerId, pmi, serviceType } = await request.json();
    
    if (!clientMatchKey || !caseManagerId || !providerId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Enhanced PMI and Service Type Validation for ServiceConnection
    if (pmi && !/^\d{9}$/.test(pmi)) {
      return NextResponse.json({ 
        error: 'Invalid PMI format. PMI must be exactly 9 digits.' 
      }, { status: 400 });
    }

    if (serviceType && !serviceType.trim()) {
      return NextResponse.json({ 
        error: 'Service type cannot be empty.' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Verify PMI exists in client records if provided
    if (pmi) {
      const clientWithPMI = await db.collection('clients').findOne({ pmi });
      if (!clientWithPMI) {
        return NextResponse.json({ 
          error: `No client found with PMI ${pmi}. Please verify the PMI is correct.` 
        }, { status: 404 });
      }
      console.log(`✅ PMI ${pmi} verified in client database`);
    }

    // Check if connection already exists
    const existingConnection = await db.collection('pending_connections').findOne({
      clientMatchKey,
      caseManagerId,
      providerId
    });

    if (existingConnection) {
      return NextResponse.json({ error: 'Connection already exists' }, { status: 400 });
    }

    // Check if already activated (has referral)
    const existingReferral = await db.collection('referrals').findOne({
      'clientInfo.clientMatchKey': clientMatchKey,
      caseManagerId,
      $or: [{ providerId }, { assignedProvider: providerId }],
    });

    if (existingReferral) {
      return NextResponse.json({ error: 'Connection already activated' }, { status: 400 });
    }

    // Create pending connection with encrypted client name and ServiceConnection data
    const now = new Date().toISOString();
    const [firstName, lastName, dateOfBirth] = clientMatchKey.split('|');
    
    // Encrypt the client name for HIPAA compliance
    const clientName = `${firstName} ${lastName}`.trim();
    const encryptedClientName = encryptPHI(clientName);
    
    const pendingConnection = {
      clientMatchKey,
      encryptedClientName, // Store encrypted name instead of plain text
      caseManagerId,
      providerId,
      initiatedBy: user.id,
      status: 'pending',
      createdAt: now,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      
      // ServiceConnection fields
      pmi: pmi || null,
      serviceType: serviceType || null,
      connectionType: 'existing_service', // Mark as existing service relationship
    };

    // Audit log the connection initiation with ServiceConnection data
    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'serviceconnection_initiated',
      resourceType: 'pending_connection',
      resourceId: clientMatchKey,
      details: { 
        caseManagerId, 
        providerId, 
        pmi: pmi || 'not_provided',
        serviceType: serviceType || 'not_specified',
        connectionType: 'existing_service'
      }
    });

    const result = await db.collection('pending_connections').insertOne(pendingConnection);

    return NextResponse.json({ 
      success: true, 
      connectionId: result.insertedId,
      message: 'Connection request sent successfully',
      status: 'pending'
    });
  } catch (e) {
    console.error('connections/initiate error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
