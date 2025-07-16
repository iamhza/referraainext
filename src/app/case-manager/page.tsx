'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTour } from '@/contexts/TourContext';
import Link from 'next/link';
import { format, parseISO, formatDistanceToNow, differenceInDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle,
  FileText,
  RotateCcw,
  Plus,
  Users,
  Clock,
  CheckCircle,
  X,
  ArrowRight,
  Building,
  User,
  MessageSquare,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  ChevronRight,
  Play,
  BookOpen,
  Target,
  Zap,
  CheckCircle2,
  UserPlus,
  Search,
  BarChart3,
  Settings
} from 'lucide-react';
import { capitalizeName, formatStatus, formatServiceType } from '@/lib/formatting';

interface MongoReferral {
  _id: string;
  clientInfo: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  serviceDetails: {
    type: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
  assignedProvider?: {
    name: string;
  };
  assignmentDate?: string;
}

interface UIReferral {
  id: string;
  clientId: string;
  clientName: string;
  serviceType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastUpdate: string;
  providerName?: string;
  assignmentDate?: string;
  needsFollowUp: boolean;
}

interface TodoItem {
  icon: React.ComponentType<any>;
  action: string;
  details: string;
  count?: number;
  href: string;
  buttonText: string;
  priority: 'high' | 'medium' | 'low';
}

export default function CaseManagerDashboard() {
  const { user } = useAuth();
  const { startTour } = useTour();
  const [referrals, setReferrals] = useState<UIReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentComments, setRecentComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  // Calculated metrics
  const pendingSelections = referrals.filter(r => r.status.toLowerCase() === 'matched').length;
  const needsFollowUp = referrals.filter(r => r.needsFollowUp && ['in_progress', 'pending'].includes(r.status.toLowerCase())).length;
  const needsUpdates = referrals.filter(r => 
    r.status.toLowerCase() === 'in_progress' && 
    differenceInDays(new Date(), parseISO(r.updatedAt)) > 3
  ).length;

  useEffect(() => {
    async function fetchReferrals() {
      try {
        const response = await fetch('/api/referrals');
        if (!response.ok) throw new Error('Failed to fetch referrals');
        const data = await response.json();
        
        const mappedReferrals: UIReferral[] = data.referrals.map((ref: MongoReferral) => ({
          id: ref._id,
          clientId: ref.clientInfo._id,
          clientName: capitalizeName(`${ref.clientInfo.firstName} ${ref.clientInfo.lastName}`),
          serviceType: formatServiceType(ref.serviceDetails.type),
          status: ref.status,
          createdAt: ref.createdAt,
          updatedAt: ref.updatedAt,
          lastUpdate: formatDistanceToNow(parseISO(ref.updatedAt), { addSuffix: true }),
          providerName: ref.assignedProvider?.name ? capitalizeName(ref.assignedProvider.name) : undefined,
          assignmentDate: ref.assignmentDate ? format(parseISO(ref.assignmentDate), 'MMM d, yyyy') : undefined,
          needsFollowUp: differenceInDays(new Date(), parseISO(ref.updatedAt)) > 7,
        }));
        
        setReferrals(mappedReferrals);
      } catch (error) {
        console.error('Error fetching referrals:', error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchRecentComments() {
      try {
        const response = await fetch('/api/comments/recent?limit=10&days=7');
        if (!response.ok) throw new Error('Failed to fetch recent comments');
        const data = await response.json();
        
        setRecentComments(data.comments || []);
      } catch (error) {
        console.error('Error fetching recent comments:', error);
      } finally {
        setCommentsLoading(false);
      }
    }

    fetchReferrals();
    fetchRecentComments();
  }, []);

  // Helper function to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-50 border-red-200';
      case 'important': return 'bg-amber-50 border-amber-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  // Helper function to get author icon color
  const getAuthorColor = (authorType: string) => {
    switch (authorType) {
      case 'provider': return 'bg-green-100 text-green-600';
      case 'case_manager': return 'bg-blue-100 text-blue-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const todoItems: TodoItem[] = [
    {
      icon: FileText,
      action: "Select Providers",
      details: `${pendingSelections} referrals are waiting for you to confirm a match.`,
      count: pendingSelections,
      href: "/case-manager/referrals?filter=matched",
      buttonText: "View Matches",
      priority: 'high'
    },
    {
      icon: RotateCcw,
      action: "Follow-Up With Providers",
      details: `${needsFollowUp} providers haven't sent updates in 14+ days.`,
      count: needsFollowUp,
      href: "/case-manager/referrals?filter=follow-up",
      buttonText: "View Referrals",
      priority: 'medium'
    },
    {
      icon: Plus,
      action: "Add Client Updates",
      details: `${needsUpdates} referrals need your update for service tracking.`,
      count: needsUpdates,
      href: "/case-manager/referrals?filter=needs-update",
      buttonText: "Add Update",
      priority: 'low'
    }
  ];



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Hello, {user?.user_metadata?.name ? 
              user.user_metadata.name.split(' ').map((name: string) => 
                name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
              ).join(' ') : 'there'} 👋
          </h1>
          <p className="text-gray-500 text-base font-normal">
            Here's what's going on today.
          </p>
        </div>

        {/* Alert Bar */}
        {pendingSelections > 0 && (
          <div className="mb-8">
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-orange-600 mr-3" />
                <span className="text-orange-800 text-sm font-normal">
                  ⚠️ Finish selecting providers to start processing {pendingSelections} referrals.
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white border-blue-600 text-blue-600 hover:bg-blue-50 font-medium text-sm px-3 py-1.5"
                asChild
              >
                <Link href="/case-manager/referrals?filter=matched">
                  Add missing details
                </Link>
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-8">
          {/* Left Column */}
          <div className="flex-1">
            {/* Things To Do Section */}
            <div id="dashboard-metrics" className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Things to do</h2>
              
              <div className="space-y-3">
                {todoItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
                        <item.icon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{item.action}</div>
                        <div className="text-sm text-gray-500 font-normal">{item.details}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-400 font-normal">Today</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-white border-blue-600 text-blue-600 hover:bg-blue-50 font-medium text-sm px-3 py-1.5"
                        asChild
                        disabled={item.count === 0}
                      >
                        <Link href={item.href}>
                          {item.buttonText}
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Recent Activity Table */}
            <div id="recent-activity" className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                  <p className="text-sm text-gray-600 mt-1">Track your latest referrals and their progress</p>
                </div>
                <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm px-4 py-2" asChild>
                  <Link href="/case-manager/referrals">
                    <FileText className="h-4 w-4 mr-2" />
                    View all referrals
                  </Link>
                </Button>
              </div>

              <Card className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  {referrals.length === 0 ? (
                    <div className="text-center py-16 px-6">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No referrals yet</h3>
                      <p className="text-gray-600 mb-6 max-w-sm mx-auto">Get started by creating your first referral and begin connecting clients with services.</p>
                      <Button asChild className="px-6 py-2">
                        <Link href="/case-manager/new-referral">
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Referral
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      {/* Table Header */}
                      <div className="bg-gray-50/80 backdrop-blur-sm border-b border-gray-200">
                        <div className="grid grid-cols-12 gap-6 px-8 py-4">
                          <div className="col-span-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Client Information
                          </div>
                          <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Service Type
                          </div>
                          <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Status
                          </div>
                          <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Last Update
                          </div>
                          <div className="col-span-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Actions
                          </div>
                        </div>
                      </div>
                      
                      {/* Table Body */}
                      <div className="divide-y divide-gray-100">
                        {referrals.slice(0, 5).map((referral, index) => (
                          <div key={referral.id} className="grid grid-cols-12 gap-6 px-8 py-6 hover:bg-gray-50/50 transition-all duration-200 group">
                            {/* Client Information */}
                            <div className="col-span-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                  {referral.clientName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 text-sm">{referral.clientName}</div>
                                  {referral.providerName && (
                                    <div className="text-xs text-gray-500 flex items-center mt-1">
                                      <Building className="h-3 w-3 mr-1" />
                                      {referral.providerName}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Service Type */}
                            <div className="col-span-2 flex items-center">
                              <div className="text-gray-900 text-sm font-medium">{referral.serviceType}</div>
                            </div>

                            {/* Status */}
                            <div className="col-span-2 flex items-center">
                              {referral.status.toLowerCase() === 'matched' || referral.status.toLowerCase() === 'provider_selection_required' ? (
                                <Badge className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 font-medium px-3 py-1 rounded-full">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Needs Provider Selection
                                </Badge>
                              ) : referral.status.toLowerCase() === 'in_progress' ? (
                                <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 font-medium px-3 py-1 rounded-full">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Active With Provider
                                </Badge>
                              ) : referral.status.toLowerCase() === 'completed' ? (
                                <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-medium px-3 py-1 rounded-full">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              ) : referral.status.toLowerCase() === 'under_review' || referral.status.toLowerCase() === 'under review' ? (
                                <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 font-medium px-3 py-1 rounded-full">
                                  <RotateCcw className="h-3 w-3 mr-1" />
                                  Under Review
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 font-medium px-3 py-1 rounded-full">
                                  {formatStatus(referral.status)}
                                </Badge>
                              )}
                            </div>

                            {/* Last Update */}
                            <div className="col-span-2 flex items-center">
                              <div>
                                <div className="text-sm text-gray-900 font-medium">
                                  {format(parseISO(referral.updatedAt), 'MMM d, yyyy')}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {referral.lastUpdate}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="col-span-3 flex items-center gap-3">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs font-medium px-3 py-2 border-gray-300 hover:border-blue-400 hover:text-blue-600 transition-colors group-hover:shadow-sm" 
                                asChild
                              >
                                <Link href={`/case-manager/referrals/${referral.id}`}>
                                  <User className="h-3 w-3 mr-2" />
                                  View Details
                                </Link>
                              </Button>
                              {referral.status.toLowerCase() === 'in_progress' && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-xs font-medium px-3 py-2 border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400 transition-colors group-hover:shadow-sm" 
                                  asChild
                                >
                                  <Link href={`/case-manager/referrals/${referral.id}/thread`}>
                                    <MessageSquare className="h-3 w-3 mr-2" />
                                    Workspace
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Table Footer */}
                      {referrals.length > 5 && (
                        <div className="bg-gray-50/50 border-t border-gray-200 px-8 py-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                              Showing 5 of {referrals.length} referrals
                            </p>
                            <Button variant="ghost" size="sm" asChild className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                              <Link href="/case-manager/referrals">
                                View all {referrals.length} referrals
                                <ArrowRight className="h-4 w-4 ml-1" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Updated Feature Cards - Real Functionality */}
            <div className="grid grid-cols-3 gap-6">
              
              {/* Client Management Card */}
              <Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 pt-6">
                  <CardTitle className="text-base font-medium text-gray-900 flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    Client Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 font-normal mb-4 leading-5">
                    View and manage all your clients in one place. Track their referral history and contact information.
                  </p>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                    asChild
                  >
                    <Link href="/case-manager/clients">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Clients
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Referral Tracking Card */}
              <Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 pt-6">
                  <CardTitle className="text-base font-medium text-gray-900 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-green-500" />
                    Referral Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 font-normal mb-4 leading-5">
                    Monitor all your referrals, track their progress, and take action when providers need follow-up.
                  </p>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="w-full border-green-200 text-green-600 hover:bg-green-50"
                    asChild
                  >
                    <Link href="/case-manager/referrals">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Referrals
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions Card */}
              <Card id="quick-actions" className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 pt-6">
                  <CardTitle className="text-base font-medium text-gray-900 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-purple-500" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 font-normal mb-4 leading-5">
                    Create new referrals, add clients, or access your workspace for active collaborations.
                  </p>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="w-full border-purple-200 text-purple-600 hover:bg-purple-50"
                    asChild
                  >
                    <Link href="/case-manager/new-referral">
                      <Plus className="h-4 w-4 mr-2" />
                      New Referral
                    </Link>
                  </Button>
                </CardContent>
              </Card>

            </div>
          </div>

          {/* Right Column - Take a quick tour */}
          <div className="w-80">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Take a quick tour</h2>
              <p className="text-sm text-gray-600 font-normal mb-6 leading-5">
                Learn how to make the most of Referra's platform and manage your client referrals with ease.
              </p>
              <div className="space-y-3">
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2"
                  onClick={startTour}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Take the tour
                </Button>
                <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm py-2" asChild>
                  <Link href="/case-manager/new-referral">
                    <Plus className="h-4 w-4 mr-2" />
                    Add new referral
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>





      </div>
    </div>
  );
} 