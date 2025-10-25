'use client';

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { 
  User, 
  UserPlus, 
  FileText, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  MessageSquare, 
  Upload, 
  Clock,
  Phone,
  Calendar,
  Loader2,
  Activity,
  Settings,
  Bell,
  Shield,
  RefreshCw,
  Play,
  Pause,
  Square,
  Flag,
  ArrowRight
} from 'lucide-react';
import { getClientStatusConfig } from '@/types/index';
import { getActionDefinition } from '@/types/actions';

interface TimelineEvent {
  id: string;
  type: 'client' | 'connection' | 'referral' | 'communication' | 'document' | 'system' | 'action' | 'status_change';
  title: string;
  description?: string;
  actor: string;
  timestamp: string;
  metadata?: any;
  actionType?: string;
  status?: string;
  urgency?: 'normal' | 'urgent' | 'issue';
}

interface TimelineProps {
  clientId: string;
  events?: TimelineEvent[];
}

// Helper function to format status labels consistently
const formatStatusLabel = (status: string): string => {
  if (!status) return 'Unknown';
  
  // Use centralized status config for client statuses
  try {
    const config = getClientStatusConfig(status as any);
    return config.label;
  } catch {
    // Fallback for other statuses
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
};

// Helper function to format action types
const formatActionLabel = (actionType: string): string => {
  const actionDef = getActionDefinition(actionType as any);
  if (actionDef) {
    return actionDef.label;
  }
  
  // Fallback formatting
  return actionType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Helper function to format service types
const formatServiceType = (serviceType: string): string => {
  if (!serviceType) return 'Service';
  
  const serviceMap: { [key: string]: string } = {
    'mental_health': 'Mental Health',
    'substance_abuse': 'Substance Abuse',
    'housing': 'Housing',
    'employment': 'Employment',
    'healthcare': 'Healthcare',
    'legal': 'Legal Services',
    'financial': 'Financial Assistance',
    'transportation': 'Transportation'
  };
  
  return serviceMap[serviceType] || serviceType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export function Timeline({ clientId, events }: TimelineProps) {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTimeline() {
      if (!clientId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch client events from API
        const response = await fetch(`/api/clients/${clientId}/events`);
        if (!response.ok) {
          throw new Error('Failed to fetch timeline');
        }
        
        const data = await response.json();
        setTimelineEvents(data.events || []);
      } catch (err) {
        console.error('Error fetching timeline:', err);
        setError('Failed to load timeline');
        // Show at least the client creation event as fallback
        setTimelineEvents([
          {
            id: 'created',
            type: 'system',
            title: 'Client added',
            description: 'Client added to your caseload',
            actor: 'System',
            timestamp: new Date().toISOString(),
          }
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchTimeline();
  }, [clientId]);

  // Use provided events or fetched events
  const eventsToShow = events || timelineEvents;
  const getEventIcon = (event: TimelineEvent) => {
    // Handle action types specifically
    if (event.type === 'action' && event.actionType) {
      const actionDef = getActionDefinition(event.actionType as any);
      if (actionDef?.icon) {
        // Map emoji icons to Lucide icons
        switch (actionDef.icon) {
          case '📅': return Calendar;
          case '🔔': return Bell;
          case '📄': return FileText;
          case '❗': return AlertTriangle;
          case '📝': return FileText;
          case '✅': return CheckCircle;
          case '🔄': return RefreshCw;
          case '📢': return Flag;
          case '📈': return Activity;
          case '📤': return Upload;
          case '⚠️': return AlertTriangle;
          case '⏸️': return Pause;
          case '▶️': return Play;
          case '🏁': return Square;
          case '💬': return MessageSquare;
          case '⏰': return Clock;
          case '🔐': return Shield;
          default: return Activity;
        }
      }
    }
    
    // Handle other event types
    switch (event.type) {
      case 'client':
      case 'status_change':
        return User;
      case 'connection':
        return UserPlus;
      case 'referral':
        return FileText;
      case 'communication':
        return MessageSquare;
      case 'document':
        return Upload;
      case 'action':
        return Activity;
      case 'system':
      default:
        return Clock;
    }
  };

  const getEventColor = (event: TimelineEvent) => {
    // Handle urgency for actions
    if (event.type === 'action' && event.urgency) {
      switch (event.urgency) {
        case 'urgent':
          return 'bg-red-50 text-red-600 border-red-200';
        case 'issue':
          return 'bg-orange-50 text-orange-600 border-orange-200';
        default:
          return 'bg-blue-50 text-blue-600 border-blue-200';
      }
    }
    
    // Handle different event types
    switch (event.type) {
      case 'client':
      case 'status_change':
        return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'connection':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'referral':
        return 'bg-indigo-50 text-indigo-600 border-indigo-200';
      case 'communication':
        return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'document':
        return 'bg-cyan-50 text-cyan-600 border-cyan-200';
      case 'action':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'system':
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-in fade-in duration-300">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4">
            {/* Timeline dot skeleton */}
            <div className="relative flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-slate-200 animate-pulse shrink-0" />
              {i < 5 && <div className="w-0.5 h-16 bg-slate-100 mt-2" />}
            </div>
            
            {/* Content skeleton */}
            <div className="flex-1 pb-8">
              <div className="relative overflow-hidden rounded-lg border-2 border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4">
                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                
                <div className="space-y-2">
                  {/* Title skeleton */}
                  <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
                  {/* Description skeleton */}
                  <div className="h-3 w-full bg-slate-100 rounded animate-pulse" />
                  <div className="h-3 w-3/4 bg-slate-100 rounded animate-pulse" />
                  {/* Timestamp skeleton */}
                  <div className="h-3 w-24 bg-slate-100 rounded animate-pulse mt-3" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  // Sort events by timestamp (oldest first - chronological timeline)
  const sortedEvents = [...eventsToShow].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="p-6">
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-6 top-6 bottom-0 w-px bg-gray-200" />
        
        <div className="space-y-6">
          {sortedEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No timeline events yet</p>
            </div>
          ) : (
            sortedEvents.map((event, index) => {
            const Icon = getEventIcon(event);
            const iconColor = getEventColor(event);
            
            // Format the event title and description with proper formatting
            const formattedTitle = event.type === 'action' && event.actionType 
              ? formatActionLabel(event.actionType)
              : event.type === 'status_change' && event.status
              ? `Status changed to ${formatStatusLabel(event.status)}`
              : event.title;
            
            const formattedDescription = event.description 
              ? event.description.replace(/_/g, ' ').replace(/([A-Z_]+)/g, (match) => 
                  match.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                  ).join(' ')
                )
              : undefined;
            
            return (
              <div key={event.id} className="relative flex items-start group">
                {/* Timeline icon */}
                <div className={`
                  relative z-10 flex items-center justify-center w-12 h-12 rounded-xl border-2 shadow-sm
                  transition-all duration-200 group-hover:scale-105 group-hover:shadow-md
                  ${iconColor}
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                
                {/* Event content */}
                <div className="ml-6 flex-1 min-w-0">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-semibold text-slate-900 leading-tight">
                            {formattedTitle}
                          </h4>
                          {event.urgency && event.urgency !== 'normal' && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                              event.urgency === 'urgent' 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-orange-100 text-orange-700'
                            }`}>
                              {event.urgency === 'urgent' ? 'Urgent' : 'Issue'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-xs text-slate-500 ml-4">
                          <time dateTime={event.timestamp} className="font-medium">
                            {format(parseISO(event.timestamp), 'MMM d, h:mm a')}
                          </time>
                        </div>
                      </div>
                      
                      {formattedDescription && (
                        <p className="text-sm text-slate-600 leading-relaxed mb-3">
                          {formattedDescription}
                        </p>
                      )}
                      
                      {/* Enhanced document event display */}
                      {event.type === 'document' && event.metadata && (
                        <div className={`rounded-lg p-3 mb-3 ${
                          event.metadata.action === 'delete' 
                            ? 'bg-red-50 border border-red-100' 
                            : 'bg-slate-50'
                        }`}>
                          <div className="flex items-center gap-2 text-sm">
                            {event.metadata.action === 'delete' ? (
                              <div className="flex items-center gap-1 text-red-600">
                                <FileText className="w-4 h-4" />
                                <span className="text-xs">DELETED</span>
                              </div>
                            ) : (
                              <FileText className="w-4 h-4 text-slate-500" />
                            )}
                            <span className={`font-medium ${
                              event.metadata.action === 'delete' ? 'text-red-700 line-through' : 'text-slate-700'
                            }`}>
                              {event.metadata.documentName}
                            </span>
                            {event.metadata.documentType && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                event.metadata.action === 'delete'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {event.metadata.documentType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            )}
                            {event.metadata.isEncrypted && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                                event.metadata.action === 'delete'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                <Shield className="w-3 h-3" />
                                HIPAA Secure
                              </span>
                            )}
                          </div>
                          {event.metadata.contextType && event.metadata.contextType !== 'general' && (
                            <div className={`mt-2 text-xs ${
                              event.metadata.action === 'delete' ? 'text-red-500' : 'text-slate-500'
                            }`}>
                              Linked to: {event.metadata.contextType === 'referral' ? 'Referral' : 'Provider Connection'}
                            </div>
                          )}
                          {event.metadata.action === 'delete' && (
                            <div className="mt-2 text-xs text-red-600 font-medium">
                              ⚠️ This document has been permanently deleted
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-slate-500">
                          <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center mr-2">
                            <User className="w-3 h-3" />
                          </div>
                          <span className="font-medium">{event.actor}</span>
                        </div>
                        <div className="text-xs text-slate-400">
                          {formatDistanceToNow(parseISO(event.timestamp), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
          )}
        </div>
      </div>
    </div>
  );
}
