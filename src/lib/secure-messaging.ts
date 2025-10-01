'use server';

import clientPromise from './mongodb';
import { encryptMessage, decryptMessage, type EncryptedData } from './encryption';
import { createAuditLog, auditMessageSent, auditMessageRead } from './hipaa-audit';
import { ObjectId } from 'mongodb';

export interface SecureMessage {
  _id?: ObjectId;
  referralId: string;
  clientId: string;
  authorId: string;
  authorName: string;
  authorType: 'case_manager' | 'provider' | 'admin';
  
  // Encrypted content
  encryptedContent: EncryptedData;
  
  // Non-encrypted metadata
  category: string;
  priority: string;
  isInternal: boolean;
  
  // Read tracking for HIPAA compliance
  readBy: Array<{
    userId: string;
    readAt: Date;
    ipAddress?: string;
  }>;
  
  // HIPAA metadata
  retentionDate: Date; // When this message should be deleted
  createdAt: Date;
  updatedAt: Date;
}

export async function createSecureMessage(data: {
  referralId: string;
  clientId: string;
  authorId: string;
  authorName: string;
  authorType: 'case_manager' | 'provider' | 'admin';
  content: string;
  category: string;
  priority: string;
  isInternal: boolean;
}) {
  const client = await clientPromise;
  const db = client.db('referradb');
  
  // Encrypt the message content
  const encryptedContent = encryptMessage(data.content);
  
  // Calculate retention date (7 years for HIPAA compliance)
  const retentionDate = new Date();
  retentionDate.setFullYear(retentionDate.getFullYear() + 7);
  
  const secureMessage: Omit<SecureMessage, '_id'> = {
    referralId: data.referralId,
    clientId: data.clientId,
    authorId: data.authorId,
    authorName: data.authorName,
    authorType: data.authorType,
    encryptedContent,
    category: data.category,
    priority: data.priority,
    isInternal: data.isInternal,
    readBy: [], // Empty initially
    retentionDate,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const result = await db.collection('secure_messages').insertOne(secureMessage);
  
  // Audit log the message creation
  await auditMessageSent(data.authorId, data.authorType, result.insertedId.toString(), data.clientId);
  
  return {
    success: true,
    messageId: result.insertedId,
    message: 'Secure message created successfully'
  };
}

export async function getMessagesForReferral(referralId: string, userId: string, userRole: string) {
  const client = await clientPromise;
  const db = client.db('referradb');
  
  // Get encrypted messages
  const encryptedMessages = await db.collection('secure_messages')
    .find({ 
      referralId,
      // Don't show internal messages to users who didn't create them
      $or: [
        { isInternal: false },
        { isInternal: true, authorId: userId }
      ]
    })
    .sort({ createdAt: 1 })
    .toArray();
  
  // Decrypt messages and track reads
  const decryptedMessages = await Promise.all(
    encryptedMessages.map(async (msg) => {
      // Decrypt content
      const content = decryptMessage(msg.encryptedContent);
      
      // Check if user has read this message
      const hasRead = msg.readBy.some((read: any) => read.userId === userId);
      
      // If not read, mark as read and audit
      if (!hasRead) {
        await markMessageAsRead(msg._id.toString(), userId, userRole, msg.clientId);
      }
      
      return {
        _id: msg._id,
        referralId: msg.referralId,
        clientId: msg.clientId,
        authorId: msg.authorId,
        authorName: msg.authorName,
        authorType: msg.authorType,
        content, // Decrypted content
        category: msg.category,
        priority: msg.priority,
        isInternal: msg.isInternal,
        readBy: msg.readBy,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
        isRead: hasRead
      };
    })
  );
  
  return decryptedMessages;
}

export async function getMessagesForClient(clientId: string) {
  const client = await clientPromise;
  const db = client.db('referradb');
  
  // Get all messages for this client
  const messages = await db.collection('secure_messages')
    .find({ clientId })
    .sort({ createdAt: -1 })
    .limit(50) // Limit to last 50 messages
    .toArray();
  
  // Decrypt messages
  const decryptedMessages = await Promise.all(
    messages.map(async (msg) => {
      try {
        const decryptedContent = await decryptMessage(msg.encryptedContent);
        return {
          _id: msg._id,
          content: decryptedContent,
          authorId: msg.authorId,
          authorName: msg.authorName,
          authorType: msg.authorType,
          category: msg.category,
          priority: msg.priority,
          isInternal: msg.isInternal,
          createdAt: msg.createdAt,
          updatedAt: msg.updatedAt,
          readBy: msg.readBy || []
        };
      } catch (error) {
        console.error('Failed to decrypt message:', error);
        return {
          _id: msg._id,
          content: '[Message decryption failed]',
          authorId: msg.authorId,
          authorName: msg.authorName,
          authorType: msg.authorType,
          category: msg.category,
          priority: msg.priority,
          isInternal: msg.isInternal,
          createdAt: msg.createdAt,
          updatedAt: msg.updatedAt,
          readBy: msg.readBy || []
        };
      }
    })
  );
  
  return decryptedMessages;
}

export async function markMessageAsRead(messageId: string, userId: string, userRole: string, clientId: string) {
  const client = await clientPromise;
  const db = client.db('referradb');
  
  const readEntry = {
    userId,
    readAt: new Date(),
    ipAddress: 'tracked_separately' // We'll get this from headers in the API
  };
  
  await db.collection('secure_messages').updateOne(
    { 
      _id: new ObjectId(messageId),
      'readBy.userId': { $ne: userId } // Only add if not already read
    },
    { 
      $push: { readBy: readEntry },
      $set: { updatedAt: new Date() }
    }
  );
  
  // Audit log the read
  await auditMessageRead(userId, userRole, messageId, clientId);
}

export async function getUnreadMessageCount(userId: string, referralIds: string[]) {
  const client = await clientPromise;
  const db = client.db('referradb');
  
  // Count messages not read by this user
  const unreadCounts = await db.collection('secure_messages').aggregate([
    {
      $match: {
        referralId: { $in: referralIds },
        authorId: { $ne: userId }, // Don't count own messages
        'readBy.userId': { $ne: userId } // Not read by this user
      }
    },
    {
      $group: {
        _id: '$referralId',
        unreadCount: { $sum: 1 }
      }
    }
  ]).toArray();
  
  // Convert to easy lookup object
  const unreadMap: { [referralId: string]: number } = {};
  unreadCounts.forEach(item => {
    unreadMap[item._id] = item.unreadCount;
  });
  
  return unreadMap;
}

// HIPAA compliance: Delete messages past retention date
export async function cleanupExpiredMessages() {
  const client = await clientPromise;
  const db = client.db('referradb');
  
  const result = await db.collection('secure_messages').deleteMany({
    retentionDate: { $lt: new Date() }
  });
  
  console.log(`[HIPAA CLEANUP] Deleted ${result.deletedCount} expired messages`);
  return result;
}
