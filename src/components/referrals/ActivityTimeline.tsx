import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle,
  FileText,
  Calendar,
  AlertCircle,
  AlertTriangle,
  Building,
  User,
  Paperclip
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string;
  actor?: {
    name: string;
    role: string;
  };
  metadata?: Record<string, any>;
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
  loading: boolean;
  error: string | null;
  userRole: string;
  referralId: string;
}

export function ActivityTimeline({
  events,
  loading,
  error,
  userRole,
  referralId
}: ActivityTimelineProps) {
  const [sortedEvents, setSortedEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    // Sort events by timestamp, newest first
    const sorted = [...events].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    setSortedEvents(sorted);
  }, [events]);

  if (loading) {
    return (
      <div className="py-8 text-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p>Loading timeline...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-red-500">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  if (sortedEvents.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <Clock className="h-8 w-8 mx-auto mb-2" />
        <p>No activity yet</p>
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    const icons: Record<string, any> = {
      referral_created: FileText,
      referral_updated: FileText,
      status_changed: Clock,
      provider_matched: Building,
      provider_selected: Building,
      provider_accepted: CheckCircle,
      provider_declined: AlertCircle,
      appointment_scheduled: Calendar,
      appointment_completed: CheckCircle,
      appointment_cancelled: AlertCircle,
      task_created: FileText,
      task_completed: CheckCircle,
      comment_added: MessageSquare,
      document_uploaded: Paperclip,
      service_started: Clock,
      service_completed: CheckCircle
    };
    return icons[type] || Clock;
  };

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      referral_created: 'blue',
      referral_updated: 'blue',
      status_changed: 'purple',
      provider_matched: 'indigo',
      provider_selected: 'indigo',
      provider_accepted: 'green',
      provider_declined: 'red',
      appointment_scheduled: 'amber',
      appointment_completed: 'green',
      appointment_cancelled: 'red',
      task_created: 'blue',
      task_completed: 'green',
      comment_added: 'gray',
      document_uploaded: 'blue',
      service_started: 'green',
      service_completed: 'green'
    };
    return colors[type] || 'gray';
  };

  return (
    <div className="space-y-1">
      {sortedEvents.map((event) => {
        const EventIcon = getEventIcon(event.type);
        const color = getEventColor(event.type);
        const formattedDate = event.timestamp 
          ? format(new Date(event.timestamp), 'MMM d, yyyy h:mm a')
          : '';
        const timeAgo = event.timestamp
          ? formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })
          : '';

        return (
          <div 
            key={event.id} 
            className={cn(
              "p-3 rounded-lg border border-gray-100 flex items-start gap-3 transition-all",
              "hover:bg-gray-50"
            )}
          >
            <div className={cn(
              "rounded-full p-2 flex-shrink-0 mt-1",
              `bg-${color}-100 text-${color}-600`
            )}>
              <EventIcon className="h-4 w-4" />
            </div>
            
            <div className="flex-grow min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-gray-900 break-words">{event.title}</h4>
                <span className="text-xs text-gray-500 whitespace-nowrap">{timeAgo}</span>
              </div>
              
              {event.description && (
                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
              )}
              
              {event.actor && (
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <Avatar className="h-5 w-5 mr-1">
                    <AvatarFallback className="text-[10px]">
                      {event.actor.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span>{event.actor.name}</span>
                  {event.actor.role && (
                    <Badge variant="outline" className="ml-2 px-1.5 py-0 h-4 text-[10px]">
                      {event.actor.role === 'case_manager' ? 'Case Manager' :
                       event.actor.role === 'provider' ? 'Provider' : 
                       event.actor.role === 'admin' ? 'Admin' : event.actor.role}
                    </Badge>
                  )}
                </div>
              )}
              
              {/* Render additional metadata if available */}
              {event.metadata && event.type === 'appointment_scheduled' && (
                <div className="mt-2 bg-gray-50 p-2 rounded text-xs">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                    <span>{format(new Date(event.metadata.date), 'MMMM d, yyyy')}</span>
                    <span className="mx-1">at</span>
                    <span>{format(new Date(event.metadata.date), 'h:mm a')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
} 