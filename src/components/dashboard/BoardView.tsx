'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { ClientCard } from './ClientCard';
import { ClientListItem } from './ClientListItem';
import { DroppableColumn } from './DroppableColumn';
import { ClientSideDrawer } from '../clients/ClientSideDrawer';
import { ClientDetailsPanel } from '../clients/ClientDetailsPanel';
import { ReferralPanel } from '../referrals/ReferralPanel';
import { AddClientModal } from '../modals/AddClientModal';
import { DeleteClientModal } from '../modals/DeleteClientModal';
import { FilterBar, type FilterType, type FilterCounts } from './FilterBar';
import { PriorityPanel } from './PriorityPanel';
import { useToast } from '@/hooks/use-toast';
import { useResponsiveKanban } from '@/hooks/useResponsiveKanban';
import { enhanceClientsData } from '@/lib/client-data-enhancer';
import { capitalizeName } from '@/lib/formatting';
import { Loader2, Users } from 'lucide-react';
import type { Client as ClientType, ClientStatus } from '@/types.d';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
  closestCenter,
  closestCorners,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
// import { restrictToWindowEdges } from '@dnd-kit/modifiers';

interface BoardViewProps {
  onClientClick?: (client: ClientType) => void;
  onRequestUpdate?: (client: ClientType) => void;
  onClientsLoaded?: (count: number, clients?: ClientType[]) => void;
  refreshTrigger?: number;
  viewDensity?: 'comfortable' | 'compact';
  className?: string;
}

// Smart fetcher for SWR - handles all data fetching logic
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
};

