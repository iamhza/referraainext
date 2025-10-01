'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  EnhancedDialog as Dialog, 
  EnhancedDialogContent as DialogContent, 
  EnhancedDialogHeader as DialogHeader, 
  EnhancedDialogTitle as DialogTitle, 
  EnhancedDialogTrigger as DialogTrigger 
} from '@/components/ui/enhanced-dialog';
import { EnhancedLabel as Label } from '@/components/ui/enhanced-label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Search, 
  UserPlus, 
  Upload,
  Filter,
  MoreHorizontal,
  Eye,
  UserCheck,
  Calendar,
  Phone,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';

interface Client {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  status: string;
  caseManagerId?: string;
  caseManagerName?: string;
  assignedBy?: string;
  assignedAt?: string;
  created_at: string;
  updated_at: string;
}

interface CaseManager {
  id: string;
  name: string;
  email: string;
  clientCount: number;
  maxCaseload: number;
}

export default function SupervisorClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [caseManagers, setCaseManagers] = useState<CaseManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // New client form state
  const [newClient, setNewClient] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    county: '',
    assignedCaseManagerId: '',
    notes: ''
  });

  useEffect(() => {
    fetchClients();
    fetchCaseManagers();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/org/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
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
            id: u.id || u._id,
            name: u.fullName || u.full_name || u.name,
            email: u.email,
            clientCount: 0, // TODO: Calculate actual count
            maxCaseload: 40 // TODO: Get from user settings
          }));
        
        setCaseManagers(managers);
      }
    } catch (error) {
      console.error('Error fetching case managers:', error);
    }
  };

  const handleCreateClient = async () => {
    try {
      // Convert "unassigned" to empty string for API
      const clientData = {
        ...newClient,
        assignedCaseManagerId: newClient.assignedCaseManagerId === 'unassigned' ? '' : newClient.assignedCaseManagerId
      };
      
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });

      if (response.ok) {
        await fetchClients(); // Refresh the list
        setShowCreateDialog(false);
        setNewClient({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          dateOfBirth: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          county: '',
          assignedCaseManagerId: '',
          notes: ''
        });
      } else {
        console.error('Failed to create client');
      }
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  const handleReassignClient = async (clientId: string, newCaseManagerId: string) => {
    try {
      // Convert "unassign" to empty string for API
      const caseManagerId = newCaseManagerId === 'unassign' ? '' : newCaseManagerId;
      
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseManagerId: caseManagerId,
          assignedBy: user?.id,
          assignedAt: new Date().toISOString()
        }),
      });

      if (response.ok) {
        await fetchClients(); // Refresh the list
      }
    } catch (error) {
      console.error('Error reassigning client:', error);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    
    const matchesAssignment = 
      assignmentFilter === 'all' ||
      (assignmentFilter === 'assigned' && client.caseManagerId) ||
      (assignmentFilter === 'unassigned' && !client.caseManagerId);
    
    return matchesSearch && matchesStatus && matchesAssignment;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      'ACTIVE_STABLE': 'bg-green-100 text-green-800',
      'ACTIVE_FRUSTRATED': 'bg-orange-100 text-orange-800',
      'UNPLACED_NEW': 'bg-blue-100 text-blue-800',
      'INACTIVE': 'bg-gray-100 text-gray-800'
    };
    return <Badge className={styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}>
      {status.replace('_', ' ')}
    </Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
          <p className="text-gray-600">Manage and assign clients to your team members</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import Clients
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Clients</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Upload a CSV file with client information. You can assign them to case managers during import.
                </p>
                <input type="file" accept=".csv" className="w-full" />
                <Button className="w-full">Upload and Import</Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={newClient.firstName}
                    onChange={(e) => setNewClient({...newClient, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={newClient.lastName}
                    onChange={(e) => setNewClient({...newClient, lastName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={newClient.dateOfBirth}
                    onChange={(e) => setNewClient({...newClient, dateOfBirth: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="assignedCaseManagerId">Assign to Case Manager</Label>
                  <Select
                    value={newClient.assignedCaseManagerId}
                    onValueChange={(value) => setNewClient({...newClient, assignedCaseManagerId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select case manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {caseManagers.map((cm) => (
                        <SelectItem key={cm.id} value={cm.id}>
                          {cm.name} ({cm.clientCount}/{cm.maxCaseload})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newClient.notes}
                    onChange={(e) => setNewClient({...newClient, notes: e.target.value})}
                    placeholder="Additional notes about the client..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateClient}>
                  Create Client
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                <SelectItem value="ACTIVE_STABLE">Active - Stable</SelectItem>
                <SelectItem value="ACTIVE_FRUSTRATED">Active - Frustrated</SelectItem>
                <SelectItem value="UNPLACED_NEW">Unplaced - New</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by assignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Clients ({filteredClients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Case Manager</TableHead>
                <TableHead>Assigned Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client._id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{client.firstName} {client.lastName}</p>
                      {client.dateOfBirth && (
                        <p className="text-sm text-gray-500">
                          DOB: {format(new Date(client.dateOfBirth), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {client.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="w-3 h-3" />
                          {client.email}
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3" />
                          {client.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(client.status)}
                  </TableCell>
                  <TableCell>
                    {client.caseManagerName ? (
                      <div>
                        <p className="font-medium">{client.caseManagerName}</p>
                        <Select
                          value={client.caseManagerId || ''}
                          onValueChange={(value) => handleReassignClient(client._id, value)}
                        >
                          <SelectTrigger className="w-32 h-6 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassign">Unassign</SelectItem>
                            {caseManagers.map((cm) => (
                              <SelectItem key={cm.id} value={cm.id}>
                                {cm.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <Select
                        value=""
                        onValueChange={(value) => handleReassignClient(client._id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Assign..." />
                        </SelectTrigger>
                        <SelectContent>
                          {caseManagers.map((cm) => (
                            <SelectItem key={cm.id} value={cm.id}>
                              {cm.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    {client.assignedAt ? (
                      <div className="text-sm">
                        <p>{format(new Date(client.assignedAt), 'MMM d, yyyy')}</p>
                        <p className="text-gray-500">at {format(new Date(client.assignedAt), 'h:mm a')}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredClients.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No clients found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
