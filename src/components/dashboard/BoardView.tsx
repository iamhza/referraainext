'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ClientCard } from './ClientCard';
import { ClientListItem } from './ClientListItem';
import { DroppableColumn } from './DroppableColumn';
import { ClientSideDrawer } from '../clients/ClientSideDrawer';
import { ReferralPanel } from '../referrals/ReferralPanel';
import { AddClientModal } from '../modals/AddClientModal';
import { DeleteClientModal } from '../modals/DeleteClientModal';
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
  onClientsLoaded?: (count: number) => void;
  refreshTrigger?: number;
  viewDensity?: 'comfortable' | 'compact';
  className?: string;
}

export function BoardView({ 
  onClientClick, 
  onRequestUpdate, 
  onClientsLoaded,
  refreshTrigger = 0,
  viewDensity = 'comfortable',
  className = '' 
}: BoardViewProps) {
  
  // Responsive kanban configuration - optimized for your screen
  const responsiveConfig = {
    columnCount: 6,
    minColumnWidth: 160,  // Allow smaller minimum
    maxColumnWidth: 350,  // Reasonable maximum
    gap: 12
  };
  
  const { 
    columnWidth, 
    shouldCompactCards, 
    shouldHideDetails, 
    fontSize, 
    gap 
  } = useResponsiveKanban(responsiveConfig);
  const router = useRouter();
  const [clients, setClients] = useState<ClientType[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [overId, setOverId] = useState<string | null>(null);
  const [originalClientsBeforeDrag, setOriginalClientsBeforeDrag] = useState<ClientType[] | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientType | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isReferralPanelOpen, setIsReferralPanelOpen] = useState(false);
  const [referralClient, setReferralClient] = useState<ClientType | null>(null);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [customOrder, setCustomOrder] = useState<{[status: string]: string[]}>({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Helper function to get status display info for toasts
  const getStatusDisplayInfo = (status: string) => {
    switch (status) {
      case 'UNPLACED':
        return { label: 'Unplaced', color: 'red' };
      case 'REFERRAL_SENT':
        return { label: 'Referral Sent', color: 'blue' };
      case 'IN_PROCESS':
        return { label: 'In Process', color: 'purple' };
      case 'ACTIVE_STABLE':
        return { label: 'Active', color: 'green' };
      case 'ACTIVE_NEEDS_ATTENTION':
        return { label: 'Needs Attention', color: 'yellow' };
      case 'CLOSED_DISCHARGED':
        return { label: 'Closed/Discharged', color: 'gray' };
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
    // Refresh clients data
    fetchClients();
    
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
    fetchClients(); // Refresh the client list
    fetchConnections(); // Also refresh connections
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

  // Fetch connections data (same as table)
  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/client-connections');
      if (!response.ok) {
        throw new Error('Failed to fetch client connections');
      }
      const data = await response.json();
      setConnections(data.connections || []);
    } catch (error) {
      console.error('Error fetching client connections:', error);
      setConnections([]); // Fallback to empty array
    }
  };

  // Fetch clients data with referral counts
  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch clients from clients endpoint (same as table)
      const clientsResponse = await fetch('/api/clients');
      if (!clientsResponse.ok) {
        throw new Error('Failed to fetch clients');
      }
      
      const clientsData = await clientsResponse.json();
      const clients = clientsData.clients || [];
      
      // Fetch all referrals for all clients in one go (more efficient)
      const allReferralsResponse = await fetch('/api/referrals');
      const allReferralsData = allReferralsResponse.ok ? await allReferralsResponse.json() : { referrals: [] };
      const allReferrals = allReferralsData.referrals || [];
      
      // Fetch all activities (for last activity computation)
      // Note: This would be a new endpoint or we can use existing data
      const allActivities: any[] = []; // TODO: Implement activity fetching if needed
      
      // Fetch connections data for enhancement
      let connectionsData = connections;
      if (connectionsData.length === 0) {
        try {
          const connectionsResponse = await fetch('/api/connections');
          if (connectionsResponse.ok) {
            const connectionsResult = await connectionsResponse.json();
            connectionsData = connectionsResult.connections || [];
            setConnections(connectionsData); // Update state too
          }
        } catch (error) {
          console.error('Error fetching connections for enhancement:', error);
          connectionsData = [];
        }
      }

      // Enhance clients with computed fields using our data enhancer
      const enhancedClients = enhanceClientsData(
        clients,
        allReferrals,
        connectionsData, // Use fetched connections data
        allActivities
      );
      
      // Maintain backward compatibility with existing activeReferrals/pendingReferrals fields
      const clientsWithLegacyFields = enhancedClients.map(client => ({
        ...client,
        activeReferrals: client.referralSummary?.active || 0,
        pendingReferrals: client.referralSummary?.pending || 0,
        unreadMessages: 0 // TODO: Add unreadMessages from workspace API
      }));
      
      setClients(clientsWithLegacyFields);
      
      // Notify parent component of client count
      if (onClientsLoaded) {
        onClientsLoaded(clientsWithLegacyFields.length);
      }
    } catch (err: any) {
      console.error('Error fetching clients:', err);
      setError(err.message || 'Failed to load clients');
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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

  // Initial fetch and refresh trigger
  useEffect(() => {
    fetchClients();
    fetchConnections(); // Also fetch connections data
  }, [refreshTrigger]);

  // Group clients by status with custom ordering
  const clientsByStatus = useMemo(() => {
    const groups = {
      UNPLACED: [] as ClientType[],
      REFERRAL_SENT: [] as ClientType[],
      IN_PROCESS: [] as ClientType[],
      ACTIVE_STABLE: [] as ClientType[],
      ACTIVE_NEEDS_ATTENTION: [] as ClientType[],
      CLOSED_DISCHARGED: [] as ClientType[]
    };

    clients.forEach(client => {
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

    // Apply custom ordering if it exists, otherwise sort by date
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
          
          // If neither is in custom order, sort by date
          const dateA = new Date(a.updatedAt || a.createdAt || 0);
          const dateB = new Date(b.updatedAt || b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
      } else {
        // Default sort by most recently updated first
        groups[statusKey].sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt || 0);
          const dateB = new Date(b.updatedAt || b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
      }
    });

    return groups;
  }, [clients, customOrder]);

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
    const client = clients.find(c => c._id === clientId);
    if (client) {
      setClientToDelete(client);
      setDeleteModalOpen(true);
    }
  }, [clients]);

  const handleConfirmDelete = useCallback(async () => {
    if (!clientToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/clients/${clientToDelete._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete client');
      }

      const deletedClientName = `${clientToDelete.firstName} ${clientToDelete.lastName}`;
      const deletedClientId = clientToDelete._id;

      // Close modal and reset state first
      setDeleteModalOpen(false);
      setClientToDelete(null);
      setIsDeleting(false);

      // Remove client from local state
      setClients(prevClients => prevClients.filter(c => c._id !== deletedClientId));
      
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
  }, [clientToDelete, selectedClient, toast]);

  const handleCancelDelete = useCallback(() => {
    setDeleteModalOpen(false);
    setClientToDelete(null);
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
    setActiveId(active.id as string);
    setIsDragging(true);
    setOverId(null);
    
    // Store original clients state for potential reversion
    setOriginalClientsBeforeDrag([...clients]);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setIsDragging(false);
    setOverId(null);
    
    // Revert to original state if drag was cancelled
    if (originalClientsBeforeDrag) {
      setClients(originalClientsBeforeDrag);
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
    const activeClient = clients.find(client => client._id === activeId);
    if (!activeClient) return;
    
    // Check if we're over a specific client
    const overClient = clients.find(client => client._id === overId);
    
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
      setClients(currentClients => {
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
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the client being dragged
    const draggedClient = clients.find(client => client._id === activeId);
    if (!draggedClient) {
      console.error('Dragged client not found:', activeId);
      return;
    }

    console.log('Drag end:', { 
      activeId, 
      overId, 
      draggedClient: draggedClient.firstName,
      draggedStatus: draggedClient.status 
    });

    // Check if we're dropping on another client
    const overClient = clients.find(client => client._id === overId);
    
    if (overClient) {
      console.log('Dropping on client:', overClient.firstName, 'Status:', overClient.status);
      
      if (draggedClient.status === overClient.status && activeId !== overId) {
        // Same column reordering
        console.log('Same column reorder');
        handleReorderWithinColumn(activeId, overId, draggedClient);
      } else if (draggedClient.status !== overClient.status) {
        // Cross-column move
        console.log('Cross-column move to client');
        handleCrossColumnMove(activeId, overId, draggedClient, overClient);
      }
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

    if (newStatus && draggedClient.status !== newStatus) {
      console.log('Column drop - status change from', draggedClient.status, 'to', newStatus);
      handleStatusChange(activeId, newStatus, draggedClient);
    } else {
      console.log('No status change needed or unknown drop target');
    }
  };

  // Production-grade reordering within the same column
  const handleReorderWithinColumn = async (activeId: string, overId: string, draggedClient: any) => {
    console.log('Reordering within column:', { activeId, overId, status: draggedClient.status });
    
    const activeIndex = clients.findIndex(client => client._id === activeId);
    const overIndex = clients.findIndex(client => client._id === overId);
    
    console.log('Indices:', { activeIndex, overIndex, totalClients: clients.length });
    
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
    const originalClients = [...clients];
    
    try {
      // Reorder the full clients array
      const reorderedClients = arrayMove(clients, activeIndex, overIndex);
      
      // Update clients state immediately for instant UI feedback - batched update
      setClients(reorderedClients);
      
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
      setClients(originalClients);
      
      toast({
        title: "Reorder Failed", 
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle cross-column moves - just commit the visual changes and update server
  const handleCrossColumnMove = async (activeId: string, overId: string, draggedClient: any, overClient: any) => {
    console.log('Cross-column move:', { 
      activeId, 
      overId, 
      from: draggedClient.status, 
      to: overClient.status,
      insertBefore: overClient.firstName 
    });
    
    const newStatus = overClient.status;
    
    // Don't modify the UI here - handleDragOver already positioned it correctly
    // Just update the server and clean up
    
    // Clear the original clients backup since we're committing the change
    setOriginalClientsBeforeDrag(null);

    try {
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

      const statusInfo = getStatusDisplayInfo(newStatus);
      toast({
        title: "Client Moved",
        description: `${draggedClient.firstName} ${draggedClient.lastName} moved to ${statusInfo.label}`,
      });

    } catch (error) {
      console.error('Error updating client status:', error);
      
      // Revert the optimistic update
      fetchClients();
      
      toast({
        title: "Move Failed",
        description: "Failed to move client. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Separate function for status changes
  const handleStatusChange = async (activeId: string, newStatus: string, draggedClient: any) => {
    console.log('Status change:', { from: draggedClient.status, to: newStatus });

    // Optimistically update the UI
    const updatedClients = clients.map(client =>
      client._id === activeId ? { ...client, status: newStatus as ClientStatus } : client
    );
    setClients(updatedClients);

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

      const statusInfo = getStatusDisplayInfo(newStatus);
      const oldStatusInfo = getStatusDisplayInfo(draggedClient.status);
      toast({
        title: "Status Updated",
        description: `${draggedClient.firstName} ${draggedClient.lastName}: ${oldStatusInfo.label} → ${statusInfo.label}`,
      });

    } catch (error) {
      console.error('Error updating client status:', error);
      
      // Revert the optimistic update
      setClients(clients);
      
      toast({
        title: "Update Failed",
        description: "Failed to update client status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (loading) {
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
  if (error) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Board</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchClients}
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
      <div className={`h-full flex bg-gray-50/50 ${className}`}>
        {/* Main Board Area - fixed width, no resizing */}
        <div className="flex flex-col w-full relative kanban-board-container">
          {/* Focus overlay when panel or drawer is open - reduced opacity for better card visibility */}
          {(isReferralPanelOpen || isDrawerOpen) && (
            <div className="absolute inset-0 bg-gray-900/3 z-10 pointer-events-none transition-all duration-500" />
          )}
          {/* Board container - true edge-to-edge */}
          <div className="flex-1 overflow-hidden px-1 sm:px-2 lg:px-3 py-4">
            <div 
              className="grid grid-cols-6 h-full w-full kanban-board-grid"
              style={{ 
                gap: gap,
                fontSize: fontSize
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
            <div className="transform rotate-1 scale-105 opacity-95" style={{ width: '400px' }}>
              <div className="bg-white border-2 border-blue-400 ring-4 ring-blue-100 rounded-lg shadow-2xl cursor-grabbing overflow-hidden">
                {(() => {
                  const client = clients.find(c => c._id === activeId)!;
                  const isUrgent = client.status === 'ACTIVE_FRUSTRATED';
                  const getStatusColor = () => {
                    switch (client.status) {
                      case 'ACTIVE_STABLE': return 'bg-green-500';
                      case 'ACTIVE_FRUSTRATED': return 'bg-red-500';
                      default: return 'bg-amber-500';
                    }
                  };
                  
                  return (
                    <div className="flex items-center px-4 py-3">
                      {/* Status indicator */}
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 mr-3 ${getStatusColor()}`} />
                      
                      {/* Name - Fixed width column */}
                      <div className="w-40 sm:w-48 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {capitalizeName(client.firstName || 'Unknown')} {capitalizeName(client.lastName || 'Client')}
                          </h3>
                          {isUrgent && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 flex-shrink-0">
                              Urgent
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {client.phone ? `📞 ${client.phone}` : client.email ? `✉️ ${client.email}` : 'No contact'}
                        </div>
                      </div>

                      {/* Service - Fixed width */}
                      <div className="hidden sm:block w-32 text-xs text-gray-600 truncate">
                        {client.serviceType || client.serviceType1 || '—'}
                      </div>

                      {/* PMI - Fixed width, centered */}
                      <div className="hidden md:block w-24 text-xs font-mono text-gray-500 text-center truncate">
                        {client.pmi || client.pmiNumber || '—'}
                      </div>

                      {/* Last Update - Fixed width, centered */}
                      <div className="hidden lg:block w-20 text-xs text-gray-500 text-center truncate">
                        {client.updatedAt ? 'Updated' : 'Recent'}
                      </div>

                      {/* Actions - Fixed width, centered */}
                      <div className="w-16 flex justify-center">
                        <div className="opacity-60">
                          <button className="inline-flex items-center px-1.5 py-1 text-xs font-medium text-white bg-secondary-500 rounded">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="transform rotate-1 scale-110 opacity-95">
              <ClientCard
                client={clients.find(c => c._id === activeId)!}
                connections={connections}
                className="shadow-2xl border-2 border-blue-400 ring-4 ring-blue-100 bg-white cursor-grabbing"
              />
            </div>
          )
        ) : null}
      </DragOverlay>

      {/* Client Side Drawer */}
      <ClientSideDrawer
        client={selectedClient as any}
        connections={connections}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onRequestUpdate={handleSideDrawerRequestUpdate}
      />

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
