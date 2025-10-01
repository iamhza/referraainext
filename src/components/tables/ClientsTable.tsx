'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, 
  EyeOff, 
  Copy, 
  User, 
  Upload, 
  Users, 
  Loader2, 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  UserCheck, 
  UserX, 
  Shield, 
  Search,
  MessageSquare,
  ExternalLink,
  PlusIcon,
  Trash2,
  Zap,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';
import type { Client as ClientType } from '@/types';

interface ClientsTableProps {
  role: 'case_manager' | 'provider';
  onImportClick?: () => void;
  onMigrateClick?: () => void;
  isMigrating?: boolean;
  migrationResults?: any;
  showMigration?: boolean;
  refreshTrigger?: number;
}

export function ClientsTable({ 
  role, 
  onImportClick, 
  onMigrateClick, 
  isMigrating = false, 
  migrationResults,
  showMigration = false,
  refreshTrigger = 0
}: ClientsTableProps) {
  const router = useRouter();
  const [clients, setClients] = useState<ClientType[]>([]);
  
  // Debug logging for clients state changes
  useEffect(() => {
    console.log('📊 Clients state changed:', clients.length, 'clients');
  }, [clients]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showIds, setShowIds] = useState<{ [key: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingClient, setDeletingClient] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [recentlyAddedClients, setRecentlyAddedClients] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Helper to normalize client name + DOB for matching
  const normalizeKey = (firstName: string, lastName: string, dateOfBirth: string) => {
    const f = (firstName || '').trim().toLowerCase();
    const l = (lastName || '').trim().toLowerCase();
    const d = (dateOfBirth || '').trim();
    return [f, l, d].filter(Boolean).join('|');
  };

  const fetchCurrentUser = async () => {
    try {
      const userResponse = await fetch('/api/auth/user');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser(userData.user);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchConnections = async () => {
    try {
      console.log('📡 Fetching connections...');
      setConnectionsLoading(true);
      const response = await fetch('/api/connections');
      if (!response.ok) {
        console.error('❌ Failed to fetch connections:', response.status, response.statusText);
        throw new Error('Failed to fetch connections');
      }
      
      const data = await response.json();
      console.log('📡 Connections data received:', data);
      setConnections(data.connections || []);
    } catch (error) {
      console.error('💥 Error fetching connections:', error);
    } finally {
      setConnectionsLoading(false);
    }
  };

  const handleActivateConnection = async (connection: any) => {
    try {
      console.log('🔄 Starting connection activation for:', connection);
      setActivating(connection.matchKey);
      
      // Get current user data first
      const userResponse = await fetch('/api/auth/user');
      if (!userResponse.ok) {
        console.error('❌ Failed to get user data:', userResponse.status, userResponse.statusText);
        throw new Error('Failed to get user data');
      }
      const userData = await userResponse.json();
      console.log('👤 User data:', userData);

      // For providers, we need to use the current user ID as providerId
      // For case managers, we use the current user ID as caseManagerId
      const userRole = userData.user.role || userData.user.user_metadata?.role;
      const payload = {
        clientMatchKey: connection.matchKey,
        caseManagerId: userRole === 'case_manager' ? userData.user.id : connection.caseManagerId,
        providerId: userRole === 'provider' ? userData.user.id : connection.providerId,
      };
      
      console.log('📤 Sending activation payload:', payload);

      const response = await fetch('/api/connections/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Activation failed:', response.status, response.statusText, errorData);
        throw new Error(`Failed to activate connection: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Activation result:', result);
      
      toast({
        title: "Connection Established",
        description: `Successfully connected with ${connection.clientName}. Workspace is now available.`,
      });
      
      // Refresh connections to show new status
      console.log('🔄 Refreshing connections...');
      await fetchConnections();
      
    } catch (error) {
      console.error('💥 Error activating connection:', error);
      toast({
        title: "Activation Failed",
        description: error instanceof Error ? error.message : "Failed to activate connection",
        variant: "destructive"
      });
    } finally {
      setActivating(null);
    }
  };

  const handleInitiateConnection = async (connection: any) => {
    try {
      console.log('🚀 Starting connection initiation for:', connection);
      setActivating(connection.matchKey);
      
      // Get current user data first
      const userResponse = await fetch('/api/auth/user');
      if (!userResponse.ok) {
        console.error('❌ Failed to get user data:', userResponse.status, userResponse.statusText);
        throw new Error('Failed to get user data');
      }
      const userData = await userResponse.json();
      console.log('👤 User data:', userData);

      // For initiation, we determine the payload based on user role
      const userRole = userData.user.role || userData.user.user_metadata?.role;
      const payload = {
        clientMatchKey: connection.matchKey,
        caseManagerId: userRole === 'case_manager' ? userData.user.id : connection.caseManagerId,
        providerId: userRole === 'provider' ? userData.user.id : connection.providerId,
      };
      
      console.log('📤 Sending initiation payload:', payload);

      const response = await fetch('/api/connections/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Initiation failed:', response.status, response.statusText, errorData);
        throw new Error(`Failed to initiate connection: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Initiation result:', result);
      
      toast({
        title: "Connection Request Sent",
        description: `Connection request sent for ${connection.clientName}. Waiting for acceptance.`,
      });
      
      // Refresh connections to show new status
      console.log('🔄 Refreshing connections...');
      await fetchConnections();
      
    } catch (error) {
      console.error('💥 Error initiating connection:', error);
      toast({
        title: "Connection Request Failed",
        description: error instanceof Error ? error.message : "Failed to send connection request",
        variant: "destructive"
      });
    } finally {
      setActivating(null);
    }
  };

  useEffect(() => {
    async function fetchClients() {
      setLoading(true);
      try {
        const apiUrl = role === 'provider' 
          ? '/api/clients?assignedToProvider=true'
          : '/api/clients';
        
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error('Failed to fetch clients');
        const data = await res.json();
        
        // Sort clients by newest first (createdAt or updatedAt)
        const sortedClients = (data.clients || []).sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || a.updatedAt || 0);
          const dateB = new Date(b.createdAt || b.updatedAt || 0);
          return dateB.getTime() - dateA.getTime(); // Newest first
        });
        
        // Detect recently added clients (added in last 2 minutes)
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        const newClientIds = new Set<string>(
          sortedClients
            .filter((client: any) => {
              const createdAt = new Date(client.createdAt || 0);
              return createdAt > twoMinutesAgo;
            })
            .map((client: any) => client._id as string)
        );
        
        setClients(sortedClients);
        setRecentlyAddedClients(newClientIds);
        
        // Debug: Log first few clients to see their structure
        console.log('📋 First 2 clients structure:', sortedClients.slice(0, 2).map((c: any) => ({
          id: c._id,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          hasEncryptedPHI: !!c.encryptedPHI
        })));
        
        // Remove highlighting after 60 seconds
        if (newClientIds.size > 0) {
          setTimeout(() => {
            setRecentlyAddedClients(new Set());
          }, 60000); // 60 seconds
        }
        
        // Fetch connections after clients are loaded
        fetchConnections();
        // Fetch current user data
        fetchCurrentUser();
      } catch (err: any) {
        setError(err.message || 'Failed to load clients');
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
    
    // Also refresh connections when refreshTrigger changes
    if (refreshTrigger > 0) {
      fetchConnections();
    }
  }, [role, refreshTrigger]);

  const filteredClients = clients.filter(
    (client) => {
      // If no search term, show all clients
      if (!search.trim()) return true;
      
      const searchLower = search.toLowerCase();
      
      // Check if any field matches the search term
      return (
        client.firstName?.toLowerCase().includes(searchLower) ||
        client.lastName?.toLowerCase().includes(searchLower) ||
        client.email?.toLowerCase().includes(searchLower) ||
        client.phone?.toLowerCase().includes(searchLower)
      );
    }
  );

  // Helper to get connection status for a client
  const getClientConnection = (client: ClientType) => {
    // Debug logging to see what fields the client has
    console.log(`🔍 getClientConnection called for client ${client._id}:`, {
      hasPendingConnection: client.hasPendingConnection,
      pendingConnectionId: client.pendingConnectionId,
      firstName: client.firstName,
      lastName: client.lastName,
      dateOfBirth: client.dateOfBirth
    });
    
    // First check if the backend has flagged this client as having a pending connection
    if (client.hasPendingConnection) {
      console.log(`🔍 Client ${client._id} has backend-flagged pending connection:`, {
        hasPendingConnection: client.hasPendingConnection,
        pendingConnectionId: client.pendingConnectionId,
        name: `${client.firstName} ${client.lastName}`
      });
      return {
        status: 'pending',
        initiatedByCurrentUser: true, // Provider initiated it
        isBackendFlag: true, // This is from backend flag, not connections API
        matchKey: 'backend-flagged'
      };
    }
    
    // Fallback to normal connection lookup
    if (!client.firstName || !client.lastName || !client.dateOfBirth) return null;
    
    const clientKey = normalizeKey(client.firstName, client.lastName, client.dateOfBirth);
    const connection = connections.find(conn => conn.matchKey === clientKey);
    
    console.log(`🔍 Checking connection for client ID ${client._id}:`, {
      clientKey: '[REDACTED-PHI]', // HIPAA COMPLIANT: Don't log names/DOB
      foundConnection: !!connection,
      connection,
      allConnections: connections
    });
    
    return connection;
  };

  const handleCreateReferral = (client: ClientType) => {
    const referralUrl = role === 'case_manager' ? '/case-manager/new-referral' : '/provider/referrals/new';
    // Use router.push to maintain session context
    router.push(`${referralUrl}?clientId=${client._id}`);
  };

  const handleToggleId = (id: string) => {
    setShowIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Handle individual client deletion
  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return;
    }

    setDeletingClient(clientId);
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete client');
      }

      // Remove from local state
      setClients(prev => prev.filter(client => client._id !== clientId));
      
      toast({
        title: "Client deleted",
        description: "The client has been successfully deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || 'Failed to delete client',
        variant: "destructive"
      });
    } finally {
      setDeletingClient(null);
    }
  };

  // Handle bulk deletion
  const handleBulkDelete = async () => {
    if (selectedClients.size === 0) {
      toast({
        title: "No clients selected",
        description: "Please select clients to delete",
        variant: "destructive"
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedClients.size} client(s)? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/clients/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          clientIds: Array.from(selectedClients) 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete clients');
      }

      const data = await response.json();

      // Remove deleted clients from local state
      setClients(prev => {
        const remainingClients = prev.filter(client => !selectedClients.has(client._id));
        console.log('📊 Clients after bulk delete:', remainingClients.length, 'remaining');
        return remainingClients;
      });
      setSelectedClients(new Set());
      
      toast({
        title: "Clients deleted",
        description: `Successfully deleted ${data.deletedCount} client(s).`,
      });
    } catch (error: any) {
      toast({
        title: "Bulk delete failed",
        description: error.message || 'Failed to delete clients',
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle select all/none
  const handleSelectAll = () => {
    if (selectedClients.size === filteredClients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(filteredClients.map(client => client._id)));
    }
  };

  // Handle individual client selection
  const handleSelectClient = (clientId: string) => {
    const newSelected = new Set(selectedClients);
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      newSelected.add(clientId);
    }
    setSelectedClients(newSelected);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: "Copied!",
        description: "Client ID copied to clipboard",
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    const first = (firstName || '').charAt(0);
    const last = (lastName || '').charAt(0);
    return `${first}${last}`.toUpperCase() || 'UC';
  };

  const capitalizeName = (name: string) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const refreshClients = async () => {
    setLoading(true);
    try {
      const apiUrl = role === 'provider' 
        ? '/api/clients?assignedToProvider=true'
        : '/api/org/clients'; // Use organization-scoped endpoint for case managers
      
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Failed to fetch clients');
      const data = await res.json();
      setClients(data.clients || []);
      
      // Also refresh connections
      fetchConnections();
      
      toast({
        title: "Refreshed",
        description: "Client list updated successfully",
      });
    } catch (err: any) {
      setError(err.message || 'Failed to refresh clients');
      toast({
        title: "Error",
        description: "Failed to refresh client list",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatsSummary = () => {
    if (clients.length === 0) return null;
    
    const stableCount = clients.filter(c => c.status === 'ACTIVE_STABLE').length;
    const frustratedCount = clients.filter(c => c.status === 'ACTIVE_FRUSTRATED').length;
    const newCount = clients.filter(c => c.status === 'UNPLACED_NEW' || !c.status).length;
    
    console.log('📊 Stats summary:', { total: clients.length, stable: stableCount, frustrated: frustratedCount, new: newCount });
    
    return (
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          {stableCount} Stable
        </span>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          {frustratedCount} Frustrated
        </span>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-accent-100 text-accent-800">
          <Clock className="w-3 h-3 mr-1" />
          {newCount} New
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with stats and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-gray-900">
            {role === 'case_manager' ? 'Manage Clients' : 'My Clients'}
          </h1>
          {getStatsSummary()}
        </div>
        
        <div className="flex items-center gap-2">
          {onImportClick && (
            <Button 
              variant="outline"
              size="sm"
              onClick={onImportClick}
              className="text-sm"
            >
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
          )}
          <Button 
            variant="outline"
            size="sm"
            onClick={refreshClients}
            className="text-sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search clients by name, email, or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 rounded-xl shadow-sm border-gray-200 focus:ring-2 focus:ring-secondary-500"
          />
        </div>
        
        {/* Bulk Actions for Case Manager and Provider */}
        {(role === 'case_manager' || role === 'provider') && selectedClients.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedClients.size} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-900 hover:bg-red-50 border-red-200"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </>
              )}
            </Button>
          </div>
        )}
      </div>
      
      {/* Table container */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-fade-in">
        {loading ? (
          <div className="p-16 text-center text-gray-500">Loading clients...</div>
        ) : error ? (
          <div className="p-16 text-center text-red-500">{error}</div>
        ) : filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <User className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-medium text-gray-700 mb-2">No clients found</h2>
            <p className="text-gray-500 mb-6">
              {clients.length === 0 
                ? (role === 'provider' 
                    ? "You don't have any clients assigned yet. Clients will appear here once they are assigned to you."
                    : "Try adjusting your search or add a new client to get started."
                  )
                : "Try adjusting your search to find specific clients."
              }
            </p>
            {clients.length === 0 && (
              <div className="flex gap-3">
                {showMigration && onMigrateClick && (
                  <Button 
                    onClick={onMigrateClick} 
                    disabled={isMigrating}
                    variant="outline"
                    className="px-4 py-2"
                  >
                    {isMigrating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Migrating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Migrate Referrals
                      </>
                    )}
                  </Button>
                )}
                {onImportClick && (
                  <Button 
                    variant="outline"
                    className="px-4 py-2"
                    onClick={onImportClick}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import Clients
                  </Button>
                )}
                {role === 'case_manager' && (
                  <Link href="/case-manager/clients/new">
                    <Button className="px-4 py-2">
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Add New Client
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  {(role === 'case_manager' || role === 'provider') && (
                    <TableHead className="text-xs font-medium text-gray-700 uppercase tracking-wider px-3 py-3 text-center w-[5%]">
                      <input
                        type="checkbox"
                        checked={selectedClients.size === filteredClients.length && filteredClients.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                  )}
                  <TableHead className={`text-xs font-medium text-gray-700 uppercase tracking-wider px-4 py-3 text-left ${role === 'case_manager' ? 'w-[25%]' : 'w-[30%]'}`}>
                    Name
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-700 uppercase tracking-wider px-3 py-3 text-left w-[15%]">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-700 uppercase tracking-wider px-3 py-3 text-left w-[20%] hidden lg:table-cell">
                    {role === 'provider' ? 'Case Manager' : 'Provider'}
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-700 uppercase tracking-wider px-3 py-3 text-left w-[15%] hidden lg:table-cell">
                    Service
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-700 uppercase tracking-wider px-3 py-3 text-left w-[12%] hidden xl:table-cell">
                    PMI
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-700 uppercase tracking-wider px-3 py-3 text-left w-[20%] hidden lg:table-cell">
                    Connection
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-700 uppercase tracking-wider px-3 py-3 text-left w-[15%] hidden xl:table-cell">
                    Profile
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-700 uppercase tracking-wider px-3 py-3 text-left w-[15%] hidden 2xl:table-cell">
                    Contact
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-700 uppercase tracking-wider px-3 py-3 text-left w-[15%] hidden 2xl:table-cell">
                    Location
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-700 uppercase tracking-wider px-4 py-3 text-right w-[20%]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client, index) => {
                  const isRecentlyAdded = recentlyAddedClients.has(client._id);
                  
                  return (
                    <TableRow 
                      key={client._id} 
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-all duration-500 ${
                        isRecentlyAdded 
                          ? 'bg-green-50 border-green-200 ring-2 ring-green-200 ring-opacity-50' // Accessible green highlight
                          : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      }`}
                  >
                    {/* Selection Checkbox */}
                    {(role === 'case_manager' || role === 'provider') && (
                      <TableCell className="px-3 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedClients.has(client._id)}
                          onChange={() => handleSelectClient(client._id)}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                    )}
                    
                    {/* Name Cell */}
                    <TableCell className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                          {getInitials(client.firstName || 'U', client.lastName || 'C')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {capitalizeName(client.firstName || 'Unknown')} {capitalizeName(client.lastName || 'Client')}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-xs text-gray-500 hover:text-gray-700 h-auto p-1 font-normal"
                              onClick={() => handleToggleId(client._id)}
                            >
                              {showIds[client._id] ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                              {showIds[client._id] ? 'Hide ID' : 'Show ID'}
                            </Button>
                            {showIds[client._id] && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-gray-500 hover:text-gray-700 h-auto p-1 font-normal"
                                onClick={() => copyToClipboard(client._id, client._id)}
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                {copiedId === client._id ? 'Copied!' : 'Copy'}
                              </Button>
                            )}
                          </div>
                          {showIds[client._id] && (
                            <div className="text-xs text-gray-400 mt-1 font-mono">
                              {client._id}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Status Cell */}
                    <TableCell className="px-3 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
                        client.status === 'ACTIVE_STABLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        client.status === 'ACTIVE_FRUSTRATED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        client.status === 'UNPLACED_NEW' ? 'bg-accent-50 text-accent-700 border-accent-200' :
                        'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        {client.status === 'ACTIVE_STABLE' && 'Stable'}
                        {client.status === 'ACTIVE_FRUSTRATED' && 'Frustrated'}
                        {client.status === 'UNPLACED_NEW' && 'New'}
                        {!client.status && 'Unknown'}
                      </span>
                    </TableCell>
                    
                    {/* Provider/Case Manager Cell */}
                    <TableCell className="px-3 py-4 hidden lg:table-cell">
                      {role === 'provider' ? (
                        // Show Case Manager info for providers
                        client.caseManagerId ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-accent-50 text-accent-700 border border-accent-200">
                              <UserCheck className="w-3 h-3 mr-1" />
                              <span className="truncate max-w-[140px]">
                                {client.caseManager?.name || 'Case Manager'}
                              </span>
                            </span>
                            {client.caseManager?.email && (
                              <span className="text-xs text-gray-500 mt-1 truncate max-w-[140px]">
                                {client.caseManager.email}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center text-xs text-gray-500">
                            <UserX className="w-3 h-3 mr-1" />
                            No case manager
                          </span>
                        )
                      ) : (
                        // Show Provider info for case managers
                        client.currentProvider ? (
                          <div className="flex flex-col">
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                              client.providerOnboarded 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {client.providerOnboarded ? (
                                <UserCheck className="w-3 h-3 mr-1" />
                              ) : (
                                <Shield className="w-3 h-3 mr-1" />
                              )}
                              <span className="truncate max-w-[140px]">
                                {client.providerInfo?.name || client.providerInfo?.organization || 'Provider'}
                              </span>
                            </span>
                            {client.providerInfo?.name && client.providerInfo?.organization && 
                             client.providerInfo.name !== client.providerInfo.organization && (
                              <span className="text-xs text-gray-500 mt-1 truncate max-w-[140px]">
                                {client.providerInfo.organization}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center text-xs text-gray-500">
                            <UserX className="w-3 h-3 mr-1" />
                            No provider assigned
                          </span>
                        )
                      )}
                    </TableCell>
                    
                    {/* Service Cell */}
                    <TableCell className="px-3 py-4 hidden lg:table-cell">
                      {client.serviceType || client.serviceType1 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                          <Zap className="w-3 h-3 mr-1" />
                          <span className="truncate max-w-[140px]">
                            {client.serviceType || client.serviceType1}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs text-gray-500">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          No service type
                        </span>
                      )}
                    </TableCell>

                    {/* PMI Cell */}
                    <TableCell className="px-3 py-4 hidden xl:table-cell">
                      {(client.pmi || client.pmiNumber) ? (
                        <span className="font-mono text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded border">
                          {client.pmi || client.pmiNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </TableCell>
                    
                    {/* Connection Status Cell */}
                    <TableCell className="px-3 py-4 hidden lg:table-cell">
                      {(() => {
                        const connection = getClientConnection(client);
                        

                        if (connectionsLoading) {
                          return (
                            <div className="flex items-center text-xs text-gray-500">
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Checking...
                            </div>
                          );
                        }
                        
                        if (!connection) {
                          return (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-sm text-red-600 font-medium">
                                Not Connected
                              </span>
                            </div>
                          );
                        }
                        
                        // Check if connection is fully established (both parties accepted)
                        if (connection.isActivated) {
                          return (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm border-2 border-green-200"></div>
                              <span className="text-sm font-semibold text-green-700">
                                Connected
                              </span>
                            </div>
                          );
                        }
                        
                        // Check if there's a pending connection that OTHERS initiated (show Accept button)
                        // Do NOT show Accept if this is a backend-flagged pending state from our own initiation
                        if (connection.status === 'pending' && !connection.initiatedByCurrentUser && !connection.isBackendFlag) {
                          return (
                            <Button
                              onClick={() => handleActivateConnection(connection)}
                              disabled={activating === connection.matchKey}
                              size="sm"
                              variant="outline"
                              className="h-7 px-3 text-xs border-orange-300 text-orange-700 hover:bg-orange-50"
                            >
                              {activating === connection.matchKey ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Accepting...
                                </>
                              ) : (
                                <>
                                  <UserPlus className="h-3 w-3 mr-1" />
                                  Accept Connection
                                </>
                              )}
                            </Button>
                          );
                        }
                        
                        // Check if there's a pending connection that YOU initiated (show Pending status)
                        if (connection.status === 'pending' && connection.initiatedByCurrentUser) {
                          return (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                              <span className="text-sm text-orange-600 font-medium">
                                Pending
                              </span>
                            </div>
                          );
                        }
                        
                        // Default state: ready to initiate connection
                        return (
                          <Button
                            onClick={() => handleInitiateConnection(connection)}
                            disabled={activating === connection.matchKey}
                            size="sm"
                            variant="default"
                            className="h-7 px-3 text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                          >
                            {activating === connection.matchKey ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Zap className="h-3 w-3 mr-1" />
                                Connect
                              </>
                            )}
                          </Button>
                        );
                      })()}
                    </TableCell>
                    
                    {/* Profile Cell */}
                    <TableCell className="px-3 py-4 hidden xl:table-cell">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${
                        client.profileComplete 
                          ? 'bg-secondary-100 text-secondary-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {client.profileComplete ? 'Complete' : 'Incomplete'}
                      </span>
                    </TableCell>
                    
                    {/* Contact Cell */}
                    <TableCell className="px-3 py-4 hidden 2xl:table-cell">
                      <div className="text-sm space-y-1">
                        {client.email && (
                          <div className="text-gray-900 truncate">{client.email}</div>
                        )}
                        {client.phone && (
                          <div className="text-gray-600">{client.phone}</div>
                        )}
                        {!client.email && !client.phone && (
                          <div className="text-gray-400">Not provided</div>
                        )}
                      </div>
                    </TableCell>
                    
                    {/* Location Cell */}
                    <TableCell className="px-3 py-4 hidden 2xl:table-cell">
                      <div className="text-sm text-gray-900">
                        {client.city && client.state ? (
                          <span className="truncate">{client.city}, {client.state}</span>
                        ) : (
                          <span className="text-gray-400">Not specified</span>
                        )}
                      </div>
                    </TableCell>
                    
                    {/* Actions Cell */}
                    <TableCell className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Workspace Button - only show if connected and has referralId */}
                        {(() => {
                          const connection = getClientConnection(client);
                          return connection && connection.isActivated && connection.referralId ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-xs bg-secondary-50 text-secondary-700 border-secondary-200 hover:bg-secondary-100 hover:text-secondary-800"
                              asChild
                            >
                              <a
                                href={role === 'case_manager' 
                                  ? `/case-manager/referrals/${connection.referralId}/workspace?clientId=${client._id}&returnTo=${encodeURIComponent(`/case-manager/clients`)}&highlightClient=${client._id}`
                                  : `/provider/referrals/${connection.referralId}/workspace?clientId=${client._id}&returnTo=${encodeURIComponent(`/provider/clients`)}&highlightClient=${client._id}`
                                }
                                target="_blank"
                                title="Open Workspace"
                              >
                                <MessageSquare className="w-3 h-3 mr-1" />
                                Workspace
                              </a>
                            </Button>
                          ) : null;
                        })()}
                        
                        {/* View Client Button */}
                        <Link href={role === 'case_manager' ? `/case-manager/clients/${client._id}` : `/provider/clients/${client._id}`}>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-3 text-xs text-gray-700 border-gray-200 hover:bg-gray-50"
                            title="View Client Details"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </Link>
                        
                        {/* Provider Actions */}
                        {role === 'provider' && (
                          <Link href={`/provider/referrals?clientId=${client._id}`}>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 px-3 text-xs text-secondary-700 border-secondary-200 hover:bg-secondary-50"
                              title="View Client Referrals"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Referrals
                            </Button>
                          </Link>
                        )}
                        
                        {/* Case Manager Actions */}
                        {role === 'case_manager' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleCreateReferral(client)}
                              className="h-8 px-3 text-xs text-green-700 border-green-200 hover:bg-green-50"
                              title="Create New Referral"
                            >
                              <PlusIcon className="w-3 h-3 mr-1" />
                              Referral
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeleteClient(client._id)}
                              disabled={deletingClient === client._id}
                              className="h-8 px-3 text-xs text-red-700 border-red-200 hover:bg-red-50"
                              title="Delete Client"
                            >
                              {deletingClient === client._id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3 mr-1" />
                              )}
                              {deletingClient === client._id ? 'Deleting...' : 'Delete'}
                            </Button>
                          </>
                        )}

                        {/* Provider Actions */}
                        {role === 'provider' && (
                          <>
                            {/* Show delete button for provider-created clients (imported OR manually added) */}
                            {currentUser && client.createdBy === currentUser.id && (!client.source || client.source !== 'created_from_referral') ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDeleteClient(client._id)}
                                disabled={deletingClient === client._id}
                                className="h-8 px-3 text-xs text-red-700 border-red-200 hover:bg-red-50"
                                title={`Delete Client (You ${client.source === 'csv_import' ? 'imported' : 'added'} this client)`}
                              >
                                {deletingClient === client._id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3 mr-1" />
                                )}
                                {deletingClient === client._id ? 'Deleting...' : 'Delete'}
                              </Button>
                            ) : (
                              // Show indicator for referral-assigned clients
                              client.source === 'created_from_referral' && (
                                <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded flex items-center">
                                  <Shield className="h-3 w-3 mr-1" />
                                  From Referral
                                </span>
                              )
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Table footer with record count */}
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
