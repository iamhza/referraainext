'use client';

import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { ClientListCard } from './ClientListCard';
import { ClientSideDrawer } from '../clients/ClientSideDrawer';
import { AdvancedFilterBar, type AdvancedFilters, type SortOption } from './AdvancedFilterBar';
import { Loader2, LayoutList } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Client as ClientType } from '@/types.d';
import type { ActionType } from '@/types/actions';

interface DynamicListViewProps {
  onClientClick?: (client: ClientType) => void;
  onClientsLoaded?: (count: number, clients?: ClientType[]) => void;
  refreshTrigger?: number;
  viewDensity?: 'comfortable' | 'compact';
  className?: string;
  clientToOpen?: { clientId: string; actionId?: string } | null;
  onClientOpened?: () => void;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
};

export function DynamicListView({ 
  onClientClick, 
  onClientsLoaded,
  refreshTrigger = 0,
  viewDensity = 'comfortable',
  className = '',
  clientToOpen,
  onClientOpened
}: DynamicListViewProps) {
  
  // State
  const [filters, setFilters] = useState<AdvancedFilters>({
    search: '',
    serviceTypes: [],
    actionTypes: [],
    urgencyLevels: [],
    clientStatuses: [],
    providers: [],
    contextTypes: []
  });
  const [sortBy, setSortBy] = useState<SortOption>('urgency');
  const [selectedClient, setSelectedClient] = useState<ClientType | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Data fetching
  const { data: clientsData, mutate: mutateClients, isLoading } = useSWR('/api/clients', fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  });

  const clients: ClientType[] = clientsData?.clients || [];

  // Notify parent of clients loaded
  useEffect(() => {
    if (clients.length > 0 && onClientsLoaded) {
      onClientsLoaded(clients.length, clients);
    }
  }, [clients.length, onClientsLoaded, clients]);

  // Handle client to open from Priority Hub
  useEffect(() => {
    if (clientToOpen && clients.length > 0) {
      const client = clients.find(c => c._id === clientToOpen.clientId);
      if (client) {
        setSelectedClient(client);
        setIsDrawerOpen(true);
        console.log('📂 Opening client from Priority Hub:', client.firstName, client.lastName);
        if (clientToOpen.actionId) {
          console.log('   Action ID:', clientToOpen.actionId);
        }
      }
      if (onClientOpened) {
        onClientOpened();
      }
    }
  }, [clientToOpen, clients, onClientOpened]);

  // Advanced filtering logic
  const filteredAndSortedClients = useMemo(() => {
    let filtered = [...clients];
    
    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(client => 
        `${client.firstName} ${client.lastName}`.toLowerCase().includes(search) ||
        client.email?.toLowerCase().includes(search) ||
        client.phone?.includes(search) ||
        client.smartStatus?.text?.toLowerCase().includes(search) ||
        client.smartStatus?.serviceContext?.toLowerCase().includes(search)
      );
    }
    
    // Service type filter
    if (filters.serviceTypes.length > 0) {
      filtered = filtered.filter(client =>
        client.smartStatus?.serviceContext &&
        filters.serviceTypes.includes(client.smartStatus.serviceContext)
      );
    }
    
    // Action type filter
    if (filters.actionTypes.length > 0) {
      filtered = filtered.filter(client =>
        client.smartStatus?.actionType &&
        filters.actionTypes.includes(client.smartStatus.actionType as ActionType)
      );
    }
    
    // Urgency filter
    if (filters.urgencyLevels.length > 0) {
      filtered = filtered.filter(client => {
        const score = client.smartStatus?.urgencyScore || 0;
        return filters.urgencyLevels.some(level => {
          if (level === 'critical') return score >= 80;
          if (level === 'high') return score >= 50 && score < 80;
          if (level === 'normal') return score >= 20 && score < 50;
          if (level === 'stable') return score < 20;
          return false;
        });
      });
    }
    
    // Client status filter
    if (filters.clientStatuses.length > 0) {
      filtered = filtered.filter(client =>
        client.status && filters.clientStatuses.includes(client.status)
      );
    }
    
    // Sort logic
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'urgency':
          const scoreA = a.smartStatus?.urgencyScore || 0;
          const scoreB = b.smartStatus?.urgencyScore || 0;
          if (scoreB !== scoreA) return scoreB - scoreA;
          // Secondary: updated date
          return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
        
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        
        case 'updated':
          return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
        
        case 'actionCount':
          // Placeholder - would need to count actions from API
          const actionsA = a.smartStatus ? 1 : 0;
          const actionsB = b.smartStatus ? 1 : 0;
          return actionsB - actionsA;
        
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [clients, filters, sortBy]);


  // Handlers
  const handleClientClick = (client: ClientType) => {
    setSelectedClient(client);
    setIsDrawerOpen(true);
    onClientClick?.(client);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedClient(null), 300);
  };

  const handleClientUpdate = async () => {
    await mutateClients();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex flex-col h-full', className)}>
        {/* Filter bar skeleton */}
        <div className="shrink-0 mb-4">
          <div className="relative overflow-hidden rounded-xl border-2 border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            <div className="flex gap-3">
              <div className="h-9 w-64 bg-slate-200 rounded-lg animate-pulse" />
              <div className="h-9 w-32 bg-slate-100 rounded-lg animate-pulse" />
              <div className="h-9 w-32 bg-slate-100 rounded-lg animate-pulse" />
              <div className="h-9 w-32 bg-slate-100 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>

        {/* Client cards skeleton */}
        <div className="flex-1 overflow-y-auto space-y-2 px-1 animate-in fade-in duration-300">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="relative overflow-hidden rounded-xl border-2 border-slate-100 bg-gradient-to-br from-slate-50 to-white p-3">
              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
              
              <div className="flex gap-3 items-start">
                {/* Avatar skeleton */}
                <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse shrink-0" />
                
                {/* Content skeleton */}
                <div className="flex-1 space-y-2 min-w-0">
                  {/* Name and status */}
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                    <div className="h-5 w-20 bg-slate-100 rounded-full animate-pulse" />
                  </div>
                  
                  {/* Smart status bar */}
                  <div className="h-8 w-full bg-slate-100 rounded-lg animate-pulse" />
                  
                  {/* Details */}
                  <div className="flex gap-4">
                    <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
                    <div className="h-3 w-28 bg-slate-100 rounded animate-pulse" />
                  </div>
                </div>
                
                {/* Actions skeleton */}
                <div className="flex gap-2 shrink-0">
                  <div className="w-8 h-8 bg-slate-100 rounded-md animate-pulse" />
                  <div className="w-8 h-8 bg-slate-100 rounded-md animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (clients.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LayoutList className="w-12 h-12 mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No clients yet</h3>
          <p className="text-sm text-slate-600">
            Add your first client to get started with case management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      
      {/* Advanced Filter Bar - Full Width */}
      <div className="shrink-0 mb-4">
        <AdvancedFilterBar
          clients={clients}
          filters={filters}
          onFiltersChange={setFilters}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </div>

      {/* Two-Column Layout: List + Drawer */}
      <div className="flex-1 flex gap-6 min-h-0">
        
        {/* Left Column: Client List */}
        <div className={cn(
          'flex flex-col transition-all duration-300',
          isDrawerOpen ? 'w-[45%]' : 'w-full'
        )}>
          
          {/* List Header */}
          <div className="shrink-0 flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">
                {filteredAndSortedClients.length === clients.length
                  ? 'All Clients'
                  : `${filteredAndSortedClients.length} Clients`}
              </h2>
              <span className="text-xs text-slate-500">
                {sortBy === 'urgency' && '(by urgency)'}
                {sortBy === 'name' && '(A-Z)'}
                {sortBy === 'updated' && '(recently updated)'}
                {sortBy === 'actionCount' && '(by action count)'}
              </span>
            </div>
          </div>

          {/* Scrollable Client List */}
          <div className="flex-1 overflow-y-auto space-y-2 px-1">
            {filteredAndSortedClients.map((client) => (
              <ClientListCard
                key={client._id}
                client={client}
                onClick={() => handleClientClick(client)}
                viewDensity={viewDensity}
                isSelected={selectedClient?._id === client._id}
              />
            ))}
          </div>
        </div>

        {/* Right Column: Drawer Panel */}
        {isDrawerOpen && selectedClient && (
          <div className="w-[55%] flex flex-col border-l border-slate-200 pl-6 animate-in slide-in-from-right-8 duration-300">
            <ClientSideDrawer
              client={selectedClient}
              isOpen={isDrawerOpen}
              onClose={handleCloseDrawer}
              onUpdate={handleClientUpdate}
            />
          </div>
        )}
      </div>
    </div>
  );
}

