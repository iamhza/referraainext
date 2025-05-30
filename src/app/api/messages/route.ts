import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const COLLECTION = 'messages';
const CONVERSATIONS_COLLECTION = 'conversations';

async function getSession() {
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
  return session;
}

// GET handler to fetch messages for a specific conversation
export async function GET(request: Request) {
  try {
    // Get the authenticated session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const threadId = searchParams.get('threadId'); // Optional for threaded messages
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    
    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }
    
    // Connect to the database
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Check if user is part of the conversation
    const conversation = await db.collection(CONVERSATIONS_COLLECTION).findOne({
      _id: new ObjectId(conversationId),
      'participants.userId': session.user.id
    });
    
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }
    
    // Prepare query filters
    const query: any = {
      conversationId: new ObjectId(conversationId)
    };
    
    // If threadId is provided, fetch messages in that thread
    // Otherwise, fetch only main messages (without threadId)
    if (threadId) {
      query.threadId = new ObjectId(threadId);
    } else {
      query.threadId = { $exists: false };
    }
    
    // Fetch messages
    const messages = await db.collection(COLLECTION)
      .find(query)
      .sort({ timestamp: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Mark messages as read by the current user
    await db.collection(COLLECTION).updateMany(
      {
        _id: { $in: messages.map(m => m._id) },
        senderId: { $ne: session.user.id },
        readBy: { $nin: [session.user.id] }
      },
      { $addToSet: { readBy: session.user.id } }
    );
    
    // Format messages for the client
    const formattedMessages = messages.map((message) => ({
      id: message._id.toString(),
      content: message.content,
      timestamp: message.timestamp,
      senderId: message.senderId,
      senderName: message.senderName,
      senderAvatar: message.senderAvatar,
      senderRole: message.senderRole,
      isOwn: message.senderId === session.user.id,
      status: message.status,
      reactions: message.reactions?.map((r: { emoji: string; count: number; userIds: string[] }) => ({
        emoji: r.emoji,
        count: r.count,
        userIds: r.userIds
      })),
      hasThread: message.hasThread,
      threadCount: message.threadCount,
      formattedContent: message.formattedContent,
      attachments: message.attachments?.map((a: { 
        _id?: { toString(): string }; 
        id?: string; 
        type: string; 
        name: string; 
        url: string; 
        size?: string 
      }) => ({
        id: a._id?.toString() || a.id,
        type: a.type,
        name: a.name,
        url: a.url,
        size: a.size
      }))
    }));
    
    // Update conversation to mark as read for the current user
    await db.collection(CONVERSATIONS_COLLECTION).updateOne(
      { _id: new ObjectId(conversationId) },
      { 
        $set: { 
          'participants.$[elem].hasRead': true 
        } 
      },
      { 
        arrayFilters: [{ 'elem.userId': session.user.id }] 
      }
    );
    
    return NextResponse.json({ messages: formattedMessages });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST handler to create a new message
export async function POST(request: Request) {
  try {
    // Get the authenticated session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const { conversationId, content, threadId, attachments } = body;
    
    // Validate required fields
    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }
    
    if (!content && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: 'Message content or attachments are required' }, { status: 400 });
    }
    
    // Connect to the database
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Check if user is part of the conversation
    const conversation = await db.collection(CONVERSATIONS_COLLECTION).findOne({
      _id: new ObjectId(conversationId),
      'participants.userId': session.user.id
    });
    
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }
    
    // If this is a thread reply, check if the parent message exists
    if (threadId) {
      const parentMessage = await db.collection(COLLECTION).findOne({ _id: new ObjectId(threadId) });
      
      if (!parentMessage) {
        return NextResponse.json({ error: 'Parent message not found' }, { status: 404 });
      }
      
      // Update the parent message's thread count
      await db.collection(COLLECTION).updateOne(
        { _id: new ObjectId(threadId) },
        { 
          $inc: { threadCount: 1 },
          $set: { hasThread: true }
        }
      );
    }
    
    // Determine if content should be formatted
    const hasFormatting = content && (
      content.includes('*') || 
      content.includes('_') || 
      content.includes('`')
    );
    
    // Create the new message
    const now = new Date();
    const newMessage = {
      conversationId: new ObjectId(conversationId),
      threadId: threadId ? new ObjectId(threadId) : undefined,
      content,
      timestamp: now,
      senderId: session.user.id,
      senderName: session.user.user_metadata?.name || 'User',
      senderAvatar: session.user.user_metadata?.avatar,
      senderRole: session.user.user_metadata?.role || 'user',
      status: 'sent',
      formattedContent: hasFormatting,
      attachments: attachments ? processAttachments(attachments) : [],
      readBy: [session.user.id], // Sender has already read the message
      createdAt: now,
      updatedAt: now
    };
    
    const result = await db.collection(COLLECTION).insertOne(newMessage);
    
    // Update conversation's last message and activity
    await db.collection(CONVERSATIONS_COLLECTION).updateOne(
      { _id: new ObjectId(conversationId) },
      { 
        $set: { 
          lastMessage: {
            content,
            timestamp: now,
            senderId: session.user.id
          },
          lastActivity: now,
          'participants.$[elem].hasRead': false,
          updatedAt: now
        } 
      },
      { 
        // Update for all participants except the sender
        arrayFilters: [{ 'elem.userId': { $ne: session.user.id } }]
      }
    );
    
    // Format the message response
    const formattedMessage = {
      id: result.insertedId.toString(),
      content: newMessage.content,
      timestamp: newMessage.timestamp,
      senderId: newMessage.senderId,
      senderName: newMessage.senderName,
      senderAvatar: newMessage.senderAvatar,
      senderRole: newMessage.senderRole,
      isOwn: true,
      status: newMessage.status,
      formattedContent: newMessage.formattedContent,
      attachments: newMessage.attachments?.map((a) => ({
        id: a.id || 'temp-id',
        type: a.type,
        name: a.name,
        url: a.url,
        size: a.size
      }))
    };
    
    return NextResponse.json({ 
      message: 'Message sent successfully',
      messageData: formattedMessage
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: error.message || 'Failed to send message' }, { status: 500 });
  }
}

// Helper function to process attachments
function processAttachments(attachmentsData: any[]) {
  // In a real app, you would handle file uploads with a service like S3
  // For now, we'll just format the attachment data
  return attachmentsData.map(attachment => ({
    id: attachment.id || new ObjectId().toString(),
    type: attachment.type || 'document',
    name: attachment.name,
    url: attachment.url || '/api/mock-file-url',
    size: attachment.size,
    mimeType: attachment.mimeType,
    createdAt: new Date()
  }));
} 