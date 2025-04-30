# Referra - Healthcare Referral Management Platform

## Executive Summary

Referra is a sophisticated healthcare referral management platform built with modern web technologies. The platform facilitates the connection between healthcare providers, case managers, streamlining the referral process in healthcare services.

## Technical Stack

### Core Technologies
- **Frontend Framework**: Next.js 14 (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom configuration
- **Authentication**: Supabase Auth
- **Database**: 
  - Supabase (PostgreSQL) for core data
  - MongoDB for PHI (Protected Health Information)
- **State Management**: React Context API
- **UI Components**: Custom component library built on shadcn/ui

### Key Technical Decisions

1. **Next.js App Router**
   - Utilizing the latest Next.js 14 features
   - Server-side rendering for improved performance
   - API routes for backend functionality

2. **Dual Database Strategy**
   - Supabase for general application data
   - MongoDB for PHI compliance and sensitive data storage
   - Clear separation of concerns for regulatory compliance

3. **Authentication & Authorization**
   - Supabase Auth integration
   - Role-based access control (RBAC)
   - Middleware protection for routes
   - Secure session management

## Project Structure

### Core Directories

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── case-manager/      # Case manager dashboard
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/               # Reusable UI components
│   ├── dashboard/        # Dashboard-specific components
│   └── layout/          # Layout components
├── contexts/             # React Context providers
├── hooks/               # Custom React hooks
└── lib/                # Utility functions and configurations
```

## Key Features & Implementation

### 1. Authentication System
- Secure sign-in/sign-up flow
- Role-based access control
- Protected routes via middleware
- Session management with Supabase

### 2. Case Manager Dashboard
- Comprehensive overview of referrals
- Real-time metrics and statistics
- Recent activity tracking
- Provider matching system

### 3. Referral Management
- Create and track referrals
- PHI-compliant data handling
- Status tracking and updates
- Provider matching will be done manaully by admin team

### 4. User Interface
- Responsive design
- Mobile-first approach
- Accessible components
- Dark mode support (planned)

## Component Architecture

### Directory Structure
```
components/
├── ui/          # Base UI components
├── providers/   # Provider-related components
├── clients/     # Client management components
├── dashboard/   # Dashboard widgets and metrics
├── referrals/   # Referral management components
├── layout/      # Layout and structural components
└── placeholder/ # Loading and placeholder components
```

### Component Categories

1. **Base UI Components** (ui/)
   - Shadcn/UI integration
   - Custom styled components
   - Form elements
   - Interactive elements

2. **Feature Components**
   - **Providers/**
     - Provider listing
     - Provider details
     - Provider matching interface
   - **Clients/**
     - Client management
     - Client details
     - Client history
   - **Dashboard/**
     - Metrics display
     - Activity feeds
     - Quick actions
   - **Referrals/**
     - Referral form
     - Referral list
     - Status tracking
   - **Layout/**
     - Sidebar navigation
     - Header components
     - Page layouts

## API Structure

### Endpoints Organization
```
api/
├── referrals/   # Referral management endpoints
├── phi/         # Protected Health Information handling
└── test/        # Test and development endpoints
```

### API Implementation

1. **Referrals API**
   - Create new referrals
   - Update referral status
   - Fetch referral details
   - List and filter referrals

2. **PHI Management**
   - Secure PHI storage
   - HIPAA-compliant data handling
   - Encrypted data transmission
   - Access control and auditing

3. **Testing Endpoints**
   - Development utilities
   - Integration testing support
   - API validation

## Database Schema

### Supabase Tables
1. **Users**
   - Authentication
   - Role management
   - Profile information

2. **Referrals**
   - Core referral data
   - Status tracking
   - Timestamps
   - Relationships

3. **Providers**
   - Provider profiles
   - Specializations
   - Availability
   - Service areas

### MongoDB Collections
1. **PHI**
   - Patient information
   - Medical history
   - Contact details
   - Consent records

2. **Documents**
   - Medical records
   - Consent forms
   - Referral documentation

## Authentication Flow

1. **Sign In Process**
   ```
   Client -> Auth Page -> Supabase Auth -> Role Check -> Dashboard
   ```

2. **Session Management**
   - Server-side session validation
   - Client-side state management
   - Role-based access control
   - Secure cookie handling

3. **Protected Routes**
   - Middleware validation
   - Role verification
   - Session checks
   - Redirect handling

## Development Status

### Completed Features
1. **Authentication**
   - Sign in/out
   - Role management
   - Session handling
   - Protected routes

2. **Dashboard**
   - Basic metrics
   - Navigation
   - Role-based views
   - Mobile responsiveness

3. **Referrals**
   - Basic CRUD operations
   - Form handling
   - List view
   - Status management

### In Progress
1. **Provider Management**
   - Provider profiles
   - Matching system
   - Availability tracking

2. **Client Management**
   - Client records
   - History tracking
   - Document management

3. **PHI System**
   - Secure storage
   - Access control
   - Audit logging

## Security Measures

1. **Authentication**
   - Secure session management
   - Protected routes
   - Role verification

2. **Data Protection**
   - PHI data isolation
   - Encrypted transmission
   - Secure storage practices

3. **Access Control**
   - Role-based permissions
   - Route protection
   - API endpoint security

## Current Status & Next Steps

### Implemented Features
- ✅ Authentication system
- ✅ Case manager dashboard
- ✅ Basic referral management
- ✅ User interface components
- ✅ Role-based access control

### Pending Implementation
1. **Data Management**
   - Complete CRUD operations for referrals
   - Provider management system
   - Advanced search and filtering

2. **User Experience**
   - Form validation improvements
   - Error handling enhancements
   - Loading states and animations

3. **Features**
   - Provider matching algorithm
   - Notification system
   - Reporting and analytics
   - Document management
   - Communication system

4. **Technical Debt**
   - Test coverage
   - Performance optimization
   - Error boundary implementation
   - Logging system
   - API documentation

## Recommendations

### Immediate Priority
1. Complete the referral management system
2. Implement comprehensive form validation
3. Add error boundaries and error handling
4. Develop the provider matching system

### Medium-term Goals
1. Add real-time notifications
2. Implement document upload/management
3. Create reporting dashboard
4. Add communication features

### Long-term Vision
1. Analytics and ML for provider matching
2. Mobile application
3. Integration with EHR systems
4. Advanced reporting and analytics

## Technical Debt & Improvements

### Code Quality
- Add comprehensive testing
- Implement proper error handling
- Add input validation
- Improve type safety

### Performance
- Implement caching strategy
- Optimize database queries
- Add loading states
- Implement pagination

### Security
- Regular security audits
- HIPAA compliance review
- Implement audit logging
- Add 2FA support

## Technical Dependencies & Development Environment

### Core Dependencies
```json
{
  "next": "14.1.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "@supabase/ssr": "^0.6.1",
  "@supabase/supabase-js": "^2.39.3",
  "mongodb": "^6.3.0"
}
```

### UI Component Libraries
1. **Radix UI**
   - Complete primitive component collection
   - Accessibility-first design
   - Customizable components
   - Comprehensive UI coverage

2. **Utility Libraries**
   - `class-variance-authority` for component variants
   - `clsx` for conditional classes
   - `tailwind-merge` for style management
   - `date-fns` for date manipulation

### Development Tools
1. **TypeScript Configuration**
   - Strict type checking
   - Next.js types
   - Custom type definitions

2. **Code Quality**
   - ESLint configuration
   - Next.js recommended rules
   - TypeScript-aware linting

3. **Styling Tools**
   - Tailwind CSS
   - PostCSS processing
   - Autoprefixer
   - Animation utilities

### Environment Setup
1. **Development**
   ```bash
   npm run dev    # Start development server
   npm run lint   # Run linting
   ```

2. **Production**
   ```bash
   npm run build  # Create production build
   npm start      # Start production server
   ```

3. **Environment Variables**
   - Supabase configuration
   - MongoDB connection
   - API endpoints
   - Feature flags

## Development Workflow

### Code Organization
1. **Feature-based Structure**
   - Components grouped by feature
   - Shared utilities in lib/
   - Context providers for state
   - API routes by domain

2. **Type Safety**
   - TypeScript throughout
   - Strict null checks
   - Interface definitions
   - Type guards

3. **State Management**
   - Context API for global state
   - Local state with hooks
   - Server state management
   - Form state handling

### Deployment Strategy
1. **Build Process**
   - Next.js optimization
   - Asset compression
   - Code splitting
   - Cache management

2. **Environment Management**
   - Development setup
   - Staging environment
   - Production deployment
   - Environment variables

3. **Monitoring & Maintenance**
   - Error tracking
   - Performance monitoring
   - Security updates
   - Dependency management

## Conclusion

Referra shows strong potential as a healthcare referral management platform. The technical foundation is solid, with modern technologies and good architectural decisions. The immediate focus should be on completing core features while maintaining code quality and security standards.

Key strengths include:
- Modern tech stack
- Strong security foundation
- Clean architecture
- Scalable design

Priority areas for improvement:
1. Complete core features
2. Add comprehensive testing
3. Enhance error handling
4. Implement monitoring and logging
5. Add advanced security features

This analysis provides a roadmap for developing Referra into a full-featured, production-ready healthcare referral management platform. 


----------------------------

99.0 - Pages Section: Double Check Our Pages/Dashboards 

# Next.js Pages Migration Guide

## 1. Admin Pages

### 1.1 Admin Dashboard (`/admin/page.tsx`)
```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminDashboard() {
  // Data for recent users
  const recentUsers = [
    { id: 101, name: "Sarah Johnson", role: "Case Manager", agency: "Hennepin County", joinDate: "Apr 10, 2025" },
    { id: 102, name: "Michael Rivera", role: "Provider", organization: "Wellness Center", joinDate: "Apr 9, 2025" },
    { id: 103, name: "Aisha Patel", role: "Case Manager", agency: "Ramsey County", joinDate: "Apr 8, 2025" },
  ];

  return (
    <AdminLayout>
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500">Monitor and manage the Referra platform</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Activity className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.role}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {user.joinDate}
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
```

### 1.2 Admin Referrals (`/admin/referrals/page.tsx`)
```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, CheckCircle, Calendar, X } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminReferrals() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  // Mock referral data
  const allReferrals = [
    { 
      id: 4829, 
      service: "Adult rehabilitative mental health services (ARMHS)", 
      caseManager: "Sarah Johnson",
      dateCreated: "Apr 9, 2025",
      urgency: "high", 
      county: "Hennepin",
      status: "pending", 
      matchCount: 0
    },
    // Add more referral data
  ];

  // Filter referrals based on search and filters
  const filteredReferrals = allReferrals.filter(referral => {
    const matchesSearch = 
      searchTerm === '' || 
      referral.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.caseManager.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.id.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || referral.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'all' || referral.urgency === urgencyFilter;
    
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  // Get status badge styles
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center">
            <Clock className="mr-1 h-3 w-3" />
            Pending Match
          </Badge>
        );
      // Add more status badges
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Referrals</h1>
            <p className="text-gray-500">Manage and track all referrals</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Search referrals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="md:w-1/3"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="md:w-1/4">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="md:w-1/4">
                  <SelectValue placeholder="Filter by urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Urgencies</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Referrals List */}
        <Card>
          <CardHeader>
            <CardTitle>All Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredReferrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{referral.service}</h3>
                    <p className="text-sm text-muted-foreground">
                      Case Manager: {referral.caseManager}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(referral.status)}
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
```

### 1.3 User Management (`/admin/users/page.tsx`)
```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Users, Shield, CheckCircle, XCircle, Clock } from 'lucide-react';
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
    // Add more user data
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
      // Add more role badges
    }
  };

  // Get status badge styles
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center">
            <CheckCircle className="mr-1 h-3 w-3" />
            Active
          </Badge>
        );
      // Add more status badges
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
                  </div>
                  <div className="flex items-center gap-4">
                    {getRoleBadge(user.role)}
                    {getStatusBadge(user.status)}
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
```

### 1.4 Referral Matching (`/admin/referral-matching/[referralId]/page.tsx`)
```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, CheckCircle, Calendar, X } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';

