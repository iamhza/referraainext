'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Users, PlusCircle, Bell } from 'lucide-react';
import Link from 'next/link';
import { PageTemplate } from '@/components/templates/page-template';

import { AdminReferralsTable } from '@/components/dashboard/AdminReferralsTable';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Sidebar } from '@/components/layout/Sidebar';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Logo } from '@/components/ui/Logo';
import { TopNav } from '@/components/layout/TopNav';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { user, loading } = useAuth();
  const router = useRouter();

  // Remove hardcoded stats
  const [overviewStats, setOverviewStats] = useState({
    totalReferrals: 0,
    activeProviders: 0,
    avgProviderResponseTime: '--',
    referralsAssigned7d: 0,
    totalUsers: 0,
    activeReferrals: 0,
    pendingApprovals: 0,
    totalProviders: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

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
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

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
          totalReferrals: referrals.length,
          activeProviders: providers.filter((p: any) => p.status === 'active').length,
          avgProviderResponseTime: '15', // TODO: Replace with real calculation
          referralsAssigned7d: referrals.filter((r: any) => {
            const created = new Date(r.createdAt);
            const now = new Date();
            const diff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
            return diff <= 7 && r.status === 'assigned';
          }).length,
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

  async function handleCleanupBrokenClients() {
    if (!window.confirm('Are you sure you want to delete all clients with broken CSV data? This action cannot be undone.')) return;
    
    setCleanupLoading(true);
    setCleanupResult(null);
    
    try {
      const res = await fetch('/api/admin/cleanup-broken-clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cleanup broken clients');
      }
      
      setCleanupResult(`✅ Successfully deleted ${data.deletedCount} clients with broken CSV data`);
    } catch (err: any) {
      setCleanupResult(`❌ Error: ${err.message}`);
    } finally {
      setCleanupLoading(false);
    }
  }

  const getProviderStatusBadge = (status: string | undefined) => {
    return (
      <Badge variant="outline" className={status === 'Active' || status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
        {status
          ? status.charAt(0).toUpperCase() + status.slice(1)
          : 'Unknown'}
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
          <Badge variant="secondary" className="bg-gray-200 text-gray-700">
            Admin
          </Badge>
        );
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user || user.user_metadata?.role !== 'admin') {
    router.push('/auth/signin');
    return null;
  }

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Dashboard Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="shadow-sm">
            <CardContent className="py-6">
              <div className="text-sm text-gray-500 mb-1">Total Referrals</div>
              <div className="text-3xl font-bold text-gray-900">{overviewStats.totalReferrals ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="py-6">
              <div className="text-sm text-gray-500 mb-1">Active Providers</div>
              <div className="text-3xl font-bold text-gray-900">{overviewStats.activeProviders ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="py-6">
              <div className="text-sm text-gray-500 mb-1">Avg. Provider Response Time</div>
              <div className="text-3xl font-bold text-gray-900">{overviewStats.avgProviderResponseTime ?? '--'} min</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="py-6">
              <div className="text-sm text-gray-500 mb-1">Referrals Assigned (7d)</div>
              <div className="text-3xl font-bold text-gray-900">{overviewStats.referralsAssigned7d ?? 0}</div>
            </CardContent>
          </Card>
        </div>
        {/* Tabbed Interface */}
        <Tabs defaultValue="referrals" className="space-y-6">
          <TabsList>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>
          <TabsContent value="referrals">
            <AdminReferralsTable />
          </TabsContent>
          <TabsContent value="providers">
            <Card>
              <CardHeader>
                <CardTitle>Providers</CardTitle>
                <CardDescription>Directory of all providers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-400 py-12">Providers table coming soon...</div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>Manage all users on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-400 py-12">Users table coming soon...</div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
                <CardDescription>Audit log of all admin actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-400 py-12">Activity feed coming soon...</div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <CardTitle>Data Maintenance</CardTitle>
                <CardDescription>Clean up corrupted or invalid data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                  <h3 className="font-medium text-orange-900 mb-2">Cleanup Broken CSV Clients</h3>
                  <p className="text-sm text-orange-700 mb-4">
                    Remove clients with corrupted data from failed CSV imports. These clients have incomplete addresses 
                    and incorrect field mapping (e.g., city names in county field).
                  </p>
                  <div className="flex items-center gap-4">
                    <Button 
                      onClick={handleCleanupBrokenClients}
                      disabled={cleanupLoading}
                      variant="destructive"
                      size="sm"
                    >
                      {cleanupLoading ? 'Cleaning up...' : 'Delete Broken Clients'}
                    </Button>
                    {cleanupResult && (
                      <div className="text-sm font-medium">
                        {cleanupResult}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
} 