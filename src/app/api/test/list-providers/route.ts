import { NextResponse } from 'next/server';
export async function GET() {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service key for admin access
      {
        cookies: {
          get() { return undefined; }
        }
      }
    );

    // Get all provider users from Supabase
    const { data: providers, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Filter for providers only
    const providerUsers = providers.users.filter(user => 
      user.user_metadata?.role === 'provider'
    ).map(user => ({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || 'Unknown',
      role: user.user_metadata?.role
    }));

    return NextResponse.json({
      providers: providerUsers,
      message: 'Use one of these provider IDs to create test connection clients'
    });

  } catch (error: any) {
    console.error('Error listing providers:', error);
    return NextResponse.json({ error: 'Failed to list providers' }, { status: 500 });
  }
}
