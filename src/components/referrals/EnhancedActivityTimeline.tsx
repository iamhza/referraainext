import { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
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
  Paperclip,
  Eye,
  EyeOff,
  Plus,
  Reply,
  Star,
  Heart,
  ThumbsUp,
  X,
  Copy,
  Send,
  AtSign,
  RefreshCw,
  ChevronDown,
  Tag
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

interface Comment {
  id: string;
  content: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  timestamp: string;
  reactions?: Reaction[];
  replies?: Comment[];
  mentions?: string[];
  attachments?: {
    id: string;
    name: string;
    type: string;
    url: string;
    size?: string;
  }[];
}

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string;
  actor?: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  metadata?: Record<string, any>;
  comments?: Comment[];
  tags?: string[];
  attachments?: {
    id: string;
    name: string;
    type: string;
    url: string;
    size?: string;
  }[];
}

interface EnhancedActivityTimelineProps {
  events: TimelineEvent[];
  loading: boolean;
  error: string | null;
  userRole: string;
  referralId: string;
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  onAddComment?: (eventId: string, comment: string, attachments?: File[], threadId?: string) => Promise<boolean | void>;
  onAddReaction?: (eventId: string, commentId: string, emoji: string) => Promise<boolean | void>;
  onAddAttachment?: (eventId: string, files: File[]) => Promise<boolean | void>;
  onTagEvent?: (eventId: string, tag: string) => Promise<boolean | void>;
  onViewEvent?: (eventId: string) => Promise<boolean | void>;
}

