'use client';

import { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Paperclip, 
  Send, 
  Smile, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  CheckCheck, 
  Clock, 
  ThumbsUp, 
  MessageSquare, 
  MoreHorizontal,
  AlignLeft,
  Bold,
  Italic,
  Code,
  ListOrdered,
  ListChecks,
  AtSign,
  Plus
} from 'lucide-react';
import { formatRelative, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export interface MessageProps {
  id: string;
  content: string;
  timestamp: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: string; // e.g., 'case_manager', 'provider', 'admin'
  isOwn: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  reactions?: MessageReaction[];
  hasThread?: boolean;
  threadCount?: number;
  formattedContent?: boolean;
  attachments?: {
    id: string;
    type: 'image' | 'document';
    name: string;
    url: string;
    size?: string;
  }[];
}

interface MessageReaction {
  emoji: string;
  count: number;
  userIds: string[];
}

interface MessageThreadProps {
  messages: MessageProps[];
  currentUserId: string;
  currentUserRole: string;
  conversationName: string;
  conversationAvatar?: string;
  isLoading?: boolean;
  onSendMessage: (content: string, attachments?: File[], threadId?: string) => Promise<void>;
  onToggleReaction?: (messageId: string, emoji: string) => void;
}

// Helper function to get initials from name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();
};

// Format the timestamp
const formatMessageTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return format(date, 'h:mm a'); // Today: 2:30 PM
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday ' + format(date, 'h:mm a'); // Yesterday 2:30 PM
    } else {
      return format(date, 'MMM d h:mm a'); // Jan 5 2:30 PM
    }
  } catch (error) {
    return 'Unknown time';
  }
};

// Group messages by date
const groupMessagesByDate = (messages: MessageProps[]) => {
  const groups: { [key: string]: MessageProps[] } = {};
  
  messages.forEach(message => {
    const date = new Date(message.timestamp);
    const dateKey = format(date, 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
  });
  
  return Object.entries(groups).map(([date, messages]) => ({
    date,
    displayDate: formatDateHeading(date),
    messages
  }));
};

// Format date for headings
const formatDateHeading = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return format(date, 'MMMM d, yyyy'); // January 5, 2023
  }
};

// Common emoji reactions
const commonEmojis = ['👍', '❤️', '😂', '🎉', '👏', '🔥', '⭐', '✅'];

