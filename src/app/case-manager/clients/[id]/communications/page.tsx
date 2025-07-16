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
  X
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
  editedAt?: string; // Track when comment was last edited
  metadata?: any;
  // Threading support
  parentId?: string | null; // null for root comments, commentId for replies
  replies?: Comment[]; // nested replies
  replyCount?: number; // total reply count
}

interface Service {
  referralId: string;
  serviceType: string;
  status: string;
  comments: Comment[];
  lastActivity: string;
}

interface ProviderGroup {
  providerName: string;
  providerId: string | null;
  services: Service[];
  totalComments: number;
  lastActivity: string;
}

interface GroupedComments {
  [providerId: string]: ProviderGroup;
}

// Comment category colors and labels
const categoryConfig = {
  status: { label: 'Status Update', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  request: { label: 'Request', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  progress: { label: 'Progress Note', color: 'bg-green-100 text-green-800 border-green-200' },
  issue: { label: 'Issue/Concern', color: 'bg-red-100 text-red-800 border-red-200' },
  admin: { label: 'Administrative', color: 'bg-gray-100 text-gray-800 border-gray-200' }
};

const priorityConfig = {
  normal: { color: 'border-l-gray-300' },
  important: { color: 'border-l-orange-400' },
  urgent: { color: 'border-l-red-500' }
};

export default function ProviderWorkspacePage() {
  const params = useParams<{ id: string }>();
  const clientId = params?.id;
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [groupedComments, setGroupedComments] = useState<GroupedComments>({});
  const [client, setClient] = useState<any>(null);
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set());
  const [newComment, setNewComment] = useState('');
  const [selectedReferral, setSelectedReferral] = useState('');
  const [commentCategory, setCommentCategory] = useState<string>('admin');
  const [commentPriority, setCommentPriority] = useState<string>('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [showAllComments, setShowAllComments] = useState<Set<string>>(new Set());
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [deletingComment, setDeletingComment] = useState<string | null>(null);

  // Fetch client data and comments
  useEffect(() => {
    async function fetchData() {
      if (!clientId) return;
      
      setLoading(true);
      try {
        // Fetch client details
        const clientRes = await fetch(`/api/clients?id=${clientId}`);
        if (!clientRes.ok) throw new Error('Failed to fetch client');
        const clientData = await clientRes.json();
        setClient(clientData.client);

        // Fetch grouped comments
        const commentsRes = await fetch(`/api/clients/${clientId}/comments`);
        if (!commentsRes.ok) throw new Error('Failed to fetch comments');
        const commentsData = await commentsRes.json();
        
        // Debug logging
        console.log('DEBUG: Client comments response:', commentsData);
        console.log('DEBUG: Total comments:', commentsData.totalComments);
        console.log('DEBUG: Total referrals:', commentsData.totalReferrals);
        console.log('DEBUG: Grouped comments:', commentsData.groupedComments);
        
        setGroupedComments(commentsData.groupedComments || {});
        
        // Expand all providers by default if there are comments
        if (commentsData.groupedComments) {
          setExpandedProviders(new Set(Object.keys(commentsData.groupedComments)));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load communications data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [clientId, toast]);

  // Submit new comment
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !selectedReferral) {
      toast({
        title: "Error",
        description: "Please select a referral and enter a comment",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/referrals/${selectedReferral}/comments`, {
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
      const commentsRes = await fetch(`/api/clients/${clientId}/comments`);
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setGroupedComments(commentsData.groupedComments || {});
      }

      // Reset form
      setNewComment('');
      setSelectedReferral('');
      setCommentCategory('admin');
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

  // Get current user ID from auth context or session
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  useEffect(() => {
    // Get current user ID for permission checks
    const getCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/user');
        if (response.ok) {
          const userData = await response.json();
          setCurrentUserId(userData.user?.id);
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };
    getCurrentUser();
  }, []);

  // Handle comment editing
  const handleEditComment = async (commentId: string, referralId: string) => {
    if (!editContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter comment content",
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to edit comment');
      }

      // Refresh the comments
      const commentsRes = await fetch(`/api/clients/${clientId}/comments`);
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setGroupedComments(commentsData.groupedComments || {});
      }

      // Reset edit form
      setEditingComment(null);
      setEditContent('');
      setEditCategory('');
      setEditPriority('');

      toast({
        title: "Success",
        description: "Comment updated successfully"
      });
    } catch (error) {
      console.error('Error editing comment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to edit comment",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle comment deletion
  const handleDeleteComment = async (commentId: string, referralId: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/referrals/${referralId}/comments?commentId=${commentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete comment');
      }

      // Refresh the comments
      const commentsRes = await fetch(`/api/clients/${clientId}/comments`);
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setGroupedComments(commentsData.groupedComments || {});
      }

      setDeletingComment(null);

      toast({
        title: "Success",
        description: "Comment deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete comment",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start editing a comment
  const startEditingComment = (comment: Comment) => {
    setEditingComment(comment._id);
    setEditContent(comment.content);
    setEditCategory(comment.category);
    setEditPriority(comment.priority);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingComment(null);
    setEditContent('');
    setEditCategory('');
    setEditPriority('');
  };

  // Handle reply submission
  const handleSubmitReply = async (parentCommentId: string, referralId: string) => {
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
          category: 'admin',
          priority: 'normal',
          parentId: parentCommentId
        })
      });

      if (!response.ok) throw new Error('Failed to add reply');

      // Refresh the comments
      const commentsRes = await fetch(`/api/clients/${clientId}/comments`);
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setGroupedComments(commentsData.groupedComments || {});
      }

      // Reset reply form
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

  // Toggle provider expansion
  const toggleProvider = (providerId: string) => {
    const newExpanded = new Set(expandedProviders);
    if (newExpanded.has(providerId)) {
      newExpanded.delete(providerId);
    } else {
      newExpanded.add(providerId);
    }
    setExpandedProviders(newExpanded);
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

  // Toggle show all comments for a service
  const toggleShowAllComments = (serviceId: string) => {
    const newShowAll = new Set(showAllComments);
    if (newShowAll.has(serviceId)) {
      newShowAll.delete(serviceId);
    } else {
      newShowAll.add(serviceId);
    }
    setShowAllComments(newShowAll);
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
  const renderComment = (comment: Comment, level: number = 0, referralId: string) => {
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isExpanded = expandedThreads.has(comment._id);
    const isReplying = replyingTo === comment._id;
    const isEditing = editingComment === comment._id;
    const canEditDelete = currentUserId === comment.authorId; // User can only edit/delete their own comments

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
                  {comment.authorType === 'provider' ? 'P' : 'CM'}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm text-gray-900">
                {comment.authorName}
              </span>
              <Badge 
                variant="outline" 
                className={cn("text-xs", categoryConfig[comment.category].color)}
              >
                {categoryConfig[comment.category].label}
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
                          onClick={() => handleDeleteComment(comment._id, referralId)}
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
                    {Object.entries(categoryConfig).map(([key, config]) => (
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
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleEditComment(comment._id, referralId)}
                  disabled={isSubmitting || !editContent.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-1 h-3 w-3" />
                      Save
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelEditing}
                >
                  <X className="mr-1 h-3 w-3" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              {comment.content}
            </p>
          )}
          
          {/* Comment Actions */}
          {!isEditing && (
            <div className="flex items-center gap-3 text-xs">
              <button
                onClick={() => setReplyingTo(isReplying ? null : comment._id)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {isReplying ? 'Cancel' : 'Reply'}
              </button>
              
              {hasReplies && (
                <button
                  onClick={() => toggleThread(comment._id)}
                  className="text-gray-600 hover:text-gray-800 font-medium flex items-center gap-1"
                >
                  {isExpanded ? (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      Hide {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
                    </>
                  ) : (
                    <>
                      <ChevronRight className="h-3 w-3" />
                      Show {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Reply Form */}
        {isReplying && (
          <div className="ml-4 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              rows={3}
              className="mb-3 resize-none"
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleSubmitReply(comment._id, referralId)}
                disabled={isSubmitting || !replyContent.trim()}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-1 h-3 w-3" />
                    Reply
                  </>
                )}
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

        {/* Nested Replies */}
        {hasReplies && isExpanded && (
          <div className="space-y-2">
            {comment.replies!.map(reply => 
              renderComment(reply, level + 1, referralId)
            )}
          </div>
        )}
      </div>
    );
  };

  // Get all referrals for the comment form dropdown
  const getAllReferrals = () => {
    const referrals: Array<{ id: string; label: string }> = [];
    Object.values(groupedComments).forEach(provider => {
      provider.services.forEach(service => {
        referrals.push({
          id: service.referralId,
          label: `${provider.providerName} - ${service.serviceType}`
        });
      });
    });
    return referrals;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-500"></div>
      </div>
    );
  }

  const clientName = client ? `${client.firstName || ''} ${client.lastName || ''}`.trim() : '';
  const hasComments = Object.keys(groupedComments).length > 0;
  const allReferrals = getAllReferrals();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild className="gap-1">
                <Link href={`/case-manager/clients/${clientId}`}>
                  <ArrowLeft className="h-4 w-4" />
                  Back to Client
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Provider Workspace</h1>
                <p className="text-sm text-gray-600">{clientName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Communications Feed */}
          <div className="lg:col-span-2 space-y-6">
            {hasComments ? (
              Object.entries(groupedComments).map(([providerId, provider]) => (
                <Card key={providerId}>
                  <Collapsible 
                    open={expandedProviders.has(providerId)}
                    onOpenChange={() => toggleProvider(providerId)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 bg-blue-100">
                              <AvatarFallback className="text-blue-600 font-medium">
                                <Building className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{provider.providerName}</CardTitle>
                              <CardDescription>
                                {provider.services.length} service{provider.services.length > 1 ? 's' : ''} • 
                                {provider.totalComments} comment{provider.totalComments > 1 ? 's' : ''}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Last activity: {formatSafeDate(provider.lastActivity, 'MMM d')}
                            </Badge>
                            {expandedProviders.has(providerId) ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />
                            }
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        {provider.services.map((service) => {
                          const threadedComments = processCommentsIntoThreads(service.comments);
                          const showingAll = showAllComments.has(service.referralId);
                          const displayComments = showingAll ? threadedComments : threadedComments.slice(0, 3);
                          const hasMoreComments = threadedComments.length > 3;

                          return (
                            <div key={service.referralId} className="mb-6 last:mb-0">
                              {/* Service Header */}
                              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                                <div>
                                  <h4 className="font-medium text-gray-900">{service.serviceType}</h4>
                                  <p className="text-sm text-gray-500">
                                    Status: <span className="capitalize">{service.status}</span>
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {threadedComments.length} thread{threadedComments.length === 1 ? '' : 's'}
                                  </Badge>
                                  {hasMoreComments && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleShowAllComments(service.referralId)}
                                      className="text-xs"
                                    >
                                      {showingAll ? 'Show Less' : `Show All (${threadedComments.length})`}
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Threaded Comments */}
                              {displayComments.length > 0 ? (
                                <div className="space-y-3">
                                  {displayComments.map((comment) => 
                                    renderComment(comment, 0, service.referralId)
                                  )}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                  No comments yet for this service
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Comments Available</h3>
                  <p className="text-gray-600 mb-4">
                    This workspace will show all communications once referrals are created and comments are added.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Debug Info:</strong> Check the browser console for detailed information about what data was loaded.
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Expected:</strong> If you have referrals with comments for this client, they should appear here. If not, create a referral first.
                    </p>
                  </div>
                  <EnhancedButton variant="gradient" asChild>
                    <Link href={`/case-manager/new-referral?clientId=${clientId}`}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Referral
                    </Link>
                  </EnhancedButton>
                </CardContent>
              </Card>
            )}
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
                  Send an update or request to a provider
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {allReferrals.length > 0 ? (
                  <>
                    {/* Select Referral */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Select Service
                      </label>
                      <Select value={selectedReferral} onValueChange={setSelectedReferral}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a referral..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allReferrals.map((referral) => (
                            <SelectItem key={referral.id} value={referral.id}>
                              {referral.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

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
                          {Object.entries(categoryConfig).map(([key, config]) => (
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
                      disabled={isSubmitting || !newComment.trim() || !selectedReferral}
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
                  </>
                ) : (
                  <div className="text-center py-6">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-4">
                      No referrals available. Create a referral first to start communicating with providers.
                    </p>
                    <Button variant="outline" asChild>
                      <Link href={`/case-manager/new-referral?clientId=${clientId}`}>
                        Create Referral
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 