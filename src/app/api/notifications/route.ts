/**
 * Notifications API
 * Handles fetching and managing user notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type'); // 'update_request', 'referral', 'message', etc.

    const client = await clientPromise;
    const db = client.db('referradb');

    // Build query
    const query: any = { userId: user.id };
    if (unreadOnly) {
      query.read = false;
    }
    if (type) {
      query.type = type;
    }

    // Fetch notifications
    const notifications = await db.collection('notifications')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    // Get unread count
    const unreadCount = await db.collection('notifications')
      .countDocuments({ userId: user.id, read: false });

    return NextResponse.json({
      notifications: notifications.map(notification => ({
        id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        referralId: notification.referralId,
        clientId: notification.clientId,
        requestedBy: notification.requestedBy,
        createdAt: notification.createdAt,
        read: notification.read,
        priority: notification.priority || 'normal'
      })),
      unreadCount,
      total: notifications.length
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch notifications' 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, markAsRead = true } = body;

    const client = await clientPromise;
    const db = client.db('referradb');

    let query: any = { userId: user.id };
    
    if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications
      query._id = { $in: notificationIds.map((id: string) => new ObjectId(id)) };
    }
    // If no specific IDs, mark all user's notifications

    const result = await db.collection('notifications').updateMany(
      query,
      { $set: { read: markAsRead, readAt: new Date().toISOString() } }
    );

    return NextResponse.json({
      success: true,
      message: `Marked ${result.modifiedCount} notification${result.modifiedCount !== 1 ? 's' : ''} as ${markAsRead ? 'read' : 'unread'}`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ 
      error: 'Failed to update notifications' 
    }, { status: 500 });
  }
}
