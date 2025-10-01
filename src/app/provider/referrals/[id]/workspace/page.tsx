'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { formatSafeDate } from '@/lib/date-utils';
import { capitalizeName, formatServiceType, formatStatus } from '@/lib/formatting';
import Link from 'next/link';
import { cn } from '@/lib/utils';
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
  Lock
} from 'lucide-react';

import { STATUS_FLOW, type ReferralStatus, getStatusConfig } from '@/types/index';

// Provider quota check
async function checkProviderQuota(userId: string): Promise<{ isReadOnly: boolean; plan: string; reason?: string }> {
  try {
    const response = await fetch('/api/provider/quota-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    
    if (!response.ok) return { isReadOnly: false, plan: 'unknown' };
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to check quota:', error);
    return { isReadOnly: false, plan: 'unknown' };
  }
}

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
  
  // Internal comments (only visible to the author)
  isInternal?: boolean;
  
  // Attachments
  attachments?: Array<{
    name: string;
    type: string;
    size: string;
    url?: string;
  }>;
}

export default function ProviderWorkspacePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const referralId = params?.id;
  const { toast } = useToast();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get return path from URL parameters
  const returnTo = searchParams?.get('returnTo');
  const highlightClient = searchParams?.get('highlightClient');
  const defaultBackPath = '/provider/workspace';
  
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [referral, setReferral] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const [caseManagerOnline, setCaseManagerOnline] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingCategory, setEditingCategory] = useState<string>('status_update');
  const [editingPriority, setEditingPriority] = useState<string>('normal');
  const [selectedCategory, setSelectedCategory] = useState<string>('status_update');
  const [selectedPriority, setSelectedPriority] = useState<string>('normal');
  const [isInternalNote, setIsInternalNote] = useState(false);
  
  // Threading state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  
  // Quota state
  const [quotaStatus, setQuotaStatus] = useState<{ isReadOnly: boolean; plan: string; reason?: string }>({ 
    isReadOnly: false, 
    plan: 'unknown' 
  });

  // Add the same message status functions as case manager
  const getMessageStatusIcon = (status: string = 'sent', readBy?: any[]) => {
    switch (status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-gray-400 animate-pulse" />;
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return readBy && readBy.length > 0 ? 
          <CheckCheck className="h-3 w-3 text-blue-500" /> : 
          <Check className="h-3 w-3 text-gray-400" />;
    }
  };

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  // Auto-refresh comments every 10 seconds for status updates
  useEffect(() => {
    if (!referralId) return;
    
    const interval = setInterval(async () => {
      try {
        const commentsRes = await fetch(`/api/referrals/${referralId}/comments`);
        if (commentsRes.ok) {
          const commentsData = await commentsRes.json();
          setComments(commentsData.comments || []);
        }
      } catch (error) {
        console.error('Error refreshing comments for status updates:', error);
      }
    }, 10000); // 10 seconds

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
          const userId = userData.user?.id || '';
          setCurrentUserId(userId);
          
          // Check provider quota status
          if (userId) {
            const quota = await checkProviderQuota(userId);
            setQuotaStatus(quota);
          }
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

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/referrals/${referralId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          category: selectedCategory,
          priority: selectedPriority,
          parentId: replyingTo || undefined,
          isInternal: isInternalNote
        })
      });

      if (!response.ok) throw new Error('Failed to send message');

      // Refresh comments
      const commentsRes = await fetch(`/api/referrals/${referralId}/comments`);
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData.comments || []);
      }

      setNewMessage('');
      setReplyingTo(null); // Clear reply state
      setIsInternalNote(false); // Clear internal note state
      
      toast({
        title: "Message sent",
        description: "Your message has been delivered"
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit message
  const handleEditMessage = async (messageId: string, newContent: string, newCategory: string, newPriority: string) => {
    try {
      const response = await fetch(`/api/referrals/${referralId}/comments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId: messageId,
          content: newContent,
          category: newCategory,
          priority: newPriority
        })
      });

      if (!response.ok) throw new Error('Failed to edit message');

      // Refresh comments
      const commentsRes = await fetch(`/api/referrals/${referralId}/comments`);
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData.comments || []);
      }

      setEditingMessageId(null);
      setEditingContent('');
      setEditingCategory('status_update');
      setEditingPriority('normal');
      
      toast({
        title: "Message updated",
        description: "Your message has been edited"
      });
    } catch (error) {
      console.error('Error editing message:', error);
      toast({
        title: "Error",
        description: "Failed to edit message",
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

      if (!response.ok) throw new Error('Failed to delete message');

      // Refresh comments
      const commentsRes = await fetch(`/api/referrals/${referralId}/comments`);
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData.comments || []);
      }
      
      toast({
        title: "Message deleted",
        description: "Your message has been removed"
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive"
      });
    }
  };

  // Handle typing indicator - only for the other user typing
  const handleTyping = () => {
    // This should actually be triggered by real-time events from the other user
    // For now, we'll disable the automatic trigger when current user types
    // setIsTyping(true);
    // setTimeout(() => setIsTyping(false), 2000);
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

  // Threading helper functions
  const getRepliesForMessage = (messageId: string): Comment[] => {
    return comments.filter(comment => comment.parentId === messageId);
  };

  const getTopLevelComments = (): Comment[] => {
    return comments.filter(comment => !comment.parentId);
  };

  // Count all replies in a thread recursively
  const getTotalReplyCount = (messageId: string): number => {
    const directReplies = getRepliesForMessage(messageId);
    let totalCount = directReplies.length;
    
    // Recursively count nested replies
    directReplies.forEach(reply => {
      totalCount += getTotalReplyCount(reply._id);
    });
    
    return totalCount;
  };

  // Recursive function to render replies with nested structure
  const renderNestedReplies = (parentId: string, depth: number = 0): JSX.Element[] => {
    const replies = getRepliesForMessage(parentId);
    const maxDepth = 5; // Prevent infinite nesting
    
    if (replies.length === 0 || depth >= maxDepth) {
      return [];
    }

    return replies.map((reply) => {
      const isReplyFromMe = reply.authorType === 'provider';
      const nestedReplies = renderNestedReplies(reply._id, depth + 1);
      
      return (
        <div key={reply._id} className={`${depth > 0 ? 'ml-6' : ''}`}>
          <div className="group hover:bg-gray-50/50 -ml-4 pl-4 py-2 rounded">
            <div className="flex gap-3">
              <Avatar className="w-7 h-7">
                <AvatarFallback className={`text-xs font-medium ${
                  isReplyFromMe 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {getInitials(isReplyFromMe ? 'You' : caseManagerName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900">
                    {isReplyFromMe ? 'You' : caseManagerName}
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
                  {editingMessageId === reply._id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="min-h-[60px] text-sm"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditMessage(reply._id, editingContent, editingCategory, editingPriority)}
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
                          }}
                          className="h-7 px-3"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{reply.content}</p>
                  )}
                </div>
              </div>
              
              {/* Thread Reply Actions */}
              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600"
                    onClick={() => {
                      setReplyingTo(reply._id);
                      setTimeout(() => {
                        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    title="Reply to this message"
                  >
                    <Reply className="h-3 w-3" />
                  </Button>
                  {isReplyFromMe && editingMessageId !== reply._id && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600"
                        onClick={() => {
                          setEditingMessageId(reply._id);
                          setEditingContent(reply.content);
                          setEditingCategory(reply.category || 'status_update');
                          setEditingPriority(reply.priority || 'normal');
                        }}
                        title="Edit message"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 text-gray-500 hover:text-red-600"
                        onClick={() => handleDeleteMessage(reply._id)}
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
          
          {/* Render nested replies recursively */}
          {nestedReplies.length > 0 && (
            <div className="ml-4 border-l-2 border-gray-200 pl-4">
              {nestedReplies}
            </div>
          )}
        </div>
      );
    });
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
    const normalizedCategory = category || 'general';
    switch (normalizedCategory) {
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
    const normalizedCategory = category || 'general';
    switch (normalizedCategory) {
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
  const caseManagerName = (() => {
    const name = referral?.caseManager?.name || referral?.caseManagerName;
    if (!name) return 'Case Manager';
    
    // If it looks like an email, extract the part before @
    if (name.includes('@')) {
      const emailPrefix = name.split('@')[0];
      // Convert common email patterns to readable names
      return capitalizeName(emailPrefix.replace(/[._]/g, ' '));
    }
    
    return capitalizeName(name);
  })();

  return (
    <div className="h-screen bg-white flex">
      {/* Left Sidebar - Navigation */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="mb-4">
            <Button variant="ghost" size="sm" className="flex items-center gap-2 h-8 px-2 -ml-2 mb-3" asChild>
              <Link href={returnTo || defaultBackPath}>
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {returnTo?.includes('/clients') ? 'Back to Clients' : 'Back to Workspace'}
                </span>
              </Link>
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 mb-1">My Workspace</h1>
              <p className="text-sm text-gray-600">Client care coordination</p>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              className="pl-10 bg-white border-gray-200 h-9 text-sm"
            />
          </div>
        </div>

        {/* Current Conversation */}
        <div className="flex-1 p-4">
          <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
            <div className="flex items-start gap-3">
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-sm">
                  {getInitials(clientName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate text-sm">{clientName}</h3>
                  <Badge className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5">Active</Badge>
                </div>
                <p className="text-xs text-gray-600 truncate">{serviceType}</p>
                <p className="text-xs text-gray-500 mt-0.5">with {caseManagerName}</p>
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
                  {getInitials(caseManagerName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-gray-900">{caseManagerName}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {caseManagerOnline ? (
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
                Send your first message to begin coordinating care with the case manager.
              </p>
            </div>
          ) : (
            <div className="px-6 py-4">
              {getTopLevelComments().map((comment, index) => {
                const isFromMe = comment.authorType === 'provider';
                const topLevelComments = getTopLevelComments();
                const showAvatar = index === 0 || topLevelComments[index - 1]?.authorId !== comment.authorId || 
                  Math.abs(new Date(comment.createdAt).getTime() - new Date(topLevelComments[index - 1]?.createdAt || 0).getTime()) > 5 * 60 * 1000; // 5 minutes
                const replies = getRepliesForMessage(comment._id);
                
                return (
                  <div key={comment._id} className="group hover:bg-gray-50/50 -mx-6 px-6 py-2">
                    <div className="flex gap-3">
                      {/* Avatar */}
                      <div className="flex-shrink-0 w-9">
                        {showAvatar ? (
                          <Avatar className="w-9 h-9">
                            <AvatarFallback className={`text-sm font-medium ${
                              isFromMe 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {getInitials(isFromMe ? 'You' : caseManagerName)}
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
                              {isFromMe ? 'You' : caseManagerName}
                            </span>
                            <span className="text-xs text-gray-500 font-normal">
                              {getTimeAgo(comment.createdAt)}
                            </span>
                          </div>
                        )}

                        {/* Category Header - Always show, prominent like Slack message types */}
                        <div className={`inline-flex items-center gap-2 px-2 py-1 rounded text-xs font-medium mb-2 ${getCategoryStyle(comment.category || 'general', comment.priority)}`}>
                          {getCategoryIcon(comment.category || 'general')}
                          <span className="uppercase tracking-wide">
                            {(() => {
                              const category = comment.category || 'general';
                              switch (category) {
                                case 'status_update': case 'status': return 'Status Update';
                                case 'document_request': case 'request': return 'Document Request';
                                case 'service_coordination': case 'progress': return 'Service Coordination';
                                case 'follow_up_required': return 'Follow-Up Required';
                                case 'incident': case 'issue': return 'Incident';
                                case 'admin': case 'general': return 'General';
                                default: return 'General';
                              }
                            })()}
                          </span>
                          {comment.priority && comment.priority !== 'normal' && (
                            <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                              comment.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                              comment.priority === 'important' ? 'bg-orange-100 text-orange-700' : ''
                            }`}>
                              {comment.priority.toUpperCase()}
                            </span>
                          )}
                          {comment.isInternal && (
                            <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                              <Lock className="h-3 w-3 inline mr-1" />
                              INTERNAL NOTE
                            </span>
                          )}
                        </div>

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
                                    <SelectItem value="status_update">📘 Status Update</SelectItem>
                                    <SelectItem value="document_request">🟣 Document Request</SelectItem>
                                    <SelectItem value="service_coordination">🟢 Service Coordination</SelectItem>
                                    <SelectItem value="follow_up_required">🟠 Follow-Up Required</SelectItem>
                                    <SelectItem value="incident">🔴 Incident</SelectItem>
                                    <SelectItem value="general">⚪ General</SelectItem>
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
                                    setEditingCategory('status_update');
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
                          
                          {/* Internal note indicator */}
                          {comment.isInternal && (
                            <div className="mt-2">
                              <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                                <Lock className="h-3 w-3 inline mr-1" />
                                INTERNAL NOTE
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Message reactions/status */}
                        <div className="flex items-center gap-3 mt-2">
                          {isFromMe && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <CheckCheck className="h-3 w-3" />
                              <span>Delivered</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Hover actions */}
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600"
                            onClick={() => {
                              setReplyingTo(comment._id);
                              // Focus on message composer (scroll to bottom)
                              setTimeout(() => {
                                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                              }, 100);
                            }}
                            title="Reply to message"
                          >
                            <Reply className="h-3 w-3" />
                          </Button>
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
                                onClick={() => handleDeleteMessage(comment._id)}
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

                    {/* Thread count and inline replies */}
                    {getTotalReplyCount(comment._id) > 0 && (
                      <div className="ml-12 mt-3">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs text-blue-600 hover:bg-blue-50 mb-2"
                          onClick={() => {
                            const newExpanded = new Set(expandedThreads);
                            if (expandedThreads.has(comment._id)) {
                              newExpanded.delete(comment._id);
                            } else {
                              newExpanded.add(comment._id);
                            }
                            setExpandedThreads(newExpanded);
                          }}
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {(() => {
                            const totalReplies = getTotalReplyCount(comment._id);
                            return `${totalReplies} ${totalReplies === 1 ? 'reply' : 'replies'}`;
                          })()}
                        </Button>

                        {/* Inline thread expansion with recursive nesting */}
                        {expandedThreads.has(comment._id) && (
                          <div className="border-l-2 border-gray-200 pl-4 space-y-3">
                            {renderNestedReplies(comment._id)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-3 py-2 px-6 -mx-6">
                  <div className="w-9 flex-shrink-0"></div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span>{caseManagerName} is typing...</span>
                  </div>
                </div>
              )}
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

          {/* Reply indicator */}
          {replyingTo && (
            <div className="mb-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Reply className="h-4 w-4" />
                  <span>Replying to message</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-blue-700 hover:text-blue-900"
                  onClick={() => setReplyingTo(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="mt-1 text-xs text-blue-600 truncate">
                {(() => {
                  const replyToMessage = comments.find(c => c._id === replyingTo);
                  return replyToMessage?.content.substring(0, 100) + ((replyToMessage?.content?.length || 0) > 100 ? '...' : '');
                })()}
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="flex items-end gap-3">
            {/* Avatar */}
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                {(() => {
                  // Get provider's actual name/initials from user data
                  const providerName = user?.user_metadata?.name || user?.user_metadata?.organization || user?.email?.split('@')[0] || 'Provider';
                  return getInitials(providerName);
                })()}
              </AvatarFallback>
            </Avatar>
            
            {/* Input Container */}
            <div className="flex-1">
              {quotaStatus.isReadOnly ? (
                // Read-only mode with upgrade banner
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-amber-900 mb-1">
                        Messaging Restricted - {quotaStatus.plan.charAt(0).toUpperCase() + quotaStatus.plan.slice(1)} Plan
                      </h3>
                      <p className="text-sm text-amber-700 mb-3">
                        {quotaStatus.reason}
                      </p>
                      <Button
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={() => {
                          // Navigate to billing/upgrade page
                          window.open('/provider/settings?tab=billing', '_blank');
                        }}
                      >
                        Upgrade Plan
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus-within:border-blue-400 focus-within:shadow-md transition-all">
                <Textarea
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder={`Send a ${selectedCategory === 'status_update' ? 'status update' : 
                               selectedCategory === 'document_request' ? 'document request' :
                               selectedCategory === 'service_coordination' ? 'service coordination note' :
                               selectedCategory === 'follow_up_required' ? 'follow-up request' :
                               selectedCategory === 'incident' ? 'incident report' : 
                               selectedCategory === 'general' ? 'general message' : 'message'} to ${caseManagerName}...`}
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
                    
                    {/* Internal Note Toggle */}
                    <Button
                      variant={isInternalNote ? "default" : "ghost"}
                      size="sm"
                      className={`h-7 px-2 text-xs font-medium ${
                        isInternalNote 
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-200" 
                          : "text-gray-500 hover:text-amber-600 hover:bg-amber-50"
                      }`}
                      onClick={() => setIsInternalNote(!isInternalNote)}
                      title="Toggle internal note (only visible to you)"
                    >
                      <Lock className="h-3 w-3 mr-1" />
                      {isInternalNote ? 'Internal Note' : 'Private'}
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Context */}
      <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto">
        {/* Referral Overview */}
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

            {/* Case Manager Information */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Building className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-gray-900">Case Manager</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                      {getInitials(caseManagerName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{caseManagerName}</p>
                    <p className="text-xs text-gray-600">
                      {capitalizeName(referral?.caseManagerOrganization || 'Care Coordination')}
                    </p>
                  </div>
                </div>
                {caseManagerOnline ? (
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
                {comments.filter(c => c.authorType === 'case_manager').length}
              </div>
              <div className="text-xs text-gray-600">From Case Manager</div>
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
                {comments[comments.length - 1]?.authorType === 'case_manager' && (
                  <span className="ml-1 text-blue-600">from {caseManagerName}</span>
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
    </div>
  );
} 