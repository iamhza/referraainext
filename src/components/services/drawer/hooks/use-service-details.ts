'use client';

import useSWR from 'swr';
import type { ServiceDetails } from '../types';

interface UseServiceDetailsReturn {
  service: ServiceDetails | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useServiceDetails(serviceRelationshipId: string | null): UseServiceDetailsReturn {
  const { data, error, isLoading, mutate } = useSWR(
    serviceRelationshipId ? `/api/service-relationships/${serviceRelationshipId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  return {
    service: data?.serviceRelationship || null,
    loading: isLoading,
    error: error ? 'Failed to load service details' : null,
    refetch: mutate,
  };
}

