'use client';

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, FileText, MessageSquare, AlertTriangle, Info } from 'lucide-react';
import { CreateIssueDialog } from '@/components/issues/CreateIssueDialog';
import { useServiceDetails } from './hooks/use-service-details';
import { OverviewTab } from './OverviewTab';
import { MessagesTab } from './MessagesTab';
import type { ServiceDrawerProps, ServiceTab, ServiceMessage } from './types';

export function ServiceDrawer({ 
  serviceRelationshipId, 
  isOpen, 
  onClose, 
  onRefresh 
}: ServiceDrawerProps) {
  const { service, loading, error, refetch } = useServiceDetails(serviceRelationshipId);
  const [activeTab, setActiveTab] = useState<ServiceTab>('overview');
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ServiceMessage | null>(null);

  const handleIssueCreated = () => {
    refetch();
    if (onRefresh) onRefresh();
  };

  const handleCreateIssueFromMessage = (message: ServiceMessage) => {
    setSelectedMessage(message);
    setIssueDialogOpen(true);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto bg-white border-2">
          {loading && <LoadingSkeleton />}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && !error && service && (
            <>
              <SheetHeader className="space-y-3 pb-4 border-b">
                <div>
                  <SheetTitle className="text-2xl font-bold">
                    {service.providerName}
                  </SheetTitle>
                  <SheetDescription className="text-sm mt-1">
                    {service.serviceName || service.serviceType} • {service.clientName}
                  </SheetDescription>
                </div>
              </SheetHeader>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ServiceTab)} className="mt-6">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="overview" className="gap-2">
                    <Info className="h-4 w-4" />
                    <span className="hidden sm:inline">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span className="hidden sm:inline">Messages</span>
                  </TabsTrigger>
                  <TabsTrigger value="issues" className="gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="hidden sm:inline">Issues</span>
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Documents</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <OverviewTab 
                    service={service} 
                    onRaiseIssue={() => setIssueDialogOpen(true)}
                  />
                </TabsContent>

                <TabsContent value="messages" className="h-[calc(100vh-250px)]">
                  <MessagesTab 
                    serviceRelationshipId={service._id}
                    onCreateIssueFromMessage={handleCreateIssueFromMessage}
                  />
                </TabsContent>

                <TabsContent value="issues" className="space-y-4">
                  <IssuesPlaceholder serviceId={service._id} />
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  <DocumentsPlaceholder serviceId={service._id} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create Issue Dialog */}
      {service && (
        <CreateIssueDialog
          open={issueDialogOpen}
          onOpenChange={setIssueDialogOpen}
          serviceRelationshipId={service._id}
          clientId={service.clientId}
          clientName={service.clientName}
          providerName={service.providerName}
          serviceName={service.serviceName || service.serviceType}
          onSuccess={handleIssueCreated}
          prefilledMessage={selectedMessage?.content}
        />
      )}
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

function IssuesPlaceholder({ serviceId }: { serviceId: string }) {
  return (
    <div className="p-6 border-2 border-dashed rounded-lg text-center text-muted-foreground">
      <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
      <p>Issues list will be implemented here</p>
    </div>
  );
}

function DocumentsPlaceholder({ serviceId }: { serviceId: string }) {
  return (
    <div className="p-6 border-2 border-dashed rounded-lg text-center text-muted-foreground">
      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
      <p>Documents list will be implemented here</p>
    </div>
  );
}

