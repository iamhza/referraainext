'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  EnhancedDialog as Dialog, 
  EnhancedDialogContent as DialogContent, 
  EnhancedDialogHeader as DialogHeader, 
  EnhancedDialogTitle as DialogTitle, 
  EnhancedDialogTrigger as DialogTrigger 
} from '@/components/ui/enhanced-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Mail, 
  Search, 
  Plus, 
  Copy, 
  RefreshCw, 
  X, 
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertTriangle,
  Send
} from 'lucide-react';
import { EnhancedLabel as Label } from '@/components/ui/enhanced-label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Invitation {
  _id: string;
  email: string;
  role: string;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  inviter_name: string;
  created_at: string;
  expires_at: string;
  completed_at?: string;
  team_id?: string;
}

interface Team {
  id: string;
  name: string;
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'case_manager' as const,
    teamId: '',
    send_email: true
  });

  useEffect(() => {
    fetchInvitations();
    fetchTeams();
  }, []);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/org/invitations');
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    // Using mock teams for now since we don't have teams API yet
    setTeams([
      { id: 'team1', name: 'Case Management Team' },
      { id: 'team2', name: 'Support Team' },
      { id: 'team3', name: 'Admin Team' }
    ]);
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('invite');

    try {
      const response = await fetch('/api/org/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteForm.email,
          role: inviteForm.role,
          team_id: inviteForm.teamId === 'no-team' ? null : inviteForm.teamId,
          send_email: inviteForm.send_email
        })
      });

      if (response.ok) {
        await fetchInvitations();
        setShowInviteDialog(false);
        setInviteForm({ email: '', role: 'case_manager', teamId: '', send_email: true });
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Failed to send invitation. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;
    
    setActionLoading(`cancel-${invitationId}`);

    try {
      const response = await fetch('/api/org/invitations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitation_id: invitationId,
          action: 'cancel'
        })
      });

      if (response.ok) {
        await fetchInvitations();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      alert('Failed to cancel invitation. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    setActionLoading(`resend-${invitationId}`);

    try {
      const response = await fetch('/api/org/invitations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitation_id: invitationId,
          action: 'resend'
        })
      });

      if (response.ok) {
        const data = await response.json();
        await fetchInvitations();
        
        // Copy new invitation link to clipboard
        if (data.new_invite_link) {
          navigator.clipboard.writeText(data.new_invite_link);
          alert('Invitation resent! New link copied to clipboard.');
        }
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      alert('Failed to resend invitation. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const copyInviteLink = (invitation: Invitation) => {
    // Since we don't store the token in the response, we'll need to generate a new one
    handleResendInvitation(invitation._id);
  };

  const filteredInvitations = invitations.filter(invitation => {
    const matchesSearch = 
      invitation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invitation.inviter_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invitation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: { bg: 'bg-yellow-100 text-yellow-800', icon: Clock },
      completed: { bg: 'bg-green-100 text-green-800', icon: CheckCircle },
      expired: { bg: 'bg-red-100 text-red-800', icon: AlertTriangle },
      cancelled: { bg: 'bg-gray-100 text-gray-800', icon: X }
    };
    
    const style = styles[status as keyof typeof styles] || styles.pending;
    const IconComponent = style.icon;
    
    return (
      <Badge className={style.bg}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'org_admin': return 'bg-purple-100 text-purple-800';
      case 'supervisor': return 'bg-blue-100 text-blue-800';
      case 'case_manager': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: invitations.length,
    pending: invitations.filter(i => i.status === 'pending').length,
    completed: invitations.filter(i => i.status === 'completed').length,
    expired: invitations.filter(i => i.status === 'expired').length
  };

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <div className="max-w-[1920px] mx-auto px-4 py-4">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invitation Management</h1>
              <p className="text-gray-600">
                Manage user invitations for your organization
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button onClick={fetchInvitations} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              
              <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Send Invitation
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send New Invitation</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSendInvitation} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                        placeholder="user@example.com"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="role">Role</Label>
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

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="send_email"
                        checked={inviteForm.send_email}
                        onCheckedChange={(checked) => 
                          setInviteForm({ ...inviteForm, send_email: checked as boolean })
                        }
                      />
                      <Label htmlFor="send_email">Send invitation email immediately</Label>
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
                        {actionLoading === 'invite' ? 'Sending...' : 'Send Invitation'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Invitations</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Expired</p>
                    <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
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
              placeholder="Search invitations by email or inviter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Invitations Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Invitations ({filteredInvitations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : filteredInvitations.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {invitations.length === 0 ? 'No invitations sent yet' : 'No matching invitations'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {invitations.length === 0 
                    ? 'Start by sending your first invitation to add team members.'
                    : 'Try adjusting your search or filter criteria.'
                  }
                </p>
                {invitations.length === 0 && (
                  <Button onClick={() => setShowInviteDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Send First Invitation
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invited By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvitations.map((invitation) => (
                    <TableRow key={invitation._id}>
                      <TableCell>
                        <div className="font-medium">{invitation.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(invitation.role)}>
                          {invitation.role.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invitation.status)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {invitation.inviter_name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {new Date(invitation.created_at).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {new Date(invitation.expires_at).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {invitation.status === 'pending' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                disabled={actionLoading?.startsWith(`cancel-${invitation._id}`) || actionLoading?.startsWith(`resend-${invitation._id}`)}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleResendInvitation(invitation._id)}
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Resend & Copy Link
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem 
                                onClick={() => copyInviteLink(invitation)}
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                Generate New Link
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleCancelInvitation(invitation._id)}
                              >
                                <X className="w-4 h-4 mr-2" />
                                Cancel Invitation
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}