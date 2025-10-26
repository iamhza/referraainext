'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/shared/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  X,
  ChevronDown,
  Building2,
  AlertTriangle,
  Shield,
  Activity,
  ArrowUpDown,
  SlidersHorizontal
} from 'lucide-react';
import type { Client } from '@/types';

export interface AdvancedFilters {
  search: string;
  serviceStatuses: ('PENDING_START' | 'ACTIVE' | 'PAUSED' | 'CLOSED')[];
  authStatuses: ('APPROVED' | 'EXPIRING' | 'EXPIRED' | 'SUBMITTED' | 'NO_AUTH')[];
  hasIssues: boolean | null; // null = all, true = with issues, false = no issues
  providers: string[];
}

export type SortOption = 'name' | 'issueCount' | 'serviceCount';

interface AdvancedFilterBarProps {
  clients: Client[];
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  className?: string;
}

// Status configurations - matches table colors exactly
const SERVICE_STATUS_CONFIG = {
  PENDING_START: { label: 'Pending Start', color: '#F2C94C' },
  ACTIVE: { label: 'Active', color: '#4CB782' },
  PAUSED: { label: 'Paused', color: '#BB87FC' },
  CLOSED: { label: 'Closed', color: '#95A2B3' },
};

const AUTH_STATUS_CONFIG = {
  APPROVED: { label: 'Approved', color: '#4CB782' },
  EXPIRING: { label: 'Expiring Soon', color: '#F2994A' },
  EXPIRED: { label: 'Expired', color: '#991B1B' },
  SUBMITTED: { label: 'Pending Review', color: '#4EA7FC' },
  NO_AUTH: { label: 'No Authorization', color: '#95A2B3' },
};

const SORT_OPTIONS = {
  name: 'Client Name (A-Z)',
  issueCount: 'Issue Count',
  serviceCount: 'Service Count',
};

