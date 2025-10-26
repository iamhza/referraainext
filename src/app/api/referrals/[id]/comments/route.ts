import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import clientPromise from '@/lib/mongodb/client';
import { validateCommentData, validateObjectId, validateRequestSize } from '@/lib/shared/validation';
import { createSecureMessage, getMessagesForReferral } from '@/lib/services/messaging';
import { auditConversationAccess } from '@/lib/audit/hipaa';

// Comment categories for better organization
type CommentCategory = 'status' | 'request' | 'progress' | 'issue' | 'platform_admin';
type CommentPriority = 'normal' | 'important' | 'urgent';

// GET: Fetch all comments for a referral
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const client = await clientPromise;
    const db = client.db('referradb');
    
    let referralObjectId;
    try {
      referralObjectId = validateObjectId(params.id);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid referral ID' }, { status: 400 });
    }

    const referral = await db.collection('referrals').findOne({ _id: referralObjectId });
    
    if (!referral) {
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    }
    
    // Check permissions - case manager, assigned provider, or admin can view
    const userRole = user.role;
    const userId = user.id;
    
    const canView = 
      userRole === 'platform_admin' || 
      (userRole === 'case_manager' && referral.caseManagerId === userId) ||
      (userRole === 'provider' && referral.providerId === userId);
    
    if (!canView) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    
    // Audit log the conversation access
    await auditConversationAccess(userId, userRole, params.id, referral.clientInfo?._id || 'unknown');
    
    // Get secure messages instead of old comments
    const secureMessages = await getMessagesForReferral(params.id, userId, userRole);
    
    // Convert to old comment format for backward compatibility
    const comments = secureMessages.map(msg => ({
      _id: msg._id,
      authorId: msg.authorId,
      authorName: msg.authorName,
      authorType: msg.authorType,
      authorRole: msg.authorType, // backward compatibility
      content: msg.content,
      text: msg.content, // backward compatibility
      category: msg.category,
      priority: msg.priority,
      isInternal: msg.isInternal,
      createdAt: msg.createdAt,
      status: 'delivered',
      readBy: msg.readBy
    }));
    
    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Error fetching comments' }, { status: 500 });
  }
}

// POST: Add a new comment to a referral
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate request size
    const contentLength = parseInt(request.headers.get('content-length') || '0');
    try {
      validateRequestSize(contentLength);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Request too large' }, { status: 413 });
    }

    // Parse and validate request body
    let rawData;
    try {
      rawData = await request.json();
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Support backward compatibility with 'text' field
    if (rawData.text && !rawData.content) {
      rawData.content = rawData.text;
    }

    // Validate and sanitize comment data
    let commentData;
    try {
      commentData = validateCommentData(rawData);
    } catch (validationError) {
      return NextResponse.json({ 
        error: validationError instanceof Error ? validationError.message : 'Invalid comment data' 
      }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Validate referral ID
    let referralObjectId;
    try {
      referralObjectId = validateObjectId(params.id);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid referral ID' }, { status: 400 });
    }
    
    // Get the referral to check permissions and get provider info
    const referral = await db.collection('referrals').findOne({ _id: referralObjectId });
    
    if (!referral) {
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    }
    
    // Check permissions - case manager, assigned provider, or admin can comment
    const userRole = user.role;
    const userId = user.id;
    
    const canComment = 
      userRole === 'platform_admin' || 
      (userRole === 'case_manager' && referral.caseManagerId === userId) ||
      (userRole === 'provider' && referral.providerId === userId);
    
    if (!canComment) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    
    // Get author name from user email
    const authorName = user.email?.split('@')[0] || 'Unknown User';
    
    // Validate parentId if provided (for threading)
    if (commentData.parentId) {
      try {
        // Check if parent comment exists in this referral
        const parentExists = await db.collection('referrals').findOne({
          _id: referralObjectId,
          'comments._id': new ObjectId(commentData.parentId)
        });
        
        if (!parentExists) {
          return NextResponse.json({ error: 'Parent comment not found' }, { status: 400 });
        }
      } catch (error) {
        return NextResponse.json({ error: 'Invalid parent comment ID' }, { status: 400 });
      }
    }

    // Use secure messaging system instead of direct database insertion
    const authorType = userRole === 'platform_admin' ? 'admin' : userRole as 'case_manager' | 'provider';
    const result = await createSecureMessage({
      referralId: params.id,
      clientId: referral.clientInfo?._id || 'unknown',
      authorId: user.id,
      authorName,
      authorType,
      content: commentData.content,
      category: commentData.category,
      priority: commentData.priority,
      isInternal: commentData.isInternal || false
    });
    
    if (!result.success) {
      return NextResponse.json({ error: 'Failed to create secure message' }, { status: 500 });
    }
    
    // Create backward-compatible response
    const comment = {
      _id: result.messageId,
      authorId: user.id,
      authorType: userRole as 'case_manager' | 'provider' | 'platform_admin',
      authorName,
      category: commentData.category as CommentCategory,
      content: commentData.content,
      priority: commentData.priority as CommentPriority,
      createdAt: new Date().toISOString(),
      metadata: commentData.metadata,
      parentId: commentData.parentId || null,
      isInternal: commentData.isInternal || false,
      status: 'sent' as 'sending' | 'sent' | 'delivered' | 'read' | 'error',
      readBy: [] as Array<{
        userId: string;
        userName: string;
        readAt: string;
      }>,
      authorRole: userRole,
      text: commentData.content
    };
    
    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: 'Error adding comment' }, { status: 500 });
  }
} 

