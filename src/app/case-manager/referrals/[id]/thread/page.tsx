'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatSafeDate } from '@/lib/date-utils';
import { capitalizeName, formatServiceType, formatStatus } from '@/lib/formatting';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { 
  ArrowLeft, 
  MessageSquare,
  Send,
  Users,
  Building,
  Calendar,
  Phone,
  Mail,
  FileText,
  MoreHorizontal,
  Paperclip,
  Smile,
  CheckCheck,
  Clock,
  AlertCircle,
  User,
  MapPin,
  Activity,
  Bell,
  Settings,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Reply,
  ChevronDown,
  ChevronUp,
  Eye,
  CheckCircle2
} from 'lucide-react';

import { STATUS_FLOW, type ReferralStatus, getStatusConfig } from '@/types/index';

// Types
interface Comment {
  _id: string;
  authorId: string;
  authorType: 'case_manager' | 'provider' | 'admin';
  authorName: string;
  category: 'status_update' | 'document_request' | 'service_coordination' | 'follow_up_required' | 'incident' | 'general' | 'status' | 'request' | 'progress' | 'issue' | 'admin';
  content: string;
  priority: 'normal' | 'important' | 'urgent';
  createdAt: string;
  editedAt?: string;
  
  // Real-time features
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  readBy?: Array<{
    userId: string;
    userName: string;
    readAt: string;
  }>;
  
  // Threading
  parentId?: string | null;
  replies?: Comment[];
  replyCount?: number;
  
  // Attachments
  attachments?: Array<{
    name: string;
    type: string;
    size: string;
    url?: string;
  }>;
}

