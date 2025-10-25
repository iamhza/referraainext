'use client';

import React, { useState, useEffect } from 'react';
import { X, MessageSquare, AlertTriangle, FileText, Loader2, Send, Calendar, Building2, User, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import useSWR from 'swr';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CreateIssueDialog } from '@/components/issues/CreateIssueDialog';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getServiceRelationshipStatusConfig } from '@/types/service-relationships';
import { 
  ProfessionalDrawer,
  DrawerHeader,
  DrawerBody,
  DrawerTitle,
  DrawerSubtitle,
  DrawerTabs,
  DrawerSection
} from '@/components/ui/professional-drawer';

interface ServiceDetailDrawerProps {
  serviceRelationshipId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

interface ServiceMessage {
  _id: string;
  content: string;
  senderName: string;
  senderType: 'CASE_MANAGER' | 'PROVIDER_USER';
  linkedIssue?: {
    _id: string;
    type: string;
    status: string;
  };
  isIssueTrigger?: boolean;
  createdAt: string;
}

interface ServiceDetails {
  _id: string;
  clientId: string;
  providerId: string;
  serviceType: string;
  status: string;
  
  // Populated fields
  clientName: string;
  providerName: string;
  serviceName?: string;
  
  // Provider contact
  providerEmail?: string;
  providerPhone?: string;
  
  // Dates
  startDate?: string;
  endDate?: string;
  lastActivityAt?: string;
  
  // Counts
  activeIssuesCount?: number;
  openActionsCount?: number;
  documentsCount?: number;
  
