'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, Inbox, Users, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

interface MongoReferral {
  _id: string;
  clientInfo: {
    _id: string; // Assuming a unique client ID is available
    firstName: string;
    lastName: string;
  };
  serviceDetails: {
    type: string;
  };
  status: string;
  createdAt: string;
}

interface UIReferral {
  id: string;
  clientId: string;
  clientName: string;
  serviceType: string;
  status: string;
  createdAt: string;
}

interface ClientGroup {
  clientId: string;
  clientName: string;
  clientInitials: string;
  referrals: UIReferral[];
}

export default function CaseManagerDashboard() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [groupedReferrals, setGroupedReferrals] = useState<ClientGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  useEffect(() => {
    async function fetchAndGroupReferrals() {
      try {
        const response = await fetch('/api/referrals');
        if (!response.ok) throw new Error('Failed to fetch referrals');
        const data = await response.json();
        
        const mappedReferrals: UIReferral[] = data.referrals.map((ref: MongoReferral) => ({
          id: ref._id,
          clientId: ref.clientInfo._id,
          clientName: `${ref.clientInfo.firstName} ${ref.clientInfo.lastName}`,
          serviceType: ref.serviceDetails.type,
          status: ref.status,
          createdAt: ref.createdAt,
        }));
        
        const groups = mappedReferrals.reduce((acc, referral) => {
          if (!acc[referral.clientId]) {
            acc[referral.clientId] = {
              clientId: referral.clientId,
              clientName: referral.clientName,
              clientInitials: referral.clientName.split(' ').map(n => n[0]).join('').toUpperCase(),
              referrals: []
            };
          }
          acc[referral.clientId].referrals.push(referral);
          return acc;
        }, {} as Record<string, ClientGroup>);

        const clientGroupsArray = Object.values(groups).map(group => {
            group.referrals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return group;
        });
    
        clientGroupsArray.sort((a, b) => {
            const mostRecentA = new Date(a.referrals[0].createdAt).getTime();
            const mostRecentB = new Date(b.referrals[0].createdAt).getTime();
            return mostRecentB - mostRecentA;
        });

        setGroupedReferrals(clientGroupsArray);
      } catch (error) {
        console.error('Error fetching and grouping referrals:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAndGroupReferrals();
  }, []);

  const filteredClients = useMemo(() => {
    if (!searchTerm) {
      return groupedReferrals;
    }
    return groupedReferrals.filter(group =>
      group.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, groupedReferrals]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { icon: Clock, label: 'Pending', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      'under_review': { icon: AlertCircle, label: 'Under Review', className: 'bg-amber-100 text-amber-800 border-amber-200' },
      'matched': { icon: CheckCircle, label: 'Matched', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'in_progress': { icon: CheckCircle, label: 'In Progress', className: 'bg-green-100 text-green-800 border-green-200' },
      'completed': { icon: CheckCircle, label: 'Completed', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
      'cancelled': { icon: XCircle, label: 'Cancelled', className: 'bg-red-100 text-red-800 border-red-200' }
    }[status.toLowerCase().replace(' ', '_')] || { icon: Clock, label: status, className: 'bg-gray-100 text-gray-800 border-gray-200' };
  
    const Icon = statusConfig.icon;
    return (
      <Badge variant="secondary" className={cn("font-medium py-1 px-2.5 rounded-full text-xs items-center gap-1.5", statusConfig.className)}>
        <Icon className="h-3.5 w-3.5" />
        {statusConfig.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {greeting}, {user?.user_metadata?.name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <p className="text-gray-500 mt-1">
              Here's an overview of your client caseload.
            </p>
          </div>
          <Button asChild>
            <Link href="/case-manager/new-referral">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Referral
            </Link>
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by client name..."
              className="pl-10 w-full md:w-1/3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Client-Grouped Referrals List */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading caseload...</div>
          ) : filteredClients.length > 0 ? (
            filteredClients.map((group) => (
              <Card key={group.clientId} className="rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-white shadow">
                        <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">{group.clientInitials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-800">{group.clientName}</CardTitle>
                        <CardDescription>{group.referrals.length} active referral(s)</CardDescription>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/case-manager/clients/${group.clientId}`}>
                        View Client
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {group.referrals.map((referral) => (
                      <Link href={`/case-manager/referrals/${referral.id}`} key={referral.id} className="block hover:bg-gray-50/50 transition-colors">
                        <div className="p-4 grid grid-cols-3 gap-4 items-center">
                          <div className="col-span-1">
                            <p className="font-medium text-gray-700">{referral.serviceType}</p>
                          </div>
                          <div className="col-span-1">
                            {getStatusBadge(referral.status)}
                          </div>
                          <div className="col-span-1 flex items-center justify-end text-sm text-gray-500">
                            {format(parseISO(referral.createdAt), 'MMM d, yyyy')}
                            <ChevronRight className="h-5 w-5 text-gray-400 ml-2" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                {searchTerm ? 'No clients found' : 'No active clients'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm 
                  ? `Your search for "${searchTerm}" did not match any clients.`
                  : 'Get started by creating a new referral to add a client.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 