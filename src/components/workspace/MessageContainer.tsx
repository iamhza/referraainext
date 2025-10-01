'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { capitalizeName } from '@/lib/formatting';
import { 
  MessageSquare, 
  Clock, 
  AlertCircle, 
  FileText, 
  Users, 
  Lock,
  Edit2,
  Trash2,
  Reply,
  Check,
  X,
  MoreHorizontal
} from 'lucide-react';

interface Comment {
  _id: string;
  authorId: string;
  authorType: 'case_manager' | 'provider' | 'admin';
  authorName: string;
  category: string;
  content: string;
  priority: 'normal' | 'important' | 'urgent';
  createdAt: string;
  editedAt?: string;
  isInternal?: boolean;
  attachments?: Array<{
    name: string;
    type: string;
    size: string;
    url?: string;
  }>;
}

interface MessageContainerProps {
  comment: Comment;
  showAvatar: boolean;
  isFromCurrentUser: boolean;
  currentUserRole: 'case_manager' | 'provider' | 'admin';
  isEditing: boolean;
  editingContent: string;
  editingCategory: string;
  editingPriority: string;
  onStartEdit: (comment: Comment) => void;
  onCancelEdit: () => void;
  onSaveEdit: (messageId: string, content: string, category: string, priority: string) => void;
  onDelete: (messageId: string) => void;
  onReply: (messageId: string) => void;
  onEditingContentChange: (content: string) => void;
  onEditingCategoryChange: (category: string) => void;
  onEditingPriorityChange: (priority: string) => void;
  children?: React.ReactNode; // For replies
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'status_update':
    case 'status':
      return <MessageSquare className="h-3 w-3" />;
    case 'document_request':
    case 'request':
      return <FileText className="h-3 w-3" />;
    case 'service_coordination':
    case 'progress':
      return <Users className="h-3 w-3" />;
    case 'follow_up_required':
      return <Clock className="h-3 w-3" />;
    case 'incident':
    case 'issue':
      return <AlertCircle className="h-3 w-3" />;
    default:
      return <MessageSquare className="h-3 w-3" />;
  }
};

const getCategoryStyle = (category: string, priority: string) => {
  let baseStyle = '';
  
  switch (category) {
    case 'status_update':
    case 'status':
      baseStyle = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'document_request':
    case 'request':
      baseStyle = 'bg-purple-50 text-purple-700 border-purple-200';
      break;
    case 'service_coordination':
    case 'progress':
      baseStyle = 'bg-green-50 text-green-700 border-green-200';
      break;
    case 'follow_up_required':
      baseStyle = 'bg-orange-50 text-orange-700 border-orange-200';
      break;
    case 'incident':
    case 'issue':
      baseStyle = 'bg-red-50 text-red-700 border-red-200';
      break;
    default:
      baseStyle = 'bg-gray-50 text-gray-700 border-gray-200';
  }

  if (priority === 'urgent') {
    baseStyle += ' ring-2 ring-red-200';
  } else if (priority === 'important') {
    baseStyle += ' ring-1 ring-orange-200';
  }

  return `${baseStyle} border`;
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

export default function MessageContainer({
  comment,
  showAvatar,
  isFromCurrentUser,
  currentUserRole,
  isEditing,
  editingContent,
  editingCategory,
  editingPriority,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onReply,
  onEditingContentChange,
  onEditingCategoryChange,
  onEditingPriorityChange,
  children
}: MessageContainerProps) {
  
  return (
    <div className="group">
      {/* Main message container with professional layout */}
      <div className="flex gap-4 px-6 py-4 hover:bg-gray-50/50 -mx-6 rounded-lg">
        {/* Avatar column - consistent width */}
        <div className="flex-shrink-0 w-10">
          {showAvatar && (
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-gray-100 text-gray-700 font-medium text-sm">
                {getInitials(comment.authorName || (isFromCurrentUser ? 'You' : 'User'))}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        {/* Message content column */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header - Name, timestamp, status */}
          {showAvatar && (
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-3">
                <span className="font-semibold text-gray-900 text-sm">
                  {capitalizeName(comment.authorName || (isFromCurrentUser ? 'You' : 'User'))}
                </span>
                <span className="text-xs text-gray-500">
                  {getTimeAgo(comment.createdAt)}
                </span>
                {comment.editedAt && (
                  <span className="text-xs text-gray-400 italic">
                    (edited)
                  </span>
                )}
              </div>
              
              {/* Action buttons - only show on hover for current user */}
              {isFromCurrentUser && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onStartEdit(comment)}
                    className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(comment._id)}
                    className="h-7 w-7 p-0 text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Category badge - professional styling */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${getCategoryStyle(comment.category || 'general', comment.priority)}`}>
            {getCategoryIcon(comment.category || 'general')}
            <span className="uppercase tracking-wide font-semibold">
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
            
            {/* Priority badge */}
            {comment.priority && comment.priority !== 'normal' && (
              <Badge variant="secondary" className={`text-xs font-bold ${
                comment.priority === 'urgent' ? 'bg-red-100 text-red-700 border-red-300' :
                comment.priority === 'important' ? 'bg-orange-100 text-orange-700 border-orange-300' : ''
              }`}>
                {comment.priority.toUpperCase()}
              </Badge>
            )}
            
            {/* Internal note indicator */}
            {comment.isInternal && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                <Lock className="h-3 w-3 mr-1" />
                INTERNAL
              </Badge>
            )}
          </div>

          {/* Message content */}
          <div className="text-sm text-gray-900 leading-relaxed">
            {isEditing ? (
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg border">
                {/* Edit controls */}
                <div className="flex items-center gap-3">
                  <Select value={editingCategory} onValueChange={onEditingCategoryChange}>
                    <SelectTrigger className="h-8 w-auto text-xs">
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
                  
                  <Select value={editingPriority} onValueChange={onEditingPriorityChange}>
                    <SelectTrigger className="h-8 w-auto text-xs">
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
                  onChange={(e) => onEditingContentChange(e.target.value)}
                  className="min-h-[80px] text-sm resize-none"
                  placeholder="Edit your message..."
                  autoFocus
                />
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => onSaveEdit(comment._id, editingContent, editingCategory, editingPriority)}
                    className="h-8 px-4 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="h-3 w-3 mr-1.5" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onCancelEdit}
                    className="h-8 px-4"
                  >
                    <X className="h-3 w-3 mr-1.5" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="whitespace-pre-wrap break-words leading-relaxed">
                  {comment.content}
                </p>
                
                {/* Attachments if any */}
                {comment.attachments && comment.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {comment.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg border text-xs">
                        <FileText className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-700">{attachment.name}</span>
                        <span className="text-gray-500">({attachment.size})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action bar */}
          {!isEditing && (
            <div className="flex items-center gap-4 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply(comment._id)}
                className="h-7 px-3 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <Reply className="h-3 w-3 mr-1.5" />
                Reply
              </Button>
              
              {children && (
                <span className="text-xs text-gray-400">
                  {React.Children.count(children)} replies
                </span>
              )}
            </div>
          )}

          {/* Replies container */}
          {children && (
            <div className="mt-4 space-y-3 border-l-2 border-gray-100 pl-4">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
