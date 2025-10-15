'use client';

import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Calendar, CheckCircle, Clock, AlertCircle, Paperclip, Users, Reply, Edit3, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddActionModal } from './AddActionModal';
import { Action, ServiceContext } from '@/types/actions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format, isToday, isYesterday, parseISO } from 'date-fns';
import { useCallback } from 'react';

interface ServiceFeedTabProps {
  clientId: string;
}

interface TimelineEvent {
  id: string;
  type: 'comment' | 'action' | 'status_change' | 'system';
  timestamp: string;
  author: {
    name: string;
    avatar: string;
    role: string;
    id: string;
    avatarUrl?: string;
  };
  content?: string;
  action?: Action & {
    context?: ServiceContext;
    comments?: any[];
  };
  statusChange?: {
    from: string;
    to: string;
    entity: string;
  };
  visibility?: 'team' | 'provider' | 'public';
  attachments?: string[];
  replies?: TimelineEvent[];
  parentId?: string;
}

export function ServiceFeedTab({ clientId }: ServiceFeedTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [actions, setActions] = useState<Action[]>([]);
  const [serviceContexts, setServiceContexts] = useState<ServiceContext[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddActionModalOpen, setIsAddActionModalOpen] = useState(false);
  
  // User avatar state (same logic as TopBar)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Fetch user avatar (same logic as TopBar)
  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (user) {
        // Try multiple sources for avatar URL
        let userAvatarUrl = user?.user_metadata?.avatar_url || 
                           user?.user_metadata?.picture;
        
        // If no avatar URL found, try fetching from API
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
        
        setAvatarUrl(userAvatarUrl || null);
      }
    };

    fetchUserAvatar();
  }, [user]);
  
  // Timeline composer state
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [composerMode, setComposerMode] = useState<'comment' | 'action'>('comment');
  
  // Context selection state
  const [selectedContextId, setSelectedContextId] = useState<string | null>(null);
  const [selectedContextType, setSelectedContextType] = useState<'referral' | 'connection' | 'general' | null>(null);

  // Date grouping functions
  const getDateSeparator = (timestamp: string) => {
    const date = parseISO(timestamp);
    if (isToday(date)) return 'TODAY';
    if (isYesterday(date)) return 'YESTERDAY';
    
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 7) {
      return format(date, 'EEEE').toUpperCase();
    } else if (daysDiff <= 30) {
      return format(date, 'MMMM do').toUpperCase();
    } else {
      return format(date, 'MMMM yyyy').toUpperCase();
    }
  };

  const groupEventsByDate = (events: TimelineEvent[]) => {
    if (events.length === 0) return {};
    
    const groups: { [key: string]: TimelineEvent[] } = {};
    
    events.forEach((event) => {
      const separator = getDateSeparator(event.timestamp);
      if (!groups[separator]) {
        groups[separator] = [];
      }
      groups[separator].push(event);
    });
    
    // Clean up small groups
    const groupEntries = Object.entries(groups);
    const cleanedGroups: { [key: string]: TimelineEvent[] } = {};
    
    groupEntries.forEach(([date, dateEvents], index) => {
      if (dateEvents.length <= 2 && date !== 'TODAY' && date !== 'YESTERDAY') {
        const prevEntry = groupEntries[index - 1];
        if (prevEntry && prevEntry[1].length <= 3) {
          if (!cleanedGroups[prevEntry[0]]) {
            cleanedGroups[prevEntry[0]] = [...prevEntry[1]];
          }
          cleanedGroups[prevEntry[0]].push(...dateEvents);
          return;
        }
      }
      cleanedGroups[date] = dateEvents;
    });
    
    return cleanedGroups;
  };

  // Fetch timeline data
  const fetchTimelineData = useCallback(async () => {
    if (!clientId) return;
    
    try {
      setLoading(true);
      
      let actionsData: any = { actions: [] };
      let timelineData: any = { events: [] };
      let contextsData: any = { contexts: [] };
      
      // Fetch actions
      try {
        const actionsResponse = await fetch(`/api/clients/${clientId}/actions`);
        if (actionsResponse.ok) {
          actionsData = await actionsResponse.json();
          setActions(actionsData.actions || []);
        }
      } catch (error) {
        console.error('Error fetching actions:', error);
      }

      // Fetch service contexts (from referrals and connections)
      try {
        const referralsResponse = await fetch(`/api/clients/${clientId}/referrals`);
        const connectionsResponse = await fetch(`/api/clients/${clientId}/connections`);
      
      const contexts: ServiceContext[] = [];
      
        if (referralsResponse.ok) {
          const referralsData = await referralsResponse.json();
          console.log('Referrals data:', referralsData.referrals); // Debug log
          referralsData.referrals?.forEach((referral: any) => {
            console.log('Processing referral:', referral); // Debug log
            
            // Try multiple possible field names for service type
            const serviceType = referral.serviceType || 
                               referral.service || 
                               referral.serviceDetails?.type ||
                               referral.serviceDetails?.serviceType ||
                               referral.requestedService ||
                               'Service';
            
            console.log('Service type found:', serviceType); // Debug log
          
          contexts.push({
            id: referral._id,
              type: 'referral',
              label: `${serviceType} Referral`,
              serviceType: serviceType,
            providerId: referral.assignedProvider,
              providerName: referral.assignedProviderName || referral.provider?.name || 'Provider',
              status: referral.status || 'pending',
              pendingActionsCount: 0
            });
          });
        }
        
        if (connectionsResponse.ok) {
          const connectionsData = await connectionsResponse.json();
          // Only add connections that are NOT already represented as referrals
          // This prevents duplicate entries for assigned providers
          connectionsData.connections?.forEach((connection: any) => {
            // Check if this connection is already represented as a referral
            const isAlreadyReferral = contexts.some(ctx => 
              ctx.type === 'referral' && ctx.id === connection.sourceReferralId
            );
            
            // Only add as connection if it's not already a referral
            if (!isAlreadyReferral) {
              contexts.push({
                id: connection._id,
                type: 'connection',
                label: `${connection.serviceType || 'Service'} Connection`,
                serviceType: connection.serviceType || 'Service',
                providerId: connection.providerId,
                providerName: connection.providerName || 'Provider',
                status: connection.status || 'active',
                pendingActionsCount: 0
              });
            }
          });
        }
      
      setServiceContexts(contexts);
        contextsData = { contexts };
    } catch (error) {
        console.error('Error fetching contexts:', error);
      }

      // Fetch timeline events
      try {
        const timelineResponse = await fetch(`/api/clients/${clientId}/events`);
        if (timelineResponse.ok) {
          timelineData = await timelineResponse.json();
        }
      } catch (error) {
        console.error('Error fetching timeline events:', error);
      }
      
      // Convert actions and timeline events into unified timeline
      const combinedEvents = await combineEventsIntoTimeline(
        actionsData.actions || [], 
        timelineData.events || [],
        contextsData.contexts || []
      );
      setEvents(combinedEvents);
      
    } catch (error) {
      console.error('Error fetching timeline data:', error);
      toast({
        title: "Error",
        description: "Failed to load timeline data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [clientId, user, avatarUrl]);

  const combineEventsIntoTimeline = async (actions: Action[], timelineEvents: any[], contexts: ServiceContext[] = []): Promise<TimelineEvent[]> => {
    const events: TimelineEvent[] = [];
    
    // Add actions as timeline events
    actions.forEach(action => {
      events.push({
        id: action._id,
        type: 'action',
        timestamp: action.createdAt,
        author: {
          id: action.createdBy,
          name: action.createdByName || 'Unknown',
          avatar: action.createdByName?.split(' ').map(n => n[0]).join('') || 'U',
          role: action.createdByRole || 'Unknown',
          avatarUrl: action.createdByRole === 'case_manager' && action.createdBy === user?.id ? avatarUrl || undefined : undefined
        },
        action: {
          ...action,
          context: contexts.find(ctx => ctx.id === action.contextId)
        }
      });
    });
    
    // Add other timeline events
    timelineEvents.forEach(event => {
      events.push({
        id: event._id || event.id,
        type: event.type,
        timestamp: event.createdAt || event.timestamp,
        author: {
          id: event.createdBy || event.authorId,
          name: event.createdByName || event.authorName || 'Unknown',
          avatar: (event.createdByName || event.authorName || 'U').split(' ').map((n: string) => n[0]).join(''),
          role: event.createdByRole || event.authorRole || 'Unknown',
          avatarUrl: event.createdByRole === 'case_manager' && (event.createdBy || event.authorId) === user?.id ? avatarUrl || undefined : undefined
        },
        content: event.content || event.description,
        statusChange: event.statusChange,
        visibility: event.visibility || 'team'
      });
    });
    
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  useEffect(() => {
    fetchTimelineData();
  }, [fetchTimelineData]);

  // Set default context when service contexts are loaded
  useEffect(() => {
    if (serviceContexts.length > 0 && !selectedContextId) {
      // Prefer referrals first, then connections
      const firstReferral = serviceContexts.find(ctx => ctx.type === 'referral');
      const firstConnection = serviceContexts.find(ctx => ctx.type === 'connection');
      
      if (firstReferral) {
        setSelectedContextId(firstReferral.id);
        setSelectedContextType('referral');
      } else if (firstConnection) {
        setSelectedContextId(firstConnection.id);
        setSelectedContextType('connection');
      }
    }
  }, [serviceContexts, selectedContextId]);

  // Action handlers
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      const response = await fetch(`/api/clients/${clientId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
          type: selectedContextType || 'general',
          contextId: selectedContextId,
          contextType: selectedContextType
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      await fetchTimelineData();
      setNewComment('');
      
      toast({
        title: "Comment Added",
        description: "Your comment has been added to the timeline.",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleActionCreated = async (actionData: any) => {
    try {
      await fetchTimelineData();
      setIsAddActionModalOpen(false);
      
      toast({
        title: "Action Created",
        description: "New action has been added to the timeline.",
      });
    } catch (error) {
      console.error('Error creating action:', error);
    }
  };

  const handleActionCompleted = async (actionId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/actions/${actionId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to complete action');
      }

      setEvents(prev => prev.map(event => 
        event.type === 'action' && event.action?._id === actionId
          ? {
              ...event,
              action: {
                ...event.action!,
                status: 'complete' as const,
                completedAt: new Date().toISOString()
              }
            }
          : event
      ));

      toast({
        title: "Action Completed",
        description: "The action has been marked as complete.",
      });
    } catch (error) {
      console.error('Error completing action:', error);
      toast({
        title: "Error",
        description: "Failed to complete action. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Render functions
  const renderUserAvatar = (author: TimelineEvent['author'], size: 'sm' | 'md' = 'md') => {
    const sizeClasses = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
    
    if (author.avatarUrl) {
    return (
        <div className={`${sizeClasses} rounded-full overflow-hidden ring-2 ring-white shadow-lg`}>
          <img 
            src={author.avatarUrl} 
            alt={author.name}
            className="w-full h-full object-cover"
          />
      </div>
    );
  }

    const bgColor = author.role === 'case_manager' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                   author.role === 'provider' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                   'bg-gradient-to-br from-slate-400 to-slate-500';

  return (
      <div className={`${sizeClasses} ${bgColor} rounded-full flex items-center justify-center font-semibold text-white shadow-lg ring-2 ring-white`}>
        {author.avatar}
        </div>
    );
  };

  const renderContextSwitcher = () => {
    const selectedContext = serviceContexts.find(ctx => ctx.id === selectedContextId);
    
    if (!selectedContext) return null;

    const getContextLabel = (context: ServiceContext) => {
      if (context.type === 'referral') {
        return `${context.serviceType} • ${context.providerName || 'Provider'}`;
      } else {
        return `${context.providerName || 'Provider'} • ${context.serviceType} (${context.status})`;
      }
    };

    const getContextIcon = (type: 'referral' | 'connection' | 'general') => {
      if (type === 'referral') {
        return <FileText className="w-3 h-3 text-blue-600" />;
      } else if (type === 'connection') {
        return <Users className="w-3 h-3 text-green-600" />;
      } else {
        return <MessageSquare className="w-3 h-3 text-slate-600" />;
      }
    };

    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-slate-700">Posting to:</span>
        </div>
        
        <Select 
          value={selectedContextId || ''} 
          onValueChange={(value) => {
            const context = serviceContexts.find(ctx => ctx.id === value);
            if (context) {
              setSelectedContextId(value);
              setSelectedContextType(context.type);
            }
          }}
        >
          <SelectTrigger className="w-full bg-white border-2 border-slate-200 hover:border-blue-300 focus:border-blue-500 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md p-3">
            <div className="flex items-center gap-3 w-full">
              <div className="flex-shrink-0">
                {getContextIcon(selectedContext.type)}
              </div>
              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {selectedContext.type}
                </span>
                <span className="text-sm font-semibold text-slate-900 truncate w-full">
                  {getContextLabel(selectedContext)}
                </span>
              </div>
              <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-300 flex-shrink-0">
                {selectedContext.status.charAt(0).toUpperCase() + selectedContext.status.slice(1)}
              </Badge>
      </div>
              </SelectTrigger>
          <SelectContent className="border border-slate-200 shadow-xl rounded-xl z-[9999] max-w-md bg-white backdrop-blur-sm">
            {/* Referrals Section */}
                {serviceContexts.filter(ctx => ctx.type === 'referral').length > 0 && (
                  <>
                <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">
                        Referrals
                      </div>
                    {serviceContexts
                      .filter(ctx => ctx.type === 'referral')
                      .map(context => (
                    <SelectItem key={context.id} value={context.id} className="hover:bg-blue-50 focus:bg-blue-50 px-4 py-3 cursor-pointer">
                      <div className="flex items-center gap-3 w-full">
                        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div className="flex flex-col items-start min-w-0 flex-1">
                          <span className="text-sm font-semibold text-slate-900 truncate">
                            {context.serviceType}
                          </span>
                          <span className="text-xs text-slate-500 truncate">
                            {context.providerName || 'Provider'}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 flex-shrink-0">
                          {context.status.charAt(0).toUpperCase() + context.status.slice(1)}
                              </Badge>
                          </div>
                        </SelectItem>
                      ))}
                  </>
                )}
                
            {/* Connections Section */}
                {serviceContexts.filter(ctx => ctx.type === 'connection').length > 0 && (
                  <>
                <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">
                  Provider Connections
                      </div>
                    {serviceContexts
                      .filter(ctx => ctx.type === 'connection')
                      .map(context => (
                    <SelectItem key={context.id} value={context.id} className="hover:bg-green-50 focus:bg-green-50 px-4 py-3 cursor-pointer">
                      <div className="flex items-center gap-3 w-full">
                        <Users className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <div className="flex flex-col items-start min-w-0 flex-1">
                          <span className="text-sm font-semibold text-slate-900 truncate">
                            {context.providerName || 'Provider'}
                          </span>
                          <span className="text-xs text-slate-500 truncate">
                            {context.serviceType}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 flex-shrink-0">
                          {context.status.charAt(0).toUpperCase() + context.status.slice(1)}
                              </Badge>
                          </div>
                        </SelectItem>
                      ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
    );
  };

  const renderComposer = () => (
    <div className="relative">
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-white to-purple-50 rounded-2xl"></div>
      <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-200/20 p-6">
        <div className="flex items-start gap-4">
          {renderUserAvatar({
            name: user?.name || 'You',
            avatar: user?.name?.split(' ').map((n: string) => n[0]).join('') || 'Y',
            role: 'case_manager',
            id: user?.id || '',
            avatarUrl: avatarUrl || undefined
          })}
          
          <div className="flex-1">
            {/* Mode Toggle */}
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-slate-100 rounded-lg p-1 flex">
                <Button
                  variant={composerMode === 'comment' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setComposerMode('comment')}
                  className={`text-xs px-3 py-1.5 rounded-md transition-all duration-200 ${
                    composerMode === 'comment' 
                      ? 'bg-white shadow-sm text-slate-900' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <MessageSquare className="w-3 h-3 mr-1.5" />
                  Comment
                </Button>
        <Button
                  variant={composerMode === 'action' ? 'default' : 'ghost'}
          size="sm"
                  onClick={() => setComposerMode('action')}
                  className={`text-xs px-3 py-1.5 rounded-md transition-all duration-200 ${
                    composerMode === 'action' 
                      ? 'bg-white shadow-sm text-slate-900' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Plus className="w-3 h-3 mr-1.5" />
                  Action
        </Button>
              </div>
      </div>
      
            {composerMode === 'comment' ? (
              <>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment. Use @ to mention team members..."
                  className="w-full min-h-[100px] px-0 py-0 border-0 resize-none focus:outline-none text-sm placeholder:text-slate-400 bg-transparent"
                  rows={4}
                />
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 px-2 py-1 h-8">
              <Paperclip className="w-4 h-4 mr-1.5" />
              Attach
            </Button>
                  <Button 
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2 h-9"
                  >
                    Comment
                  </Button>
                </div>
              </>
            ) : (
              <div className="py-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  {serviceContexts.length > 0 
                    ? 'Create a new workflow action' 
                    : 'No active services yet. Create a general client action.'}
                </p>
                <Button 
                  onClick={() => setIsAddActionModalOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Action
                </Button>
                {serviceContexts.length === 0 && (
                  <p className="text-xs text-slate-500 mt-2">
                    You can create general actions like notes, follow-ups, or documentation requests
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAction = (event: TimelineEvent) => {
    if (!event.action) return null;
    
    const action = event.action;
    const isCompleted = action.status === 'complete';
    const isPending = action.status === 'pending';
    
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'complete': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
        default: return 'bg-slate-50 text-slate-700 border-slate-200';
      }
    };

    return (
      <div className="flex gap-4">
        {renderUserAvatar(event.author)}
        <div className="flex-1 min-w-0">
          {/* Premium Action Card */}
          <div className="group relative">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-slate-50/50 to-white rounded-xl"></div>
            <div className="relative bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-xl shadow-lg shadow-slate-200/20 p-5 hover:shadow-xl hover:shadow-slate-200/30 transition-all duration-300">
              
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-semibold text-slate-900 leading-tight break-words">{action.title}</h4>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge className={`text-xs px-3 py-1.5 font-medium whitespace-nowrap ${getStatusColor(action.status)}`}>
                        {action.status === 'complete' ? 'Complete' : 'Pending'}
                      </Badge>
                      {action.urgency && action.urgency !== 'normal' && (
                        <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
                          action.urgency === 'urgent' ? 'text-red-500' : 'text-amber-500'
                        }`} />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">{event.author.name}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span>{formatDistanceToNow(parseISO(event.timestamp), { addSuffix: true })}</span>
                    </div>
                    
                    {action.context && (
                      <div className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-md">
                          <FileText className="w-3 h-3 text-blue-600" />
                          <span className="font-medium text-blue-700 text-xs break-words">{action.context.serviceType}</span>
                        </div>
                      </div>
                    )}
                    
                    {action.targetDate && (
                      <div className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-md">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span className="text-amber-700 text-xs font-medium">
                            Due {formatDistanceToNow(parseISO(action.targetDate), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {action.description && (
                    <p className="text-sm text-slate-700 leading-relaxed mb-4 break-words whitespace-pre-wrap">{action.description}</p>
                  )}
                  
                  {/* Custom Data Fields */}
                  {action.data && Object.keys(action.data).length > 0 && (
                    <div className="space-y-2 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      {Object.entries(action.data).map(([key, value]) => {
                        if (!value || key === 'notes') return null;
                        const label = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                        return (
                          <div key={key} className="flex items-start gap-2 text-sm">
                            <span className="font-semibold text-slate-900 min-w-[100px]">{label}:</span>
                            <span className="text-slate-700 break-words">{String(value)}</span>
                          </div>
                        );
                      })}
                      {action.notes && (
                        <div className="flex items-start gap-2 text-sm pt-2 border-t border-slate-200">
                          <span className="font-semibold text-slate-900 min-w-[100px]">Notes:</span>
                          <span className="text-slate-700 break-words whitespace-pre-wrap">{action.notes}</span>
                        </div>
                      )}
                    </div>
                  )}
          </div>
            </div>
            
              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-5 border-t border-slate-100">
                {!isCompleted && (
                  <Button
                    onClick={() => handleActionCompleted(action._id)}
                    size="sm"
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-md hover:shadow-lg transition-all duration-200 px-4 py-2 h-9 font-medium"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Complete
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(event.id)}
                  className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-3 py-2 h-9 transition-all duration-200 font-medium"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {action.comments?.length ? `${action.comments.length} Comments` : 'Comment'}
                </Button>
                
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderComment = (event: TimelineEvent) => (
    <div className="flex gap-4">
      {renderUserAvatar(event.author)}
      <div className="flex-1 min-w-0">
        <div className="group relative">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/50 rounded-xl"></div>
          <div className="relative bg-slate-50/80 backdrop-blur-sm rounded-xl p-4 hover:bg-slate-100/80 transition-all duration-200">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-semibold text-slate-900">{event.author.name}</span>
              <span className="text-xs text-slate-500">
                {formatDistanceToNow(parseISO(event.timestamp), { addSuffix: true })}
              </span>
              {event.visibility && event.visibility !== 'team' && (
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  {event.visibility}
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-700 leading-relaxed mb-3">{event.content}</p>
              <Button
                variant="ghost"
                size="sm"
              onClick={() => setReplyingTo(event.id)}
              className="text-slate-500 hover:text-slate-700 px-0 text-xs h-auto p-0 transition-all duration-200"
              >
              <Reply className="w-3 h-3 mr-1" />
              Reply
              </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStatusChange = (event: TimelineEvent) => (
    <div className="flex items-center gap-4 py-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shadow-sm">
        <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="font-medium text-slate-900">{event.statusChange?.entity}</span>
        <span className="text-slate-600">moved status to</span>
        <Badge className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 text-xs px-2 py-1">
          {event.statusChange?.to}
        </Badge>
        <span className="text-xs text-slate-500 ml-2">
          {formatDistanceToNow(parseISO(event.timestamp), { addSuffix: true })}
        </span>
      </div>
    </div>
  );

  const renderEvent = (event: TimelineEvent) => {
    switch (event.type) {
      case 'comment':
        return renderComment(event);
      case 'action':
        return renderAction(event);
      case 'status_change':
        return renderStatusChange(event);
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-spin mx-auto mb-4 flex items-center justify-center">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
          <p className="text-sm text-slate-600">Loading service feed...</p>
        </div>
              </div>
    );
  }

  const groupedEvents = groupEventsByDate(events);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Context Switcher */}
      {renderContextSwitcher()}
      
      {/* Composer */}
      {renderComposer()}

      {/* Premium Timeline */}
      <div className="relative">
        {/* Elegant timeline line with gradient */}
        <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-blue-200 via-slate-200 to-transparent"></div>

        {events.length === 0 && !loading ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">No activity yet</h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">Start the conversation by adding a comment or creating an action to begin collaborating.</p>
              <Button
              onClick={() => setComposerMode('action')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Action
              </Button>
            </div>
          ) : (
          Object.entries(groupedEvents).map(([date, dateEvents], groupIndex) => (
            <div key={date} className="mb-10">
              {/* Premium Date Separator */}
              {(Object.keys(groupedEvents).length > 1 || date === 'TODAY' || date === 'YESTERDAY') && (
                <div className="flex items-center justify-center mb-8">
                  <div className="bg-gradient-to-r from-slate-100 to-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-full shadow-sm">
                    {date}
                  </div>
                </div>
              )}

              {/* Events */}
              <div className="space-y-6">
                {dateEvents.map((event, eventIndex) => (
                  <div key={event.id} className="relative pl-12">
                    {/* Premium Timeline Dot */}
                    <div className={`absolute left-3.5 top-4 w-3 h-3 rounded-full shadow-sm border-2 border-white ${
                      event.type === 'action' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                      event.type === 'comment' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                      event.type === 'status_change' ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
                      'bg-gradient-to-br from-slate-400 to-slate-500'
                    }`}></div>
                    
                    {/* Event Content */}
                    {renderEvent(event)}

                    {/* Reply Form */}
                    {replyingTo === event.id && (
                      <div className="mt-4 ml-12">
                        <div className="bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200 p-4 shadow-sm">
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            className="w-full min-h-[80px] px-0 py-0 border-0 resize-none focus:outline-none text-sm bg-transparent"
                            rows={3}
                          />
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                            <span className="text-xs text-slate-500">
                              Replying to {event.author.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => {
                                  // Handle reply logic here
                                  setReplyingTo(null);
                                  setReplyContent('');
                                }}
                                disabled={!replyContent.trim()}
                                size="sm"
                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs px-4 py-1.5 h-7"
                              >
                                Reply
                              </Button>
                              <Button
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyContent('');
                                }}
                                size="sm"
                                variant="ghost"
                                className="text-slate-600 hover:text-slate-800 text-xs px-3 py-1.5 h-7"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
          )}
      </div>

      {/* Add Action Modal */}
      <AddActionModal
        isOpen={isAddActionModalOpen}
        onClose={() => setIsAddActionModalOpen(false)}
        clientId={clientId}
        onActionCreated={handleActionCreated}
        serviceContexts={serviceContexts}
        selectedContextId={selectedContextId}
      />
    </div>
  );
}