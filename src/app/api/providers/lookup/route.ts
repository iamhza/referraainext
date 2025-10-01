import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow case managers and admins
    if (!['case_manager', 'platform_admin'].includes(user.user_metadata?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, organization } = await request.json();

    if (!email && !organization) {
      return NextResponse.json({ error: 'Email or organization required' }, { status: 400 });
    }

    console.log('🔍 Looking up provider with:', { email, organization });

    // Search for provider by email or organization
    let query = supabase.from('provider_profiles').select(`
      id,
      user_id,
      full_name,
      email,
      organization_name
    `);

    if (email) {
      query = query.eq('email', email);
    } else if (organization) {
      query = query.ilike('organization_name', `%${organization}%`);
    }

    const { data: providers, error } = await query;

    if (error) {
      console.error('Error looking up provider:', error);
      return NextResponse.json({ error: 'Failed to lookup provider' }, { status: 500 });
    }

    if (providers && providers.length > 0) {
      const provider = providers[0]; // Take first match
      console.log('✅ Found provider:', provider.full_name);
      
      return NextResponse.json({ 
        provider: {
          id: provider.user_id,
          fullName: provider.full_name || 'Unknown',
          email: provider.email || 'No email',
          displayName: provider.full_name || provider.email || 'Unknown Provider',
          organization: provider.organization_name || 'No organization'
        }
      });
    } else {
      console.log('❌ No provider found');
      return NextResponse.json({ provider: null });
    }

  } catch (error) {
    console.error('Error in provider lookup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
