import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import clientPromise from '@/lib/mongodb/client';
import { validateObjectId } from '@/lib/shared/validation';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
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
    
    // Only admin and case managers can access PHI data
    const userRole = user.role;
    if (!['platform_admin', 'case_manager'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Validate ID format
    let objectId;
    try {
      objectId = validateObjectId(params.id);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid PHI ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("referradb");
    
    const phiData = await db.collection("phi").findOne({
      _id: objectId
    });

    if (!phiData) {
      return NextResponse.json(
        { error: 'PHI data not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: phiData });
  } catch (error) {
    console.error('Error fetching PHI data:', error);
    return NextResponse.json(
      { error: 'Error fetching PHI data' },
      { status: 500 }
    );
  }
} 