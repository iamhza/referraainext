import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  MessageSquare,
  MoreHorizontal,
  RefreshCcw,
  Search,
  Settings,
  Shield,
  User,
  Users
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import type { Client, ClientStatus } from '@/types';

interface EcosystemDashboardProps {
  clients: Client[];
  isLoading?: boolean;
}

export function EcosystemDashboard({ clients, isLoading = false }: EcosystemDashboardProps) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | ClientStatus>('all');
  
  // Filter clients based on search and active tab
  const filteredClients = clients
    .filter(client => 
      `${client.firstName} ${client.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      client.email?.toLowerCase().includes(search.toLowerCase())
    )
    .filter(client => 
      activeTab === 'all' || client.status === activeTab
    );
  
  // Group clients by their status
  const stableClients = clients.filter(client => client.status === 'ACTIVE_STABLE');
  const frustratedClients = clients.filter(client => client.status === 'ACTIVE_FRUSTRATED');
  const unplacedClients = clients.filter(client => client.status === 'UNPLACED_NEW' || !client.status);
  
  // Helper for avatar/initials
  const getInitials = (first: string, last: string) => {
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
  };
  
  // Helper to determine action button based on client status
  const getActionButton = (client: Client) => {
    switch(client.status) {
      case 'ACTIVE_STABLE':
        return (
          <Button variant="outline" size="sm" className="rounded-full text-green-700 border-green-200 hover:bg-green-50">
            <CheckCircle className="mr-1 h-3 w-3" />
            Request Update
          </Button>
        );
      case 'ACTIVE_FRUSTRATED':
        return (
          <Button variant="outline" size="sm" className="rounded-full text-amber-700 border-amber-200 hover:bg-amber-50">
            <AlertCircle className="mr-1 h-3 w-3" />
            Plan Change
          </Button>
        );
      case 'UNPLACED_NEW':
      default:
        return (
          <Button variant="outline" size="sm" className="rounded-full text-blue-700 border-blue-200 hover:bg-blue-50">
            <Link href={`/case-manager/new-referral?clientId=${client._id}`}>
              Create Referral
            </Link>
          </Button>
        );
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Ecosystem</h2>
          <p className="text-muted-foreground">Manage your entire client ecosystem in one place</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search clients..."
              className="w-[200px] md:w-[300px] pl-8 rounded-lg bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-lg">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setActiveTab('all')}>
                All Clients
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setActiveTab('ACTIVE_STABLE')}>
                <Shield className="mr-2 h-4 w-4 text-green-500" />
                Stable Clients
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setActiveTab('ACTIVE_FRUSTRATED')}>
                <AlertCircle className="mr-2 h-4 w-4 text-amber-500" />
                Frustrated Clients
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setActiveTab('UNPLACED_NEW')}>
                <User className="mr-2 h-4 w-4 text-blue-500" />
                Unplaced Clients
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className={cn(
          "hover:shadow-md transition-all", 
          activeTab === 'ACTIVE_STABLE' && "ring-2 ring-green-200"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Shield className="mr-2 h-5 w-5 text-green-500" />
              Stable Clients
            </CardTitle>
            <CardDescription>
              Successfully placed clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stableClients.length}</div>
            {stableClients.length > 0 && (
              <div className="mt-2 text-sm text-muted-foreground">
                {stableClients.length} clients with active providers
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-green-700 hover:text-green-800 hover:bg-green-50 p-0"
              onClick={() => setActiveTab('ACTIVE_STABLE')}
            >
              View All
            </Button>
          </CardFooter>
        </Card>
        
        <Card className={cn(
          "hover:shadow-md transition-all", 
          activeTab === 'ACTIVE_FRUSTRATED' && "ring-2 ring-amber-200"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />
              Frustrated Clients
            </CardTitle>
            <CardDescription>
              Clients showing signs of mismatch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{frustratedClients.length}</div>
            {frustratedClients.length > 0 && (
              <div className="mt-2 text-sm text-muted-foreground">
                {frustratedClients.length} clients need attention
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-amber-700 hover:text-amber-800 hover:bg-amber-50 p-0"
              onClick={() => setActiveTab('ACTIVE_FRUSTRATED')}
            >
              View All
            </Button>
          </CardFooter>
        </Card>
        
        <Card className={cn(
          "hover:shadow-md transition-all", 
          activeTab === 'UNPLACED_NEW' && "ring-2 ring-blue-200"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <User className="mr-2 h-5 w-5 text-blue-500" />
              Unplaced Clients
            </CardTitle>
            <CardDescription>
              New or waiting for placement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{unplacedClients.length}</div>
            {unplacedClients.length > 0 && (
              <div className="mt-2 text-sm text-muted-foreground">
                {unplacedClients.length} clients need referrals
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-blue-700 hover:text-blue-800 hover:bg-blue-50 p-0"
              onClick={() => setActiveTab('UNPLACED_NEW')}
            >
              View All
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Client List */}
      <Card>
        <CardHeader className="px-6 py-4">
          <div className="flex items-center justify-between">
            <CardTitle>Client Relationships</CardTitle>
            <Button variant="outline" size="sm" className="rounded-full">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Users className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No clients found</h3>
              <p className="text-gray-500 max-w-sm">
                {search ? 'Try adjusting your search' : activeTab !== 'all' ? 'No clients in this category' : 'Start by adding clients to your ecosystem'}
              </p>
            </div>
          ) : (
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {filteredClients.map(client => (
                <div 
                  key={client._id} 
                  className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 rounded-full bg-blue-100">
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {getInitials(client.firstName, client.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {client.firstName} {client.lastName}
                        <StatusBadge status={client.status || 'UNPLACED_NEW'} size="sm" />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {client.email || client.phone || `${client.city}, ${client.state}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getActionButton(client)}
                    
                    <Button variant="ghost" size="icon" className="rounded-full" asChild>
                      <Link href={`/case-manager/clients/${client._id}`}>
                        <Settings className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 