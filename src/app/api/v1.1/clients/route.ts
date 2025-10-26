/**
 * V1.1 Client API - Clean Implementation
 * 
 * Uses nested PHI structure:
 * - identity, contact, bands, clinical, insurance
 * 
 * This is the new standard for all client operations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';
import { flatToNested, nestedToFlat, clientToFlat, mergeNestedUpdate } from '@/lib/clients/adapter';
import type { ClientInput } from '@/lib/clients/adapter';

// GET /api/v1.1/clients - List all clients for current user
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Build query based on role
    let query: any = { organizationId: user.organizationId };

    if (user.role === 'CASE_MANAGER') {
      query.caseManagerId = user.id;
    } else if (user.role === 'PROVIDER_USER') {
      // Providers see clients linked to their provider
      query.providerId = user.providerId;
    }
    // SUPERVISOR, ORG_ADMIN, PLATFORM_ADMIN see all clients in org

    const clients = await db.collection('clients')
      .find(query)
      .sort({ 'identity.lastName': 1, 'identity.firstName': 1 })
      .toArray();

    // Convert all clients to flat format for UI compatibility
    const flatClients = clients.map(clientToFlat);

    return NextResponse.json({
      clients: flatClients,
      count: flatClients.length
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/v1.1/clients - Create new client
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data: ClientInput = await request.json();

    // Validate required fields
    if (!data.firstName || !data.lastName || !data.dateOfBirth) {
      return NextResponse.json({ error: 'Missing required fields: firstName, lastName, dateOfBirth' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Determine case manager
    let caseManagerId = user.id;
    if (user.role === 'SUPERVISOR' || user.role === 'ORG_ADMIN') {
      // Allow assigning to specific case manager
      if (data.caseManagerId) {
        caseManagerId = data.caseManagerId;
      }
    }

    // Convert flat input to v1.1 nested structure
    const nestedClient = flatToNested(
      data,
      user.organizationId!,
      caseManagerId
    );

    // Insert client
    const result = await db.collection('clients').insertOne({
      ...nestedClient,
      _id: new ObjectId(),
    });

    console.log('✅ Created v1.1 client:', result.insertedId);

    // Fetch the created client
    const createdClient = await db.collection('clients').findOne({ _id: result.insertedId });

    // Return flat format for UI
    return NextResponse.json({
      success: true,
      client: clientToFlat(createdClient)
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

