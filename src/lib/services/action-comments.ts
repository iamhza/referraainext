'use server';

import clientPromise from '../mongodb/client';
import { encryptMessage, decryptMessage, type EncryptedData } from '../shared/encryption';
import { createAuditLog, auditMessageSent, auditMessageRead } from '../audit/hipaa';
import { ObjectId } from 'mongodb';

export interface SecureActionComment {
  _id?: ObjectId;
  actionId: string;
  clientId: string;
  referralId?: string; // Optional - for referral-context actions
  parentId?: string; // Optional - for threaded replies
  
  // Author information
  authorId: string;
  authorName: string;
  authorType: 'case_manager' | 'provider' | 'admin';
  
  // Encrypted content (may contain PHI)
  encryptedContent: EncryptedData;
  
  // HIPAA compliance metadata
  readBy: Array<{
    userId: string;
    readAt: Date;
    ipAddress?: string;
  }>;
  
  // Retention and audit
  retentionDate: Date; // 7 years for HIPAA compliance
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a secure, encrypted action comment
 */
export async function createSecureActionComment(data: {
  actionId: string;
  clientId: string;
  referralId?: string;
  parentId?: string;
  authorId: string;
  authorName: string;
  authorType: 'case_manager' | 'provider' | 'admin';
  content: string;
}) {
  const client = await clientPromise;
  const db = client.db('referradb');
  
  // Encrypt the comment content (may contain PHI)
  const encryptedContent = encryptMessage(data.content);
  
  // Calculate retention date (7 years for HIPAA compliance)
  const retentionDate = new Date();
  retentionDate.setFullYear(retentionDate.getFullYear() + 7);
  
  const secureComment: Omit<SecureActionComment, '_id'> = {
    actionId: data.actionId,
    clientId: data.clientId,
    referralId: data.referralId,
    parentId: data.parentId,
    authorId: data.authorId,
    authorName: data.authorName,
    authorType: data.authorType,
    encryptedContent,
    readBy: [], // Empty initially
    retentionDate,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const result = await db.collection('secure_action_comments').insertOne(secureComment);
  
  // Audit log the comment creation
  await createAuditLog({
    userId: data.authorId,
    userRole: data.authorType,
    action: 'action_comment_created',
    resourceType: 'action_comment',
    resourceId: result.insertedId.toString(),
    success: true,
    details: {
      actionId: data.actionId,
      clientId: data.clientId,
      referralId: data.referralId,
      contentLength: data.content.length
    }
  });
  
  return {
    success: true,
    commentId: result.insertedId,
    message: 'Secure action comment created successfully'
  };
}

/**
 * Get decrypted comments for an action
 */
export async function getSecureActionComments(actionId: string, userId: string, userRole: string) {
  const client = await clientPromise;
  const db = client.db('referradb');
  
  // Get encrypted comments
  const encryptedComments = await db.collection('secure_action_comments')
    .find({ actionId })
    .sort({ createdAt: 1 })
    .toArray();
  
  // Decrypt comments and track reads
  const decryptedComments = await Promise.all(
    encryptedComments.map(async (comment) => {
      try {
        // Decrypt content
        const content = decryptMessage(comment.encryptedContent);
        
        // Check if user has read this comment
        const hasRead = comment.readBy.some((read: any) => read.userId === userId);
        
        // If not read, mark as read and audit
        if (!hasRead) {
          await markActionCommentAsRead(comment._id.toString(), userId, userRole, comment.clientId);
        }
        
        return {
          _id: comment._id.toString(),
          actionId: comment.actionId,
          clientId: comment.clientId,
          referralId: comment.referralId,
          parentId: comment.parentId, // Include parentId for threading
          authorId: comment.authorId,
          authorName: comment.authorName,
          authorType: comment.authorType,
          content, // Decrypted content
          readBy: comment.readBy,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          isRead: hasRead
        };
      } catch (error) {
        console.error('Failed to decrypt action comment:', error);
        return {
          _id: comment._id.toString(),
          actionId: comment.actionId,
          clientId: comment.clientId,
          referralId: comment.referralId,
          parentId: comment.parentId, // Include parentId for threading
          authorId: comment.authorId,
          authorName: comment.authorName,
          authorType: comment.authorType,
          content: '[Comment decryption failed - contact administrator]',
          readBy: comment.readBy,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          isRead: false
        };
      }
    })
  );
  
  return decryptedComments;
}

/**
 * Delete a secure action comment
 */
export async function deleteSecureActionComment(commentId: string, userId: string, userRole: string) {
  const client = await clientPromise;
  const db = client.db('referradb');
  
  try {
    // Find the comment to check permissions
    const comment = await db.collection('secure_action_comments').findOne({
      _id: new ObjectId(commentId)
    });
    
    if (!comment) {
      return {
        success: false,
        message: 'Comment not found',
        statusCode: 404
      };
    }
    
    // Check permissions - only comment author or admin can delete
    const canDelete = 
      userRole === 'platform_admin' || 
      comment.authorId === userId;
    
    if (!canDelete) {
      return {
        success: false,
        message: 'Permission denied - can only delete your own comments',
        statusCode: 403
      };
    }
    
    // Check if this comment has replies - if so, don't allow deletion
    const hasReplies = await db.collection('secure_action_comments').findOne({
      parentId: commentId
    });
    
    if (hasReplies) {
      return {
        success: false,
        message: 'Cannot delete comment with replies. Delete replies first.',
        statusCode: 400
      };
    }
    
    // Delete the comment
    const result = await db.collection('secure_action_comments').deleteOne({
      _id: new ObjectId(commentId)
    });
    
    if (result.deletedCount === 0) {
      return {
        success: false,
        message: 'Failed to delete comment',
        statusCode: 500
      };
    }
    
    // Audit log the comment deletion
    await createAuditLog({
      userId,
      userRole,
      action: 'action_comment_deleted',
      resourceType: 'action_comment',
      resourceId: commentId,
      success: true,
      details: {
        actionId: comment.actionId,
        clientId: comment.clientId,
        referralId: comment.referralId
      }
    });
    
    return {
      success: true,
      message: 'Comment deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting secure action comment:', error);
    return {
      success: false,
      message: 'Failed to delete comment',
      statusCode: 500
    };
  }
}

/**
 * Mark an action comment as read (HIPAA audit trail)
 */
export async function markActionCommentAsRead(commentId: string, userId: string, userRole: string, clientId: string) {
  const client = await clientPromise;
  const db = client.db('referradb');
  
  const readEntry = {
    userId,
    readAt: new Date(),
    ipAddress: 'tracked_separately' // Will be populated from API headers
  };
  
  await db.collection('secure_action_comments').updateOne(
    { 
      _id: new ObjectId(commentId),
      'readBy.userId': { $ne: userId } // Only add if not already read
    },
    { 
      $push: { readBy: readEntry },
      $set: { updatedAt: new Date() }
    }
  );
  
  // Audit log the read
  await createAuditLog({
    userId,
    userRole,
    action: 'action_comment_read',
    resourceType: 'action_comment',
    resourceId: commentId,
    success: true,
    details: {
      clientId,
      readAt: readEntry.readAt
    }
  });
}

/**
 * Get comment count for an action (for UI display)
 */
export async function getActionCommentCount(actionId: string): Promise<number> {
  const client = await clientPromise;
  const db = client.db('referradb');
  
  const count = await db.collection('secure_action_comments').countDocuments({ actionId });
  return count;
}

/**
 * HIPAA compliance: Delete comments past retention date
 */
export async function cleanupExpiredActionComments() {
  const client = await clientPromise;
  const db = client.db('referradb');
  
  const result = await db.collection('secure_action_comments').deleteMany({
    retentionDate: { $lt: new Date() }
  });
  
  console.log(`[HIPAA CLEANUP] Deleted ${result.deletedCount} expired action comments`);
  return result;
}

/**
 * Migration helper: Move existing plain-text comments to secure storage
 */
export async function migrateActionCommentsToSecure() {
  const client = await clientPromise;
  const db = client.db('referradb');
  
  console.log('🔐 Starting migration of action comments to secure storage...');
  
  // Find all actions with comments
  const actionsWithComments = await db.collection('actions')
    .find({ 
      comments: { $exists: true, $ne: [], $not: { $size: 0 } }
    })
    .toArray();
  
  let migratedCount = 0;
  
  for (const action of actionsWithComments) {
    if (!action.comments || action.comments.length === 0) continue;
    
    for (const comment of action.comments) {
      try {
        // Create secure comment
        await createSecureActionComment({
          actionId: action._id.toString(),
          clientId: action.clientId,
          referralId: action.contextType === 'referral' ? action.contextId : undefined,
          authorId: comment.createdBy,
          authorName: comment.createdByName,
          authorType: comment.createdByRole,
          content: comment.content
        });
        
        migratedCount++;
      } catch (error) {
        console.error(`Failed to migrate comment ${comment._id}:`, error);
      }
    }
    
    // Remove old comments from action (keep as backup for now)
    await db.collection('actions').updateOne(
      { _id: action._id },
      { 
        $set: { 
          'comments_migrated': true,
          'comments_backup': action.comments,
          'comments': [] // Clear old comments
        }
      }
    );
  }
  
  console.log(`🔐 Migration complete: ${migratedCount} comments migrated to secure storage`);
  return { migratedCount };
}
