import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { initializeMongoDBCollections } from '@/lib/init-mongodb';

const USERS_COLLECTION = 'users';
const CONVERSATIONS_COLLECTION = 'conversations';
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

export async function GET(request: Request) {
  try {
    // Get the authenticated session
    const session = await getSession();
    if (!session || session.user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - requires admin access' }, { status: 401 });
    }

    // Initialize MongoDB collections
    await initializeMongoDBCollections();
    
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Check if there are already conversations
    const existingConversations = await db.collection(CONVERSATIONS_COLLECTION).countDocuments({});
    
    if (existingConversations > 0) {
      return NextResponse.json({ 
        message: `MongoDB already has ${existingConversations} conversations. No initialization needed.`,
        initialized: false
      });
    }
    
    // Find some existing users to work with
    const users = await db.collection(USERS_COLLECTION).find({}).limit(5).toArray();
    
    if (users.length < 2) {
      return NextResponse.json({ 
        error: 'Need at least 2 users to create sample conversations',
        initialized: false 
      }, { status: 400 });
    }

    // Create sample conversations and messages
    const now = new Date();
    const sampleData = createSampleData(users, now);
    
    // Insert the sample data
    if (sampleData.conversations.length > 0) {
      await db.collection(CONVERSATIONS_COLLECTION).insertMany(sampleData.conversations);
    }
    
    if (sampleData.messages.length > 0) {
      await db.collection(MESSAGES_COLLECTION).insertMany(sampleData.messages);
    }

    return NextResponse.json({
      message: 'MongoDB initialized with sample conversations and messages',
      initialized: true,
      stats: {
        conversations: sampleData.conversations.length,
        messages: sampleData.messages.length
      }
    });
    
  } catch (error: any) {
    console.error('Error initializing MongoDB with sample data:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to initialize MongoDB with sample data',
      initialized: false
    }, { status: 500 });
  }
}

// Helper to create sample data based on existing users
function createSampleData(users: any[], now: Date) {
  const conversations = [];
  const messages = [];
  
  // Create a direct conversation between the first two users
  if (users.length >= 2) {
    const conversationId = users[0]._id.toString();
    
    const directConversation: any = {
      _id: conversationId,
      name: `Chat with ${users[1].name || 'User'}`,
      type: 'direct',
      participants: [
        {
          userId: users[0]._id.toString(),
          name: users[0].name || 'User 1',
          avatar: users[0].avatar,
          status: 'online',
          hasRead: true,
          role: users[0].role || 'case_manager'
        },
        {
          userId: users[1]._id.toString(),
          name: users[1].name || 'User 2',
          avatar: users[1].avatar,
          status: 'offline',
          hasRead: false,
          role: users[1].role || 'provider'
        }
      ],
      lastActivity: now,
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      updatedAt: now
    };
    
    conversations.push(directConversation);
    
    // Add some messages to this conversation
    const directMessages = [
      {
        conversationId: conversationId,
        content: "Hi there! I'd like to discuss a new referral.",
        timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        senderId: users[0]._id.toString(),
        senderName: users[0].name || 'User 1',
        senderAvatar: users[0].avatar,
        senderRole: users[0].role || 'case_manager',
        status: 'read',
        readBy: [users[0]._id.toString(), users[1]._id.toString()],
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        conversationId: conversationId,
        content: "Hello! I'd be happy to help. What kind of services are you looking for?",
        timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
        senderId: users[1]._id.toString(),
        senderName: users[1].name || 'User 2',
        senderAvatar: users[1].avatar,
        senderRole: users[1].role || 'provider',
        status: 'read',
        readBy: [users[0]._id.toString(), users[1]._id.toString()],
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000)
      },
      {
        conversationId: conversationId,
        content: "I have a client who needs housing assistance. They're currently looking for affordable options in the downtown area.",
        timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        senderId: users[0]._id.toString(),
        senderName: users[0].name || 'User 1',
        senderAvatar: users[0].avatar,
        senderRole: users[0].role || 'case_manager',
        status: 'read',
        readBy: [users[0]._id.toString(), users[1]._id.toString()],
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
      }
    ];
    
    messages.push(...directMessages);
    
    // Update the conversation with the last message
    const lastMessage = directMessages[directMessages.length - 1];
    directConversation.lastMessage = {
      content: lastMessage.content,
      timestamp: lastMessage.timestamp,
      senderId: lastMessage.senderId
    };
  }
  
  // Create a group conversation if there are enough users
  if (users.length >= 3) {
    const groupId = users[2]._id.toString();
    
    const groupConversation: any = {
      _id: groupId,
      name: 'Housing Assistance Team',
      type: 'group',
      participants: users.slice(0, 3).map((user, index) => ({
        userId: user._id.toString(),
        name: user.name || `User ${index + 1}`,
        avatar: user.avatar,
        status: index === 0 ? 'online' : 'offline',
        hasRead: index === 0,
        role: user.role || (index === 0 ? 'case_manager' : 'provider')
      })),
      description: 'Team dedicated to finding housing solutions for clients',
      lastActivity: now,
      createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      updatedAt: now
    };
    
    conversations.push(groupConversation);
    
    // Add messages to the group conversation
    const groupMessages = [
      {
        conversationId: groupId,
        content: "Welcome to the Housing Assistance Team channel! We'll be coordinating all our housing referrals here.",
        timestamp: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        senderId: users[0]._id.toString(),
        senderName: users[0].name || 'User 1',
        senderAvatar: users[0].avatar,
        senderRole: users[0].role || 'case_manager',
        status: 'read',
        readBy: users.slice(0, 3).map(u => u._id.toString()),
        createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
      },
      {
        conversationId: groupId,
        content: "Thanks for creating this channel! I'm looking forward to working together.",
        timestamp: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000),
        senderId: users[1]._id.toString(),
        senderName: users[1].name || 'User 2',
        senderAvatar: users[1].avatar,
        senderRole: users[1].role || 'provider',
        status: 'read',
        readBy: users.slice(0, 3).map(u => u._id.toString()),
        createdAt: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000)
      },
      {
        conversationId: groupId,
        content: "I've just added a new feature to our referral system. You can now attach documents directly to messages.",
        timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        senderId: users[2]._id.toString(),
        senderName: users[2].name || 'User 3',
        senderAvatar: users[2].avatar,
        senderRole: users[2].role || 'admin',
        status: 'delivered',
        formattedContent: true,
        readBy: [users[0]._id.toString(), users[2]._id.toString()],
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        conversationId: groupId,
        content: "That's great news! This will make sharing client information much easier.",
        timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        senderId: users[0]._id.toString(),
        senderName: users[0].name || 'User 1',
        senderAvatar: users[0].avatar,
        senderRole: users[0].role || 'case_manager',
        status: 'delivered',
        reactions: [
          {
            emoji: "👍",
            count: 2,
            userIds: [users[1]._id.toString(), users[2]._id.toString()]
          }
        ],
        readBy: [users[0]._id.toString(), users[2]._id.toString()],
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000)
      }
    ];
    
    messages.push(...groupMessages);
    
    // Update the conversation with the last message
    const lastMessage = groupMessages[groupMessages.length - 1];
    groupConversation.lastMessage = {
      content: lastMessage.content,
      timestamp: lastMessage.timestamp,
      senderId: lastMessage.senderId
    };
  }
  
  return { conversations, messages };
} 