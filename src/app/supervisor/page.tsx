'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  ClipboardList,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface TeamStats {
  totalCaseManagers: number;
  totalClients: number;
  avgCaseload: number;
  pendingAssignments: number;
  completedReferrals: number;
  teamPerformance: number;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  caseload: number;
  lastActive: string;
  status: 'active' | 'away' | 'busy';
}

export default function SupervisorDashboard() {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch real team members from the organization using NextAuth endpoint
      const response = await fetch('/api/org/team-members');
      
      if (response.ok) {
        const data = await response.json();
        
        // Filter to only case managers in this supervisor's org
        const caseManagers = data.users
          .filter((u: any) => u.role === 'case_manager')
          .map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            caseload: u.clientCount || 0, // Use client count from API
            lastActive: u.updated_at ? new Date(u.updated_at).toLocaleString() : 'Unknown',
            status: u.is_active ? 'active' : 'away'
          }));
        
        setTeamMembers(caseManagers);
        
        // Calculate stats based on real data
        const totalClients = caseManagers.reduce((sum, cm) => sum + cm.caseload, 0);
        const avgCaseload = caseManagers.length > 0 ? Math.round(totalClients / caseManagers.length) : 0;
        
        setStats({
          totalCaseManagers: caseManagers.length,
          totalClients,
          avgCaseload,
          pendingAssignments: 0, // TODO: Calculate from assignments
          completedReferrals: 0, // TODO: Calculate from referrals
          teamPerformance: 0 // TODO: Calculate team performance metric
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'active': 'bg-green-100 text-green-800',
      'away': 'bg-yellow-100 text-yellow-800',
      'busy': 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge variant="outline" className={variants[status as keyof typeof variants]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Team Supervision Dashboard
              </h1>
              <p className="text-gray-500 text-base">
                Monitor team performance and manage case assignments across your organization.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/supervisor/assignments">
            <Button variant="outline" size="sm">
              <ClipboardList className="w-4 h-4 mr-2" />
              Manage Assignments
            </Button>
          </Link>
          <Link href="/supervisor/invite">
            <Button size="sm">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Case Manager
            </Button>
          </Link>
          <Button variant="outline" onClick={fetchDashboardData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>
        
        <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Team Members</p>
                <p className="text-2xl font-bold">{stats?.totalCaseManagers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold">{stats?.totalClients}</p>
              </div>
              <ClipboardList className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Caseload</p>
                <p className="text-2xl font-bold">{stats?.avgCaseload}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Assignments</p>
                <p className="text-2xl font-bold text-orange-600">{stats?.pendingAssignments}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Members */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-600">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{member.caseload} clients</p>
                      <p className="text-xs text-gray-500">Last active {member.lastActive}</p>
                    </div>
                    {getStatusBadge(member.status)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link href="/supervisor/team">
                <Button variant="outline" className="w-full">
                  View All Team Members
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/supervisor/invite">
              <Button className="w-full justify-start">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Case Manager
              </Button>
            </Link>
            
            <Link href="/supervisor/assignments">
              <Button variant="outline" className="w-full justify-start">
                <ClipboardList className="w-4 h-4 mr-2" />
                Assign Clients
              </Button>
            </Link>
            
            <Link href="/supervisor/analytics">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </Link>
            
            <div className="pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats?.teamPerformance}%</div>
                <div className="text-sm text-gray-600">Team Performance</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Team Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Sarah Johnson completed referral for Client #1234</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <UserPlus className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">New case manager invitation sent to john@truwellmn.com</p>
                <p className="text-xs text-gray-500">4 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">12 clients pending assignment</p>
                <p className="text-xs text-gray-500">6 hours ago</p>
              </div>
            </div>
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  </div>
  );
}
