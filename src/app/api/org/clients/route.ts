/**
 * Organization-scoped clients API
 * Handles client management within organizations for supervisors and org admins
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import { getSecureClient } from '@/lib/clients/secure';
import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !['org_admin', 'supervisor', 'case_manager'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Get clients for the user's organization
    let query: any = { org_id: user.org_id };
    
    // For case managers, filter to only their assigned clients
    if (user.role === 'case_manager') {
      query = {
        org_id: user.org_id,
        $or: [
          { caseManagerId: user.id },
          { assignedBy: user.id },
          { created_by: user.id }
        ]
      };
    }
    
    const clients = await db.collection('clients').find(query).toArray();

    // Decrypt and enhance client data with case manager information
    const enhancedClients = await Promise.all(
      clients.map(async (clientDoc) => {
        try {
          // Use secure client function to decrypt PHI fields
          const decryptedClient = await getSecureClient(clientDoc._id.toString(), user.id, user.role);
          
          if (!decryptedClient) {
            console.log('Could not decrypt client:', clientDoc._id);
            return null;
          }

          // Get case manager information
          let caseManagerName = null;
          if (decryptedClient.caseManagerId) {
            try {
              const caseManager = await db.collection('users').findOne({
                _id: new ObjectId(decryptedClient.caseManagerId)
              });
              if (caseManager) {
                caseManagerName = caseManager.full_name || caseManager.name;
              }
            } catch (error) {
              console.log('Error fetching case manager for client:', error);
            }
          }

          return {
            ...decryptedClient,
            _id: decryptedClient._id.toString(),
            name: `${decryptedClient.firstName || ''} ${decryptedClient.lastName || ''}`.trim(),
            caseManagerName
          };
        } catch (error) {
          console.error('Error processing client:', clientDoc._id, error);
          return null;
        }
      })
    );

    // Filter out any null results from failed decryption
    const validClients = enhancedClients.filter(client => client !== null);
    
    return NextResponse.json({ 
      clients: validClients,
      total: validClients.length,
      organization: user.org_id
    });

  } catch (error) {
    console.error('Error fetching organization clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !['org_admin', 'supervisor'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.firstName || !data.lastName || !data.dateOfBirth) {
      return NextResponse.json(
        { error: 'First name, last name, and date of birth are required' }, 
        { status: 400 }
      );
    }

    // Create client with organization context
    const clientData = {
      ...data,
      org_id: user.org_id,
      created_by: user.id,
      created_by_role: user.role,
      source: 'supervisor_create'
    };

    // If case manager is assigned, add assignment info
    if (data.assignedCaseManagerId) {
      clientData.caseManagerId = data.assignedCaseManagerId;
      clientData.assignedBy = user.id;
      clientData.assignedAt = new Date().toISOString();
    }

    // Use the existing client creation endpoint
    const createResponse = await fetch(`${request.nextUrl.origin}/api/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || ''
      },
      body: JSON.stringify(clientData)
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      return NextResponse.json(error, { status: createResponse.status });
    }

    const result = await createResponse.json();
    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('Error creating organization client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' }, 
      { status: 500 }
    );
  }
}