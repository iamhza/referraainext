'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Users, PlusCircle, Bell } from 'lucide-react';
import Link from 'next/link';
import { PageTemplate } from '@/components/templates/page-template';
import { RecentReferrals } from '@/components/dashboard/RecentReferrals';
import { AdminReferralsTable } from '@/components/dashboard/AdminReferralsTable';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Sidebar } from '@/components/layout/Sidebar';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function AdminDashboard() {
  // Remove hardcoded stats
  const [overviewStats, setOverviewStats] = useState({
    totalUsers: 0,
    activeReferrals: 0,
    pendingApprovals: 0,
    totalProviders: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);

  // Mock data for users/providers
  const [showUserModal, setShowUserModal] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [userModalType, setUserModalType] = useState<'add' | 'edit'>('add');
  const [providerModalType, setProviderModalType] = useState<'add' | 'edit'>('add');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [providerForm, setProviderForm] = useState({ name: '', contact: '', status: 'active' });
  const [providers, setProviders] = useState<any[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', role: '', organization: '', status: 'active' });

  useEffect(() => {
    async function fetchStats() {
      setStatsLoading(true);
      setStatsError(null);
      try {
        const [usersRes, providersRes, referralsRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/providers'),
          fetch('/api/referrals'),
        ]);
        if (!usersRes.ok || !providersRes.ok || !referralsRes.ok) throw new Error('Failed to fetch stats');
        const usersData = await usersRes.json();
        const providersData = await providersRes.json();
        const referralsData = await referralsRes.json();
        const users = usersData.users || [];
        const providers = providersData.providers || [];
        const referrals = referralsData.referrals || [];
        setOverviewStats({
          totalUsers: users.length,
          totalProviders: providers.length,
          activeReferrals: referrals.filter((r: any) => r.status === 'in_progress').length,
          pendingApprovals: referrals.filter((r: any) => r.status === 'under_review' || r.status === 'provider_selection_required').length,
        });
      } catch (err: any) {
        setStatsError(err.message || 'Failed to load stats');
      } finally {
        setStatsLoading(false);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    fetchProviders();
    fetchUsers();
  }, []);

  async function fetchProviders() {
    setProvidersLoading(true);
    setProvidersError(null);
    try {
      const res = await fetch('/api/providers');
      if (!res.ok) throw new Error('Failed to fetch providers');
      const data = await res.json();
      setProviders(data.providers);
    } catch (err: any) {
      setProvidersError(err.message || 'Failed to fetch providers');
    } finally {
      setProvidersLoading(false);
    }
  }

  async function fetchUsers() {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.users);
    } catch (err: any) {
      setUsersError(err.message || 'Failed to fetch users');
    } finally {
      setUsersLoading(false);
    }
  }

  async function handleAddProvider() {
    try {
      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(providerForm),
      });
      if (!res.ok) throw new Error('Failed to add provider');
      setShowProviderModal(false);
      setProviderForm({ name: '', contact: '', status: 'active' });
      fetchProviders();
    } catch (err: any) {
      setProvidersError(err.message || 'Failed to add provider');
    }
  }

  async function handleEditProvider() {
    try {
      const res = await fetch('/api/providers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedProvider._id, ...providerForm }),
      });
      if (!res.ok) throw new Error('Failed to update provider');
      setShowProviderModal(false);
      setSelectedProvider(null);
      setProviderForm({ name: '', contact: '', status: 'active' });
      fetchProviders();
    } catch (err: any) {
      setProvidersError(err.message || 'Failed to update provider');
    }
  }

  async function handleDeleteProvider(id: string) {
    if (!window.confirm('Are you sure you want to delete this provider?')) return;
    try {
      const res = await fetch('/api/providers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete provider');
      fetchProviders();
    } catch (err: any) {
      setProvidersError(err.message || 'Failed to delete provider');
    }
  }

  async function handleAddUser() {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      });
      if (!res.ok) throw new Error('Failed to add user');
      setShowUserModal(false);
      setUserForm({ name: '', email: '', role: '', organization: '', status: 'active' });
      fetchUsers();
    } catch (err: any) {
      setUsersError(err.message || 'Failed to add user');
    }
  }

  async function handleEditUser() {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedUser._id, ...userForm }),
      });
      if (!res.ok) throw new Error('Failed to update user');
      setShowUserModal(false);
      setSelectedUser(null);
      setUserForm({ name: '', email: '', role: '', organization: '', status: 'active' });
      fetchUsers();
    } catch (err: any) {
      setUsersError(err.message || 'Failed to update user');
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
      setUsersError(err.message || 'Failed to delete user');
    }
  }

  const getProviderStatusBadge = (status: string) => {
    return (
      <Badge variant="outline" className={status === 'Active' || status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getUserRoleBadge = (role: string) => {
    switch (role) {
      case 'case_manager':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center">
            <Users className="mr-1 h-3 w-3" />
            Case Manager
          </Badge>
        );
      case 'provider':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center">
            <Users className="mr-1 h-3 w-3" />
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
            <Users className="mr-1 h-3 w-3" />
            {role}
          </Badge>
        );
    }
  };

  // Fetch notifications
  useEffect(() => {
    if (!showNotifications) return;
    async function fetchNotifications() {
      setNotificationsLoading(true);
      setNotificationsError(null);
      try {
        const res = await fetch('/api/notifications');
        if (!res.ok) throw new Error('Failed to fetch notifications');
        const data = await res.json();
        setNotifications(data.notifications || []);
      } catch (err) {
        setNotificationsError('Could not load notifications.');
      } finally {
        setNotificationsLoading(false);
      }
    }
    fetchNotifications();
  }, [showNotifications]);

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  // Mark notification as read
  async function markAsRead(id: string) {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotifications(notifications => notifications.map(n => n._id === id ? { ...n, read: true } : n));
    } catch {}
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">
        <PageTemplate
          title="Admin Dashboard"
          description="Monitor and manage the Referra platform"
          actions={
            <div className="flex items-center gap-4">
              <Popover open={showNotifications} onOpenChange={setShowNotifications}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-6 w-6 text-blue-500" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold animate-pulse">{unreadCount}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <div className="p-4 border-b font-semibold text-gray-900">Notifications</div>
                  <div className="max-h-64 overflow-y-auto divide-y">
                    {notificationsLoading ? (
                      <div className="p-4 text-gray-500 text-sm">Loading...</div>
                    ) : notificationsError ? (
                      <div className="p-4 text-red-500 text-sm">{notificationsError}</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-4 text-gray-500 text-sm">No notifications</div>
                    ) : notifications.map(n => (
                      <div
                        key={n._id}
                        className={`p-4 hover:bg-blue-50 transition-colors cursor-pointer ${!n.read ? 'font-semibold bg-blue-50/50' : ''}`}
                        onClick={() => markAsRead(n._id)}
                      >
                        <div className="text-sm text-gray-800">{n.content}</div>
                        <div className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
          </div>
                </PopoverContent>
              </Popover>
              <EnhancedButton size="lg" variant="gradient" className="animate-fade-in" asChild>
              <Link href="/admin/users">
                  <Users className="mr-2 h-5 w-5" />
                Manage Users
              </Link>
              </EnhancedButton>
            </div>
          }
        >
          {/* Overview Section - Stats */}
          <div className="mb-8 animate-slide-in-up">
            <Card className="hover:shadow-card-hover transition-shadow duration-300">
              <CardContent className="p-6">
                {statsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading stats...</div>
                ) : statsError ? (
                  <div className="text-center py-8 text-red-500">{statsError}</div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-4">
                    <div className="group cursor-pointer">
                      <p className="text-sm font-medium text-muted-foreground group-hover:text-primary-500 transition-colors">
                        Total Users
                      </p>
                      <p className="text-2xl font-bold mt-1 group-hover:text-primary-600 transition-colors">
                        {overviewStats.totalUsers}
                      </p>
                    </div>
                    <div className="group cursor-pointer">
                      <p className="text-sm font-medium text-muted-foreground group-hover:text-primary-500 transition-colors">
                        Active Referrals
                      </p>
                      <p className="text-2xl font-bold mt-1 group-hover:text-primary-600 transition-colors">
                        {overviewStats.activeReferrals}
                      </p>
                    </div>
                    <div className="group cursor-pointer">
                      <p className="text-sm font-medium text-muted-foreground group-hover:text-primary-500 transition-colors">
                        Pending Approvals
                      </p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <p className="text-2xl font-bold group-hover:text-primary-600 transition-colors">
                          {overviewStats.pendingApprovals}
                        </p>
                        {overviewStats.pendingApprovals > 0 && (
                          <Badge variant="destructive" className="text-xs animate-pulse">
                            Requires Action
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="group cursor-pointer">
                      <p className="text-sm font-medium text-muted-foreground group-hover:text-primary-500 transition-colors">
                        Total Providers
                      </p>
                      <p className="text-2xl font-bold mt-1 group-hover:text-primary-600 transition-colors">
                        {overviewStats.totalProviders}
                      </p>
          </div>
        </div>
                )}
            </CardContent>
          </Card>
        </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="all_referrals" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all_referrals">All Referrals</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="providers">Providers</TabsTrigger>
            </TabsList>

            <TabsContent value="all_referrals">
              <AdminReferralsTable />
            </TabsContent>

            <TabsContent value="users">
        <Card>
          <CardHeader>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>Manage all users on the platform</CardDescription>
          </CardHeader>
          <CardContent>
                  <div className="flex justify-end mb-4">
                    <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
                      <DialogTrigger asChild>
                        <Button onClick={() => { setUserModalType('add'); setUserForm({ name: '', email: '', role: '', organization: '', status: 'active' }); }}>
                          Add User
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{userModalType === 'add' ? 'Add User' : 'Edit User'}</DialogTitle>
                          <DialogDescription>{userModalType === 'add' ? 'Fill out the form to add a new user.' : 'Edit user details.'}</DialogDescription>
                        </DialogHeader>
                        <Input placeholder="Name" className="mb-2" value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} />
                        <Input placeholder="Email" className="mb-2" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} />
                        <Input placeholder="Role" className="mb-2" value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))} />
                        <Input placeholder="Organization" className="mb-2" value={userForm.organization} onChange={e => setUserForm(f => ({ ...f, organization: e.target.value }))} />
                        <Select value={userForm.status} onValueChange={val => setUserForm(f => ({ ...f, status: val }))}>
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
                          <Button variant="default" onClick={userModalType === 'add' ? handleAddUser : handleEditUser}>{userModalType === 'add' ? 'Add' : 'Save'}</Button>
                          <Button variant="ghost" onClick={() => setShowUserModal(false)}>Cancel</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {usersLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading users...</div>
                  ) : usersError ? (
                    <div className="text-center py-8 text-red-500">{usersError}</div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No users found</div>
                  ) : (
                    <div className="divide-y">
                      {users.map(user => (
                        <div key={user._id} className="flex items-center justify-between py-3">
                          <div>
                            <div className="font-semibold">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email} • {user.role}</div>
                            <div className="text-xs text-muted-foreground mt-1">Status: {user.status}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getUserRoleBadge(user.role)}
                            <Button size="sm" variant="outline" onClick={() => {
                              setUserModalType('edit');
                              setSelectedUser(user);
                              setUserForm({
                                name: user.name || '',
                                email: user.email || '',
                                role: user.role || '',
                                organization: user.organization || '',
                                status: user.status || 'active',
                              });
                              setShowUserModal(true);
                            }}>Edit</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(user._id)}>Delete</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="providers">
              <Card>
                <CardHeader>
                  <CardTitle>Providers</CardTitle>
                  <CardDescription>Manage all providers on the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end mb-4">
                    <Dialog open={showProviderModal} onOpenChange={setShowProviderModal}>
                      <DialogTrigger asChild>
                        <Button onClick={() => { setProviderModalType('add'); setProviderForm({ name: '', contact: '', status: 'active' }); }}>
                          Add Provider
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{providerModalType === 'add' ? 'Add Provider' : 'Edit Provider'}</DialogTitle>
                          <DialogDescription>{providerModalType === 'add' ? 'Fill out the form to add a new provider.' : 'Edit provider details.'}</DialogDescription>
                        </DialogHeader>
                        <Input placeholder="Name" className="mb-2" value={providerForm.name} onChange={e => setProviderForm(f => ({ ...f, name: e.target.value }))} />
                        <Input placeholder="Contact" className="mb-2" value={providerForm.contact} onChange={e => setProviderForm(f => ({ ...f, contact: e.target.value }))} />
                        <Select value={providerForm.status} onValueChange={val => setProviderForm(f => ({ ...f, status: val }))}>
                          <SelectTrigger className="mb-2">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <DialogFooter className="mt-4">
                          <Button variant="default" onClick={providerModalType === 'add' ? handleAddProvider : handleEditProvider}>{providerModalType === 'add' ? 'Add' : 'Save'}</Button>
                          <Button variant="ghost" onClick={() => setShowProviderModal(false)}>Cancel</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {providersLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading providers...</div>
                  ) : providersError ? (
                    <div className="text-center py-8 text-red-500">{providersError}</div>
                  ) : !Array.isArray(providers) || providers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No providers found</div>
                  ) : (
                    <div className="divide-y">
                      {providers.map(provider => (
                        <div key={provider._id} className="flex items-center justify-between py-3">
                          <div>
                            <div className="font-semibold">{provider.name}</div>
                            <div className="text-sm text-muted-foreground">{provider.contact}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getProviderStatusBadge(provider.status)}
                            <Button size="sm" variant="outline" onClick={() => {
                              setProviderModalType('edit');
                              setSelectedProvider(provider);
                              setProviderForm({
                                name: provider.name || '',
                                contact: provider.contact || '',
                                status: provider.status || 'active',
                              });
                              setShowProviderModal(true);
                            }}>Edit</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteProvider(provider._id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
                  )}
          </CardContent>
        </Card>
            </TabsContent>
          </Tabs>
        </PageTemplate>
      </main>
      </div>
  );
} 