'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, CheckCircle2, Clock, MoreVertical, Edit, Trash2, Send, Loader2, 
  ChevronDown, ChevronUp, Calendar, FileText, Upload, User 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { cn } from '@/lib/shared/utils';
import { Action } from '@/types/actions';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface InlineActionsExpansionProps {
  serviceRelationshipId: string;
  clientId: string;
}

export function InlineActionsExpansion({ serviceRelationshipId, clientId }: InlineActionsExpansionProps) {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [deletingActionId, setDeletingActionId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch actions for this service relationship
  useEffect(() => {
    async function fetchActions() {
      if (!clientId || !serviceRelationshipId) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/clients/${clientId}/actions`);
        if (response.ok) {
          const data = await response.json();
          console.log('📋 Fetched all actions:', data.actions?.length || 0);
          console.log('🔍 Looking for serviceRelationshipId:', serviceRelationshipId);
          
          // Filter to only OPEN actions for this service relationship (v1.1 model)
          const filteredActions = (data.actions || []).filter(
            (action: any) => {
              // v1.1 uses subjectType and subjectId
              const matchesV11 = action.subjectType === 'SERVICE_RELATIONSHIP' && action.subjectId === serviceRelationshipId;
              // Legacy uses contextId
              const matchesLegacy = action.contextId === serviceRelationshipId;
              // v1.1 uses OPEN status, legacy uses pending/complete
              const isOpen = action.status === 'OPEN' || action.status === 'pending';
              
              if (matchesV11 || matchesLegacy) {
                console.log('✅ Found matching action:', {
                  id: action._id,
                  type: action.type,
                  subjectId: action.subjectId,
                  contextId: action.contextId,
                  status: action.status,
                  isOpen
                });
              }
              
              return (matchesV11 || matchesLegacy) && isOpen;
            }
          );
          
          console.log('📊 Filtered to', filteredActions.length, 'open actions for this service');
          setActions(filteredActions);
        } else {
          console.error('❌ Failed to fetch actions:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching actions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchActions();
  }, [clientId, serviceRelationshipId]);

  // Handle action completion (v1.1 uses COMPLETED status)
  const handleCompleteAction = async (actionId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/actions/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }) // v1.1 uses uppercase
      });

      if (!response.ok) throw new Error('Failed to complete action');

      // Remove from list since it's no longer OPEN
      setActions(prev => prev.filter(action => action._id !== actionId));

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

  // Handle delete action
  const handleDeleteAction = async (actionId: string) => {
    if (!confirm('Delete this action? This cannot be undone.')) return;

    try {
      const response = await fetch(`/api/clients/${clientId}/actions/${actionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete action');

      setActions(prev => prev.filter(action => action._id !== actionId));
      
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

  if (loading) {
    return (
      <div className="py-4 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        <span className="ml-2 text-sm text-slate-600">Loading actions...</span>
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-slate-500">
        No pending actions for this service
      </div>
    );
  }

  return (
    <div className="space-y-3 py-3">
      {actions.map((action: any) => {
        const hasComments = action.comments && action.comments.length > 0;
        const isExpanded = expandedThreads.has(action._id);
        const isReplying = replyingTo === action._id;
        
        // v1.1 uses dueAt, legacy uses targetDate
        const dueDate = action.dueAt || action.targetDate;
        const overdue = dueDate && new Date(dueDate).getTime() < Date.now();
        const isCritical = action.priority === 'CRITICAL' || action.urgency === 'issue';
        const isHigh = action.priority === 'HIGH' || action.urgency === 'urgent';
        
        // v1.1 action type config with professional icons
        const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
          'REQUEST_INTAKE': { label: 'Request Intake', icon: Calendar, color: 'text-blue-600' },
          'REQUEST_UPDATE': { label: 'Request Update', icon: FileText, color: 'text-purple-600' },
          'REQUEST_DOCUMENT': { label: 'Request Document', icon: Upload, color: 'text-emerald-600' },
          'GENERAL_MESSAGE': { label: 'Message', icon: MessageSquare, color: 'text-slate-600' },
        };
        
        const config = typeConfig[action.type] || { label: action.type, icon: MessageSquare, color: 'text-slate-600' };
        const ActionIcon = config.icon;
        
        // Get title from v1.1 type or legacy title
        const title = action.title || config.label;
        // Get description from v1.1 requestPayload or legacy description
        const description = action.requestPayload?.notes || action.description || action.notes;

        return (
          <div 
            key={action._id} 
            className={cn(
              "group bg-gradient-to-br from-white to-slate-50/30 border-2 rounded-xl p-4 transition-all duration-200",
              "hover:shadow-md hover:shadow-slate-200/50",
              overdue ? "border-red-200 bg-gradient-to-br from-red-50/50 to-white" : 
              isCritical ? "border-red-300 bg-gradient-to-br from-red-50/30 to-white" :
              isHigh ? "border-amber-300 bg-gradient-to-br from-amber-50/30 to-white" :
              "border-slate-200 hover:border-slate-300"
            )}
          >
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              {/* Type Icon */}
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg bg-white border-2 flex-shrink-0",
                isCritical ? "border-red-200" :
                isHigh ? "border-amber-200" :
                "border-slate-200"
              )}>
                <ActionIcon className={cn("w-4 h-4", config.color)} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-sm text-slate-900">{title}</span>
                  {isCritical && (
                    <Badge variant="destructive" className="text-[10px] px-2 py-0.5 font-semibold">
                      Critical
                    </Badge>
                  )}
                  {isHigh && !isCritical && (
                    <Badge className="text-[10px] px-2 py-0.5 font-semibold bg-amber-100 text-amber-800 border-amber-300">
                      High Priority
                    </Badge>
                  )}
                  {overdue && (
                    <Badge variant="destructive" className="text-[10px] px-2 py-0.5 font-semibold">
                      Overdue
                    </Badge>
                  )}
                  {dueDate && !overdue && (
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <Clock className="w-3 h-3" />
                      <span>Due {formatDistanceToNow(new Date(dueDate), { addSuffix: true })}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <User className="w-3 h-3" />
                  <span>{action.createdByName || 'Case Manager'}</span>
                  <span className="text-slate-400">•</span>
                  <span>{formatDistanceToNow(parseISO(action.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-[9999] bg-white border-2 shadow-lg">
                  <DropdownMenuItem 
                    onClick={() => handleCompleteAction(action._id)}
                    className="cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                    <span className="font-medium">Mark Complete</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDeleteAction(action._id)}
                    className="text-red-600 focus:text-red-700 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    <span className="font-medium">Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Description */}
            {description && (
              <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-slate-700 leading-relaxed">{description}</p>
              </div>
            )}

            {/* Comments */}
            {hasComments && (
              <div className="mt-2">
                <button
                  onClick={() => toggleThread(action._id)}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>{action.comments!.length} {action.comments!.length === 1 ? 'reply' : 'replies'}</span>
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {isExpanded && (
                  <div className="mt-2 space-y-2">
                    {action.comments!.map((comment) => (
                      <div key={comment._id} className="bg-slate-50 rounded p-2 text-xs">
                        <div className="font-semibold text-slate-900 mb-0.5">{comment.createdByName}</div>
                        <p className="text-slate-700">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reply Input */}
            {isReplying ? (
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="h-7 text-xs"
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
                  className="h-7 w-7 p-0"
                >
                  <Send className="w-3 h-3" />
                </Button>
                <Button 
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent('');
                  }}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => {
                  setReplyingTo(action._id);
                  if (!isExpanded) toggleThread(action._id);
                }}
                size="sm"
                variant="outline"
                className="h-8 text-xs font-medium border-2 hover:bg-slate-50 mt-2"
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                Reply
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

