import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-minimal';
import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = params.id;
    if (!ObjectId.isValid(clientId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const body = await request.json();
    const { content, type = 'general', contextId, contextType } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);

    // Verify client exists and user has access
    const clientDoc = await db.collection('clients').findOne({
      _id: new ObjectId(clientId)
    });

    if (!clientDoc) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Create comment document
    const comment = {
      clientId: new ObjectId(clientId),
      content: content.trim(),
      type,
      contextId: contextId ? new ObjectId(contextId) : null,
      contextType: contextType || null,
      authorId: session.user.id,
      authorName: session.user.name || 'Unknown',
      authorRole: session.user.role || 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('client_comments').insertOne(comment);

    // Create timeline event
    await db.collection('client_timeline').insertOne({
      clientId: new ObjectId(clientId),
      type: 'comment',
      title: 'Comment Added',
      description: content.trim().substring(0, 100) + (content.length > 100 ? '...' : ''),
      userId: session.user.id,
      userName: session.user.name || 'Unknown',
      metadata: {
        commentId: result.insertedId,
        commentType: type
      },
      createdAt: new Date()
    });

    // HIPAA audit log
    console.log(`[HIPAA AUDIT] comment_added on client ${clientId} by ${session.user.id}`);

    return NextResponse.json({
      success: true,
      comment: {
        ...comment,
        _id: result.insertedId
      }
    });

  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = params.id;
    if (!ObjectId.isValid(clientId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);

    // Verify client exists
    const clientDoc = await db.collection('clients').findOne({
      _id: new ObjectId(clientId)
    });

    if (!clientDoc) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const comments = await db.collection('client_comments')
      .find({ clientId: new ObjectId(clientId) })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ comments });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}




