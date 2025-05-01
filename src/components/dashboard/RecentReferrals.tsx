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
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

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
      <Badge variant="outline" className={cn("flex items-center gap-1", statusConfig.className)}>
        <Icon className="h-3 w-3" />
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
      <Badge variant="outline" className={cn("flex items-center gap-1", config.className)}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="hover:shadow-card-hover transition-shadow duration-300">
      <CardHeader>
        <CardTitle>Recent Referrals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-4">Loading referrals...</div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No referrals found
            </div>
          ) : (
            referrals.map((referral) => (
              <div
                key={referral.id}
                className="group relative overflow-hidden rounded-lg border p-6 hover:shadow-md transition-all duration-200"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/10 to-blue-100/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative space-y-4">
                  {/* Header Section */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold group-hover:text-primary-600 transition-colors">
                          {referral.name}
                        </h3>
                        {getUrgencyBadge(referral.service.urgency)}
                      </div>
                      <p className="text-sm text-muted-foreground">{referral.service.type}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(referral.status)}
                      <span className="text-sm text-muted-foreground">
                        Created: {format(new Date(referral.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{referral.contact.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{referral.contact.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {referral.address.street}, {referral.address.city}, {referral.address.state} {referral.address.zipCode}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>DOB: {format(new Date(referral.dateOfBirth), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock4 className="h-4 w-4 text-muted-foreground" />
                        <span>Preferred Contact: {referral.contact.preferredMethod}</span>
                      </div>
                      {referral.insurance.type && (
                        <div className="flex items-center gap-2 text-sm">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span>Insurance: {referral.insurance.type}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Service Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Service Details</h4>
                      {referral.service.counties.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {referral.service.counties.map((county, index) => (
                            <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {county}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {referral.service.notes && (
                        <p className="text-sm text-muted-foreground">{referral.service.notes}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Provider Preferences</h4>
                      <div className="flex flex-wrap gap-2">
                        {referral.preferences.languages.map((lang, index) => (
                          <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                      {referral.preferences.emergencyServices && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          Emergency Services Required
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
} 