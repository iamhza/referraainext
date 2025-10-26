import { useMemo } from 'react';
import useSWR from 'swr';
import type { ServiceRelationshipWithDetails, ClientGroup } from '../types';
import { groupServicesByClient } from '../utils/calculations';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch service relationships');
  return response.json();
};

/**
 * Custom hook for fetching and grouping client table data
 */
export function useClientTableData(refreshTrigger: number = 0) {
  const { data: serviceRelationshipsData, isLoading, error, mutate } = useSWR(
    '/api/case-manager/service-relationships',
    fetcher,
    {
      revalidateOnFocus: false,      // Manual refresh only (via mutate)
      revalidateOnReconnect: false,  // Prevent automatic refetch
      dedupingInterval: 5000,        // Increased deduping window
      revalidateIfStale: false,      // Don't auto-revalidate stale data
    }
  );

  const serviceRelationships: ServiceRelationshipWithDetails[] = useMemo(() => 
    serviceRelationshipsData?.serviceRelationships || [],
    [serviceRelationshipsData]
  );

  // Group service relationships by client
  const clientGroups: ClientGroup[] = useMemo(() => 
    groupServicesByClient(serviceRelationships),
    [serviceRelationships]
  );

  return {
    clientGroups,
    serviceRelationships,
    isLoading,
    error,
    mutate,
  };
}

