'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  EnhancedDialog as Dialog, 
  EnhancedDialogContent as DialogContent, 
  EnhancedDialogHeader as DialogHeader, 
  EnhancedDialogTitle as DialogTitle, 
  EnhancedDialogTrigger as DialogTrigger 
} from '@/components/ui/enhanced-dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  UserPlus, 
  Search, 
  Mail,
  Shield,
  Users as UsersIcon,
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck,
  ArrowRight
} from 'lucide-react';
import { EnhancedLabel as Label } from '@/components/ui/enhanced-label';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface OrgUser {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
  fullName: string;
  role: string;
  team_id?: string;
  teamName?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface Team {
  id: string;
  name: string;
}

export default function OrgUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'case_manager' as const,
    teamId: '',
    full_name: '',
    password: '',
    send_invitation: true
  });
  const [editingUser, setEditingUser] = useState<OrgUser | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/org/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      
      // Transform users data and extract teams
      const transformedUsers = data.users.map((user: any) => ({
        id: user.id,
        email: user.email,
        fullName: user.name || user.email,
        role: user.role,
        team_id: user.team_id,
        teamName: user.team_name || 'No Team',
        is_active: user.is_active !== false,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_sign_in_at: user.last_sign_in_at
      }));
      
      setUsers(transformedUsers);
      
      // Extract unique teams - for now use mock data since we don't have teams API yet
      setTeams([
        { id: 'team1', name: 'Case Management Team' },
        { id: 'team2', name: 'Support Team' },
        { id: 'team3', name: 'Admin Team' }
      ]);
      
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('invite');
    
    try {
      const response = await fetch('/api/org/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteForm.email,
          role: inviteForm.role,
          team_id: inviteForm.teamId === 'no-team' ? null : inviteForm.teamId || null,
          full_name: inviteForm.full_name || inviteForm.email.split('@')[0],
          password: inviteForm.password || undefined,
          send_invitation: inviteForm.send_invitation
        })
      });

      if (response.ok) {
        await fetchUsers(); // Refresh the list
        setShowInviteDialog(false);
        setInviteForm({ 
          email: '', 
          role: 'case_manager', 
          teamId: '', 
          full_name: '', 
          password: '', 
          send_invitation: true 
        });
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      alert('Failed to invite user. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditUser = (user: OrgUser) => {
    setEditingUser(user);
    setShowEditDialog(true);
  };

  const handleUpdateUser = async (updates: any) => {
    if (!editingUser) return;
    
    setActionLoading(`edit-${editingUser.id}`);
    
    try {
      const response = await fetch('/api/org/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: editingUser.id,
          updates
        })
      });

      if (response.ok) {
        await fetchUsers(); // Refresh the list
        setShowEditDialog(false);
        setEditingUser(null);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setActionLoading(`status-${userId}`);
    
    try {
      const response = await fetch('/api/org/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          updates: { is_active: !currentStatus }
        })
      });

      if (response.ok) {
        await fetchUsers(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Failed to update user status. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user? This will allow the email to be reused but cannot be undone.')) {
      return;
    }

    setActionLoading(`delete-${userId}`);
    
    try {
      const response = await fetch(`/api/org/users?user_id=${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchUsers(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    setActionLoading(`role-${userId}`);
    
    try {
      console.log('🔄 Changing role for user:', userId, 'to:', newRole);
      
      const response = await fetch('/api/org/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          updates: { role: newRole }
        })
      });

      const data = await response.json();
      console.log('📝 Role change response:', data);

      if (response.ok) {
        toast({
          title: "Role updated successfully",
          description: `User role changed to ${newRole.replace('_', ' ')}`,
        });
        await fetchUsers(); // Refresh the list
      } else {
        console.error('❌ Role change failed:', data);
        toast({
          title: "Error changing role",
          description: data.error || 'Failed to change user role',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error changing user role:', error);
      toast({
        title: "Error changing role",
        description: 'Failed to change user role',
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'org_admin': return 'bg-purple-100 text-purple-800';
      case 'supervisor': return 'bg-blue-100 text-blue-800';
      case 'case_manager': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
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
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600">
                Manage users and permissions across your organization
              </p>
            </div>
            
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Invite New User</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleInviteUser} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email" required>Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                        placeholder="user@example.com"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        type="text"
                        value={inviteForm.full_name}
                        onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="role" required>Role</Label>
                      <Select 
                        value={inviteForm.role} 
                        onValueChange={(value) => setInviteForm({ ...inviteForm, role: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="case_manager">Case Manager</SelectItem>
                          <SelectItem value="supervisor">Supervisor</SelectItem>
                          <SelectItem value="org_admin">Organization Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="team">Team (Optional)</Label>
                      <Select 
                        value={inviteForm.teamId} 
                        onValueChange={(value) => setInviteForm({ ...inviteForm, teamId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a team" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-team">No Team</SelectItem>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="password">Initial Password (Optional)</Label>
                    <Input
                      id="password"
                      type="password"
                      value={inviteForm.password}
                      onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                      placeholder="Leave empty to require user to set password"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      If empty, user will receive an invitation email to set their password
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="send_invitation"
                      checked={inviteForm.send_invitation}
                      onCheckedChange={(checked) => 
                        setInviteForm({ ...inviteForm, send_invitation: checked as boolean })
                      }
                    />
                    <Label htmlFor="send_invitation">Send invitation email</Label>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowInviteDialog(false)}
                      disabled={actionLoading === 'invite'}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={actionLoading === 'invite'}>
                      {actionLoading === 'invite' ? 'Creating...' : 'Create User'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold">{users.length}</p>
                  </div>
                  <UsersIcon className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold">
                      {users.filter(u => u.is_active).length}
                    </p>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Teams</p>
                    <p className="text-2xl font-bold">{teams.length}</p>
                  </div>
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Case Managers</p>
                    <p className="text-2xl font-bold">
                      {users.filter(u => u.role === 'case_manager').length}
                    </p>
                  </div>
                  <UserPlus className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="org_admin">Organization Admin</SelectItem>
              <SelectItem value="supervisor">Supervisor</SelectItem>
              <SelectItem value="case_manager">Case Manager</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {users.length === 0 ? 'No users found' : 'No matching users'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {users.length === 0 
                    ? 'Start by inviting users to your organization.'
                    : 'Try adjusting your search or filter criteria.'
                  }
                </p>
                {users.length === 0 && (
                  <Button onClick={() => setShowInviteDialog(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite First User
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.fullName}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {user.teamName || 'No Team'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(user.is_active ? 'active' : 'inactive')}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {user.created_at 
                            ? new Date(user.created_at).toLocaleDateString()
                            : 'Unknown'
                          }
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              disabled={actionLoading?.startsWith(`edit-${user.id}`) || actionLoading?.startsWith(`role-${user.id}`) || actionLoading?.startsWith(`status-${user.id}`) || actionLoading?.startsWith(`delete-${user.id}`)}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                              onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                            >
                              {user.is_active ? (
                                <>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Deactivate User
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-4 h-4 mr-2" />
                                  Activate User
                                </>
                              )}
                            </DropdownMenuItem>

                            <DropdownMenuItem>
                              <Mail className="w-4 h-4 mr-2" />
                              Resend Invite
                            </DropdownMenuItem>

                            {/* Role Change Submenu */}
                            <DropdownMenuItem 
                              onSelect={(e) => e.preventDefault()}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center">
                                  <Shield className="w-4 h-4 mr-2" />
                                  Change Role
                                </div>
                                <Select onValueChange={(value) => handleChangeRole(user.id, value)}>
                                  <SelectTrigger className="w-6 h-6 border-none bg-transparent p-0">
                                    <ArrowRight className="w-4 h-4" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="case_manager" disabled={user.role === 'case_manager'}>
                                      Case Manager
                                    </SelectItem>
                                    <SelectItem value="supervisor" disabled={user.role === 'supervisor'}>
                                      Supervisor
                                    </SelectItem>
                                    <SelectItem value="org_admin" disabled={user.role === 'org_admin'}>
                                      Organization Admin
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit_name">Full Name</Label>
                  <Input
                    id="edit_name"
                    type="text"
                    defaultValue={editingUser.fullName}
                    placeholder="Full Name"
                    onBlur={(e) => {
                      if (e.target.value !== editingUser.fullName) {
                        handleUpdateUser({ full_name: e.target.value });
                      }
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="edit_role">Role</Label>
                  <Select 
                    defaultValue={editingUser.role} 
                    onValueChange={(value) => handleUpdateUser({ role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="case_manager">Case Manager</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="org_admin">Organization Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit_team">Team</Label>
                  <Select 
                    defaultValue={editingUser.team_id || 'no-team'} 
                    onValueChange={(value) => handleUpdateUser({ team_id: value === 'no-team' ? null : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-team">No Team</SelectItem>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit_active"
                    checked={editingUser.is_active}
                    onCheckedChange={(checked) => 
                      handleUpdateUser({ is_active: checked as boolean })
                    }
                  />
                  <Label htmlFor="edit_active">User is active</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowEditDialog(false);
                      setEditingUser(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}