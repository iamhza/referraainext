import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

import { getAuthenticatedUser } from '@/lib/nextauth-helpers';


export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
  if (!user || !['case_manager', 'platform_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized - Case manager access required' }, { status: 401 });
    }

    const { providerUserId } = await request.json();
    if (!providerUserId) {
      return NextResponse.json({ error: 'Provider user ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');
    const now = new Date().toISOString();

    // Create matching test clients - one for case manager, one for provider
    const baseClient = {
      firstName: 'John',
      lastName: 'TestConnection',
      dateOfBirth: '1990-01-15',
      email: 'john.testconnection@example.com',
      phone: '555-123-4567',
      city: 'Test City',
      state: 'CA',
      zipCode: '90210',
      county: 'Test County',
      status: 'ACTIVE_STABLE',
      profileComplete: true,
      createdAt: now,
      updatedAt: now
    };

    // Case manager client (with caseManagerId)
    const caseManagerClient = {
      ...baseClient,
      caseManagerId: user.id, // Your case manager ID
      providerContactEmail: 'provider@example.com',
      providerName: 'Test Provider Org'
    };

    // Provider client (with currentProvider)
    const providerClient = {
      ...baseClient,
      firstName: 'John',
      lastName: 'TestConnection', // Same name/DOB for matching
      dateOfBirth: '1990-01-15',
      currentProvider: providerUserId, // Provider user ID
      caseManagerEmail: user.email,
      caseManagerName: session.user.user_metadata?.name || 'Test Case Manager'
    };

    // Insert both clients
    const [cmResult, providerResult] = await Promise.all([
      db.collection('clients').insertOne(caseManagerClient),
      db.collection('clients').insertOne(providerClient)
    ]);

    return NextResponse.json({
      success: true,
      message: 'Test connection clients created successfully',
      clients: {
        caseManager: {
          id: cmResult.insertedId,
          ...caseManagerClient
        },
        provider: {
          id: providerResult.insertedId,
          ...providerClient
        }
      },
      instructions: [
        '1. Go to your clients table - you should see "John TestConnection"',
        '2. Check the Connection column - it should show a connection is available',
        '3. Click "Activate" to create a workspace connection',
        '4. The provider (if logged in) will see the same client in their table'
      ]
    });

  } catch (error: any) {
    console.error('Error creating test connection clients:', error);
    return NextResponse.json({ error: 'Failed to create test clients' }, { status: 500 });
  }
}
