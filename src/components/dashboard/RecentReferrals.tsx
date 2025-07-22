'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, Building } from 'lucide-react';

interface Referral {
  id: string;
  clientName: string;
  service: string;
  caseManager: string;
  status: 'pending' | 'matched' | 'in_progress' | 'completed';
  urgency: 'low' | 'medium' | 'high';
  createdAt: string;
}

export function RecentReferrals() {
  // Mock data - in real app this would come from API
  const recentReferrals: Referral[] = [
    {
      id: '1',
      clientName: 'Client A',
      service: 'Mental Health Counseling',
      caseManager: 'Sarah Johnson',
      status: 'pending',
      urgency: 'high',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      clientName: 'Client B',
      service: 'Substance Abuse Treatment',
      caseManager: 'Mike Chen',
      status: 'matched',
      urgency: 'medium',
      createdAt: '2024-01-14'
    },
    {
      id: '3',
      clientName: 'Client C',
      service: 'Housing Assistance',
      caseManager: 'Lisa Rodriguez',
      status: 'in_progress',
      urgency: 'low',
      createdAt: '2024-01-13'
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      matched: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getUrgencyBadge = (urgency: string) => {
    const variants = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return variants[urgency as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {recentReferrals.map((referral) => (
        <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium">{referral.service}</h4>
              <Badge className={getUrgencyBadge(referral.urgency)}>
                {referral.urgency}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {referral.caseManager}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {referral.createdAt}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusBadge(referral.status)}>
              {referral.status.replace('_', ' ')}
            </Badge>
            <Button variant="outline" size="sm">
              View
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
} 