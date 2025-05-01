'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PlusCircle, 
  Clock, 
  ArrowRight,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock4
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PageTemplate } from '@/components/templates/page-template';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { RecentReferrals } from '@/components/dashboard/RecentReferrals';

export default function CaseManagerDashboard() {
  // Overview stats for the current period
  const overviewStats = {
    activeReferrals: 23,
    pendingMatches: 5,
    completedThisMonth: 12,
    averageMatchTime: '2.3 days'
  };

  return (
    <PageTemplate
      title="Dashboard"
      description="Overview of your referrals and matches"
      actions={
        <EnhancedButton size="lg" variant="gradient" className="animate-fade-in" asChild>
          <Link href="/case-manager/new-referral">
            <PlusCircle className="mr-2 h-5 w-5" />
            New Referral
          </Link>
        </EnhancedButton>
      }
    >
      {/* Overview Section - Stripe-like stats overview */}
      <div className="mb-8 animate-slide-in-up">
        <Card className="hover:shadow-card-hover transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-4">
              <div className="group cursor-pointer">
                <p className="text-sm font-medium text-muted-foreground group-hover:text-primary-500 transition-colors">
                  Active Referrals
                </p>
                <p className="text-2xl font-bold mt-1 group-hover:text-primary-600 transition-colors">
                  {overviewStats.activeReferrals}
                </p>
              </div>
              <div className="group cursor-pointer">
                <p className="text-sm font-medium text-muted-foreground group-hover:text-primary-500 transition-colors">
                  Pending Matches
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-bold group-hover:text-primary-600 transition-colors">
                    {overviewStats.pendingMatches}
                  </p>
                  {overviewStats.pendingMatches > 0 && (
                    <Badge variant="destructive" className="text-xs animate-pulse">
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
                  {overviewStats.completedThisMonth}
                </p>
              </div>
              <div className="group cursor-pointer">
                <p className="text-sm font-medium text-muted-foreground group-hover:text-primary-500 transition-colors">
                  Average Match Time
                </p>
                <p className="text-2xl font-bold mt-1 group-hover:text-primary-600 transition-colors">
                  {overviewStats.averageMatchTime}
                </p>
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
          <TabsTrigger value="in_progress">Active Cases</TabsTrigger>
        </TabsList>

        <TabsContent value="my_referrals">
          <RecentReferrals />
        </TabsContent>

        <TabsContent value="needs_action">
          <Card>
            <CardHeader>
              <CardTitle>Needs Action</CardTitle>
              <CardDescription>Referrals requiring your attention</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Content for referrals needing action */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="in_progress">
          <Card>
            <CardHeader>
              <CardTitle>Active Cases</CardTitle>
              <CardDescription>Currently active referrals and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Content for active cases */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageTemplate>
  );
} 