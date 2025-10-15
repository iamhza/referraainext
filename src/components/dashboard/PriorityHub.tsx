'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle, FileText, Calendar, Clock, MessageSquare, Zap, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Action } from '@/types/actions';

interface PriorityHubProps {
  isOpen: boolean;
  onClose: () => void;
  onClientSelect: (clientId: string, actionId?: string) => void;
}

type ActionGroup = 'urgent' | 'documentation' | 'service_management' | 'follow_ups' | 'messages';

interface GroupedActions {
  urgent: Action[];
  documentation: Action[];
  service_management: Action[];
  follow_ups: Action[];
  messages: Action[];
}

export function PriorityHub({ isOpen, onClose, onClientSelect }: PriorityHubProps) {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<ActionGroup>>(new Set(['urgent']));

  useEffect(() => {
    if (isOpen) {
      fetchPendingActions();
    }
  }, [isOpen]);

  const fetchPendingActions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/actions/pending');
      if (!response.ok) throw new Error('Failed to fetch actions');
      
      const data = await response.json();
      setActions(data.actions || []);
    } catch (error) {
      console.error('Error fetching actions:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedActions = useMemo<GroupedActions>(() => {
    const groups: GroupedActions = {
      urgent: [],
      documentation: [],
      service_management: [],
      follow_ups: [],
      messages: []
    };

    actions.forEach(action => {
      // Urgent: flag_concern, urgent_alert, report_incident, or overdue
      if (
        action.type === 'flag_concern' ||
        action.type === 'urgent_alert' ||
        action.type === 'report_incident' ||
        action.urgency === 'issue' ||
        (action.targetDate && new Date(action.targetDate) < new Date())
      ) {
        groups.urgent.push(action);
      }
      // Documentation: request_documentation, submit_documentation, authorization_submitted, authorization_approved
      else if (
        action.type === 'request_documentation' ||
        action.type === 'submit_documentation' ||
        action.type === 'authorization_submitted' ||
        action.type === 'authorization_approved' ||
        action.type === 'roi_request' ||
        action.type === 'roi_approved'
      ) {
        groups.documentation.push(action);
      }
      // Service Management: intake, status updates, service changes
      else if (
        action.type === 'request_intake_date' ||
        action.type === 'request_status_update' ||
        action.type === 'confirm_intake_scheduled' ||
        action.type === 'confirm_service_started' ||
        action.type === 'service_update' ||
        action.type === 'switch_transfer_request' ||
        action.type === 'services_paused' ||
        action.type === 'services_resumed' ||
        action.type === 'services_ended'
      ) {
        groups.service_management.push(action);
      }
      // Follow-ups: follow_up_reminder, request_auth_update
      else if (
        action.type === 'follow_up_reminder' ||
        action.type === 'request_auth_update'
      ) {
        groups.follow_ups.push(action);
      }
      // Messages: general_message
      else if (action.type === 'general_message') {
        groups.messages.push(action);
      }
    });

    return groups;
  }, [actions]);

  const totalPendingActions = actions.length;

  const toggleGroup = (group: ActionGroup) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(group)) {
        newSet.delete(group);
      } else {
        newSet.add(group);
      }
      return newSet;
    });
  };

  const handleActionClick = (action: Action) => {
    onClientSelect(action.clientId, action._id);
    onClose();
  };

  const getUrgencyColor = (action: Action): string => {
    if (action.urgency === 'issue' || action.type === 'flag_concern' || action.type === 'urgent_alert') {
      return 'text-red-600 bg-red-50 border-red-200';
    }
    if (action.targetDate && new Date(action.targetDate) < new Date()) {
      return 'text-orange-600 bg-orange-50 border-orange-200';
    }
    if (action.urgency === 'urgent') {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Due Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Due Tomorrow';
    if (date < today) return 'Overdue';
    
    return `Due ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[500px] lg:w-[600px] bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-sm">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Priority Hub</h2>
              <p className="text-sm text-slate-600">
                {totalPendingActions} pending {totalPendingActions === 1 ? 'action' : 'actions'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : totalPendingActions === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">All caught up!</h3>
              <p className="text-sm text-slate-600">
                You have no pending actions at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Urgent Issues */}
              {groupedActions.urgent.length > 0 && (
                <ActionGroup
                  icon={AlertCircle}
                  title="Urgent Issues"
                  count={groupedActions.urgent.length}
                  color="red"
                  expanded={expandedGroups.has('urgent')}
                  onToggle={() => toggleGroup('urgent')}
                  actions={groupedActions.urgent}
                  onActionClick={handleActionClick}
                  getUrgencyColor={getUrgencyColor}
                  formatDate={formatDate}
                />
              )}

              {/* Documentation */}
              {groupedActions.documentation.length > 0 && (
                <ActionGroup
                  icon={FileText}
                  title="Documentation"
                  count={groupedActions.documentation.length}
                  color="blue"
                  expanded={expandedGroups.has('documentation')}
                  onToggle={() => toggleGroup('documentation')}
                  actions={groupedActions.documentation}
                  onActionClick={handleActionClick}
                  getUrgencyColor={getUrgencyColor}
                  formatDate={formatDate}
                />
              )}

              {/* Service Management */}
              {groupedActions.service_management.length > 0 && (
                <ActionGroup
                  icon={Calendar}
                  title="Service Management"
                  count={groupedActions.service_management.length}
                  color="purple"
                  expanded={expandedGroups.has('service_management')}
                  onToggle={() => toggleGroup('service_management')}
                  actions={groupedActions.service_management}
                  onActionClick={handleActionClick}
                  getUrgencyColor={getUrgencyColor}
                  formatDate={formatDate}
                />
              )}

              {/* Follow-ups */}
              {groupedActions.follow_ups.length > 0 && (
                <ActionGroup
                  icon={Clock}
                  title="Follow-ups"
                  count={groupedActions.follow_ups.length}
                  color="orange"
                  expanded={expandedGroups.has('follow_ups')}
                  onToggle={() => toggleGroup('follow_ups')}
                  actions={groupedActions.follow_ups}
                  onActionClick={handleActionClick}
                  getUrgencyColor={getUrgencyColor}
                  formatDate={formatDate}
                />
              )}

              {/* Messages */}
              {groupedActions.messages.length > 0 && (
                <ActionGroup
                  icon={MessageSquare}
                  title="Messages"
                  count={groupedActions.messages.length}
                  color="slate"
                  expanded={expandedGroups.has('messages')}
                  onToggle={() => toggleGroup('messages')}
                  actions={groupedActions.messages}
                  onActionClick={handleActionClick}
                  getUrgencyColor={getUrgencyColor}
                  formatDate={formatDate}
                />
              )}
            </div>
          )}
        </ScrollArea>
      </div>
    </>
  );
}

// Action Group Component
interface ActionGroupProps {
  icon: React.ElementType;
  title: string;
  count: number;
  color: 'red' | 'blue' | 'purple' | 'orange' | 'slate';
  expanded: boolean;
  onToggle: () => void;
  actions: Action[];
  onActionClick: (action: Action) => void;
  getUrgencyColor: (action: Action) => string;
  formatDate: (dateString?: string) => string | null;
}

function ActionGroup({
  icon: Icon,
  title,
  count,
  color,
  expanded,
  onToggle,
  actions,
  onActionClick,
  getUrgencyColor,
  formatDate
}: ActionGroupProps) {
  const colorClasses = {
    red: 'from-red-500 to-red-600',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    slate: 'from-slate-500 to-slate-600'
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Group Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br shadow-sm',
            colorClasses[color]
          )}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-600">{count} {count === 1 ? 'action' : 'actions'}</p>
          </div>
        </div>
        <ChevronRight className={cn(
          'w-5 h-5 text-slate-400 transition-transform',
          expanded && 'rotate-90'
        )} />
      </button>

      {/* Group Content */}
      {expanded && (
        <div className="border-t border-slate-200 bg-slate-50/50">
          <div className="p-3 space-y-2">
            {actions.map(action => (
              <button
                key={action._id}
                onClick={() => onActionClick(action)}
                className={cn(
                  'w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all hover:shadow-sm',
                  getUrgencyColor(action)
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-medium text-sm leading-tight truncate">
                      {action.title}
                    </p>
                    {formatDate(action.targetDate) && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {formatDate(action.targetDate)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mb-1">
                    Client: {(action as any).clientName || 'Unknown'}
                  </p>
                  {action.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {action.description}
                    </p>
                  )}
                  {action.serviceType && (
                    <Badge variant="outline" className="text-xs mt-2">
                      {action.serviceType}
                    </Badge>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

