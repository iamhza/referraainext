import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import clientPromise from '@/lib/mongodb';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userRole = user.role;
    if (userRole !== 'case_manager' && userRole !== 'platform_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { providerId, status } = await request.json();
    if (!providerId || !status) {
      return NextResponse.json({ error: 'providerId and status required' }, { status: 400 });
    }

    // Fetch provider details from Supabase
    const { data: provider } = await supabase
      .from('provider_profiles')
      .select('full_name, organization_name')
      .eq('user_id', providerId)
      .single();

    const client = await clientPromise;
    const db = client.db('referradb');
    const update = {
      assignedProvider: providerId,
      assignedProviderName: provider?.full_name || 'Unknown Provider',
      assignedProviderOrganization: provider?.organization_name || 'Unknown Organization',
      status,
      updatedAt: new Date().toISOString(),
    };
    const result = await db.collection('referrals').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: update } as any
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error assigning provider' }, { status: 500 });
  }
} 