'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  ChevronRight, 
  XCircle, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Search, 
  Filter, 
  SlidersHorizontal, 
  ChevronLeft,
  ChevronDown,
  ArrowDownUp,
  Star,
  MoreHorizontal,
  ChevronsUpDown,
  HelpCircle,
  Activity,
  PlusCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type ReferralStatus = 
  | 'under_review'
  | 'provider_selection_required'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'pending'
  | 'accepted'
  | 'active';

interface MongoReferral {
  _id: string;
  clientInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    preferredContactMethod: string;
    insurance: {
      type: string;
    };
  };
  serviceDetails: {
    type: string;
    urgency: 'high' | 'medium' | 'low';
    counties: string[];
    additionalNotes: string;
  };
  providerPreferences: {
    providerType: string;
    insuranceAccepted: string[];
    languages: string[];
    availableTimes: string[];
    emergencyServices: boolean;
    showAvailableOnly: boolean;
  };
  caseManagerId: string;
  status: ReferralStatus;
  createdAt: string;
  updatedAt: string;
}

interface ReferralsListProps {
  providerId?: string;
  mode?: 'provider' | 'case_manager';
}

export function ReferralsList({ providerId, mode = 'case_manager' }: ReferralsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReferralStatus | 'all'>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<'high' | 'medium' | 'low' | 'all'>('all');
  const [referrals, setReferrals] = useState<MongoReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  // Sorting
  const [sortField, setSortField] = useState<'name' | 'date' | 'status' | 'urgency'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    async function fetchReferrals() {
      try {
        let url = '/api/referrals';
        if (providerId) {
          url += `?assignedProvider=${providerId}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setReferrals(data.referrals);
      } catch (error) {
        console.error('Error fetching referrals:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReferrals();
  }, [providerId]);

  const getStatusConfig = (status: ReferralStatus) => {
    // Define default config for unknown statuses
    const defaultConfig = {
      label: 'Status Unknown',
      icon: HelpCircle,
      className: 'bg-gray-50 text-gray-700 border-gray-200',
      bgColor: 'bg-gray-500',
      color: 'text-gray-700'
    };

    // Map of known status configurations
    const statusConfigs = {
      under_review: {
        label: 'Under Review',
        icon: Clock,
        className: 'bg-amber-50 text-amber-700 border-amber-200',
        bgColor: 'bg-amber-500',
        color: 'text-amber-700'
      },
      provider_selection_required: {
        label: 'Select Provider',
        icon: AlertCircle,
        className: 'bg-blue-50 text-blue-700 border-blue-200',
        bgColor: 'bg-blue-500',
        color: 'text-blue-700'
      },
      in_progress: {
        label: 'In Progress',
        icon: CheckCircle,
        className: 'bg-green-50 text-green-700 border-green-200',
        bgColor: 'bg-green-500',
        color: 'text-green-700'
      },
      completed: {
        label: 'Completed',
        icon: CheckCircle,
        className: 'bg-green-50 text-green-700 border-green-200',
        bgColor: 'bg-green-500',
        color: 'text-green-700'
      },
      cancelled: {
        label: 'Cancelled',
        icon: XCircle,
        className: 'bg-red-50 text-red-700 border-red-200',
        bgColor: 'bg-red-500',
        color: 'text-red-700'
      },
      // Add mappings for other statuses from your API
      pending: {
        label: 'Pending',
        icon: Clock,
        className: 'bg-amber-50 text-amber-700 border-amber-200',
        bgColor: 'bg-amber-500',
        color: 'text-amber-700'
      },
      accepted: {
        label: 'Accepted',
        icon: CheckCircle,
        className: 'bg-green-50 text-green-700 border-green-200',
        bgColor: 'bg-green-500',
        color: 'text-green-700'
      },
      active: {
        label: 'Active',
        icon: Activity,
        className: 'bg-blue-50 text-blue-700 border-blue-200',
        bgColor: 'bg-blue-500',
        color: 'text-blue-700'
      }
    };

    // Return the config for the given status, or the default if not found
    return statusConfigs[status as keyof typeof statusConfigs] || defaultConfig;
  };

  const getUrgencyBadge = (urgency: 'high' | 'medium' | 'low') => {
    const configs = {
      high: {
        label: 'High Priority',
        className: 'bg-red-50 text-red-700 border-red-200 py-1 px-2.5',
        color: 'text-red-700',
        dot: 'bg-red-500'
      },
      medium: {
        label: 'Medium Priority',
        className: 'bg-amber-50 text-amber-700 border-amber-200 py-1 px-2.5',
        color: 'text-amber-700',
        dot: 'bg-amber-500'
      },
      low: {
        label: 'Low Priority',
        className: 'bg-green-50 text-green-700 border-green-200 py-1 px-2.5',
        color: 'text-green-700',
        dot: 'bg-green-500'
      }
    }[urgency];

    return (
      <Badge variant="outline" className={cn("flex items-center gap-1.5 rounded-full text-sm", configs.className)}>
        <span className={`inline-block w-2 h-2 rounded-full ${configs.dot}`}></span>
        {configs.label}
      </Badge>
    );
  };

  const getClientInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Sort the filtered referrals
  const sortReferrals = (referrals: MongoReferral[]) => {
    return [...referrals].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          const nameA = `${a.clientInfo.firstName} ${a.clientInfo.lastName}`;
          const nameB = `${b.clientInfo.firstName} ${b.clientInfo.lastName}`;
          comparison = nameA.localeCompare(nameB);
          break;
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'urgency':
          const urgencyOrder = { high: 3, medium: 2, low: 1 };
          comparison = 
            urgencyOrder[a.serviceDetails.urgency as keyof typeof urgencyOrder] - 
            urgencyOrder[b.serviceDetails.urgency as keyof typeof urgencyOrder];
          break;
      }
      
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  };

  // Filter and paginate referrals
  const filteredReferrals = referrals.filter(referral => {
    const matchesSearch = 
      searchTerm === '' || 
      `${referral.clientInfo.firstName} ${referral.clientInfo.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.serviceDetails.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral._id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || referral.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'all' || referral.serviceDetails.urgency === urgencyFilter;
    
    return matchesSearch && matchesStatus && matchesUrgency;
  });
  
  const sortedReferrals = sortReferrals(filteredReferrals);
  
  // Calculate pagination
  const totalPages = Math.ceil(sortedReferrals.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedReferrals.slice(indexOfFirstItem, indexOfLastItem);
  
  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Toggle sort direction or change sort field
  const handleSort = (field: 'name' | 'date' | 'status' | 'urgency') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to descending when changing fields
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="relative w-full sm:w-auto flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, service, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-2 rounded-full border-gray-200 hover:border-gray-300 focus:border-blue-300 transition-colors"
              />
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className="rounded-full border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-full border-gray-200 hover:border-gray-300 hover:bg-gray-50">
                    <ArrowDownUp className="h-4 w-4 mr-2" />
                    Sort
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl p-1">
                  <DropdownMenuLabel className="text-sm px-3 py-2">Sort Referrals</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleSort('date')} 
                    className={cn(
                      "px-3 py-2 rounded-lg cursor-pointer",
                      sortField === 'date' && "bg-blue-50 text-blue-700"
                    )}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Date Created</span>
                    {sortField === 'date' && (
                      <ChevronDown className={`ml-auto h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleSort('name')}
                    className={cn(
                      "px-3 py-2 rounded-lg cursor-pointer",
                      sortField === 'name' && "bg-blue-50 text-blue-700"
                    )}
                  >
                    <User className="h-4 w-4 mr-2" />
                    <span>Client Name</span>
                    {sortField === 'name' && (
                      <ChevronDown className={`ml-auto h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleSort('status')}
                    className={cn(
                      "px-3 py-2 rounded-lg cursor-pointer",
                      sortField === 'status' && "bg-blue-50 text-blue-700"
                    )}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>Status</span>
                    {sortField === 'status' && (
                      <ChevronDown className={`ml-auto h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleSort('urgency')}
                    className={cn(
                      "px-3 py-2 rounded-lg cursor-pointer",
                      sortField === 'urgency' && "bg-blue-50 text-blue-700"
                    )}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <span>Priority</span>
                    {sortField === 'urgency' && (
                      <ChevronDown className={`ml-auto h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ReferralStatus | 'all')}>
                  <SelectTrigger className="rounded-lg border-gray-200 hover:border-gray-300 focus:border-blue-300 transition-colors">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="provider_selection_required">Select Provider</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Priority</label>
                <Select value={urgencyFilter} onValueChange={(value) => setUrgencyFilter(value as 'high' | 'medium' | 'low' | 'all')}>
                  <SelectTrigger className="rounded-lg border-gray-200 hover:border-gray-300 focus:border-blue-300 transition-colors">
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Items per page</label>
                <Select value={String(itemsPerPage)} onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="rounded-lg border-gray-200 hover:border-gray-300 focus:border-blue-300 transition-colors">
                    <SelectValue placeholder="5 per page" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="5">5 per page</SelectItem>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="20">20 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  className="rounded-lg border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-blue-600 hover:text-blue-700"
                  onClick={() => {
                    setStatusFilter('all');
                    setUrgencyFilter('all');
                    setSearchTerm('');
                    setSortField('date');
                    setSortDirection('desc');
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Results Stats */}
      <div className="flex justify-between items-center">
        <p className="text-gray-600 text-sm">
          Showing <span className="font-medium">{filteredReferrals.length === 0 ? 0 : indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, filteredReferrals.length)}</span> of <span className="font-medium">{filteredReferrals.length}</span> referrals
        </p>
        
        {totalPages > 1 && (
          <div className="text-sm text-gray-600">
            Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
          </div>
        )}
      </div>

      {/* Referrals List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500"></div>
          </div>
        ) : currentItems.length === 0 ? (
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <div className="text-center py-20">
              <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                <Search className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No referrals found</h3>
              <p className="text-gray-600 max-w-lg mx-auto">
                {searchTerm || statusFilter !== 'all' || urgencyFilter !== 'all' 
                  ? "Try adjusting your filters or search criteria to find what you're looking for." 
                  : "You don't have any referrals yet. Create your first referral to get started."}
              </p>
              {!searchTerm && statusFilter === 'all' && urgencyFilter === 'all' && (
                <EnhancedButton 
                  variant="gradient" 
                  rounded="full"
                  className="mt-6 shadow-md hover:shadow-lg transition-all duration-200" 
                  asChild>
                  <Link href="/case-manager/new-referral">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    New Referral
                  </Link>
                </EnhancedButton>
              )}
            </div>
          </Card>
        ) : (
          currentItems.map((referral) => {
            const statusConfig = getStatusConfig(referral.status);
            const StatusIcon = statusConfig.icon;
            const initials = getClientInitials(referral.clientInfo.firstName, referral.clientInfo.lastName);
            const createdDate = new Date(referral.createdAt);
            
            return (
              <Card 
                key={referral._id} 
                className="rounded-xl overflow-hidden border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 group"
              >
                <Link 
                  href={`/case-manager/referrals/${referral._id}`}
                  className="block p-6 hover:bg-blue-50/10"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="hidden sm:block">
                      <div className={`relative h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium text-xl shadow-sm transition-transform duration-200 group-hover:scale-105 ${referral.serviceDetails.urgency === 'high' ? 'ring-2 ring-red-400' : ''}`}>
                        {initials}
                        {referral.serviceDetails.urgency === 'high' && (
                          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-white animate-pulse"></span>
                        )}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                              {referral.clientInfo.firstName} {referral.clientInfo.lastName}
                            </h3>
                            
                            {/* Mobile initials (visible on small screens) */}
                            <div className="sm:hidden inline-flex h-6 w-6 rounded-full bg-blue-100 text-blue-700 text-xs font-medium items-center justify-center mr-1">
                              {initials}
                            </div>
                            
                            {getUrgencyBadge(referral.serviceDetails.urgency)}
                          </div>
                          
                          <p className="text-base text-gray-700 mb-3 truncate">{referral.serviceDetails.type}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                              <span className="truncate">{referral.clientInfo.email}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                              <span>{referral.clientInfo.phone}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                              <span className="truncate">
                                {referral.clientInfo.address.city}, {referral.clientInfo.address.state}
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                              <span>{format(createdDate, 'MMM d, yyyy')}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col md:items-end gap-3 mt-4 md:mt-0">
                          <Badge 
                            variant="outline" 
                            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full text-sm whitespace-nowrap ${statusConfig.className}`}
                          >
                            <StatusIcon className="h-4 w-4" />
                            {statusConfig.label}
                          </Badge>
                          
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline"
                              size="sm" 
                              className="rounded-full group-hover:bg-white/80 border-blue-200 text-blue-700 hover:text-blue-800"
                            >
                              View Details
                              <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
                
                {/* Progress bar at bottom indicating status */}
                <div className="h-1.5 w-full bg-gray-100">
                  <div 
                    className={cn(
                      "h-full transition-all duration-300",
                      referral.status === 'under_review' && "w-1/4 bg-amber-500",
                      referral.status === 'provider_selection_required' && "w-1/2 bg-blue-500",
                      referral.status === 'in_progress' && "w-3/4 bg-green-500",
                      referral.status === 'completed' && "w-full bg-green-600",
                      referral.status === 'cancelled' && "w-full bg-red-500"
                    )}
                  />
                </div>
              </Card>
            );
          })
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                className={cn(
                  "rounded-lg border border-gray-200 hover:border-gray-300 transition-colors",
                  currentPage === 1 && "opacity-50 pointer-events-none"
                )}
              />
            </PaginationItem>
            
            {/* First page */}
            {currentPage > 3 && (
              <PaginationItem>
                <PaginationLink 
                  onClick={() => handlePageChange(1)}
                  className="rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  1
                </PaginationLink>
              </PaginationItem>
            )}
            
            {/* Ellipsis if needed */}
            {currentPage > 4 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            
            {/* Pages around current page */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Calculate which pages to show around the current page
              let pageNum;
              if (currentPage <= 3) {
                // Show first 5 pages
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                // Show last 5 pages
                pageNum = totalPages - 4 + i;
              } else {
                // Show 2 pages before and after current page
                pageNum = currentPage - 2 + i;
              }
              
              // Only show valid page numbers
              if (pageNum > 0 && pageNum <= totalPages) {
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink 
                      onClick={() => handlePageChange(pageNum)}
                      isActive={currentPage === pageNum}
                      className={cn(
                        "rounded-lg transition-colors",
                        currentPage === pageNum 
                          ? "bg-blue-50 text-blue-700 border-blue-200" 
                          : "border border-gray-200 hover:border-gray-300"
                      )}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
              return null;
            }).filter(Boolean)}
            
            {/* Ellipsis if needed */}
            {currentPage < totalPages - 3 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            
            {/* Last page */}
            {currentPage < totalPages - 2 && (
              <PaginationItem>
                <PaginationLink 
                  onClick={() => handlePageChange(totalPages)}
                  className="rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            )}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                className={cn(
                  "rounded-lg border border-gray-200 hover:border-gray-300 transition-colors",
                  currentPage === totalPages && "opacity-50 pointer-events-none"
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
} 