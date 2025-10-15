/**
 * useSandbox Hook
 * 
 * Provides sandbox state and actions throughout the application.
 * Centralizes sandbox logic for consistent behavior.
 */

'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';

// ============================================================================
// TYPES
// ============================================================================

export interface SandboxState {
  isSandbox: boolean;
  tier: 'micro' | 'mid' | 'enterprise' | null;
  role: 'case_manager' | 'supervisor' | 'org_admin' | null;
  expiresAt: Date | null;
  daysRemaining: number | null;
  status: 'active' | 'expired' | 'converted' | null;
  sandboxOrgId: string | null;
}

export interface SandboxActions {
  requestExtension: () => Promise<boolean>;
  startConversion: () => void;
  trackEvent: (eventType: string, eventData?: any) => Promise<void>;
}

export interface UseSandboxReturn {
  sandbox: SandboxState;
  actions: SandboxActions;
  isLoading: boolean;
  error: Error | null;
}

// ============================================================================
// FETCHER
// ============================================================================

const fetcher = (url: string) => fetch(url).then(res => res.json());

// ============================================================================
// HOOK
// ============================================================================

export function useSandbox(): UseSandboxReturn {
  const { data: session, status } = useSession();
  
  // Fetch sandbox data from API
  const { data, error, isLoading, mutate } = useSWR(
    session?.user?.id ? `/api/sandbox/status` : null,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  );
  
  // ========================================================================
  // SANDBOX STATE
  // ========================================================================
  
  const sandbox: SandboxState = {
    isSandbox: data?.isSandbox || false,
    tier: data?.tier || null,
    role: data?.role || null,
    expiresAt: data?.expiresAt ? new Date(data.expiresAt) : null,
    daysRemaining: data?.daysRemaining || null,
    status: data?.status || null,
    sandboxOrgId: data?.sandboxOrgId || null,
  };
  
  // ========================================================================
  // ACTIONS
  // ========================================================================
  
  const requestExtension = useCallback(async (): Promise<boolean> => {
    if (!sandbox.sandboxOrgId) return false;
    
    try {
      const response = await fetch('/api/sandbox/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sandboxOrgId: sandbox.sandboxOrgId }),
      });
      
      if (response.ok) {
        // Revalidate sandbox data
        await mutate();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting extension:', error);
      return false;
    }
  }, [sandbox.sandboxOrgId, mutate]);
  
  const startConversion = useCallback(() => {
    // Trigger conversion modal via custom event
    // Components can listen with: window.addEventListener('sandbox-conversion-start', ...)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sandbox-conversion-start', {
        detail: { sandboxOrgId: sandbox.sandboxOrgId, tier: sandbox.tier }
      }));
    }
  }, [sandbox.sandboxOrgId, sandbox.tier]);
  
  const trackEvent = useCallback(async (
    eventType: string,
    eventData?: any
  ): Promise<void> => {
    if (!sandbox.isSandbox || !sandbox.sandboxOrgId) return;
    
    try {
      await fetch('/api/sandbox/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sandboxOrgId: sandbox.sandboxOrgId,
          eventType,
          eventData,
        }),
      });
    } catch (error) {
      // Silent fail for analytics
      console.error('Analytics tracking error:', error);
    }
  }, [sandbox.isSandbox, sandbox.sandboxOrgId]);
  
  // ========================================================================
  // AUTO-TRACK PAGE VIEWS
  // ========================================================================
  
  useEffect(() => {
    if (sandbox.isSandbox && typeof window !== 'undefined') {
      trackEvent('page_view', {
        page: window.location.pathname,
      });
    }
  }, [sandbox.isSandbox, trackEvent]);
  
  // ========================================================================
  // RETURN
  // ========================================================================
  
  return {
    sandbox,
    actions: {
      requestExtension,
      startConversion,
      trackEvent,
    },
    isLoading: isLoading || status === 'loading',
    error: error || null,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format days remaining into user-friendly text
 */
export function formatDaysRemaining(days: number | null): string {
  if (days === null) return '';
  if (days < 0) return 'Expired';
  if (days === 0) return 'Expires today';
  if (days === 1) return '1 day left';
  if (days < 7) return `${days} days left`;
  if (days < 14) return `${Math.ceil(days / 7)} week${days >= 14 ? 's' : ''} left`;
  return `${days} days left`;
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: 'micro' | 'mid' | 'enterprise' | null): string {
  if (!tier) return '';
  return tier === 'micro' ? 'Micro Organization' : 
         tier === 'mid' ? 'Mid-Tier Organization' : 
         'Enterprise Organization';
}

/**
 * Get urgency color for days remaining
 */
export function getDaysRemainingColor(days: number | null): string {
  if (days === null) return 'text-gray-600';
  if (days < 0) return 'text-red-600';
  if (days <= 2) return 'text-red-500';
  if (days <= 5) return 'text-orange-500';
  return 'text-yellow-600';
}

/**
 * Check if sandbox is near expiration (2 days or less)
 */
export function isNearExpiration(days: number | null): boolean {
  return days !== null && days >= 0 && days <= 2;
}

/**
 * Check if sandbox has expired
 */
export function isExpired(status: string | null): boolean {
  return status === 'expired';
}

