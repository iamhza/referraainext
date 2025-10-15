'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Search, 
  Filter, 
  ArrowLeft, 
  AlertCircle,
  Users,
  Clock,
  Loader2,
  Plus,
  ChevronRight,
  Circle
} from 'lucide-react';
import Link from 'next/link';
import { ClientSideDrawer } from '@/components/clients/ClientSideDrawer';
import { ReferralPanel } from '@/components/referrals/ReferralPanel';
import { AddClientModal } from '@/components/modals/AddClientModal';
import { useToast } from '@/hooks/use-toast';
import { enhanceClientsData } from '@/lib/client-data-enhancer';
import { capitalizeName } from '@/lib/formatting';
import type { Client as ClientType } from '@/types.d';
import type { Action } from '@/types/actions';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

// Smart fetcher for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
};

type FilterType = 'needs-action' | 'all' | 'recent' | 'stable';
type ViewMode = 'actions' | 'client-timeline';

export default function CaseloadHubPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Data fetching
  const { data: clientsData, error: clientsError, mutate: mutateClients, isLoading: clientsLoading } = useSWR('/api/clients', fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });
  
  const { data: referralsData, error: referralsError } = useSWR('/api/referrals', fetcher, {
    revalidateOnFocus: true,
  });
  
  const { data: connectionsDataRaw, error: connectionsError, mutate: mutateConnections } = useSWR('/api/connections', fetcher, {
    revalidateOnFocus: true,
  });
  
  // State
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('needs-action');
  const [selectedClient, setSelectedClient] = useState<ClientType | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('actions');
  const [searchQuery, setSearchQuery] = useState('');
  const [isReferralPanelOpen, setIsReferralPanelOpen] = useState(false);
  const [referralClient, setReferralClient] = useState<ClientType | null>(null);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [selectedClientActions, setSelectedClientActions] = useState<Action[]>([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);

  // Enhance clients with computed fields
  const clients = useMemo(() => {
    if (!clientsData?.clients) return [];
    
    const rawClients = clientsData.clients;
    const allReferrals = referralsData?.referrals || [];
    const connectionsData = connectionsDataRaw?.connections || [];
    const allActivities: any[] = [];
    
    const enhancedClients = enhanceClientsData(
      rawClients,
      allReferrals,
      connectionsData,
      allActivities
    );
    
    return enhancedClients.map(client => ({
      ...client,
      activeReferrals: client.referralSummary?.active || 0,
      pendingReferrals: client.referralSummary?.pending || 0,
      unreadMessages: 0
    }));
  }, [clientsData, referralsData, connectionsDataRaw]);

  // Fetch actions for a specific client
  const fetchClientActions = async (clientId: string) => {
    setActionsLoading(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/actions`);
      if (response.ok) {
        const data = await response.json();
        setSelectedClientActions(data.actions || []);
      }
    } catch (error) {
      console.error('Error fetching actions:', error);
    } finally {
      setActionsLoading(false);
    }
  };

  // Compute urgency for each client (from actions - will implement later)
  const clientsWithUrgency = useMemo(() => {
    return clients.map(client => {
      // TODO: Fetch actions per client and compute urgency
      // For now, use simple heuristics
      const urgentCount = (client.pendingReferrals || 0) + (client.activeReferrals || 0);
      const status: 'urgent' | 'pending' | 'stable' = 
        urgentCount > 2 ? 'urgent' :
        urgentCount > 0 ? 'pending' :
        'stable';
      
      return {
        ...client,
        urgencyStatus: status,
        urgentCount
      };
    });
  }, [clients]);

  // Filter and sort clients
  const filteredClients = useMemo(() => {
    let filtered = clientsWithUrgency;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(client =>
        `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (selectedFilter === 'needs-action') {
      filtered = filtered.filter(client => client.urgencyStatus === 'urgent' || client.urgencyStatus === 'pending');
    } else if (selectedFilter === 'stable') {
      filtered = filtered.filter(client => client.urgencyStatus === 'stable');
    } else if (selectedFilter === 'recent') {
      filtered = [...filtered].sort((a, b) => 
        new Date(b.updatedAt || b.createdAt || 0).getTime() - 
        new Date(a.updatedAt || a.createdAt || 0).getTime()
      );
    }

    // Sort by urgency
    return filtered.sort((a, b) => {
      const urgencyOrder = { urgent: 0, pending: 1, stable: 2 };
      return urgencyOrder[a.urgencyStatus] - urgencyOrder[b.urgencyStatus];
    });
  }, [clientsWithUrgency, searchQuery, selectedFilter]);

  // Update connections state
  useEffect(() => {
    if (connectionsDataRaw?.connections) {
      setConnections(connectionsDataRaw.connections);
    }
  }, [connectionsDataRaw]);

  // Handle client click - Open drawer
  const handleClientClick = (client: ClientType) => {
    setSelectedClient(client);
    setIsDrawerOpen(true);
    fetchClientActions(client._id);
  };

  // Handle back to actions view
  const handleBackToActions = () => {
    setSelectedClient(null);
    setViewMode('actions');
    setSelectedClientActions([]);
  };

  // Handle create referral
  const handleCreateReferral = (client: ClientType) => {
    setReferralClient(client);
    setIsReferralPanelOpen(true);
  };

  const getStatusIcon = (status: 'urgent' | 'pending' | 'stable') => {
    switch (status) {
      case 'urgent':
        return <Circle className="h-2.5 w-2.5 fill-red-500 text-red-500" />;
      case 'pending':
        return <Circle className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />;
      case 'stable':
        return <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500" />;
    }
  };

  const getStatusColor = (status: 'urgent' | 'pending' | 'stable') => {
    switch (status) {
      case 'urgent':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      case 'stable':
        return 'text-green-600';
    }
  };

  if (clientsLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading caseload...</p>
        </div>
      </div>
    );
  }

  if (clientsError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load</h3>
          <p className="text-gray-600">{clientsError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/case-manager">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Board
              </Button>
            </Link>
            <div className="border-l border-gray-300 h-6" />
            <h1 className="text-xl font-semibold text-gray-900">Caseload Hub</h1>
          </div>
          <Button onClick={() => setIsAddClientModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Main Content: Three-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL: Caseload Hub */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-200 space-y-3 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Filter Buttons */}
            <div className="space-y-1">
              <Button
                variant={selectedFilter === 'needs-action' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  setSelectedFilter('needs-action');
                  handleBackToActions();
                }}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Needs Action ({clientsWithUrgency.filter(c => c.urgencyStatus === 'urgent' || c.urgencyStatus === 'pending').length})
              </Button>
              
              <Button
                variant={selectedFilter === 'all' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  setSelectedFilter('all');
                  handleBackToActions();
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                All Clients ({clients.length})
              </Button>
              
              <Button
                variant={selectedFilter === 'recent' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  setSelectedFilter('recent');
                  handleBackToActions();
                }}
              >
                <Clock className="h-4 w-4 mr-2" />
                Recently Updated
              </Button>

              <Button
                variant={selectedFilter === 'stable' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  setSelectedFilter('stable');
                  handleBackToActions();
                }}
              >
                <Circle className="h-4 w-4 mr-2 fill-green-500 text-green-500" />
                Stable ({clientsWithUrgency.filter(c => c.urgencyStatus === 'stable').length})
              </Button>
            </div>
          </div>

          {/* Client List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {filteredClients.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No clients found</p>
                </div>
              ) : (
                filteredClients.map((client) => (
                  <button
                    key={client._id}
                    onClick={() => handleClientClick(client)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-all",
                      selectedClient?._id === client._id
                        ? "bg-blue-50 border border-blue-200 shadow-sm"
                        : "hover:bg-gray-50 border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(client.urgencyStatus)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {capitalizeName(client.firstName)} {capitalizeName(client.lastName)}
                        </div>
                        {client.updatedAt && (
                          <div className="text-xs text-gray-500 truncate">
                            Updated {formatDistanceToNow(new Date(client.updatedAt), { addSuffix: true })}
                          </div>
                        )}
                      </div>
                      {client.urgentCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {client.urgentCount}
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* CENTER PANEL: Overview Feed */}
        <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedFilter === 'needs-action' && '🔴 Needs Action'}
                {selectedFilter === 'all' && 'All Clients Overview'}
                {selectedFilter === 'recent' && 'Recently Updated'}
                {selectedFilter === 'stable' && '✅ Stable Clients'}
              </h2>
              <p className="text-sm text-gray-600">
                {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4 max-w-3xl">
              {filteredClients.length === 0 ? (
                <Card className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Clients Found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery ? 'Try adjusting your search.' : 'Add your first client to get started.'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setIsAddClientModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Client
                    </Button>
                  )}
                </Card>
              ) : (
                filteredClients.map((client) => (
                  <Card
                    key={client._id}
                    className={cn(
                      "p-5 cursor-pointer transition-all hover:shadow-md border-l-4",
                      client.urgencyStatus === 'urgent' && "border-l-red-500 bg-red-50/50",
                      client.urgencyStatus === 'pending' && "border-l-yellow-500 bg-yellow-50/50",
                      client.urgencyStatus === 'stable' && "border-l-green-500"
                    )}
                    onClick={() => handleClientClick(client)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(client.urgencyStatus)}
                          <h3 className="font-semibold text-gray-900">
                            {capitalizeName(client.firstName)} {capitalizeName(client.lastName)}
                          </h3>
                          {client.urgentCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {client.urgentCount} action{client.urgentCount !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          {client.phone && <p>📞 {client.phone}</p>}
                          {client.pmiNumber && <p className="font-mono">PMI: {client.pmiNumber}</p>}
                          {client.updatedAt && (
                            <p className="text-xs text-gray-500">
                              Updated {formatDistanceToNow(new Date(client.updatedAt), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Client Side Drawer - Slides in from right */}
      {selectedClient && (
        <ClientSideDrawer
          client={selectedClient as any}
          connections={connections}
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedClient(null);
          }}
          onRequestUpdate={(clientId: string) => {
            // Handle update request
            console.log('Update requested for:', clientId);
          }}
          onViewProfile={() => {
            // Handle view profile
            console.log('View profile for:', selectedClient._id);
          }}
        />
      )}

      {/* Referral Panel */}
      <ReferralPanel
        isOpen={isReferralPanelOpen}
        onClose={() => {
          setIsReferralPanelOpen(false);
          setReferralClient(null);
        }}
        selectedClient={referralClient}
        onSuccess={() => {
          mutateClients();
          toast({
            title: "Referral Created",
            description: `Successfully created referral for ${referralClient?.firstName} ${referralClient?.lastName}`,
          });
        }}
      />

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        onClientAdded={() => {
          mutateClients();
          mutateConnections();
        }}
      />
    </div>
  );
}

