'use client';

import { useState } from 'react';
import { ImportClientsModal } from '@/components/shared/ImportClientsModal';
import { ClientsTable } from '@/components/tables/ClientsTable';
import { useToast } from '@/hooks/use-toast';

export default function ProviderClientsPage() {
  const [showImportModal, setShowImportModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  const handleImportComplete = (importedCount: number) => {
    toast({
      title: "Import Successful",
      description: `${importedCount} clients have been imported to your ecosystem.`,
    });
    // Trigger table refresh
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="w-full max-w-none py-10 px-6 animate-fade-in">
      {/* Import Modal */}
      <ImportClientsModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
        onComplete={handleImportComplete}
        role="provider"
      />

      {/* Shared Clients Table */}
      <ClientsTable 
        role="provider"
        onImportClick={() => setShowImportModal(true)}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}