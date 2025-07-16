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
import { ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
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
    <div className="relative">
      <Select
        value={status}
        onValueChange={(value) => handleStatusChange(value as ClientStatus)}
        disabled={isLoading}
      >
        <SelectTrigger 
          className={cn(
            "min-w-[200px] h-12 bg-gradient-to-r from-white/80 to-blue-50/50 backdrop-blur-sm border-blue-200/60 hover:border-blue-300/80 shadow-sm hover:shadow-md transition-all duration-200 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400",
            isLoading && "opacity-75 cursor-not-allowed",
            className
          )}
        >
          <SelectValue className="flex items-center">
            <div className="flex items-center justify-between w-full">
              <StatusBadge status={status} size="sm" className="font-medium" />
              <div className="flex items-center gap-1 ml-2">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-blue-400 transition-transform duration-200" />
                )}
              </div>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-gradient-to-b from-white/95 to-blue-50/30 backdrop-blur-md border border-blue-200/40 shadow-xl rounded-xl p-1 min-w-[220px]">
          <SelectItem 
            value="ACTIVE_STABLE" 
            className="rounded-lg hover:bg-blue-50/50 focus:bg-blue-50/70 cursor-pointer transition-colors duration-150 p-3 border-transparent hover:border-blue-200/30"
          >
            <div className="flex items-center justify-between w-full">
              <StatusBadge status="ACTIVE_STABLE" size="sm" className="font-medium" />
              {status === 'ACTIVE_STABLE' && (
                <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 shadow-sm" />
              )}
            </div>
          </SelectItem>
          <SelectItem 
            value="ACTIVE_FRUSTRATED" 
            className="rounded-lg hover:bg-blue-50/50 focus:bg-blue-50/70 cursor-pointer transition-colors duration-150 p-3 border-transparent hover:border-blue-200/30"
          >
            <div className="flex items-center justify-between w-full">
              <StatusBadge status="ACTIVE_FRUSTRATED" size="sm" className="font-medium" />
              {status === 'ACTIVE_FRUSTRATED' && (
                <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 shadow-sm" />
              )}
            </div>
          </SelectItem>
          <SelectItem 
            value="UNPLACED_NEW" 
            className="rounded-lg hover:bg-blue-50/50 focus:bg-blue-50/70 cursor-pointer transition-colors duration-150 p-3 border-transparent hover:border-blue-200/30"
          >
            <div className="flex items-center justify-between w-full">
              <StatusBadge status="UNPLACED_NEW" size="sm" className="font-medium" />
              {status === 'UNPLACED_NEW' && (
                <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 shadow-sm" />
              )}
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
} 