export default function ReferralMatching() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [filterDistance, setFilterDistance] = useState(true);
  const [filterInsurance, setFilterInsurance] = useState(true);
  const [filterAvailability, setFilterAvailability] = useState(true);

  // Mock referral data
  const referral = {
    id: "REF-4829",
    service: "Adult rehabilitative mental health services (ARMHS)",
    urgency: "high",
    dateCreated: "Apr 9, 2025",
    status: "pending",
    caseManager: {
      name: "Sarah Johnson",
      organization: "Hennepin County Human Services",
      phone: "612-555-1234",
      email: "sarah.j@healthcare.org"
    },
    client: {
      referenceId: "CLIENT-2329",
      county: "Hennepin",
      zipCode: "55403",
      preferredLanguages: ["English", "Spanish"],
      accessibility: ["Wheelchair Access"],
      insurances: ["Medical Assistance", "UCare"]
    },
    notes: "Client is looking for services to help maintain independence in the community. Has previously had ARMHS services but provider left the field. Prefers female provider if possible."
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Referral Matching</h1>
            <p className="text-gray-500">Match providers with referral #{referral.id}</p>
          </div>
        </div>

        {/* Referral Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Referral Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium">Service</h3>
                <p>{referral.service}</p>
              </div>
              <div>
                <h3 className="font-medium">Urgency</h3>
                <Badge className="bg-red-100 text-red-800">High</Badge>
              </div>
              <div>
                <h3 className="font-medium">Case Manager</h3>
                <p>{referral.caseManager.name}</p>
                <p className="text-sm text-muted-foreground">{referral.caseManager.organization}</p>
              </div>
              <div>
                <h3 className="font-medium">Client</h3>
                <p>Reference ID: {referral.client.referenceId}</p>
                <p className="text-sm text-muted-foreground">{referral.client.county} County</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Provider Matching */}
        <Card>
          <CardHeader>
            <CardTitle>Provider Matching</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Provider list will go here */}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
