import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export async function GET(req: Request, { params }: { params: { id: string } }) {
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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Get the referral to check permissions
    const referral = await db.collection('referrals').findOne({ _id: new ObjectId(params.id) });
    if (!referral) {
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    }
    
    // Get events for this referral
    const events = await db.collection('referralEvents')
      .find({ referralId: params.id })
      .sort({ timestamp: -1 })
      .toArray();

    // If no events are found yet, create a default "referral created" event
    if (events.length === 0) {
      const createdEvent = {
        _id: new ObjectId(),
        referralId: params.id,
        type: 'referral_created',
        title: 'Referral Created',
        description: `Referral submitted for ${referral.serviceDetails?.type || 'services'}`,
        timestamp: referral.createdAt || new Date().toISOString(),
        actor: {
          name: referral.caseManager?.name || 'Case Manager',
          role: 'case_manager'
        }
      };
      
      // Insert the initial event
      await db.collection('referralEvents').insertOne(createdEvent);
      
      // Add id property for consistent API response format
      events.push({
        ...createdEvent,
        id: createdEvent._id.toString()
      });
    }
    
    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching referral timeline:', error);
    return NextResponse.json({ error: 'Error fetching timeline' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { type, title, description, metadata } = await req.json();
    
    if (!type || !title) {
      return NextResponse.json({ error: 'Event type and title are required' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Get the referral to check if it exists
    const referral = await db.collection('referrals').findOne({ _id: new ObjectId(params.id) });
    if (!referral) {
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    }
    
    // Create the event
    const event = {
      _id: new ObjectId(),
      referralId: params.id,
      type,
      title,
      description: description || '',
      timestamp: new Date().toISOString(),
      actor: {
        name: session.user.user_metadata?.name || session.user.email || 'User',
        role: session.user.user_metadata?.role || 'unknown'
      },
      metadata: metadata || {}
    };
    
    // Insert the event
    await db.collection('referralEvents').insertOne(event);
    
    return NextResponse.json({ 
      success: true, 
      event: {
        ...event,
        id: event._id.toString()
      }
    });
  } catch (error) {
    console.error('Error creating timeline event:', error);
    return NextResponse.json({ error: 'Error creating event' }, { status: 500 });
  }
} 