'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, CheckCircle, AlertCircle, Calendar, ChevronRight, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type ReferralStatus = 
  | 'under_review'
  | 'provider_selection_required'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

interface Referral {
  id: string;
  clientName: string;
  service: string;
  status: ReferralStatus;
  urgency: 'high' | 'medium' | 'low';
  createdAt: string;
  provider?: {
    name: string;
    organization: string;
  };
}

export function ReferralsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data - replace with real data later
  const referrals: Referral[] = [
    {
      id: 'REF-001',
      clientName: 'John Doe',
      service: 'Mental Health Counseling',
      status: 'under_review',
      urgency: 'high',
      createdAt: '2024-02-15',
    },
    {
      id: 'REF-002',
      clientName: 'Sarah Smith',
      service: 'Physical Therapy',
      status: 'provider_selection_required',
      urgency: 'medium',
      createdAt: '2024-02-16',
    },
    {
      id: 'REF-003',
      clientName: 'Michael Johnson',
      service: 'Medical Care',
      status: 'in_progress',
      urgency: 'medium',
      createdAt: '2024-02-14',
      provider: {
        name: 'Dr. Sarah Williams',
        organization: 'HealthFirst Clinic'
      }
    },
    {
      id: 'REF-004',
      clientName: 'Emily Brown',
      service: 'Dental Care',
      status: 'completed',
      urgency: 'low',
      createdAt: '2024-02-10',
      provider: {
        name: 'Dr. James Wilson',
        organization: 'City Dental Center'
      }
    },
    {
      id: 'REF-005',
      clientName: 'David Wilson',
      service: 'Mental Health Counseling',
      status: 'cancelled',
      urgency: 'high',
      createdAt: '2024-02-12',
    }
  ];

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

  const getActionButton = (referral: Referral) => {
    const baseClasses = cn(
      "border-gray-200/50 hover:border-gray-300/50",
      "transition-all duration-200",
      "hover:shadow-md"
    );

    if (referral.status === 'in_progress') {
      return (
        <Button variant="outline" size="sm" className={baseClasses} asChild>
          <Link href={`/case-manager/referrals/${referral.id}/active`}>
            View Tracker
          </Link>
        </Button>
      );
    }

    return (
      <Button variant="outline" size="sm" className={baseClasses} asChild>
        <Link href={`/case-manager/referrals/${referral.id}`}>
          View Details
        </Link>
      </Button>
    );
  };

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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
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
        </div>
      </Card>

      <div className="grid gap-4">
        {referrals
          .filter(referral => 
            statusFilter === 'all' || referral.status === statusFilter
          )
          .filter(referral =>
            searchTerm === '' ||
            referral.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            referral.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
            referral.id.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((referral) => {
            const statusConfig = getStatusConfig(referral.status);
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={referral.id} className={cn(
                "relative overflow-hidden",
                "border border-gray-100/50",
                "hover:shadow-lg hover:border-gray-200/50",
                "transition-all duration-300 ease-in-out",
                "animate-in fade-in-50 duration-500",
                "bg-white/50 backdrop-blur-sm",
                "group"
              )}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/10 to-blue-100/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-6">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900 group-hover:text-gray-800 transition-colors">
                          {referral.clientName}
                        </h3>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "flex items-center gap-1 shadow-sm",
                            "transition-all duration-200",
                            "hover:scale-105",
                            statusConfig.className
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                        {referral.urgency === 'high' && (
                          <Badge variant="destructive">Urgent</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{referral.service}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Created {new Date(referral.createdAt).toLocaleDateString()}
                        </span>
                        {referral.provider && (
                          <span className="flex items-center gap-2">
                            Provider: {referral.provider.name}
                          </span>
                        )}
                      </div>
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
              </Card>
            );
          })}
      </div>
    </div>
  );
} 