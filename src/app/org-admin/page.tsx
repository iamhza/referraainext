'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building2, 
  FileText, 
  Clock,
  UserPlus,
  BarChart3,
  TrendingUp,
  Activity,
  Mail
} from 'lucide-react';
import Link from 'next/link';

interface OrgStats {
  totalUsers: number;
  totalTeams: number;
  totalClients: number;
  totalReferrals: number;
  pendingInvitations: number;
  averageCompletionTime: string;
  monthlyReferrals: number;
  activeUsers: number;
}

export default function OrgAdminDashboard() {
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch REAL organization statistics from API
    async function fetchRealStats() {
      try {
        const response = await fetch('/api/org/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data = await response.json();
        setStats(data.stats);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Fallback to empty stats if API fails
        setStats({
          totalUsers: 0,
          totalTeams: 0,
          totalClients: 0,
          totalReferrals: 0,
          pendingInvitations: 0,
          averageCompletionTime: '0 days',
          monthlyReferrals: 0,
          activeUsers: 0
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchRealStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Unable to load dashboard data.</p>
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
                Organization Administration
              </h1>
              <p className="text-gray-500 text-base">
                Manage your organization's users, teams, and monitor referral performance from this central dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} active this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teams</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeams}</div>
            <p className="text-xs text-muted-foreground">
              Across departments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Managed across teams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referrals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
            <p className="text-xs text-muted-foreground">
              {stats.monthlyReferrals} this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <UserPlus className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Organization is active</p>
                <p className="text-xs text-gray-500">
                  {stats.activeUsers} of {stats.totalUsers} users active this month
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Team performance update</p>
                <p className="text-xs text-gray-500">
                  {stats.totalTeams} teams managing {stats.totalClients} clients
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Monthly referrals processed</p>
                <p className="text-xs text-gray-500">
                  {stats.monthlyReferrals} referrals this month, {stats.totalReferrals} total
                </p>
              </div>
            </div>

            {stats.pendingInvitations > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                <Mail className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Pending invitations</p>
                  <p className="text-xs text-gray-500">
                    {stats.pendingInvitations} invitations awaiting response
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Completion Time</span>
              <span className="font-semibold">{stats.averageCompletionTime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Monthly Referrals</span>
              <span className="font-semibold">{stats.monthlyReferrals}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Users</span>
              <span className="font-semibold">{stats.activeUsers}/{stats.totalUsers}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending Invitations</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{stats.pendingInvitations}</span>
                <Link href="/org-admin/invitations">
                  <Button size="sm" variant="outline">View</Button>
                </Link>
              </div>
            </div>
            <div className="pt-4">
              <Link href="/org-admin/users">
                <Button className="w-full">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite New User
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/org-admin/users">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
            </Link>
            <Link href="/org-admin/teams">
              <Button variant="outline" className="w-full justify-start">
                <Building2 className="h-4 w-4 mr-2" />
                Manage Teams
              </Button>
            </Link>
            <Link href="/org-admin/analytics">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </Link>
            <Link href="/org-admin/settings">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Organization Settings
              </Button>
            </Link>
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  </div>
  );
}
