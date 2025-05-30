'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Clock4,
  Languages,
  Building2,
  Shield,
  AlertCircle,
  ChevronRight,
  PlusCircle,
  Inbox
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EnhancedButton } from '@/components/ui/enhanced-button';

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
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface UIReferral {
  id: string;
  name: string;
  dateOfBirth: string;
  contact: {
    email: string;
    phone: string;
    preferredMethod: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  service: {
    type: string;
    urgency: 'high' | 'medium' | 'low';
    counties: string[];
    notes: string;
  };
  preferences: {
    providerType: string;
    insuranceAccepted: string[];
    languages: string[];
    availableTimes: string[];
    emergencyServices: boolean;
  };
  insurance: {
    type: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function RecentReferrals() {
  const [referrals, setReferrals] = useState<UIReferral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReferrals() {
      try {
        const response = await fetch('/api/referrals');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        
        const mappedReferrals: UIReferral[] = data.referrals.map((ref: MongoReferral) => ({
          id: ref._id,
          name: `${ref.clientInfo.firstName} ${ref.clientInfo.lastName}`,
          dateOfBirth: ref.clientInfo.dateOfBirth,
          contact: {
            email: ref.clientInfo.email,
            phone: ref.clientInfo.phone,
            preferredMethod: ref.clientInfo.preferredContactMethod
          },
          address: ref.clientInfo.address,
          service: {
            type: ref.serviceDetails.type,
            urgency: ref.serviceDetails.urgency,
            counties: ref.serviceDetails.counties,
            notes: ref.serviceDetails.additionalNotes
          },
          preferences: {
            providerType: ref.providerPreferences.providerType,
            insuranceAccepted: ref.providerPreferences.insuranceAccepted,
            languages: ref.providerPreferences.languages,
            availableTimes: ref.providerPreferences.availableTimes,
            emergencyServices: ref.providerPreferences.emergencyServices
          },
          insurance: ref.clientInfo.insurance,
          status: ref.status,
          createdAt: ref.createdAt,
          updatedAt: ref.updatedAt
        }));
        
        setReferrals(mappedReferrals);
      } catch (error) {
        console.error('Error fetching referrals:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReferrals();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'under_review': {
        variant: 'secondary',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Clock,
        label: 'Under Review'
      },
      'in_progress': {
        variant: 'secondary',
        className: 'bg-green-50 text-green-700 border-green-200',
        icon: CheckCircle,
        label: 'In Progress'
      },
      'completed': {
        variant: 'secondary',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: CheckCircle,
        label: 'Completed'
      },
      'cancelled': {
        variant: 'secondary',
        className: 'bg-red-50 text-red-700 border-red-200',
        icon: XCircle,
        label: 'Cancelled'
      }
    }[status] || {
      variant: 'secondary',
      className: 'bg-gray-50 text-gray-700 border-gray-200',
      icon: Clock,
      label: status
    };

    const Icon = statusConfig.icon;
    return (
      <Badge variant="outline" className={cn("flex items-center gap-1 py-1 px-2 text-sm", statusConfig.className)}>
        <Icon className="h-3.5 w-3.5" />
        {statusConfig.label}
      </Badge>
    );
  };

  const getUrgencyBadge = (urgency?: string) => {
    if (!urgency) return null;
    
    type UrgencyConfig = {
      [key in 'high' | 'medium' | 'low']: {
        className: string;
        label: string;
      };
    };

    const urgencyConfig: UrgencyConfig = {
      high: {
        className: 'bg-red-50 text-red-700 border-red-200',
        label: 'High Priority'
      },
      medium: {
        className: 'bg-amber-50 text-amber-700 border-amber-200',
        label: 'Medium Priority'
      },
      low: {
        className: 'bg-green-50 text-green-700 border-green-200',
        label: 'Low Priority'
      }
    };

    const config = urgencyConfig[urgency as keyof UrgencyConfig];
    if (!config) return null;

    return (
      <Badge variant="outline" className={cn("flex items-center gap-1 py-1 px-2 text-sm", config.className)}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="rounded-2xl hover:shadow-lg transition-all duration-300 border-gray-100">
      <CardHeader className="border-b pb-4 px-8 pt-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-semibold">Recent Referrals</CardTitle>
          {!loading && referrals.length > 0 && (
            <Button variant="outline" size="sm" className="text-blue-600 text-base hover:text-blue-700 hover:bg-blue-50 transition-colors rounded-full">
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-8">
        {loading ? (
          <div className="flex justify-center items-center p-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        ) : referrals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-blue-50 p-4 mb-4">
              <Inbox className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-medium">No referrals yet</h3>
            <p className="text-base text-gray-600 max-w-md mt-2 mb-5">
              Create your first referral to get started with matching clients to providers.
            </p>
            <EnhancedButton variant="gradient" size="lg" rounded="full" className="shadow-md hover:shadow-lg transition-all duration-200" asChild>
              <Link href="/case-manager/new-referral">
                <PlusCircle className="mr-2 h-5 w-5" />
                New Referral
              </Link>
            </EnhancedButton>
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            {referrals.map((referral) => (
              <Link
                key={referral.id}
                href={`/case-manager/referrals/${referral.id}`}
                className="group relative block overflow-hidden rounded-xl border border-gray-100 hover:border-blue-200 bg-white hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label={`View details for referral ${referral.name}`}
              >
                <div className="p-6">
                  <div className="flex items-start gap-5">
                    {/* Client Avatar/Initials */}
                    <div className="flex-shrink-0">
                      <div className="relative h-14 w-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium text-xl shadow-sm transform group-hover:scale-110 transition-transform duration-200">
                        {referral.name.split(' ').map(name => name[0]).join('').substring(0, 2).toUpperCase()}
                        {referral.service.urgency === 'high' && (
                          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-white animate-pulse"></span>
                        )}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {referral.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(referral.status)}
                          {getUrgencyBadge(referral.service.urgency)}
                        </div>
                      </div>

                      <p className="mb-3 text-base text-gray-600">{referral.service.type}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-2">
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate">{referral.contact.email}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{referral.contact.phone}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate">
                            {referral.address.city}, {referral.address.state}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <span>Created {format(new Date(referral.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Arrow indicator - visible on hover */}
                    <div className="flex-shrink-0 self-center bg-blue-50 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <ChevronRight className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </div>
                
                {/* Progress bar at bottom indicating status */}
                <div className="h-1.5 w-full bg-gray-100">
                  <div 
                    className={cn(
                      "h-full transition-all duration-500",
                      referral.status === 'under_review' && "w-1/4 bg-amber-500",
                      referral.status === 'provider_selection_required' && "w-1/2 bg-blue-500",
                      referral.status === 'in_progress' && "w-3/4 bg-green-500",
                      referral.status === 'completed' && "w-full bg-green-600",
                      referral.status === 'cancelled' && "w-full bg-red-500"
                    )}
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 