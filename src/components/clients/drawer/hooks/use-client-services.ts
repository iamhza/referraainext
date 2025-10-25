'use client';

import { useState, useEffect } from 'react';
import type { ServiceRelationship } from '../types';

interface UseClientServicesReturn {
  services: ServiceRelationship[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useClientServices(clientId: string): UseClientServicesReturn {
  const [services, setServices] = useState<ServiceRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = async () => {
    if (!clientId) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/clients/${clientId}/service-relationships`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch service relationships');
      }

      const data = await response.json();
      setServices(data.serviceRelationships || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [clientId]);

  return {
    services,
    loading,
    error,
    refetch: fetchServices,
  };
}