export function MessageThread({
  messages,
  currentUserId,
  currentUserRole,
  conversationName,
  conversationAvatar,
  isLoading = false,
  onSendMessage,
  onToggleReaction
}: MessageThreadProps) {
  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!messageText.trim() && attachments.length === 0) return;
    
    setIsSending(true);
    try {
      await onSendMessage(messageText, attachments.length > 0 ? attachments : undefined, activeThread || undefined);
      setMessageText('');
      setAttachments([]);
      if (activeThread) {
        // Keep the thread open but clear the input
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Show an error notification here
    } finally {
      setIsSending(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
  };
  
  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };
  
  const getAttachmentPreview = (file: File) => {
    const isImage = file.type.startsWith('image/');
    
    return (
      <div 
        key={file.name} 
        className="flex items-center gap-2 p-2 bg-gray-50 rounded-md border border-gray-200"
      >
        {isImage ? (
          <ImageIcon className="h-4 w-4 text-blue-500" />
        ) : (
          <FileText className="h-4 w-4 text-blue-500" />
        )}
        <span className="text-xs truncate max-w-[120px]">{file.name}</span>
        <button 
          type="button" 
          className="text-gray-400 hover:text-gray-600"
          onClick={() => removeAttachment(attachments.indexOf(file))}
        >
          &times;
        </button>
      </div>
    );
  };
  
  const handleReaction = (messageId: string, emoji: string) => {
    if (onToggleReaction) {
      onToggleReaction(messageId, emoji);
    }
  };
  
  const handleThreadReply = (messageId: string) => {
    setActiveThread(messageId);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };
  
  const insertFormatting = (format: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = messageText;
    
    let modifiedText = '';
    const selectedText = text.substring(start, end);
    
    switch (format) {
      case 'bold':
        modifiedText = text.substring(0, start) + `*${selectedText}*` + text.substring(end);
        break;
      case 'italic':
        modifiedText = text.substring(0, start) + `_${selectedText}_` + text.substring(end);
        break;
      case 'code':
        modifiedText = text.substring(0, start) + `\`${selectedText}\`` + text.substring(end);
        break;
      case 'codeblock':
        modifiedText = text.substring(0, start) + `\`\`\`\n${selectedText}\n\`\`\`` + text.substring(end);
        break;
      case 'list':
        modifiedText = text.substring(0, start) + `• ${selectedText}` + text.substring(end);
        break;
      default:
        return;
    }
    
    setMessageText(modifiedText);
    
    // Set focus back to the textarea after state update
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + (format === 'codeblock' ? 4 : 1),
        end + (format === 'codeblock' ? 4 : 1)
      );
    }, 0);
  };
  
  // Render message groups by date
  const messageGroups = groupMessagesByDate(messages);

  // Message content formatter (handles basic markdown-like syntax)
  const formatContent = (content: string) => {
    // Replace *bold* with <strong>bold</strong>
    let formatted = content.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
    
    // Replace _italic_ with <em>italic</em>
    formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Replace `code` with <code>code</code>
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>');
    
    // Replace ```code block``` with <pre><code>code block</code></pre>
    formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-2 rounded text-sm mt-1 mb-1 overflow-x-auto"><code>$1</code></pre>');
    
    // Replace URLs with clickable links
    formatted = formatted.replace(
      /(https?:\/\/[^\s]+)/g, 
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">$1</a>'
    );
    
    // Replace bullet points
    formatted = formatted.replace(/^•\s(.*)$/gm, '<li>$1</li>');
    
    return formatted;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Conversation header */}
      <div className="px-4 py-3 border-b flex items-center gap-3 bg-white">
        <Avatar className="h-8 w-8">
          {conversationAvatar ? (
            <AvatarImage src={conversationAvatar} alt={conversationName} />
          ) : (
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {getInitials(conversationName)}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">{conversationName}</h3>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            <span className="text-xs text-gray-500">Active now</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Start a thread</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <MoreHorizontal className="h-4 w-4 text-gray-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>More options</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Messages container */}
      <ScrollArea className="flex-1 px-4 py-2">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="bg-gray-100 rounded-full p-4 mb-3">
              <MessageIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700">No messages yet</h3>
            <p className="text-gray-500 mt-1 max-w-sm">
              Start the conversation by sending a message below.
            </p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {messageGroups.map(group => (
              <div key={group.date} className="space-y-1">
                <div className="flex justify-center">
                  <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                    {group.displayDate}
                  </div>
                </div>
                
                {group.messages.map(message => (
                  <div
                    key={message.id}
                    className={cn(
                      "group py-1 px-2 hover:bg-gray-50 rounded-md transition-colors",
                      activeThread === message.id && "bg-blue-50 hover:bg-blue-50"
                    )}
                  >
                    <div className="flex gap-3">
                      <Avatar className="h-9 w-9 mt-1 flex-shrink-0">
                        {message.senderAvatar ? (
                          <AvatarImage src={message.senderAvatar} alt={message.senderName} />
                        ) : (
                          <AvatarFallback className={cn(
                            "text-xs",
                            message.senderRole === 'case_manager' ? "bg-blue-100 text-blue-600" :
                            message.senderRole === 'provider' ? "bg-green-100 text-green-600" :
                            "bg-purple-100 text-purple-600"
                          )}>
                            {getInitials(message.senderName)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      
                      <div className="flex-1 space-y-1 overflow-hidden">
                        {/* Message header with name and time */}
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-gray-900 text-sm">{message.senderName}</span>
                          <span className="text-xs text-gray-500">{formatMessageTime(message.timestamp)}</span>
                        </div>
                        
                        {/* Message content */}
                        <div className="text-sm text-gray-800">
                          {message.formattedContent ? (
                            <div dangerouslySetInnerHTML={{ __html: formatContent(message.content) }} />
                          ) : (
                            <div className="whitespace-pre-wrap break-words">{message.content}</div>
                          )}
                        </div>
                        
                        {/* Attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map(attachment => (
                              <div key={attachment.id} className="rounded overflow-hidden max-w-xs">
                                {attachment.type === 'image' ? (
                                  <div className="relative group">
                                    <img 
                                      src={attachment.url} 
                                      alt={attachment.name}
                                      className="max-w-full rounded border border-gray-200"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity opacity-0 group-hover:opacity-100">
                                      <Button size="sm" variant="secondary" className="bg-white/90">
                                        <Download className="h-4 w-4 mr-1" /> Download
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <a 
                                    href={attachment.url} 
                                    download={attachment.name}
                                    className="flex items-center gap-2 p-3 border border-gray-200 rounded bg-gray-50 hover:bg-gray-100 transition-colors"
                                  >
                                    <FileText className="h-5 w-5 text-blue-500" />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-gray-900 truncate">
                                        {attachment.name}
                                      </div>
                                      {attachment.size && (
                                        <div className="text-xs text-gray-500">
                                          {attachment.size}
                                        </div>
                                      )}
                                    </div>
                                    <Download className="h-4 w-4 text-gray-400" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Message status for own messages */}
                        {message.isOwn && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            {message.status === 'sending' && (
                              <>Sending<Clock className="h-3 w-3 ml-0.5" /></>
                            )}
                            {message.status === 'sent' && (
                              <>Sent<Check className="h-3 w-3 ml-0.5" /></>
                            )}
                            {message.status === 'delivered' && (
                              <>Delivered<CheckCheck className="h-3 w-3 ml-0.5" /></>
                            )}
                            {message.status === 'read' && (
                              <span className="text-blue-500 flex items-center">
                                Read<CheckCheck className="h-3 w-3 ml-0.5" />
                              </span>
                            )}
                            {message.status === 'error' && (
                              <span className="text-red-500">Failed to send</span>
                            )}
                          </div>
                        )}
                        
                        {/* Reactions */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {message.reactions.map((reaction, i) => (
                              <button
                                key={`${reaction.emoji}-${i}`}
                                className={cn(
                                  "inline-flex items-center gap-1 py-0.5 px-1.5 rounded-full text-xs",
                                  reaction.userIds.includes(currentUserId)
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                )}
                                onClick={() => handleReaction(message.id, reaction.emoji)}
                              >
                                <span>{reaction.emoji}</span>
                                <span>{reaction.count}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Thread indicator */}
                        {message.hasThread && message.threadCount && message.threadCount > 0 && (
                          <button 
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mt-1"
                            onClick={() => handleThreadReply(message.id)}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            {message.threadCount} {message.threadCount === 1 ? 'reply' : 'replies'}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Message actions */}
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity mt-1 ml-12 space-x-1">
                      {/* Reaction button */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                            <Smile className="h-3.5 w-3.5 text-gray-500" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-1 flex gap-1">
                          {commonEmojis.map(emoji => (
                            <button
                              key={emoji}
                              className="p-1.5 hover:bg-gray-100 rounded text-lg"
                              onClick={() => handleReaction(message.id, emoji)}
                            >
                              {emoji}
                            </button>
                          ))}
                        </PopoverContent>
                      </Popover>
                      
                      {/* Thread reply button */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 rounded-full"
                        onClick={() => handleThreadReply(message.id)}
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-gray-500" />
                      </Button>
                      
                      {/* More actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                            <MoreHorizontal className="h-3.5 w-3.5 text-gray-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem>Copy text</DropdownMenuItem>
                          <DropdownMenuItem>Mark unread</DropdownMenuItem>
                          {message.isOwn && (
                            <DropdownMenuItem className="text-red-600">Delete message</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      
      {/* Thread reply indicator */}
      {activeThread && (
        <div className="px-4 py-2 bg-gray-50 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600 flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            Replying in thread
          </div>
          <Button 
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => setActiveThread(null)}
          >
            Exit thread
          </Button>
        </div>
      )}
      
      {/* Typing indicator */}
      {isTyping && (
        <div className="px-4 py-2 text-xs text-gray-500 italic border-t">
          Someone is typing...
        </div>
      )}
      
      {/* Message input */}
      <div className="border-t p-3 bg-white">
        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 px-2">
            {attachments.map((file, index) => getAttachmentPreview(file))}
          </div>
        )}
        
        {/* Formatting toolbar */}
        {showFormatting && (
          <div className="flex items-center gap-1 mb-2 px-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    className="h-7 w-7 rounded"
                    onClick={() => insertFormatting('bold')}
                  >
                    <Bold className="h-3.5 w-3.5 text-gray-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Bold <span className="opacity-70">*text*</span></p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    className="h-7 w-7 rounded"
                    onClick={() => insertFormatting('italic')}
                  >
                    <Italic className="h-3.5 w-3.5 text-gray-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Italic <span className="opacity-70">_text_</span></p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    className="h-7 w-7 rounded"
                    onClick={() => insertFormatting('code')}
                  >
                    <Code className="h-3.5 w-3.5 text-gray-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Code <span className="opacity-70">`code`</span></p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    className="h-7 w-7 rounded"
                    onClick={() => insertFormatting('list')}
                  >
                    <ListChecks className="h-3.5 w-3.5 text-gray-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Bulleted list</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <div className="h-6 border-r border-gray-200 mx-1"></div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    className="h-7 w-7 rounded"
                  >
                    <AtSign className="h-3.5 w-3.5 text-gray-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Mention someone</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              placeholder={`Message ${activeThread ? 'thread' : conversationName}...`}
              className="resize-none pr-10 min-h-[44px] max-h-[60vh] border-gray-300 rounded-lg pl-10 py-2.5 shadow-sm"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <div className="absolute left-2.5 top-2.5">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded"
                onClick={() => setShowFormatting(!showFormatting)}
              >
                <AlignLeft className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
            <div className="absolute right-3 bottom-3 flex gap-1.5">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 rounded"
                  >
                    <Plus className="h-4 w-4 text-gray-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="end">
                  <div className="grid grid-cols-2 gap-1">
                    <Button 
                      variant="ghost" 
                      className="text-xs h-auto py-1.5 px-2 justify-start"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FileText className="h-3.5 w-3.5 mr-1.5" /> Files
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="text-xs h-auto py-1.5 px-2 justify-start"
                    >
                      <ImageIcon className="h-3.5 w-3.5 mr-1.5" /> Images
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4 text-gray-500" />
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 rounded"
                  >
                    <Smile className="h-4 w-4 text-gray-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-2" align="end">
                  <div className="grid grid-cols-8 gap-2">
                    {['😀', '😂', '😍', '🤔', '😎', '👍', '❤️', '🎉', 
                      '🔥', '👏', '⭐', '✅', '🤣', '😊', '🙌', '👌'].map(emoji => (
                      <button
                        key={emoji}
                        className="h-8 w-8 flex items-center justify-center hover:bg-gray-100 rounded text-xl"
                        onClick={() => setMessageText(prev => prev + emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              multiple
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={isSending || (!messageText.trim() && attachments.length === 0)}
            className="self-end h-[44px] rounded-lg px-4"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-white" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Helper component for empty state
const MessageIcon = ({ className }: { className?: string }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
};

// Check icon for message status
const Check = ({ className }: { className?: string }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}; 