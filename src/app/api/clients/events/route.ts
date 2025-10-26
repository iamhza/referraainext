import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb/client';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import { ObjectId } from 'mongodb';
import type { RelationshipEvent } from '@/types';

const COLLECTION = 'clientEvents';



// Get events for a client
export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user || !['case_manager', 'platform_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('clientId');
  
  if (!clientId) {
    return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
  }
  
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Get events sorted by date descending (newest first)
    const events = await db.collection(COLLECTION)
      .find({ clientId })
      .sort({ date: -1 })
      .toArray();
    
    // Add isRecent flag for events in the last 3 days
    const threesDaysAgo = new Date();
    threesDaysAgo.setDate(threesDaysAgo.getDate() - 3);
    
    const formattedEvents = events.map(event => {
      const eventDate = new Date(event.date);
      return {
        ...event,
        isRecent: eventDate > threesDaysAgo
      };
    });
    
    return NextResponse.json({ events: formattedEvents });
  } catch (error) {
    console.error('Error fetching client events:', error);
    return NextResponse.json({ error: 'Failed to fetch client events' }, { status: 500 });
  }
}

// Create a new event
export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user || !['case_manager', 'platform_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const eventData = await req.json();
    
    // Validate required fields
    if (!eventData.clientId || !eventData.type || !eventData.title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Set default date to now if not provided
    if (!eventData.date) {
      eventData.date = new Date().toISOString();
    }
    
    const result = await db.collection(COLLECTION).insertOne({
      ...eventData,
      createdAt: new Date().toISOString()
    });
    
    return NextResponse.json({ 
      success: true, 
      event: { 
        _id: result.insertedId, 
        ...eventData 
      } 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating client event:', error);
    return NextResponse.json({ error: 'Failed to create client event' }, { status: 500 });
  }
}

// Update an event
export async function PATCH(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user || !['case_manager', 'platform_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { id, ...updateData } = await req.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db('referradb');
    
    const result = await db.collection(COLLECTION).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: {
          ...updateData,
          updatedAt: new Date().toISOString()
        } 
      },
      { returnDocument: 'after' }
    );
    
    if (!result || !result.value) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    return NextResponse.json({ event: result.value });
  } catch (error) {
    console.error('Error updating client event:', error);
    return NextResponse.json({ error: 'Failed to update client event' }, { status: 500 });
  }
}

// Delete an event
export async function DELETE(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user || !['case_manager', 'platform_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { id } = await req.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db('referradb');
    
    const result = await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
    
    if (!result || result.deletedCount === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting client event:', error);
    return NextResponse.json({ error: 'Failed to delete client event' }, { status: 500 });
  }
} 