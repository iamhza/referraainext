'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, CheckCircle, Calendar, X, AlertCircle } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminReferrals() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  // Mock referral data
  const allReferrals = [
    { 
      id: 4829, 
      service: "Adult rehabilitative mental health services (ARMHS)", 
      caseManager: "Sarah Johnson",
      dateCreated: "Apr 9, 2025",
      urgency: "high", 
      county: "Hennepin",
      status: "pending", 
      matchCount: 0
    },
    { 
      id: 4828, 
      service: "Substance use disorder treatment", 
      caseManager: "Michael Rivera",
      dateCreated: "Apr 8, 2025",
      urgency: "medium", 
      county: "Ramsey",
      status: "matched", 
      matchCount: 3
    }
  ];

  // Filter referrals based on search and filters
  const filteredReferrals = allReferrals.filter(referral => {
    const matchesSearch = 
      searchTerm === '' || 
      referral.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.caseManager.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.id.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || referral.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'all' || referral.urgency === urgencyFilter;
    
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  // Get status badge styles
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center">
            <Clock className="mr-1 h-3 w-3" />
            Pending Match
          </Badge>
        );
      case 'matched':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center">
            <CheckCircle className="mr-1 h-3 w-3" />
            Matched
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center">
            <AlertCircle className="mr-1 h-3 w-3" />
            {status}
          </Badge>
        );
    }
  };

  // Get urgency badge styles
  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            High Priority
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Medium Priority
          </Badge>
        );
      case 'low':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Low Priority
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Referrals</h1>
            <p className="text-gray-500">Monitor and manage all referrals</p>
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="md:w-1/4">
                  <SelectValue placeholder="Filter by urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Urgencies</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Referrals List */}
        <Card>
          <CardHeader>
            <CardTitle>All Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredReferrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{referral.service}</h3>
                      {getUrgencyBadge(referral.urgency)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Case Manager: {referral.caseManager} • {referral.county} County
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created: {referral.dateCreated}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(referral.status)}
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
} 