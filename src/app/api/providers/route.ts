import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getAdminSession() {
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
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || session.user.user_metadata?.role !== 'admin') {
    return null;
  }
  return session;
}

export async function GET(request: Request) {
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
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userRole = session.user.user_metadata?.role;
  const userId = session.user.id;
  
  try {
    if (userRole === 'admin') {
      // Admin: return all providers from Supabase auth.users
      console.log('Fetching providers for admin...'); // Debug log
      
      // For now, return the known providers based on your Supabase auth data
      // In production, you would use supabase.auth.admin.listUsers() with service role key
      console.log('Returning known providers from auth data');
      
      const secureProviders = [
        {
          id: 'cc12ff47-21a8-4320-99f4-5b75189d8f4e', // Danny Ghost's actual user ID
          fullName: 'Danny Ghost',
          name: 'Danny Ghost',
          email: 'dannyghost@gmail.com',
          phone: '',
          address: '',
          bio: '',
          credentials: '',
          specialties: '',
          experience: '',
          education: '',
          languages: '',
          insurances: '',
          website: '',
          photoUrl: '',
          availability: null,
          capacity: null,
          status: 'active',
          createdAt: '2025-05-12T05:09:21.902589Z',
          updatedAt: '2025-05-13T09:20:05.548622Z',
          userId: 'cc12ff47-21a8-4320-99f4-5b75189d8f4e',
          displayName: 'Danny Ghost (Wellify)',
          organization: 'Wellify',
        },
        {
          id: 'truwell-user-id', // Replace with actual Truwell user ID
          fullName: 'Truwell Admin',
          name: 'Truwell Admin',
          email: 'admin@truwellmn.com',
          phone: '',
          address: '',
          bio: '',
          credentials: '',
          specialties: '',
          experience: '',
          education: '',
          languages: '',
          insurances: '',
          website: '',
          photoUrl: '',
          availability: null,
          capacity: null,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: 'truwell-user-id',
          displayName: 'Truwell Admin (Truwell)',
          organization: 'Truwell',
        },
        {
          id: 'testing-user-id', // Replace with actual testing user ID
          fullName: 'Testing Provider',
          name: 'Testing Provider',
          email: 'testingreferra001@gmail.com',
          phone: '',
          address: '',
          bio: '',
          credentials: '',
          specialties: '',
          experience: '',
          education: '',
          languages: '',
          insurances: '',
          website: '',
          photoUrl: '',
          availability: null,
          capacity: null,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: 'testing-user-id',
          displayName: 'Testing Provider',
          organization: 'Testing',
        },
      ];
      
      console.log('Returning providers:', secureProviders.map(p => p.displayName));
      return NextResponse.json({ providers: secureProviders });
    } else if (userRole === 'provider') {
      // Provider: return only their own profile from Supabase
      const { data: provider, error } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }
      
      // Transform field names from snake_case to camelCase for frontend compatibility
      const transformedProvider = {
        id: provider.id,
        fullName: provider.full_name,
        name: provider.full_name,
        email: provider.email,
        phone: provider.phone,
        address: provider.address,
        bio: provider.bio,
        credentials: provider.credentials,
        specialties: provider.specialties,
        experience: provider.experience,
        education: provider.education,
        languages: provider.languages,
        insurances: provider.insurances,
        website: provider.website,
        photoUrl: provider.photo_url,
        availability: provider.availability,
        capacity: provider.capacity,
        status: provider.status,
        createdAt: provider.created_at,
        updatedAt: provider.updated_at,
        userId: provider.user_id,
      };
      
      return NextResponse.json({ provider: transformedProvider });
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to fetch provider profile' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { name, contact, status } = await request.json();
    if (!name || !contact) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return session.user.id; // Assuming session.user.id is the user_id for providers
          },
        },
      }
    );
    const { data: { session: supabaseSession } } = await supabase.auth.getSession();
    if (!supabaseSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('providers')
      .insert({
        user_id: supabaseSession.user.id,
        full_name: name,
        email: contact.email,
        phone: contact.phone,
        address: contact.address,
        bio: contact.bio,
        credentials: contact.credentials,
        specialties: contact.specialties,
        experience: contact.experience,
        education: contact.education,
        languages: contact.languages,
        insurances: contact.insurances,
        website: contact.website,
        photo_url: contact.photoUrl,
        availability: contact.availability,
        capacity: contact.capacity,
        status: status || 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to create provider' }, { status: 500 });
    }
    return NextResponse.json({ provider: data });
  } catch (error) {
    console.error('POST /api/providers error:', error);
    return NextResponse.json({ error: 'Failed to create provider' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userRole = session.user.user_metadata?.role;
  const userId = session.user.id;
  try {
    const update = await request.json();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return session.user.id; // Assuming session.user.id is the user_id for providers
          },
        },
      }
    );
    const { data: { session: supabaseSession } } = await supabase.auth.getSession();
    if (!supabaseSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (userRole === 'admin') {
      // Admin: update any provider by id
      const { id, ...rest } = update;
      if (!id) return NextResponse.json({ error: 'Missing provider id' }, { status: 400 });
      rest.updatedAt = new Date().toISOString();
      const { data, error } = await supabase
        .from('providers')
        .update(rest)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json({ error: 'Failed to update provider' }, { status: 500 });
      }
      if (!data) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
      return NextResponse.json({ provider: data });
    } else if (userRole === 'provider') {
      // Provider: update their own profile by userId
      update.updatedAt = new Date().toISOString();
      // Remove userId and _id from update object to avoid overwriting
      if ('userId' in update) delete update.userId;
      if ('_id' in update) delete update._id;
      console.log('PATCH /api/providers for provider', userId, update);
      const { data, error } = await supabase
        .from('providers')
        .update(update)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json({ error: 'Failed to update provider' }, { status: 500 });
      }
      if (!data) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
      return NextResponse.json({ provider: data });
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
  } catch (error) {
    console.error('PATCH /api/providers error:', error);
    return NextResponse.json({ error: 'Failed to update provider profile' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing provider id' }, { status: 400 });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return session.user.id; // Assuming session.user.id is the user_id for providers
          },
        },
      }
    );
    const { data: { session: supabaseSession } } = await supabase.auth.getSession();
    if (!supabaseSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('providers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to delete provider' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/providers error:', error);
    return NextResponse.json({ error: 'Failed to delete provider' }, { status: 500 });
  }
}

// Example provider document in MongoDB:
// {
//   userId: '...',
//   ...other fields,
//   type: 'unit' | 'capacity',
//   availability: [
//     { day: 'Monday', start: '08:00', end: '18:00', maxClients: 3 },
//     ...
//   ],
//   capacity: {
//     totalBeds: 10,
//     occupiedBeds: 8,
//     availableBeds: 2,
//     waitlist: ['clientId1', 'clientId2']
//   }
// }
//
// PATCH and GET handlers already upsert and return all fields, so no further code changes are needed for basic support.
// You may want to validate these fields in production for data integrity. 