'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Sparkles, 
  Megaphone, 
  FileText,
  Users,
  RefreshCw,
  Download
} from 'lucide-react';
import Link from 'next/link';

interface QuickActionsBarProps {
  totalClients?: number;
  selectedCount?: number;
  onRefresh?: () => void;
  onBulkUpdate?: () => void;
  viewDensity?: 'comfortable' | 'compact';
  onViewDensityChange?: (density: 'comfortable' | 'compact') => void;
  className?: string;
}

export function QuickActionsBar({ 
  totalClients = 0,
  selectedCount = 0,
  onRefresh,
  onBulkUpdate,
  viewDensity = 'comfortable',
  onViewDensityChange,
  className = ''
}: QuickActionsBarProps) {
  const [isRequestingUpdates, setIsRequestingUpdates] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const { toast } = useToast();

  // Handle bulk request updates
  const handleRequestUpdates = async () => {
    try {
      setIsRequestingUpdates(true);
      
      // Call the real API to request updates
      const response = await fetch('/api/clients/request-updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestAll: selectedCount === 0, // If no specific selection, request all
          category: 'follow_up_required',
          priority: 'normal',
          message: 'Hi! Could you please provide an update on the current progress and status?'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send update requests');
      }
      
      toast({
        title: "Updates Requested",
        description: result.message,
        action: result.results?.length > 0 ? (
          <button 
            className="text-sm underline"
            onClick={() => window.open('/case-manager/workspace', '_blank')}
          >
            View Workspace
          </button>
        ) : undefined
      });
      
      if (onBulkUpdate) {
        onBulkUpdate();
      }
    } catch (error) {
      console.error('Error requesting updates:', error);
      toast({
        title: "Request Failed",
        description: error instanceof Error ? error.message : "Failed to send update requests",
        variant: "destructive"
      });
    } finally {
      setIsRequestingUpdates(false);
    }
  };

  // Handle report generation
  const handleGenerateReport = async () => {
    try {
      setIsGeneratingReport(true);
      
      // This would call an API to generate and download a report
      // For now, we'll simulate the action
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Report Generated",
        description: "Client status report has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Report Failed",
        description: "Failed to generate report",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className={`
      bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6
      ${className}
    `}>
      <div className="flex items-center justify-between">
        {/* Left side - Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">
              {totalClients} {totalClients === 1 ? 'Client' : 'Clients'} Total
            </span>
          </div>
          
          {selectedCount > 0 && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {selectedCount} Selected
            </Badge>
          )}
        </div>

        {/* Right side - View Controls & Actions */}
        <div className="flex items-center gap-3">
          {/* View Density Toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                viewDensity === 'comfortable' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => onViewDensityChange?.('comfortable')}
            >
              Comfortable
            </button>
            <button
              className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                viewDensity === 'compact' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => onViewDensityChange?.('compact')}
            >
              Compact
            </button>
          </div>
          
          <div className="w-px h-6 bg-gray-200" />
          
          {/* Actions */}
          <div className="flex items-center gap-2">
          {/* Add Client - Asana style button */}
          <Link href="/case-manager/clients/new" className="inline-flex items-center px-3 py-1.5 text-[13px] font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Link>

          {/* New Referral - Primary CTA with Tiffany Blue */}
          <Link href="/case-manager/new-referral" className="inline-flex items-center px-3 py-1.5 text-[13px] font-medium text-white bg-secondary-500 border border-secondary-500 rounded-md hover:bg-secondary-600 hover:border-secondary-600 transition-colors">
            <Sparkles className="w-4 h-4 mr-2" />
            New Referral
          </Link>

          {/* Request Updates - Asana style button */}
          <button 
            className="inline-flex items-center px-3 py-1.5 text-[13px] font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleRequestUpdates}
            disabled={isRequestingUpdates || totalClients === 0}
          >
            {isRequestingUpdates ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                Requesting...
              </>
            ) : (
              <>
                <Megaphone className="w-4 h-4 mr-2" />
                Request Updates
              </>
            )}
          </button>

          {/* Download Report - Asana style button */}
          <button 
            className="inline-flex items-center px-3 py-1.5 text-[13px] font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleGenerateReport}
            disabled={isGeneratingReport || totalClients === 0}
          >
            {isGeneratingReport ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </>
            )}
          </button>

          {/* Refresh - Asana style button */}
          {onRefresh && (
            <button 
              className="inline-flex items-center px-2 py-1.5 text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 hover:border-gray-400 transition-colors"
              onClick={onRefresh}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          </div>
        </div>
      </div>

      {/* Help text */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Use the actions above to manage your caseload. 
          {selectedCount > 0 
            ? ` ${selectedCount} clients selected for bulk actions.`
            : ' Click client cards to view details or select multiple for bulk operations.'
          }
        </p>
      </div>
    </div>
  );
}
