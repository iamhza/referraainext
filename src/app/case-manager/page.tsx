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

export default function CaseManagerDashboard() {
  // Overview stats for the current period
  const overviewStats = {
    activeReferrals: 23,
    pendingMatches: 5,
    completedThisMonth: 12,
    averageMatchTime: '2.3 days'
  };

  // Recent referral activity
  const recentActivity = [
    {
      id: 'REF-123',
      clientName: 'John Doe',
      service: 'Medical Care',
      status: 'under_review',
      statusText: 'Under Admin Review',
      timeAgo: '2 hours ago',
      action: 'View Details',
      actionLink: '/case-manager/referrals/REF-123',
      urgent: true
    },
    {
      id: 'REF-124',
      clientName: 'Sarah Smith',
      service: 'Mental Health',
      status: 'provider_selection_required',
      statusText: 'Provider Selection Required',
      timeAgo: '4 hours ago',
      action: 'View Details',
      actionLink: '/case-manager/referrals/REF-124',
    },
    {
      id: 'REF-125',
      clientName: 'Mike Johnson',
      service: 'Dental Care',
      status: 'in_progress',
      statusText: 'In Progress',
      timeAgo: '1 day ago',
      action: 'View Details',
      actionLink: '/case-manager/referrals/REF-125'
    }
  ];

  // Update the status icon rendering
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'under_review':
        return <Clock className="h-4 w-4 text-amber-700" />;
      case 'provider_selection_required':
        return <AlertCircle className="h-4 w-4 text-blue-700" />;
      case 'in_progress':
        return <CheckCircle className="h-4 w-4 text-green-700" />;
      default:
        return null;
    }
  };

  // Update the status background colors
  const getStatusBackground = (status: string) => {
    switch (status) {
      case 'under_review':
        return "bg-amber-100";
      case 'provider_selection_required':
        return "bg-blue-100";
      case 'in_progress':
        return "bg-green-100";
      default:
        return "bg-gray-100";
    }
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
          <Card className="group hover:shadow-card-hover transition-all duration-300">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                Recent Referrals
              </CardTitle>
              <CardDescription>Your most recent referral activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border divide-y">
                {recentActivity.map((activity, index) => (
                  <div 
                    key={activity.id}
                    className="flex items-center justify-between p-4 hover:bg-gradient-to-r hover:from-primary-50 hover:to-secondary-50 transition-all duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center",
                        getStatusBackground(activity.status)
                      )}>
                        {getStatusIcon(activity.status)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{activity.clientName}</p>
                          {activity.urgent && (
                            <Badge variant="destructive" className="text-xs">Urgent</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{activity.service}</span>
                          <span>•</span>
                          <span>{activity.timeAgo}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10">
                        {activity.statusText}
                      </Badge>
                      <EnhancedButton variant="ghost" size="sm" className="text-sm" asChild>
                        <Link href={activity.actionLink}>
                          {activity.action}
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </EnhancedButton>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center mt-6">
                <EnhancedButton variant="outline" size="lg" rounded="full" asChild>
                  <Link href="/case-manager/referrals">
                    View all referrals
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </EnhancedButton>
              </div>
            </CardContent>
          </Card>
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