  // Authorization
  authorization?: {
    status: string;
    startDate?: string;
    endDate?: string;
    units?: number;
    daysUntilExpiration?: number;
  };
}

type TabType = 'overview' | 'messages' | 'issues' | 'documents';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function ServiceDetailDrawer({
  serviceRelationshipId,
  isOpen,
  onClose,
  onRefresh,
}: ServiceDetailDrawerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ServiceMessage | null>(null);

  // Fetch service details (only when drawer is open)
  const { data: serviceData, isLoading: loadingService, mutate: mutateService } = useSWR(
    serviceRelationshipId && isOpen ? `/api/service-relationships/${serviceRelationshipId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  // Fetch messages (only poll when drawer is open)
  const { data: messagesData, isLoading: loadingMessages, mutate: mutateMessages } = useSWR(
    serviceRelationshipId && isOpen ? `/api/service-relationships/${serviceRelationshipId}/messages` : null,
    fetcher,
    { 
      refreshInterval: isOpen ? 15000 : 0, // Only poll when drawer is open (15s interval)
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  const service: ServiceDetails | null = serviceData?.serviceRelationship || null;
  const messages: ServiceMessage[] = messagesData?.messages || [];

  // Reset tab when drawer opens/closes
  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview');
      setNewMessage('');
      setSelectedMessage(null);
    }
  }, [isOpen, serviceRelationshipId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !serviceRelationshipId) return;

    setSendingMessage(true);
    try {
      const response = await fetch(`/api/service-relationships/${serviceRelationshipId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      toast.success('Message sent');
      setNewMessage('');
      mutateMessages();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleRaiseIssueFromMessage = (message: ServiceMessage) => {
    setSelectedMessage(message);
    setIssueDialogOpen(true);
  };

  if (!isOpen || !serviceRelationshipId) {
    return null;
  }

  return (
    <>
      <ProfessionalDrawer isOpen={isOpen} onClose={onClose}>
        <DrawerHeader onClose={onClose}>
          {loadingService ? (
            <>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48 mt-2" />
            </>
          ) : service ? (
            <>
              <DrawerTitle>{service.clientName} → {service.providerName}</DrawerTitle>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm font-semibold text-slate-700">{service.serviceName || service.serviceType}</span>
                <span className="text-slate-400">•</span>
                <Badge className={cn('text-xs', getServiceRelationshipStatusConfig(service.status as any).badgeClass)}>
                  {getServiceRelationshipStatusConfig(service.status as any).label}
                </Badge>
              </div>
            </>
          ) : (
            <DrawerTitle>Service Details</DrawerTitle>
          )}
        </DrawerHeader>

        <DrawerTabs
          tabs={[
            { id: 'overview', label: 'Overview', icon: Building2 },
            { 
              id: 'messages', 
              label: 'Messages', 
              icon: MessageSquare
            },
            { 
              id: 'issues', 
              label: 'Issues', 
              icon: AlertTriangle
            },
            { 
              id: 'documents', 
              label: 'Documents', 
              icon: FileText
            },
          ]}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as TabType)}
        />

        <DrawerBody>
          {loadingService ? (
            <div className="space-y-4 p-6">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : !service ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              Service not found
            </div>
          ) : (
            <>
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="p-6 space-y-6">
                  {/* Service Info */}
                  <DrawerSection title="Service Information">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Service Type</p>
                        <p className="text-sm font-bold text-slate-900 mt-1">{service.serviceName || service.serviceType}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</p>
                        <Badge className={cn('mt-1', getServiceRelationshipStatusConfig(service.status as any).badgeClass)}>
                          {getServiceRelationshipStatusConfig(service.status as any).label}
                        </Badge>
                      </div>
                      {service.startDate && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Start Date</p>
                          <p className="text-sm font-bold text-slate-900 mt-1">{format(new Date(service.startDate), 'MMM d, yyyy')}</p>
                        </div>
                      )}
                      {service.endDate && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">End Date</p>
                          <p className="text-sm font-bold text-slate-900 mt-1">{format(new Date(service.endDate), 'MMM d, yyyy')}</p>
                        </div>
                      )}
                    </div>
                  </DrawerSection>

                  {/* Provider Contact */}
                  <DrawerSection title="Provider Contact">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Building2 className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{service.providerName}</p>
                          {service.providerEmail && (
                            <p className="text-sm text-slate-600 mt-1">{service.providerEmail}</p>
                          )}
                          {service.providerPhone && (
                            <p className="text-sm text-slate-600">{service.providerPhone}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </DrawerSection>

                  {/* Authorization */}
                  {service.authorization && (
                    <DrawerSection title="Authorization">
                      <div className="bg-slate-50 border-2 border-slate-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-bold text-slate-900">
                                {service.authorization.status}
                              </span>
                            </div>
                            {service.authorization.units && (
                              <p className="text-sm text-slate-600">
                                {service.authorization.units} units authorized
                              </p>
                            )}
                            {service.authorization.endDate && (
                              <p className="text-sm text-slate-600">
                                Expires: {format(new Date(service.authorization.endDate), 'MMM d, yyyy')}
                              </p>
                            )}
                          </div>
                          {service.authorization.daysUntilExpiration !== undefined && service.authorization.daysUntilExpiration < 30 && (
                            <Badge variant="destructive" className="text-xs">
                              {service.authorization.daysUntilExpiration < 0 
                                ? 'Expired' 
                                : `${service.authorization.daysUntilExpiration}d left`}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </DrawerSection>
                  )}

                  {/* Quick Stats */}
                  <DrawerSection title="Activity Summary">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                        <p className="text-2xl font-bold text-red-700">{service.activeIssuesCount || 0}</p>
                        <p className="text-xs font-semibold text-red-600 mt-1">Active Issues</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                        <p className="text-2xl font-bold text-blue-700">{messages.length}</p>
                        <p className="text-xs font-semibold text-blue-600 mt-1">Messages</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                        <p className="text-2xl font-bold text-green-700">{service.documentsCount || 0}</p>
                        <p className="text-xs font-semibold text-green-600 mt-1">Documents</p>
                      </div>
                    </div>
                  </DrawerSection>
                </div>
              )}

              {/* MESSAGES TAB */}
              {activeTab === 'messages' && (
                <div className="flex flex-col h-full">
                  {/* Messages Thread */}
                  <ScrollArea className="flex-1 p-6">
                    {loadingMessages ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-20 w-full" />
                        ))}
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
                        <p className="text-sm font-semibold text-slate-600">No messages yet</p>
                        <p className="text-xs text-slate-500 mt-1">Start a conversation with the provider</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message._id}
                            className={cn(
                              'p-4 rounded-lg border-2',
                              message.senderType === 'CASE_MANAGER'
                                ? 'bg-blue-50 border-blue-200 ml-8'
                                : 'bg-slate-50 border-slate-200 mr-8'
                            )}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="text-sm font-bold text-slate-900">{message.senderName}</p>
                                <p className="text-xs text-slate-500">
                                  {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRaiseIssueFromMessage(message)}
                                className="h-7 px-2 text-xs text-orange-700 hover:text-orange-800 hover:bg-orange-50"
                              >
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Raise Issue
                              </Button>
                            </div>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{message.content}</p>
                            
                            {/* Linked Issue Badge */}
                            {message.linkedIssue && (
                              <div className="mt-3 pt-3 border-t border-slate-200">
                                <div className="flex items-center gap-2 text-xs">
                                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                                  <span className="text-slate-600">
                                    {message.isIssueTrigger ? 'Created issue:' : 'Linked to issue:'}
                                  </span>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 text-xs font-semibold text-red-700 hover:text-red-800"
                                    onClick={() => router.push('/case-manager/workspace')}
                                  >
                                    {message.linkedIssue.type} ({message.linkedIssue.status})
                                    <ArrowRight className="w-3 h-3 ml-1" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="shrink-0 border-t-2 border-slate-200 p-4 bg-white">
                    <div className="flex gap-2">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message to the provider..."
                        className="resize-none bg-white border-2"
                        rows={2}
                        disabled={sendingMessage}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendingMessage}
                        className="self-end"
                      >
                        {sendingMessage ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Press Enter to send, Shift+Enter for new line
                    </p>
                  </div>
                </div>
              )}

              {/* ISSUES TAB */}
              {activeTab === 'issues' && (
                <div className="p-6">
                  <div className="text-center py-12">
                    <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                    <p className="text-sm font-semibold text-slate-700 mb-2">
                      {service.activeIssuesCount || 0} Active Issue{service.activeIssuesCount === 1 ? '' : 's'}
                    </p>
                    <p className="text-xs text-slate-500 mb-4">
                      View and manage issues in the workspace
                    </p>
                    <Button
                      onClick={() => router.push('/case-manager/workspace')}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Open Workspace
                    </Button>
                  </div>
                </div>
              )}

              {/* DOCUMENTS TAB */}
              {activeTab === 'documents' && (
                <div className="p-6">
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-sm font-semibold text-slate-600">Document management coming soon</p>
                    <p className="text-xs text-slate-500 mt-1">{service.documentsCount || 0} documents</p>
                  </div>
                </div>
              )}
            </>
          )}
        </DrawerBody>
      </ProfessionalDrawer>

      {/* Create Issue Dialog */}
      {service && selectedMessage && (
        <CreateIssueDialog
          open={issueDialogOpen}
          onOpenChange={setIssueDialogOpen}
          serviceRelationshipId={service._id}
          clientId={service.clientId}
          clientName={service.clientName}
          providerName={service.providerName}
          serviceName={service.serviceName || service.serviceType}
          sourceMessageId={selectedMessage._id}
          initialComment={selectedMessage.content}
          onSuccess={() => {
            mutateService();
            mutateMessages();
            if (onRefresh) onRefresh();
            setSelectedMessage(null);
          }}
        />
      )}
    </>
  );
}

