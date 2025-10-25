'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useClientRefresh } from '@/hooks/use-client-refresh';
import { ClientTableView } from '@/components/dashboard/ClientTableView';
import { CleanTopBar } from '@/components/layout/CleanTopBar';
import { AddClientModal } from '@/components/modals/AddClientModal';
import type { Client as ClientType } from '@/types';

export default function CaseManagerBoardPage() {
  const { user } = useAuth();
  const { refreshTrigger, triggerRefresh } = useClientRefresh();
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [selectedClient, setSelectedClient] = useState<ClientType | null>(null);
  const [totalClients, setTotalClients] = useState(0);
  const [viewDensity, setViewDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [clientToOpen, setClientToOpen] = useState<{ clientId: string; actionId?: string } | null>(null);
  const [allClients, setAllClients] = useState<ClientType[]>([]);

  // Handle client card clicks
  const handleClientClick = (client: ClientType) => {
    console.log('Client clicked:', client);
    setSelectedClient(client);
    // TODO: Open client drawer in Phase 2
    // For now, we could navigate to the detail page as fallback
    // window.open(`/case-manager/clients/${client._id}`, '_blank');
  };

  // Handle refresh
  const handleRefresh = () => {
    // Trigger global client refresh
    window.location.reload();
  };

  // Handle bulk update requests
  const handleBulkUpdate = () => {
    console.log('Bulk update requested for selected clients');
    // This will be implemented when we add client selection in future phases
  };

  // Update total clients count (this would be passed from BoardView)
  const handleClientsLoaded = (count: number) => {
    setTotalClients(count);
  };

  // Handle add client modal
  const handleAddClient = () => {
    setIsAddClientModalOpen(true);
  };

  const handleCloseAddClientModal = () => {
    setIsAddClientModalOpen(false);
  };

  const handleClientAdded = () => {
    // The useClientRefresh hook will automatically trigger a refresh
    // No need to manually reload since BoardView listens to refreshTrigger
  };

  const handleReferralCreated = () => {
    // Trigger refresh when referral is created
    triggerRefresh();
  };

  // Handle client selection from Priority Hub
  const handleClientSelectFromPriorityHub = (clientId: string, actionId?: string) => {
    setClientToOpen({ clientId, actionId });
  };

  // Handler to clear clientToOpen after BoardView processes it
  const handleClientOpened = () => {
    setClientToOpen(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50">
      {/* Clean Top Bar */}
      <CleanTopBar
        totalClients={totalClients}
        onRefresh={handleRefresh}
        viewDensity={viewDensity}
        onViewDensityChange={setViewDensity}
        onAddClient={handleAddClient}
        selectedClient={selectedClient}
        onReferralCreated={handleReferralCreated}
        onClientSelect={handleClientSelectFromPriorityHub}
      />

      {/* Client Table View - takes full remaining height */}
      <div className="flex-1 h-[calc(100vh-80px)] px-6">
        <ClientTableView
          onClientsLoaded={(count, clients) => {
            setTotalClients(count);
            if (clients) setAllClients(clients);
          }}
          refreshTrigger={refreshTrigger}
          className="h-full"
          clientToOpen={clientToOpen}
          onClientOpened={handleClientOpened}
        />
      </div>

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={isAddClientModalOpen}
        onClose={handleCloseAddClientModal}
        onClientAdded={handleClientAdded}
      />
    </div>
  );
}
