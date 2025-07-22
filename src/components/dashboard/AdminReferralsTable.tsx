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
  Loader2
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
  const { toast } = useToast();

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
        console.log('Fetching providers...');
        const response = await fetch('/api/providers');
        console.log('Provider API response status:', response.status);
        if (!response.ok) throw new Error('Failed to fetch providers');
        const data = await response.json();
        console.log('Provider API response data:', data);
        setProviders(data.providers);
      } catch (error) {
        console.error('Error fetching providers:', error);
        setProviders([]);
      } finally {
        setProvidersLoading(false);
      }
    }

    fetchProviders();
  }, []);

  // Filter referrals based on search
  const filteredReferrals = referrals.filter((referral) => {
    const searchLower = search.toLowerCase();
    return (
      referral.clientName.toLowerCase().includes(searchLower) ||
      referral.serviceType.toLowerCase().includes(searchLower) ||
      referral.status.toLowerCase().includes(searchLower) ||
      (referral.assignedProvider && getProviderDisplayName(referral.assignedProvider).toLowerCase().includes(searchLower))
    );
  });

  // Helper to get provider display name from provider ID
  const getProviderDisplayName = (providerId: string): string => {
    if (!providerId || providerId === 'unassigned') return 'Unassigned';
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
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        icon: Clock,
      },
      'provider_selection_required': {
        label: 'Provider Selection',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: UserCheck,
      },
      'in_progress': {
        label: 'In Progress',
        className: 'bg-green-50 text-green-700 border-green-200',
        icon: Clock,
      },
      'completed': {
        label: 'Completed',
        className: 'bg-green-50 text-green-700 border-green-200',
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

      // Update local state
      setReferrals(prev => prev.map(ref => 
        ref.id === referralId 
          ? { ...ref, assignedProvider, lastUpdate: 'just now' }
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

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search referrals by client, service, or provider..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl shadow-sm border-gray-200 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {filteredReferrals.length === 0 ? (
          <div className="p-16 text-center">
            <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {search ? 'No referrals found matching your search.' : 'No referrals found.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-left">
                    Client
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-left">
                    Service Type
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-left">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-left">
                    Assigned Provider
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-left">
                    Case Manager
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-left">
                    Created
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-left">
                    Last Update
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReferrals.map((referral, index) => (
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
                        {referral.urgency === 'high' && (
                          <Badge className="bg-red-50 text-red-700 border-red-200 text-xs">
                            Urgent
                          </Badge>
                        )}
                      </div>
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
                                {getProviderDisplayName(referral.assignedProvider || '')}
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              Unassigned
                            </div>
                          </SelectItem>
                          {providers.map((provider) => (
                            <SelectItem key={provider.id} value={provider.id}>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                {provider.displayName || provider.fullName || provider.email}
                              </div>
                            </SelectItem>
                          ))}
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
        {filteredReferrals.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {filteredReferrals.length} record{filteredReferrals.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 