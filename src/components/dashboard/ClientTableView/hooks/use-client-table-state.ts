import { useState, useCallback } from 'react';
import type { AdvancedFilters, SortOption } from '../../AdvancedFilterBar';
import type { ServiceRelationshipWithDetails } from '../types';

/**
 * Custom hook for managing client table state
 */
export function useClientTableState() {
  // Filter and sort state
  const [filters, setFilters] = useState<AdvancedFilters>({
    search: '',
    serviceStatuses: [],
    authStatuses: [],
    hasIssues: null,
    providers: [],
  });
  const [sortBy, setSortBy] = useState<SortOption>('name');

  // UI state
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  // Issue dialog state
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [selectedServiceForIssue, setSelectedServiceForIssue] = useState<ServiceRelationshipWithDetails | null>(null);

  // Service drawer state
  const [serviceDrawerOpen, setServiceDrawerOpen] = useState(false);
  const [selectedServiceForDrawer, setSelectedServiceForDrawer] = useState<string | null>(null);

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedServiceForAuth, setSelectedServiceForAuth] = useState<ServiceRelationshipWithDetails | null>(null);

  // Client drawer state
  const [clientDrawerOpen, setClientDrawerOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Handlers
  const handleToggleExpand = useCallback((clientId: string) => {
    setExpandedClients(prev => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  }, []);

  const openClientDrawer = useCallback((clientId: string) => {
    setSelectedClientId(clientId);
    setClientDrawerOpen(true);
  }, []);

  const closeClientDrawer = useCallback(() => {
    setClientDrawerOpen(false);
    setSelectedClientId(null);
  }, []);

  const openIssueDialog = useCallback((service: ServiceRelationshipWithDetails) => {
    setSelectedServiceForIssue(service);
    setIssueDialogOpen(true);
  }, []);

  const closeIssueDialog = useCallback(() => {
    setIssueDialogOpen(false);
    setSelectedServiceForIssue(null);
  }, []);

  const openServiceDrawer = useCallback((serviceId: string) => {
    setSelectedServiceForDrawer(serviceId);
    setServiceDrawerOpen(true);
  }, []);

  const closeServiceDrawer = useCallback(() => {
    setServiceDrawerOpen(false);
    setSelectedServiceForDrawer(null);
  }, []);

  const openAuthModal = useCallback((service: ServiceRelationshipWithDetails) => {
    setSelectedServiceForAuth(service);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
    setSelectedServiceForAuth(null);
  }, []);

  return {
    // Filter state
    filters,
    setFilters,
    sortBy,
    setSortBy,

    // Expand state
    expandedClients,
    handleToggleExpand,

    // Client drawer
    clientDrawerOpen,
    selectedClientId,
    openClientDrawer,
    closeClientDrawer,
    setClientDrawerOpen,
    setSelectedClientId,

    // Issue dialog
    issueDialogOpen,
    selectedServiceForIssue,
    openIssueDialog,
    closeIssueDialog,
    setIssueDialogOpen,
    setSelectedServiceForIssue,

    // Service drawer
    serviceDrawerOpen,
    selectedServiceForDrawer,
    openServiceDrawer,
    closeServiceDrawer,
    setServiceDrawerOpen,
    setSelectedServiceForDrawer,

    // Auth modal
    authModalOpen,
    selectedServiceForAuth,
    openAuthModal,
    closeAuthModal,
    setAuthModalOpen,
    setSelectedServiceForAuth,
  };
}

