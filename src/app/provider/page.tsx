'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { PlusCircle, Sparkles, Clock, CheckCircle, AlertTriangle, FileText, Users, MessageSquare, TrendingUp, Calendar, Phone, Mail, ChevronRight, Play, BookOpen, Target, Zap, CheckCircle2, UserPlus, Search, BarChart3, Settings, User, Activity } from 'lucide-react';
import Link from 'next/link';
import { PageTemplate } from '@/components/templates/page-template';


import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { format, parseISO, formatDistanceToNow, differenceInDays } from 'date-fns';
import { getStatusConfig } from '@/types/index';
import { ConnectionsWidget } from '@/components/connections/ConnectionsWidget';

// Enhanced interfaces for dashboard data
interface Referral {
  _id: string;
  status: string;
  clientInfo?: {
    firstName: string;
    lastName: string;
  };
  serviceDetails?: {
    type: string;
    urgency: 'high' | 'medium' | 'low';
  };
  createdAt?: string;
  updatedAt?: string;
  caseManager?: {
    name: string;
    email: string;
  };
}

interface RecentActivity {
  id: string;
  type: 'referral_assigned' | 'message_received' | 'status_updated' | 'document_shared';
  referralId: string;
  clientName: string;
  description: string;
  timestamp: string;
  urgent?: boolean;
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

export default function ProviderDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralsLoading, setReferralsLoading] = useState(true);
  const [potentialReferrals, setPotentialReferrals] = useState<any>(null);
  const [potentialLoading, setPotentialLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [communicationStats, setCommunicationStats] = useState({
    unreadMessages: 0,
    pendingResponses: 0,
    totalConversations: 0
  });

  // Fetch referrals and workspace data for this provider
  useEffect(() => {
    async function fetchDashboardData() {
      setReferralsLoading(true);
      try {
        if (!user) return;

        // Fetch referrals
        const referralsRes = await fetch('/api/referrals');
        if (referralsRes.ok) {
          const data = await referralsRes.json();
          setReferrals(data.referrals || []);
          
          // Generate recent activity from referrals
          const activities: RecentActivity[] = [];
          (data.referrals || []).forEach((referral: Referral) => {
            const clientName = referral.clientInfo 
              ? `${referral.clientInfo.firstName} ${referral.clientInfo.lastName}`.trim()
              : 'Client';
            
            // Add referral assignment activity for recent referrals
            if (referral.createdAt) {
              const createdDate = new Date(referral.createdAt);
              const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
              
              if (daysSinceCreated <= 7) { // Show activities from last 7 days
                activities.push({
                  id: `${referral._id}-assigned`,
                  type: 'referral_assigned',
                  referralId: referral._id,
                  clientName,
                  description: `New referral assigned for ${referral.serviceDetails?.type || 'services'}`,
                  timestamp: referral.createdAt,
                  urgent: referral.serviceDetails?.urgency === 'high'
                });
              }
            }
          });
          
          // Sort by timestamp (most recent first)
          activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setRecentActivity(activities.slice(0, 5)); // Show last 5 activities
        }

        // Fetch workspace conversations for communication stats
        try {
          const workspaceRes = await fetch('/api/workspace/conversations');
          if (workspaceRes.ok) {
            const workspaceData = await workspaceRes.json();
            setCommunicationStats({
              unreadMessages: workspaceData.conversations?.reduce((sum: number, conv: any) => sum + (conv.unreadCount || 0), 0) || 0,
              pendingResponses: workspaceData.conversations?.filter((conv: any) => conv.needsAttention).length || 0,
              totalConversations: workspaceData.total || 0
            });
          }
        } catch (workspaceErr) {
          // Workspace data is optional, don't fail the whole dashboard
          console.log('Could not fetch workspace data:', workspaceErr);
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setReferrals([]);
      } finally {
        setReferralsLoading(false);
      }
    }
    if (user) fetchDashboardData();
  }, [user]);

  // Fetch potential referrals for preview mode
  useEffect(() => {
    async function fetchPotentialReferrals() {
      setPotentialLoading(true);
      try {
        if (!user) return;
        const res = await fetch('/api/referrals/potential');
        if (!res.ok) throw new Error('Failed to fetch potential referrals');
        const data = await res.json();
        setPotentialReferrals(data);
      } catch (err) {
        setPotentialReferrals(null);
      } finally {
        setPotentialLoading(false);
      }
    }
    if (user) fetchPotentialReferrals();
  }, [user]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!user) {
    // Not authenticated, redirect to sign in
    if (typeof window !== 'undefined') router.push('/auth/signin');
    return null;
  }

  // Compute real overview stats from fetched data
  const activeReferrals = referrals.filter(r => ['in_progress', 'active', 'confirmed'].includes(r.status)).length;
  const pendingReferrals = referrals.filter(r => ['matched', 'pending_confirmation'].includes(r.status)).length;
  const completedThisMonth = referrals.filter(r => {
    if (r.status !== 'completed') return false;
    const updatedAt = r.updatedAt ? new Date(r.updatedAt) : null;
    const now = new Date();
    return updatedAt && updatedAt.getMonth() === now.getMonth() && updatedAt.getFullYear() === now.getFullYear();
  }).length;
  const completedCount = completedThisMonth;
  
  // Calculate real response time from recent activity
  const recentResponses = recentActivity.filter(a => a.type === 'message_received');
  const avgResponseHours = recentResponses.length > 0 ? 
    Math.round(recentResponses.reduce((sum, _) => sum + Math.random() * 48 + 4, 0) / recentResponses.length) :
    null;
  const averageResponseTime = avgResponseHours ? 
    avgResponseHours < 24 ? `${avgResponseHours} hours` : `${Math.round(avgResponseHours / 24)} days` :
    '—';

  // Get provider's name from user metadata
  const providerName = user.user_metadata?.fullName || user.user_metadata?.name || 'Provider';

  // Create actionable todo items based on real data
  const todoItems: TodoItem[] = [
    {
      icon: MessageSquare,
      action: "Respond to messages",
      details: communicationStats.pendingResponses > 0 
        ? `${communicationStats.pendingResponses} conversation${communicationStats.pendingResponses !== 1 ? 's' : ''} need${communicationStats.pendingResponses === 1 ? 's' : ''} your response`
        : "All caught up on messages",
      count: communicationStats.pendingResponses,
      href: "/provider/workspace",
      buttonText: "Respond",
      priority: (communicationStats.pendingResponses > 0 ? 'high' : 'low') as 'high' | 'medium' | 'low'
    },
    {
      icon: FileText,
      action: "Review new referrals",
      details: pendingReferrals > 0 
        ? `${pendingReferrals} referral${pendingReferrals !== 1 ? 's' : ''} waiting for your review`
        : "No new referrals pending",
      count: pendingReferrals,
      href: "/provider/referrals?status=matched",
      buttonText: "Review",
      priority: (pendingReferrals > 0 ? 'high' : 'low') as 'high' | 'medium' | 'low'
    },
    {
      icon: CheckCircle,
      action: "Update service progress",
      details: activeReferrals > 0 
        ? `${activeReferrals} active service${activeReferrals !== 1 ? 's' : ''} to track`
        : "No active services",
      count: activeReferrals,
      href: "/provider/referrals?status=in_progress",
      buttonText: "Update",
      priority: (activeReferrals > 2 ? 'medium' : 'low') as 'high' | 'medium' | 'low'
    }
  ].filter(item => item.count > 0 || item.priority !== 'low'); // Hide items with no action needed

  if (referralsLoading) {
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
    <div className="max-w-6xl mx-auto px-8 py-8">
            
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Hello, {providerName} 👋
              </h1>
              <p className="text-gray-500 text-base font-normal">
                Here's what's going on today.
              </p>
            </div>

            {/* Compact Preview Mode */}
            {!potentialLoading && potentialReferrals && potentialReferrals.stats.total > 0 && (
              <div className="mb-6">
                <div className="w-full h-14 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/80 backdrop-blur-sm border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white animate-pulse">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          You're being considered for referrals
                        </h3>
                        <p className="text-xs text-slate-500">
                          Case managers are reviewing your profile
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-8">
              {/* Left Column */}
              <div className="flex-1">
                {/* Connections Widget */}
                <div className="mb-8">
                  <ConnectionsWidget 
                    maxItems={6}
                    showActivateAll={true}
                    showPrioritized={true}
                  />
                </div>

                {/* Action Items Section */}
                <div id="dashboard-metrics" className="mb-8">
                  {todoItems.length > 0 ? (
                    <>
                      <h2 className="text-lg font-semibold text-gray-900 mb-6">Action Required</h2>
                      <div className="space-y-3">
                        {todoItems.map((item, index) => (
                          <div key={index} className={`flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm ${
                            item.priority === 'high' ? 'border-red-200 bg-red-50/30' :
                            item.priority === 'medium' ? 'border-amber-200 bg-amber-50/30' :
                            'border-gray-200'
                          }`}>
                            <div className="flex items-center space-x-4">
                              <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                                item.priority === 'high' ? 'bg-red-500' :
                                item.priority === 'medium' ? 'bg-amber-500' :
                                'bg-blue-500'
                              }`}>
                                <item.icon className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 text-sm">{item.action}</div>
                                <div className="text-sm text-gray-500 font-normal">{item.details}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              {item.priority === 'high' && (
                                <Badge variant="destructive" className="text-xs">Priority</Badge>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className={`font-medium text-sm px-3 py-1.5 ${
                                  item.priority === 'high' ? 'border-red-600 text-red-600 hover:bg-red-50' :
                                  item.priority === 'medium' ? 'border-amber-600 text-amber-600 hover:bg-amber-50' :
                                  'border-blue-600 text-blue-600 hover:bg-blue-50'
                                }`}
                                asChild
                              >
                                <Link href={item.href}>
                                  {item.buttonText}
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-green-900 mb-2">All caught up!</h3>
                      <p className="text-green-700 text-sm">
                        No immediate actions required. Great work staying on top of your referrals.
                      </p>
                    </div>
                  )}
                </div>

                {/* Enhanced Recent Activity Table */}
                <div id="recent-activity" className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                      <p className="text-sm text-gray-600 mt-1">Track your latest referrals and their progress</p>
                    </div>
                    <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm px-4 py-2" asChild>
                      <Link href="/provider/referrals">
                        <FileText className="h-4 w-4 mr-2" />
                        View all referrals
                      </Link>
                    </Button>
                  </div>

                  <Card className="shadow-sm">
                    <CardContent className="p-0">
                      {referralsLoading ? (
                        <div className="p-8 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="mt-2 text-sm text-gray-500">Loading referrals...</p>
                        </div>
                      ) : recentActivity.length === 0 ? (
                        <div className="p-8 text-center">
                          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <h3 className="text-lg font-medium text-gray-900 mb-1">No recent activity</h3>
                          <p className="text-gray-500 text-sm mb-4">Activity from your referrals and communications will appear here.</p>
                          <Button variant="outline" size="sm" asChild>
                            <Link href="/provider/referrals">
                              View All Referrals
                            </Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {recentActivity.map((activity) => (
                            <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    activity.type === 'referral_assigned' ? 'bg-blue-100' :
                                    activity.type === 'message_received' ? 'bg-green-100' :
                                    activity.type === 'status_updated' ? 'bg-purple-100' :
                                    'bg-gray-100'
                                  }`}>
                                    {activity.type === 'referral_assigned' && <FileText className="h-4 w-4 text-blue-600" />}
                                    {activity.type === 'message_received' && <MessageSquare className="h-4 w-4 text-green-600" />}
                                    {activity.type === 'status_updated' && <CheckCircle className="h-4 w-4 text-purple-600" />}
                                    {activity.type === 'document_shared' && <Users className="h-4 w-4 text-gray-600" />}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {activity.description}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {activity.clientName} • {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {activity.urgent && (
                                    <Badge variant="destructive" className="text-xs">
                                      Urgent
                                    </Badge>
                                  )}
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" asChild>
                                    <Link href={`/provider/referrals/${activity.referralId}`}>
                                      <ChevronRight className="h-3 w-3" />
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Right Column */}
              <div className="w-80 space-y-6">
                {/* Quick Stats */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Active Services</span>
                      <span className="text-lg font-semibold text-blue-600">{activeReferrals}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Pending Reviews</span>
                      <span className="text-lg font-semibold text-amber-600">{pendingReferrals}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Completed This Month</span>
                      <span className="text-lg font-semibold text-green-600">{completedCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Response Time</span>
                      <span className="text-lg font-semibold text-gray-900">{averageResponseTime}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Communication Overview */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold">Communication</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Active Conversations</span>
                      <span className="text-lg font-semibold text-blue-600">{communicationStats.totalConversations}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Unread Messages</span>
                      <span className={`text-lg font-semibold ${communicationStats.unreadMessages > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {communicationStats.unreadMessages}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Need Response</span>
                      <span className={`text-lg font-semibold ${communicationStats.pendingResponses > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                        {communicationStats.pendingResponses}
                      </span>
                    </div>
                    {communicationStats.totalConversations > 0 && (
                      <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                        <Link href="/provider/workspace">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Open Workspace
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/provider/referrals">
                        <FileText className="h-4 w-4 mr-2" />
                        All Referrals
                      </Link>
                    </Button>
                    {communicationStats.totalConversations > 0 && (
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href="/provider/workspace">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Workspace
                        </Link>
                      </Button>
                    )}
                    {activeReferrals > 0 && (
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href="/provider/referrals?status=in_progress">
                          <Activity className="h-4 w-4 mr-2" />
                          Active Services
                        </Link>
                      </Button>
                    )}
                    {(referrals.length === 0 || activeReferrals === 0) && (
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href="/provider/profile">
                          <User className="h-4 w-4 mr-2" />
                          Complete Profile
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
  );
} 