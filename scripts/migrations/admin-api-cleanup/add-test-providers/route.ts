import { NextRequest, NextResponse } from 'next/server';

export async function POST() {
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
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (user.user_metadata?.role !== 'platform_admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // First, let's check if the provider_profiles table exists and what its structure is
    console.log('Checking provider_profiles table structure...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('provider_profiles')
      .select('*')
      .limit(1);

    console.log('Table check result:', { tableInfo, tableError });

    // Add some test providers with minimal required fields and proper UUIDs
    const testProviders = [
      {
        user_id: '550e8400-e29b-41d4-a716-446655440001',
        full_name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@healthcare.com',
        organization_name: 'Johnson Medical Group'
      },
      {
        user_id: '550e8400-e29b-41d4-a716-446655440002',
        full_name: 'Dr. Michael Chen',
        email: 'michael.chen@wellness.com',
        organization_name: 'Chen Wellness Center'
      },
      {
        user_id: '550e8400-e29b-41d4-a716-446655440003',
        full_name: 'Dr. Emily Rodriguez',
        email: 'emily.rodriguez@mentalhealth.com',
        organization_name: 'Rodriguez Mental Health Services'
      }
    ];

    console.log('Attempting to insert test providers:', testProviders);
    
    const { data, error } = await supabase
      .from('provider_profiles')
      .insert(testProviders)
      .select();

    if (error) {
      console.error('Error adding test providers:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json({ 
        error: 'Failed to add test providers', 
        details: error.message,
        code: error.code 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Test providers added successfully',
      providers: data 
    });

  } catch (error) {
    console.error('Error in POST /api/admin/add-test-providers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 