import { useState, useEffect, useCallback } from 'react';

interface Referral {
  _id: string;
  clientInfo: any;
  serviceDetails: any;
  status: string;
  providerName?: string;
  createdAt: string;
  updatedAt: string;
  lastUpdate?: string;
  progressPercentage?: number;
}

export function useClientReferrals(clientId: string, status?: string) {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReferrals = useCallback(async (forceRefresh: boolean = false) => {
    if (!clientId) return;
    
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({ clientId });
      if (status) {
        queryParams.append('status', status);
      }
      
      if (forceRefresh) {
        queryParams.append('forceRefresh', 'true');
      }
      
      const response = await fetch(`/api/referrals?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch referrals');
      }
      
      const data = await response.json();
      setReferrals(data.referrals || []);
    } catch (error) {
      console.error('Error fetching client referrals:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch referrals');
    } finally {
      setLoading(false);
    }
  }, [clientId, status]);

  // Function to allow manual refresh of referrals
  const refreshReferrals = useCallback(async () => {
    return fetchReferrals(true);
  }, [fetchReferrals]);
  
  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  return { referrals, loading, error, refreshReferrals };
} 