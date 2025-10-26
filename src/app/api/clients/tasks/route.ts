import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import clientPromise from '@/lib/mongodb/client';

// GET: Fetch all tasks for a client
export async function GET(request: Request) {
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
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId' }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db('referradb');
    const clientDoc = await db.collection('clients').findOne({ _id: new ObjectId(clientId) });
    if (!clientDoc) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, tasks: clientDoc.tasks || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching tasks' }, { status: 500 });
  }
}

// POST: Add a new task to a client
export async function POST(request: Request) {
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
    const { clientId, text } = await request.json();
    if (!clientId || !text || typeof text !== 'string') {
      return NextResponse.json({ error: 'clientId and task text required' }, { status: 400 });
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
    const result = await db.collection('clients').updateOne(
      { _id: new ObjectId(clientId) },
      { $push: { tasks: task } } as any
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, task });
  } catch (error) {
    return NextResponse.json({ error: 'Error adding task' }, { status: 500 });
  }
}

// PATCH: Update a task's completed status
export async function PATCH(request: Request) {
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
    const { clientId, taskId, completed } = await request.json();
    if (!clientId || !taskId || typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'clientId, taskId and completed required' }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db('referradb');
    const result = await db.collection('clients').updateOne(
      { _id: new ObjectId(clientId), 'tasks._id': new ObjectId(taskId) },
      {
        $set: {
          'tasks.$.completed': completed,
          'tasks.$.completedBy': completed ? user.id : null,
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