// PUT: Edit an existing comment
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      commentId, 
      content, 
      category,
      priority 
    } = await request.json();

    if (!commentId || !content?.trim()) {
      return NextResponse.json({ error: 'Comment ID and content required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Get the referral and find the specific comment
    const referral = await db.collection('referrals').findOne({ 
      _id: new ObjectId(params.id),
      'comments._id': new ObjectId(commentId)
    });

    if (!referral) {
      return NextResponse.json({ error: 'Referral or comment not found' }, { status: 404 });
    }

    // Find the specific comment to check ownership
    const comment = referral.comments.find((c: any) => c._id.toString() === commentId);
    
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check permissions - only comment author or admin can edit
    const userRole = user.role;
    const userId = user.id;
    
    const canEdit = 
      userRole === 'platform_admin' || 
      comment.authorId === userId;
    
    if (!canEdit) {
      return NextResponse.json({ error: 'Permission denied - can only edit your own comments' }, { status: 403 });
    }

    // Update the comment
    const result = await db.collection('referrals').updateOne(
      { 
        _id: new ObjectId(params.id),
        'comments._id': new ObjectId(commentId)
      },
      { 
        $set: {
          'comments.$.content': content,
          'comments.$.category': category || comment.category,
          'comments.$.priority': priority || comment.priority,
          'comments.$.editedAt': new Date().toISOString(),
          'comments.$.text': content, // Backward compatibility
          updatedAt: new Date().toISOString()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Comment updated successfully' });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Error updating comment' }, { status: 500 });
  }
}

// DELETE: Delete an existing comment
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const commentId = url.searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Get the referral and find the specific comment
    const referral = await db.collection('referrals').findOne({ 
      _id: new ObjectId(params.id),
      'comments._id': new ObjectId(commentId)
    });

    if (!referral) {
      return NextResponse.json({ error: 'Referral or comment not found' }, { status: 404 });
    }

    // Find the specific comment to check ownership
    const comment = referral.comments.find((c: any) => c._id.toString() === commentId);
    
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check permissions - only comment author or admin can delete
    const userRole = user.role;
    const userId = user.id;
    
    const canDelete = 
      userRole === 'platform_admin' || 
      comment.authorId === userId;
    
    if (!canDelete) {
      return NextResponse.json({ error: 'Permission denied - can only delete your own comments' }, { status: 403 });
    }

    // Check if this comment has replies - if so, don't allow deletion
    const hasReplies = referral.comments.some((c: any) => c.parentId === commentId);
    
    if (hasReplies) {
      return NextResponse.json({ 
        error: 'Cannot delete comment with replies. Delete replies first.' 
      }, { status: 400 });
    }

    // Delete the comment
    const result = await db.collection('referrals').updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $pull: { comments: { _id: new ObjectId(commentId) } },
        $set: { updatedAt: new Date().toISOString() }
      } as any
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Error deleting comment' }, { status: 500 });
  }
} 