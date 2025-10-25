'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { WorkspaceSkeleton } from '@/components/skeletons/WorkspaceSkeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ChevronDown, ChevronRight, Search, Plus, MessageSquare, 
  CheckCircle2, XCircle, Clock, AlertTriangle, DollarSign,
  AlertCircle, HelpCircle, Calendar, User, Building, Phone,
  Mail, FileText, ArrowLeft, Hash, MoreVertical, Edit, Trash2
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Issue, ISSUE_TYPE_CONFIG, ISSUE_STATUS_CONFIG } from '@/types/issues';
import { Task, TASK_STATUS_CONFIG } from '@/types/tasks';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

// Extended Issue type with workspace-specific fields from API
interface WorkspaceIssue extends Issue {
  clientName: string;
  providerName: string;
  serviceName: string;
  serviceType?: string;
}

interface ClientGroup {
  clientId: string;
  clientName: string;
  active: WorkspaceIssue[];
  archived: WorkspaceIssue[];
}

interface WorkspaceData {
  success: boolean;
  clients: ClientGroup[];
  stats: {
    totalClients: number;
    totalIssues: number;
    activeIssues: number;
    archivedIssues: number;
  };
}

interface IssueDetails extends Issue {
  client: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  provider: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  service: {
    _id: string;
    name: string;
    category: string;
  };
  serviceRelationship: {
    _id: string;
    status: string;
    startDate?: string;
    endDate?: string;
  };
  tasks: Array<{
    _id: string;
    title: string;
    status: string;
    dueDate?: string;
  }>;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function WorkspacePage() {
  const { user } = useAuth();
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<WorkspaceIssue | null>(null);
  const [issueDetails, setIssueDetails] = useState<IssueDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [collapsedThreads, setCollapsedThreads] = useState<Set<string>>(new Set());

  // Fetch workspace data
  const { data, error, isLoading, mutate } = useSWR<WorkspaceData>('/api/workspace/issues', fetcher, {
    refreshInterval: 30000, // Refresh every 30s
  });

  // Load current user's avatar and member ID
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        // Get avatar
        let userAvatarUrl = user?.user_metadata?.avatar_url || 
                           (user as any)?.avatar_url || 
                           user?.user_metadata?.picture ||
                           null;
        
        if (!userAvatarUrl && user.id) {
          try {
            const response = await fetch(`/api/users/${user.id}`);
            if (response.ok) {
              const data = await response.json();
              userAvatarUrl = data.user?.avatar_url || null;
            }
          } catch (error) {
            console.error('Error fetching user avatar:', error);
          }
        }
        
        setAvatarUrl(userAvatarUrl);

        // Get org_member ID for ownership checks
        try {
          const response = await fetch(`/api/org-members/current`);
          if (response.ok) {
            const data = await response.json();
            setCurrentMemberId(data.memberId);
          }
        } catch (error) {
          console.error('Error fetching member ID:', error);
        }
      }
    };

    loadUserData();
  }, [user]);

  // Extract user info
  const userName = user?.user_metadata?.full_name || 
                   user?.user_metadata?.fullName || 
                   user?.user_metadata?.name || 
                   user?.name ||
                   user?.email?.split('@')[0] || 
                   'User';

  const userRole = user?.user_metadata?.role || 'case_manager';
  const userOrganization = user?.organization?.name || 'Organization';
  const userEmail = user?.email || '';
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);

  // Auto-expand clients and active folders when data loads
  useEffect(() => {
    if (data?.clients) {
      const newExpandedClients = new Set<string>();
      const newExpandedFolders = new Set<string>();
      let firstActiveIssue: WorkspaceIssue | null = null;
      
      data.clients.forEach(client => {
        if (client.active.length > 0) {
          // Auto-expand clients with active issues
          newExpandedClients.add(client.clientId);
          // Auto-expand their active folders
          newExpandedFolders.add(`${client.clientId}-active`);
          
          // Get first active issue if we haven't found one yet
          if (!firstActiveIssue && client.active.length > 0) {
            firstActiveIssue = client.active[0];
          }
        }
      });
      
      setExpandedClients(newExpandedClients);
      setExpandedFolders(newExpandedFolders);
      
      // Auto-select first active issue if none is selected
      if (firstActiveIssue && !selectedIssue) {
        setSelectedIssue(firstActiveIssue);
      }
    }
  }, [data, selectedIssue]);

  // Fetch selected issue details
  useEffect(() => {
    if (!selectedIssue) {
      setIssueDetails(null);
      return;
    }

    const fetchDetails = async () => {
      setLoadingDetails(true);
      try {
        const response = await fetch(`/api/issues/${selectedIssue._id}`);
        const result = await response.json();
        if (result.success) {
          setIssueDetails(result.issue);
        }
      } catch (err) {
        console.error('Error fetching issue details:', err);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [selectedIssue]);

  // Handlers
  const toggleClient = (clientId: string) => {
    setExpandedClients(prev => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleSelectIssue = (issue: WorkspaceIssue) => {
    setSelectedIssue(issue);
  };

  const handleAddComment = async () => {
    if (!selectedIssue || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/issues/${selectedIssue._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        setNewComment('');
        // Refresh issue details
        const detailsResponse = await fetch(`/api/issues/${selectedIssue._id}`);
        const result = await detailsResponse.json();
        if (result.success) {
          setIssueDetails(result.issue);
        }
        mutate(); // Refresh workspace data
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!selectedIssue || !editingContent.trim()) return;

    try {
      const response = await fetch(`/api/issues/${selectedIssue._id}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingContent }),
      });

      if (response.ok) {
        setEditingCommentId(null);
        setEditingContent('');
        // Refresh issue details
        const detailsResponse = await fetch(`/api/issues/${selectedIssue._id}`);
        const result = await detailsResponse.json();
        if (result.success) {
          setIssueDetails(result.issue);
        }
      }
    } catch (err) {
      console.error('Error editing comment:', err);
    }
  };

  const handleDeleteComment = async () => {
    if (!selectedIssue || !deletingCommentId) return;

    try {
      const response = await fetch(`/api/issues/${selectedIssue._id}/comments/${deletingCommentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDeletingCommentId(null);
        // Refresh issue details
        const detailsResponse = await fetch(`/api/issues/${selectedIssue._id}`);
        const result = await detailsResponse.json();
        if (result.success) {
          setIssueDetails(result.issue);
        }
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      setDeletingCommentId(null);
    }
  };

  const handleReplyToComment = async (parentCommentId: string) => {
    if (!selectedIssue || !replyContent.trim()) return;

    try {
      const response = await fetch(`/api/issues/${selectedIssue._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: replyContent,
          parentCommentId 
        }),
      });

      if (response.ok) {
        setReplyingToId(null);
        setReplyContent('');
        // Refresh issue details
        const detailsResponse = await fetch(`/api/issues/${selectedIssue._id}`);
        const result = await detailsResponse.json();
        if (result.success) {
          setIssueDetails(result.issue);
        }
        mutate(); // Refresh workspace data
      }
    } catch (err) {
      console.error('Error replying to comment:', err);
    }
  };

  const handleResolveIssue = async () => {
    if (!selectedIssue) return;

    try {
      const response = await fetch(`/api/issues/${selectedIssue._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED' }),
      });

      if (response.ok) {
        setSelectedIssue(null);
        setIssueDetails(null);
        mutate(); // Refresh workspace data
      }
    } catch (err) {
      console.error('Error resolving issue:', err);
    }
  };

  // Toggle thread expansion/collapse
  const toggleThread = (commentId: string, currentDepth: number) => {
    // Determine current state
    const isCurrentlyCollapsed = collapsedThreads.has(commentId) || 
      (!expandedThreads.has(commentId) && currentDepth >= 1);
    
    if (isCurrentlyCollapsed) {
      // Expand: remove from collapsed, add to expanded
      setCollapsedThreads(prev => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
      setExpandedThreads(prev => {
        const next = new Set(prev);
        next.add(commentId);
        return next;
      });
    } else {
      // Collapse: remove from expanded, add to collapsed
      setExpandedThreads(prev => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
      setCollapsedThreads(prev => {
        const next = new Set(prev);
        next.add(commentId);
        return next;
      });
    }
  };

  // Render comment with threading support
  const renderComment = (comment: any, depth = 0) => {
    const isEditing = editingCommentId === comment._id;
    const isReplying = replyingToId === comment._id;
    const isOwnComment = comment.createdByMemberId === currentMemberId; // Check if it's user's own comment
    const replyCount = comment.replies?.length || 0;
    const hasReplies = replyCount > 0;
    
    // 🎯 Slack-style: Collapsible at all depths with smart defaults
    // Manual collapse takes precedence, then manual expand, then default behavior
    const isCollapsed = collapsedThreads.has(comment._id) 
      ? true  // Manually collapsed
      : expandedThreads.has(comment._id)
        ? false  // Manually expanded
        : depth >= 1 && hasReplies;  // Default: auto-collapse level 1+, keep level 0 open
    
    // 🎯 Production fix: Cap indentation at 3 levels max
    const maxIndentLevel = 3;
    const shouldIndent = depth > 0 && depth <= maxIndentLevel;
    const isDeepThread = depth > maxIndentLevel;

    return (
      <div key={comment._id} className={cn(
        "space-y-2",
        (shouldIndent || isDeepThread) && "border-l-2 pl-4",
        shouldIndent && "ml-8 border-slate-200",
        isDeepThread && "border-slate-300"
      )}>
        <div className="flex gap-2 items-start hover:bg-slate-50 -mx-2 px-2 py-1.5 rounded group">
          {/* Avatar */}
          <Avatar className="w-8 h-8 flex-shrink-0">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={userName} className="object-cover" />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs font-bold">
              {userInitials}
            </AvatarFallback>
          </Avatar>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-slate-900">{userName}</span>
                <span className="text-[11px] text-slate-500">
                  {new Date(comment.createdAt).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit' 
                  })}
                </span>
                {comment.updatedAt && (
                  <span className="text-[11px] text-slate-400">(edited)</span>
                )}
              </div>

              {/* Action Buttons - Show on hover */}
              {!isEditing && (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white border-2 shadow-lg z-[9999]">
                    <DropdownMenuItem 
                      onClick={() => {
                        setReplyingToId(comment._id);
                        setReplyContent('');
                      }}
                      className="cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Reply
                    </DropdownMenuItem>
                    {isOwnComment && (
                      <>
                        <DropdownMenuItem 
                          onClick={() => {
                            setEditingCommentId(comment._id);
                            setEditingContent(comment.content);
                          }}
                          className="cursor-pointer"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeletingCommentId(comment._id)}
                          className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Message Content or Edit Input */}
            {isEditing ? (
              <div className="mt-1 space-y-2">
                <Input
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="text-[13px]"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleEditComment(comment._id)}
                    className="h-7 text-xs"
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingCommentId(null);
                      setEditingContent('');
                    }}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-[13px] text-slate-700 leading-relaxed mt-0.5 break-words">
                {comment.content}
              </div>
            )}

            {/* Slack-Style Reply Thread Toggle */}
            {hasReplies && (
              <button
                onClick={() => toggleThread(comment._id, depth)}
                className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-md text-[13px] font-semibold text-blue-600 hover:bg-blue-50 transition-colors group"
              >
                {isCollapsed ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>{replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
                    <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>Hide {replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
                    <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Reply Input */}
        {isReplying && (
          <div className={cn(
            "mt-2",
            // Cap margin for reply input too
            depth < maxIndentLevel ? "ml-10" : "ml-4"
          )}>
            <div className="flex gap-2">
              <Input
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="text-[13px]"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleReplyToComment(comment._id);
                  }
                }}
              />
              <Button
                size="sm"
                onClick={() => handleReplyToComment(comment._id)}
                disabled={!replyContent.trim()}
                className="h-9"
              >
                Send
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setReplyingToId(null);
                  setReplyContent('');
                }}
                className="h-9"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Render Nested Replies (only if not collapsed) */}
        {hasReplies && !isCollapsed && (
          <div className="space-y-2">
            {comment.replies.map((reply: any) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Get icon for issue type
  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'QUALITY_CONCERN':
        return AlertTriangle;
      case 'INCIDENT_REVIEW':
        return AlertCircle;
      case 'FUNDING_ISSUE':
        return DollarSign;
      default:
        return HelpCircle;
    }
  };

  if (isLoading) {
    return <WorkspaceSkeleton />;
  }

  if (error) {
    return (
      <div className="flex h-screen bg-[#F9FAFB]">
        <div className="w-[60px] bg-slate-900"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Connection Error</h3>
            <p className="text-sm text-slate-600 mb-6">Failed to load workspace data</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const clients = data?.clients || [];
  const stats = data?.stats || { totalClients: 0, totalIssues: 0, activeIssues: 0, archivedIssues: 0 };

  return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden">
      
      {/* Far-Left Icon Bar - Simplified */}
      <div className="w-[60px] bg-slate-900 flex flex-col items-center py-4 gap-3 flex-shrink-0">
        {/* Home / Table */}
        <Link href="/case-manager">
          <button className="w-11 h-11 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors group" title="Back to Table">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
        </Link>

        {/* Issues (Active) */}
        <button className="w-11 h-11 rounded-lg bg-white/30 hover:bg-white/40 flex items-center justify-center transition-colors relative" title="Issues">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {stats.activeIssues > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {stats.activeIssues}
            </span>
          )}
        </button>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Settings */}
        <Link href="/case-manager/settings">
          <button className="w-11 h-11 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" title="Settings">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </Link>
      </div>
      
      {/* Panel 1: Issues Sidebar - Slack Style with Client Grouping */}
      <div className="w-[320px] bg-white flex flex-col flex-shrink-0 border-r border-slate-200">
        {/* Header - Slack Style */}
        <div className="px-4 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-slate-900">Issues</h1>
            <span className="text-sm text-slate-500">{stats.totalIssues}</span>
          </div>
        </div>

        {/* Search - Compact Slack Style */}
        <div className="px-3 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search issues"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-sm bg-slate-50 border-0 text-slate-900 placeholder-slate-400 rounded focus:bg-white focus:ring-1 focus:ring-slate-300"
            />
          </div>
        </div>

        {/* Issues List - Slack Channel Style with Client Grouping */}
        <ScrollArea className="flex-1">
          <div className="py-2">
            {clients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">No issues</p>
              </div>
            ) : (
              <>
                {clients.map((client) => (
                  <div key={client.clientId} className="mb-2">
                    {/* Client Header - Slack Style */}
                    <button
                      onClick={() => toggleClient(client.clientId)}
                      className="w-full flex items-center gap-2 px-3 py-1 hover:bg-slate-50 text-left group"
                    >
                      {expandedClients.has(client.clientId) ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      )}
                      {/* Client Initials Circle */}
                      <div className="w-5 h-5 rounded flex items-center justify-center bg-blue-100 text-blue-700 text-[10px] font-bold flex-shrink-0">
                        {client.clientName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <span className="text-sm font-medium text-slate-700 truncate flex-1">
                        {client.clientName}
                      </span>
                      {client.active.length > 0 && (
                        <span className="text-xs text-slate-500 flex-shrink-0">
                          {client.active.length}
                        </span>
                      )}
                    </button>

                    {/* Issues under this client - Channel List Style */}
                    {expandedClients.has(client.clientId) && (
                      <div className="ml-6 mt-0.5 space-y-0.5">
                        {client.active.map((issue) => {
                          const IssueIcon = getIssueIcon(issue.type);
                          const config = ISSUE_TYPE_CONFIG[issue.type];
                          const isSelected = selectedIssue?._id === issue._id;

                          return (
                            <button
                              key={issue._id}
                              onClick={() => handleSelectIssue(issue)}
                              className={cn(
                                'w-full flex flex-col gap-0.5 px-3 py-1.5 rounded text-left transition-colors',
                                isSelected 
                                  ? 'bg-blue-100 text-blue-900 font-medium' 
                                  : 'text-slate-700 hover:bg-slate-50'
                              )}
                            >
                              <div className="flex items-center gap-2 w-full">
                                <span className="text-slate-500 text-sm">#</span>
                                <span className="truncate flex-1 text-sm font-medium">{config.label}</span>
                                {issue.status === 'OPEN' && (
                                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 pl-5 truncate w-full">
                                {issue.providerName} · {issue.serviceName}
                              </div>
                            </button>
                          );
                        })}
                        
                        {client.archived.length > 0 && (
                          <>
                            <button
                              onClick={() => toggleFolder(`${client.clientId}-archived`)}
                              className="w-full flex items-center gap-2 px-3 py-1 text-left text-xs text-slate-500 hover:text-slate-700"
                            >
                              {expandedFolders.has(`${client.clientId}-archived`) ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                              <span>Archived ({client.archived.length})</span>
                            </button>
                            
                            {expandedFolders.has(`${client.clientId}-archived`) && (
                              <div className="space-y-0.5">
                                {client.archived.map((issue) => {
                                  const config = ISSUE_TYPE_CONFIG[issue.type];
                                  const isSelected = selectedIssue?._id === issue._id;

                                  return (
                                    <button
                                      key={issue._id}
                                      onClick={() => handleSelectIssue(issue)}
                                      className={cn(
                                        'w-full flex flex-col gap-0.5 px-3 py-1.5 rounded text-left transition-colors opacity-60 hover:opacity-100',
                                        isSelected 
                                          ? 'bg-slate-100 text-slate-700' 
                                          : 'text-slate-500 hover:bg-slate-50'
                                      )}
                                    >
                                      <div className="flex items-center gap-2 w-full">
                                        <span className="text-slate-400 text-sm">#</span>
                                        <span className="truncate flex-1 text-sm">{config.label}</span>
                                      </div>
                                      <div className="text-[11px] text-slate-400 pl-5 truncate w-full">
                                        {issue.providerName} · {issue.serviceName}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Panel 2: Chat Area - Messages.png Style */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {!selectedIssue ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#FAFBFC]">
            <MessageSquare className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Select an Issue</h3>
            <p className="text-sm text-slate-500 text-center max-w-md">
              Choose an issue from the left to view conversation history
            </p>
          </div>
        ) : loadingDetails ? (
          <div className="flex-1 flex flex-col">
            <div className="h-20 px-6 border-b border-slate-200 flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="flex-1 p-6 space-y-4">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-16 w-3/4 rounded-xl" />
            </div>
          </div>
        ) : issueDetails ? (
          <>
            {/* Chat Header - Slack Channel Style */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 bg-white flex-shrink-0">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Channel Hash */}
                <span className="text-slate-400 text-xl font-medium">#</span>
                
                {/* Channel Name & Topic */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      {issueDetails.client.firstName} {issueDetails.client.lastName}
                    </h2>
                    <Badge className="bg-[#E8DCC8] text-[#8B7355] text-[10px] px-2 py-0.5 font-medium hover:bg-[#E8DCC8]">
                      {ISSUE_TYPE_CONFIG[issueDetails.type].label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>{issueDetails.provider.name}</span>
                    <span>•</span>
                    <span>{issueDetails.service.name}</span>
                  </div>
                </div>
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href={`/case-manager/clients/${issueDetails.clientId}`}>
                  <Button variant="ghost" size="sm" className="h-8 text-xs">
                    <User className="w-3.5 h-3.5 mr-1.5" />
                    Profile
                  </Button>
                </Link>
                {issueDetails.status !== 'RESOLVED' && (
                  <Button onClick={handleResolveIssue} size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs px-3">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Resolve
                  </Button>
                )}
              </div>
            </div>

            {/* Messages - Compact Slack Style */}
            <ScrollArea className="flex-1 px-4 bg-white">
              <div className="max-w-3xl py-3">
                {issueDetails.comments.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No messages yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Date Separator */}
                    <div className="flex items-center justify-center my-3">
                      <span className="px-3 py-0.5 bg-white border border-slate-200 text-slate-600 text-[11px] rounded-full font-medium">
                        {new Date(issueDetails.comments[0].createdAt).toLocaleDateString('en-US', { 
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    {issueDetails.comments
                      .filter((comment) => !comment.parentCommentId) // Only show top-level comments
                      .map((comment) => renderComment(comment))
                    }
                  </div>
                )}

                {/* Linked Tasks - Compact */}
                {issueDetails.tasks.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Linked Tasks ({issueDetails.tasks.length})
                      </h3>
                    </div>
                    <div className="space-y-1">
                      {issueDetails.tasks.map((task) => (
                        <div key={task._id} className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded hover:bg-slate-100 transition-colors">
                          <div className={cn(
                            'w-4 h-4 rounded flex items-center justify-center flex-shrink-0',
                            task.status === 'DONE' ? 'bg-emerald-100' : 'bg-slate-200'
                          )}>
                            {task.status === 'DONE' ? (
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
                            ) : (
                              <Clock className="w-2.5 h-2.5 text-slate-500" />
                            )}
                          </div>
                          <span className={cn(
                            'text-xs flex-1',
                            task.status === 'DONE' ? 'text-slate-400 line-through' : 'text-slate-700'
                          )}>{task.title}</span>
                          <span className="text-[10px] text-slate-500">
                            {TASK_STATUS_CONFIG[task.status as keyof typeof TASK_STATUS_CONFIG].label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Message Input - Compact Slack Style */}
            {issueDetails.status !== 'RESOLVED' && (
              <div className="px-4 py-3 border-t border-slate-200 bg-white flex-shrink-0">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-2">
                    {/* Plus Button - Compact */}
                    <button 
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center flex-shrink-0 transition-colors"
                      aria-label="Add attachment"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </button>

                    {/* Text Input - Compact */}
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Type a message..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment();
                          }
                        }}
                        className="h-9 pl-3 pr-10 border border-slate-300 rounded-lg text-sm placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus-visible:ring-offset-0"
                        disabled={submittingComment}
                      />
                      {/* Emoji Button - Compact */}
                      <button 
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded hover:bg-slate-100 flex items-center justify-center transition-colors"
                        aria-label="Add emoji"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                          <line x1="9" y1="9" x2="9.01" y2="9"></line>
                          <line x1="15" y1="9" x2="15.01" y2="9"></line>
                        </svg>
                      </button>
                    </div>

                    {/* Send Button - Icon Only */}
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || submittingComment}
                      className="w-8 h-8 rounded-lg bg-[#5B7CFF] hover:bg-[#4A6FFF] disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-colors"
                      aria-label="Send message"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2" fill="white"></polygon>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Panel 3: Details Panel - Simple & Clean */}
      {issueDetails && (
        <div className="w-80 border-l border-slate-200 bg-white flex-shrink-0 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Issue Type Badge */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Issue Type</h4>
              <Badge className={cn('text-xs px-3 py-1.5 font-medium', ISSUE_TYPE_CONFIG[issueDetails.type].color)}>
                {ISSUE_TYPE_CONFIG[issueDetails.type].label}
              </Badge>
            </div>

            {/* Case Manager Info */}
            <div className="border-t border-slate-200 pt-6">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Your Info</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={userName} className="object-cover" />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-sm font-bold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{userName}</p>
                    <p className="text-xs text-slate-500">
                      {userRole === 'case_manager' ? 'Case Manager' : 
                       userRole === 'supervisor' ? 'Supervisor' : 
                       userRole === 'org_admin' ? 'Admin' : userRole}
                    </p>
                  </div>
                </div>
                {userEmail && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{userEmail}</span>
                  </div>
                )}
                {userOrganization && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Building className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{userOrganization}</span>
                  </div>
                )}
                {user?.user_metadata?.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{user.user_metadata.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Client</h4>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">
                  {issueDetails.client.firstName} {issueDetails.client.lastName}
                </p>
                {issueDetails.client.email && (
                  <p className="text-sm text-slate-600">{issueDetails.client.email}</p>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Provider</h4>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900 break-words">
                  {issueDetails.provider.name}
                </p>
                {issueDetails.provider.phone && (
                  <p className="text-sm text-slate-600">{issueDetails.provider.phone}</p>
                )}
                {issueDetails.provider.email && (
                  <p className="text-sm text-slate-600 truncate">{issueDetails.provider.email}</p>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Service</h4>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">
                  {issueDetails.service.name}
                </p>
                <p className="text-sm text-slate-600">{issueDetails.service.category}</p>
                {issueDetails.serviceRelationship.startDate && (
                  <p className="text-sm text-slate-500">
                    Started {new Date(issueDetails.serviceRelationship.startDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6 space-y-2">
              <Link href={`/case-manager/clients/${issueDetails.clientId}`}>
                <Button variant="outline" className="w-full justify-start text-sm">
                  <User className="w-4 h-4 mr-2" />
                  View Client Profile
                </Button>
              </Link>
              <Link href={`/case-manager/service-relationships/${issueDetails.serviceRelationshipId}`}>
                <Button variant="outline" className="w-full justify-start text-sm">
                  <FileText className="w-4 h-4 mr-2" />
                  View Service
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Delete Comment Confirmation Dialog */}
      <AlertDialog open={!!deletingCommentId} onOpenChange={(open) => !open && setDeletingCommentId(null)}>
        <AlertDialogContent className="z-[9999] bg-white border-2 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone and will also delete all replies to this message.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white border-2 hover:bg-slate-50">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteComment}
              className="bg-red-600 text-white hover:bg-red-700 border-0 shadow-md"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 