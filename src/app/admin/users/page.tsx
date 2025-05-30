'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Users, Shield, CheckCircle, XCircle } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showUserModal, setShowUserModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [form, setForm] = useState({ name: '', email: '', role: '', organization: '', status: 'active' });
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState<any>(null);
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.users);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddUser() {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to add user');
      setShowUserModal(false);
      setForm({ name: '', email: '', role: '', organization: '', status: 'active' });
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to add user');
    }
  }

  async function handleEditUser() {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedUser._id, ...form }),
      });
      if (!res.ok) throw new Error('Failed to update user');
      setShowUserModal(false);
      setSelectedUser(null);
      setForm({ name: '', email: '', role: '', organization: '', status: 'active' });
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    }
  }

  async function handleDeleteUser(id: string) {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete user');
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      searchTerm === '' ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.organization?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'case_manager':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center">
            <User className="mr-1 h-3 w-3" />
            Case Manager
          </Badge>
        );
      case 'provider':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center">
            <Shield className="mr-1 h-3 w-3" />
            Provider
          </Badge>
        );
      case 'admin':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center">
            <Users className="mr-1 h-3 w-3" />
            Admin
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center">
            <User className="mr-1 h-3 w-3" />
            {role}
          </Badge>
        );
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-500">Manage case managers and providers</p>
          </div>
          <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
            <DialogTrigger asChild>
              <Button onClick={() => { setModalType('add'); setForm({ name: '', email: '', role: '', organization: '', status: 'active' }); }}>
                <User className="mr-2 h-4 w-4" />
                Add New User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{modalType === 'add' ? 'Add User' : 'Edit User'}</DialogTitle>
                <DialogDescription>{modalType === 'add' ? 'Fill out the form to add a new user.' : 'Edit user details.'}</DialogDescription>
              </DialogHeader>
              <Input placeholder="Name" className="mb-2" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <Input placeholder="Email" className="mb-2" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              <Input placeholder="Role" className="mb-2" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
              <Input placeholder="Organization" className="mb-2" value={form.organization} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))} />
              <Select value={form.status} onValueChange={val => setForm(f => ({ ...f, status: val }))}>
                <SelectTrigger className="mb-2">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <DialogFooter className="mt-4">
                <Button variant="default" onClick={modalType === 'add' ? handleAddUser : handleEditUser}>{modalType === 'add' ? 'Add' : 'Save'}</Button>
                <Button variant="ghost" onClick={() => setShowUserModal(false)}>Cancel</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="md:w-1/3"
              />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="md:w-1/4">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="case_manager">Case Managers</SelectItem>
                  <SelectItem value="provider">Providers</SelectItem>
                  <SelectItem value="admin">Administrators</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="md:w-1/4">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading users...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No users found</div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {user.email} • {user.organization}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Status: {user.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {getRoleBadge(user.role)}
                      <Button variant="outline" size="sm" onClick={() => {
                        setModalType('edit');
                        setSelectedUser(user);
                        setForm({
                          name: user.name || '',
                          email: user.email || '',
                          role: user.role || '',
                          organization: user.organization || '',
                          status: user.status || 'active',
                        });
                        setShowUserModal(true);
                      }}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user._id)}>
                        Delete
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => {
                        setMessageRecipient(user);
                        setShowMessageModal(true);
                      }}>
                        Message
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        {/* Message Modal */}
        <Dialog open={showMessageModal} onOpenChange={setShowMessageModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Message</DialogTitle>
              <DialogDescription>Send a message to {messageRecipient?.name || 'user'}.</DialogDescription>
            </DialogHeader>
            <textarea
              className="w-full border rounded p-2 min-h-[80px]"
              placeholder="Type your message..."
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
            />
            <DialogFooter>
              <Button variant="default" onClick={() => {/* TODO: send message */ setShowMessageModal(false); setMessageText('');}}>Send</Button>
              <Button variant="ghost" onClick={() => setShowMessageModal(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
} 