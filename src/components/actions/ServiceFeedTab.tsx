'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Send, 
  CheckCircle2, 
  Clock, 
  Users, 
  FileText, 
  X, 
  MessageSquare,
  Loader2,
  ChevronDown,
  ChevronUp,
  Building2,
  Circle,
  Sparkles,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Action, ServiceContext, ACTION_LIBRARY, ActionDefinition, UserRole } from '@/types/actions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface ServiceFeedTabProps {
  clientId: string;
}

export function ServiceFeedTab({ clientId }: ServiceFeedTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State
  const [actions, setActions] = useState<Action[]>([]);
  const [serviceContexts, setServiceContexts] = useState<ServiceContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContextId, setSelectedContextId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  
  // Composer state
  const [isCreatingAction, setIsCreatingAction] = useState(false);
  const [selectedActionDef, setSelectedActionDef] = useState<ActionDefinition | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Thread state
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  
  // Edit/Delete state
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [deletingActionId, setDeletingActionId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [deletingComment, setDeletingComment] = useState<{ actionId: string; commentId: string } | null>(null);

  const userRole = (user?.role as UserRole) || 'case_manager';

  // Get ALL actions for case manager
  const availableActions = ACTION_LIBRARY.filter(action => action.roles.includes(userRole));

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!clientId) return;
    
      setLoading(true);
    try {
      const actionsRes = await fetch(`/api/clients/${clientId}/actions`);
      if (actionsRes.ok) {
        const actionsData = await actionsRes.json();
          setActions(actionsData.actions || []);
      }

      const [referralsRes, connectionsRes] = await Promise.all([
        fetch(`/api/referrals?clientId=${clientId}`),
        fetch(`/api/connections?clientId=${clientId}`)
      ]);
      
      const contexts: ServiceContext[] = [];
      
      if (referralsRes.ok) {
        const referralsData = await referralsRes.json();
        referralsData.referrals?.forEach((ref: any) => {
          contexts.push({
            id: ref._id,
              type: 'referral',
            label: `${ref.serviceType} @ ${ref.providerName}`,
            providerId: ref.providerId,
            providerName: ref.providerName,
            serviceType: ref.serviceType,
            status: ref.status,
              pendingActionsCount: 0
            });
          });
        }
        
      if (connectionsRes.ok) {
        const connectionsData = await connectionsRes.json();
        connectionsData.connections?.forEach((conn: any) => {
              contexts.push({
            id: conn._id,
                type: 'connection',
            label: `${conn.serviceType} @ ${conn.providerName}`,
            providerId: conn.providerId,
            providerName: conn.providerName,
            serviceType: conn.serviceType,
            status: conn.status,
                pendingActionsCount: 0
              });
          });
        }
      
      setServiceContexts(contexts);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle action creation
  const handleCreateAction = async () => {
    if (!selectedActionDef || !clientId) return;

    setIsSubmitting(true);
    try {
      const selectedContext = serviceContexts.find(ctx => ctx.id === selectedContextId);
      
      const { target_date, scheduled_date, ...actionDataFields } = (formData || {}) as any;
      const actionData = {
        type: selectedActionDef.id,
        title: selectedActionDef.label,
        description: selectedActionDef.description,
        urgency: selectedActionDef.urgency || 'normal',
        requiresROI: selectedActionDef.requiresROI || false,
        data: actionDataFields,
        targetDate: formData.target_date || null,
        scheduledDate: formData.scheduled_date || null,
        contextType: selectedContext ? selectedContext.type : 'general',
        contextId: selectedContext?.id || null,
        providerId: selectedContext?.providerId || null,
        serviceType: selectedContext?.serviceType || null
      };

      const response = await fetch(`/api/clients/${clientId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actionData)
      });

      if (!response.ok) throw new Error('Failed to create action');

      setIsCreatingAction(false);
      setSelectedActionDef(null);
      setFormData({});
      await fetchData();
      
      toast({
        title: "Action Sent",
        description: `${selectedActionDef.label} has been sent to the provider.`,
      });
    } catch (error) {
      console.error('Error creating action:', error);
      toast({
        title: "Error",
        description: "Failed to create action. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle action completion
  const handleCompleteAction = async (actionId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/actions/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'complete' })
      });

      if (!response.ok) throw new Error('Failed to complete action');

      setActions(prev => prev.map(action => 
        action._id === actionId
          ? { ...action, status: 'complete' as const, completedAt: new Date().toISOString() }
          : action
      ));

      toast({
        title: "Completed",
        description: "Action marked as complete.",
      });
    } catch (error) {
      console.error('Error completing action:', error);
      toast({
        title: "Error",
        description: "Failed to complete action.",
        variant: "destructive",
      });
    }
  };

  // Handle reply
  const handlePostReply = async (actionId: string) => {
    if (!replyContent.trim()) return;

    try {
      const response = await fetch(`/api/clients/${clientId}/actions/${actionId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent })
      });

      if (!response.ok) throw new Error('Failed to add reply');

      const result = await response.json();
      
      setActions(prev => prev.map(a => 
        a._id === actionId 
          ? { ...a, comments: [...(a.comments || []), result.comment] }
          : a
      ));

      setReplyingTo(null);
      setReplyContent('');
      
      setExpandedThreads(prev => new Set(prev).add(actionId));

      toast({
        title: "Reply Posted",
        description: "Your message has been sent.",
      });
    } catch (error) {
      console.error('Error posting reply:', error);
      toast({
        title: "Error",
        description: "Failed to post reply.",
        variant: "destructive",
      });
    }
  };

  // Toggle thread
  const toggleThread = (actionId: string) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(actionId)) {
        newSet.delete(actionId);
      } else {
        newSet.add(actionId);
      }
      return newSet;
    });
  };

  // Handle edit action
  const handleEditAction = (action: Action) => {
    setEditingAction(action);
    setSelectedActionDef(ACTION_LIBRARY.find(a => a.id === action.type) || null);
    // Pre-fill form with all existing data
    setFormData({
      ...action.data, // This includes notes and other custom fields
      target_date: action.targetDate || '',
      scheduled_date: action.scheduledDate || ''
    });
    setSelectedContextId(action.contextId || null);
    setIsCreatingAction(true);
  };

  // Handle update action
  const handleUpdateAction = async () => {
    if (!editingAction || !selectedActionDef) return;

    setIsSubmitting(true);
    try {
      const selectedContext = serviceContexts.find(ctx => ctx.id === selectedContextId);
      
      const { target_date, scheduled_date, ...actionDataFields } = (formData || {}) as any;
      const actionData = {
        type: selectedActionDef.id,
        title: selectedActionDef.label,
        description: selectedActionDef.description,
        urgency: selectedActionDef.urgency || 'normal',
        requiresROI: selectedActionDef.requiresROI || false,
        data: actionDataFields,
        targetDate: formData.target_date || null,
        scheduledDate: formData.scheduled_date || null,
        contextType: selectedContext ? selectedContext.type : 'general',
        contextId: selectedContext?.id || null,
        providerId: selectedContext?.providerId || null,
        serviceType: selectedContext?.serviceType || null
      };

      const response = await fetch(`/api/clients/${clientId}/actions/${editingAction._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actionData)
      });

      if (!response.ok) throw new Error('Failed to update action');

      setIsCreatingAction(false);
      setEditingAction(null);
      setSelectedActionDef(null);
      setFormData({});
      await fetchData();
      
      toast({
        title: "Action Updated",
        description: "The action has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating action:', error);
      toast({
        title: "Error",
        description: "Failed to update action. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete action
  const handleDeleteAction = async () => {
    if (!deletingActionId) return;

    try {
      const response = await fetch(`/api/clients/${clientId}/actions/${deletingActionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete action');

      setActions(prev => prev.filter(action => action._id !== deletingActionId));
      setDeletingActionId(null);
      
      toast({
        title: "Action Deleted",
        description: "The action has been removed.",
      });
    } catch (error) {
      console.error('Error deleting action:', error);
      toast({
        title: "Error",
        description: "Failed to delete action.",
        variant: "destructive",
      });
    }
  };

  // Handle edit comment
  const handleEditComment = (actionId: string, comment: any) => {
    setEditingCommentId(comment._id);
    setEditingCommentContent(comment.content);
    if (!expandedThreads.has(actionId)) {
      toggleThread(actionId);
    }
  };

  // Handle update comment
  const handleUpdateComment = async (actionId: string, commentId: string) => {
    if (!editingCommentContent.trim()) return;

    try {
      const response = await fetch(`/api/clients/${clientId}/actions/${actionId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingCommentContent })
      });

      if (!response.ok) throw new Error('Failed to update comment');

      setActions(prev => prev.map(a => 
        a._id === actionId 
          ? {
              ...a,
              comments: a.comments?.map(c => 
                c._id === commentId 
                  ? { ...c, content: editingCommentContent }
                  : c
              )
            }
          : a
      ));

      setEditingCommentId(null);
      setEditingCommentContent('');

      toast({
        title: "Comment Updated",
        description: "Your comment has been updated.",
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: "Error",
        description: "Failed to update comment.",
        variant: "destructive",
      });
    }
  };

  // Handle delete comment
  const handleDeleteComment = async () => {
    if (!deletingComment) return;

    try {
      const response = await fetch(`/api/clients/${clientId}/actions/${deletingComment.actionId}/comments/${deletingComment.commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete comment');

      setActions(prev => prev.map(a => 
        a._id === deletingComment.actionId 
          ? {
              ...a,
              comments: a.comments?.filter(c => c._id !== deletingComment.commentId)
            }
          : a
      ));

      setDeletingComment(null);
      
      toast({
        title: "Comment Deleted",
        description: "The comment has been removed.",
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment.",
        variant: "destructive",
      });
    }
  };

  // Render context badge
  const renderContextBadge = (context: ServiceContext) => {
    const Icon = context.type === 'referral' ? FileText : Building2;
    const colorClass = context.type === 'referral' 
      ? 'bg-blue-50 text-blue-700 border-blue-200' 
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';

    return (
      <Badge variant="outline" className={cn("gap-1.5 text-xs font-medium", colorClass)}>
        <Icon className="w-3 h-3" />
        {context.providerName}
      </Badge>
    );
  };

  // Render action card
  const renderAction = (action: Action) => {
    const isCompleted = action.status === 'complete';
    const actionDef = ACTION_LIBRARY.find(a => a.id === action.type);
    const context = serviceContexts.find(c => c.id === action.contextId);
    const hasComments = action.comments && action.comments.length > 0;
    const isExpanded = expandedThreads.has(action._id);
    const isReplying = replyingTo === action._id;
    const canEdit = action.createdBy === user?.id;

    const overdue = !isCompleted && action.targetDate && new Date(action.targetDate).getTime() < Date.now();
    const dueSoon = !isCompleted && action.targetDate && !overdue && 
                     new Date(action.targetDate).getTime() - Date.now() < 48 * 60 * 60 * 1000;

    return (
      <div 
        key={action._id} 
        className={cn(
          "group relative rounded-xl border bg-white transition-all",
          isCompleted 
            ? "border-slate-200 opacity-60" 
            : overdue
            ? "border-red-200 shadow-sm hover:shadow-md"
            : dueSoon
            ? "border-amber-200 shadow-sm hover:shadow-md"
            : "border-slate-200 shadow-sm hover:shadow-md"
        )}
      >
        {!isCompleted && (overdue || dueSoon) && (
          <div className={cn(
            "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl",
            overdue ? "bg-red-500" : "bg-amber-500"
          )} />
        )}

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                {actionDef && (
                  <span className="text-lg" aria-label={actionDef.label}>{actionDef.icon}</span>
                )}
                <h3 className="font-semibold text-sm text-slate-900 truncate">
                  {action.title}
                </h3>
                {isCompleted && (
                  <Badge variant="secondary" className="gap-1 text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    Done
                  </Badge>
                )}
        </div>
        
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
                {context && renderContextBadge(context)}
                <span>{action.createdByName}</span>
                <Circle className="w-1 h-1 fill-slate-400 text-slate-400" />
                <span>{formatDistanceToNow(parseISO(action.createdAt), { addSuffix: true })}</span>
                {!isCompleted && action.targetDate && (
                  <>
                    <Circle className="w-1 h-1 fill-slate-400 text-slate-400" />
                    <div className={cn(
                      "inline-flex items-center gap-1 font-medium",
                      overdue ? "text-red-600" : dueSoon ? "text-amber-600" : "text-slate-600"
                    )}>
                      <Clock className="w-3 h-3" />
                      {overdue 
                        ? `${formatDistanceToNow(parseISO(action.targetDate))} overdue`
                        : `Due ${formatDistanceToNow(parseISO(action.targetDate), { addSuffix: true })}`
                      }
              </div>
                  </>
                )}
              </div>
      </div>
            
            {/* Edit/Delete Menu */}
            {canEdit && !isCompleted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditAction(action)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setDeletingActionId(action._id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
                      </div>

          {action.description && (
            <p className="text-sm text-slate-600 leading-relaxed">{action.description}</p>
          )}

          {/* User's notes/details as main content */}
          {action.data?.notes && (
            <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{action.data.notes}</p>
            </div>
          )}

          {/* Other custom fields */}
          {action.data && Object.keys(action.data).filter(k => {
            const reserved = new Set(['notes', 'comments', 'createdAt', 'updatedAt', 'target_date', 'scheduled_date']);
            return action.data![k] && !reserved.has(k);
          }).length > 0 && (
            <div className="space-y-1.5 p-3 bg-slate-50 rounded-lg border border-slate-100">
              {Object.entries(action.data)
                .filter(([k, v]) => {
                  const reserved = new Set(['notes', 'comments', 'createdAt', 'updatedAt', 'target_date', 'scheduled_date']);
                  return v && !reserved.has(k);
                })
                .map(([key, value]) => {
                  // Format the label
                  const label = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                  
                  // Format the value - convert snake_case/underscores to Title Case
                  let displayValue = String(value);
                  if (typeof value === 'string') {
                    // Convert snake_case or underscore values to Title Case
                    displayValue = value
                      .split('_')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                      .join(' ');
                  }
                  
                  return (
                    <div key={key} className="flex gap-2 text-xs">
                      <span className="font-medium text-slate-600 min-w-[80px]">
                        {label}:
                          </span>
                      <span className="text-slate-900 font-medium">{displayValue}</span>
                        </div>
                  );
                })}
                          </div>
          )}

          {hasComments && (
            <div>
              <button
                onClick={() => toggleThread(action._id)}
                className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{action.comments!.length} {action.comments!.length === 1 ? 'reply' : 'replies'}</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {isExpanded && (
                <div className="mt-3 space-y-2">
                  {action.comments!.map((comment) => {
                    const isEditingThisComment = editingCommentId === comment._id;
                    const canEditComment = comment.createdBy === user?.id;
                    
                    return (
                      <div key={comment._id} className="group flex gap-2.5 p-2.5 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center">
                          <Users className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="font-semibold text-slate-900">{comment.createdByName}</span>
                            <Circle className="w-1 h-1 fill-slate-400 text-slate-400" />
                            <span className="text-slate-500">
                              {formatDistanceToNow(parseISO(comment.createdAt), { addSuffix: true })}
                          </span>
                            {canEditComment && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditComment(action._id, comment)}>
                                    <Edit className="w-3 h-3 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => setDeletingComment({ actionId: action._id, commentId: comment._id })}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="w-3 h-3 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                        </div>
                          {isEditingThisComment ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editingCommentContent}
                                onChange={(e) => setEditingCommentContent(e.target.value)}
                                className="text-sm min-h-[60px]"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateComment(action._id, comment._id)}
                                  disabled={!editingCommentContent.trim()}
                                  className="h-7 text-xs"
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingCommentId(null);
                                    setEditingCommentContent('');
                                  }}
                                  className="h-7 text-xs"
                                >
                                  Cancel
                                </Button>
                          </div>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-700">{comment.content}</p>
                          )}
                        </div>
          </div>
    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            {!isCompleted && (
                <Button
                onClick={() => handleCompleteAction(action._id)}
                  size="sm"
                variant="outline"
                className="h-8 text-xs font-medium"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                Complete
                </Button>
            )}
            
            {!isReplying ? (
        <Button
                onClick={() => {
                  setReplyingTo(action._id);
                  if (!isExpanded) toggleThread(action._id);
                }}
          size="sm"
                variant="ghost"
                className="h-8 text-xs font-medium text-slate-600"
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                Reply
        </Button>
            ) : (
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handlePostReply(action._id);
                    }
                  }}
                />
                  <Button 
                  size="sm"
                  onClick={() => handlePostReply(action._id)}
                  disabled={!replyContent.trim()}
                  className="h-8"
                >
                  <Send className="w-3.5 h-3.5" />
                  </Button>
                <Button 
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent('');
                  }}
                  className="h-8"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
  };

  // Filter and sort actions
  const filteredActions = actions.filter(a => {
    if (selectedContextId && a.contextId !== selectedContextId) return false;
    if (statusFilter === 'all') return true;
    const isCompleted = a.status === 'complete';
    return statusFilter === 'completed' ? isCompleted : !isCompleted;
  });

  const sortedActions = [...filteredActions].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-6 max-w-sm">
            <div className="relative">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-primary animate-pulse" />
                    </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
                    </div>
                  </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-900">Loading Communications</h3>
              <p className="text-sm text-slate-600">Fetching provider messages and actions...</p>
                    </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-lg border border-slate-200 bg-white p-4 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-200" />
                    <div className="h-3 w-32 bg-slate-200 rounded" />
                        </div>
                  <div className="h-2 w-full bg-slate-200 rounded mb-2" />
                  <div className="h-2 w-2/3 bg-slate-200 rounded" />
                      </div>
              ))}
                        </div>
                      </div>
                  </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header with Filters */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Provider Communications</h2>
            <p className="text-sm text-slate-600 mt-0.5">
              {sortedActions.length} {sortedActions.length === 1 ? 'message' : 'messages'}
              {statusFilter === 'pending' && ` • ${sortedActions.filter(a => a.status !== 'complete').length} pending`}
            </p>
            </div>
            
                  <Button
            onClick={() => {
              if (isCreatingAction) {
                setIsCreatingAction(false);
                setSelectedActionDef(null);
                setFormData({});
                setEditingAction(null);
              } else {
                setIsCreatingAction(true);
                setSelectedActionDef(null);
                setFormData({});
                setEditingAction(null);
              }
            }}
                    size="sm"
            className="h-9"
            variant={isCreatingAction ? "secondary" : "default"}
          >
            {isCreatingAction ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4 mr-2" />
                New Action
              </>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {(['all', 'pending', 'completed'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  statusFilter === filter
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {filter === 'all' ? 'All' : filter === 'pending' ? 'Pending' : 'Completed'}
              </button>
            ))}
          </div>

          {serviceContexts.length > 0 && (
            <Select value={selectedContextId || 'all'} onValueChange={(value) => setSelectedContextId(value === 'all' ? null : value)}>
              <SelectTrigger className="h-8 w-[200px] text-xs bg-white border-2 hover:border-slate-300">
                <SelectValue placeholder="All services" />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 shadow-lg z-50">
                <SelectItem value="all" className="cursor-pointer">All Services</SelectItem>
                {serviceContexts.map((ctx) => (
                  <SelectItem key={ctx.id} value={ctx.id} className="cursor-pointer">
                    {ctx.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
              </div>
            </div>

      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-4">
          
          {/* Inline Action Composer */}
          {isCreatingAction && (
            <Card className="border-2 border-primary/20 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{editingAction ? 'Edit Action' : 'Create New Action'}</CardTitle>
                <CardDescription className="text-xs">
                  {editingAction 
                    ? 'Update the action details below' 
                    : selectedActionDef 
                    ? 'Fill in the details below' 
                    : 'Choose an action type to get started'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedActionDef ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {availableActions.map((actionDef) => (
                      <button
                        key={actionDef.id}
                        onClick={() => setSelectedActionDef(actionDef)}
                        className="flex flex-col items-center gap-2 p-3 rounded-lg border border-slate-200 hover:border-primary hover:bg-primary/5 transition-all text-center group"
                      >
                        <span className="text-2xl group-hover:scale-110 transition-transform">{actionDef.icon}</span>
                        <span className="text-xs font-medium text-slate-900 line-clamp-2">{actionDef.label}</span>
                      </button>
                    ))}
            </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <span className="text-2xl">{selectedActionDef.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{selectedActionDef.label}</p>
                        <p className="text-xs text-slate-600">{selectedActionDef.description}</p>
                      </div>
              <Button
                variant="ghost"
                size="sm"
                        onClick={() => {
                          setSelectedActionDef(null);
                          setFormData({});
                        }}
                      >
                        <X className="w-4 h-4" />
              </Button>
          </div>

                    {serviceContexts.length > 0 && (
                      <div>
                        <label className="text-xs font-medium mb-1.5 block text-slate-700">Service</label>
                        <Select value={selectedContextId || ''} onValueChange={setSelectedContextId}>
                          <SelectTrigger className="h-9 text-sm bg-white border-2 hover:border-slate-300">
                            <SelectValue placeholder="Select service..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-2 shadow-lg z-50">
                            {serviceContexts.map((ctx) => (
                              <SelectItem key={ctx.id} value={ctx.id} className="cursor-pointer">
                                {ctx.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
        </div>
                    )}

                    {selectedActionDef.fields.map((field) => {
                      if (field.type === 'textarea') {
                        return (
                          <div key={field.name}>
                            <label className="text-xs font-medium mb-1.5 block text-slate-700">
                              {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            <Textarea
                              value={formData[field.name] || ''}
                              onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                              placeholder={field.placeholder}
                              rows={3}
                              className="text-sm"
                            />
    </div>
  );
                      }

                      if (field.type === 'date') {
                        return (
                          <div key={field.name}>
                            <label className="text-xs font-medium mb-1.5 block text-slate-700">
                              {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            <Input
                              type="date"
                              value={formData[field.name] || ''}
                              onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                              className="h-9 text-sm"
                            />
    </div>
  );
                      }

                      if (field.type === 'select' && field.options) {
    return (
                          <div key={field.name}>
                            <label className="text-xs font-medium mb-1.5 block text-slate-700">
                              {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            <Select
                              value={formData[field.name] || ''}
                              onValueChange={(value) => setFormData({ ...formData, [field.name]: value })}
                            >
                              <SelectTrigger className="h-9 text-sm bg-white border-2 hover:border-slate-300">
                                <SelectValue placeholder={`Select ${field.label.toLowerCase()}...`} />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-2 shadow-lg z-50">
                                {field.options.map((option) => (
                                  <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, '_')} className="cursor-pointer">
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
              </div>
    );
  }

  return (
                        <div key={field.name}>
                          <label className="text-xs font-medium mb-1.5 block text-slate-700">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          <Input
                            type={field.type}
                            value={formData[field.name] || ''}
                            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                            placeholder={field.placeholder}
                            className="h-9 text-sm"
                          />
            </div>
                      );
                    })}

              <Button
                      onClick={editingAction ? handleUpdateAction : handleCreateAction}
                      disabled={isSubmitting}
                      className="w-full h-9"
                      size="sm"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {editingAction ? 'Updating...' : 'Sending...'}
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          {editingAction ? 'Update Action' : 'Send Action'}
                        </>
                      )}
              </Button>
                </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions List */}
          {sortedActions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex items-center justify-center border-2 border-primary/10">
                  <MessageSquare className="w-12 h-12 text-primary/60" />
                </div>
                <div className="absolute -top-2 -right-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Communications Yet</h3>
              <p className="text-sm text-slate-600 mb-6 max-w-md">
                {statusFilter === 'pending' 
                  ? "No pending actions right now. Create a new action to start communicating with providers."
                  : statusFilter === 'completed'
                  ? "No completed actions yet. Completed actions will appear here."
                  : "Start the conversation by creating your first action above."
                }
              </p>
              {!isCreatingAction && (
                              <Button
                                onClick={() => {
                    setIsCreatingAction(true);
                    setSelectedActionDef(null);
                    setFormData({});
                  }}
                                size="sm"
                  className="h-9"
                              >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Create First Action
                              </Button>
                    )}
                  </div>
          ) : (
            sortedActions.map((action) => renderAction(action))
          )}
        </div>
      </div>

      {/* Delete Action Confirmation */}
      <AlertDialog open={!!deletingActionId} onOpenChange={() => setDeletingActionId(null)}>
        <AlertDialogContent className="z-[9999] bg-white border-2 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">Delete Action</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600">
              Are you sure you want to delete this action? This cannot be undone and will remove all associated comments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white border-2 hover:bg-slate-50">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAction}
              className="bg-red-600 text-white hover:bg-red-700 border-0 shadow-md"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Comment Confirmation */}
      <AlertDialog open={!!deletingComment} onOpenChange={() => setDeletingComment(null)}>
        <AlertDialogContent className="z-[9999] bg-white border-2 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">Delete Comment</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600">
              Are you sure you want to delete this comment? This action cannot be undone.
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
