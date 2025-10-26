/**
 * V1.1 Single Client API
 * 
 * GET /api/v1.1/clients/[id] - Get single client
 * PATCH /api/v1.1/clients/[id] - Update client
 * DELETE /api/v1.1/clients/[id] - Delete client
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';
import { clientToFlat, mergeNestedUpdate, isV1_1Format, flatToNested } from '@/lib/clients/adapter';
import type { ClientInput } from '@/lib/clients/adapter';

// GET /api/v1.1/clients/[id] - Get single client
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    const clientDoc = await db.collection('clients').findOne({
      _id: new ObjectId(params.id)
    });

    if (!clientDoc) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Security: Check organization access
    if (clientDoc.organizationId !== user.organizationId && user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Security: Case managers can only see their own clients
    if (user.role === 'CASE_MANAGER' && clientDoc.caseManagerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Return flat format for UI
    return NextResponse.json({
      client: clientToFlat(clientDoc)
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/v1.1/clients/[id] - Update client
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates: Partial<ClientInput> = await request.json();

    const client = await clientPromise;
    const db = client.db('referradb');

    // Fetch existing client
    const existing = await db.collection('clients').findOne({
      _id: new ObjectId(params.id)
    });

    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Security: Check organization access
    if (existing.organizationId !== user.organizationId && user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Security: Case managers can only update their own clients
    if (user.role === 'CASE_MANAGER' && existing.caseManagerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Handle both v1.1 and legacy format
    let nestedUpdates: any;

    if (isV1_1Format(existing)) {
      // Already v1.1 - merge nested updates
      nestedUpdates = mergeNestedUpdate(existing, updates);
    } else {
      // Legacy flat format - convert to v1.1 first
      console.log('⚠️  Converting legacy client to v1.1 format');
      const converted = flatToNested(
        existing,
        existing.organizationId || existing.org_id,
        existing.caseManagerId
      );
      nestedUpdates = mergeNestedUpdate(converted, updates);
      
      // Replace entire document with v1.1 structure
      await db.collection('clients').replaceOne(
        { _id: existing._id },
        { ...converted, ...nestedUpdates }
      );
      
      const updated = await db.collection('clients').findOne({ _id: existing._id });
      return NextResponse.json({
        success: true,
        client: clientToFlat(updated)
      });
    }

    // Update v1.1 client
    await db.collection('clients').updateOne(
      { _id: existing._id },
      { $set: nestedUpdates }
    );

    console.log('✅ Updated v1.1 client:', existing._id);

    // Fetch updated client
    const updated = await db.collection('clients').findOne({ _id: existing._id });

    // Return flat format for UI
    return NextResponse.json({
      success: true,
      client: clientToFlat(updated)
    });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/v1.1/clients/[id] - Delete client (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Fetch existing client
    const existing = await db.collection('clients').findOne({
      _id: new ObjectId(params.id)
    });

    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Security: Check organization access
    if (existing.organizationId !== user.organizationId && user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete: Set status to INACTIVE
    await db.collection('clients').updateOne(
      { _id: existing._id },
      {
        $set: {
          status: 'INACTIVE',
          updatedAt: new Date()
        }
      }
    );

    console.log('✅ Soft deleted client:', existing._id);

    return NextResponse.json({
      success: true,
      message: 'Client deactivated'
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

