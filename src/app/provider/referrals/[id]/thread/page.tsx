"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  MessageSquare,
  Clock,
  AlertCircle,
  Send,
  User,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Save,
  X,
  Users,
  Building,
  CheckCircle,
  Calendar,
  FileText,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSafeDate } from '@/lib/date-utils';
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
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

export default function ProviderCareThreadPage() {
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
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Fetch referral and comments data
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

        // Fetch comments for this referral
        const commentsRes = await fetch(`/api/referrals/${referralId}/comments`);
        if (!commentsRes.ok) throw new Error('Failed to fetch comments');
        const commentsData = await commentsRes.json();
        setComments(commentsData.comments || []);

        // Get current user
        const userRes = await fetch('/api/users/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUserId(userData.user?._id || '');
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load care thread data",
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

      // Refresh comments
      const commentsRes = await fetch(`/api/referrals/${referralId}/comments`);
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData.comments || []);
      }

      // Reset form
      setNewComment('');
      setCommentCategory('status');
      setCommentPriority('normal');

      toast({
        title: "Success",
        description: "Message added to care thread"
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add message",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit comment
  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) {
      toast({
        title: "Error",
        description: "Comment cannot be empty",
        variant: "destructive"
      });
      return;
    }

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

      if (!response.ok) throw new Error('Failed to edit comment');

      // Refresh comments
      const commentsRes = await fetch(`/api/referrals/${referralId}/comments`);
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData.comments || []);
      }

      // Reset editing state
      setEditingComment(null);
      setEditContent('');
      setEditCategory('');
      setEditPriority('');

      toast({
        title: "Success",
        description: "Message updated successfully"
      });
    } catch (error) {
      console.error('Error editing comment:', error);
      toast({
        title: "Error",
        description: "Failed to update message",
        variant: "destructive"
      });
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId: string) => {
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
        description: "Message deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive"
      });
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

  // Handle submit reply
  const handleSubmitReply = async (parentCommentId: string) => {
    if (!replyContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reply",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`/api/referrals/${referralId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          category: 'admin', // Default for replies
          priority: 'normal',
          parentId: parentCommentId
        })
      });

      if (!response.ok) throw new Error('Failed to add reply');

      // Refresh comments
      const commentsRes = await fetch(`/api/referrals/${referralId}/comments`);
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData.comments || []);
      }

      // Reset reply state
      setReplyingTo(null);
      setReplyContent('');

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

    // First pass: create map and initialize replies arrays
    comments.forEach(comment => {
      commentMap.set(comment._id, { ...comment, replies: [] });
    });

    // Second pass: build thread structure
    comments.forEach(comment => {
      if (comment.parentId && commentMap.has(comment.parentId)) {
        const parent = commentMap.get(comment.parentId)!;
        parent.replies!.push(commentMap.get(comment._id)!);
      } else {
        rootComments.push(commentMap.get(comment._id)!);
      }
    });

    return rootComments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };

  // Render a single comment with threading
  const renderComment = (comment: Comment, level: number = 0) => {
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isExpanded = expandedThreads.has(comment._id);
    const isReplying = replyingTo === comment._id;
    const isEditing = editingComment === comment._id;
    const canEditDelete = currentUserId === comment.authorId;

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
            
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>{formatSafeDate(comment.createdAt, 'MMM d, h:mm a')}</span>
              {canEditDelete && !isEditing && (
                <div className="flex gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => startEditingComment(comment)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-600 hover:text-red-700">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Message</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this message? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteComment(comment._id)}
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

          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px] resize-none"
                placeholder="Edit your message..."
              />
              <div className="flex items-center gap-2">
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger className="w-40">
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
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={() => handleEditComment(comment._id)}>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEditing}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-800 mb-2 whitespace-pre-wrap">{comment.content}</p>
              
              <div className="flex items-center gap-3 text-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setReplyingTo(isReplying ? null : comment._id)}
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Reply
                </Button>
                
                {hasReplies && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => toggleThread(comment._id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3 mr-1" />
                    ) : (
                      <ChevronRight className="h-3 w-3 mr-1" />
                    )}
                    {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Reply Form */}
        {isReplying && (
          <div className="ml-8 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="mb-2 min-h-[60px] resize-none"
              placeholder="Write a reply..."
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleSubmitReply(comment._id)}>
                <Send className="h-4 w-4 mr-1" />
                Reply
              </Button>
              <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Nested Replies */}
        {hasReplies && isExpanded && (
          <div className="space-y-2">
            {comment.replies!.map((reply) => renderComment(reply, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-500"></div>
      </div>
    );
  }

  const clientName = referral ? `${referral.clientInfo?.firstName || ''} ${referral.clientInfo?.lastName || ''}`.trim() : '';
  const clientInitials = referral ? `${referral.clientInfo?.firstName?.[0] || ''}${referral.clientInfo?.lastName?.[0] || ''}`.toUpperCase() : '??';
  const serviceType = referral?.serviceDetails?.type || 'Service';
  const caseManagerName = referral?.caseManager?.name || 'Case Manager';
  const status = referral?.status || 'under_review';
  const threadedComments = processCommentsIntoThreads(comments);

  // Status configuration for progress and display
  const getStatusConfig = (status: string) => {
    const configs: Record<string, any> = {
      under_review: {
        icon: Clock,
        color: 'amber',
        label: 'Under Review',
        description: 'Awaiting admin review',
        progressValue: 25
      },
      provider_selection_required: {
        icon: Building,
        color: 'blue',
        label: 'Select Provider',
        description: 'Case manager needs to select a provider',
        progressValue: 50
      },
      provider_accepted: {
        icon: CheckCircle,
        color: 'green',
        label: 'Provider Accepted',
        description: 'Provider has accepted the referral',
        progressValue: 75
      },
      in_progress: {
        icon: Activity,
        color: 'green',
        label: 'In Progress',
        description: 'Service is currently being provided',
        progressValue: 85
      },
      completed: {
        icon: CheckCircle,
        color: 'green',
        label: 'Completed',
        description: 'Service has been completed',
        progressValue: 100
      },
      cancelled: {
        icon: AlertCircle,
        color: 'red',
        label: 'Cancelled',
        description: 'This referral has been cancelled',
        progressValue: 100
      }
    };
    return configs[status] || configs.under_review;
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-indigo-50/20">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild className="gap-1 hover:bg-gray-100">
                <Link href={`/provider/referrals/${referralId}`}>
                  <ArrowLeft className="h-4 w-4" />
                  Back to Referral
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Referral Workspace</h1>
                <p className="text-sm text-gray-600">{clientName} • {serviceType}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                className={cn(
                  "px-3 py-1 text-sm font-medium flex items-center gap-1.5 rounded-full",
                  statusConfig.color === 'amber' && "bg-amber-100 text-amber-800 border-amber-200",
                  statusConfig.color === 'green' && "bg-green-100 text-green-800 border-green-200",
                  statusConfig.color === 'blue' && "bg-blue-100 text-blue-800 border-blue-200",
                  statusConfig.color === 'red' && "bg-red-100 text-red-800 border-red-200"
                )}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Enhanced Referral Context Panel */}
          <Card className="shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50">
              <div className="flex justify-between items-center px-6 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 rounded-lg border-2 border-white shadow-sm bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                      {clientInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{clientName}</h2>
                    <p className="text-sm text-gray-600">{serviceType} Referral</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="text-sm font-medium">
                    {referral?.createdAt 
                      ? formatSafeDate(referral.createdAt, 'MMM d, yyyy') 
                      : 'Unknown'}
                  </p>
                </div>
              </div>
              
              <div className="px-6 pb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{statusConfig.progressValue}%</span>
                </div>
                <Progress value={statusConfig.progressValue} className="h-2" />
                <p className="text-xs text-gray-600 mt-1">{statusConfig.description}</p>
              </div>
            </div>
            
            {/* Quick details section */}
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Case Manager</h3>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                        {getInitials(caseManagerName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{caseManagerName}</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Provider (You)</h3>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">You</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* New Message Form */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Send Message
              </CardTitle>
              <CardDescription>
                Communicate with the case manager about this referral
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px] resize-none"
                placeholder="Share an update, ask a question, or provide information..."
              />
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Category:</label>
                  <Select value={commentCategory} onValueChange={setCommentCategory}>
                    <SelectTrigger className="w-48">
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
                
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Priority:</label>
                  <Select value={commentPriority} onValueChange={setCommentPriority}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="important">Important</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleSubmitComment}
                  disabled={isSubmitting || !newComment.trim()}
                  className="ml-auto"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Care Thread Messages */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Communication History
                {threadedComments.length > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {comments.length} message{comments.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                All messages and updates for this referral
              </CardDescription>
            </CardHeader>
            <CardContent>
              {threadedComments.length > 0 ? (
                <div className="space-y-4">
                  {threadedComments.map((comment) => renderComment(comment))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                  <p className="text-gray-600 mb-4">
                    Start the conversation by sending the first message in this care thread.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 