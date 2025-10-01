/**
 * Hook for fetching workspace message status for clients
 * Shows unread messages, pending responses, etc.
 */

import { useState, useEffect } from 'react';

interface WorkspaceStatus {
  clientId: string;
  unreadMessages: number;
  pendingUpdateRequests: number;
  lastMessageAt?: string;
  hasActiveConversation: boolean;
  needsAttention: boolean;
}

interface UseWorkspaceStatusOptions {
  clientIds: string[];
  refreshInterval?: number;
  enabled?: boolean;
}

export function useWorkspaceStatus({ 
  clientIds, 
  refreshInterval = 30000, // 30 seconds
  enabled = true 
}: UseWorkspaceStatusOptions) {
  const [statuses, setStatuses] = useState<Record<string, WorkspaceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaceStatus = async () => {
    if (!enabled || clientIds.length === 0) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/workspace/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch workspace status');
      }

      const data = await response.json();
      setStatuses(data.statuses || {});
    } catch (err) {
      console.error('Error fetching workspace status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceStatus();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchWorkspaceStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [clientIds.join(','), refreshInterval, enabled]);

  return {
    statuses,
    loading,
    error,
    refresh: fetchWorkspaceStatus,
    getStatusForClient: (clientId: string) => statuses[clientId] || {
      clientId,
      unreadMessages: 0,
      pendingUpdateRequests: 0,
      hasActiveConversation: false,
      needsAttention: false
    }
  };
}
