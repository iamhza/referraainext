import { useState, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Custom hook for handling service relationship status updates
 */
export function useStatusUpdater(mutate: () => void) {
  const [updating, setUpdating] = useState(false);

  const updateStatus = useCallback(async (serviceRelationshipId: string, newStatus: string) => {
    setUpdating(true);
    
    try {
      const response = await fetch(`/api/service-relationships/${serviceRelationshipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update status');
      }

      // Success - refresh data and show success toast
      await mutate();
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('[Status Update Error]:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to update status. Please try again.'
      );
    } finally {
      setUpdating(false);
    }
  }, [mutate]);

  return {
    updateStatus,
    updating,
  };
}

