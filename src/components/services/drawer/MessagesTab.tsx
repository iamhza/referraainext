'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Send, MessageSquare, AlertCircle, AlertTriangle, User 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useServiceMessages } from './hooks/use-service-messages';
import type { ServiceMessage } from './types';

interface MessagesTabProps {
  serviceRelationshipId: string;
  onCreateIssueFromMessage?: (message: ServiceMessage) => void;
}

export function MessagesTab({ serviceRelationshipId, onCreateIssueFromMessage }: MessagesTabProps) {
  const { messages, loading, error, sending, sendMessage } = useServiceMessages(serviceRelationshipId);
  const [newMessage, setNewMessage] = useState('');

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    
    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Messages List */}
      <ScrollArea className="flex-1 pr-4">
        {messages.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-slate-300 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">No Messages Yet</h3>
              <p className="text-sm text-slate-500">
                Start a conversation about this service relationship.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <MessageCard 
                key={message._id} 
                message={message}
                onCreateIssue={onCreateIssueFromMessage}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <Card className="border-2 bg-slate-50">
        <CardContent className="pt-4 space-y-3">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Cmd/Ctrl + Enter to send)"
            className="min-h-[80px] bg-white border-2 resize-none"
            disabled={sending}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">
              Messages are visible to the provider
            </span>
            <Button 
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              size="sm"
            >
              {sending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MessageCard({ 
  message, 
  onCreateIssue 
}: { 
  message: ServiceMessage;
  onCreateIssue?: (message: ServiceMessage) => void;
}) {
  const isCaseManager = message.senderType === 'CASE_MANAGER';

  return (
    <Card className={`border-2 ${isCaseManager ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3 mb-3">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
            isCaseManager ? 'bg-blue-600' : 'bg-slate-600'
          }`}>
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-slate-900">{message.senderName}</span>
              <Badge variant="outline" className="text-xs">
                {isCaseManager ? 'Case Manager' : 'Provider'}
              </Badge>
            </div>
            <span className="text-xs text-slate-500">
              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        <p className="text-sm text-slate-700 whitespace-pre-wrap mb-3">
          {message.content}
        </p>

        {/* Linked Issue Badge */}
        {message.linkedIssue && (
          <div className="flex items-center gap-2 pt-3 border-t">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-medium text-amber-900">
              Linked to {message.linkedIssue.type.replace(/_/g, ' ')} Issue
            </span>
            <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-300">
              {message.linkedIssue.status}
            </Badge>
          </div>
        )}

        {/* Create Issue Action */}
        {!message.linkedIssue && onCreateIssue && (
          <div className="pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-600 hover:text-amber-700"
              onClick={() => onCreateIssue(message)}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Create Issue from this message
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

