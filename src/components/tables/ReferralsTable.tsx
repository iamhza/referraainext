'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Search, 
  Eye, 
  MessageSquare, 
  Calendar, 
  User, 
  Building, 
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  Filter,
  PlusCircle,
  RefreshCw,
  ArrowRight,
  Globe,
  FileText,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import Link from 'next/link';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { ReferralStatus, getStatusConfig } from '@/types/index';
import { capitalizeName, formatStatus, formatServiceType } from '@/lib/formatting';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MongoReferral {
  _id: string;
  clientInfo: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address?: {
      city: string;
      state: string;
    };
  };
  serviceDetails: {
    type: string;
    urgency: 'high' | 'medium' | 'low';
  };
  status: ReferralStatus;
  createdAt: string;
  updatedAt: string;
  caseManager?: {
    name: string;
    email: string;
  };
  assignedProvider?: {
    name: string;
  };
  isOpenToNetwork?: boolean;
  networkExpiry?: string;
}

interface ReferralsTableProps {
  role: 'case_manager' | 'provider';
  providerId?: string;
  showNetworkColumn?: boolean;
  onCreateClick?: () => void;
}

export function ReferralsTable({ 
  role, 
  providerId, 
  showNetworkColumn = false,
  onCreateClick 
}: ReferralsTableProps) {
  const [referrals, setReferrals] = useState<MongoReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deletingReferralId, setDeletingReferralId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchReferrals() {
      setLoading(true);
      try {
        let apiUrl = '/api/referrals';
        if (role === 'provider' && providerId) {
          apiUrl = `/api/referrals?providerId=${providerId}`;
        }
        
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error('Failed to fetch referrals');
        const data = await res.json();
        setReferrals(data.referrals || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load referrals');
      } finally {
        setLoading(false);
      }
    }
    fetchReferrals();
  }, [role, providerId]);

  const handleDeleteReferral = async (referralId: string) => {
    if (!confirm('Are you sure you want to delete this referral? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingReferralId(referralId);
      
      const response = await fetch(`/api/referrals/${referralId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete referral');
      }

      // Remove the referral from the local state
      setReferrals(prev => prev.filter(r => r._id !== referralId));
      
      toast({
        title: "Referral Deleted",
        description: "The referral has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting referral:', error);
      toast({
        title: "Error",
        description: "Failed to delete referral. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingReferralId(null);
    }
  };

  const filteredReferrals = referrals.filter(
    (referral) =>
      `${referral.clientInfo.firstName} ${referral.clientInfo.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      referral.clientInfo.email?.toLowerCase().includes(search.toLowerCase()) ||
      referral.serviceDetails.type.toLowerCase().includes(search.toLowerCase())
  );

  const getUrgencyBadge = (urgency: 'high' | 'medium' | 'low') => {
    const configs = {
      high: {
        label: 'High Priority',
        className: 'bg-red-100 text-red-800 border-red-200'
      },
      medium: {
        label: 'Medium Priority',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      },
      low: {
        label: 'Low Priority',
        className: 'bg-green-100 text-green-800 border-green-200'
      }
    };
    
    const config = configs[urgency];
    return (
      <Badge variant="outline" className={`text-xs border ${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  const getClientInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const refreshReferrals = async () => {
    setLoading(true);
    try {
      let apiUrl = '/api/referrals';
      if (role === 'provider' && providerId) {
        apiUrl = `/api/referrals?providerId=${providerId}`;
      }
      
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Failed to fetch referrals');
      const data = await res.json();
      setReferrals(data.referrals || []);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh referrals');
    } finally {
      setLoading(false);
    }
  };

  const getStatsSummary = () => {
    if (referrals.length === 0) return null;
    
    const statusCounts = referrals.reduce((acc, referral) => {
      acc[referral.status] = (acc[referral.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="flex items-center gap-3 flex-wrap">
        {Object.entries(statusCounts).map(([status, count]) => {
          const config = getStatusConfig(status as ReferralStatus);
          return (
            <span key={status} className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${config.className.includes('red') ? 'bg-red-400' : 
                config.className.includes('yellow') ? 'bg-yellow-400' : 
                config.className.includes('green') ? 'bg-green-400' : 
                config.className.includes('blue') ? 'bg-blue-400' : 'bg-gray-400'}`} 
              />
              {count} {config.label}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with stats and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-gray-900">
            {role === 'case_manager' ? 'Manage Referrals' : 'My Referrals'}
          </h1>
          {getStatsSummary()}
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={refreshReferrals}
            className="text-sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {role === 'case_manager' && onCreateClick && (
            <Button 
              onClick={onCreateClick}
              className="text-sm"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Referral
            </Button>
          )}
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search referrals by client, email, or service type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 rounded-xl shadow-sm border-gray-200 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      {/* Table container */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-fade-in">
        {loading ? (
          <div className="p-16 text-center text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            Loading referrals...
          </div>
        ) : error ? (
          <div className="p-16 text-center text-red-500">{error}</div>
        ) : filteredReferrals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-medium text-gray-700 mb-2">No referrals found</h2>
            <p className="text-gray-500 mb-6">
              {referrals.length === 0 
                ? (role === 'provider' 
                    ? "You don't have any referrals assigned yet. Referrals will appear here once they are assigned to you."
                    : "Get started by creating your first referral."
                  )
                : "Try adjusting your search to find specific referrals."
              }
            </p>
            {referrals.length === 0 && role === 'case_manager' && onCreateClick && (
              <Button onClick={onCreateClick} className="px-4 py-2">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create First Referral
              </Button>
            )}
          </div>
        ) : (
          <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 text-left w-[25%]">
                    Client
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3 text-left w-[20%]">
                    Service Type
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3 text-left w-[15%]">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3 text-left w-[15%] hidden lg:table-cell">
                    Priority
                  </TableHead>
                  {showNetworkColumn && (
                    <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3 text-left w-[10%] hidden xl:table-cell">
                      Network
                    </TableHead>
                  )}
                  {role === 'case_manager' && (
                    <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3 text-left w-[15%] hidden xl:table-cell">
                      Provider
                    </TableHead>
                  )}
                  {role === 'provider' && (
                    <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3 text-left w-[15%] hidden xl:table-cell">
                      Case Manager
                    </TableHead>
                  )}
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3 text-left w-[15%] hidden 2xl:table-cell">
                    Created
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 text-right w-[15%]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReferrals.map((referral, index) => {
                  const statusConfig = getStatusConfig(referral.status);
                  const initials = getClientInitials(referral.clientInfo.firstName, referral.clientInfo.lastName);
                  
                  return (
                    <TableRow 
                      key={referral._id} 
                      className={`border-b border-gray-200 hover:bg-accent-100 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      {/* Client Cell */}
                      <TableCell className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-accent-800 truncate">
                              {capitalizeName(referral.clientInfo.firstName)} {capitalizeName(referral.clientInfo.lastName)}
                            </div>
                            <div className="text-sm text-gray-600 truncate">
                              {referral.clientInfo.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Service Type Cell */}
                      <TableCell className="px-3 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {formatServiceType(referral.serviceDetails.type)}
                        </div>
                      </TableCell>

                      {/* Status Cell */}
                      <TableCell className="px-3 py-4">
                        <Badge variant="outline" className={`${statusConfig.className} text-xs border`}>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>

                      {/* Priority Cell */}
                      <TableCell className="px-3 py-4 hidden lg:table-cell">
                        {getUrgencyBadge(referral.serviceDetails.urgency)}
                      </TableCell>

                      {/* Network Status Cell */}
                      {showNetworkColumn && (
                        <TableCell className="px-3 py-4 hidden xl:table-cell">
                          {referral.isOpenToNetwork ? (
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3 text-blue-600" />
                              <span className="text-xs text-blue-600">Open</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Private</span>
                          )}
                        </TableCell>
                      )}

                      {/* Provider/Case Manager Cell */}
                      {role === 'case_manager' && (
                        <TableCell className="px-3 py-4 hidden xl:table-cell">
                          {referral.assignedProvider ? (
                            <div className="text-sm text-gray-900 truncate">
                              {referral.assignedProvider.name}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Unassigned</span>
                          )}
                        </TableCell>
                      )}
                      
                      {role === 'provider' && (
                        <TableCell className="px-3 py-4 hidden xl:table-cell">
                          {referral.caseManager ? (
                            <div className="text-sm text-gray-900 truncate">
                              {referral.caseManager.name || referral.caseManager.email?.split('@')[0]}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Unknown</span>
                          )}
                        </TableCell>
                      )}

                      {/* Created Date Cell */}
                      <TableCell className="px-3 py-4 hidden 2xl:table-cell">
                        <div className="text-sm text-gray-600">
                          {format(parseISO(referral.createdAt), 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDistanceToNow(parseISO(referral.createdAt), { addSuffix: true })}
                        </div>
                      </TableCell>

                      {/* Actions Cell */}
                      <TableCell className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={role === 'case_manager' ? `/case-manager/referrals/${referral._id}` : `/provider/referrals/${referral._id}`}>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 text-xs h-7"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </Link>
                          
                          {/* Workspace/Communication button based on status */}
                          {(['confirmed', 'in_progress', 'active', 'accepted', 'completed'].includes(referral.status)) && (
                            <Link href={role === 'case_manager' 
                              ? `/case-manager/referrals/${referral._id}/workspace`
                              : `/provider/referrals/${referral._id}/workspace`
                            }>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 px-3 text-xs h-7"
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Workspace
                              </Button>
                            </Link>
                          )}
                          
                          {/* Delete button for case managers */}
                          {role === 'case_manager' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteReferral(referral._id)}
                              disabled={deletingReferralId === referral._id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 text-xs h-7"
                              title="Delete referral"
                            >
                              {deletingReferralId === referral._id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Table footer with record count */}
        {!loading && !error && filteredReferrals.length > 0 && (
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
