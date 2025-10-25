'use client';

import { useState, useEffect } from 'react';
import type { Client, ClientDrawerTab } from '../types';

interface UseClientDrawerReturn {
  client: Client | null;
  loading: boolean;
  error: string | null;
  activeTab: ClientDrawerTab;
  setActiveTab: (tab: ClientDrawerTab) => void;
  refetch: () => Promise<void>;
}

export function useClientDrawer(clientId: string): UseClientDrawerReturn {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ClientDrawerTab>('profile');

  const fetchClient = async () => {
    if (!clientId) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/clients/${clientId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch client');
      }

      const data = await response.json();
      setClient(data.client);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load client');
      console.error('Error fetching client:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClient();
  }, [clientId]);

  return {
    client,
    loading,
    error,
    activeTab,
    setActiveTab,
    refetch: fetchClient,
  };
}

