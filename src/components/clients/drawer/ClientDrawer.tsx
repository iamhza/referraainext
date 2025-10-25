'use client';

import React from 'react';
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
import { AlertCircle, User, Briefcase, FileText, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useClientDrawer } from './hooks/use-client-drawer';
import type { ClientDrawerProps } from './types';

export function ClientDrawer({ clientId, open, onClose }: ClientDrawerProps) {
  const { client, loading, error, activeTab, setActiveTab } = useClientDrawer(clientId);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto bg-white border-2">
        {loading && <LoadingSkeleton />}
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && client && (
          <>
            <SheetHeader className="space-y-3 pb-4 border-b">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <SheetTitle className="text-2xl font-bold">
                    {client.identity.firstName} {client.identity.lastName}
                  </SheetTitle>
                  <SheetDescription className="text-sm">
                    Client ID: {client.identity.externalId || client._id.slice(-8)}
                  </SheetDescription>
                </div>
                <Badge variant={client.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {client.status}
                </Badge>
              </div>
            </SheetHeader>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-6">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="profile" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </TabsTrigger>
                <TabsTrigger value="services" className="gap-2">
                  <Briefcase className="h-4 w-4" />
                  <span className="hidden sm:inline">Services</span>
                </TabsTrigger>
                <TabsTrigger value="documents" className="gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Documents</span>
                </TabsTrigger>
                <TabsTrigger value="timeline" className="gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">Timeline</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                <ProfilePlaceholder client={client} />
              </TabsContent>

              <TabsContent value="services" className="space-y-4">
                <ServicesPlaceholder clientId={client._id} />
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <DocumentsPlaceholder clientId={client._id} />
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4">
                <TimelinePlaceholder clientId={client._id} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Temporary placeholders - will be replaced in Phase B-E
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

function ProfilePlaceholder({ client }: { client: any }) {
  return (
    <div className="space-y-6">
      <div className="p-4 border rounded-lg">
        <h3 className="font-semibold mb-3">Contact Information</h3>
        <div className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Email:</span> {client.contact?.email || 'N/A'}</p>
          <p><span className="text-muted-foreground">Phone:</span> {client.contact?.phone || 'N/A'}</p>
          <p><span className="text-muted-foreground">Address:</span> {client.contact?.address?.line1}, {client.contact?.address?.city}, {client.contact?.address?.state} {client.contact?.address?.zip}</p>
        </div>
      </div>

      <div className="p-4 border rounded-lg">
        <h3 className="font-semibold mb-3">Insurance</h3>
        <div className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Type:</span> {client.insurance?.type || 'N/A'}</p>
          <p><span className="text-muted-foreground">Provider:</span> {client.insurance?.provider || 'N/A'}</p>
          <p><span className="text-muted-foreground">Number:</span> {client.insurance?.number || 'N/A'}</p>
        </div>
      </div>

      <div className="p-4 border rounded-lg">
        <h3 className="font-semibold mb-3">Clinical Information</h3>
        <div className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Primary Diagnosis:</span> {client.clinical?.primaryDiagnosis || 'N/A'}</p>
          <p><span className="text-muted-foreground">Mental Health Needs:</span> {client.clinical?.mentalHealthNeeds || 'N/A'}</p>
          <p><span className="text-muted-foreground">Physical Limitations:</span> {client.clinical?.physicalLimitations || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}

function ServicesPlaceholder({ clientId }: { clientId: string }) {
  return (
    <div className="p-6 border rounded-lg text-center text-muted-foreground">
      <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
      <p>Service relationships will be loaded here (Phase C)</p>
    </div>
  );
}

function DocumentsPlaceholder({ clientId }: { clientId: string }) {
  return (
    <div className="p-6 border rounded-lg text-center text-muted-foreground">
      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
      <p>Documents will be loaded here (Phase D)</p>
    </div>
  );
}

function TimelinePlaceholder({ clientId }: { clientId: string }) {
  return (
    <div className="p-6 border rounded-lg text-center text-muted-foreground">
      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
      <p>Timeline will be loaded here (Phase E)</p>
    </div>
  );
}

