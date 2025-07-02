'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Clock, CheckCircle, Calendar, X, ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ReferralComments } from '@/components/referrals/ReferralComments';
import { ReferralTasks } from '@/components/referrals/ReferralTasks';
import { createBrowserClient } from '@supabase/ssr';
import { BackButton } from '@/components/ui/BackButton';

export default function ProviderReferralTracker({ params }: { params: { referralId: string } }) {
  const [referral, setReferral] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function getSessionAndFetch() {
      setAuthLoading(true);
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAuthLoading(false);
        setProviderId(null);
        return;
      }
      setProviderId(session.user.id);
      setAuthLoading(false);
    }
    getSessionAndFetch();
  }, []);

  useEffect(() => {
    if (!providerId) return;
    async function fetchReferral() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/referrals/${params.referralId}`);
        if (!res.ok) throw new Error('Failed to fetch referral');
        const data = await res.json();
        setReferral(data.referral);
      } catch (err) {
        setError('Could not load referral.');
      } finally {
        setLoading(false);
      }
    }
    fetchReferral();
  }, [params.referralId, providerId]);

  if (authLoading) return <div className="p-8 text-center text-muted-foreground">Checking authentication...</div>;
  if (!providerId) return <div className="p-8 text-center text-red-500">Please log in as a provider to view this referral.</div>;

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading referral...</div>;
  if (error || !referral) return <div className="p-8 text-center text-red-500">{error || 'Referral not found.'}</div>;

  return (
    <div>
      <BackButton fallback="/provider/referrals" />
      <DashboardLayout>
        <div className="container mx-auto p-4 md:p-6">
          <Button variant="ghost" size="sm" className="mb-6" asChild>
            <Link href="/provider/referrals" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to referrals
            </Link>
          </Button>

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
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {referral.recentActivity.map((activity: any, index: number) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      {activity.actor === "provider" ? (
                        <User className="h-4 w-4 text-gray-600" />
                      ) : activity.actor === "case_manager" ? (
                        <User className="h-4 w-4 text-gray-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-600" />
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

          {/* Tasks Checklist */}
          <ReferralTasks referralId={params.referralId as string} />

          {/* Comments Feed */}
          <ReferralComments referralId={params.referralId as string} />

        </div>
      </DashboardLayout>
    </div>
  );
} 