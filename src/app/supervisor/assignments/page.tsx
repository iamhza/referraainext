'use client';

import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Search, UserPlus, AlertTriangle, CheckCircle, Clock, Filter, ArrowRight, MoreHorizontal, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ClientAssignment {
  id: string;
  clientName: string;
  clientId: string;
  caseManagerName: string;
  caseManagerId: string;
  caseManagerEmail: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'pending' | 'completed' | 'on_hold';
  assignedDate: string;
  lastActivity: string;
  referralCount: number;
}

interface CaseManager {
  id: string;
  name: string;
  email: string;
  clientCount: number;
  maxCaseload: number;
}

interface UnassignedClient {
  _id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  urgency?: string;
  status: string;
  created_at: string;
  notes?: string;
}

interface AssignmentHistory {
  id: string;
  clientId: string;
  clientName: string;
  fromCaseManager?: string;
  toCaseManager: string;
  assignedBy: string;
  assignedAt: string;
  reason?: string;
}

export default function SupervisorAssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<ClientAssignment[]>([]);
  const [caseManagers, setCaseManagers] = useState<CaseManager[]>([]);
  const [unassignedClients, setUnassignedClients] = useState<UnassignedClient[]>([]);
  const [assignmentHistory, setAssignmentHistory] = useState<AssignmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [selectedCaseManager, setSelectedCaseManager] = useState<string>('');
  const [assignmentReason, setAssignmentReason] = useState('');
  const [activeTab, setActiveTab] = useState<'assignments' | 'unassigned' | 'history'>('assignments');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchAssignments(),
      fetchCaseManagers(),
      fetchUnassignedClients(),
      fetchAssignmentHistory()
    ]);
  };

  const fetchAssignments = async () => {
    try {
      // Fetch clients and their assignments
      const response = await fetch('/api/org/clients');
      if (response.ok) {
        const data = await response.json();
        
        // Transform client data into assignment format
        const assignmentData = data.clients.map((client: any) => ({
          id: `assignment-${client._id}`,
          clientName: client.name || 'Unnamed Client',
          clientId: client._id,
          caseManagerName: client.caseManagerName || 'Unassigned',
          caseManagerId: client.caseManagerId || '',
          caseManagerEmail: client.caseManagerEmail || '',
          urgency: client.urgency || 'medium',
          status: client.status || 'active',
          assignedDate: client.assignedDate || client.created_at,
          lastActivity: client.updated_at || client.created_at,
          referralCount: client.referralCount || 0
        }));
        
        setAssignments(assignmentData);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
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
            name: u.full_name || u.name,
            email: u.email,
            clientCount: u.clientCount || 0,
            maxCaseload: 40 // Default, should come from settings
          }));
        
        setCaseManagers(managers);
      }
    } catch (error) {
      console.error('Error fetching case managers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnassignedClients = async () => {
    try {
      const response = await fetch('/api/org/clients');
      if (response.ok) {
        const data = await response.json();
        
        // Filter for unassigned clients
        const unassigned = data.clients
          .filter((client: any) => !client.caseManagerId)
          .map((client: any) => ({
            _id: client._id,
            name: client.name || `${client.firstName || ''} ${client.lastName || ''}`.trim(),
            firstName: client.firstName,
            lastName: client.lastName,
            email: client.email,
            phone: client.phone,
            urgency: client.urgency || 'medium',
            status: client.status || 'active',
            created_at: client.created_at,
            notes: client.notes
          }));
        
        setUnassignedClients(unassigned);
      }
    } catch (error) {
      console.error('Error fetching unassigned clients:', error);
    }
  };

  const fetchAssignmentHistory = async () => {
    try {
      // TODO: Implement assignment history API endpoint
      // For now, we'll use mock data
      setAssignmentHistory([]);
    } catch (error) {
      console.error('Error fetching assignment history:', error);
    }
  };

  const handleAssignClient = async (clientId: string, caseManagerId: string, reason?: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseManagerId,
          assignedBy: user?.id,
          assignedAt: new Date().toISOString(),
          assignmentReason: reason || 'Supervisor assignment'
        })
      });

      if (response.ok) {
        // Refresh data
        await fetchAllData();
        return true;
      }
    } catch (error) {
      console.error('Error assigning client:', error);
    }
    return false;
  };

  const handleBulkAssign = async () => {
    if (!selectedCaseManager || selectedClients.length === 0) return;

    try {
      const promises = selectedClients.map(clientId => 
        handleAssignClient(clientId, selectedCaseManager, assignmentReason)
      );
      
      await Promise.all(promises);
      
      // Reset bulk assignment state
      setSelectedClients([]);
      setSelectedCaseManager('');
      setAssignmentReason('');
      setShowBulkAssign(false);
      
      // Refresh data
      await fetchAllData();
    } catch (error) {
      console.error('Error with bulk assignment:', error);
    }
  };

  const handleReassignClient = async (clientId: string, newCaseManagerId: string) => {
    return await handleAssignClient(clientId, newCaseManagerId, 'Supervisor reassignment');
  };

  const toggleClientSelection = (clientId: string) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const canAssignToCaseManager = (caseManager: CaseManager) => {
    return caseManager.clientCount < caseManager.maxCaseload * 0.9; // Allow up to 90% capacity
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = 
      assignment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.caseManagerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'all' || assignment.urgency === urgencyFilter;
    
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  const getUrgencyBadge = (urgency: string) => {
    const styles = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800', 
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return <Badge className={styles[urgency as keyof typeof styles]}>{urgency}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      on_hold: 'bg-gray-100 text-gray-800'
    };
    return <Badge className={styles[status as keyof typeof styles]}>{status}</Badge>;
  };

  const getWorkloadStatus = (clientCount: number, maxCaseload: number) => {
    const percentage = (clientCount / maxCaseload) * 100;
    if (percentage >= 90) return { status: 'critical', color: 'text-red-600' };
    if (percentage >= 75) return { status: 'high', color: 'text-orange-600' };
    if (percentage >= 50) return { status: 'medium', color: 'text-yellow-600' };
    return { status: 'low', color: 'text-green-600' };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Client Assignments</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading assignments...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <div className="max-w-[1920px] mx-auto px-4 py-4">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Client Assignments
              </h1>
              <p className="text-gray-500 text-base">
                Monitor and manage case manager workloads
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => fetchAllData()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {selectedClients.length > 0 && (
                <Dialog open={showBulkAssign} onOpenChange={setShowBulkAssign}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Bulk Assign ({selectedClients.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Bulk Assign Clients</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Assign to Case Manager
                        </label>
                        <Select value={selectedCaseManager} onValueChange={setSelectedCaseManager}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select case manager..." />
                          </SelectTrigger>
                          <SelectContent>
                            {caseManagers.map(manager => (
                              <SelectItem 
                                key={manager.id} 
                                value={manager.id}
                                disabled={!canAssignToCaseManager(manager)}
                              >
                                {manager.name} ({manager.clientCount}/{manager.maxCaseload})
                                {!canAssignToCaseManager(manager) && ' - Over Capacity'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Assignment Reason (Optional)
                        </label>
                        <Textarea
                          value={assignmentReason}
                          onChange={(e) => setAssignmentReason(e.target.value)}
                          placeholder="Enter reason for assignment..."
                          rows={3}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowBulkAssign(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleBulkAssign}
                          disabled={!selectedCaseManager}
                        >
                          Assign {selectedClients.length} Clients
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">

      {/* Workload Overview */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unassignedClients.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {[...assignments, ...unassignedClients].filter(a => a.urgency === 'high' || a.urgency === 'critical').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overloaded CMs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {caseManagers.filter(cm => cm.clientCount > cm.maxCaseload * 0.9).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Case Managers</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{caseManagers.length}</div>
            <p className="text-xs text-muted-foreground">
              {caseManagers.filter(cm => canAssignToCaseManager(cm)).length} available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Assignment Management */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assignments">Current Assignments ({assignments.length})</TabsTrigger>
          <TabsTrigger value="unassigned">Unassigned Clients ({unassignedClients.length})</TabsTrigger>
          <TabsTrigger value="workloads">Case Manager Workloads</TabsTrigger>
        </TabsList>

        {/* Search and Filter Controls */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients or case managers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Urgencies</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>Current Client Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Case Manager</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Assigned Date</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-gray-500">
                          {searchTerm || statusFilter !== 'all' || urgencyFilter !== 'all' 
                            ? 'No assignments match your filters.' 
                            : 'No client assignments found.'
                          }
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAssignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">{assignment.clientName}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{assignment.caseManagerName}</div>
                            <div className="text-sm text-gray-500">{assignment.caseManagerEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                        <TableCell>{getUrgencyBadge(assignment.urgency)}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(assignment.assignedDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(assignment.lastActivity).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Select onValueChange={(value) => handleReassignClient(assignment.clientId, value)}>
                            <SelectTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="" disabled>Reassign to...</SelectItem>
                              {caseManagers.map(manager => (
                                <SelectItem 
                                  key={manager.id} 
                                  value={manager.id}
                                  disabled={manager.id === assignment.caseManagerId || !canAssignToCaseManager(manager)}
                                >
                                  {manager.name} ({manager.clientCount}/{manager.maxCaseload})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unassigned">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Unassigned Clients</span>
                {selectedClients.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {selectedClients.length} selected
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedClients.length === unassignedClients.length && unassignedClients.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedClients(unassignedClients.map(c => c._id));
                          } else {
                            setSelectedClients([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Quick Assign</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unassignedClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="text-gray-500">
                          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                          All clients have been assigned!
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    unassignedClients.map((client) => (
                      <TableRow key={client._id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedClients.includes(client._id)}
                            onCheckedChange={() => toggleClientSelection(client._id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {client.email && <div>{client.email}</div>}
                            {client.phone && <div>{client.phone}</div>}
                          </div>
                        </TableCell>
                        <TableCell>{getUrgencyBadge(client.urgency || 'medium')}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(client.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Select onValueChange={(value) => handleAssignClient(client._id, value)}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Assign to..." />
                            </SelectTrigger>
                            <SelectContent>
                              {caseManagers.map(manager => (
                                <SelectItem 
                                  key={manager.id} 
                                  value={manager.id}
                                  disabled={!canAssignToCaseManager(manager)}
                                >
                                  {manager.name} ({manager.clientCount}/{manager.maxCaseload})
                                  {!canAssignToCaseManager(manager) && ' - Over Capacity'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workloads">
          <Card>
            <CardHeader>
              <CardTitle>Case Manager Workloads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {caseManagers.map((manager) => {
                  const workload = getWorkloadStatus(manager.clientCount, manager.maxCaseload);
                  const percentage = Math.round((manager.clientCount / manager.maxCaseload) * 100);
                  
                  return (
                    <Card key={manager.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{manager.name}</div>
                        <Badge className={workload.color.replace('text-', 'bg-').replace('-600', '-100 ') + workload.color}>
                          {workload.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500 mb-3">{manager.email}</div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Caseload</span>
                          <span>{manager.clientCount} / {manager.maxCaseload}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              percentage >= 90 ? 'bg-red-600' :
                              percentage >= 75 ? 'bg-orange-500' :
                              percentage >= 50 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500">{percentage}% capacity</div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  </div>
  );
}
