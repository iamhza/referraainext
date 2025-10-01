'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  Search, 
  Download,
  UserPlus,
  RefreshCw,
  Loader2,
  User,
  Calendar,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface Client {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth: string;
  address?: string;
  city?: string;
  state?: string;
  status: string;
  caseManagerId?: string;
  caseManagerName?: string;
  created_at: string;
  updated_at?: string;
  urgency?: string;
}

interface CaseManager {
  id: string;
  name: string;
  email: string;
  clientCount: number;
}

export default function OrgAdminClientsPage() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [caseManagers, setCaseManagers] = useState<CaseManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [caseManagerFilter, setCaseManagerFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  useEffect(() => {
    fetchClients();
    fetchCaseManagers();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        
        // Fetch case managers first to lookup names
        const caseManagersResponse = await fetch('/api/org/team-members');
        let caseManagersMap = new Map();
        if (caseManagersResponse.ok) {
          const caseManagersData = await caseManagersResponse.json();
          caseManagersData.users
            .filter((u: any) => u.role === 'case_manager')
            .forEach((cm: any) => {
              caseManagersMap.set(cm.id, cm.fullName || cm.name || cm.email);
            });
        }
        
        // Enrich clients with case manager names and defaults
        const enrichedClients = (data.clients || []).map((client: any) => ({
          ...client,
          caseManagerName: client.caseManagerId ? caseManagersMap.get(client.caseManagerId) : null,
          // Fix date field mapping
          created_at: client.createdAt || client.created_at,
          updated_at: client.updatedAt || client.updated_at,
          // Add default urgency if missing
          urgency: client.urgency || 'medium'
        }));
        
        setClients(enrichedClients);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch clients",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to fetch clients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCaseManagers = async () => {
    try {
      const response = await fetch('/api/org/team-members');
      if (response.ok) {
        const data = await response.json();
        const managers = data.users
          .filter((u: any) => u.role === 'case_manager')
          .map((u: any) => ({
            id: u.id,
            name: u.fullName || u.name,
            email: u.email,
            clientCount: u.clientCount || 0
          }));
        setCaseManagers(managers);
      }
    } catch (error) {
      console.error('Error fetching case managers:', error);
    }
  };

  const handleRefresh = () => {
    fetchClients();
    fetchCaseManagers();
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      'UNPLACED_NEW': 'bg-yellow-100 text-yellow-800',
      'ACTIVE_STABLE': 'bg-green-100 text-green-800',
      'ACTIVE_FRUSTRATED': 'bg-red-100 text-red-800',
      'DISCHARGED': 'bg-gray-100 text-gray-800',
    };
    return (
      <Badge className={styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const styles = {
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-green-100 text-green-800',
    };
    return (
      <Badge className={styles[urgency as keyof typeof styles] || 'bg-gray-100 text-gray-800'}>
        {urgency || 'Medium'}
      </Badge>
    );
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    const matchesCaseManager = caseManagerFilter === 'all' || 
      (caseManagerFilter === 'unassigned' && !client.caseManagerId) ||
      client.caseManagerId === caseManagerFilter;
    
    return matchesSearch && matchesStatus && matchesCaseManager;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, caseManagerFilter]);

  const stats = {
    total: clients.length,
    unassigned: clients.filter(c => !c.caseManagerId).length,
    active: clients.filter(c => c.status?.includes('ACTIVE')).length,
    newClients: clients.filter(c => c.status === 'UNPLACED_NEW').length
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] p-6">
      <div className="max-w-7xl mx-auto">
      {/* Header */}
        <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
            <p className="text-gray-600 mt-2">Organization-wide client oversight and management</p>
        </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
            <Button asChild>
          <Link href="/org-admin/clients/new">
                <UserPlus className="w-4 h-4 mr-2" />
              Add Client
              </Link>
            </Button>
          </div>
      </div>

      {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Clients</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <User className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Unassigned</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.unassigned}</p>
                </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Clients</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserPlus className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New Clients</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.newClients}</p>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search clients by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="UNPLACED_NEW">Unplaced New</SelectItem>
                  <SelectItem value="ACTIVE_STABLE">Active Stable</SelectItem>
                  <SelectItem value="ACTIVE_FRUSTRATED">Active Frustrated</SelectItem>
                  <SelectItem value="DISCHARGED">Discharged</SelectItem>
                </SelectContent>
              </Select>

              <Select value={caseManagerFilter} onValueChange={setCaseManagerFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by case manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Case Managers</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {caseManagers.map((cm) => (
                    <SelectItem key={cm.id} value={cm.id}>
                      {cm.name} ({cm.clientCount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Clients Table - Compact Design for Scale */}
      <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Organization Clients ({filteredClients.length})</CardTitle>
              <div className="flex items-center gap-4">
                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="outline">
                  Page {currentPage} of {totalPages || 1}
                </Badge>
              </div>
            </div>
        </CardHeader>
          <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-2">Loading clients...</span>
            </div>
          ) : filteredClients.length === 0 ? (
              <div className="text-center py-8 px-6">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {clients.length === 0 ? 'No clients found' : 'No matching clients'}
              </h3>
                <p className="text-gray-500 mb-4">
                {clients.length === 0 
                    ? 'Get started by adding your first client.'
                    : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {clients.length === 0 && (
                  <Button asChild>
                <Link href="/org-admin/clients/new">
                      <UserPlus className="w-4 h-4 mr-2" />
                    Add First Client
                    </Link>
                  </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b bg-gray-50/50">
                      <TableHead className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </TableHead>
                      <TableHead className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </TableHead>
                      <TableHead className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </TableHead>
                      <TableHead className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </TableHead>
                      <TableHead className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Case Manager
                      </TableHead>
                      <TableHead className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Added
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClients.map((client, index) => (
                      <TableRow 
                        key={client._id} 
                        className={`border-b hover:bg-gray-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'
                        }`}
                      >
                        <TableCell className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-700">
                                {client.firstName?.[0]}{client.lastName?.[0]}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {client.firstName} {client.lastName}
                              </div>
                              <div className="text-xs text-gray-500">
                                DOB: {new Date(client.dateOfBirth).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="py-3 px-4">
                          <div className="text-sm text-gray-900">
                            {client.email && (
                              <div className="flex items-center mb-1">
                                <Mail className="w-3 h-3 mr-1.5 text-gray-400 flex-shrink-0" />
                                <span className="truncate max-w-[200px]">{client.email}</span>
                              </div>
                            )}
                            {client.phone && (
                              <div className="flex items-center">
                                <Phone className="w-3 h-3 mr-1.5 text-gray-400 flex-shrink-0" />
                                <span>{client.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell className="py-3 px-4">
                          <Badge 
                            className={`text-xs px-2 py-1 ${
                              client.status === 'UNPLACED_NEW' 
                                ? 'bg-orange-100 text-orange-800 border-orange-200' 
                                : client.status?.includes('ACTIVE')
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : 'bg-gray-100 text-gray-800 border-gray-200'
                            }`}
                          >
                            {client.status === 'UNPLACED_NEW' ? 'New' : 
                             client.status === 'ACTIVE_STABLE' ? 'Active' :
                             client.status === 'ACTIVE_FRUSTRATED' ? 'Critical' :
                             client.status?.replace('_', ' ') || 'Unknown'}
                          </Badge>
                        </TableCell>
                        
                        <TableCell className="py-3 px-4">
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              client.urgency === 'high' ? 'bg-red-500' :
                              client.urgency === 'medium' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`} />
                            <span className="text-sm text-gray-600 capitalize">
                              {client.urgency || 'Medium'}
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="py-3 px-4">
                          {client.caseManagerName ? (
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-6 w-6 bg-green-100 rounded-full flex items-center justify-center">
                                <User className="w-3 h-3 text-green-600" />
                              </div>
                              <div className="ml-2">
                                <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                                  {client.caseManagerName}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center">
                                <User className="w-3 h-3 text-gray-400" />
                        </div>
                              <span className="ml-2 text-sm text-gray-500">Unassigned</span>
                        </div>
                          )}
                        </TableCell>
                        
                        <TableCell className="py-3 px-4">
                          <div className="text-xs text-gray-500">
                            {new Date(client.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                        </div>
                        </TableCell>
                        
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {/* Pagination Controls */}
            {!loading && filteredClients.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50/50">
                <div className="text-sm text-gray-500">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredClients.length)} of {filteredClients.length} clients
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    className="h-8"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="h-8 w-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                    className="h-8"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