```

## 2. Case Manager Pages

### 2.1 Dashboard (`/case-manager/page.tsx`)
```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import OpenReferrals from '@/components/dashboard/OpenReferrals';
import PriorityMetrics from '@/components/dashboard/PriorityMetrics';
import ReferralPipeline from '@/components/dashboard/ReferralPipeline';
import FeaturedProviders from '@/components/dashboard/FeaturedProviders';

export default function CaseManagerDashboard() {
  const userName = "Casey"; // This would come from user context
  
  return (
    <DashboardLayout>
      <div className="container px-6 py-6 max-w-6xl mx-auto">
        {/* Welcome Header */}
        <Card className="border-none shadow-sm mb-6">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome, {userName}</h1>
                <p className="text-gray-500 mt-1">Manage your service referrals</p>
              </div>
              <Button className="bg-referra-500 hover:bg-referra-600" asChild>
                <Link href="/case-manager/new-referral">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Referral
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Open Referrals */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Open Referrals</CardTitle>
              </CardHeader>
              <CardContent>
                <OpenReferrals />
              </CardContent>
            </Card>

            {/* Referral Pipeline */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Referral Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ReferralPipeline />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Priority Actions */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Priority Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <PriorityMetrics />
              </CardContent>
            </Card>

            {/* Featured Providers */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Recommended Providers</CardTitle>
              </CardHeader>
              <CardContent>
                <FeaturedProviders />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
```

### 2.2 New Referral (`/case-manager/new-referral/page.tsx`)
```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function NewReferral() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    clientName: '',
    service: '',
    urgency: '',
    county: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
  };

  return (
    <DashboardLayout>
      <div className="container px-6 py-6 max-w-4xl mx-auto">
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link href="/case-manager" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to dashboard
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create New Referral</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="service">Service Type</Label>
                  <Select
                    value={formData.service}
                    onValueChange={(value) => setFormData({...formData, service: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mental_health">Mental Health Services</SelectItem>
                      <SelectItem value="substance_use">Substance Use Treatment</SelectItem>
                      <SelectItem value="housing">Housing Services</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="urgency">Urgency Level</Label>
                  <Select
                    value={formData.urgency}
                    onValueChange={(value) => setFormData({...formData, urgency: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="county">County</Label>
                  <Select
                    value={formData.county}
                    onValueChange={(value) => setFormData({...formData, county: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select county" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hennepin">Hennepin</SelectItem>
                      <SelectItem value="ramsey">Ramsey</SelectItem>
                      <SelectItem value="dakota">Dakota</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Enter any additional information about the referral"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="bg-referra-500 hover:bg-referra-600">
                  Create Referral
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
```

### 2.3 Referrals List (`/case-manager/referrals/page.tsx`)
```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, CheckCircle, Calendar, X } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function Referrals() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  // Mock referral data
  const allReferrals = [
    { 
      id: 4829, 
      service: "Adult rehabilitative mental health services (ARMHS)", 
      caseManager: "Sarah Johnson",
      dateCreated: "Apr 9, 2025",
      urgency: "high", 
      county: "Hennepin",
      status: "pending", 
      matchCount: 0
    },
    // Add more referral data
  ];

  // Filter referrals based on search and filters
  const filteredReferrals = allReferrals.filter(referral => {
    const matchesSearch = 
      searchTerm === '' || 
      referral.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.caseManager.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.id.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || referral.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'all' || referral.urgency === urgencyFilter;
    
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  // Get status badge styles
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center">
            <Clock className="mr-1 h-3 w-3" />
            Pending Match
          </Badge>
        );
      // Add more status badges
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Referrals</h1>
            <p className="text-gray-500">Manage and track your referrals</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Search referrals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="md:w-1/3"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="md:w-1/4">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="md:w-1/4">
                  <SelectValue placeholder="Filter by urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Urgencies</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Referrals List */}
        <Card>
          <CardHeader>
            <CardTitle>All Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredReferrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{referral.service}</h3>
                    <p className="text-sm text-muted-foreground">
                      Case Manager: {referral.caseManager}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(referral.status)}
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
    </DashboardLayout>
  );
}
```

### 2.4 Matched Providers (`/case-manager/matched-providers/[referralId]/page.tsx`)
```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, CheckCircle, Calendar, X } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function MatchedProviders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  // Mock provider data
  const providers = [
    {
      id: 'provider1',
      name: 'Minnesota Care Center',
      description: 'Comprehensive mental health clinic with specialized services for adults and adolescents',
      matchScore: 96,
      availability: 'high',
      waitTime: '1-2 days',
      address: '123 Healthcare Ave, Minneapolis, MN 55401',
      distance: '3.2 miles',
      phone: '(612) 555-1234',
      email: 'intake@mncare.example.com',
      website: 'www.mncare.example.com',
      certifications: ['JCAHO Accredited', 'State Certified', 'Insurance Approved'],
      services: ['Individual Therapy', 'Group Therapy', 'Medication Management', 'Crisis Services'],
      acceptedInsurance: ['Medicaid', 'Medicare', 'Blue Cross', 'UnitedHealthcare', 'Cigna'],
      languages: ['English', 'Spanish', 'Hmong', 'Somali'],
      accessibility: ['Wheelchair Accessible', 'Public Transit Access', 'Interpreter Services'],
      rating: 4.8,
      reviews: 124
    },
    // Add more provider data
  ];

  // Filter providers based on search
  const filteredProviders = providers.filter(provider => 
    searchTerm === '' || 
    provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Matched Providers</h1>
            <p className="text-gray-500">Select a provider for your referral</p>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <Input
              placeholder="Search providers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Providers List */}
        <div className="space-y-4">
          {filteredProviders.map((provider) => (
            <Card key={provider.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-lg">{provider.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{provider.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-green-100 text-green-800">
                        {provider.matchScore}% Match
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800">
                        {provider.availability} Availability
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={selectedProvider === provider.id ? "default" : "outline"}
                      onClick={() => setSelectedProvider(provider.id)}
                    >
                      {selectedProvider === provider.id ? "Selected" : "Select Provider"}
                    </Button>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
```

### 2.5 Referral Tracker (`/case-manager/referral-tracker/[referralId]/page.tsx`)
```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, Calendar, X } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ReferralTracker() {
  const [showMessages, setShowMessages] = useState(false);

  // Mock referral data
  const referral = {
    id: "REF-4829",
    client: "John Smith",
    status: "in_progress",
    serviceType: "Mental Health Services",
    urgency: "high",
    createdAt: "2025-04-10",
    matchedAt: "2025-04-11",
    startedAt: "2025-04-12",
    estimatedCompletionDate: "2025-05-12",
    progressPercentage: 40,
    provider: {
      name: "Minnesota Care Center",
      contact: "Dr. Sarah Williams",
      email: "swilliams@mcc.example.com",
      phone: "(612) 555-1234"
    },
    caseManager: {
      name: "Michael Johnson",
      email: "mjohnson@agency.example.com",
      phone: "(651) 555-7890"
    },
    nextMilestone: {
      title: "Initial Assessment",
      date: "2025-04-15",
      status: "upcoming"
    },
    recentActivity: [
      {
        type: "message",
        description: "Provider sent a message",
        timestamp: "2025-04-13 14:30",
        actor: "provider"
      },
      {
        type: "milestone",
        description: "Intake paperwork completed",
        timestamp: "2025-04-12 10:15",
        actor: "case_manager"
      },
      {
        type: "status_change",
        description: "Referral status changed to In Progress",
        timestamp: "2025-04-12 09:00",
        actor: "system"
      },
      {
        type: "match",
        description: "Referral matched with Minnesota Care Center",
        timestamp: "2025-04-11 15:45",
        actor: "case_manager"
      }
    ]
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Referral Tracker</h1>
            <p className="text-gray-500">Track the progress of referral #{referral.id}</p>
          </div>
        </div>

        {/* Progress Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">{referral.progressPercentage}%</span>
                </div>
                <Progress value={referral.progressPercentage} className="h-2" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Next Milestone</h3>
                  <p className="text-sm text-muted-foreground">{referral.nextMilestone.title}</p>
                  <p className="text-sm text-muted-foreground">{referral.nextMilestone.date}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Provider</h3>
                  <p className="text-sm text-muted-foreground">{referral.provider.name}</p>
                  <p className="text-sm text-muted-foreground">{referral.provider.contact}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Case Manager</h3>
                  <p className="text-sm text-muted-foreground">{referral.caseManager.name}</p>
                  <p className="text-sm text-muted-foreground">{referral.caseManager.email}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {referral.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    {activity.actor === "provider" ? (
                      <User className="h-4 w-4 text-gray-600" />
                    ) : activity.actor === "case_manager" ? (
                      <User className="h-4 w-4 text-gray-600" />
                    ) : (
                      <Activity className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
```

## 3. Provider Pages

### 3.1 Dashboard (`/provider/page.tsx`)
```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ProviderDashboard() {
  return (
    <DashboardLayout>
      <div className="container px-6 py-6 max-w-6xl mx-auto">
        {/* Welcome Header */}
        <Card className="border-none shadow-sm mb-6">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Provider Dashboard</h1>
                <p className="text-gray-500 mt-1">Manage your referrals and services</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="active">
              <TabsList>
                <TabsTrigger value="active">Active Referrals</TabsTrigger>
                <TabsTrigger value="pending">Pending Matches</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              <TabsContent value="active">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Referrals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Active referrals list */}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="pending">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Matches</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Pending matches list */}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="completed">
                <Card>
                  <CardHeader>
                    <CardTitle>Completed Referrals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Completed referrals list */}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Stats content */}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Activity content */}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
```

### 3.2 Referrals (`/provider/referrals/page.tsx`)
```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, CheckCircle, Calendar, X } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ProviderReferrals() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  // Mock referral data
  const allReferrals = [
    {
      id: "REF-4832",
      service: "Mental Health Counseling",
      caseManager: "Michael Johnson",
      startDate: "Apr 10, 2025",
      status: "In Progress",
      daysActive: 3
    },
    {
      id: "REF-4821",
      service: "Substance Use Treatment",
      caseManager: "Sarah Williams",
      startDate: "Apr 5, 2025",
      status: "In Progress",
      daysActive: 8
    },
    {
      id: "REF-4814",
      service: "Mental Health Counseling",
      caseManager: "David Thompson",
      startDate: "Apr 1, 2025",
      status: "In Progress",
      daysActive: 12
    }
  ];

  // Filter referrals based on search and filters
  const filteredReferrals = allReferrals.filter(referral => {
    const matchesSearch = 
      searchTerm === '' || 
      referral.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.caseManager.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || referral.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Referrals</h1>
            <p className="text-gray-500">Manage and track your active referrals</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Search referrals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="md:w-1/3"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="md:w-1/4">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Referrals List */}
        <div className="space-y-4">
          {filteredReferrals.map((referral) => (
            <Card key={referral.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-lg">{referral.service}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Case Manager: {referral.caseManager}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-blue-100 text-blue-800">
                        {referral.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Started {referral.startDate} • {referral.daysActive} days active
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      Update Status
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
```

### 3.3 Referral Tracker (`/provider/referral-tracker/[referralId]/page.tsx`)
```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, Calendar, X, MessageSquare } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ProviderReferralTracker() {
  const [showMessages, setShowMessages] = useState(false);

  // Mock referral data
  const referral = {
    id: "REF-4832",
    client: "John Smith",
    status: "in_progress",
    serviceType: "Mental Health Counseling",
    urgency: "high",
    createdAt: "2025-04-10",
    startedAt: "2025-04-12",
    estimatedCompletionDate: "2025-05-12",
    progressPercentage: 40,
    caseManager: {
      name: "Michael Johnson",
      email: "mjohnson@agency.example.com",
      phone: "(651) 555-7890"
    },
    nextMilestone: {
      title: "Initial Assessment",
      date: "2025-04-15",
      status: "upcoming"
    },
    recentActivity: [
      {
        type: "message",
        description: "Case manager sent a message",
        timestamp: "2025-04-13 14:30",
        actor: "case_manager"
      },
      {
        type: "milestone",
        description: "Intake paperwork completed",
        timestamp: "2025-04-12 10:15",
        actor: "provider"
      },
      {
        type: "status_change",
        description: "Service started",
        timestamp: "2025-04-12 09:00",
        actor: "system"
      }
    ]
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Referral Tracker</h1>
            <p className="text-gray-500">Track the progress of referral #{referral.id}</p>
          </div>
          <Button onClick={() => setShowMessages(!showMessages)}>
            <MessageSquare className="mr-2 h-4 w-4" />
            {showMessages ? "Hide Messages" : "Show Messages"}
          </Button>
        </div>

        {/* Progress Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">{referral.progressPercentage}%</span>
                </div>
                <Progress value={referral.progressPercentage} className="h-2" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Next Milestone</h3>
                  <p className="text-sm text-muted-foreground">{referral.nextMilestone.title}</p>
                  <p className="text-sm text-muted-foreground">{referral.nextMilestone.date}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Case Manager</h3>
                  <p className="text-sm text-muted-foreground">{referral.caseManager.name}</p>
                  <p className="text-sm text-muted-foreground">{referral.caseManager.email}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {referral.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    {activity.actor === "provider" ? (
                      <User className="h-4 w-4 text-gray-600" />
                    ) : activity.actor === "case_manager" ? (
                      <User className="h-4 w-4 text-gray-600" />
                    ) : (
                      <Activity className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Messages Section */}
        {showMessages && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Message input */}
                <div className="flex gap-2">
                  <Input placeholder="Type your message..." />
                  <Button>Send</Button>
                </div>
                {/* Messages list will go here */}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
```

## 4. Layout Components

### 4.1 Admin Layout (`/components/layout/AdminLayout.tsx`)
```typescript
'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="lg:pl-72">
        {children}
      </main>
    </div>
  );
}
```

### 4.2 Dashboard Layout (`/components/layout/DashboardLayout.tsx`)
```typescript
'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="lg:pl-72">
        {children}
      </main>
    </div>
  );
}
