import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const COLLECTION = 'conversations';
const MESSAGES_COLLECTION = 'messages';

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

// GET handler to fetch conversations for the current user
export async function GET(request: Request) {
  try {
    // Get the authenticated session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'direct' or 'group'
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    
    // Connect to the database
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Prepare query filters
    const userId = session.user.id;
    const query: any = {
      'participants.userId': userId
    };
    
    if (type) {
      query.type = type;
    }
    
    // Fetch conversations
    const conversations = await db.collection(COLLECTION)
      .find(query)
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
      
    // Enrich conversations with extra data like unread count
    const enrichedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        // Get unread count
        const unreadCount = await db.collection(MESSAGES_COLLECTION).countDocuments({
          conversationId: conversation._id,
          senderId: { $ne: userId },
          readBy: { $nin: [userId] }
        });
        
        // Format participants
        const formattedParticipants = conversation.participants.map((p: any) => ({
          id: p.userId,
          name: p.name,
          avatar: p.avatar,
          status: p.status,
          role: p.role,
          lastActive: p.lastActive,
          title: p.title
        }));
        
        // Return formatted conversation
        return {
          id: conversation._id.toString(),
          name: conversation.name,
          avatar: conversation.avatar,
          lastMessage: conversation.lastMessage ? {
            content: conversation.lastMessage.content,
            timestamp: conversation.lastMessage.timestamp,
            senderId: conversation.lastMessage.senderId
          } : null,
          unreadCount,
          type: conversation.type,
          participants: formattedParticipants,
          lastActivity: conversation.lastActivity,
          isPinned: conversation.isPinned,
          isMuted: conversation.isMuted,
          description: conversation.description,
          createdAt: conversation.createdAt,
          messages: [] // Will be populated when opening a conversation
        };
      })
    );
    
    return NextResponse.json({ conversations: enrichedConversations });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch conversations' }, { status: 500 });
  }
}

// POST handler to create a new conversation
export async function POST(request: Request) {
  try {
    // Get the authenticated session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const { name, type, participantIds, description } = body;
    
    // Validate required fields
    if (!name || !type || !participantIds || !Array.isArray(participantIds)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Connect to the database
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Check if this is a direct message between two users
    if (type === 'direct' && participantIds.length === 1) {
      // For DMs, check if a conversation already exists between these users
      const existingConversation = await db.collection(COLLECTION).findOne({
        type: 'direct',
        'participants.userId': {
          $all: [
            session.user.id,
            participantIds[0]
          ]
        }
      });
      
      if (existingConversation) {
        return NextResponse.json({
          message: 'Conversation already exists',
          conversationId: existingConversation._id
        }, { status: 200 });
      }
    }
    
    // Create participants array
    const participants = await createParticipantsArray(session.user, participantIds);
    
    // Create the new conversation
    const now = new Date();
    const newConversation = {
      name,
      type,
      participants,
      description,
      createdBy: session.user.id,
      lastActivity: now,
      createdAt: now,
      updatedAt: now
    };
    
    const result = await db.collection(COLLECTION).insertOne(newConversation);
    
    return NextResponse.json({
      message: 'Conversation created successfully',
      conversationId: result.insertedId
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: error.message || 'Failed to create conversation' }, { status: 500 });
  }
}

// Helper function to create participants array
async function createParticipantsArray(currentUser: any, participantIds: string[]) {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    const participants = [];
    
    // Add current user
    participants.push({
      userId: currentUser.id,
      name: currentUser.user_metadata?.name || 'Current User',
      status: 'online',
      hasRead: true,
      role: currentUser.user_metadata?.role || 'user',
    });
    
    // Add other participants
    // In a real implementation, you'd fetch user details
    for (const pId of participantIds) {
      // Use username or email instead of _id for lookup
      // This avoids ObjectId conversion issues
      const user = await db.collection('users').findOne({ 
        $or: [
          { id: pId },
          { user_id: pId },
          { auth_id: pId }
        ]
      });
      
      participants.push({
        userId: pId,
        name: user?.name || user?.email || `User ${pId.substring(0, 5)}`,
        status: 'offline',
        hasRead: false,
        role: user?.role || 'user',
      });
    }
    
    return participants;
  } catch (error) {
    console.error('Error creating participants array:', error);
    throw error;
  }
} 