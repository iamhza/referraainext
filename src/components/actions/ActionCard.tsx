'use client';

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  Paperclip, 
  ChevronDown, 
  ChevronUp,
  User,
  FileText,
  Trash2,
  Calendar,
  Edit3,
  Reply,
  MoreHorizontal,
  X,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Action, ActionComment, ServiceContext } from '@/types/actions';

interface ActionCardProps {
  action: Action;
  context?: ServiceContext;
  onComplete?: (actionId: string) => void;
  onComment?: (actionId: string, comment: string, parentId?: string) => void;
  onCommentDeleted?: (updatedAction: Action) => void;
  onDelete?: (actionId: string) => void;
  hasROI?: boolean;
}

export function ActionCard({ 
  action, 
  context,
  onComplete, 
  onComment,
  onCommentDeleted,
  onDelete,
  hasROI = true 
}: ActionCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Comment editing and threading states
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [isAddingReply, setIsAddingReply] = useState(false);

  // Check if content should be masked due to ROI requirements
  const shouldMaskContent = action.requiresROI && !hasROI;

  const handleComplete = () => {
    if (onComplete) {
      onComplete(action._id);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !onComment) return;
    
    setIsAddingComment(true);
    try {
      await onComment(action._id, newComment.trim());
      setNewComment('');
      // Comments section will be updated by parent component
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editingContent.trim()) return;
    
    setIsEditingComment(true);
    try {
      // TODO: Implement edit comment API call
      // await editComment(action._id, commentId, editingContent.trim());
      setEditingCommentId(null);
      setEditingContent('');
      toast({
        title: "Comment Updated",
        description: "Your comment has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update comment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsEditingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/clients/${action.clientId}/actions/${action._id}/comments?commentId=${commentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete comment');
      }

      const updatedAction = await response.json();
      
      // Update the action in parent component with new comments
      if (onCommentDeleted) {
        onCommentDeleted(updatedAction);
      }
      
      toast({
        title: "Comment Deleted",
        description: "Your comment has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete comment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAddReply = async (parentId: string) => {
    if (!replyContent.trim() || !onComment) return;
    
    setIsAddingReply(true);
    try {
      // Call the comment function with parentId for threading
      await onComment(action._id, replyContent.trim(), parentId);
      setReplyingToId(null);
      setReplyContent('');
      toast({
        title: "Reply Added",
        description: "Your reply has been added successfully.",
      });
    } catch (error) {
      console.error('Failed to add reply:', error);
      toast({
        title: "Reply Failed",
        description: "Failed to add reply. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAddingReply(false);
    }
  };

  const startEditing = (comment: any) => {
    setEditingCommentId(comment._id);
    setEditingContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  const startReplying = (commentId: string) => {
    setReplyingToId(commentId);
    setReplyContent('');
  };

  const cancelReplying = () => {
    setReplyingToId(null);
    setReplyContent('');
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(action._id);
      toast({
        title: "Action Deleted",
        description: "The action has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete the action. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Check if current user can delete this action (only case managers)
  const canDelete = user?.role === 'case_manager' && onDelete;

  const getUrgencyBadge = () => {
    if (action.urgency === 'urgent') {
      return <Badge variant="destructive" className="text-xs">URGENT</Badge>;
    }
    if (action.urgency === 'issue') {
      return <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">ISSUE</Badge>;
    }
    return null;
  };

  const getStatusIcon = () => {
    if (action.status === 'complete') {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    return <Clock className="w-5 h-5 text-amber-600" />;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return 'Today';
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return formatDistanceToNow(date, { addSuffix: true });
    }
  };

  const renderSensitiveContent = (content: string) => {
    if (shouldMaskContent) {
      return "*** ROI Required to View ***";
    }
    return content;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
      {/* Modern Action Card */}
      <div className="p-5">
        {/* Header Row - Clean and modern */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Status Icon with background */}
            <div className="flex-shrink-0 mt-0.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                action.status === 'complete' 
                  ? 'bg-green-100' 
                  : 'bg-amber-100'
              }`}>
              {action.status === 'complete' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Clock className="w-4 h-4 text-amber-600" />
              )}
              </div>
            </div>
            
            {/* Action Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-slate-900 text-base">
                {action.title}
              </h3>
              {action.urgency === 'urgent' && (
                  <Badge variant="destructive" className="text-xs font-medium px-2 py-1">URGENT</Badge>
              )}
              {action.urgency === 'issue' && (
                  <Badge className="text-xs font-medium px-2 py-1 bg-orange-100 text-orange-700 border-orange-200">ISSUE</Badge>
                )}
              </div>
              
              {/* Context info */}
              {context && (
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-4 h-4 rounded flex items-center justify-center ${
                    context.type === 'referral' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {context.type === 'referral' ? (
                      <FileText className="w-2.5 h-2.5 text-blue-600" />
                    ) : (
                      <User className="w-2.5 h-2.5 text-green-600" />
                    )}
                  </div>
                  <span className="text-sm text-slate-600 font-medium">{context.label}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Timestamp and status */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-4">
            <span className="text-xs text-slate-500 font-medium">
              {formatTimeAgo(action.createdAt)}
            </span>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              action.status === 'complete' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-amber-100 text-amber-700'
            }`}>
              {action.status === 'complete' ? 'Complete' : 'Pending'}
            </div>
          </div>
        </div>

        {/* Content Area */}
        {(action.description || action.notes) && (
          <div className="mb-4">
            <div className="text-sm text-slate-600 leading-relaxed">
              {renderSensitiveContent(action.description || action.notes || '')}
            </div>
          </div>
        )}

        {/* Metadata row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            {/* Actor */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center">
                <User className="w-3 h-3 text-slate-600" />
              </div>
              <span className="text-slate-600 font-medium">{action.createdByName}</span>
            </div>
            
            {/* Attachments */}
            {action.attachments && action.attachments.length > 0 && (
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-slate-500" />
                <span className="text-slate-600">{action.attachments.length} files</span>
              </div>
            )}
            
            {/* Target Date */}
            {(action.targetDate || action.scheduledDate) && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-slate-600">
                  Due {new Date(action.targetDate || action.scheduledDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ROI Warning */}
        {shouldMaskContent && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="font-medium">ROI Required to view sensitive content</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            {/* Complete Button */}
            {action.status === 'pending' && onComplete && (
              <Button
                onClick={handleComplete}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-sm font-medium"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
            )}

            {/* Comments Toggle */}
            {onComment && (() => {
              const hasComments = action.comments && action.comments.length > 0;
              const currentUserName = user?.full_name || user?.name || user?.email;
              
              // Check if there are comments from OTHER users (not current user)
              const hasOtherUserComments = hasComments && action.comments.some(comment => {
                const commentAuthor = comment.createdByName || comment.createdBy || comment.authorName;
                const isCurrentUserComment = commentAuthor === currentUserName || 
                                           comment.createdBy === user?.id || 
                                           comment.authorId === user?.id;
                return !isCurrentUserComment;
              });
              
              return (
              <Button
                onClick={() => setShowComments(!showComments)}
                size="sm"
                  variant="outline"
                  className={`px-3 py-2 text-sm relative ${
                    hasComments
                      ? 'text-blue-600 border-blue-300 hover:bg-blue-50'
                      : 'text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {hasComments ? (
                    <>
                      Comments ({action.comments.length})
                      {/* Notification dot only for OTHER users' comments */}
                      {hasOtherUserComments && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </>
                  ) : (
                    'Add Comment'
                  )}
                  {showComments ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
              </Button>
              );
            })()}
          </div>

          {/* Delete Button */}
          {canDelete && (
            <Button
              onClick={() => setShowDeleteDialog(true)}
              size="sm"
              variant="ghost"
              className="text-red-600 hover:bg-red-50 px-3 py-2 text-sm"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-slate-200 bg-slate-50">
          {/* Existing Comments */}
          {action.comments && action.comments.length > 0 && (
            <div className="p-5 space-y-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">
                Comments ({action.comments.length})
              </h4>
              {(() => {
                // Organize comments into threads (parent comments and their replies)
                const parentComments = action.comments.filter(comment => !comment.parentId);
                const repliesByParent = action.comments.reduce((acc, comment) => {
                  if (comment.parentId) {
                    if (!acc[comment.parentId]) acc[comment.parentId] = [];
                    acc[comment.parentId].push(comment);
                  }
                  return acc;
                }, {});

                // Safe function to get initials
                const getInitials = (name) => {
                  if (!name || typeof name !== 'string') return 'U';
                  return name.split(' ').map(n => n[0] || '').join('').toUpperCase() || 'U';
                };

                // Recursive function to render a comment and all its nested replies
                const renderCommentWithReplies = (comment, depth = 0) => {
                  const isReply = depth > 0;
                  const maxDepth = 10; // Prevent infinite nesting UI issues
                  const commentAuthor = comment.createdByName || comment.createdBy || comment.authorName || 'Unknown User';
                  const currentUserName = user?.full_name || user?.name || user?.email;
                  const isCurrentUser = commentAuthor === currentUserName || 
                                      comment.createdBy === user?.id || 
                                      comment.authorId === user?.id;
                  
                  // Check multiple possible role field names
                  const commentRole = comment.createdByRole || comment.authorType || comment.authorRole || comment.role;
                  const isCaseManager = commentRole === 'case_manager';

                  
                  // Build classes with depth-aware styling using fixed Tailwind classes
                  const getIndentClass = (depth) => {
                    const indentClasses = ['', 'ml-12', 'ml-20', 'ml-28', 'ml-36'];
                    return indentClasses[Math.min(depth, 4)] || 'ml-36';
                  };
                  
                  const getOpacityClass = (depth) => {
                    const opacityClasses = ['bg-opacity-90', 'bg-opacity-80', 'bg-opacity-70', 'bg-opacity-60', 'bg-opacity-50'];
                    return opacityClasses[Math.min(depth, 4)] || 'bg-opacity-50';
                  };
                  
                  // Make threading much more obvious with larger indentation and visual indicators
                  const containerClasses = isReply 
                    ? `${getIndentClass(depth)} mt-3 pl-6 border-l-4 border-blue-300 bg-slate-50/50` 
                    : '';
                  
                  let cardClasses = 'rounded-xl p-4 border ';
                  if (isCurrentUser) {
                    cardClasses += 'bg-primary-50 border-primary-200';
                    // Only add margin for parent comments, replies get their margin from container
                    if (!isReply) cardClasses += ' ml-8';
                  } else if (isCaseManager) {
                    cardClasses += 'bg-blue-50 border-blue-200';
                    // Only add margin for parent comments, replies get their margin from container
                    if (!isReply) cardClasses += ' mr-8';
                  } else {
                    cardClasses += 'bg-green-50 border-green-200';
                    // Only add margin for parent comments, replies get their margin from container
                    if (!isReply) cardClasses += ' mr-8';
                  }
                  
                  // Make replies more visually distinct with depth
                  if (isReply) {
                    cardClasses += ` shadow-sm ${getOpacityClass(depth - 1)}`;
                  }

                  return (
                    <div key={comment._id} className={containerClasses}>
                      <div className={cardClasses}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                              isCurrentUser
                                ? 'bg-primary-500 text-white'
                                : isCaseManager 
                                ? 'bg-blue-500 text-white'
                                : 'bg-green-500 text-white'
                            }`}>
                              {getInitials(commentAuthor)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-900">
                                  {commentAuthor}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  isCaseManager 
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {isCaseManager ? 'Case Manager' : 'Provider'}
                                </span>
                                {isReply && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                                    Reply
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500">
                                {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : 'Just now'}
                    </span>
                            </div>
                          </div>
                          
                          {/* Comment Actions Menu */}
                          {isCurrentUser && (
                            <div className="flex items-center gap-1">
                              <Button
                                onClick={() => startEditing(comment)}
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteComment(comment._id)}
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {/* Comment Content or Edit Form */}
                        {editingCommentId === comment._id ? (
                          <div className={`${isReply ? 'ml-9' : 'ml-11'} space-y-3`}>
                            <textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="w-full min-h-[60px] px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              rows={2}
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => handleEditComment(comment._id)}
                                disabled={!editingContent.trim() || isEditingComment}
                                size="sm"
                                className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 text-xs"
                              >
                                {isEditingComment ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-1"></div>
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3 h-3 mr-1" />
                                    Save
                                  </>
                                )}
                              </Button>
                              <Button
                                onClick={cancelEditing}
                                size="sm"
                                variant="ghost"
                                className="text-slate-600 hover:text-slate-800 px-3 py-1 text-xs"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm ml-11 text-slate-700 leading-relaxed mb-3">
                              {comment.content}
                            </p>
                            
                            {/* Reply Button - show on all comments for infinite threading */}
                            {depth < maxDepth && (
                              <div className={isReply ? 'ml-9' : 'ml-11'}>
                                <Button
                                  onClick={() => startReplying(comment._id)}
                                  size="sm"
                                  variant="ghost"
                                  className="text-slate-500 hover:text-slate-700 px-2 py-1 text-xs h-auto"
                                >
                                  <Reply className="w-3 h-3 mr-1" />
                                  Reply
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      
                      {/* Reply Form - show for any comment being replied to */}
                      {replyingToId === comment._id && depth < maxDepth && (
                        <div className="ml-12 mt-3">
                          <div className="bg-white rounded-lg border border-slate-200 p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-xs font-semibold text-white">
                                {(() => {
                                  const userName = user?.full_name || user?.name || 'Me';
                                  if (typeof userName === 'string') {
                                    return userName.split(' ').map(n => n[0] || '').join('').toUpperCase() || 'ME';
                                  }
                                  return 'ME';
                                })()}
                              </div>
                              <div className="flex-1">
                                <textarea
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  placeholder="Write a reply..."
                                  className="w-full min-h-[60px] px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                  rows={2}
                                />
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-slate-500">
                                    Replying to {commentAuthor}
                    </span>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      onClick={() => handleAddReply(comment._id)}
                                      disabled={!replyContent.trim() || isAddingReply}
                                      size="sm"
                                      className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 text-xs"
                                    >
                                      {isAddingReply ? (
                                        <>
                                          <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-1"></div>
                                          Replying...
                                        </>
                                      ) : (
                                        'Reply'
                                      )}
                                    </Button>
                                    <Button
                                      onClick={cancelReplying}
                                      size="sm"
                                      variant="ghost"
                                      className="text-slate-600 hover:text-slate-800 px-2 py-1 text-xs"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Recursively render nested replies */}
                      {repliesByParent[comment._id] && repliesByParent[comment._id].length > 0 && depth < maxDepth && (
                        <div className="space-y-2 mt-3">
                          {repliesByParent[comment._id].map((nestedReply) => 
                            renderCommentWithReplies(nestedReply, depth + 1)
                          )}
                        </div>
                      )}
                    </div>
                  );
                };

                // Render all parent comments with infinite nesting
                return parentComments.map((parentComment) => 
                  renderCommentWithReplies(parentComment, 0)
                );
              })()}
            </div>
          )}

          {/* Add Comment Form */}
          <div className="p-5 border-t border-slate-200 bg-white">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-xs font-semibold text-white">
                {(() => {
                  const userName = user?.full_name || user?.name || 'Me';
                  if (typeof userName === 'string') {
                    return userName.split(' ').map(n => n[0] || '').join('').toUpperCase() || 'ME';
                  }
                  return 'ME';
                })()}
              </div>
              <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full min-h-[80px] px-4 py-3 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  rows={3}
                />
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-slate-500">
                    Commenting as {user?.role === 'case_manager' ? 'Case Manager' : 'Provider'}
                  </span>
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || isAddingComment}
                size="sm"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2"
                  >
                    {isAddingComment ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-2"></div>
                        Adding...
                      </>
                    ) : (
                      'Post Comment'
                    )}
              </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this action "{action.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
