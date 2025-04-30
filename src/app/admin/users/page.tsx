'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Users, Shield, CheckCircle, XCircle } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock user data
  const allUsers = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah.j@healthcare.org",
      phone: "612-555-1234",
      role: "case_manager",
      organization: "Hennepin County Human Services",
      joinDate: "Apr 9, 2025",
      status: "active",
      lastActive: "Today, 10:23 AM"
    },
    {
      id: 2,
      name: "Michael Rivera",
      email: "m.rivera@wellness.org",
      phone: "612-555-5678",
      role: "provider",
      organization: "Wellness Center",
      joinDate: "Apr 8, 2025",
      status: "active",
      lastActive: "Yesterday, 3:45 PM"
    }
  ];

  // Filter users based on search and filters
  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = 
      searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.organization.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Get role badge styles
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
          <Button>
            <User className="mr-2 h-4 w-4" />
            Add New User
          </Button>
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
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {user.email} • {user.organization}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last active: {user.lastActive}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {getRoleBadge(user.role)}
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
} 