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
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { 
  PlusCircle, 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Building,
  Calendar,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { capitalizeName, formatStatus, formatServiceType } from '@/lib/formatting';

interface MongoReferral {
  _id: string;
  clientInfo: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  serviceDetails: {
    type: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
  assignedProvider?: {
    name: string;
  };
  assignmentDate?: string;
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
  providerName?: string;
  assignmentDate?: string;
}

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<UIReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = searchParams?.get('filter');

  useEffect(() => {
    async function fetchReferrals() {
      setLoading(true);
      try {
        const response = await fetch('/api/referrals');
        if (!response.ok) throw new Error('Failed to fetch referrals');
        const data = await response.json();
        
        const mappedReferrals: UIReferral[] = data.referrals.map((ref: MongoReferral) => ({
          id: ref._id,
          clientId: ref.clientInfo._id,
          clientName: capitalizeName(`${ref.clientInfo.firstName} ${ref.clientInfo.lastName}`),
          serviceType: formatServiceType(ref.serviceDetails.type),
          status: ref.status,
          createdAt: ref.createdAt,
          updatedAt: ref.updatedAt,
          lastUpdate: formatDistanceToNow(parseISO(ref.updatedAt), { addSuffix: true }),
          providerName: ref.assignedProvider?.name ? capitalizeName(ref.assignedProvider.name) : undefined,
          assignmentDate: ref.assignmentDate ? format(parseISO(ref.assignmentDate), 'MMM d, yyyy') : undefined,
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

  // Filter referrals based on search and URL filter
  const filteredReferrals = referrals.filter((referral) => {
    const matchesSearch = 
      referral.clientName.toLowerCase().includes(search.toLowerCase()) ||
      referral.serviceType.toLowerCase().includes(search.toLowerCase()) ||
      referral.providerName?.toLowerCase().includes(search.toLowerCase()) ||
      referral.status.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    // Apply URL filter if present
    if (filter === 'matched') {
      return referral.status.toLowerCase() === 'matched';
    }
    if (filter === 'follow-up') {
      return ['in_progress', 'pending'].includes(referral.status.toLowerCase());
    }
    if (filter === 'needs-update') {
      return referral.status.toLowerCase() === 'in_progress';
    }

    return true;
  });

  // Calculate metrics
  const totalReferrals = referrals.length;
  const pendingReferrals = referrals.filter(r => r.status.toLowerCase() === 'pending').length;
  const inProgressReferrals = referrals.filter(r => r.status.toLowerCase() === 'in_progress').length;
  const completedReferrals = referrals.filter(r => r.status.toLowerCase() === 'completed').length;

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'matched':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200"><User className="w-3 h-3 mr-1" />Matched</Badge>;
      default:
        return <Badge variant="secondary">{formatStatus(status)}</Badge>;
    }
  };

  // Helper for avatar/initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-10 px-4">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-10 px-4">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Referrals</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 animate-fade-in">
      {/* Clean header with inline metrics */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Referrals
            {filter && (
              <span className="text-lg font-normal text-gray-500 ml-2">
                • {filter === 'matched' ? 'Awaiting Provider Selection' : 
                    filter === 'follow-up' ? 'Needs Follow-up' : 
                    filter === 'needs-update' ? 'Needs Update' : 'Filtered'}
              </span>
            )}
          </h1>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              {completedReferrals} completed
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              {inProgressReferrals} in progress
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              {pendingReferrals} pending
            </span>
            <span className="text-gray-400">•</span>
            <span>{totalReferrals} total</span>
          </div>
        </div>
        <Button asChild>
          <Link href="/case-manager/new-referral">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Referral
          </Link>
        </Button>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search referrals by client, service type, or provider..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Results summary */}
      <div className="mb-4">
        <p className="text-sm text-gray-500">
          Showing {filteredReferrals.length} of {totalReferrals} referrals
          {search && ` matching "${search}"`}
        </p>
      </div>

      {/* Referrals table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200">
              <TableHead className="font-medium text-gray-900">Client</TableHead>
              <TableHead className="font-medium text-gray-900">Service Type</TableHead>
              <TableHead className="font-medium text-gray-900">Status</TableHead>
              <TableHead className="font-medium text-gray-900">Provider</TableHead>
              <TableHead className="font-medium text-gray-900">Created</TableHead>
              <TableHead className="font-medium text-gray-900">Last Update</TableHead>
              <TableHead className="font-medium text-gray-900">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReferrals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="h-8 w-8 text-gray-400" />
                    <p className="text-gray-500">
                      {search ? 'No referrals found matching your search.' : 'No referrals found.'}
                    </p>
                    {!search && (
                      <Button asChild className="mt-2">
                        <Link href="/case-manager/new-referral">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create First Referral
                        </Link>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredReferrals.map((referral) => (
                <TableRow key={referral.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-blue-700">
                          {getInitials(referral.clientName)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{referral.clientName}</div>
                        <div className="text-sm text-gray-500">ID: {referral.clientId.slice(-8)}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{referral.serviceType}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(referral.status)}
                  </TableCell>
                  <TableCell>
                    {referral.providerName ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{referral.providerName}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">
                        {format(parseISO(referral.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-500">{referral.lastUpdate}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/case-manager/referrals/${referral.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/case-manager/clients/${referral.clientId}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 