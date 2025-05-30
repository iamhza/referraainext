import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const COLLECTION = 'messages';

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

// POST handler to add or remove a reaction
export async function POST(request: Request) {
  try {
    // Get the authenticated session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const { messageId, emoji } = body;
    
    // Validate required fields
    if (!messageId || !emoji) {
      return NextResponse.json({ error: 'Message ID and emoji are required' }, { status: 400 });
    }
    
    // Connect to the database
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Find the message
    const message = await db.collection(COLLECTION).findOne({ 
      _id: new ObjectId(messageId) 
    });
    
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    
    const userId = session.user.id;
    
    // Initialize reactions array if it doesn't exist
    if (!message.reactions) {
      message.reactions = [];
    }
    
    // Find the reaction with the given emoji
    const reactionIndex = message.reactions.findIndex(
      (r: any) => r.emoji === emoji
    );
    
    // User already reacted with this emoji and wants to remove it
    if (reactionIndex !== -1 && message.reactions[reactionIndex].userIds.includes(userId)) {
      // Create a modified copy of the reaction
      const updatedReaction = { ...message.reactions[reactionIndex] };
      updatedReaction.count -= 1;
      updatedReaction.userIds = updatedReaction.userIds.filter((id: string) => id !== userId);
      
      // Create a new reactions array
      let updatedReactions;
      
      if (updatedReaction.count <= 0) {
        // Remove the reaction entirely if count is zero
        updatedReactions = message.reactions.filter((r: any) => r.emoji !== emoji);
      } else {
        // Replace the reaction with the updated one
        updatedReactions = message.reactions.map((r: any) => 
          r.emoji === emoji ? updatedReaction : r
        );
      }
      
      // Update the document with the new reactions array
      await db.collection(COLLECTION).updateOne(
        { _id: new ObjectId(messageId) },
        { $set: { reactions: updatedReactions } }
      );
      
      return NextResponse.json({ 
        message: 'Reaction removed',
        added: false
      });
    } 
    // User hasn't reacted with this emoji yet
    else {
      let updatedReactions;
      
      if (reactionIndex !== -1) {
        // Reaction exists, increase count and add user
        updatedReactions = message.reactions.map((r: any) => {
          if (r.emoji === emoji) {
            return {
              ...r,
              count: r.count + 1,
              userIds: [...r.userIds, userId]
            };
          }
          return r;
        });
      } else {
        // Reaction doesn't exist, add new one
        updatedReactions = [
          ...message.reactions,
          {
            emoji,
            count: 1,
            userIds: [userId]
          }
        ];
      }
      
      // Update the document with the new reactions array
      await db.collection(COLLECTION).updateOne(
        { _id: new ObjectId(messageId) },
        { $set: { reactions: updatedReactions } }
      );
      
      return NextResponse.json({ 
        message: 'Reaction added',
        added: true
      });
    }
  } catch (error: any) {
    console.error('Error handling reaction:', error);
    return NextResponse.json({ error: error.message || 'Failed to process reaction' }, { status: 500 });
  }
} 