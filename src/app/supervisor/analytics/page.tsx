'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, TrendingDown, Users, Clock, CheckCircle, AlertTriangle, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface TeamAnalytics {
  totalCaseManagers: number;
  totalClients: number;
  totalReferrals: number;
  averageCaseload: number;
  completionRate: number;
  responseTime: number;
  monthlyTrends: {
    month: string;
    referrals: number;
    completions: number;
    averageTime: number;
  }[];
  caseManagerPerformance: {
    id: string;
    name: string;
    clientCount: number;
    referralCount: number;
    completionRate: number;
    averageResponseTime: number;
    performance: 'excellent' | 'good' | 'needs_improvement';
  }[];
}

export default function SupervisorAnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<TeamAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('last_30_days');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch organization analytics
      const response = await fetch(`/api/org/analytics?timeRange=${timeRange}&role=supervisor`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      } else {
        // Show empty analytics if API doesn't exist yet
        setAnalytics({
          totalCaseManagers: 0,
          totalClients: 0,
          totalReferrals: 0,
          averageCaseload: 0,
          completionRate: 0,
          responseTime: 0,
          monthlyTrends: [],
          caseManagerPerformance: []
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceBadge = (performance: string) => {
    const styles = {
      excellent: 'bg-green-100 text-green-800',
      good: 'bg-blue-100 text-blue-800',
      needs_improvement: 'bg-orange-100 text-orange-800'
    };
    return <Badge className={styles[performance as keyof typeof styles]}>{performance}</Badge>;
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Team Analytics</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading analytics...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Team Analytics</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">Failed to load analytics data.</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Team Analytics</h1>
          <p className="text-gray-600">Monitor your team's performance and workload</p>
        </div>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last_7_days">Last 7 Days</SelectItem>
            <SelectItem value="last_30_days">Last 30 Days</SelectItem>
            <SelectItem value="last_90_days">Last 90 Days</SelectItem>
            <SelectItem value="last_year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCaseManagers}</div>
            <p className="text-xs text-muted-foreground">Case managers</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{analytics.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Avg {analytics.averageCaseload} per case manager
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalReferrals} total referrals
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{analytics.responseTime}d</div>
            <p className="text-xs text-muted-foreground">Days to respond</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {analytics.monthlyTrends.slice(-3).map((trend, index) => (
                <div key={trend.month} className="border rounded-lg p-4">
                  <div className="font-medium">{trend.month}</div>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Referrals:</span>
                      <span className="font-medium">{trend.referrals}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Completions:</span>
                      <span className="font-medium text-green-600">{trend.completions}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg Time:</span>
                      <span className="font-medium">{trend.averageTime}d</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Case Manager Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Case Manager Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.caseManagerPerformance.map((cm) => (
              <div key={cm.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium">{cm.name}</h3>
                    <p className="text-sm text-gray-500">{cm.clientCount} clients • {cm.referralCount} referrals</p>
                  </div>
                  {getPerformanceBadge(cm.performance)}
                </div>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <div className="text-sm text-gray-500">Completion Rate</div>
                    <div className="font-medium text-lg">{cm.completionRate}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Response Time</div>
                    <div className="font-medium text-lg">{cm.averageResponseTime}d</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Workload</div>
                    <div className="font-medium text-lg">
                      {cm.clientCount < 20 ? 'Light' : cm.clientCount < 30 ? 'Moderate' : 'Heavy'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.caseManagerPerformance
              .filter(cm => cm.performance === 'needs_improvement')
              .map(cm => (
                <div key={cm.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="font-medium">Review {cm.name}'s workload</div>
                    <div className="text-sm text-gray-600">
                      Consider redistributing some clients or providing additional support
                    </div>
                  </div>
                </div>
              ))}
            
            {analytics.averageCaseload > 25 && (
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="font-medium">High team caseload</div>
                  <div className="text-sm text-gray-600">
                    Consider hiring additional case managers or reviewing client assignments
                  </div>
                </div>
              </div>
            )}
            
            {analytics.completionRate < 80 && (
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="font-medium">Low completion rate</div>
                  <div className="text-sm text-gray-600">
                    Review referral processes and provide additional training if needed
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
