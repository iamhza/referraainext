'use client';

import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Database } from 'lucide-react';
// import { ImportClientsModal } from '@/components/shared/ImportClientsModal'; // DELETED
import { ClientsTable } from '@/components/tables/ClientsTable';
import { useToast } from '@/hooks/use-toast';

export default function ClientsPage() {
  const [showImportModal, setShowImportModal] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResults, setMigrationResults] = useState<any>(null);
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

  const handleMigrateReferrals = async () => {
    if (isMigrating) return;
    
    try {
      setIsMigrating(true);
      
      const response = await fetch('/api/case-manager/migrate-clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to migrate clients');
      }
      
      const data = await response.json();
      setMigrationResults(data.results);
      
      toast({
        title: 'Migration Complete',
        description: `Created ${data.results.created} clients from your referrals`,
      });
      
      // Migration results are shown automatically
    } catch (error: any) {
      console.error('Migration error:', error);
      toast({
        title: 'Migration Failed',
        description: error.message || 'An error occurred during migration',
        variant: 'destructive',
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="w-full max-w-none py-10 px-6 animate-fade-in">
      {/* Import Modal - DISABLED (ImportClientsModal deleted) */}
      {/* <ImportClientsModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
        onComplete={handleImportComplete}
        role="case_manager"
      /> */}

      {/* Migration Results Alert */}
      {migrationResults && (
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Database className="h-4 w-4 text-blue-600" />
          <AlertTitle>Migration Results</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1 text-sm">
              <p>Total referrals processed: {migrationResults.processed}</p>
              <p className="text-green-600 font-medium">New clients created: {migrationResults.created}</p>
              <p>Skipped (already exist): {migrationResults.skipped}</p>
              {migrationResults.errors > 0 && (
                <p className="text-red-600">Errors: {migrationResults.errors}</p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Shared Clients Table */}
      <ClientsTable 
        role="case_manager"
        onImportClick={() => setShowImportModal(true)}
        onMigrateClick={handleMigrateReferrals}
        isMigrating={isMigrating}
        migrationResults={migrationResults}
        showMigration={true}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}