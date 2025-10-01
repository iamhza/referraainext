'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { 
  Search, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Building,
  Calendar,
  RefreshCw,
  XCircle,
  UserCheck,
  Loader2,
  ChevronUp,
  ChevronDown,
  Filter,
  X,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Provider {
  id: string;
  fullName: string;
  email: string;
  displayName?: string;
  organization?: string;
}

interface MongoReferral {
  _id: string;
  clientInfo: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  serviceDetails: {
    type: string;
    urgency?: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
  assignedProvider?: string;
  caseManagerId?: string;
  caseManager?: {
    id: string;
    name: string;
    email: string;
  };
}

interface UIReferral {
  id: string;
  clientId: string;
  clientName: string;
  serviceType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastUpdate: string;
  assignedProvider?: string;
  urgency?: string;
  caseManagerName?: string;
}

export function AdminReferralsTable() {
  const [referrals, setReferrals] = useState<UIReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [updating, setUpdating] = useState<{ [key: string]: boolean }>({});
  
  // Sorting and filtering state
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  const { toast } = useToast();

  // Helper to normalize urgency values
  const normalizeUrgency = (urgency: string): 'high' | 'medium' | 'low' => {
    const normalized = urgency?.toLowerCase();
    if (normalized === 'high' || normalized === 'urgent' || normalized === 'critical' || normalized === 'emergency' || normalized === 'immediate' || normalized === 'asap' || normalized === 'priority') {
      return 'high';
    }
    if (normalized === 'low' || normalized === 'routine' || normalized === 'non-urgent' || normalized === 'nonurgent' || normalized === 'not urgent' || normalized === 'not-urgent') {
      return 'low';
    }
    return 'medium'; // Default to medium for any unrecognized values
  };

  // Fetch referrals
  useEffect(() => {
    async function fetchReferrals() {
      setLoading(true);
      try {
        const response = await fetch('/api/referrals');
        if (!response.ok) throw new Error('Failed to fetch referrals');
        const data = await response.json();
        
        const mappedReferrals: UIReferral[] = data.referrals.map((ref: MongoReferral) => ({
          id: ref._id,
          clientId: ref.clientInfo?._id || '',
          clientName: `${ref.clientInfo?.firstName || 'Unknown'} ${ref.clientInfo?.lastName || 'Client'}`.trim(),
          serviceType: ref.serviceDetails?.type || 'Service',
          status: ref.status || 'unknown',
          createdAt: ref.createdAt,
          updatedAt: ref.updatedAt,
          lastUpdate: formatDistanceToNow(parseISO(ref.updatedAt), { addSuffix: true }),
          assignedProvider: ref.assignedProvider,
          urgency: ref.serviceDetails?.urgency,
          caseManagerName: ref.caseManager?.name || 'Unknown',
        }));
        
        setReferrals(mappedReferrals);
      } catch (error) {
        console.error('Error fetching referrals:', error);
        setError('Failed to load referrals');
      } finally {
        setLoading(false);
      }
    }

    fetchReferrals();
  }, []);

  // Fetch providers
  useEffect(() => {
    async function fetchProviders() {
      try {
        console.log('AdminReferralsTable: Fetching providers...');
        const response = await fetch('/api/providers/all');
        console.log('AdminReferralsTable: Provider API response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('AdminReferralsTable: API error response:', errorText);
          throw new Error(`Failed to fetch providers: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('AdminReferralsTable: Provider API response data:', data);
        console.log('AdminReferralsTable: Number of providers received:', data.providers?.length || 0);
        
        setProviders(data.providers || []);
      } catch (error) {
        console.error('AdminReferralsTable: Error fetching providers:', error);
        setProviders([]);
      } finally {
        setProvidersLoading(false);
      }
    }

    fetchProviders();
  }, []);

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sortField !== field) return <SortAsc className="h-4 w-4 text-gray-400" />;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4 text-secondary-600" /> : 
      <ChevronDown className="h-4 w-4 text-secondary-600" />;
  };

  // Filter and sort referrals
  const filteredAndSortedReferrals = referrals
    .filter((referral) => {
      // Search filter
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        referral.clientName.toLowerCase().includes(searchLower) ||
        referral.serviceType.toLowerCase().includes(searchLower) ||
        referral.status.toLowerCase().includes(searchLower) ||
        referral.caseManagerName?.toLowerCase().includes(searchLower) ||
        (referral.assignedProvider && getProviderDisplayName(referral.assignedProvider).toLowerCase().includes(searchLower));

      // Status filter
      const matchesStatus = statusFilter === 'all' || referral.status === statusFilter;
      
      // Provider filter
      const matchesProvider = providerFilter === 'all' || 
        (providerFilter === 'unassigned' && !referral.assignedProvider) ||
        referral.assignedProvider === providerFilter;
      
      // Urgency filter - normalize urgency values for comparison
      const matchesUrgency = urgencyFilter === 'all' || normalizeUrgency(referral.urgency || '') === urgencyFilter;

      return matchesSearch && matchesStatus && matchesProvider && matchesUrgency;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField as keyof UIReferral];
      let bValue: any = b[sortField as keyof UIReferral];

      // Handle date sorting
      if (sortField === 'createdAt' || sortField === 'updatedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Handle urgency sorting
      if (sortField === 'urgency') {
        const urgencyOrder = { high: 3, medium: 2, low: 1 };
        aValue = urgencyOrder[normalizeUrgency(aValue || '')] || 0;
        bValue = urgencyOrder[normalizeUrgency(bValue || '')] || 0;
      }
      // Handle string sorting
      else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setProviderFilter('all');
    setUrgencyFilter('all');
  };

  // Get unique values for filter options
  const uniqueStatuses = [...new Set(referrals.map(r => r.status))];
  // Use standardized urgency values instead of raw database values
  const uniqueUrgencies = ['high', 'medium', 'low'];

  // Helper to get provider display name from provider ID
  const getProviderDisplayName = (providerId: string): string => {
    if (!providerId || providerId === 'unassigned') return 'Unassigned';
    if (!providers || providers.length === 0) return 'Loading...';
    const provider = providers.find(p => p.id === providerId);
    return provider ? (provider.displayName || provider.fullName || provider.email) : 'Unknown Provider';
  };

  // Helper to get client initials
  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Helper to get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'under_review': {
        label: 'Under Review',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Clock,
      },
      'provider_selection_required': {
        label: 'Provider Selection',
        className: 'bg-secondary-50 text-secondary-700 border-secondary-200',
        icon: UserCheck,
      },
      'matched': {
        label: 'Matched',
        className: 'bg-accent-50 text-accent-700 border-accent-200',
        icon: CheckCircle,
      },
      'in_progress': {
        label: 'In Progress',
        className: 'bg-green-50 text-green-700 border-green-200',
        icon: Clock,
      },
      'completed': {
        label: 'Completed',
        className: 'bg-secondary-50 text-secondary-700 border-secondary-200',
        icon: CheckCircle,
      },
      'cancelled': {
        label: 'Cancelled',
        className: 'bg-red-50 text-red-700 border-red-200',
        icon: XCircle,
      },
    }[status.toLowerCase()] || {
      label: status,
      className: 'bg-gray-50 text-gray-700 border-gray-200',
      icon: AlertCircle,
    };

    const Icon = statusConfig.icon;
    return (
      <Badge className={`${statusConfig.className} font-medium px-3 py-1 rounded-full`}>
        <Icon className="h-3 w-3 mr-1" />
        {statusConfig.label}
      </Badge>
    );
  };

  // Update referral (assign provider)
  const updateReferral = async (referralId: string, assignedProvider: string) => {
    setUpdating(prev => ({ ...prev, [referralId]: true }));
    
    try {
      console.log('Updating referral:', referralId, 'with provider:', assignedProvider);
      
      const response = await fetch(`/api/referrals/${referralId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedProvider }),
      });

      console.log('API response status:', response.status);
      console.log('API response URL:', response.url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to update referral: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('API success response:', responseData);

      // Update local state - also update status to 'matched' if provider was assigned
      setReferrals(prev => prev.map(ref => 
        ref.id === referralId 
          ? { 
              ...ref, 
              assignedProvider, 
              status: assignedProvider ? 'matched' : ref.status,
              lastUpdate: 'just now' 
            }
          : ref
      ));

      toast({
        title: 'Success',
        description: 'Provider assigned successfully',
      });
    } catch (error) {
      console.error('Error updating referral:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign provider',
        variant: 'destructive',
      });
    } finally {
      setUpdating(prev => ({ ...prev, [referralId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-16 text-center text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          Loading referrals...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-16 text-center">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-500">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            All Referrals
            {referrals.length > 0 && (
              <span className="text-gray-500 font-normal ml-2">({referrals.length} total)</span>
            )}
          </h2>
          <p className="text-gray-600 mt-1">Manage and assign providers to referrals</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search referrals by client, service, provider, or case manager..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl shadow-sm border-gray-200 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {(statusFilter !== 'all' || providerFilter !== 'all' || urgencyFilter !== 'all') && (
              <Badge className="bg-blue-100 text-blue-700 text-xs">Active</Badge>
            )}
          </Button>
          
          {(search || statusFilter !== 'all' || providerFilter !== 'all' || urgencyFilter !== 'all') && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent style={{ zIndex: 99999 }}>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {uniqueStatuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Provider Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                <Select value={providerFilter} onValueChange={setProviderFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Providers" />
                  </SelectTrigger>
                  <SelectContent style={{ zIndex: 99999 }}>
                    <SelectItem value="all">All Providers</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {providers && providers.map(provider => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.displayName || provider.fullName || provider.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Urgency Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Urgencies" />
                  </SelectTrigger>
                  <SelectContent style={{ zIndex: 99999 }}>
                    <SelectItem value="all">All Urgencies</SelectItem>
                                  {uniqueUrgencies.map(urgency => (
                <SelectItem key={urgency} value={urgency}>
                  {urgency === 'high' ? 'High Priority' : 
                   urgency === 'medium' ? 'Medium Priority' : 
                   urgency === 'low' ? 'Low Priority' : urgency}
                </SelectItem>
              ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {filteredAndSortedReferrals.length === 0 ? (
          <div className="p-16 text-center">
            <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {search ? 'No referrals found matching your search.' : 'No referrals found.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto relative">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  <TableHead 
                    className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-left cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('clientName')}
                  >
                    <div className="flex items-center gap-1">
                      Client
                      {getSortIcon('clientName')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-left cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('serviceType')}
                  >
                    <div className="flex items-center gap-1">
                      Service Type
                      {getSortIcon('serviceType')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-left cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('urgency')}
                  >
                    <div className="flex items-center gap-1">
                      Urgency
                      {getSortIcon('urgency')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-left cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-left">
                    Assigned Provider
                  </TableHead>
                  <TableHead 
                    className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-left cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('caseManagerName')}
                  >
                    <div className="flex items-center gap-1">
                      Case Manager
                      {getSortIcon('caseManagerName')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-left cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center gap-1">
                      Created
                      {getSortIcon('createdAt')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-left cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('updatedAt')}
                  >
                    <div className="flex items-center gap-1">
                      Last Update
                      {getSortIcon('updatedAt')}
                    </div>
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedReferrals.map((referral, index) => (
                  <TableRow 
                    key={referral.id} 
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                    }`}
                  >
                    {/* Client */}
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-blue-700">
                            {getInitials(referral.clientName)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{referral.clientName}</div>
                          <div className="text-sm text-gray-500">
                            ID: {referral.clientId ? referral.clientId.slice(-8) : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Service Type */}
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{referral.serviceType}</span>
                      </div>
                    </TableCell>

                    {/* Urgency */}
                    <TableCell className="px-6 py-4">
                      {(() => {
                        const urgency = normalizeUrgency(referral.urgency || '');
                        const urgencyConfigs = {
                          high: {
                            label: 'High Priority',
                            className: 'bg-red-50 text-red-700 border-red-200',
                            dot: 'bg-red-500'
                          },
                          medium: {
                            label: 'Medium Priority',
                            className: 'bg-amber-50 text-amber-700 border-amber-200',
                            dot: 'bg-amber-500'
                          },
                          low: {
                            label: 'Low Priority',
                            className: 'bg-green-50 text-green-700 border-green-200',
                            dot: 'bg-green-500'
                          }
                        };
                        const config = urgencyConfigs[urgency];
                        return (
                          <Badge variant="outline" className={`flex items-center gap-1.5 rounded-full text-sm ${config.className}`}>
                            <span className={`inline-block w-2 h-2 rounded-full ${config.dot}`}></span>
                            {config.label}
                          </Badge>
                        );
                      })()}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="px-6 py-4">
                      {getStatusBadge(referral.status)}
                    </TableCell>

                    {/* Assigned Provider */}
                    <TableCell className="px-6 py-4">
                      <Select
                        value={referral.assignedProvider || 'unassigned'}
                        onValueChange={(value) => {
                          const newProvider = value === 'unassigned' ? '' : value;
                          updateReferral(referral.id, newProvider);
                        }}
                        disabled={updating[referral.id] || providersLoading}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue>
                            {updating[referral.id] ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Updating...
                              </div>
                            ) : providersLoading ? (
                              'Loading...'
                            ) : (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <span className="truncate">
                                  {getProviderDisplayName(referral.assignedProvider || '')}
                                </span>
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-h-48" position="popper" side="bottom" align="start" sideOffset={4} avoidCollisions={true} style={{ zIndex: 99999 }}>
                          <div className="p-2">
                            <div className="text-xs font-medium text-gray-500 mb-2">Select Provider</div>
                          </div>
                          <SelectItem value="unassigned">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              Unassigned
                            </div>
                          </SelectItem>
                          <div className="max-h-36 overflow-y-auto">
                            {providers && providers.map((provider) => (
                              <SelectItem key={provider.id} value={provider.id} className="py-2">
                                <div className="flex flex-col gap-0.5">
                                  <div className="font-medium text-sm leading-tight">
                                    {provider.displayName || provider.fullName || provider.email}
                                  </div>
                                  {provider.organization && (
                                    <div className="text-xs text-gray-500 truncate leading-tight">
                                      {provider.organization}
                                    </div>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Case Manager */}
                    <TableCell className="px-6 py-4">
                      <span className="text-gray-900">{referral.caseManagerName}</span>
                    </TableCell>

                    {/* Created */}
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">
                          {format(parseISO(referral.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </TableCell>

                    {/* Last Update */}
                    <TableCell className="px-6 py-4">
                      <span className="text-gray-500">{referral.lastUpdate}</span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/referrals/${referral.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Table footer with record count */}
        {filteredAndSortedReferrals.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {filteredAndSortedReferrals.length} record{filteredAndSortedReferrals.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 