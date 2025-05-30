'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusIcon, DownloadIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Copy, User, Upload, Users, Loader2, Database, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ImportClientsModal } from '@/components/clients/ImportClientsModal';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Client as ClientType } from '@/types';

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const [showIds, setShowIds] = useState<{ [key: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResults, setMigrationResults] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchClients() {
      setLoading(true);
      try {
        const res = await fetch('/api/clients');
        if (!res.ok) throw new Error('Failed to fetch clients');
        const data = await res.json();
        setClients(data.clients || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load clients');
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, []);

  const filteredClients = clients.filter(
    (client) =>
      client.firstName.toLowerCase().includes(search.toLowerCase()) ||
      client.lastName.toLowerCase().includes(search.toLowerCase()) ||
      client.email?.toLowerCase().includes(search.toLowerCase()) ||
      client.phone?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateReferral = (client: ClientType) => {
    // Create params object first to handle the address
    const paramsObj: Record<string, string> = {
      clientId: client._id,
      firstName: client.firstName,
      lastName: client.lastName,
      dateOfBirth: client.dateOfBirth,
      email: client.email || '',
      phone: client.phone,
      city: client.city,
      state: client.state,
      zipCode: client.zipCode,
      preferredContactMethod: client.preferredContactMethod,
      // Add insurance fields if needed
    };
    
    // Handle the address which can be a string or an object
    if (typeof client.address === 'string') {
      paramsObj.address = client.address;
    } else if (client.address) {
      // If it's an object, convert to a string format or handle specific fields
      const addressParts = [
        client.address.street,
        client.address.city,
        client.address.state,
        client.address.zipCode
      ].filter(Boolean);
      
      if (addressParts.length > 0) {
        paramsObj.address = addressParts.join(', ');
      }
    }
    
    const params = new URLSearchParams(paramsObj).toString();
    router.push(`/case-manager/new-referral?${params}`);
  };

  const handleToggleId = (id: string) => {
    setShowIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleImportComplete = (importedCount: number) => {
    toast({
      title: "Import Successful",
      description: `${importedCount} clients have been imported to your ecosystem.`,
    });
    
    // Refresh the client list
    setTimeout(() => {
      fetchClients();
    }, 500);
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
      
      // Refresh the client list
      fetchClients();
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

  const renderTruncatedId = (id: string) => {
    if (!id) return null;
    return `${id.slice(0, 4)}...${id.slice(-4)}`;
  };

  // Helper for avatar/initials
  const getInitials = (first: string, last: string) => {
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
  };

  // Function to refresh clients
  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      if (!res.ok) throw new Error('Failed to fetch clients');
      const data = await res.json();
      setClients(data.clients || []);
    } catch (err: any) {
      console.error('Error refreshing clients:', err);
    }
  };

  return (
    <div className="w-full mx-auto py-10 px-4 animate-fade-in">
      {/* Import Modal */}
      <ImportClientsModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
        onComplete={handleImportComplete}
      />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-1">Clients</h1>
          <p className="text-lg text-gray-500">Manage your clients and their referrals</p>
        </div>
        <div className="flex gap-3">
          <Button 
            size="lg" 
            variant="outline"
            className="px-6 py-2 text-base font-semibold rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={handleMigrateReferrals}
            disabled={isMigrating}
          >
            {isMigrating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Migrating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-5 w-5" />
                Migrate Referrals to Clients
              </>
            )}
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="px-6 py-2 text-base font-semibold rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={() => setShowImportModal(true)}
          >
            <Upload className="mr-2 h-5 w-5" />
            Import Clients
          </Button>
          <Link href="/case-manager/clients/new">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg px-6 py-2 text-base font-semibold rounded-xl"
            >
              <PlusIcon className="mr-2 h-5 w-5" />
              Add New Client
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Migration Results */}
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
      
      {/* Client Ecosystem Stats */}
      {clients.length > 0 && (
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-4 flex items-center gap-3 flex-1 md:flex-auto">
            <div className="bg-blue-100 h-10 w-10 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Clients</div>
              <div className="text-2xl font-bold text-gray-900">{clients.length}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-green-100 p-4 flex items-center gap-3 flex-1 md:flex-auto">
            <div className="bg-green-100 h-10 w-10 rounded-full flex items-center justify-center">
              <Badge className="h-5 w-5 text-green-600 bg-green-100 p-1" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Active Clients</div>
              <div className="text-2xl font-bold text-gray-900">
                {clients.filter(c => c.status === 'ACTIVE_STABLE' || c.status === 'ACTIVE_FRUSTRATED').length}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-4 flex items-center gap-3 flex-1 md:flex-auto">
            <div className="bg-amber-100 h-10 w-10 rounded-full flex items-center justify-center">
              <Badge className="h-5 w-5 text-amber-600 bg-amber-100 p-1" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Unplaced Clients</div>
              <div className="text-2xl font-bold text-gray-900">
                {clients.filter(c => c.status === 'UNPLACED_NEW' || !c.status).length}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <Input
          type="text"
          placeholder="Search clients by name, email, or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full md:w-96 rounded-xl shadow-sm border-gray-200 focus:ring-2 focus:ring-blue-500"
        />
        {/* Future: Add filter dropdowns here */}
      </div>
      
      <div className="rounded-2xl shadow-xl bg-white/90 border border-gray-100 p-0 md:p-6 animate-fade-in relative w-full">
        {loading ? (
          <div className="p-16 text-center text-muted-foreground text-lg">Loading clients...</div>
        ) : error ? (
          <div className="p-16 text-center text-red-500 text-lg">{error}</div>
        ) : filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <User className="h-16 w-16 text-blue-200 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">No clients found</h2>
            <p className="text-gray-500 mb-6">Try adjusting your search or add a new client to get started.</p>
            <div className="flex gap-4">
              <Button 
                onClick={handleMigrateReferrals} 
                disabled={isMigrating}
                size="lg" 
                variant="outline"
                className="px-6 py-2 text-base font-semibold rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                {isMigrating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Migrate Referrals to Clients
                  </>
                )}
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="px-6 py-2 text-base font-semibold rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() => setShowImportModal(true)}
              >
                <Upload className="mr-2 h-5 w-5" />
                Import Clients
              </Button>
              <Link href="/case-manager/clients/new">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg px-6 py-2 text-base font-semibold rounded-xl"
                >
                  <PlusIcon className="mr-2 h-5 w-5" />
                  Add New Client
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl w-full">
            <Table className="w-full text-[16px] font-medium">
              <TableHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
                <TableRow>
                  <TableHead className="text-lg text-gray-700 font-bold">Client ID</TableHead>
                  <TableHead className="text-lg text-gray-700 font-bold">Name</TableHead>
                  <TableHead className="text-lg text-gray-700 font-bold">Email</TableHead>
                  <TableHead className="text-lg text-gray-700 font-bold">Phone</TableHead>
                  <TableHead className="text-lg text-gray-700 font-bold">Date of Birth</TableHead>
                  <TableHead className="text-lg text-gray-700 font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client._id} className="transition-all duration-200 hover:bg-blue-50/60 hover:shadow-md group">
                  <TableCell>
                      <span className="font-mono text-base bg-gray-100 px-3 py-1 rounded-lg">
                      {showIds[client._id] ? client._id : renderTruncatedId(client._id)}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => handleToggleId(client._id)}>
                        {showIds[client._id] ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleCopyId(client._id)}>
                        <Copy className="h-5 w-5" />
                    </Button>
                      {copiedId === client._id && <span className="text-sm text-green-600 ml-2">Copied!</span>}
                  </TableCell>
                  <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-lg shadow-sm">
                          {getInitials(client.firstName, client.lastName)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-lg">{client.firstName} {client.lastName}</div>
                          <div className="text-gray-500 text-sm">{client.city}, {client.state}</div>
                        </div>
                      </div>
                  </TableCell>
                    <TableCell className="text-gray-700 text-base">{client.email}</TableCell>
                    <TableCell className="text-gray-700 text-base">{client.phone}</TableCell>
                    <TableCell className="text-gray-700 text-base">{client.dateOfBirth}</TableCell>
                  <TableCell className="space-x-2">
                    <Link href={`/case-manager/clients/${client._id}`}>
                        <Button variant="outline" size="sm" className="rounded-lg border-blue-500 text-blue-700 hover:bg-blue-50 hover:text-blue-900 transition-colors font-semibold">
                        View Details
                      </Button>
                    </Link>
                      <Button variant="secondary" size="sm" className="rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors font-semibold" onClick={() => handleCreateReferral(client)}>
                      Create Referral
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        )}
      </div>
    </div>
  );
} 