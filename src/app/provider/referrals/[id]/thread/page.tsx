"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Building,
  MessageSquare,
  Clock,
  AlertCircle,
  Send,
  Plus,
  User,
  Filter,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Save,
  X,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSafeDate } from '@/lib/date-utils';
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Types
interface Comment {
  _id: string;
  authorId: string;
  authorType: 'case_manager' | 'provider' | 'admin';
  authorName: string;
  category: 'status' | 'request' | 'progress' | 'issue' | 'admin';
  content: string;
  priority: 'normal' | 'important' | 'urgent';
  createdAt: string;
  editedAt?: string;
  metadata?: any;
  parentId?: string | null;
  replies?: Comment[];
  replyCount?: number;
}

// Enhanced category config with colors and actions
const categoryConfig = {
  status: { 
    label: 'Status Update', 
    color: 'bg-blue-50 text-blue-700 border-blue-200', 
    dot: 'bg-blue-500',
    icon: '📋'
  },
  request: { 
    label: 'Request', 
    color: 'bg-amber-50 text-amber-700 border-amber-200', 
    dot: 'bg-amber-500',
    icon: '❓'
  },
  progress: { 
    label: 'Progress', 
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
    dot: 'bg-emerald-500',
    icon: '📈'
  },
  issue: { 
    label: 'Issue', 
    color: 'bg-red-50 text-red-700 border-red-200', 
    dot: 'bg-red-500',
    icon: '⚠️'
  },
  admin: { 
    label: 'Admin', 
    color: 'bg-gray-50 text-gray-700 border-gray-200', 
    dot: 'bg-gray-500',
    icon: '⚙️'
  },
  // Legacy category mappings for backward compatibility
  status_update: { 
    label: 'Status Update', 
    color: 'bg-blue-50 text-blue-700 border-blue-200', 
    dot: 'bg-blue-500',
    icon: '📋'
  },
  document_request: { 
    label: 'Document Request', 
    color: 'bg-amber-50 text-amber-700 border-amber-200', 
    dot: 'bg-amber-500',
    icon: '📄'
  },
  service_coordination: { 
    label: 'Service Coordination', 
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
    dot: 'bg-emerald-500',
    icon: '🤝'
  },
  follow_up_required: { 
    label: 'Follow-up Required', 
    color: 'bg-orange-50 text-orange-700 border-orange-200', 
    dot: 'bg-orange-500',
    icon: '🔔'
  },
  incident: { 
    label: 'Incident', 
    color: 'bg-red-50 text-red-700 border-red-200', 
    dot: 'bg-red-500',
    icon: '🚨'
  },
  general: { 
    label: 'General', 
    color: 'bg-gray-50 text-gray-700 border-gray-200', 
    dot: 'bg-gray-500',
    icon: '💬'
  }
};

const priorityConfig = {
  normal: { color: 'border-l-gray-300' },
  important: { color: 'border-l-orange-400' },
  urgent: { color: 'border-l-red-500' }
};

// Helper function to get category config with fallback
const getCategoryConfig = (category: string | undefined) => {
  if (!category || !categoryConfig[category as keyof typeof categoryConfig]) {
    return categoryConfig.general; // Default fallback
  }
  return categoryConfig[category as keyof typeof categoryConfig];
};