export function AdvancedFilterBar({
  clients,
  filters,
  onFiltersChange,
  sortBy,
  onSortChange,
  className
}: AdvancedFilterBarProps) {
  
  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    count += filters.serviceStatuses.length;
    count += filters.authStatuses.length;
    if (filters.hasIssues !== null) count++;
    count += filters.providers.length;
    return count;
  }, [filters]);

  // Handle filter changes
  const updateFilter = (key: keyof AdvancedFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: 'serviceStatuses' | 'authStatuses' | 'providers', value: string) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(v => v !== value)
      : [...currentArray, value];
    updateFilter(key, newArray);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      serviceStatuses: [],
      authStatuses: [],
      hasIssues: null,
      providers: [],
    });
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Premium Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap bg-gradient-to-r from-slate-50 via-white to-slate-50 p-4 rounded-xl border-2 border-slate-200/60 shadow-sm">
        
        {/* Search - Premium Design */}
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Search clients, providers, services..."
            className="pl-11 pr-10 h-11 bg-white border-2 border-slate-200 focus:border-blue-400 transition-colors shadow-sm text-sm font-medium"
          />
          {filters.search && (
            <button
              onClick={() => updateFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Service Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-11 px-4 bg-white border-2 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Activity className="w-4 h-4 mr-2 text-slate-600" />
              <span className="font-semibold text-slate-700">Status</span>
              {filters.serviceStatuses.length > 0 && (
                <Badge className="ml-2 px-2 h-5 bg-blue-600 text-white text-xs font-bold">
                  {filters.serviceStatuses.length}
                </Badge>
              )}
              <ChevronDown className="w-4 h-4 ml-2 text-slate-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-white border-2 shadow-xl">
            <DropdownMenuLabel className="text-xs font-bold text-slate-600 uppercase tracking-wide">Service Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.entries(SERVICE_STATUS_CONFIG).map(([key, config]) => (
              <DropdownMenuCheckboxItem
                key={key}
                checked={filters.serviceStatuses.includes(key as any)}
                onCheckedChange={() => toggleArrayFilter('serviceStatuses', key)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.color }} />
                  <span className="font-medium">{config.label}</span>
                </div>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Authorization Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-11 px-4 bg-white border-2 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Shield className="w-4 h-4 mr-2 text-slate-600" />
              <span className="font-semibold text-slate-700">Authorization</span>
              {filters.authStatuses.length > 0 && (
                <Badge className="ml-2 px-2 h-5 bg-blue-600 text-white text-xs font-bold">
                  {filters.authStatuses.length}
                </Badge>
              )}
              <ChevronDown className="w-4 h-4 ml-2 text-slate-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-white border-2 shadow-xl">
            <DropdownMenuLabel className="text-xs font-bold text-slate-600 uppercase tracking-wide">Auth Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.entries(AUTH_STATUS_CONFIG).map(([key, config]) => (
              <DropdownMenuCheckboxItem
                key={key}
                checked={filters.authStatuses.includes(key as any)}
                onCheckedChange={() => toggleArrayFilter('authStatuses', key)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.color }} />
                  <span className="font-medium">{config.label}</span>
                </div>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Issues Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-11 px-4 bg-white border-2 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
            >
              <AlertTriangle className="w-4 h-4 mr-2 text-slate-600" />
              <span className="font-semibold text-slate-700">Issues</span>
              {filters.hasIssues !== null && (
                <Badge className="ml-2 px-2 h-5 bg-blue-600 text-white text-xs font-bold">
                  1
                </Badge>
              )}
              <ChevronDown className="w-4 h-4 ml-2 text-slate-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-white border-2 shadow-xl">
            <DropdownMenuLabel className="text-xs font-bold text-slate-600 uppercase tracking-wide">Filter by Issues</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={filters.hasIssues === null}
              onCheckedChange={() => updateFilter('hasIssues', null)}
              className="cursor-pointer"
            >
              <span className="font-medium">All Clients</span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.hasIssues === true}
              onCheckedChange={() => updateFilter('hasIssues', true)}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#D97706' }} />
                <span className="font-medium">Has Issues</span>
              </div>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.hasIssues === false}
              onCheckedChange={() => updateFilter('hasIssues', false)}
              className="cursor-pointer"
            >
              <span className="font-medium">No Issues</span>
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-11 px-4 ml-auto bg-white border-2 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
            >
              <ArrowUpDown className="w-4 h-4 mr-2 text-slate-600" />
              <span className="font-semibold text-slate-700">Sort</span>
              <ChevronDown className="w-4 h-4 ml-2 text-slate-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 bg-white border-2 shadow-xl">
            <DropdownMenuLabel className="text-xs font-bold text-slate-600 uppercase tracking-wide">Sort By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.entries(SORT_OPTIONS).map(([key, label]) => (
              <DropdownMenuCheckboxItem
                key={key}
                checked={sortBy === key}
                onCheckedChange={() => onSortChange(key as SortOption)}
                className="cursor-pointer"
              >
                <span className="font-medium">{label}</span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-11 px-4 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold transition-all"
          >
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filter Chips - Minimal & Elegant */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap px-1">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active:</span>
          
          {filters.serviceStatuses.map(status => {
            const config = SERVICE_STATUS_CONFIG[status as keyof typeof SERVICE_STATUS_CONFIG];
            return (
              <Badge
                key={status}
                className="gap-1.5 cursor-pointer px-2.5 py-1 text-xs font-semibold border-2 transition-all"
                style={{
                  backgroundColor: `${config.color}15`,
                  color: config.color,
                  borderColor: `${config.color}40`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${config.color}25`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${config.color}15`;
                }}
                onClick={() => toggleArrayFilter('serviceStatuses', status)}
              >
                {config.label}
                <X className="w-3 h-3" />
              </Badge>
            );
          })}
          
          {filters.authStatuses.map(status => {
            const config = AUTH_STATUS_CONFIG[status as keyof typeof AUTH_STATUS_CONFIG];
            return (
              <Badge
                key={status}
                className="gap-1.5 cursor-pointer px-2.5 py-1 text-xs font-semibold border-2 transition-all"
                style={{
                  backgroundColor: `${config.color}15`,
                  color: config.color,
                  borderColor: `${config.color}40`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${config.color}25`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${config.color}15`;
                }}
                onClick={() => toggleArrayFilter('authStatuses', status)}
              >
                {config.label}
                <X className="w-3 h-3" />
              </Badge>
            );
          })}
          
          {filters.hasIssues !== null && (
            <Badge
              className="gap-1.5 cursor-pointer px-2.5 py-1 text-xs font-semibold border-2 transition-all"
              style={{
                backgroundColor: filters.hasIssues ? '#D9770615' : '#95A2B315',
                color: filters.hasIssues ? '#D97706' : '#95A2B3',
                borderColor: filters.hasIssues ? '#D9770640' : '#95A2B340',
              }}
              onMouseEnter={(e) => {
                const color = filters.hasIssues ? '#D97706' : '#95A2B3';
                e.currentTarget.style.backgroundColor = `${color}25`;
              }}
              onMouseLeave={(e) => {
                const color = filters.hasIssues ? '#D97706' : '#95A2B3';
                e.currentTarget.style.backgroundColor = `${color}15`;
              }}
              onClick={() => updateFilter('hasIssues', null)}
            >
              {filters.hasIssues ? 'Has Issues' : 'No Issues'}
              <X className="w-3 h-3" />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

