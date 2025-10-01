import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user || user.role !== 'platform_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Get all users with provider role from MongoDB
    const providers = await db.collection('users').find({ 
      role: 'provider' 
    }).toArray();
    
    // Transform to match expected format
    const transformedProviders = providers.map(provider => ({
      id: provider._id.toString(),
      fullName: provider.full_name || provider.name || 'Unknown',
      email: provider.email || 'No email',
      displayName: provider.full_name || provider.name || provider.email,
      organization: provider.organization_name || provider.organization || 'No organization'
    }));

    return NextResponse.json({ 
      providers: transformedProviders 
    });

  } catch (error) {
    console.error('Error in GET /api/providers/all:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 