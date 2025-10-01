/**
 * Enhanced Clients API using NextAuth.js
 * Demonstrates the new auth pattern while preserving HIPAA compliance
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole, withOrgAccess } from '@/lib/nextauth-helpers';
import { createSecureClientWithAuth, getSecureClientsForCaseManager } from '@/lib/secure-client';
import clientPromise from '@/lib/mongodb';

// GET /api/clients/nextauth - List clients with org isolation
export const GET = withAuth(async (user: any, request: NextRequest) => {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    let query: any = {};
    
    // Organization-scoped data access
    if (user.role === 'platform_admin') {
      // Platform admin can see all clients (for debugging/support)
    } else if (user.org_id) {
      // Organization users only see their org's clients
      query.orgId = user.org_id;
      
      // Case managers only see their assigned clients
      if (user.role === 'case_manager') {
        query.caseManagerId = user.id;
      }
    } else {
      // Users without org assignment see nothing
      return NextResponse.json({ clients: [] });
    }
    
    console.log('🔍 Client query:', query);
    console.log('👤 User context:', {
      id: user.id,
      role: user.role,
      org_id: user.org_id,
      permissions: user.permissions
    });

    const clients = await db.collection('clients').find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    // Note: Clients are encrypted, so we need to decrypt them
    // Using the existing secure client functions
    const decryptedClients = [];
    for (const client of clients) {
      try {
        const decryptedClient = await getSecureClient(
          client._id.toString(), 
          user.id, 
          user.role
        );
        if (decryptedClient) {
          decryptedClients.push(decryptedClient);
        }
      } catch (error) {
        console.error('Error decrypting client:', error);
        // Skip clients that can't be decrypted
      }
    }

    return NextResponse.json({
      clients: decryptedClients,
      total: clients.length,
      user_context: {
        role: user.role,
        org_id: user.org_id,
        organization: user.organization?.name
      }
    });

  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
});

// POST /api/clients/nextauth - Create client with automatic auth context
export const POST = withRole(['case_manager', 'supervisor', 'org_admin'], async (user: any, request: NextRequest) => {
  try {
    const clientData = await request.json();
    
    // Automatically add org context
    const enhancedClientData = {
      ...clientData,
      orgId: user.org_id, // Automatic org isolation
      caseManagerId: user.id,
      createdBy: user.id
    };

    // Use the enhanced secure client function that automatically gets auth context
    const result = await createSecureClientWithAuth(enhancedClientData);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        client: result.client,
        message: 'Client created successfully with HIPAA compliance'
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to create client' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
});
