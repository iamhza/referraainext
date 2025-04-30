'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, CheckCircle, Calendar, X } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ProviderReferrals() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock referral data
  const allReferrals = [
    {
      id: "REF-4832",
      service: "Mental Health Counseling",
      caseManager: "Michael Johnson",
      startDate: "Apr 10, 2025",
      status: "In Progress",
      daysActive: 3,
      nextAppointment: "Apr 15, 2025"
    },
    {
      id: "REF-4821",
      service: "Substance Use Treatment",
      caseManager: "Sarah Williams",
      startDate: "Apr 5, 2025",
      status: "In Progress",
      daysActive: 8,
      nextAppointment: "Apr 12, 2025"
    }
  ];

  // Filter referrals based on search and filters
  const filteredReferrals = allReferrals.filter(referral => {
    const matchesSearch = 
      searchTerm === '' || 
      referral.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.caseManager.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || referral.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Referrals</h1>
            <p className="text-gray-500">Manage and track your active referrals</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Search referrals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="md:w-1/3"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="md:w-1/4">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Referrals List */}
        <div className="space-y-4">
          {filteredReferrals.map((referral) => (
            <Card key={referral.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-lg">{referral.service}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Case Manager: {referral.caseManager}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {referral.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Started {referral.startDate} • {referral.daysActive} days active
                      </span>
                    </div>
                    {referral.nextAppointment && (
                      <p className="text-sm text-muted-foreground mt-2">
                        <Calendar className="inline-block w-4 h-4 mr-1" />
                        Next appointment: {referral.nextAppointment}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      Update Status
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
} 