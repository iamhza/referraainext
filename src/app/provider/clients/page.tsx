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
import { Eye, EyeOff, Copy, User, Upload, Users, Loader2, Database, RefreshCw, CheckCircle, AlertCircle, Clock, UserCheck, UserX, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ImportClientsModal } from '@/components/clients/ImportClientsModal';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Client as ClientType } from '@/types';

export default function ProviderClientsPage() {
  const [clients, setClients] = useState<ClientType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const [showIds, setShowIds] = useState<{ [key: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchClients() {
      setLoading(true);
      try {
        const res = await fetch('/api/providers/clients');
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
      description: `${importedCount} clients have been imported to your client roster.`,
    });
    
    // Refresh the client list
    setTimeout(() => {
      fetchClients();
    }, 500);
  };

  const renderTruncatedId = (id: string) => {
    if (!id) return null;
    return `${id.slice(0, 4)}...${id.slice(-4)}`;
  };

  // Helper for avatar/initials
  const getInitials = (first: string, last: string) => {
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
  };

  // Helper for proper name capitalization
  const capitalizeName = (name: string) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  // Function to refresh clients
  const fetchClients = async () => {
    try {
      const res = await fetch('/api/providers/clients');
      if (!res.ok) throw new Error('Failed to fetch clients');
      const data = await res.json();
      setClients(data.clients || []);
    } catch (err: any) {
      console.error('Error refreshing clients:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 animate-fade-in">
      {/* Import Modal */}
      <ImportClientsModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
        onComplete={handleImportComplete}
      />

      {/* Clean header with inline metrics */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-2xl font-semibold text-gray-900">
              My Clients
              {clients.length > 0 && (
                <span className="text-gray-500 font-normal ml-2">({clients.length} total)</span>
              )}
            </h1>
          </div>
          {clients.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                {clients.filter(c => c.status === 'ACTIVE_STABLE' || c.status === 'ACTIVE_FRUSTRATED').length} Active
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <Clock className="w-3 h-3 mr-1" />
                {clients.filter(c => c.status === 'UNPLACED_NEW' || !c.status).length} New
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setShowImportModal(true)}
            className="text-sm"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import Clients
          </Button>
          <Link href="/provider/clients/new">
            <Button size="sm" className="text-sm">
              <PlusIcon className="mr-2 h-4 w-4" />
              Add New Client
            </Button>
          </Link>
        </div>
      </div>

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
      
      {/* Clean Remote-style table container */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-fade-in">
        {loading ? (
          <div className="p-16 text-center text-gray-500">Loading clients...</div>
        ) : error ? (
          <div className="p-16 text-center text-red-500">{error}</div>
        ) : filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <User className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-medium text-gray-700 mb-2">No clients found</h2>
            <p className="text-gray-500 mb-6">Try adjusting your search or add a new client to get started.</p>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                className="px-4 py-2"
                onClick={() => setShowImportModal(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import Clients
              </Button>
              <Link href="/provider/clients/new">
                <Button className="px-4 py-2">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add New Client
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-left">
                    Name
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-left">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-left">
                    Profile
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-left">
                    Contact
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-left">
                    Location
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client, index) => (
                  <TableRow 
                    key={client._id} 
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                    }`}
                  >
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                          {getInitials(client.firstName, client.lastName)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {capitalizeName(client.firstName)} {capitalizeName(client.lastName)}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-xs text-gray-500 hover:text-gray-700 h-auto p-1 font-normal"
                              onClick={() => handleToggleId(client._id)}
                            >
                              {showIds[client._id] ? 'Hide ID' : 'Show ID'}
                            </Button>
                            {showIds[client._id] && (
                              <>
                                <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                  {client._id}
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-5 w-5 p-0 hover:bg-gray-200"
                                  onClick={() => handleCopyId(client._id)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                {copiedId === client._id && (
                                  <span className="text-xs text-green-600">Copied!</span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        client.status === 'ACTIVE_STABLE' 
                          ? 'bg-green-100 text-green-800'
                          : client.status === 'ACTIVE_FRUSTRATED'
                          ? 'bg-yellow-100 text-yellow-800'
                          : client.status === 'UNPLACED_NEW'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {client.status === 'ACTIVE_STABLE' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {client.status === 'ACTIVE_FRUSTRATED' && <AlertCircle className="w-3 h-3 mr-1" />}
                        {client.status === 'UNPLACED_NEW' && <Clock className="w-3 h-3 mr-1" />}
                        {!client.status && <AlertCircle className="w-3 h-3 mr-1" />}
                        {client.status === 'ACTIVE_STABLE' && 'Active'}
                        {client.status === 'ACTIVE_FRUSTRATED' && 'Needs Attention'}
                        {client.status === 'UNPLACED_NEW' && 'New'}
                        {!client.status && 'Unknown'}
                      </span>
                    </TableCell>
                    
                    <TableCell className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                        client.profileComplete 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {client.profileComplete ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <Clock className="w-3 h-3 mr-1" />
                        )}
                        {client.profileComplete ? 'Complete' : 'Incomplete'}
                      </span>
                    </TableCell>
                    
                    <TableCell className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {client.email && (
                          <div className="mb-1">{client.email}</div>
                        )}
                        {client.phone && (
                          <div className="text-gray-500">{client.phone}</div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {client.city && client.state ? (
                          `${client.city}, ${client.state}`
                        ) : (
                          <span className="text-gray-400">Not specified</span>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/provider/clients/${client._id}`}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          >
                            View
                          </Button>
                        </Link>
                        <Link href={`/provider/clients/${client._id}/edit`}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                          >
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Table footer with record count - Remote style */}
        {!loading && !error && filteredClients.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {filteredClients.length} record{filteredClients.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 