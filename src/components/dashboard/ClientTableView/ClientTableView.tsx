'use client';

import React, { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { AdvancedFilterBar, type AdvancedFilters, type SortOption } from '../AdvancedFilterBar';
import type { Client as ClientType } from '@/types.d';
import { getServiceRelationshipStatusConfig, type ServiceRelationship, type ServiceRelationshipStatus } from '@/types/service-relationships';
import { cn } from '@/lib/shared/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowUpDown, User, ChevronRight, ChevronDown, MoreHorizontal, AlertTriangle, Clock, 
  FileText, Shield, Calendar, CheckCircle, XCircle, AlertCircle, Building2, MessageSquare, Edit
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AuthorizationPopover } from '@/components/authorizations/AuthorizationPopover';
import { CreateIssueDialog } from '@/components/issues/CreateIssueDialog';
import { ServiceDetailDrawer } from '@/components/services/ServiceDetailDrawer';
import { AuthorizationModal } from '@/components/authorizations/AuthorizationModal';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { ClientDrawer } from '@/components/clients/drawer/ClientDrawer';
import { toast } from 'sonner';
import Link from 'next/link';

// Authorization status colors
const AUTH_STATUS = {
  APPROVED: { label: 'Approved', icon: CheckCircle, color: 'text-[#4CB782]' },
  SUBMITTED: { label: 'Pending', icon: Clock, color: 'text-[#4EA7FC]' },
  DRAFT: { label: 'Draft', icon: FileText, color: 'text-slate-500' },
  DENIED: { label: 'Denied', icon: XCircle, color: 'text-[#FA6563]' },
  EXPIRED: { label: 'Expired', icon: XCircle, color: 'text-[#991B1B]' },
} as const;

interface ServiceRelationshipWithDetails extends ServiceRelationship {
  client: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  } | null;
  providerName: string;
  serviceName?: string;
  serviceCategory?: string;
  // Additional v1.1 fields
  authorization?: {
    _id?: string;
    status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'DENIED' | 'EXPIRED';
    units?: number;
    unitType?: string;
    startDate?: string;
    endDate?: string;
    approvalNumber?: string;
    fundingSource?: string;
    notes?: string;
    daysUntilExpiration?: number;
  };
  openActionsCount?: number;
  documentsCount?: number;
  activeIssuesCount?: number; // v1.1: Replaces flag field
  phiReleased?: {
    at: string;
    byMemberId: string;
  };
}

interface ClientGroup {
  clientId: string;
  client: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  services: ServiceRelationshipWithDetails[];
  totalServices: number;
  totalActiveIssues: number; // Replaces hasFlags/mostCriticalFlag
  totalOpenActions: number;
  totalDocuments: number;
}

interface ClientTableViewProps {
  onClientsLoaded?: (count: number, clients?: ClientType[]) => void;
  refreshTrigger?: number;
  className?: string;
  clientToOpen?: { clientId: string; actionId?: string } | null;
  onClientOpened?: () => void;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
};

