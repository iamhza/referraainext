import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import { createSecureMessage, getMessagesForClient } from '@/lib/services/messaging';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = params.id;
    if (!clientId) {
      return NextResponse.json({ error: 'Client ID required' }, { status: 400 });
    }

    // Get secure messages for this client
    const messages = await getMessagesForClient(clientId);

    return NextResponse.json({ 
      success: true, 
      messages,
      count: messages.length
    });

  } catch (error) {
    console.error('Error fetching client messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = params.id;
    if (!clientId) {
      return NextResponse.json({ error: 'Client ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { content, category = 'general' } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message content required' }, { status: 400 });
    }

    // Determine author info based on user role
    const authorName = user.email?.split('@')[0] || 'Unknown';
    const authorType = user.role === 'case_manager' ? 'case_manager' : 
                      user.role === 'provider' ? 'provider' : 'admin';

    // Create secure message
    const messageId = await createSecureMessage({
      clientId,
      content: content.trim(),
      authorId: user.id,
      authorName,
      authorType,
      category,
      referralId: null, // This is client-specific, not referral-specific
      metadata: {
        source: 'client_workspace',
        timestamp: new Date().toISOString()
      }
    });

    // TODO: Create notification for providers if this is a case manager message
    // This would integrate with the notifications system

    return NextResponse.json({ 
      success: true, 
      messageId,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