export default function MagicalThreadPage() {
  const params = useParams<{ id: string }>();
  const referralId = params?.id;
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [referral, setReferral] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingCategory, setEditingCategory] = useState<string>('status');
  const [editingPriority, setEditingPriority] = useState<string>('normal');
  const [selectedCategory, setSelectedCategory] = useState<string>('status_update');
  const [selectedPriority, setSelectedPriority] = useState<string>('normal');
  
  // Threading state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  
  // Reply editing state
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editingReplyContent, setEditingReplyContent] = useState('');
  
  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Right panel state
  const [rightPanelView, setRightPanelView] = useState<'details' | 'thread'>('details');
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [threadReplyContent, setThreadReplyContent] = useState('');
  
  // Online status
  const { onlineUsers, isUserOnline, getLastSeen, startHeartbeat, stopHeartbeat } = useOnlineStatus();

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  // Auto-refresh comments periodically
  useEffect(() => {
    if (!referralId) return;
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/referrals/${referralId}/comments`);
        if (response.ok) {
          const data = await response.json();
          const serverComments = data.comments || [];
          
          // Only update if we don't have any pending messages
          setComments(prev => {
            const hasPendingMessages = prev.some(comment => 
              comment.status === 'sending' || comment.status === 'error'
            );
            
            // Don't overwrite while messages are pending
            return hasPendingMessages ? prev : serverComments;
          });
        }
      } catch (error) {
        // Silent fail for background refresh
      }
    }, 30000); // 30 seconds - less aggressive

    return () => clearInterval(interval);
  }, [referralId]);

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
          description: "Failed to load conversation",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [referralId, toast]);

  // Send message - Clean, reliable implementation
  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSubmitting) return;

    const messageContent = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    
    // Optimistic message
    const optimisticMessage: Comment = {
      _id: tempId,
      authorId: currentUserId,
      authorType: 'case_manager',
      authorName: 'You',
      category: selectedCategory as any,
      content: messageContent,
      priority: selectedPriority as any,
      createdAt: new Date().toISOString(),
      status: 'sending',
      readBy: [],
      parentId: null,
      replies: [],
      replyCount: 0,
      attachments: []
    };

    // Add optimistic message and clear input
    setComments(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/referrals/${referralId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageContent,
          category: selectedCategory,
          priority: selectedPriority
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.comment) {
        throw new Error('Invalid server response');
      }

      // Replace optimistic message with server response
      setComments(prev => 
        prev.map(comment => 
          comment._id === tempId ? data.comment : comment
        )
      );

    } catch (error) {
      // Show error state on optimistic message
      setComments(prev => 
        prev.map(comment => 
          comment._id === tempId 
            ? { ...comment, status: 'error' as const }
            : comment
        )
      );
      
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send thread reply
  const handleSendThreadReply = async () => {
    if (!threadReplyContent.trim() || !activeThread || isSubmitting) return;

    const messageContent = threadReplyContent.trim();
    const tempId = `temp-${Date.now()}`;
    
    // Optimistic reply
    const optimisticReply: Comment = {
      _id: tempId,
      authorId: currentUserId,
      authorType: 'case_manager',
      authorName: 'You',
      category: 'general' as any,
      content: messageContent,
      priority: 'normal' as any,
      createdAt: new Date().toISOString(),
      status: 'sending',
      readBy: [],
      parentId: activeThread,
      replies: [],
      replyCount: 0,
      attachments: []
    };

    // Add optimistic reply and clear input
    setComments(prev => [...prev, optimisticReply]);
    setThreadReplyContent('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/referrals/${referralId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageContent,
          category: 'general',
          priority: 'normal',
          parentId: activeThread
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.comment) {
        throw new Error('Invalid server response');
      }

      // Replace optimistic reply with server response
      setComments(prev => 
        prev.map(comment => 
          comment._id === tempId ? data.comment : comment
        )
      );

    } catch (error) {
      // Show error state on optimistic reply
      setComments(prev => 
        prev.map(comment => 
          comment._id === tempId 
            ? { ...comment, status: 'error' as const }
            : comment
        )
      );
      
      toast({
        title: "Failed to send reply",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit message
  const handleEditMessage = async (messageId: string, newContent: string, newCategory: string, newPriority: string) => {
    if (!newContent.trim()) return;

    try {
      const response = await fetch(`/api/referrals/${referralId}/comments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId: messageId,
          content: newContent.trim(),
          category: newCategory,
          priority: newPriority
        })
      });

      if (!response.ok) {
        throw new Error(`Edit failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Update the message in state immediately
        setComments(prev => 
          prev.map(comment => 
            comment._id === messageId 
              ? { 
                  ...comment, 
                  content: newContent.trim(), 
                  category: newCategory as any, 
                  priority: newPriority as any, 
                  editedAt: new Date().toISOString() 
                }
              : comment
          )
        );
        
        // Clear editing state
        setEditingMessageId(null);
        setEditingContent('');
        setEditingCategory('status');
        setEditingPriority('normal');
      } else {
        throw new Error('Server error');
      }
      
    } catch (error) {
      toast({
        title: "Failed to edit message",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/referrals/${referralId}/comments?commentId=${messageId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Remove message from state immediately
        setComments(prev => prev.filter(comment => comment._id !== messageId));
        setDeleteConfirmId(null);
        toast({
          title: "Message deleted",
          description: "Your message has been deleted successfully.",
        });
      } else {
        throw new Error('Server error');
      }
      
    } catch (error) {
      toast({
        title: "Failed to delete message",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  // Edit reply
  const handleEditReply = async (replyId: string, newContent: string) => {
    if (!newContent.trim()) return;

    try {
      const response = await fetch(`/api/referrals/${referralId}/comments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId: replyId,
          content: newContent.trim()
        })
      });

      if (!response.ok) {
        throw new Error(`Edit failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Update the reply in state immediately
        setComments(prev => 
          prev.map(comment => 
            comment._id === replyId 
              ? { 
                  ...comment, 
                  content: newContent.trim(), 
                  editedAt: new Date().toISOString() 
                }
              : comment
          )
        );
        
        // Clear editing state
        setEditingReplyId(null);
        setEditingReplyContent('');
      } else {
        throw new Error('Server error');
      }
      
    } catch (error) {
      toast({
        title: "Failed to edit reply",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  // Delete reply
  const handleDeleteReply = async (replyId: string) => {
    try {
      const response = await fetch(`/api/referrals/${referralId}/comments?commentId=${replyId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Remove reply from state immediately
        setComments(prev => prev.filter(comment => comment._id !== replyId));
        setDeleteConfirmId(null);
        toast({
          title: "Reply deleted",
          description: "Your reply has been deleted successfully.",
        });
      } else {
        throw new Error('Server error');
      }
      
    } catch (error) {
      toast({
        title: "Failed to delete reply",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };



  const getInitials = (name: string | null | undefined) => {
    if (!name || typeof name !== 'string') return 'NA';
    const formattedName = capitalizeName(name);
    return formattedName.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getStatusBadgeColor = (status: string) => {
    const config = getStatusConfig(status as ReferralStatus);
    switch (config.color) {
      case 'green':
        return 'bg-green-100 text-green-700';
      case 'red':
        return 'bg-red-100 text-red-700';
      case 'amber':
        return 'bg-amber-100 text-amber-700';
      case 'blue':
        return 'bg-blue-100 text-blue-700';
      case 'purple':
        return 'bg-purple-100 text-purple-700';
      case 'gray':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const getStatusLabel = (status: string) => {
    const config = getStatusConfig(status as ReferralStatus);
    return config.label;
  };

  const getUrgencyVariant = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case 'urgent':
      case 'high':
        return 'destructive';
      case 'important':
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getProgressByStatus = (status: string) => {
    switch (status) {
      case 'completed':
        return 100;
      case 'in_progress':
        return 75;
      case 'confirmed':
        return 60;
      case 'matched':
        return 40;
      case 'provider_selection_required':
        return 25;
      case 'under_review':
        return 10;
      case 'cancelled':
      case 'rejected':
      case 'expired':
        return 0;
      default:
        return 20;
    }
  };

  const getCategoryStyle = (category: string, priority: string) => {
    switch (category) {
      case 'status_update':
        return 'bg-blue-100 text-blue-700';
      case 'document_request':
        return 'bg-purple-100 text-purple-700';
      case 'service_coordination':
        return 'bg-teal-100 text-teal-700';
      case 'follow_up_required':
        return 'bg-orange-100 text-orange-700';
      case 'incident':
        return 'bg-red-100 text-red-700';
      case 'general':
        return 'bg-gray-100 text-gray-700';
      // Legacy support
      case 'status':
        return 'bg-blue-100 text-blue-700';
      case 'request':
        return 'bg-purple-100 text-purple-700';
      case 'progress':
        return 'bg-teal-100 text-teal-700';
      case 'issue':
        return 'bg-red-100 text-red-700';
      case 'admin':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'status_update':
        return <MessageSquare className="h-3 w-3" />;
      case 'document_request':
        return <FileText className="h-3 w-3" />;
      case 'service_coordination':
        return <Users className="h-3 w-3" />;
      case 'follow_up_required':
        return <Bell className="h-3 w-3" />;
      case 'incident':
        return <AlertCircle className="h-3 w-3" />;
      case 'general':
        return <Settings className="h-3 w-3" />;
      // Legacy support
      case 'status':
        return <MessageSquare className="h-3 w-3" />;
      case 'request':
        return <FileText className="h-3 w-3" />;
      case 'progress':
        return <Users className="h-3 w-3" />;
      case 'issue':
        return <AlertCircle className="h-3 w-3" />;
      case 'admin':
        return <Settings className="h-3 w-3" />;
      default:
        return <MessageSquare className="h-3 w-3" />;
    }
  };

  // Message status indicators
  const getMessageStatusIcon = (status: string = 'sent', readBy?: any[]) => {
    switch (status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-gray-400 animate-pulse" />;
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-500" />;
      case 'read':
        return <CheckCircle2 className="h-3 w-3 text-gray-600" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return readBy && readBy.length > 0 ? 
          <Eye className="h-3 w-3 text-gray-600" /> : 
          <Check className="h-3 w-3 text-gray-400" />;
    }
  };

  // Threading helpers
  const handleReplyToMessage = (messageId: string) => {
    setReplyingTo(messageId);
    setReplyContent('');
  };

  const handleSendReply = async () => {
    if (!replyContent.trim() || !replyingTo) return;
    
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/referrals/${referralId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          category: selectedCategory,
          priority: selectedPriority,
          parentId: replyingTo
        }),
      });

      if (response.ok) {
        setReplyContent('');
        setReplyingTo(null);
        // Refresh comments by re-fetching
        const commentsRes = await fetch(`/api/referrals/${referralId}/comments`);
        if (commentsRes.ok) {
          const commentsData = await commentsRes.json();
          setComments(commentsData.comments || []);
        }
        toast({
          title: "Reply sent",
          description: "Your reply has been posted successfully.",
        });
      } else {
        throw new Error('Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error",
        description: "Failed to send reply. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleThreadExpansion = (messageId: string) => {
    const newExpanded = new Set(expandedThreads);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedThreads(newExpanded);
  };

  const getRepliesForMessage = (messageId: string): Comment[] => {
    return comments.filter(comment => comment.parentId === messageId);
  };

  const getTopLevelComments = (): Comment[] => {
    return comments.filter(comment => !comment.parentId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-blue-600"></div>
          <span className="text-gray-600 font-medium">Loading conversation...</span>
        </div>
      </div>
    );
  }

  const clientName = capitalizeName(referral ? `${referral.clientInfo?.firstName || ''} ${referral.clientInfo?.lastName || ''}`.trim() : 'Unknown Client');
  const serviceType = formatServiceType(referral?.serviceDetails?.type || 'Unknown Service');
  const providerName = capitalizeName(referral?.assignedProviderName || referral?.providerName || 'Provider TBD');
  
  // Check if provider is online
  const providerId = referral?.assignedProvider?.id || referral?.providerId;
  const providerOnline = providerId ? isUserOnline(providerId) : false;
  const providerLastSeen = providerId ? getLastSeen(providerId) : null;

  return (
    <div className="h-screen bg-white flex">
      {/* Left Sidebar - Navigation */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" className="p-1 h-6 w-6" asChild>
              <Link href="/case-manager/workspace">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="font-semibold text-gray-900">Conversations</h1>
              <p className="text-sm text-gray-600">Active case coordination</p>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              className="pl-10 bg-white border-gray-200"
            />
          </div>
        </div>

        {/* Current Conversation */}
        <div className="flex-1 p-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                  {getInitials(clientName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">{clientName}</h3>
                  <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                </div>
                <p className="text-sm text-gray-600 truncate">{serviceType}</p>
                <p className="text-xs text-gray-500 mt-1">with {providerName}</p>
              </div>
            </div>
          </div>
        </div>


      </div>

      {/* Center - Conversation */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Conversation Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-gray-100 text-gray-700 font-semibold">
                  {getInitials(providerName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-gray-900">{providerName}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {providerOnline ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Online</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span>Last seen 2h ago</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {comments.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Start the conversation</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Send your first message to begin coordinating care with the provider.
              </p>
            </div>
          ) : (
            <div className="px-6 py-4">
              {getTopLevelComments().map((comment, index) => {
                const isFromMe = comment.authorType === 'case_manager';
                const showAvatar = index === 0 || comments[index - 1]?.authorId !== comment.authorId || 
                  Math.abs(new Date(comment.createdAt).getTime() - new Date(comments[index - 1]?.createdAt || 0).getTime()) > 5 * 60 * 1000; // 5 minutes
                const replies = getRepliesForMessage(comment._id);
                const isThreadExpanded = expandedThreads.has(comment._id);
                
                return (
                  <div key={comment._id} className="mb-6">
                    {/* Main Message */}
                    <div className="group hover:bg-gray-50/50 -mx-6 px-6 py-2 rounded-lg">
                      <div className="flex gap-3">
                      {/* Avatar */}
                      <div className="flex-shrink-0 w-9">
                        {showAvatar ? (
                          <Avatar className="w-9 h-9">
                            <AvatarFallback className={`text-sm font-medium ${
                              isFromMe 
                                ? 'bg-gray-200 text-gray-700' 
                                : 'bg-gray-200 text-gray-700'
                            }`}>
                              {getInitials(capitalizeName(comment.authorName || (isFromMe ? 'You' : 'Provider')))}
                            </AvatarFallback>
                          </Avatar>
                        ) : null}
                      </div>

                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        {/* Header with name and timestamp */}
                        {showAvatar && (
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900">
                              {capitalizeName(comment.authorName || (isFromMe ? 'You' : 'Provider'))}
                            </span>
                            <span className="text-xs text-gray-500 font-normal">
                              {getTimeAgo(comment.createdAt)}
                            </span>
                            {comment.editedAt && (
                              <span className="text-xs text-gray-400 italic">
                                (edited)
                              </span>
                            )}
                          </div>
                        )}

                        {/* Category Header - Prominent like Slack message types */}
                        {comment.category && (
                          <div className={`inline-flex items-center gap-2 px-2 py-1 rounded text-xs font-medium mb-2 ${getCategoryStyle(comment.category, comment.priority)}`}>
                            {getCategoryIcon(comment.category)}
                            <span className="uppercase tracking-wide">
                              {comment.category === 'status_update' && 'Status Update'}
                              {comment.category === 'document_request' && 'Document Request'}
                              {comment.category === 'service_coordination' && 'Service Coordination'}
                              {comment.category === 'follow_up_required' && 'Follow-Up Required'}
                              {comment.category === 'incident' && 'Incident'}
                              {comment.category === 'general' && 'General'}
                              {/* Legacy support */}
                              {comment.category === 'status' && 'Status Update'}
                              {comment.category === 'progress' && 'Service Coordination'}
                              {comment.category === 'request' && 'Document Request'}
                              {comment.category === 'issue' && 'Incident'}
                              {comment.category === 'admin' && 'General'}
                            </span>
                            {comment.priority && comment.priority !== 'normal' && (
                              <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                                comment.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                comment.priority === 'important' ? 'bg-orange-100 text-orange-700' : ''
                              }`}>
                                {comment.priority.toUpperCase()}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Message text */}
                        <div className="text-sm text-gray-900 leading-relaxed">
                          {editingMessageId === comment._id ? (
                            <div className="space-y-2">
                              {/* Edit Category & Priority */}
                              <div className="flex items-center gap-2">
                                <Select value={editingCategory} onValueChange={setEditingCategory}>
                                  <SelectTrigger className="h-7 w-auto text-xs border-gray-300">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="status">📘 Status Update</SelectItem>
                                    <SelectItem value="progress">💚 Progress Report</SelectItem>
                                    <SelectItem value="request">🟣 Request</SelectItem>
                                    <SelectItem value="issue">🔴 Issue Alert</SelectItem>
                                    <SelectItem value="admin">⚪ Admin Note</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                <Select value={editingPriority} onValueChange={setEditingPriority}>
                                  <SelectTrigger className="h-7 w-auto text-xs border-gray-300">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="important">Important</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <Textarea
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                className="min-h-[60px] text-sm"
                                autoFocus
                              />
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleEditMessage(comment._id, editingContent, editingCategory, editingPriority)}
                                  className="h-7 px-3 bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingMessageId(null);
                                    setEditingContent('');
                                    setEditingCategory('status');
                                    setEditingPriority('normal');
                                  }}
                                  className="h-7 px-3"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap break-words">{comment.content}</p>
                          )}
                        </div>

                        {/* Message reactions/status */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-3">
                            {/* Reply button - Opens thread in right panel */}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                              onClick={() => {
                                setActiveThread(comment._id);
                                setRightPanelView('thread');
                              }}
                            >
                              <Reply className="h-3 w-3 mr-1" />
                              Reply
                            </Button>
                            
                            {/* Thread summary - Opens thread in right panel */}
                            {replies.length > 0 && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2 text-xs text-blue-600 hover:bg-blue-50"
                                onClick={() => {
                                  setActiveThread(comment._id);
                                  setRightPanelView('thread');
                                }}
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                              </Button>
                            )}
                          </div>
                          
                          {/* Message status for sent messages */}
                          {isFromMe && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              {getMessageStatusIcon(comment.status, comment.readBy)}
                              <span className="ml-1">
                                {comment.status === 'read' && comment.readBy?.length ? 'Read' :
                                 comment.status === 'delivered' ? 'Delivered' :
                                 comment.status === 'sent' ? 'Sent' :
                                 comment.status === 'sending' ? 'Sending...' : 'Sent'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Hover actions */}
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1">
                          {isFromMe && editingMessageId !== comment._id && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600"
                                onClick={() => {
                                  setEditingMessageId(comment._id);
                                  setEditingContent(comment.content);
                                  setEditingCategory(comment.category || 'status_update');
                                  setEditingPriority(comment.priority || 'normal');
                                }}
                                title="Edit message"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0 text-gray-500 hover:text-red-600"
                                onClick={() => setDeleteConfirmId(comment._id)}
                                title="Delete message"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Thread Replies */}
                  {replies.length > 0 && isThreadExpanded && (
                    <div className="ml-12 mt-4 border-l-2 border-gray-200 pl-4 space-y-3">
                      {replies.map((reply) => {
                        const isReplyFromMe = reply.authorType === 'case_manager';
                        return (
                          <div key={reply._id} className="group hover:bg-gray-50/50 -ml-4 pl-4 py-2 rounded">
                            <div className="flex gap-3">
                              <Avatar className="w-7 h-7">
                                <AvatarFallback className={`text-xs font-medium ${
                                  isReplyFromMe 
                                    ? 'bg-gray-200 text-gray-700' 
                                    : 'bg-gray-200 text-gray-700'
                                }`}>
                                  {getInitials(capitalizeName(reply.authorName || 'User'))}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 mb-1">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {capitalizeName(reply.authorName || 'User')}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {getTimeAgo(reply.createdAt)}
                                  </span>
                                  {reply.editedAt && (
                                    <span className="text-xs text-gray-400 italic">
                                      (edited)
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-900 leading-relaxed">
                                  {editingReplyId === reply._id ? (
                                    <div className="space-y-2">
                                      <Textarea
                                        value={editingReplyContent}
                                        onChange={(e) => setEditingReplyContent(e.target.value)}
                                        className="min-h-[60px] text-sm"
                                        autoFocus
                                      />
                                      <div className="flex items-center gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() => handleEditReply(reply._id, editingReplyContent)}
                                          className="h-7 px-3 bg-green-600 hover:bg-green-700"
                                        >
                                          <Check className="h-3 w-3 mr-1" />
                                          Save
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setEditingReplyId(null);
                                            setEditingReplyContent('');
                                          }}
                                          className="h-7 px-3"
                                        >
                                          <X className="h-3 w-3 mr-1" />
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="whitespace-pre-wrap break-words">{reply.content}</p>
                                  )}
                                </div>
                                {/* Reply status */}
                                {isReplyFromMe && (
                                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                    {getMessageStatusIcon(reply.status, reply.readBy)}
                                    <span className="ml-1">
                                      {reply.status === 'read' ? 'Read' : 
                                       reply.status === 'delivered' ? 'Delivered' : 'Sent'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Reply hover actions */}
                              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-1">
                                  {isReplyFromMe && editingReplyId !== reply._id && (
                                    <>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700"
                                        onClick={() => {
                                          setEditingReplyId(reply._id);
                                          setEditingReplyContent(reply.content);
                                        }}
                                        title="Edit reply"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 w-7 p-0 text-gray-500 hover:text-red-600"
                                        onClick={() => setDeleteConfirmId(reply._id)}
                                        title="Delete reply"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Reply Input */}
                  {replyingTo === comment._id && (
                    <div className="ml-12 mt-4 border-l-2 border-gray-200 pl-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2 text-xs text-gray-700">
                          <Reply className="h-3 w-3" />
                          <span>Replying to {capitalizeName(comment.authorName || 'User')}</span>
                        </div>
                        <Textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Write a reply..."
                          className="min-h-[60px] text-sm bg-white border-gray-200 focus:border-gray-400"
                          rows={2}
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="sm"
                            onClick={handleSendReply}
                            disabled={isSubmitting || !replyContent.trim()}
                            className="h-7 px-3 bg-gray-600 hover:bg-gray-700"
                          >
                            {isSubmitting ? (
                              <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-1" />
                            ) : (
                              <Send className="h-3 w-3 mr-1" />
                            )}
                            Reply
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyContent('');
                            }}
                            className="h-7 px-3"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                );
              })}


            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Composer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          {/* Category Selection Bar */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium text-gray-600">Message type:</span>
            <div className="flex items-center gap-1">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-7 w-auto text-xs border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status_update">📘 Status Update</SelectItem>
                  <SelectItem value="document_request">🟣 Document Request</SelectItem>
                  <SelectItem value="service_coordination">🟢 Service Coordination</SelectItem>
                  <SelectItem value="follow_up_required">🟠 Follow-Up Required</SelectItem>
                  <SelectItem value="incident">🔴 Incident</SelectItem>
                  <SelectItem value="general">⚪ General</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="h-7 w-auto text-xs border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Message Input */}
          <div className="flex items-end gap-3">
            {/* Avatar */}
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                {getInitials('You')}
              </AvatarFallback>
            </Avatar>
            
            {/* Input Container */}
            <div className="flex-1">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus-within:border-blue-400 focus-within:shadow-md transition-all">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Send a ${selectedCategory === 'status_update' ? 'status update' : 
                               selectedCategory === 'document_request' ? 'document request' :
                               selectedCategory === 'service_coordination' ? 'service coordination note' :
                               selectedCategory === 'follow_up_required' ? 'follow-up request' :
                               selectedCategory === 'incident' ? 'incident report' : 
                               selectedCategory === 'general' ? 'general message' : 'message'} to ${referral?.assignedProviderName || 'the provider'}...`}
                  className="w-full border-0 bg-transparent focus:ring-0 focus:outline-0 resize-none text-sm placeholder:text-gray-500 min-h-[44px] max-h-[120px] px-4 py-3"
                  rows={1}
                  style={{ boxShadow: 'none' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                
                {/* Bottom toolbar */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                      <Smile className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button
                    onClick={handleSendMessage}
                    disabled={isSubmitting || !newMessage.trim()}
                    size="sm"
                    className="h-7 px-4 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent" />
                    ) : (
                      <>
                        <Send className="h-3 w-3 mr-1" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Context */}
      <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col flex-shrink-0 overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-white">
          <div className="flex">
            <button
              onClick={() => setRightPanelView('details')}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                rightPanelView === 'details'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Details
            </button>
            <button
              onClick={() => setRightPanelView('thread')}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                rightPanelView === 'thread'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <MessageSquare className="h-4 w-4 inline mr-2" />
              Thread
              {activeThread && (
                <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {getRepliesForMessage(activeThread).length + 1}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {rightPanelView === 'details' ? (
            <div>
              {/* Details View */}
              <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${
              ['completed'].includes(referral?.status) ? 'bg-green-500' : 
              ['cancelled', 'rejected', 'expired'].includes(referral?.status) ? 'bg-red-500' : 
              'bg-blue-500'
            }`}></div>
            <h3 className="font-semibold text-gray-900">Referral Details</h3>
          </div>
          
          <div className="space-y-4">
            {/* Service Information */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900">Referral</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium text-gray-900">{serviceType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge className={`text-xs ${getStatusBadgeColor(referral?.status)}`}>
                    {getStatusLabel(referral?.status)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Urgency:</span>
                  <Badge variant={getUrgencyVariant(referral?.serviceDetails?.urgency)} className="text-xs">
                    {capitalizeName(referral?.serviceDetails?.urgency || 'Normal')}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="text-gray-900">{formatSafeDate(referral?.createdAt, 'MMM d')}</span>
                </div>
              </div>
            </div>

            {/* Provider Information */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Building className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-gray-900">Provider</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                      {getInitials(providerName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{providerName}</p>
                    <p className="text-xs text-gray-600">
                      {capitalizeName(referral?.assignedProviderOrganization || 'Healthcare Provider')}
                    </p>
                  </div>
                </div>
                {providerOnline ? (
                  <div className="flex items-center gap-2 text-xs text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Online now</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span>Last seen 2h ago</span>
                  </div>
                )}
              </div>
            </div>

            {/* Client Summary */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-5 w-5 text-green-600" />
                <span className="font-medium text-gray-900">Client</span>
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-green-100 text-green-700 text-xs">
                    {getInitials(clientName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{clientName}</p>
                  <p className="text-xs text-gray-600">Primary client</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Communication Stats */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Communication</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
              <div className="text-2xl font-bold text-gray-900">{comments.length}</div>
              <div className="text-xs text-gray-600">Messages</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {comments.filter(c => c.authorType === 'provider').length}
              </div>
              <div className="text-xs text-gray-600">From Provider</div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Recent Activity</span>
              <Clock className="h-4 w-4 text-gray-400" />
            </div>
            {comments.length > 0 ? (
              <div className="text-sm text-gray-600">
                Last message {getTimeAgo(comments[comments.length - 1]?.createdAt || '')}
                {comments[comments.length - 1]?.authorType === 'provider' && (
                  <span className="ml-1 text-blue-600">from {providerName}</span>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No messages yet</div>
            )}
          </div>
        </div>

        {/* Progress & Timeline */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Progress</h3>
          
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Completion</span>
                <span className="font-medium text-gray-900">
                  {referral?.progressPercentage || getProgressByStatus(referral?.status)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${referral?.progressPercentage || getProgressByStatus(referral?.status)}%` }}
                ></div>
              </div>
            </div>

            {/* Key Milestones */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-900">Referral created</span>
                <span className="text-gray-500 ml-auto">
                  {formatSafeDate(referral?.createdAt, 'MMM d')}
                </span>
              </div>
              
              {referral?.assignedProvider && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-900">Provider assigned</span>
                  <span className="text-gray-500 ml-auto">
                    {referral?.assignedProviderName ? 'Recently' : 'Pending'}
                  </span>
                </div>
              )}
              
              {comments.length > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-900">Communication started</span>
                  <span className="text-gray-500 ml-auto">
                    {formatSafeDate(comments[0]?.createdAt, 'MMM d')}
                  </span>
                </div>
              )}
              
              {referral?.status === 'in_progress' && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-gray-900">Service started</span>
                  <span className="text-gray-500 ml-auto">
                    In progress
                  </span>
                </div>
              )}
              
              {referral?.status === 'completed' && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-900">Service completed</span>
                  <span className="text-gray-500 ml-auto">
                    Recently
                  </span>
                </div>
              )}
              
              {referral?.status === 'cancelled' && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-900">Referral cancelled</span>
                  <span className="text-gray-500 ml-auto">
                    Recently
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

            {/* Quick Actions */}
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-2">
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  View Client Profile
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <Building className="h-4 w-4 mr-2" />
                  Provider Details
                </Button>

                <Button variant="ghost" size="sm" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Escalate to Admin
                </Button>
              </div>
            </div>
            </div>
          ) : (
            /* Thread View */
            <div className="flex flex-col h-full">
              {activeThread ? (
                <>
                  {/* Thread Header */}
                  <div className="p-6 border-b border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <h3 className="font-semibold text-gray-900 text-lg">Thread Conversation</h3>
                        <Badge variant="secondary" className="text-xs">
                          {getRepliesForMessage(activeThread).length} replies
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActiveThread(null);
                          setRightPanelView('details');
                        }}
                        className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Parent Message */}
                  {(() => {
                    const parentMessage = comments.find(c => c._id === activeThread);
                    if (!parentMessage) return null;
                    
                    const isParentFromMe = parentMessage.authorType === 'case_manager';
                    
                    return (
                      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                        <div className="flex gap-4">
                          <Avatar className="w-10 h-10 flex-shrink-0">
                            <AvatarFallback className={`text-sm font-medium ${
                              isParentFromMe 
                                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}>
                              {getInitials(capitalizeName(parentMessage.authorName || 'User'))}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-semibold text-gray-900">
                                {isParentFromMe ? 'You' : capitalizeName(parentMessage.authorName || 'Provider')}
                              </span>
                              <span className="text-xs text-gray-500">
                                {getTimeAgo(parentMessage.createdAt)}
                              </span>
                              {parentMessage.editedAt && (
                                <span className="text-xs text-gray-400 italic">
                                  (edited)
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-900 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                              {parentMessage.content}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Thread Replies */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {getRepliesForMessage(activeThread).map((reply) => {
                      const isFromMe = reply.authorType === 'case_manager';
                      return (
                        <div key={reply._id} className={`group flex gap-4 ${isFromMe ? 'flex-row-reverse' : ''}`}>
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarFallback className={`text-sm font-medium ${
                              isFromMe 
                                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                : 'bg-gray-50 text-gray-700 border border-gray-200'
                            }`}>
                              {getInitials(capitalizeName(reply.authorName || 'User'))}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`flex-1 min-w-0 ${isFromMe ? 'flex items-end flex-col' : ''}`}>
                            {/* Header with name, time, and edited indicator */}
                            <div className={`flex items-center gap-2 mb-2 ${isFromMe ? 'justify-end' : ''}`}>
                              <span className="text-sm font-semibold text-gray-900">
                                {isFromMe ? 'You' : capitalizeName(reply.authorName || 'Provider')}
                              </span>
                              <span className="text-xs text-gray-500">
                                {getTimeAgo(reply.createdAt)}
                              </span>
                              {reply.editedAt && (
                                <span className="text-xs text-gray-400 italic">
                                  (edited)
                                </span>
                              )}
                            </div>
                            
                            {/* Message bubble with improved styling */}
                            <div className={`relative max-w-[85%] ${isFromMe ? 'ml-auto' : ''}`}>
                              <div className={`text-sm leading-relaxed rounded-2xl px-4 py-3 shadow-sm ${
                                isFromMe 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-white text-gray-900 border border-gray-200'
                              }`}>
                                {editingReplyId === reply._id ? (
                                  <div className="space-y-3">
                                    <Textarea
                                      value={editingReplyContent}
                                      onChange={(e) => setEditingReplyContent(e.target.value)}
                                      className="min-h-[80px] text-sm bg-white text-gray-900 border-0 focus:ring-0 resize-none"
                                      autoFocus
                                    />
                                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                                      <Button
                                        size="sm"
                                        onClick={() => handleEditReply(reply._id, editingReplyContent)}
                                        className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        <Check className="h-3 w-3 mr-1" />
                                        Save
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setEditingReplyId(null);
                                          setEditingReplyContent('');
                                        }}
                                        className="h-8 px-3"
                                      >
                                        <X className="h-3 w-3 mr-1" />
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="whitespace-pre-wrap break-words">{reply.content}</p>
                                )}
                              </div>
                              
                              {/* Status indicator with better positioning */}
                              {isFromMe && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 justify-end">
                                  {getMessageStatusIcon(reply.status, reply.readBy)}
                                  <span className="ml-1 font-medium">
                                    {reply.status === 'read' ? 'Read' : 
                                     reply.status === 'delivered' ? 'Delivered' : 'Sent'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Reply hover actions with better positioning */}
                          {isFromMe && editingReplyId !== reply._id && (
                            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-start pt-2">
                              <div className="flex items-center gap-1 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                                  onClick={() => {
                                    setEditingReplyId(reply._id);
                                    setEditingReplyContent(reply.content);
                                  }}
                                  title="Edit reply"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => setDeleteConfirmId(reply._id)}
                                  title="Delete reply"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Thread Reply Input */}
                  <div className="p-6 border-t border-gray-200 bg-white shadow-sm">
                    <div className="flex gap-3">
                      <Textarea
                        value={threadReplyContent}
                        onChange={(e) => setThreadReplyContent(e.target.value)}
                        placeholder="Reply to thread..."
                        className="flex-1 min-h-[80px] resize-none border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendThreadReply();
                          }
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Smile className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActiveThread(null);
                            setRightPanelView('details');
                          }}
                          className="h-9 px-4 border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          Close
                        </Button>
                        <Button
                          onClick={handleSendThreadReply}
                          disabled={isSubmitting || !threadReplyContent.trim()}
                          size="sm"
                          className="h-9 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm rounded-lg"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* No Thread Selected */
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Thread Selected</h3>
                    <p className="text-gray-600">
                      Click the Reply button on a message to start a threaded conversation.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Message</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this message? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  const comment = comments.find(c => c._id === deleteConfirmId);
                  if (comment?.parentId) {
                    handleDeleteReply(deleteConfirmId);
                  } else {
                    handleDeleteMessage(deleteConfirmId);
                  }
                }}
                className="px-4"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 