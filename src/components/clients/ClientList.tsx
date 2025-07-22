'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Calendar, MapPin, Phone, Mail, Shield, FileText, Languages, Accessibility, Home, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { formatSafeDate } from '@/lib/date-utils';

export function ClientList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data - replace with real data later
  const clients = [
    {
      _id: 'CLT-001',
      firstName: 'John',
      lastName: 'Doe',
      status: 'ACTIVE_STABLE',
      city: 'Minneapolis',
      state: 'MN',
      phone: '(612) 555-0123',
      email: 'john.doe@email.com',
      dateOfBirth: '1985-03-15',
      sex: 'male',
      primaryLanguage: 'English',
      needsTranslator: false,
      mobilityStatus: 'ambulatory',
      livingSituation: 'alone',
      insurance: {
        type: 'medicaid',
        provider: 'Minnesota Health Care Programs',
        number: 'MHCP123456'
      },
      activeReferrals: 2,
      createdAt: '2024-01-15',
    },
    {
      _id: 'CLT-002',
      firstName: 'Maria',
      lastName: 'Garcia',
      status: 'UNPLACED_NEW',
      city: 'St. Paul',
      state: 'MN',
      phone: '(651) 555-0456',
      email: 'maria.garcia@email.com',
      dateOfBirth: '1978-07-22',
      sex: 'female',
      primaryLanguage: 'Spanish',
      needsTranslator: true,
      mobilityStatus: 'wheelchair-bound',
      livingSituation: 'with-family',
      insurance: {
        type: 'medicare',
        provider: 'Medicare',
        number: 'MED789012'
      },
      activeReferrals: 0,
      createdAt: '2024-02-01',
    },
    // Add more mock data
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE_STABLE: {
        label: 'Active & Stable',
        className: 'bg-green-50 text-green-700 border-green-200'
      },
      ACTIVE_FRUSTRATED: {
        label: 'Active & Frustrated',
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200'
      },
      UNPLACED_NEW: {
        label: 'New - Unplaced',
        className: 'bg-blue-50 text-blue-700 border-blue-200'
      }
    }[status] || {
      label: status,
      className: 'bg-gray-50 text-gray-700 border-gray-200'
    };

    return (
      <Badge variant="outline" className={cn("capitalize", statusConfig.className)}>
        {statusConfig.label}
      </Badge>
    );
  };

  const getSexLabel = (sex?: string) => {
    const sexLabels = {
      male: 'Male',
      female: 'Female',
      'non-binary': 'Non-binary',
      'prefer-not-to-say': 'Prefer not to say',
      other: 'Other'
    };
    return sexLabels[sex as keyof typeof sexLabels] || 'Not specified';
  };

  const getMobilityLabel = (status?: string) => {
    const mobilityLabels = {
      ambulatory: 'Ambulatory',
      'wheelchair-bound': 'Wheelchair-bound',
      'bed-bound': 'Bed-bound',
      other: 'Other'
    };
    return mobilityLabels[status as keyof typeof mobilityLabels] || 'Not specified';
  };

  const getLivingSituationLabel = (situation?: string) => {
    const situationLabels = {
      alone: 'Living Alone',
      'with-family': 'With Family',
      'group-setting': 'Group Setting',
      other: 'Other'
    };
    return situationLabels[situation as keyof typeof situationLabels] || 'Not specified';
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 shadow-sm border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sm:w-[300px]"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              <SelectItem value="ACTIVE_STABLE">Active & Stable</SelectItem>
              <SelectItem value="ACTIVE_FRUSTRATED">Active & Frustrated</SelectItem>
              <SelectItem value="UNPLACED_NEW">New - Unplaced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="grid gap-4">
        {clients.map((client) => (
          <Card key={client._id} className={cn(
            "p-6 transition-all duration-200",
            "hover:shadow-md hover:border-gray-300",
            "animate-in fade-in-50 duration-500"
          )}>
            <div className="flex flex-col lg:flex-row justify-between gap-6">
              {/* Main Client Info */}
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                      {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {client.firstName} {client.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">ID: {client._id}</p>
                    </div>
                  </div>
                  {getStatusBadge(client.status)}
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{client.email || 'No email'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4 text-red-500" />
                    <span className="font-medium">{client.city}, {client.state}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">
                      {client.dateOfBirth ? formatSafeDate(client.dateOfBirth) : 'DOB not provided'}
                    </span>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="h-4 w-4 text-indigo-500" />
                    <span className="font-medium">{getSexLabel(client.sex)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Languages className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">
                      {client.primaryLanguage || 'English'}
                      {client.needsTranslator && ' (Needs translator)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Accessibility className="h-4 w-4 text-teal-500" />
                    <span className="font-medium">{getMobilityLabel(client.mobilityStatus)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Home className="h-4 w-4 text-pink-500" />
                    <span className="font-medium">{getLivingSituationLabel(client.livingSituation)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Shield className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">
                      {client.insurance?.type ? client.insurance.type.charAt(0).toUpperCase() + client.insurance.type.slice(1) : 'No insurance'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FileText className="h-4 w-4 text-cyan-500" />
                    <span className="font-medium">
                      {client.activeReferrals || 0} active referrals
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 lg:items-end">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/case-manager/clients/${client._id}`}>
                      View Profile
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={`/case-manager/new-referral?clientId=${client._id}`}>
                      New Referral
                    </Link>
                  </Button>
                </div>
                <p className="text-xs text-gray-500 text-right">
                  Client since {formatSafeDate(client.createdAt)}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 