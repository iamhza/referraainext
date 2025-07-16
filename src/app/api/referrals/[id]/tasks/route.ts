import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

// GET: Fetch all tasks for a referral
export async function GET(request: Request, { params }: { params: { id: string } }) {
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
    const referral = await db.collection('referrals').findOne({ _id: new ObjectId(params.id) });
    if (!referral) {
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, tasks: referral.tasks || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching tasks' }, { status: 500 });
  }
}

// POST: Add a new task to a referral
export async function POST(request: Request, { params }: { params: { id: string } }) {
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
    const { text } = await request.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Task text required' }, { status: 400 });
    }
    const task = {
      _id: new ObjectId(),
      text,
      completed: false,
      completedBy: null,
      completedAt: null,
    };
    const client = await clientPromise;
    const db = client.db('referradb');
    const result = await db.collection('referrals').updateOne(
      { _id: new ObjectId(params.id) },
      { $push: { tasks: task } } as any
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, task });
  } catch (error) {
    return NextResponse.json({ error: 'Error adding task' }, { status: 500 });
  }
}

// PATCH: Update a task's completed status
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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { taskId, completed } = await request.json();
    if (!taskId || typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'taskId and completed required' }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db('referradb');
    const result = await db.collection('referrals').updateOne(
      { _id: new ObjectId(params.id), 'tasks._id': new ObjectId(taskId) },
      {
        $set: {
          'tasks.$.completed': completed,
          'tasks.$.completedBy': completed ? session.user.id : null,
          'tasks.$.completedAt': completed ? new Date().toISOString() : null,
        },
      } as any
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error updating task' }, { status: 500 });
  }
} 