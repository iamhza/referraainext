'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, CheckCircle, AlertCircle, Calendar, ChevronRight, XCircle, MapPin, User, Phone, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { format } from 'date-fns';

type ReferralStatus = 
  | 'under_review'
  | 'provider_selection_required'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

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

export function ReferralsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReferralStatus | 'all'>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<'high' | 'medium' | 'low' | 'all'>('all');
  const [referrals, setReferrals] = useState<MongoReferral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReferrals() {
      try {
        const response = await fetch('/api/referrals');
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
  }, []);

  const getStatusConfig = (status: ReferralStatus) => {
    const configs = {
      under_review: {
        label: 'Under Review',
        icon: Clock,
        className: 'bg-amber-50 text-amber-700 border-amber-200 shadow-amber-100/50'
      },
      provider_selection_required: {
        label: 'Select Provider',
        icon: AlertCircle,
        className: 'bg-blue-50 text-blue-700 border-blue-200 shadow-blue-100/50'
      },
      in_progress: {
        label: 'In Progress',
        icon: CheckCircle,
        className: 'bg-green-50 text-green-700 border-green-200 shadow-green-100/50'
      },
      completed: {
        label: 'Completed',
        icon: CheckCircle,
        className: 'bg-green-50 text-green-700 border-green-200 shadow-green-100/50'
      },
      cancelled: {
        label: 'Cancelled',
        icon: XCircle,
        className: 'bg-red-50 text-red-700 border-red-200 shadow-red-100/50'
      }
    }[status];

    return configs;
  };

  const getUrgencyBadge = (urgency: 'high' | 'medium' | 'low') => {
    const configs = {
      high: {
        label: 'High Priority',
        className: 'bg-red-50 text-red-700 border-red-200'
      },
      medium: {
        label: 'Medium Priority',
        className: 'bg-amber-50 text-amber-700 border-amber-200'
      },
      low: {
        label: 'Low Priority',
        className: 'bg-green-50 text-green-700 border-green-200'
      }
    }[urgency];

    return (
      <Badge variant="outline" className={cn("flex items-center gap-1", configs.className)}>
        {configs.label}
      </Badge>
    );
  };

  const getActionButton = (referral: MongoReferral) => {
    const baseClasses = cn(
      "border-gray-200/50 hover:border-gray-300/50",
      "transition-all duration-200",
      "hover:shadow-md"
    );

    if (referral.status === 'in_progress') {
      return (
        <Button variant="outline" size="sm" className={baseClasses} asChild>
          <Link href={`/case-manager/referrals/${referral._id}/active`}>
            View Tracker
          </Link>
        </Button>
      );
    }

    return (
      <Button variant="outline" size="sm" className={baseClasses} asChild>
        <Link href={`/case-manager/referrals/${referral._id}`}>
          View Details
        </Link>
      </Button>
    );
  };

  const filteredReferrals = referrals.filter(referral => {
    const matchesSearch = 
      searchTerm === '' || 
      referral.clientInfo.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.clientInfo.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.serviceDetails.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral._id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || referral.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'all' || referral.serviceDetails.urgency === urgencyFilter;
    
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  return (
    <div className="space-y-6">
      <Card className={cn(
        "p-4 border-none",
        "bg-white/50 backdrop-blur-sm",
        "shadow-lg shadow-gray-100/50",
        "animate-in fade-in-50 duration-500"
      )}>
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search referrals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "sm:w-[300px]",
              "transition-all duration-200",
              "focus:ring-2 focus:ring-blue-100",
              "border-gray-200/50",
              "bg-white shadow-sm"
            )}
          />
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ReferralStatus | 'all')}>
            <SelectTrigger className={cn(
              "sm:w-[200px]",
              "border-gray-200/50",
              "bg-white shadow-sm",
              "transition-all duration-200",
              "focus:ring-2 focus:ring-blue-100"
            )}>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="provider_selection_required">Select Provider</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={urgencyFilter} onValueChange={(value) => setUrgencyFilter(value as 'high' | 'medium' | 'low' | 'all')}>
            <SelectTrigger className={cn(
              "sm:w-[200px]",
              "border-gray-200/50",
              "bg-white shadow-sm",
              "transition-all duration-200",
              "focus:ring-2 focus:ring-blue-100"
            )}>
              <SelectValue placeholder="Filter by urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Urgencies</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">Loading referrals...</div>
        ) : filteredReferrals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No referrals found</div>
        ) : (
          filteredReferrals.map((referral) => {
            const statusConfig = getStatusConfig(referral.status);
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={referral._id} className={cn(
                "relative overflow-hidden",
                "border border-gray-100/50",
                "hover:shadow-lg hover:border-gray-200/50",
                "transition-all duration-300 ease-in-out",
                "animate-in fade-in-50 duration-500",
                "bg-white/50 backdrop-blur-sm",
                "group"
              )}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/10 to-blue-100/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold group-hover:text-primary-600 transition-colors">
                            {referral.clientInfo.firstName} {referral.clientInfo.lastName}
                          </h3>
                          {getUrgencyBadge(referral.serviceDetails.urgency)}
                        </div>
                        <p className="text-sm text-muted-foreground">{referral.serviceDetails.type}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{referral.clientInfo.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{referral.clientInfo.phone}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {referral.clientInfo.address.street}, {referral.clientInfo.address.city}, {referral.clientInfo.address.state} {referral.clientInfo.address.zipCode}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Created: {format(new Date(referral.createdAt), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-4">
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4" />
                        <Badge variant="outline" className={statusConfig.className}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {getActionButton(referral)}
                        {referral.status !== 'completed' && referral.status !== 'cancelled' && (
                          <Button 
                            size="sm"
                            className={cn(
                              "bg-blue-500 hover:bg-blue-600",
                              "transition-all duration-200",
                              "hover:shadow-md hover:shadow-blue-100"
                            )}
                          >
                            Update Status
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
} 