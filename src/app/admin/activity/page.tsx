'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, 
  Filter, 
  Activity, 
  User, 
  FileText, 
  Settings, 
  Shield,
  Clock,
  Eye,
  Edit,
  Trash2,
  Plus,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

interface ActivityLog {
  id: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'case_manager' | 'provider';
  };
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  severity: 'low' | 'medium' | 'high';
  ipAddress?: string;
  userAgent?: string;
}

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Mock data for now - replace with actual API call
  useEffect(() => {
    const mockActivities: ActivityLog[] = [
      {
        id: '1',
        timestamp: '2024-07-24T10:30:00Z',
        user: {
          id: 'admin-1',
          name: 'Admin User',
          email: 'admin@referra.com',
          role: 'admin'
        },
        action: 'created',
        resource: 'referral',
        resourceId: 'ref-123',
        details: 'Created new referral for client John Doe',
        severity: 'medium',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
      },
      {
        id: '2',
        timestamp: '2024-07-24T10:25:00Z',
        user: {
          id: 'cm-1',
          name: 'Sarah Johnson',
          email: 'sarah@caseworker.com',
          role: 'case_manager'
        },
        action: 'assigned',
        resource: 'provider',
        resourceId: 'prov-456',
        details: 'Assigned provider Dr. Smith to referral ref-123',
        severity: 'low',
        ipAddress: '192.168.1.101'
      },
      {
        id: '3',
        timestamp: '2024-07-24T10:20:00Z',
        user: {
          id: 'admin-1',
          name: 'Admin User',
          email: 'admin@referra.com',
          role: 'admin'
        },
        action: 'deleted',
        resource: 'user',
        resourceId: 'user-789',
        details: 'Deleted inactive user account',
        severity: 'high',
        ipAddress: '192.168.1.100'
      },
      {
        id: '4',
        timestamp: '2024-07-24T10:15:00Z',
        user: {
          id: 'prov-1',
          name: 'Dr. Emily Rodriguez',
          email: 'emily@mentalhealth.com',
          role: 'provider'
        },
        action: 'updated',
        resource: 'profile',
        details: 'Updated provider profile information',
        severity: 'low',
        ipAddress: '192.168.1.102'
      },
      {
        id: '5',
        timestamp: '2024-07-24T10:10:00Z',
        user: {
          id: 'admin-1',
          name: 'Admin User',
          email: 'admin@referra.com',
          role: 'admin'
        },
        action: 'configured',
        resource: 'system',
        details: 'Updated system configuration settings',
        severity: 'medium',
        ipAddress: '192.168.1.100'
      }
    ];

    setActivities(mockActivities);
    setLoading(false);
  }, []);

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      activity.user.name.toLowerCase().includes(search.toLowerCase()) ||
      activity.user.email.toLowerCase().includes(search.toLowerCase()) ||
      activity.action.toLowerCase().includes(search.toLowerCase()) ||
      activity.resource.toLowerCase().includes(search.toLowerCase()) ||
      activity.details.toLowerCase().includes(search.toLowerCase());
    
    const matchesUser = userFilter === 'all' || activity.user.role === userFilter;
    const matchesAction = actionFilter === 'all' || activity.action === actionFilter;
    const matchesSeverity = severityFilter === 'all' || activity.severity === severityFilter;
    
    return matchesSearch && matchesUser && matchesAction && matchesSeverity;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800"><Info className="w-3 h-3 mr-1" />Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Low</Badge>;
      default:
        return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'updated':
        return <Edit className="w-4 h-4 text-blue-600" />;
      case 'deleted':
        return <Trash2 className="w-4 h-4 text-red-600" />;
      case 'viewed':
        return <Eye className="w-4 h-4 text-gray-600" />;
      case 'assigned':
        return <User className="w-4 h-4 text-purple-600" />;
      case 'configured':
        return <Settings className="w-4 h-4 text-orange-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-red-600" />;
      case 'case_manager':
        return <User className="w-4 h-4 text-blue-600" />;
      case 'provider':
        return <FileText className="w-4 h-4 text-green-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-gray-600 mt-2">Monitor system activity and user actions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Log
          </Button>
          <Button className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            View Reports
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900">{activities.length}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today</p>
                <p className="text-2xl font-bold text-green-600">
                  {activities.filter(a => {
                    const today = new Date().toDateString();
                    const activityDate = new Date(a.timestamp).toDateString();
                    return today === activityDate;
                  }).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Severity</p>
                <p className="text-2xl font-bold text-red-600">
                  {activities.filter(a => a.severity === 'high').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(activities.map(a => a.user.id)).size}
                </p>
              </div>
              <User className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search activities..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue placeholder="User Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="case_manager">Case Manager</SelectItem>
                <SelectItem value="provider">Provider</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="updated">Updated</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="configured">Configured</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity ({filteredActivities.length})</CardTitle>
          <CardDescription>System activity and user actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {getActionIcon(activity.action)}
                  {getRoleIcon(activity.user.role)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                        {getInitials(activity.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-gray-900">{activity.user.name}</span>
                    <span className="text-gray-500">({activity.user.email})</span>
                    {getSeverityBadge(activity.severity)}
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-medium capitalize">{activity.action}</span> {activity.resource}
                    {activity.resourceId && <span className="text-gray-500"> ({activity.resourceId})</span>}
                  </p>
                  
                  <p className="text-sm text-gray-600">{activity.details}</p>
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(activity.timestamp)}
                    </span>
                    {activity.ipAddress && (
                      <span>IP: {activity.ipAddress}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredActivities.length === 0 && (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No activities found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 