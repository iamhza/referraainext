import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { ClientStatus } from '@/types';

interface ClientStatusSelectorProps {
  clientId: string;
  initialStatus?: ClientStatus;
  onStatusChange?: (newStatus: ClientStatus) => void;
  className?: string;
}

export function ClientStatusSelector({ 
  clientId, 
  initialStatus = 'UNPLACED_NEW',
  onStatusChange,
  className 
}: ClientStatusSelectorProps) {
  const [status, setStatus] = useState<ClientStatus>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleStatusChange = async (newStatus: ClientStatus) => {
    if (newStatus === status) return;
    
    setIsLoading(true);
    try {
      console.log(`Updating client ${clientId} status to ${newStatus}`);
      
      const response = await fetch('/api/clients/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`API error: Status ${response.status}`, errorData);
        throw new Error(errorData.error || `Failed to update status (${response.status})`);
      }

      const result = await response.json();
      console.log('Status update successful:', result);

      // Update local state
      setStatus(newStatus);
      
      // Notify parent component
      if (onStatusChange) {
        onStatusChange(newStatus);
      }
      
      toast({
        title: 'Status updated',
        description: `Client status updated to ${getStatusLabel(newStatus)}`,
      });
    } catch (error) {
      console.error('Error updating client status:', error);
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update client status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusLabel = (status: ClientStatus): string => {
    switch (status) {
      case 'ACTIVE_STABLE':
        return 'Active & Stable';
      case 'ACTIVE_FRUSTRATED':
        return 'Active & Frustrated';
      case 'UNPLACED_NEW':
        return 'Unplaced/New';
      default:
        return 'Unknown';
    }
  };

  return (
    <Select
      value={status}
      onValueChange={(value) => handleStatusChange(value as ClientStatus)}
      disabled={isLoading}
    >
      <SelectTrigger className={className}>
        <SelectValue>
          <StatusBadge status={status} size="sm" />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ACTIVE_STABLE">
          <StatusBadge status="ACTIVE_STABLE" size="sm" />
        </SelectItem>
        <SelectItem value="ACTIVE_FRUSTRATED">
          <StatusBadge status="ACTIVE_FRUSTRATED" size="sm" />
        </SelectItem>
        <SelectItem value="UNPLACED_NEW">
          <StatusBadge status="UNPLACED_NEW" size="sm" />
        </SelectItem>
      </SelectContent>
    </Select>
  );
} 