export function ClientTableView({
  onClientsLoaded,
  refreshTrigger = 0,
  className = '',
  clientToOpen,
  onClientOpened,
}: ClientTableViewProps) {
  const [filters, setFilters] = useState<AdvancedFilters>({
    search: '',
    serviceStatuses: [],
    authStatuses: [],
    hasIssues: null,
    providers: [],
  });
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [selectedServiceForIssue, setSelectedServiceForIssue] = useState<ServiceRelationshipWithDetails | null>(null);
  const [serviceDrawerOpen, setServiceDrawerOpen] = useState(false);
  const [selectedServiceForDrawer, setSelectedServiceForDrawer] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedServiceForAuth, setSelectedServiceForAuth] = useState<ServiceRelationshipWithDetails | null>(null);
  const [clientDrawerOpen, setClientDrawerOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const { data: serviceRelationshipsData, isLoading, mutate } = useSWR(
    '/api/case-manager/service-relationships',
    fetcher,
    {
      revalidateOnFocus: false,      // ✅ Manual refresh only (via mutate)
      revalidateOnReconnect: false,  // ✅ Prevent automatic refetch
      dedupingInterval: 5000,        // ✅ Increased deduping window
      revalidateIfStale: false,      // ✅ Don't auto-revalidate stale data
    }
  );

  const serviceRelationships: ServiceRelationshipWithDetails[] = serviceRelationshipsData?.serviceRelationships || [];

  // Group service relationships by client
  const clientGroups: ClientGroup[] = useMemo(() => {
    const grouped = new Map<string, ClientGroup>();

    serviceRelationships.forEach(sr => {
      if (!sr.client) return;

      const clientId = sr.clientId;
      if (!grouped.has(clientId)) {
        grouped.set(clientId, {
          clientId,
          client: sr.client,
          services: [],
          totalServices: 0,
          totalActiveIssues: 0, // v1.1: Replaces hasFlags/mostCriticalFlag
          totalOpenActions: 0,
          totalDocuments: 0,
        });
      }

      const group = grouped.get(clientId)!;
      group.services.push(sr);
      group.totalServices++;

      // Sum active issues (replaces flag tracking)
      group.totalActiveIssues += sr.activeIssuesCount || 0;

      // Sum open actions and documents
      group.totalOpenActions += sr.openActionsCount || 0;
      group.totalDocuments += sr.documentsCount || 0;
    });

    return Array.from(grouped.values());
  }, [serviceRelationships]);

  // Handle expand/collapse
  const handleToggleExpand = (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedClients(prev => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  };

  // Handle status change
  const handleStatusChange = async (serviceRelationshipId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/service-relationships/${serviceRelationshipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      mutate();
    } catch (error) {
      console.error('[Status Update Error]:', error);
      toast.error('Failed to update status. Please try again.');
    }
  };

  // Render authorization status
  const renderAuthorization = (auth?: ServiceRelationshipWithDetails['authorization']) => {
    if (!auth) {
      return (
        <span className="text-xs text-slate-400">No Auth</span>
      );
    }

    // Check expiration status first (takes priority over DB status)
    const isExpired = auth.daysUntilExpiration !== undefined && auth.daysUntilExpiration <= 0;
    const isExpiringSoon = auth.daysUntilExpiration !== undefined && auth.daysUntilExpiration < 30 && auth.daysUntilExpiration > 0;

    // Determine display based on expiration, then fall back to status
    let Icon, colorClass, label, sublabel;

    if (isExpired) {
      // ALWAYS show expired as dark red, regardless of DB status
      Icon = XCircle;
      colorClass = 'text-[#991B1B]';
      label = 'Expired';
      sublabel = auth.daysUntilExpiration !== undefined 
        ? `${Math.abs(auth.daysUntilExpiration)}d ago`
        : null;
    } else if (isExpiringSoon) {
      // Expiring soon - show as orange warning
      Icon = AlertCircle;
      colorClass = 'text-orange-600';
      label = 'Approved';
      sublabel = `Expires in ${auth.daysUntilExpiration}d`;
    } else {
      // Use DB status for active/pending/denied
      const statusConfig = AUTH_STATUS[auth.status as keyof typeof AUTH_STATUS];
      Icon = statusConfig?.icon || FileText;
      colorClass = statusConfig?.color || 'text-slate-500';
      label = statusConfig?.label || auth.status;
      sublabel = auth.units && auth.unitType 
        ? `${auth.units} ${auth.unitType.toLowerCase().replace(/_/g, ' ')}`
        : null;
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <Icon className={cn('w-3.5 h-3.5', colorClass)} />
              <div className="flex flex-col">
                <span className={cn('text-xs font-medium', colorClass)}>
                  {label}
                </span>
                {sublabel && (
                  <span className={cn(
                    'text-[10px] font-semibold',
                    isExpired ? 'text-[#991B1B]' :
                    isExpiringSoon ? 'text-orange-600' :
                    'text-slate-500'
                  )}>
                    {sublabel}
                  </span>
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="max-w-xs bg-white border-2 border-slate-300 shadow-2xl p-4 z-[9999]"
          >
            <div className="space-y-2">
              <p className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">Authorization Details</p>
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-slate-900">
                  <span className="text-slate-600">Status:</span> {
                    auth.status === 'APPROVED' ? 'Approved' :
                    auth.status === 'SUBMITTED' ? 'Pending Review' :
                    auth.status === 'DRAFT' ? 'Draft' :
                    auth.status === 'DENIED' ? 'Denied' :
                    auth.status === 'EXPIRED' ? 'Expired' :
                    auth.status
                  }
                </p>
                {auth.units && auth.unitType && (
                  <p className="text-sm font-semibold text-slate-900">
                    <span className="text-slate-600">Units:</span> {auth.units} {auth.unitType.toLowerCase().replace(/_/g, ' ')}
                  </p>
                )}
                {auth.startDate && (
                  <p className="text-sm font-semibold text-slate-900">
                    <span className="text-slate-600">Start:</span> {format(new Date(auth.startDate), 'MMM d, yyyy')}
                  </p>
                )}
                {auth.endDate && (
                  <p className="text-sm font-semibold text-slate-900">
                    <span className="text-slate-600">End:</span> {format(new Date(auth.endDate), 'MMM d, yyyy')}
                  </p>
                )}
                {auth.approvalNumber && (
                  <p className="text-sm font-semibold text-slate-900">
                    <span className="text-slate-600">Approval #:</span> {auth.approvalNumber}
                  </p>
                )}
              </div>
              {isExpired && (
                <div className="mt-3 pt-2 border-t -mx-4 -mb-4 px-4 py-2" style={{ borderColor: '#991B1B', backgroundColor: '#FEE2E2' }}>
                  <p className="text-sm font-bold" style={{ color: '#991B1B' }}>⚠️ Renewal Required</p>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Loading state
  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Advanced Filter Bar */}
      <div className="shrink-0 mb-4">
        <AdvancedFilterBar
          clients={[]}
          filters={filters}
          onFiltersChange={setFilters}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-hidden bg-white rounded-2xl border-2 border-slate-200/60 shadow-lg shadow-slate-200/50 ring-1 ring-slate-100/50">
        <div className="h-full overflow-y-auto overflow-x-hidden">
          <Table>
            {/* Premium Header */}
            <TableHeader className="sticky top-0 z-10 bg-gradient-to-r from-slate-50 via-white to-slate-50/80 backdrop-blur-sm border-b-2 border-slate-200/60">
              <TableRow>
                <TableHead className="h-14 px-4 w-12"></TableHead>
                <TableHead className="h-14 px-6 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Client
                  </div>
                </TableHead>
                <TableHead className="h-14 px-6 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Provider</TableHead>
                <TableHead className="h-14 px-6 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Service</TableHead>
                <TableHead className="h-14 px-6 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Status</TableHead>
                <TableHead className="h-14 px-6 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    Authorization
                  </div>
                </TableHead>
                <TableHead className="h-14 px-6 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                    Issues
                  </div>
                </TableHead>
                <TableHead className="h-14 px-6 text-[11px] font-bold text-slate-600 uppercase tracking-wider w-16"></TableHead>
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody>
              {clientGroups.map((group, idx) => {
                const isExpanded = expandedClients.has(group.clientId);
                
                return (
                  <React.Fragment key={group.clientId}>
                    {/* Parent Row: Client Summary */}
                    <TableRow
                      className={cn(
                        'cursor-pointer transition-all duration-200',
                        'border-b-2 border-b-slate-300/60',
                        idx % 2 === 0 ? 'bg-gradient-to-r from-white via-slate-50/30 to-white' : 'bg-gradient-to-r from-slate-50/60 via-slate-100/40 to-slate-50/60',
                        'shadow-sm',
                        isExpanded && 'bg-gradient-to-r from-blue-50/50 to-indigo-50/30 border-l-4 border-l-blue-500 shadow-md border-b-2 border-b-blue-300',
                        !isExpanded && 'hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-indigo-50/40 hover:shadow-md hover:border-l-4 hover:border-l-blue-300 hover:scale-[1.002]'
                      )}
                      onClick={() => handleToggleExpand(group.clientId, { stopPropagation: () => {} } as any)}
                    >
                      {/* Expand/Collapse */}
                      <TableCell className="px-4 py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            'h-6 w-6 p-0 transition-all duration-200',
                            'hover:bg-blue-100 hover:scale-110',
                            isExpanded && 'bg-blue-50 text-blue-600'
                          )}
                          onClick={(e) => handleToggleExpand(group.clientId, e)}
                        >
                          {isExpanded ? (
                            <ChevronDown className={cn(
                              'w-4 h-4 transition-transform duration-200',
                              isExpanded ? 'text-blue-600' : 'text-slate-600'
                            )} />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-600" />
                          )}
                        </Button>
                      </TableCell>

                      {/* Client Name */}
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedClientId(group.client._id);
                                  setClientDrawerOpen(true);
                                }}
                                className={cn(
                                  'font-bold text-slate-900 text-base leading-tight hover:text-blue-600 transition-colors cursor-pointer text-left',
                                  isExpanded && 'text-blue-900'
                                )}
                              >
                                {group.client.firstName} {group.client.lastName}
                              </button>
                              <span className="text-slate-400 text-sm">•</span>
                              <Badge variant="outline" className="text-xs px-2 py-0.5 font-medium text-slate-600 border-slate-300">
                                {group.totalServices} {group.totalServices === 1 ? 'Service' : 'Services'}
                              </Badge>
                            </div>
                            {group.client.email && (
                              <div className="text-xs text-slate-500 mt-1">{group.client.email}</div>
                            )}
                          </div>
                          <Badge 
                            className="text-xs px-2.5 py-1 font-bold shadow-sm border-2 whitespace-nowrap" 
                            style={{ 
                              background: 'linear-gradient(135deg, #0040FF 0%, #4EA7FC 100%)',
                              color: 'white',
                              borderColor: '#0040FF'
                            }}
                          >
                            Client
                          </Badge>
                        </div>
                      </TableCell>

                      {/* Provider Summary */}
                      <TableCell className="px-6 py-4">
                        {(() => {
                          const uniqueProviders = new Set(group.services.map(s => s.providerName).filter(Boolean));
                          const providerCount = uniqueProviders.size;
                          
                          if (providerCount === 0) {
                            return <div className="text-sm font-semibold text-slate-400 whitespace-nowrap">No Provider</div>;
                          } else if (providerCount === 1) {
                            return <div className="text-sm font-semibold text-slate-900 whitespace-nowrap truncate max-w-[200px]">{[...uniqueProviders][0]}</div>;
                          } else {
                            return (
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                <div className="text-sm font-semibold text-slate-700">Multiple Providers</div>
                                <span className="text-sm text-slate-500 font-medium">({providerCount})</span>
                              </div>
                            );
                          }
                        })()}
                      </TableCell>

                      {/* Service Summary */}
                      <TableCell className="px-6 py-4">
                        {(() => {
                          const serviceCount = group.services.length;
                          
                          if (serviceCount === 0) {
                            return <div className="text-sm font-semibold text-slate-400 whitespace-nowrap">No Service</div>;
                          } else if (serviceCount === 1) {
                            return <div className="text-sm font-semibold text-slate-900 whitespace-nowrap truncate max-w-[200px]">{group.services[0]?.serviceName || 'Unknown'}</div>;
                          } else {
                            return (
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                <div className="text-sm font-semibold text-slate-700">Multiple Services</div>
                                <span className="text-sm text-slate-500 font-medium">({serviceCount})</span>
                              </div>
                            );
                          }
                        })()}
                      </TableCell>

                      {/* Status Summary */}
                      <TableCell className="px-6 py-4">
                        {(() => {
                          const statusCounts: Record<string, number> = {};
                          group.services.forEach(svc => {
                            statusCounts[svc.status] = (statusCounts[svc.status] || 0) + 1;
                          });
                          
                          const statuses = Object.entries(statusCounts);
                          
                          // If all same status - show status name with count
                          if (statuses.length === 1) {
                            const [status, count] = statuses[0];
                            const statusConfig = getServiceRelationshipStatusConfig(status as ServiceRelationshipStatus);
                            return (
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                <span className={cn('inline-block w-2.5 h-2.5 rounded-full shrink-0', statusConfig.dotColor)} />
                                <span className="text-sm font-bold text-slate-900">
                                  {statusConfig.label}
                                </span>
                                {count > 1 && (
                                  <span className="text-sm text-slate-500 font-medium">({count})</span>
                                )}
                              </div>
                            );
                          }
                          
                          // If mixed statuses - show compact badges for each
                          return (
                            <div className="flex flex-wrap gap-1">
                              {statuses.map(([status, count]) => {
                                const statusConfig = getServiceRelationshipStatusConfig(status as ServiceRelationshipStatus);
                                return (
                                  <Badge key={status} className={cn('text-sm px-2 py-0.5 font-bold whitespace-nowrap', statusConfig.badgeClass)}>
                                    <span className={cn('inline-block w-1.5 h-1.5 rounded-full mr-1 shrink-0', statusConfig.dotColor)} />
                                    {count}
                                  </Badge>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </TableCell>

                      {/* Authorization Summary */}
                      <TableCell className="px-6 py-4">
                        {(() => {
                          // Count authorizations by ACTUAL database status only
                          const authCounts = {
                            approved: 0,
                            pending: 0,
                            denied: 0,
                            expired: 0,
                            draft: 0,
                            none: 0,
                          };
                          
                          group.services.forEach(svc => {
                            if (!svc.authorization) {
                              authCounts.none++;
                            } else {
                              // Use actual DB status, not calculated expiring state
                              switch (svc.authorization.status) {
                                case 'APPROVED':
                                  authCounts.approved++;
                                  break;
                                case 'SUBMITTED':
                                  authCounts.pending++;
                                  break;
                                case 'DENIED':
                                  authCounts.denied++;
                                  break;
                                case 'EXPIRED':
                                  authCounts.expired++;
                                  break;
                                case 'DRAFT':
                                  authCounts.draft++;
                                  break;
                                default:
                                  authCounts.none++;
                              }
                            }
                          });
                          
                          // Auth counts calculated - no debug logging in production
                          
                          // Count how many different auth statuses exist (excluding none)
                          const activeStatuses = Object.entries(authCounts)
                            .filter(([key, count]) => key !== 'none' && count > 0);
                          
                          // If only one status (or all none) - show single status
                          if (activeStatuses.length === 0) {
                            return (
                              <span className="text-sm font-semibold text-slate-400 whitespace-nowrap">No Auth</span>
                            );
                          } else if (activeStatuses.length === 1) {
                            const [status, count] = activeStatuses[0];
                            
                            // Show single status with icon
                            if (status === 'expired') {
                              return (
                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                  <XCircle className="w-4 h-4 shrink-0" style={{ color: '#991B1B' }} />
                                  <span className="text-sm font-bold" style={{ color: '#991B1B' }}>
                                    {count} Expired
                                  </span>
                                </div>
                              );
                            } else if (status === 'pending') {
                              return (
                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                  <Clock className="w-4 h-4 shrink-0" style={{ color: '#4EA7FC' }} />
                                  <span className="text-sm font-bold" style={{ color: '#4EA7FC' }}>
                                    {count} Pending
                                  </span>
                                </div>
                              );
                            } else if (status === 'approved') {
                              return (
                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                  <CheckCircle className="w-4 h-4 shrink-0" style={{ color: '#4CB782' }} />
                                  <span className="text-sm font-bold" style={{ color: '#4CB782' }}>
                                    {count} Approved
                                  </span>
                                </div>
                              );
                            } else if (status === 'denied') {
                              return (
                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                  <XCircle className="w-4 h-4 shrink-0" style={{ color: '#FA6563' }} />
                                  <span className="text-sm font-bold" style={{ color: '#FA6563' }}>
                                    {count} Denied
                                  </span>
                                </div>
                              );
                            } else if (status === 'draft') {
                              return (
                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                  <FileText className="w-4 h-4 shrink-0 text-slate-500" />
                                  <span className="text-sm font-bold text-slate-500">
                                    {count} Draft
                                  </span>
                                </div>
                              );
                            }
                          }
                          
                          // Multiple different statuses - show compact badges
                          return (
                            <div className="flex flex-wrap gap-1">
                              {authCounts.expired > 0 && (
                                <Badge className="text-xs px-1.5 py-0.5 font-bold whitespace-nowrap" style={{ backgroundColor: '#991B1B', color: 'white', borderColor: '#991B1B' }}>
                                  <XCircle className="w-2.5 h-2.5 mr-0.5" />
                                  {authCounts.expired}
                                </Badge>
                              )}
                              {authCounts.denied > 0 && (
                                <Badge className="text-xs px-1.5 py-0.5 font-bold whitespace-nowrap" style={{ backgroundColor: '#FA6563', color: 'white', borderColor: '#FA6563' }}>
                                  <XCircle className="w-2.5 h-2.5 mr-0.5" />
                                  {authCounts.denied}
                                </Badge>
                              )}
                              {authCounts.pending > 0 && (
                                <Badge className="text-xs px-1.5 py-0.5 font-bold whitespace-nowrap" style={{ backgroundColor: '#4EA7FC', color: 'white', borderColor: '#4EA7FC' }}>
                                  <Clock className="w-2.5 h-2.5 mr-0.5" />
                                  {authCounts.pending}
                                </Badge>
                              )}
                              {authCounts.approved > 0 && (
                                <Badge className="text-xs px-1.5 py-0.5 font-bold whitespace-nowrap" style={{ backgroundColor: '#4CB782', color: 'white', borderColor: '#4CB782' }}>
                                  <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                                  {authCounts.approved}
                                </Badge>
                              )}
                              {authCounts.draft > 0 && (
                                <Badge className="text-xs px-1.5 py-0.5 font-bold whitespace-nowrap bg-slate-100 text-slate-600 border-slate-300">
                                  <FileText className="w-2.5 h-2.5 mr-0.5" />
                                  {authCounts.draft}
                                </Badge>
                              )}
                            </div>
                          );
                        })()}
                      </TableCell>

                      {/* Issues Summary */}
                      <TableCell className="px-6 py-4">
                        {group.totalActiveIssues > 0 ? (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" style={{ color: '#D97706' }} />
                            <span className="text-sm font-semibold" style={{ color: '#D97706' }}>
                              Issues ({group.totalActiveIssues})
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm font-semibold" style={{ color: '#95A2B3' }}>No Issues</span>
                        )}
                      </TableCell>

                      {/* Empty cell for alignment */}
                      <TableCell className="px-6 py-4"></TableCell>
                    </TableRow>

                    {/* Expanded Rows: Individual Services */}
                    {isExpanded && group.services.map((svc, svcIdx) => {
                      const statusConfig = getServiceRelationshipStatusConfig(svc.status);
                      return (
                        <React.Fragment key={svc._id}>
                        <TableRow
                          className={cn(
                            'transition-all duration-150',
                            'bg-gradient-to-r from-slate-50/60 to-slate-50/30',
                            'border-l-4 border-l-slate-300',
                            'hover:from-blue-50/40 hover:to-indigo-50/20',
                            'hover:border-l-blue-400',
                            'hover:shadow-sm',
                            svcIdx === group.services.length - 1 && 'border-b border-b-slate-200/60'
                          )}
                        >
                          <TableCell className="px-4 py-3"></TableCell>
                          
                          <TableCell className="px-6 py-3 pl-12">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-500 font-medium">↳ Service {svcIdx + 1}</span>
                              {svc.phiReleased && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Shield className="w-3.5 h-3.5 text-green-600" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">PHI Released: {format(new Date(svc.phiReleased.at), 'MMM d, yyyy')}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell className="px-6 py-3">
                            <div className="text-sm text-slate-800 font-medium whitespace-nowrap truncate max-w-[200px]">{svc.providerName}</div>
                          </TableCell>
                          
                          <TableCell className="px-6 py-3">
                            <div className="text-sm text-slate-800 font-medium whitespace-nowrap truncate max-w-[200px]">{svc.serviceName || 'Service'}</div>
                            {svc.serviceCategory && (
                              <div className="text-xs text-slate-500 mt-0.5 whitespace-nowrap truncate">{svc.serviceCategory}</div>
                            )}
                          </TableCell>
                          
                          {/* Status Dropdown */}
                          <TableCell className="px-6 py-3">
                            <Select
                              value={svc.status}
                              onValueChange={(value) => handleStatusChange(svc._id, value)}
                              modal={false}
                            >
                              <SelectTrigger className="h-8 w-full max-w-[140px] text-xs bg-white border-2 hover:border-slate-300 transition-colors whitespace-nowrap">
                                <SelectValue>
                                  <div className="flex items-center gap-2 whitespace-nowrap">
                                    <span className={cn('inline-block w-2 h-2 rounded-full shrink-0', statusConfig.dotColor)} />
                                    <span className="font-medium truncate">{statusConfig.label}</span>
                                  </div>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="bg-white border-2 shadow-lg z-50">
                                <SelectItem value="PENDING_START" className="cursor-pointer">
                                  <div className="flex items-center gap-2 whitespace-nowrap">
                                    <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#F2C94C' }} />
                                    <span>Pending Start</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="ACTIVE" className="cursor-pointer">
                                  <div className="flex items-center gap-2 whitespace-nowrap">
                                    <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#4CB782' }} />
                                    <span>Active</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="PAUSED" className="cursor-pointer">
                                  <div className="flex items-center gap-2 whitespace-nowrap">
                                    <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#BB87FC' }} />
                                    <span>Paused</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="CLOSED" className="cursor-pointer">
                                  <div className="flex items-center gap-2 whitespace-nowrap">
                                    <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#95A2B3' }} />
                                    <span>Closed</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          
                          {/* Authorization */}
                          <TableCell className="px-6 py-3">
                            {renderAuthorization(svc.authorization)}
                          </TableCell>
                          
                          {/* Issues Display */}
                          <TableCell className="px-6 py-3">
                            {svc.activeIssuesCount && svc.activeIssuesCount > 0 ? (
                              <Link href="/case-manager/workspace">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3 text-xs font-medium bg-white transition-all shadow-sm"
                                  style={{ 
                                    borderColor: '#D97706', 
                                    color: '#D97706',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#FFF5E6';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'white';
                                  }}
                                >
                                  <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                                  Items ({svc.activeIssuesCount})
                                </Button>
                              </Link>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedServiceForIssue(svc);
                                  setIssueDialogOpen(true);
                                }}
                                className="h-8 px-3 text-xs font-medium bg-white transition-all shadow-sm"
                                style={{ 
                                  borderColor: '#95A2B3', 
                                  color: '#95A2B3',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#F8F9FA';
                                  e.currentTarget.style.color = '#000';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'white';
                                  e.currentTarget.style.color = '#95A2B3';
                                }}
                              >
                                <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                                Raise Issue
                              </Button>
                            )}
                          </TableCell>
                          
                          {/* Actions Dropdown */}
                          <TableCell className="px-2 py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all duration-200 rounded-md hover:ring-2 hover:ring-slate-200/50"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-64 max-h-[calc(100vh-100px)] overflow-y-auto bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 z-50">
                                <div className="px-2 py-1.5 mb-1">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Actions</p>
                                </div>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedServiceForDrawer(svc._id);
                                    setServiceDrawerOpen(true);
                                  }}
                                  className="rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-150 hover:bg-blue-50/80 focus:bg-blue-50/80 group"
                                >
                                  <Building2 className="w-4 h-4 mr-3 text-slate-500 group-hover:text-blue-600 transition-colors" />
                                  <span className="text-sm font-medium text-slate-700 group-hover:text-blue-900">View Service Details</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedServiceForDrawer(svc._id);
                                    setServiceDrawerOpen(true);
                                  }}
                                  className="rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-150 hover:bg-blue-50/80 focus:bg-blue-50/80 group"
                                >
                                  <MessageSquare className="w-4 h-4 mr-3 text-slate-500 group-hover:text-blue-600 transition-colors" />
                                  <span className="text-sm font-medium text-slate-700 group-hover:text-blue-900">Message Provider</span>
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator className="my-1.5 bg-slate-100" />
                                
                                <div className="px-2 py-1.5 mb-1">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Issues & Problems</p>
                                </div>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedServiceForIssue(svc);
                                    setIssueDialogOpen(true);
                                  }}
                                  className="rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-150 hover:bg-orange-50/80 focus:bg-orange-50/80 group"
                                >
                                  <AlertTriangle className="w-4 h-4 mr-3 text-slate-500 group-hover:text-orange-600 transition-colors" />
                                  <span className="text-sm font-medium text-slate-700 group-hover:text-orange-900">Raise Issue</span>
                                </DropdownMenuItem>
                                {svc.activeIssuesCount && svc.activeIssuesCount > 0 && (
                                  <DropdownMenuItem asChild>
                                    <Link 
                                      href="/case-manager/workspace"
                                      className="rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-150 hover:bg-orange-50/80 focus:bg-orange-50/80 group flex items-center"
                                    >
                                      <AlertTriangle className="w-4 h-4 mr-3 text-orange-500 group-hover:text-orange-700 transition-colors" />
                                      <span className="text-sm font-medium text-slate-700 group-hover:text-orange-900">View Active Issues ({svc.activeIssuesCount})</span>
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                                
                                <DropdownMenuSeparator className="my-1.5 bg-slate-100" />
                                
                                <div className="px-2 py-1.5 mb-1">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Authorization</p>
                                </div>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedServiceForAuth(svc);
                                    setAuthModalOpen(true);
                                  }}
                                  className="rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-150 hover:bg-green-50/80 focus:bg-green-50/80 group"
                                >
                                  <Shield className="w-4 h-4 mr-3 text-slate-500 group-hover:text-green-600 transition-colors" />
                                  <span className="text-sm font-medium text-slate-700 group-hover:text-green-900">
                                    {svc.authorization ? 'Edit Authorization' : 'Create Authorization'}
                                  </span>
                                </DropdownMenuItem>
                                
                                {svc.authorization && (
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setSelectedServiceForAuth(svc);
                                      setAuthModalOpen(true);
                                    }}
                                    className="rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-150 hover:bg-green-50/80 focus:bg-green-50/80 group"
                                  >
                                    <Shield className="w-4 h-4 mr-3 text-green-500 group-hover:text-green-700 transition-colors" />
                                    <span className="text-sm font-medium text-slate-700 group-hover:text-green-900">View Authorization Details</span>
                                  </DropdownMenuItem>
                                )}
                                
                                <DropdownMenuSeparator className="my-1.5 bg-slate-100" />
                                
                                <div className="px-2 py-1.5 mb-1">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Management</p>
                                </div>
                                <DropdownMenuItem 
                                  onClick={() => toast.info('Edit service coming soon')}
                                  className="rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-150 hover:bg-slate-50 focus:bg-slate-50 group"
                                >
                                  <Edit className="w-4 h-4 mr-3 text-slate-500 group-hover:text-slate-700 transition-colors" />
                                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Edit Service Details</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => toast.info('Close service workflow coming soon')}
                                  className="rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-150 hover:bg-slate-50 focus:bg-slate-50 group"
                                >
                                  <XCircle className="w-4 h-4 mr-3 text-slate-500 group-hover:text-slate-700 transition-colors" />
                                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Close Service</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create Issue Dialog */}
      {selectedServiceForIssue && (
        <CreateIssueDialog
          open={issueDialogOpen}
          onOpenChange={setIssueDialogOpen}
          serviceRelationshipId={selectedServiceForIssue._id}
          clientId={selectedServiceForIssue.clientId}
          clientName={`${selectedServiceForIssue.client?.firstName} ${selectedServiceForIssue.client?.lastName}`}
          providerName={selectedServiceForIssue.providerName}
          serviceName={selectedServiceForIssue.serviceName || 'Service'}
          onSuccess={() => {
            mutate(); // Refresh the table data
            setSelectedServiceForIssue(null);
          }}
        />
      )}

      {/* Service Detail Drawer */}
      <ServiceDetailDrawer
        serviceRelationshipId={selectedServiceForDrawer}
        isOpen={serviceDrawerOpen}
        onClose={() => {
          setServiceDrawerOpen(false);
          setSelectedServiceForDrawer(null);
        }}
        onRefresh={() => mutate()}
      />

      {/* Authorization Modal */}
      {selectedServiceForAuth && (
        <AuthorizationModal
          open={authModalOpen}
          onOpenChange={setAuthModalOpen}
          serviceRelationshipId={selectedServiceForAuth._id}
          clientName={`${selectedServiceForAuth.client?.firstName} ${selectedServiceForAuth.client?.lastName}`}
          providerName={selectedServiceForAuth.providerName}
          serviceName={selectedServiceForAuth.serviceName || 'Service'}
          existingAuthorization={selectedServiceForAuth.authorization ? {
            _id: selectedServiceForAuth.authorization._id,
            serviceRelationshipId: selectedServiceForAuth._id,
            status: selectedServiceForAuth.authorization.status as any,
            approvalNumber: selectedServiceForAuth.authorization.approvalNumber,
            startDate: selectedServiceForAuth.authorization.startDate,
            endDate: selectedServiceForAuth.authorization.endDate,
            units: selectedServiceForAuth.authorization.units,
            unitType: selectedServiceForAuth.authorization.unitType as any,
            fundingSource: selectedServiceForAuth.authorization.fundingSource,
            notes: selectedServiceForAuth.authorization.notes,
          } : null}
          onSuccess={() => {
            mutate(); // Refresh table data
            setSelectedServiceForAuth(null);
          }}
        />
      )}

      {/* Client Drawer */}
      {selectedClientId && (
        <ClientDrawer
          clientId={selectedClientId}
          open={clientDrawerOpen}
          onClose={() => {
            setClientDrawerOpen(false);
            setSelectedClientId(null);
          }}
        />
      )}
    </div>
  );
}
