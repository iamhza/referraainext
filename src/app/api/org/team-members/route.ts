/**
 * NextAuth-compatible organization team members API
 * Fetches users within the same organization for supervisors and org admins
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import clientPromise from '@/lib/mongodb/client';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !['org_admin', 'supervisor', 'platform_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Get all users in the same organization
    const query = user.role === 'platform_admin' 
      ? {} // Platform admin can see all users
      : { org_id: user.org_id }; // Others only see their org
    
    const users = await db.collection('users').find(query).toArray();
    
    // Transform users for frontend and calculate client counts
    const transformedUsers = await Promise.all(users.map(async (u) => {
      let clientCount = 0;
      
      // Calculate client count for case managers
      if (u.role === 'case_manager') {
        try {
          const clientsCount = await db.collection('clients').countDocuments({
            org_id: user.org_id,
            $or: [
              { caseManagerId: u._id.toString() },
              { created_by: u._id.toString() },
              { assignedBy: u._id.toString() }
            ]
          });
          clientCount = clientsCount;
        } catch (error) {
          console.error('Error counting clients for case manager:', u._id, error);
        }
      }
      
      return {
        id: u._id.toString(),
        email: u.email,
        name: u.full_name || u.name || u.email,
        role: u.role,
        org_id: u.org_id,
        team_id: u.team_id,
        is_active: u.is_active !== false, // Default to true if not set
        created_at: u.created_at || u.createdAt,
        updated_at: u.updated_at || u.updatedAt,
        clientCount: clientCount
      };
    }));
    
    return NextResponse.json({ 
      users: transformedUsers,
      total: transformedUsers.length,
      organization: user.org_id
    });

  } catch (error) {
    console.error('Error fetching organization team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' }, 
      { status: 500 }
    );
  }
}