export function EnhancedActivityTimeline({
  events,
  loading,
  error,
  userRole,
  referralId,
  currentUser,
  onAddComment,
  onAddReaction,
  onAddAttachment,
  onTagEvent,
  onViewEvent
}: EnhancedActivityTimelineProps) {
  const [sortedEvents, setSortedEvents] = useState<TimelineEvent[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

  // Common emoji reactions
  const commonEmojis = ['👍', '❤️', '😂', '🎉', '👏', '🔥'];

  useEffect(() => {
    // Sort events by timestamp, newest first
    const sorted = [...events].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    setSortedEvents(sorted);
  }, [events]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleCommentSubmit = async (eventId: string, threadId?: string) => {
    if (!onAddComment || (!newComment.trim() && selectedFiles.length === 0)) return;

    try {
      await onAddComment(eventId, newComment, selectedFiles.length > 0 ? selectedFiles : undefined, threadId);
      setNewComment('');
      setSelectedFiles([]);
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleReaction = async (eventId: string, commentId: string, emoji: string) => {
    if (!onAddReaction) return;
    try {
      await onAddReaction(eventId, commentId, emoji);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

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
      service_completed: CheckCircle,
      file_added: Paperclip,
      assignment_closed: X,
      assignment_created: Tag,
      review_requested: Eye
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
      service_completed: 'green',
      file_added: 'indigo',
      assignment_closed: 'red',
      assignment_created: 'amber',
      review_requested: 'blue'
    };
    return colors[type] || 'gray';
  };

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
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
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

  // Function to format the comment content with @mentions highlighted
  const formatContent = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="text-blue-600 font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Function to render comment attachments
  const renderAttachments = (attachments: any[]) => {
    return (
      <div className="mt-2 space-y-2">
        {attachments.map((attachment, index) => (
          <div 
            key={index}
            className="flex items-center bg-gray-50 rounded-md p-2 text-sm border border-gray-200"
          >
            <Paperclip className="h-4 w-4 text-gray-500 mr-2" />
            <span className="flex-1 truncate">{attachment.name}</span>
            {attachment.size && (
              <span className="text-xs text-gray-500 ml-2">{attachment.size}</span>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 ml-2 text-gray-500 hover:text-gray-700"
              asChild
            >
              <a href={attachment.url} target="_blank" rel="noopener noreferrer" download>
                <FileText className="h-4 w-4" />
              </a>
            </Button>
          </div>
        ))}
      </div>
    );
  };

  // Function to render comment reactions
  const renderReactions = (eventId: string, commentId: string, reactions: Reaction[]) => {
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {reactions.map((reaction, index) => (
          <Badge 
            key={index}
            variant="outline"
            className="rounded-full px-2 py-0.5 text-xs bg-gray-50 hover:bg-gray-100 cursor-pointer"
            onClick={() => handleReaction(eventId, commentId, reaction.emoji)}
          >
            <span className="mr-1">{reaction.emoji}</span>
            <span>{reaction.count}</span>
          </Badge>
        ))}
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5 rounded-full" 
                onClick={() => handleReaction(eventId, commentId, '👍')}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex gap-1">
                {commonEmojis.map(emoji => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleReaction(eventId, commentId, emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Comment input area */}
      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-6">
        <div className="flex gap-3">
          <Avatar className="h-8 w-8">
            {currentUser.avatar ? (
              <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
            ) : (
              <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="Comment or type / for commands"
              className="min-h-[80px] mb-2 border-gray-200 focus:border-blue-300"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="text-gray-500"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4 mr-1" />
                  Attach
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  onChange={handleFileSelect}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="text-gray-500"
                >
                  <AtSign className="h-4 w-4 mr-1" />
                  Mention
                </Button>
              </div>
              <Button 
                type="button"
                onClick={() => handleCommentSubmit(referralId)}
                disabled={!newComment.trim() && selectedFiles.length === 0}
              >
                <Send className="h-4 w-4 mr-1" />
                Send
              </Button>
            </div>
            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center bg-blue-50 rounded-md p-2 text-sm">
                    <Paperclip className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-gray-500 mx-2">
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5"
                      onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity timeline */}
      <div className="space-y-4">
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
                "p-4 rounded-lg border border-gray-200 bg-white transition-all",
                "hover:border-gray-300 hover:shadow-sm"
              )}
              onClick={() => onViewEvent && onViewEvent(event.id)}
            >
              <div className="flex gap-3">
                <div className={cn(
                  "rounded-full p-2 h-8 w-8 flex items-center justify-center flex-shrink-0",
                  `bg-${color}-100 text-${color}-600`
                )}>
                  <EventIcon className="h-4 w-4" />
                </div>
                
                <div className="flex-grow min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{event.title}</h4>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{timeAgo}</span>
                  </div>
                  
                  {event.description && (
                    <p className="text-sm text-gray-600">{event.description}</p>
                  )}
                  
                  {/* Event tags */}
                  {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {event.tags.map((tag, index) => (
                        <Badge 
                          key={index}
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {/* Event attachments */}
                  {event.attachments && event.attachments.length > 0 && (
                    <div className="mt-3">
                      {renderAttachments(event.attachments)}
                    </div>
                  )}
                  
                  {/* Actor information */}
                  {event.actor && (
                    <div className="flex items-center mt-3 text-xs text-gray-500">
                      <Avatar className="h-5 w-5 mr-1.5">
                        {event.actor.avatar ? (
                          <AvatarImage src={event.actor.avatar} alt={event.actor.name} />
                        ) : (
                          <AvatarFallback className="text-[10px]">
                            {getInitials(event.actor.name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="font-medium">{event.actor.name}</span>
                      {event.actor.role && (
                        <Badge variant="outline" className="ml-2 px-1.5 py-0 h-4 text-[10px]">
                          {event.actor.role === 'case_manager' ? 'Case Manager' :
                           event.actor.role === 'provider' ? 'Provider' : 
                           event.actor.role === 'admin' ? 'Admin' : event.actor.role}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {/* Comments section */}
                  {event.comments && event.comments.length > 0 && (
                    <div className="mt-4 space-y-3 border-t border-gray-100 pt-3">
                      {event.comments.map((comment) => (
                        <div key={comment.id} className="group">
                          <div className="flex gap-2">
                            <Avatar className="h-6 w-6 mt-0.5">
                              {comment.user.avatar ? (
                                <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
                              ) : (
                                <AvatarFallback className="text-[10px]">
                                  {getInitials(comment.user.name)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-baseline justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-gray-900">
                                      {comment.user.name}
                                    </span>
                                    <Badge variant="outline" className="px-1 py-0 h-4 text-[10px]">
                                      {comment.user.role === 'case_manager' ? 'Case Manager' :
                                       comment.user.role === 'provider' ? 'Provider' : 
                                       comment.user.role === 'admin' ? 'Admin' : comment.user.role}
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-800">
                                  {formatContent(comment.content)}
                                </div>
                                
                                {/* Comment attachments */}
                                {comment.attachments && comment.attachments.length > 0 && (
                                  renderAttachments(comment.attachments)
                                )}
                              </div>
                              
                              {/* Reactions */}
                              {comment.reactions && comment.reactions.length > 0 && (
                                renderReactions(event.id, comment.id, comment.reactions)
                              )}
                              
                              {/* Reply button */}
                              <div className="flex items-center gap-3 mt-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 text-xs text-gray-500 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => setReplyingTo(comment.id)}
                                >
                                  <Reply className="h-3 w-3 mr-1" />
                                  Reply
                                </Button>
                                
                                {/* Show replies toggle */}
                                {comment.replies && comment.replies.length > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-gray-500 hover:text-gray-700"
                                    onClick={() => toggleReplies(comment.id)}
                                  >
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    {expandedReplies[comment.id] ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                                    <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${expandedReplies[comment.id] ? 'rotate-180' : ''}`} />
                                  </Button>
                                )}
                              </div>
                              
                              {/* Threaded replies */}
                              {comment.replies && comment.replies.length > 0 && expandedReplies[comment.id] && (
                                <div className="pl-4 border-l border-gray-200 mt-3 space-y-3">
                                  {comment.replies.map((reply) => (
                                    <div key={reply.id} className="flex gap-2 group">
                                      <Avatar className="h-5 w-5 mt-0.5">
                                        {reply.user.avatar ? (
                                          <AvatarImage src={reply.user.avatar} alt={reply.user.name} />
                                        ) : (
                                          <AvatarFallback className="text-[8px]">
                                            {getInitials(reply.user.name)}
                                          </AvatarFallback>
                                        )}
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <div className="bg-gray-50 rounded-lg p-2">
                                          <div className="flex items-baseline justify-between mb-1">
                                            <div className="flex items-center gap-1">
                                              <span className="font-medium text-xs text-gray-900">
                                                {reply.user.name}
                                              </span>
                                              <Badge variant="outline" className="px-1 py-0 h-3 text-[8px]">
                                                {reply.user.role}
                                              </Badge>
                                            </div>
                                            <span className="text-[10px] text-gray-500">
                                              {formatDistanceToNow(new Date(reply.timestamp), { addSuffix: true })}
                                            </span>
                                          </div>
                                          <div className="text-xs text-gray-800">
                                            {formatContent(reply.content)}
                                          </div>
                                          
                                          {/* Reply attachments */}
                                          {reply.attachments && reply.attachments.length > 0 && (
                                            <div className="mt-1 space-y-1">
                                              {reply.attachments.map((attachment, index) => (
                                                <div 
                                                  key={index}
                                                  className="flex items-center bg-gray-100 rounded p-1 text-xs border border-gray-200"
                                                >
                                                  <Paperclip className="h-3 w-3 text-gray-500 mr-1" />
                                                  <span className="flex-1 truncate">{attachment.name}</span>
                                                  <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-5 w-5"
                                                    asChild
                                                  >
                                                    <a href={attachment.url} target="_blank" rel="noopener noreferrer" download>
                                                      <FileText className="h-3 w-3" />
                                                    </a>
                                                  </Button>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                        
                                        {/* Reply reactions */}
                                        {reply.reactions && reply.reactions.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {reply.reactions.map((reaction, index) => (
                                              <Badge 
                                                key={index}
                                                variant="outline"
                                                className="rounded-full px-1.5 py-0 text-[10px] bg-gray-50"
                                              >
                                                <span className="mr-0.5">{reaction.emoji}</span>
                                                <span>{reaction.count}</span>
                                              </Badge>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Reply input */}
                              {replyingTo === comment.id && (
                                <div className="mt-2 pl-6">
                                  <div className="flex gap-2">
                                    <Avatar className="h-5 w-5 mt-1">
                                      {currentUser.avatar ? (
                                        <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                                      ) : (
                                        <AvatarFallback className="text-[10px]">
                                          {getInitials(currentUser.name)}
                                        </AvatarFallback>
                                      )}
                                    </Avatar>
                                    <div className="flex-1">
                                      <Textarea
                                        placeholder={`Reply to ${comment.user.name}...`}
                                        className="min-h-[60px] text-sm mb-2"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                      />
                                      <div className="flex justify-between">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setReplyingTo(null)}
                                          className="h-7 text-xs"
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => handleCommentSubmit(event.id, comment.id)}
                                          disabled={!newComment.trim()}
                                          className="h-7 text-xs"
                                        >
                                          Reply
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 