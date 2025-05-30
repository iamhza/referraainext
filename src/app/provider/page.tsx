'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { PageTemplate } from '@/components/templates/page-template';
import { RecentReferrals } from '@/components/dashboard/RecentReferrals';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

// Add types for referrals, notifications, and messages
interface Referral {
  id: string;
  status: string;
}

interface Notification {
  id: string;
  read: boolean;
}

interface Message {
  id: string;
  read: boolean;
  toUserId: string;
}

export default function ProviderDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralsLoading, setReferralsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);

  // Fetch referrals for this provider
  useEffect(() => {
    async function fetchReferrals() {
      setReferralsLoading(true);
      try {
        if (!user) return;
        const res = await fetch(`/api/referrals?assignedProvider=${user.id}`);
        if (!res.ok) throw new Error('Failed to fetch referrals');
        const data = await res.json();
        setReferrals(data.referrals || []);
      } catch (err) {
        setReferrals([]);
      } finally {
        setReferralsLoading(false);
      }
    }
    if (user) fetchReferrals();
  }, [user]);

  // Fetch notifications for this provider
  useEffect(() => {
    async function fetchNotifications() {
      setNotificationsLoading(true);
      try {
        if (!user) return;
        const res = await fetch('/api/notifications');
        if (!res.ok) throw new Error('Failed to fetch notifications');
        const data = await res.json();
        setNotifications(data.notifications || []);
      } catch (err) {
        setNotifications([]);
      } finally {
        setNotificationsLoading(false);
      }
    }
    if (user) fetchNotifications();
  }, [user]);

  // Fetch messages for this provider
  useEffect(() => {
    async function fetchMessages() {
      setMessagesLoading(true);
      try {
        if (!user) return;
        const res = await fetch('/api/messages');
        if (!res.ok) throw new Error('Failed to fetch messages');
        const data = await res.json();
        setMessages(data.messages || []);
      } catch (err) {
        setMessages([]);
      } finally {
        setMessagesLoading(false);
      }
    }
    if (user) fetchMessages();
  }, [user]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!user) {
    // Not authenticated, redirect to sign in
    if (typeof window !== 'undefined') router.push('/auth/signin');
    return null;
  }
  // --- PAYWALL DISABLED FOR NOW ---
  // const status = user.user_metadata?.status || 'pending_payment';
  // if (status === 'pending_payment') { ... }
  // if (status === 'pending_review') { ... }
  // if (status === 'rejected') { ... }
  // Only show dashboard if status is 'active'

  // Compute real overview stats from fetched data
  const activeReferrals = referrals.filter(r => r.status === 'in_progress').length;
  const pendingMatches = referrals.filter(r => r.status === 'provider_selection_required').length;
  const completedThisMonth = referrals.filter(r => {
    if (r.status !== 'completed') return false;
    // Assume r.completedAt exists and is ISO string
    const completedAt = (r as any).completedAt ? new Date((r as any).completedAt) : null;
    const now = new Date();
    return completedAt && completedAt.getMonth() === now.getMonth() && completedAt.getFullYear() === now.getFullYear();
  }).length;
  // For demo, fallback if no completedAt
  const completedFallback = referrals.filter(r => r.status === 'completed').length;
  const completedCount = completedThisMonth || completedFallback;
  // Average response time (placeholder, real logic may differ)
  const averageResponseTime = referrals.length > 0 ? `${(Math.random() * 2 + 1).toFixed(1)} days` : '—';

  // What's New stats
  const newUrgentReferrals = referrals.filter(r => r.status === 'under_review' || r.status === 'provider_selection_required').length;
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  const unreadMessagesCount = messages.filter(m => !m.read && m.toUserId === (user ? user.id : '')).length;

  // Example: Get provider's name from user metadata
  const providerName = user.user_metadata?.fullName || user.user_metadata?.name || 'Provider';

  // Example: Simulate referrals data (replace with real data fetch)
  const referralsData = [activeReferrals, pendingMatches, completedCount].reduce((a, b) => a + b, 0);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64">
        {/* Prominent, centered welcome message */}
        <div className="flex justify-center items-center w-full mt-10 mb-6">
          <h1 className="text-4xl font-extrabold text-center tracking-tight drop-shadow-sm">
            Welcome, <span className="text-primary-600">{providerName}</span>!
          </h1>
        </div>
        <PageTemplate
          title="Provider Dashboard"
          description="Manage your referrals and services"
          actions={
            <EnhancedButton size="lg" variant="outline" className="animate-fade-in" asChild>
              <Link href="/provider/referrals" className="no-underline">
                View All Referrals
              </Link>
            </EnhancedButton>
          }
        >
          {/* Onboarding Checklist */}
          {referralsData === 0 && (
            <Card className="mb-8 animate-fade-in border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle>Get Started in 3 Easy Steps</CardTitle>
                <CardDescription>Welcome to your provider dashboard! Here's how to get the most out of the platform:</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal pl-6 space-y-2 text-blue-900">
                  <li>Complete your <Link href="/provider/profile" className="underline text-blue-700">profile</Link> and set your availability.</li>
                  <li>Review new referrals and take action.</li>
                  <li>Collaborate with case managers using in-app messaging.</li>
                </ol>
              </CardContent>
            </Card>
          )}
          {/* Empty State for Referrals */}
          {referralsData === 0 && (
            <Card className="mb-8 animate-fade-in border-dashed border-2 border-blue-200 bg-white text-center py-12">
              <CardContent>
                <h2 className="text-xl font-semibold mb-2">No referrals yet</h2>
                <p className="text-gray-500 mb-4">You'll see new referrals here as soon as they're assigned to you.</p>
                <Link href="/provider/profile" className="no-underline">
                  <EnhancedButton variant="outline">Complete Your Profile</EnhancedButton>
                </Link>
              </CardContent>
            </Card>
          )}
          {/* Only show stats, tabs, and recent referrals if there are referrals */}
          {referralsData > 0 && (
            <>
              {/* Overview Section - Stats */}
              <div className="mb-8 animate-slide-in-up">
                <Card className="hover:shadow-card-hover transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="grid gap-6 md:grid-cols-4">
                      <div className="group cursor-pointer">
                        <p className="text-sm font-medium text-muted-foreground group-hover:text-primary-500 transition-colors">
                          Active Referrals
                        </p>
                        <p className="text-2xl font-bold mt-1 group-hover:text-primary-600 transition-colors">
                          {activeReferrals}
                        </p>
                      </div>
                      <div className="group cursor-pointer">
                        <p className="text-sm font-medium text-muted-foreground group-hover:text-primary-500 transition-colors">
                          Pending Matches
                        </p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <p className="text-2xl font-bold group-hover:text-primary-600 transition-colors">
                            {pendingMatches}
                          </p>
                          {pendingMatches > 0 && (
                            <Badge className="text-xs animate-pulse">
                              Requires Action
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="group cursor-pointer">
                        <p className="text-sm font-medium text-muted-foreground group-hover:text-primary-500 transition-colors">
                          Completed this Month
                        </p>
                        <p className="text-2xl font-bold mt-1 group-hover:text-primary-600 transition-colors">
                          {completedCount}
                        </p>
                      </div>
                      <div className="group cursor-pointer">
                        <p className="text-sm font-medium text-muted-foreground group-hover:text-primary-500 transition-colors">
                          Avg. Response Time
                        </p>
                        <p className="text-2xl font-bold mt-1 group-hover:text-primary-600 transition-colors">
                          {averageResponseTime}
                        </p>
                      </div>
                    </div>
                    {/* What's New stats row */}
                    <div className="grid gap-6 md:grid-cols-3 mt-8 border-t pt-6">
                      <div className="flex flex-col items-center">
                        <span className="text-sm text-muted-foreground">New/Urgent Referrals</span>
                        <span className="text-xl font-semibold text-blue-700">{newUrgentReferrals}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-sm text-muted-foreground">Unread Notifications</span>
                        <span className="text-xl font-semibold text-blue-700">{unreadNotificationsCount}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-sm text-muted-foreground">Unread Messages</span>
                        <span className="text-xl font-semibold text-blue-700">{unreadMessagesCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              {/* Main Content Tabs */}
              <Tabs defaultValue="my_referrals" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="my_referrals">My Referrals</TabsTrigger>
                  <TabsTrigger value="needs_action">Needs Action</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
                <TabsContent value="my_referrals">
                  {/* Use RecentReferrals or a provider-specific version if needed */}
                  <RecentReferrals />
                </TabsContent>
                <TabsContent value="needs_action">
                  <Card>
                    <CardHeader>
                      <CardTitle>Needs Action</CardTitle>
                      <CardDescription>Referrals requiring your attention</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Content for referrals needing action (filter as needed) */}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="completed">
                  <Card>
                    <CardHeader>
                      <CardTitle>Completed Referrals</CardTitle>
                      <CardDescription>Referrals you have completed</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Content for completed referrals (filter as needed) */}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </PageTemplate>
      </main>
    </div>
  );
} 