export default function ProviderThreadPage() {
  const params = useParams<{ id: string }>();
  const referralId = params?.id;
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [referral, setReferral] = useState<any>(null);
  const [newComment, setNewComment] = useState('');
  const [commentCategory, setCommentCategory] = useState<string>('status');
  const [commentPriority, setCommentPriority] = useState<string>('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPriority, setEditPriority] = useState('');

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      if (!referralId) return;
      
      setLoading(true);
      try {
        // Fetch referral details
        const referralRes = await fetch(`/api/referrals/${referralId}`);
        if (!referralRes.ok) throw new Error('Failed to fetch referral');
        const referralData = await referralRes.json();
        setReferral(referralData.referral);

        // Fetch comments
        const commentsRes = await fetch(`/api/referrals/${referralId}/comments`);
        if (!commentsRes.ok) throw new Error('Failed to fetch comments');
        const commentsData = await commentsRes.json();
        setComments(commentsData.comments || []);

        // Get current user
        const userRes = await fetch('/api/users/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUserId(userData.user?.id || '');
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load thread data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [referralId, toast]);

  // Submit new comment
  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast({
        title: "Error",
        description: "Please enter a comment",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/referrals/${referralId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          category: commentCategory,
          priority: commentPriority
        })
      });

      if (!response.ok) throw new Error('Failed to add comment');

      // Refresh the comments
      const commentsRes = await fetch(`/api/referrals/${referralId}/comments`);
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData.comments || []);
      }

      setNewComment('');
      setCommentCategory('status');
      setCommentPriority('normal');
      
      toast({
        title: "Success",
        description: "Comment added successfully"
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reply to comment
  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reply",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/referrals/${referralId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          parentId: parentId,
          category: 'general',
          priority: 'normal'
        })
      });

      if (!response.ok) throw new Error('Failed to add reply');

      // Refresh comments
      const commentsRes = await fetch(`/api/referrals/${referralId}/comments`);
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData.comments || []);
      }
      
      setReplyContent('');
      setReplyingTo(null);
      
      toast({
        title: "Success",
        description: "Reply added successfully"
      });
    } catch (error) {
      console.error('Error adding reply:', error);
      toast({
        title: "Error",
        description: "Failed to add reply",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit comment functions
  const startEditingComment = (comment: Comment) => {
    setEditingComment(comment._id);
    setEditContent(comment.content);
    setEditCategory(comment.category);
    setEditPriority(comment.priority);
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) {
      toast({
        title: "Error",
        description: "Comment cannot be empty",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/referrals/${referralId}/comments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId,
          content: editContent,
          category: editCategory,
          priority: editPriority
        })
      });

      if (!response.ok) throw new Error('Failed to update comment');

      // Refresh comments
      const commentsRes = await fetch(`/api/referrals/${referralId}/comments`);
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData.comments || []);
      }
      
      setEditingComment(null);
      setEditContent('');
      setEditCategory('');
      setEditPriority('');
      
      toast({
        title: "Success",
        description: "Comment updated successfully"
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: "Error",
        description: "Failed to update comment",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/referrals/${referralId}/comments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId })
      });

      if (!response.ok) throw new Error('Failed to delete comment');

      // Refresh comments
      const commentsRes = await fetch(`/api/referrals/${referralId}/comments`);
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData.comments || []);
      }
      
      toast({
        title: "Success",
        description: "Comment deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle thread expansion
  const toggleThread = (commentId: string) => {
    const newExpanded = new Set(expandedThreads);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedThreads(newExpanded);
  };

  // Process comments into threaded structure
  const processCommentsIntoThreads = (comments: Comment[]) => {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create map and initialize replies array
    comments.forEach(comment => {
      commentMap.set(comment._id, { ...comment, replies: [] });
    });

    // Second pass: build thread structure
    comments.forEach(comment => {
      const processedComment = commentMap.get(comment._id)!;
      
      if (comment.parentId && commentMap.has(comment.parentId)) {
        // This is a reply, add to parent's replies
        const parent = commentMap.get(comment.parentId)!;
        parent.replies!.push(processedComment);
        parent.replyCount = (parent.replyCount || 0) + 1;
      } else {
        // This is a root comment
        rootComments.push(processedComment);
      }
    });

    // Sort root comments by date (newest first)
    rootComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Sort replies within each thread by date (oldest first for conversation flow)
    rootComments.forEach(comment => {
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
    });

    return rootComments;
  };

  // Render a single comment with threading
  const renderComment = (comment: Comment, level: number = 0) => {
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isExpanded = expandedThreads.has(comment._id);
    const isReplying = replyingTo === comment._id;
    const isEditing = editingComment === comment._id;
    const canEditDelete = currentUserId === comment.authorId;
    const isProvider = comment.authorType === 'provider';

    return (
      <div key={comment._id} className={cn("", level > 0 && "ml-8 border-l-2 border-gray-100 pl-4")}>
        <div 
          className={cn(
            "border-l-4 pl-4 py-3 bg-gray-50 rounded-r-lg mb-3",
            priorityConfig[comment.priority].color
          )}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {isProvider ? 'P' : 'CM'}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm text-gray-900">
                {comment.authorName}
              </span>
              <Badge 
                variant="outline" 
                className={cn("text-xs", getCategoryConfig(comment.category).color)}
              >
                {getCategoryConfig(comment.category).label}
              </Badge>
              {comment.priority !== 'normal' && (
                <Badge variant="outline" className="text-xs capitalize">
                  {comment.priority}
                </Badge>
              )}
              {comment.editedAt && (
                <Badge variant="outline" className="text-xs text-gray-500">
                  Edited
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {formatSafeDate(comment.createdAt, 'MMM d, h:mm a')}
              </span>
              {canEditDelete && !isEditing && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEditingComment(comment)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit comment"
                  >
                    <Edit className="h-3 w-3" />
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this comment? This action cannot be undone.
                          {hasReplies && " You cannot delete a comment that has replies."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteComment(comment._id)}
                          disabled={hasReplies}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </div>

          {/* Comment Content - Editable or Display */}
          {isEditing ? (
            <div className="space-y-3 mb-3">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Edit your comment..."
                rows={3}
                className="resize-none"
              />
              <div className="flex items-center gap-2">
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryConfig).slice(0, 5).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={editPriority} onValueChange={setEditPriority}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2 ml-auto">
                  <Button
                    size="sm"
                    onClick={() => handleUpdateComment(comment._id)}
                    disabled={isSubmitting}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingComment(null);
                      setEditContent('');
                      setEditCategory('');
                      setEditPriority('');
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">
              {comment.content}
            </div>
          )}

          {/* Thread Actions */}
          {!isEditing && (
            <div className="flex items-center gap-3 text-xs">
              <button
                onClick={() => setReplyingTo(isReplying ? null : comment._id)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Reply
              </button>
              
              {hasReplies && (
                <button
                  onClick={() => toggleThread(comment._id)}
                  className="text-gray-600 hover:text-gray-800 font-medium flex items-center gap-1"
                >
                  {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
                </button>
              )}
            </div>
          )}

          {/* Reply Form */}
          {isReplying && !isEditing && (
            <div className="mt-3 space-y-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                className="resize-none text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSubmitReply(comment._id)}
                  disabled={isSubmitting || !replyContent.trim()}
                >
                  <Send className="h-3 w-3 mr-1" />
                  Send Reply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Nested Replies */}
        {hasReplies && isExpanded && (
          <div className="space-y-2">
            {comment.replies!.map((reply) => 
              renderComment(reply, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-500"></div>
      </div>
    );
  }

  const clientName = referral ? `${referral.clientInfo?.firstName || ''} ${referral.clientInfo?.lastName || ''}`.trim() : '';
  const serviceType = referral?.serviceDetails?.type || '';
  const threadedComments = processCommentsIntoThreads(comments);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild className="gap-1">
                <Link href={`/provider/referrals/${referralId}`}>
                  <ArrowLeft className="h-4 w-4" />
                  Back to Referral
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Care Coordination</h1>
                <p className="text-sm text-gray-600">{clientName} - {serviceType}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Communications Feed */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 bg-purple-100">
                    <AvatarFallback className="text-purple-600 font-medium">
                      <MessageSquare className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-lg">Provider Thread</div>
                    <CardDescription>
                      {threadedComments.length} thread{threadedComments.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                {threadedComments.length > 0 ? (
                  <div className="space-y-3">
                    {threadedComments.map((comment) => 
                      renderComment(comment, 0)
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No comments yet for this referral
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Add Comment Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-blue-500" />
                  Add Comment
                </CardTitle>
                <CardDescription>
                  Send an update to the case manager
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Category */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Category
                  </label>
                  <Select value={commentCategory} onValueChange={setCommentCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryConfig).slice(0, 5).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Priority
                  </label>
                  <Select value={commentPriority} onValueChange={setCommentPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="important">Important</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Comment Text */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Message
                  </label>
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Enter your message..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* Submit Button */}
                <EnhancedButton
                  variant="gradient"
                  onClick={handleSubmitComment}
                  disabled={isSubmitting || !newComment.trim()}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Comment
                    </>
                  )}
                </EnhancedButton>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}