export function BoardView({ 
  onClientClick, 
  onRequestUpdate, 
  onClientsLoaded,
  refreshTrigger = 0,
  viewDensity = 'comfortable',
  className = '' 
}: BoardViewProps) {
  
  // Simplified responsive hook - CSS Grid handles all sizing now!
  const { 
    shouldCompactCards, 
    shouldHideDetails
  } = useResponsiveKanban();
  const router = useRouter();
  
  // SWR for smart caching and auto-revalidation
  const { data: clientsData, error: clientsError, mutate: mutateClients, isLoading: clientsLoading } = useSWR('/api/clients', fetcher, {
    revalidateOnFocus: true,  // Refresh when tab refocuses
    revalidateOnReconnect: true,  // Refresh when internet reconnects
    dedupingInterval: 2000,  // Prevent duplicate requests within 2s
  });
  
  const { data: referralsData, error: referralsError } = useSWR('/api/referrals', fetcher, {
    revalidateOnFocus: true,
  });
  
  const { data: connectionsDataRaw, error: connectionsError, mutate: mutateConnections } = useSWR('/api/connections', fetcher, {
    revalidateOnFocus: true,
  });
  
  const [connections, setConnections] = useState<any[]>([]);
  const [localClients, setLocalClients] = useState<ClientType[]>([]); // Local state for drag operations
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [overId, setOverId] = useState<string | null>(null);
  const [originalClientsBeforeDrag, setOriginalClientsBeforeDrag] = useState<ClientType[] | null>(null);
  const [draggedClientOriginalStatus, setDraggedClientOriginalStatus] = useState<string | null>(null); // Track original status before drag
  const [selectedClient, setSelectedClient] = useState<ClientType | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false); // Track if showing details panel vs drawer
  const [isReferralPanelOpen, setIsReferralPanelOpen] = useState(false);
  const [referralClient, setReferralClient] = useState<ClientType | null>(null);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [customOrder, setCustomOrder] = useState<{[status: string]: string[]}>({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showPriorityPanel, setShowPriorityPanel] = useState(true);
  const { toast } = useToast();

  // Helper function to get status display info for toasts
  const getStatusDisplayInfo = (status: string) => {
    switch (status) {
      case 'UNPLACED':
      case 'UNPLACED_NEW': // Legacy support
        return { label: 'Unplaced', color: 'red' };
      case 'REFERRAL_SENT':
        return { label: 'Referral Sent', color: 'blue' };
      case 'IN_PROCESS':
        return { label: 'In Process', color: 'purple' };
      case 'ACTIVE_STABLE':
        return { label: 'Active', color: 'green' };
      case 'ACTIVE_NEEDS_ATTENTION':
      case 'ACTIVE_FRUSTRATED': // Legacy support
        return { label: 'Needs Attention', color: 'yellow' };
      case 'CLOSED_DISCHARGED':
        return { label: 'Closed', color: 'gray' };
      default:
        return { label: status.replace('_', ' '), color: 'gray' };
    }
  };

  // Handle client card clicks to open side drawer
  const handleClientClick = (client: ClientType) => {
    setSelectedClient(client);
    setIsDrawerOpen(true);
    
    // Also call the original onClientClick if provided
    if (onClientClick) {
      onClientClick(client);
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedClient(null);
    setShowDetailsPanel(false);
  };

  const handleViewProfile = () => {
    setShowDetailsPanel(true);
  };

  const handleSideDrawerRequestUpdate = (clientId: string) => {
    const client = clients.find(c => c._id === clientId);
    if (client) {
      handleRequestUpdate(client);
    }
  };

  const handleCreateReferral = (client: ClientType) => {
    // Open referral panel instead of navigating
    setReferralClient(client);
    setIsReferralPanelOpen(true);
    
    // Close drawer if open
    if (isDrawerOpen) {
      setIsDrawerOpen(false);
      setSelectedClient(null);
    }
  };

  const handleCloseReferralPanel = () => {
    setIsReferralPanelOpen(false);
    setReferralClient(null);
  };

  const handleReferralSuccess = () => {
    // Refresh clients data using SWR
    mutateClients();
    
    // Show success toast
    toast({
      title: "Referral Created",
      description: `Successfully created referral for ${referralClient?.firstName} ${referralClient?.lastName}`,
      duration: 5000,
    });
  };

  const handleAddClient = () => {
    setIsAddClientModalOpen(true);
  };

  const handleCloseAddClientModal = () => {
    setIsAddClientModalOpen(false);
  };

  const handleClientAdded = () => {
    // Refresh data using SWR
    mutateClients();
    mutateConnections();
  };



  // Optimized drag sensors for better visual feedback
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Shorter distance for more responsive dragging
        tolerance: 3,
        delay: 100, // Faster activation
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Computed clients from SWR data - enhanced and enriched
  const clients = useMemo(() => {
    if (!clientsData?.clients) return [];
    
    const rawClients = clientsData.clients;
    const allReferrals = referralsData?.referrals || [];
    const connectionsData = connectionsDataRaw?.connections || [];
    const allActivities: any[] = []; // TODO: Implement activity fetching if needed
    
    // Enhance clients with computed fields
    const enhancedClients = enhanceClientsData(
      rawClients,
      allReferrals,
      connectionsData,
      allActivities
    );
    
    // Maintain backward compatibility with existing fields
    return enhancedClients.map(client => ({
      ...client,
      activeReferrals: client.referralSummary?.active || 0,
      pendingReferrals: client.referralSummary?.pending || 0,
      unreadMessages: 0
    }));
  }, [clientsData, referralsData, connectionsDataRaw]);
  
  // Sync localClients with SWR data when not dragging
  useEffect(() => {
    if (!isDragging && clients.length > 0) {
      setLocalClients(clients);
    }
  }, [clients, isDragging]);
  
  // Update connections state when data changes
  useEffect(() => {
    if (connectionsDataRaw?.connections) {
      setConnections(connectionsDataRaw.connections);
    }
  }, [connectionsDataRaw]);
  
  // Notify parent of client count
  useEffect(() => {
    if (clients.length > 0 && onClientsLoaded) {
      onClientsLoaded(clients.length, clients);
    }
  }, [clients.length, onClientsLoaded, clients]);

  // Load custom order from localStorage on mount
  useEffect(() => {
    const savedOrders = localStorage.getItem('clientOrder');
    if (savedOrders) {
      try {
        setCustomOrder(JSON.parse(savedOrders));
      } catch (error) {
        console.error('Error loading saved client order:', error);
      }
    }
  }, []);

  // Handle refresh trigger - SWR mutate for smart revalidation
  useEffect(() => {
    if (refreshTrigger > 0) {
      mutateClients();
      mutateConnections();
    }
  }, [refreshTrigger, mutateClients, mutateConnections]);

  // Filter clients based on active filter
  const filteredClients = useMemo(() => {
    if (activeFilter === 'all') return localClients;
    
    const now = new Date();
    return localClients.filter(client => {
      const status = client.smartStatus;
      
      switch (activeFilter) {
        case 'overdue':
          return status?.color === 'red';
        case 'due_today':
          return status?.dueDate && 
                 new Date(status.dueDate).toDateString() === now.toDateString();
        case 'this_week': {
          const dueDate = status?.dueDate ? new Date(status.dueDate) : null;
          return dueDate && dueDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        }
        case 'needs_docs':
          return status?.actionType === 'request_documentation';
        case 'no_activity': {
          const lastUpdate = client.updatedAt ? new Date(client.updatedAt) : null;
          return lastUpdate && (now.getTime() - lastUpdate.getTime()) > 30 * 24 * 60 * 60 * 1000;
        }
        default:
          return true;
      }
    });
  }, [localClients, activeFilter]);

  // Compute filter counts for FilterBar
  const filterCounts: FilterCounts = useMemo(() => {
    const now = new Date();
    return {
      all: clients.length,
      overdue: clients.filter(c => c.smartStatus?.color === 'red').length,
      dueToday: clients.filter(c => {
        const dueDate = c.smartStatus?.dueDate;
        return dueDate && new Date(dueDate).toDateString() === now.toDateString();
      }).length,
      thisWeek: clients.filter(c => {
        const dueDate = c.smartStatus?.dueDate;
        return dueDate && new Date(dueDate) <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      }).length,
      needsDocs: clients.filter(c => c.smartStatus?.actionType === 'request_documentation').length,
      noActivity: clients.filter(c => {
        const lastUpdate = c.updatedAt ? new Date(c.updatedAt) : null;
        return lastUpdate && (now.getTime() - lastUpdate.getTime()) > 30 * 24 * 60 * 60 * 1000;
      }).length,
    };
  }, [clients]);

  // Get most urgent client for priority panel
  const mostUrgentClient = useMemo(() => {
    const clientsWithStatus = clients.filter(c => c.smartStatus);
    if (clientsWithStatus.length === 0) return null;
    
    return clientsWithStatus.sort((a, b) => {
      return (b.smartStatus?.urgencyScore || 0) - (a.smartStatus?.urgencyScore || 0);
    })[0];
  }, [clients]);

  // Group clients by status with custom ordering (use filteredClients for filtering)
  const clientsByStatus = useMemo(() => {
    const groups = {
      UNPLACED: [] as ClientType[],
      REFERRAL_SENT: [] as ClientType[],
      IN_PROCESS: [] as ClientType[],
      ACTIVE_STABLE: [] as ClientType[],
      ACTIVE_NEEDS_ATTENTION: [] as ClientType[],
      CLOSED_DISCHARGED: [] as ClientType[]
    };

    filteredClients.forEach(client => {
      // Map old statuses to new ones for backward compatibility
      let status = client.status || 'UNPLACED';
      
      // Handle legacy status mapping
      if (status === 'UNPLACED_NEW') status = 'UNPLACED';
      if (status === 'ACTIVE_FRUSTRATED') status = 'ACTIVE_NEEDS_ATTENTION';
      
      if (status in groups) {
        groups[status as keyof typeof groups].push(client);
      } else {
        // Default unknown statuses to UNPLACED
        groups.UNPLACED.push(client);
      }
    });

    // Apply custom ordering if it exists, otherwise sort by URGENCY FIRST, then date
    Object.keys(groups).forEach(status => {
      const statusKey = status as keyof typeof groups;
      const customOrderForStatus = customOrder[status];
      
      if (customOrderForStatus && customOrderForStatus.length > 0) {
        // Sort by custom order
        groups[statusKey].sort((a, b) => {
          const aIndex = customOrderForStatus.indexOf(a._id!);
          const bIndex = customOrderForStatus.indexOf(b._id!);
          
          // If both items are in custom order, sort by their position
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
          }
          
          // If only one item is in custom order, it goes first
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;
          
          // If neither is in custom order, sort by urgency first, then date
          const urgencyA = a.smartStatus?.urgencyScore || 0;
          const urgencyB = b.smartStatus?.urgencyScore || 0;
          if (urgencyA !== urgencyB) return urgencyB - urgencyA;
          
          const dateA = new Date(a.updatedAt || a.createdAt || 0);
          const dateB = new Date(b.updatedAt || b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
      } else {
        // DEFAULT SORT: Urgency first (urgent cards float to top), then date
        groups[statusKey].sort((a, b) => {
          // Sort by urgency score first (highest first)
          const urgencyA = a.smartStatus?.urgencyScore || 0;
          const urgencyB = b.smartStatus?.urgencyScore || 0;
          if (urgencyA !== urgencyB) {
            return urgencyB - urgencyA;
          }
          
          // Then by date (most recent first)
          const dateA = new Date(a.updatedAt || a.createdAt || 0);
          const dateB = new Date(b.updatedAt || b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
      }
    });

    return groups;
  }, [filteredClients, customOrder]);

  // Handle request update for a client
  const handleRequestUpdate = async (client: ClientType) => {
    try {
      // Call the real API to request update for this specific client
      const response = await fetch(`/api/clients/${client._id}/request-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: 'follow_up_required',
          priority: 'normal',
          message: `Hi! Could you please provide an update on ${client.firstName} ${client.lastName}'s current progress and status?`
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send update request');
      }
      
      toast({
        title: "Update Requested",
        description: result.message,
        action: result.workspaceUrl ? (
          <button 
            className="text-sm underline"
            onClick={() => window.open(result.workspaceUrl, '_blank')}
          >
            View Workspace
          </button>
        ) : undefined
      });
      
      if (onRequestUpdate) {
        onRequestUpdate(client);
      }
    } catch (error) {
      console.error('Error requesting update:', error);
      toast({
        title: "Request Failed",
        description: error instanceof Error ? error.message : "Failed to send update request",
        variant: "destructive"
      });
    }
  };

  // Handle delete client
  const handleDeleteClient = useCallback((clientId: string) => {
    const client = localClients.find(c => c._id === clientId);
    if (client) {
      setClientToDelete(client);
      setDeleteModalOpen(true);
    }
  }, [localClients]);

  const handleConfirmDelete = useCallback(async () => {
    if (!clientToDelete) return;

    setIsDeleting(true);
    
    const deletedClientName = `${clientToDelete.firstName} ${clientToDelete.lastName}`;
    const deletedClientId = clientToDelete._id;
    
    try {
      // OPTIMISTIC UPDATE: Remove from UI immediately
      await mutateClients(
        async (currentData: any) => {
          const response = await fetch(`/api/clients/${deletedClientId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete client');
          }

          // Return updated data with client removed
          if (currentData?.clients) {
            return {
              ...currentData,
              clients: currentData.clients.filter((c: any) => c._id !== deletedClientId)
            };
          }
          
          return currentData;
        },
        {
          // Optimistic data - remove immediately in UI
          optimisticData: (currentData: any) => {
            if (!currentData?.clients) return currentData;
            return {
              ...currentData,
              clients: currentData.clients.filter((c: any) => c._id !== deletedClientId)
            };
          },
          rollbackOnError: true,
          populateCache: true,
          revalidate: false
        }
      );

      // Close modal and reset state
      setDeleteModalOpen(false);
      setClientToDelete(null);
      setIsDeleting(false);
      
      // Close drawer if the deleted client was selected
      if (selectedClient?._id === deletedClientId) {
        setSelectedClient(null);
        setIsDrawerOpen(false);
      }

      toast({
        title: "Client Deleted",
        description: `${deletedClientName} has been deleted successfully.`,
      });

    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete client",
        variant: "destructive"
      });
      setIsDeleting(false);
    }
  }, [clientToDelete, selectedClient, toast, mutateClients]);

  const handleCancelDelete = useCallback(() => {
    setDeleteModalOpen(false);
    setClientToDelete(null);
  }, []);

  // Handle priority panel action completion
  const handleCompleteAction = useCallback(async (clientId: string, actionId: string) => {
    try {
      const response = await fetch(`/api/actions/${actionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete action');
      }

      toast({
        title: "Action Completed",
        description: "Successfully marked action as complete",
      });

      // Refresh clients to update smart status
      mutateClients();
    } catch (error) {
      console.error('Error completing action:', error);
      toast({
        title: "Error",
        description: "Failed to complete action",
        variant: "destructive",
      });
    }
  }, [toast, mutateClients]);

  const handleSkipPriorityAction = useCallback(() => {
    // For now, just hide the panel temporarily
    // In a full implementation, could track skipped actions
    setShowPriorityPanel(false);
    setTimeout(() => setShowPriorityPanel(true), 5000); // Show again after 5 seconds
  }, []);

  // Fast collision detection for immediate response
  const customCollisionDetection = (args: any) => {
    // Use pointerWithin for immediate response when hovering
    const pointerCollisions = pointerWithin(args);
    
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    
    // Fallback to center detection for edge cases
    return closestCenter(args);
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeClient = localClients.find(c => c._id === active.id);
    
    setActiveId(active.id as string);
    setIsDragging(true);
    setOverId(null);
    
    // Store ORIGINAL status before any drag operations modify it
    if (activeClient) {
      setDraggedClientOriginalStatus(activeClient.status || null);
      console.log('🎯 Drag start - Original status:', activeClient.status);
    }
    
    // Store original clients state for potential reversion
    setOriginalClientsBeforeDrag([...localClients]);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setIsDragging(false);
    setOverId(null);
    setDraggedClientOriginalStatus(null); // Clear original status
    
    // Revert to original state if drag was cancelled
    if (originalClientsBeforeDrag) {
      setLocalClients(originalClientsBeforeDrag);
      setOriginalClientsBeforeDrag(null);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    setOverId(over ? over.id as string : null);
    
    if (!over || !active) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Find the dragged client
    const activeClient = localClients.find(client => client._id === activeId);
    if (!activeClient) return;
    
    // Check if we're over a specific client
    const overClient = localClients.find(client => client._id === overId);
    
    // Check if we're over a column container
    let targetStatus = null;
    if (overId === 'UNPLACED_NEW' || overId.includes('UNPLACED')) {
      targetStatus = 'UNPLACED_NEW';
    } else if (overId === 'ACTIVE_STABLE' || overId.includes('STABLE')) {
      targetStatus = 'ACTIVE_STABLE';
    } else if (overId === 'ACTIVE_FRUSTRATED' || overId.includes('FRUSTRATED')) {
      targetStatus = 'ACTIVE_FRUSTRATED';
    } else if (overClient) {
      targetStatus = overClient.status;
    }
    
    // Handle cross-column visual feedback (more generous)
    if (targetStatus && activeClient.status !== targetStatus) {
      setLocalClients((currentClients: ClientType[]) => {
        const newClients = [...currentClients];
        
        // Remove the dragged item from its current position
        const activeIndex = newClients.findIndex(client => client._id === activeId);
        if (activeIndex === -1) return currentClients;
        
        const [draggedItem] = newClients.splice(activeIndex, 1);
        
        // Update status for visual feedback
        draggedItem.status = targetStatus as ClientStatus;
        
        // Determine insertion position
        if (overClient) {
          // Insert before the specific client we're over
          const overIndex = newClients.findIndex(client => client._id === overId);
          if (overIndex !== -1) {
            newClients.splice(overIndex, 0, draggedItem);
          } else {
            // Add to end of target column if client not found
            const targetClients = newClients.filter(c => c.status === targetStatus);
            const insertIndex = newClients.length - targetClients.length;
            newClients.splice(insertIndex, 0, draggedItem);
          }
        } else {
          // Dropping on column container - add to end
          newClients.push(draggedItem);
        }
        
        return newClients;
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setIsDragging(false);
    setOverId(null);

    if (!over) {
      console.log('No drop target');
      setDraggedClientOriginalStatus(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the client being dragged
    const draggedClient = localClients.find(client => client._id === activeId);
    if (!draggedClient) {
      console.error('Dragged client not found:', activeId);
      setDraggedClientOriginalStatus(null);
      return;
    }

    // Use ORIGINAL status (before drag operations modified it)
    const originalStatus = draggedClientOriginalStatus || draggedClient.status;
    
    console.log('Drag end:', { 
      activeId, 
      overId, 
      draggedClient: draggedClient.firstName,
      originalStatus: originalStatus,
      currentStatus: draggedClient.status 
    });

    // Check if we're dropping on another client
    const overClient = localClients.find(client => client._id === overId);
    
    if (overClient) {
      console.log('Dropping on client:', overClient.firstName, 'Status:', overClient.status);
      console.log('🔍 Comparison:', { originalStatus, overClientStatus: overClient.status, isSameColumn: originalStatus === overClient.status });
      
      if (originalStatus === overClient.status && activeId !== overId) {
        // Same column reordering
        console.log('Same column reorder');
        handleReorderWithinColumn(activeId, overId, draggedClient);
      } else if (originalStatus !== overClient.status) {
        // Cross-column move
        console.log('Cross-column move to client');
        handleCrossColumnMove(activeId, overId, draggedClient, overClient);
      }
      setDraggedClientOriginalStatus(null);
      return;
    }

    // Check if we're dropping on a column container
    console.log('Checking column drop for overId:', overId);

    // Handle column drops - determine the new status
    let newStatus: string | null = null;
    
    if (overId === 'UNPLACED' || overId.includes('UNPLACED')) {
      newStatus = 'UNPLACED';
    } else if (overId === 'REFERRAL_SENT' || overId.includes('REFERRAL_SENT')) {
      newStatus = 'REFERRAL_SENT';
    } else if (overId === 'IN_PROCESS' || overId.includes('IN_PROCESS')) {
      newStatus = 'IN_PROCESS';
    } else if (overId === 'ACTIVE_STABLE' || overId.includes('STABLE')) {
      newStatus = 'ACTIVE_STABLE';
    } else if (overId === 'ACTIVE_NEEDS_ATTENTION' || overId.includes('NEEDS_ATTENTION')) {
      newStatus = 'ACTIVE_NEEDS_ATTENTION';
    } else if (overId === 'CLOSED_DISCHARGED' || overId.includes('CLOSED')) {
      newStatus = 'CLOSED_DISCHARGED';
    }

    if (newStatus && originalStatus !== newStatus) {
      console.log('Column drop - status change from', originalStatus, 'to', newStatus);
      handleStatusChange(activeId, newStatus, draggedClient);
    } else {
      console.log('No status change needed or unknown drop target');
    }
    
    // Clear the original status tracking
    setDraggedClientOriginalStatus(null);
  };

  // Production-grade reordering within the same column
  const handleReorderWithinColumn = async (activeId: string, overId: string, draggedClient: any) => {
    console.log('Reordering within column:', { activeId, overId, status: draggedClient.status });
    
    const activeIndex = localClients.findIndex(client => client._id === activeId);
    const overIndex = localClients.findIndex(client => client._id === overId);
    
    console.log('Indices:', { activeIndex, overIndex, totalClients: localClients.length });
    
    // Safety checks
    if (activeIndex === -1 || overIndex === -1) {
      console.error('Invalid indices for reordering:', { activeIndex, overIndex });
      toast({
        title: "Reorder Failed",
        description: "Could not find card positions. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }
    
    if (activeIndex === overIndex) {
      console.log('Same position, no reordering needed');
      return;
    }
    
    // Store original state for rollback
    const originalClients = [...localClients];
    
    try {
      // Reorder the full clients array
      const reorderedClients = arrayMove(localClients, activeIndex, overIndex);
      
      // Update clients state immediately for instant UI feedback - batched update
      setLocalClients(reorderedClients);
      
      // Create custom order for this status
      const status = draggedClient.status || 'UNPLACED_NEW';
      const statusClients = reorderedClients.filter(client => (client.status || 'UNPLACED_NEW') === status);
      const newOrderForStatus = statusClients.map(client => client._id!);
      
      // Update custom order state
      setCustomOrder(prev => ({
        ...prev,
        [status]: newOrderForStatus
      }));
      
      // Save to localStorage for persistence
      try {
        const savedOrders = JSON.parse(localStorage.getItem('clientOrder') || '{}');
        savedOrders[status] = newOrderForStatus;
        localStorage.setItem('clientOrder', JSON.stringify(savedOrders));
        console.log('✅ Saved new order for', status, ':', newOrderForStatus);
      } catch (error) {
        console.error('Error saving client order:', error);
        // Don't fail the whole operation for localStorage errors
      }
      
      const statusInfo = getStatusDisplayInfo(draggedClient.status);
      toast({
        title: "Card Reordered",
        description: `${draggedClient.firstName} ${draggedClient.lastName} reordered within ${statusInfo.label}`,
      });
      
    } catch (error) {
      console.error('Error during reordering:', error);
      
      // Rollback to original state
      setLocalClients(originalClients);
      
      toast({
        title: "Reorder Failed", 
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle cross-column moves with OPTIMISTIC UPDATES
  const handleCrossColumnMove = async (activeId: string, overId: string, draggedClient: any, overClient: any) => {
    console.log('Cross-column move:', { 
      activeId, 
      overId, 
      from: draggedClient.status, 
      to: overClient.status,
      insertBefore: overClient.firstName 
    });
    
    // Keep the ORIGINAL database status (don't normalize)
    const newStatus = overClient.status;
    
    console.log('💾 Saving with original DB status:', newStatus);
    const statusInfo = getStatusDisplayInfo(newStatus);
    
    // Clear the original clients backup since we're committing the change
    setOriginalClientsBeforeDrag(null);

    try {
      // OPTIMISTIC UPDATE: Update UI immediately, then confirm with server
      await mutateClients(
        async (currentData: any) => {
          // Update the client status on the server
          console.log('📤 [CrossColumn] Sending PATCH:', { clientId: activeId, newStatus });
          const response = await fetch(`/api/clients/${activeId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
          });

          console.log('📥 [CrossColumn] Response:', { status: response.status, ok: response.ok });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ [CrossColumn] PATCH failed:', errorData);
            throw new Error(errorData.error || 'Failed to update client status');
          }

          const result = await response.json();
          console.log('✅ [CrossColumn] PATCH success:', result);
          
          // Return updated data with the new client from server
          if (result.client && currentData?.clients) {
            return {
              ...currentData,
              clients: currentData.clients.map((c: any) => 
                c._id === result.client._id ? result.client : c
              )
            };
          }
          
          return currentData;
        },
        {
          // Optimistic data - update immediately in UI
          optimisticData: (currentData: any) => {
            if (!currentData?.clients) return currentData;
            return {
              ...currentData,
              clients: currentData.clients.map((c: any) => 
                c._id === activeId ? { ...c, status: newStatus } : c
              )
            };
          },
          rollbackOnError: true,  // Auto-revert if server fails
          populateCache: true,     // Use server response to update cache
          revalidate: false        // Don't revalidate (we have fresh data from server)
        }
      );
      
      console.log('🎉 [CrossColumn] Showing success toast');
      toast({
        title: "Client Moved",
        description: `${draggedClient.firstName} ${draggedClient.lastName} moved to ${statusInfo.label}`,
      });

    } catch (error) {
      console.error('❌ [CrossColumn] Error:', error);
      
      toast({
        title: "Move Failed",
        description: error instanceof Error ? error.message : "Failed to move client. Changes reverted.",
        variant: "destructive",
      });
    }
  };

  // Separate function for status changes with OPTIMISTIC UPDATES
  const handleStatusChange = async (activeId: string, newStatus: string, draggedClient: any) => {
    console.log('Status change:', { from: draggedClient.status, to: newStatus });

    const statusInfo = getStatusDisplayInfo(newStatus);
    const oldStatusInfo = getStatusDisplayInfo(draggedClient.status);

    // Update custom order for the new column (add to beginning)
    setCustomOrder(prev => {
      const newOrder = { ...prev };
      
      // Remove from old column order if it exists
      Object.keys(newOrder).forEach(status => {
        if (newOrder[status]) {
          newOrder[status] = newOrder[status].filter(id => id !== activeId);
        }
      });
      
      // Add to beginning of new column order
      if (newOrder[newStatus]) {
        newOrder[newStatus] = [activeId, ...newOrder[newStatus]];
      } else {
        newOrder[newStatus] = [activeId];
      }
      
      // Save to localStorage
      try {
        localStorage.setItem('clientOrder', JSON.stringify(newOrder));
      } catch (error) {
        console.error('Error saving client order:', error);
      }
      
      return newOrder;
    });

    try {
      // OPTIMISTIC UPDATE: Update UI immediately, then confirm with server
      await mutateClients(
        async (currentData: any) => {
          // Update the client status on the server
          const response = await fetch(`/api/clients/${activeId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
          });

          if (!response.ok) {
            throw new Error('Failed to update client status');
          }

          const result = await response.json();
          
          // Return updated data with the new client from server
          if (result.client && currentData?.clients) {
            return {
              ...currentData,
              clients: currentData.clients.map((c: any) => 
                c._id === result.client._id ? result.client : c
              )
            };
          }
          
          return currentData;
        },
        {
          // Optimistic data - update immediately in UI
          optimisticData: (currentData: any) => {
            if (!currentData?.clients) return currentData;
            return {
              ...currentData,
              clients: currentData.clients.map((c: any) => 
                c._id === activeId ? { ...c, status: newStatus } : c
              )
            };
          },
          rollbackOnError: true,
          populateCache: true,
          revalidate: false
        }
      );
      
      toast({
        title: "Client Moved",
        description: `${draggedClient.firstName} ${draggedClient.lastName} moved to ${statusInfo.label}`,
      });

    } catch (error) {
      console.error('Error updating client status:', error);
      
      toast({
        title: "Update Failed",
        description: "Failed to update client status. Changes reverted.",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (clientsLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading client board...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (clientsError) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Board</h3>
          <p className="text-gray-600 mb-4">{clientsError.message || 'An error occurred'}</p>
          <button
            onClick={() => mutateClients()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (clients.length === 0) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Clients Yet</h3>
          <p className="text-gray-600">Add your first client to get started with the board view.</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className={`h-full flex flex-col relative bg-gray-50/50 ${className}`}>
        {/* Priority Panel - Shows most urgent action */}
        {showPriorityPanel && mostUrgentClient && (
          <PriorityPanel
            urgentClient={mostUrgentClient}
            onComplete={handleCompleteAction}
            onSkip={handleSkipPriorityAction}
            onViewClient={(id) => {
              const client = clients.find(c => c._id === id);
              if (client) handleClientClick(client);
            }}
            onDismiss={() => setShowPriorityPanel(false)}
          />
        )}

        {/* Filter Bar - Smart filtering with keyboard shortcuts */}
        <FilterBar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={filterCounts}
        />

        {/* Main Board Area - Full width, never shrinks */}
        <div 
          className="flex flex-col flex-1 relative kanban-board-container"
        >
          {/* Board container - narrowed columns */}
          <div className="flex-1 overflow-hidden px-1 sm:px-2 lg:px-3 py-4">
            <div 
              className="grid h-full w-full kanban-board-grid"
              style={{ 
                gridTemplateColumns: 'repeat(6, minmax(var(--column-min-width), 1fr))',
                gap: 'var(--column-gap)',
                fontSize: 'var(--font-sm)'
              }}
            >
            {/* Unplaced Column */}
            <DroppableColumn
              id="UNPLACED"
              status="UNPLACED"
              clients={clientsByStatus.UNPLACED}
              connections={connections}
              onClientClick={handleClientClick}
              onRequestUpdate={handleRequestUpdate}
              onCreateReferral={handleCreateReferral}
              onAddClient={handleAddClient}
              onDelete={handleDeleteClient}
              isDragging={isDragging}
              isOverColumn={overId === 'UNPLACED'}
              selectedClientId={selectedClient?._id}
              viewDensity={shouldCompactCards ? 'compact' : viewDensity}
              shouldHideDetails={shouldHideDetails}
              onNavigateToTab={(tab: string) => {
                // TODO: Open drawer and navigate to specific tab
                // For now, just open the drawer - tab navigation will be implemented later
                console.log('Navigate to tab:', tab);
              }}
            />

            {/* Referral Sent Column */}
            <DroppableColumn
              id="REFERRAL_SENT"
              status="REFERRAL_SENT"
              clients={clientsByStatus.REFERRAL_SENT}
              connections={connections}
              onClientClick={handleClientClick}
              onRequestUpdate={handleRequestUpdate}
              onCreateReferral={handleCreateReferral}
              onAddClient={handleAddClient}
              onDelete={handleDeleteClient}
              isDragging={isDragging}
              isOverColumn={overId === 'REFERRAL_SENT'}
              selectedClientId={selectedClient?._id}
              viewDensity={shouldCompactCards ? 'compact' : viewDensity}
              shouldHideDetails={shouldHideDetails}
              onNavigateToTab={(tab: string) => {
                // TODO: Open drawer and navigate to specific tab
                // For now, just open the drawer - tab navigation will be implemented later
                console.log('Navigate to tab:', tab);
              }}
            />

            {/* In Process Column */}
            <DroppableColumn
              id="IN_PROCESS"
              status="IN_PROCESS"
              clients={clientsByStatus.IN_PROCESS}
              connections={connections}
              onClientClick={handleClientClick}
              onRequestUpdate={handleRequestUpdate}
              onCreateReferral={handleCreateReferral}
              onAddClient={handleAddClient}
              onDelete={handleDeleteClient}
              isDragging={isDragging}
              isOverColumn={overId === 'IN_PROCESS'}
              selectedClientId={selectedClient?._id}
              viewDensity={shouldCompactCards ? 'compact' : viewDensity}
              shouldHideDetails={shouldHideDetails}
              onNavigateToTab={(tab: string) => {
                // TODO: Open drawer and navigate to specific tab
                // For now, just open the drawer - tab navigation will be implemented later
                console.log('Navigate to tab:', tab);
              }}
            />

            {/* Active Stable Column */}
            <DroppableColumn
              id="ACTIVE_STABLE"
              status="ACTIVE_STABLE"
              clients={clientsByStatus.ACTIVE_STABLE}
              connections={connections}
              onClientClick={handleClientClick}
              onRequestUpdate={handleRequestUpdate}
              onCreateReferral={handleCreateReferral}
              onAddClient={handleAddClient}
              onDelete={handleDeleteClient}
              isDragging={isDragging}
              isOverColumn={overId === 'ACTIVE_STABLE'}
              selectedClientId={selectedClient?._id}
              viewDensity={shouldCompactCards ? 'compact' : viewDensity}
              shouldHideDetails={shouldHideDetails}
              onNavigateToTab={(tab: string) => {
                // TODO: Open drawer and navigate to specific tab
                // For now, just open the drawer - tab navigation will be implemented later
                console.log('Navigate to tab:', tab);
              }}
            />

            {/* Active Needs Attention Column */}
            <DroppableColumn
              id="ACTIVE_NEEDS_ATTENTION"
              status="ACTIVE_NEEDS_ATTENTION"
              clients={clientsByStatus.ACTIVE_NEEDS_ATTENTION}
              connections={connections}
              onClientClick={handleClientClick}
              onRequestUpdate={handleRequestUpdate}
              onCreateReferral={handleCreateReferral}
              onAddClient={handleAddClient}
              onDelete={handleDeleteClient}
              isDragging={isDragging}
              isOverColumn={overId === 'ACTIVE_NEEDS_ATTENTION'}
              selectedClientId={selectedClient?._id}
              viewDensity={shouldCompactCards ? 'compact' : viewDensity}
              shouldHideDetails={shouldHideDetails}
              onNavigateToTab={(tab: string) => {
                // TODO: Open drawer and navigate to specific tab
                // For now, just open the drawer - tab navigation will be implemented later
                console.log('Navigate to tab:', tab);
              }}
            />

            {/* Closed/Discharged Column */}
            <DroppableColumn
              id="CLOSED_DISCHARGED"
              status="CLOSED_DISCHARGED"
              clients={clientsByStatus.CLOSED_DISCHARGED}
              connections={connections}
              onClientClick={handleClientClick}
              onRequestUpdate={handleRequestUpdate}
              onCreateReferral={handleCreateReferral}
              onAddClient={handleAddClient}
              onDelete={handleDeleteClient}
              isDragging={isDragging}
              isOverColumn={overId === 'CLOSED_DISCHARGED'}
              selectedClientId={selectedClient?._id}
              viewDensity={shouldCompactCards ? 'compact' : viewDensity}
              shouldHideDetails={shouldHideDetails}
              onNavigateToTab={(tab: string) => {
                // TODO: Open drawer and navigate to specific tab
                // For now, just open the drawer - tab navigation will be implemented later
                console.log('Navigate to tab:', tab);
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Drag Overlay - shows the dragged item with immediate feedback */}
      <DragOverlay dropAnimation={{ duration: 150, easing: 'ease-out' }}>
        {activeId ? (
          viewDensity === 'compact' ? (
            <div className="transform rotate-1 scale-105 opacity-95">
              <div className="bg-white border-2 border-blue-400 ring-4 ring-blue-100 rounded-lg shadow-2xl cursor-grabbing overflow-hidden">
                {(() => {
                  const client = localClients.find(c => c._id === activeId)!;
                  const isUrgent = client.status === 'ACTIVE_FRUSTRATED' || client.status === 'ACTIVE_NEEDS_ATTENTION';
                  const getStatusColor = () => {
                    switch (client.status) {
                      case 'ACTIVE_STABLE': return 'bg-green-500';
                      case 'ACTIVE_NEEDS_ATTENTION':
                      case 'ACTIVE_FRUSTRATED': return 'bg-red-500';
                      case 'IN_PROCESS': return 'bg-purple-500';
                      case 'REFERRAL_SENT': return 'bg-blue-500';
                      default: return 'bg-slate-400';
                    }
                  };
                  
                  return (
                    <div className="px-3 py-2.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        {/* Status indicator */}
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-white shadow-sm ${getStatusColor()}`} />
                        
                        {/* Name */}
                        <h3 className="text-[12px] font-bold text-slate-900 flex-1">
                          {capitalizeName(client.firstName || 'Unknown')} {capitalizeName(client.lastName || 'Client')}
                        </h3>
                        
                        {isUrgent && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700 flex-shrink-0">
                            !
                          </span>
                        )}
                      </div>
                      
                      {/* Contact & PMI row */}
                      <div className="flex items-center gap-2 pl-4.5">
                        <span className="text-[10px] text-slate-600 font-medium whitespace-nowrap">
                          {client.phone ? `📞 ${client.phone}` : client.email ? `✉️ ${client.email}` : 'No contact'}
                        </span>
                        {(client.pmi || client.pmiNumber) && (
                          <span className="font-mono text-[10px] text-slate-700 bg-blue-50 px-2 py-1 rounded border border-blue-200 whitespace-nowrap font-semibold">
                            {client.pmi || client.pmiNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="transform rotate-1 scale-110 opacity-95">
              <ClientCard
                client={localClients.find(c => c._id === activeId)!}
                connections={connections}
                className="shadow-2xl border-2 border-blue-400 ring-4 ring-blue-100 bg-white cursor-grabbing"
              />
            </div>
          )
        ) : null}
      </DragOverlay>

        {/* Right Panel - Overlay that slides in from right (board stays full width!) */}
        <div 
          className="absolute top-0 right-0 h-full bg-white border-l border-slate-200 overflow-hidden shadow-2xl"
          style={{
            width: 'min(clamp(var(--panel-min-width), var(--panel-preferred-width), var(--panel-max-width)), var(--panel-absolute-max))',
            transform: isDrawerOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 'var(--z-panel)'
          }}
        >
          {/* Drawer Content */}
          <div 
            className="w-full h-full"
            style={{
              opacity: isDrawerOpen ? 1 : 0,
              pointerEvents: isDrawerOpen ? 'auto' : 'none',
              transition: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {isDrawerOpen && selectedClient && (
              showDetailsPanel ? (
                <ClientDetailsPanel
                  client={selectedClient as any}
                  isOpen={isDrawerOpen}
                  onClose={handleCloseDrawer}
                  onUpdate={async () => {
                    // Optimistically update using SWR
                    await mutateClients();
                    
                    // Update selected client with fresh data
                    try {
                      const response = await fetch(`/api/clients/${selectedClient._id}`);
                      if (response.ok) {
                        const data = await response.json();
                        if (data.client) {
                          setSelectedClient(data.client);
                        }
                      }
                    } catch (error) {
                      console.error('Failed to refresh client:', error);
                    }
                  }}
                />
              ) : (
                <ClientSideDrawer
                  client={selectedClient as any}
                  connections={connections}
                  isOpen={isDrawerOpen}
                  onClose={handleCloseDrawer}
                  onRequestUpdate={handleSideDrawerRequestUpdate}
                  onViewProfile={handleViewProfile}
                />
              )
            )}
          </div>
        </div>

        {/* Referral Panel */}
        <ReferralPanel
          isOpen={isReferralPanelOpen}
          onClose={handleCloseReferralPanel}
          selectedClient={referralClient}
          onSuccess={handleReferralSuccess}
        />

        {/* Add Client Modal */}
        <AddClientModal
          isOpen={isAddClientModalOpen}
          onClose={handleCloseAddClientModal}
          onClientAdded={handleClientAdded}
        />

        {/* Delete Client Modal */}
        <DeleteClientModal
          isOpen={deleteModalOpen}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          clientName={clientToDelete ? `${clientToDelete.firstName} ${clientToDelete.lastName}` : ''}
          isDeleting={isDeleting}
        />
      </div>
    </DndContext>
  );
}

// Import icons that are used in empty states
import { CircleDot, CheckCircle2, AlertTriangle } from 'lucide-react';
