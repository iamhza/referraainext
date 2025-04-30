'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Calendar, MapPin, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ClientList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data - replace with real data later
  const clients = [
    {
      id: 'CLT-001',
      name: 'John Doe',
      status: 'active',
      location: 'Minneapolis, MN',
      phone: '(612) 555-0123',
      activeReferrals: 2,
      createdAt: '2024-01-15',
    },
    // Add more mock data
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: {
        label: 'Active',
        className: 'bg-green-50 text-green-700 border-green-200'
      },
      inactive: {
        label: 'Inactive',
        className: 'bg-gray-50 text-gray-700 border-gray-200'
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="grid gap-4">
        {clients.map((client) => (
          <Card key={client.id} className={cn(
            "p-6 transition-all duration-200",
            "hover:shadow-md hover:border-gray-300",
            "animate-in fade-in-50 duration-500"
          )}>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{client.name}</h3>
                    <p className="text-sm text-gray-500">ID: {client.id}</p>
                  </div>
                  {getStatusBadge(client.status)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {client.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {client.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Client since {new Date(client.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">View Profile</Button>
                <Button size="sm">New Referral</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 