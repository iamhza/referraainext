'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CheckCircle, Calendar, X } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ProviderDashboard() {
  // Mock data
  const metrics = {
    activeReferrals: 12,
    pendingMatches: 5,
    completedReferrals: 156,
    averageResponseTime: '2.3 hours'
  };

  const recentReferrals = [
    {
      id: "REF-4832",
      service: "Mental Health Counseling",
      caseManager: "Michael Johnson",
      startDate: "Apr 10, 2025",
      status: "active"
    },
    {
      id: "REF-4831",
      service: "Substance Use Treatment",
      caseManager: "Sarah Williams",
      startDate: "Apr 9, 2025",
      status: "pending"
    }
  ];

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
            <Tabs defaultValue="active" className="space-y-4">
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
                    <div className="space-y-4">
                      {recentReferrals.map((referral) => (
                        <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h3 className="font-medium">{referral.service}</h3>
                            <p className="text-sm text-muted-foreground">
                              Case Manager: {referral.caseManager}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Started: {referral.startDate}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              Active
                            </Badge>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pending">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Matches</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Pending matches content */}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="completed">
                <Card>
                  <CardHeader>
                    <CardTitle>Completed Referrals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Completed referrals content */}
                    </div>
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
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Active Referrals</p>
                    <p className="text-2xl font-bold">{metrics.activeReferrals}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Pending Matches</p>
                    <p className="text-2xl font-bold">{metrics.pendingMatches}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Completed Referrals</p>
                    <p className="text-2xl font-bold">{metrics.completedReferrals}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Average Response Time</p>
                    <p className="text-2xl font-bold">{metrics.averageResponseTime}</p>
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
                  {/* Activity content */}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 