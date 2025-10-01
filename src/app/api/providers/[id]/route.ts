import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const providerId = params.id;
    
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

    const userRole = user.user_metadata?.role;
    console.log('User role:', userRole, 'User ID:', user.id);
    
    // Allow admin, case_manager, and provider roles to access provider details
    if (!['platform_admin', 'case_manager', 'provider'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden - Access denied' }, { status: 403 });
    }

    // For case managers, verify they have a referral assigned to this provider (MongoDB check)
    if (userRole === 'case_manager') {
      const { MongoClient } = require('mongodb');
      const client = new MongoClient(process.env.MONGODB_URI);
      
      try {
        await client.connect();
        const db = client.db('referradb');  // Correct database name
        const referralsCollection = db.collection('referrals');
        
        console.log('Checking MongoDB for referral with caseManagerId:', user.id, 'and assignedProvider:', providerId);
        
        // Check if this case manager has any referral assigned to this provider
        const referral = await referralsCollection.findOne({
          caseManagerId: user.id,  // Correct field name
          assignedProvider: providerId
        });
        
        console.log('MongoDB referral check result:', referral ? 'Found referral' : 'No referral found');
        
        if (!referral) {
          return NextResponse.json({ 
            error: 'Access denied - no referral assigned to this provider' 
          }, { status: 403 });
        }
        
        console.log('✅ Case manager authorized to view provider details');
      } catch (error) {
        console.error('MongoDB connection error:', error);
        return NextResponse.json({ 
          error: 'Database connection error' 
        }, { status: 500 });
      } finally {
        await client.close();
      }
    }

    // Fetch provider details from provider_profiles table
    console.log('🔍 Looking for provider with user_id:', providerId);
    
    const { data: provider, error: providerError } = await supabase
      .from('provider_profiles')
      .select('*')
      .eq('user_id', providerId)
      .single();

    console.log('Provider query result:', { 
      found: !!provider, 
      error: providerError?.code,
      providerName: provider?.full_name 
    });

    if (providerError || !provider) {
      console.log('❌ Provider not found in provider_profiles table');
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Transform the provider data to include all relevant fields
    const transformedProvider = {
      id: provider.user_id,
      fullName: provider.full_name || 'Unknown',
      email: provider.email || 'No email',
      displayName: provider.full_name || provider.email || 'Unknown Provider',
      organization: provider.organization_name || 'No organization',
      phone: provider.phone || 'No phone',
      address: provider.address || 'No address',
      bio: provider.bio || 'No bio available',
      website: provider.website || null,
      specialties: provider.specialties || [],
      verificationStatus: provider.verification_status || 'pending'
    };

    console.log('✅ Successfully retrieved provider:', transformedProvider.fullName);
    return NextResponse.json({ provider: transformedProvider });
  } catch (error) {
    console.error('Error fetching provider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 