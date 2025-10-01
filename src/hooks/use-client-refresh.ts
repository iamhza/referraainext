/**
 * Hook for managing client data refresh across pages
 * Provides a way to trigger refresh when clients are added/updated
 */

import { useState, useEffect } from 'react';

// Global state for client refresh events
let globalRefreshTrigger = 0;
const refreshListeners: Set<() => void> = new Set();

// Function to trigger global refresh
export const triggerClientRefresh = () => {
  globalRefreshTrigger++;
  refreshListeners.forEach(listener => listener());
};

// Hook to listen for client refresh events
export const useClientRefresh = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const listener = () => {
      setRefreshTrigger(globalRefreshTrigger);
    };

    refreshListeners.add(listener);

    return () => {
      refreshListeners.delete(listener);
    };
  }, []);

  // Manual refresh function
  const triggerRefresh = () => {
    triggerClientRefresh();
  };

  return {
    refreshTrigger,
    triggerRefresh
  };
};

// Hook specifically for triggering refresh after client operations
export const useClientMutations = () => {
  const triggerRefresh = () => {
    triggerClientRefresh();
  };

  return {
    onClientAdded: triggerRefresh,
    onClientUpdated: triggerRefresh,
    onClientDeleted: triggerRefresh,
    triggerRefresh
  };
};
