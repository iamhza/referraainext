'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle, FileText, Calendar, Clock, MessageSquare, Zap, ChevronRight, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/shared/utils';
import type { Action } from '@/types/actions';

interface PriorityHubProps {
  isOpen: boolean;
  onClose: () => void;
  onClientSelect: (clientId: string, actionId?: string) => void;
}

interface ClientGroup {
  clientId: string;
  clientName: string;
  actions: Action[];
  urgentCount: number;
  maxUrgency: 'issue' | 'urgent' | 'normal';
  overdueCount: number;
}

export function PriorityHub({ isOpen, onClose, onClientSelect }: PriorityHubProps) {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

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

  const clientGroups = useMemo<ClientGroup[]>(() => {
    const clientMap = new Map<string, ClientGroup>();
    const now = new Date();

    actions.forEach(action => {
      const clientId = action.clientId;
      const clientName = (action as any).clientName || 'Unknown Client';
      
      if (!clientMap.has(clientId)) {
        clientMap.set(clientId, {
          clientId,
          clientName,
          actions: [],
          urgentCount: 0,
          maxUrgency: 'normal',
          overdueCount: 0
        });
      }
      
      const group = clientMap.get(clientId)!;
      group.actions.push(action);
      
      // Count urgent actions
      if (
        action.type === 'flag_concern' ||
        action.type === 'urgent_alert' ||
        action.urgency === 'issue' ||
        action.urgency === 'urgent'
      ) {
        group.urgentCount++;
      }
      
      // Track max urgency
      if (action.urgency === 'issue' && group.maxUrgency !== 'issue') {
        group.maxUrgency = 'issue';
      } else if (action.urgency === 'urgent' && group.maxUrgency === 'normal') {
        group.maxUrgency = 'urgent';
      }
      
      // Count overdue
      if (action.targetDate && new Date(action.targetDate) < now) {
        group.overdueCount++;
      }
    });

    // Convert to array and sort by urgency, then by action count
    const groups = Array.from(clientMap.values());
    
    // Sort: Issues first, then urgent, then by number of actions
    groups.sort((a, b) => {
      const urgencyOrder = { issue: 3, urgent: 2, normal: 1 };
      const urgencyDiff = urgencyOrder[b.maxUrgency] - urgencyOrder[a.maxUrgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      
      // Then by overdue count
      if (b.overdueCount !== a.overdueCount) {
        return b.overdueCount - a.overdueCount;
      }
      
      // Then by total action count
      return b.actions.length - a.actions.length;
    });

    return groups;
  }, [actions]);

  const totalPendingActions = actions.length;
  const totalClients = clientGroups.length;

  const toggleClient = (clientId: string) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
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
                {totalPendingActions} {totalPendingActions === 1 ? 'action' : 'actions'} across {totalClients} {totalClients === 1 ? 'client' : 'clients'}
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
            <div className="space-y-3">
              {clientGroups.map(clientGroup => (
                <ClientGroupCard
                  key={clientGroup.clientId}
                  clientGroup={clientGroup}
                  expanded={expandedClients.has(clientGroup.clientId)}
                  onToggle={() => toggleClient(clientGroup.clientId)}
                  onActionClick={handleActionClick}
                  getUrgencyColor={getUrgencyColor}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </>
  );
}

// Client Group Component
interface ClientGroupCardProps {
  clientGroup: ClientGroup;
  expanded: boolean;
  onToggle: () => void;
  onActionClick: (action: Action) => void;
  getUrgencyColor: (action: Action) => string;
  formatDate: (dateString?: string) => string | null;
}

function ClientGroupCard({
  clientGroup,
  expanded,
  onToggle,
  onActionClick,
  getUrgencyColor,
  formatDate
}: ClientGroupCardProps) {
  const getColorFromUrgency = (urgency: 'issue' | 'urgent' | 'normal') => {
    if (urgency === 'issue') return 'from-red-500 to-red-600';
    if (urgency === 'urgent') return 'from-orange-500 to-orange-600';
    return 'from-slate-500 to-slate-600';
  };

  const getBorderColor = (urgency: 'issue' | 'urgent' | 'normal') => {
    if (urgency === 'issue') return 'border-red-200';
    if (urgency === 'urgent') return 'border-orange-200';
    return 'border-slate-200';
  };

  return (
    <div className={cn(
      'rounded-xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow',
      getBorderColor(clientGroup.maxUrgency)
    )}>
      {/* Client Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br shadow-sm shrink-0',
            getColorFromUrgency(clientGroup.maxUrgency)
          )}>
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">{clientGroup.clientName}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-slate-600">
                {clientGroup.actions.length} {clientGroup.actions.length === 1 ? 'action' : 'actions'}
              </p>
              {clientGroup.urgentCount > 0 && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0">
                  {clientGroup.urgentCount} urgent
                </Badge>
              )}
              {clientGroup.overdueCount > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-orange-100 text-orange-700">
                  {clientGroup.overdueCount} overdue
                </Badge>
              )}
            </div>
          </div>
        </div>
        <ChevronRight className={cn(
          'w-5 h-5 text-slate-400 transition-transform shrink-0',
          expanded && 'rotate-90'
        )} />
      </button>

      {/* Actions List */}
      {expanded && (
        <div className="border-t border-slate-200 bg-slate-50/50">
          <div className="p-3 space-y-2">
            {clientGroup.actions.map(action => (
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
                    <p className="font-medium text-sm leading-tight">
                      {action.title}
                    </p>
                    {formatDate(action.targetDate) && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {formatDate(action.targetDate)}
                      </Badge>
                    )}
                  </div>
                  {action.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                      {action.description}
                    </p>
                  )}
                  {action.serviceType && (
                    <Badge variant="outline" className="text-xs">
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

