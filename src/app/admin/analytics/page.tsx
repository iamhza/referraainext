'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  Clock, 
  CheckCircle,
  XCircle,
  Calendar,
  Download,
  Filter
} from 'lucide-react';

interface AnalyticsData {
  totalReferrals: number;
  activeReferrals: number;
  completedReferrals: number;
  totalProviders: number;
  activeProviders: number;
  totalCaseManagers: number;
  avgResponseTime: number;
  referralGrowth: number;
  providerGrowth: number;
  completionRate: number;
  monthlyData: {
    month: string;
    referrals: number;
    completions: number;
    newProviders: number;
  }[];
}

export default function AdminAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>('30d');

  // Mock data for now - replace with actual API call
  useEffect(() => {
    const mockData: AnalyticsData = {
      totalReferrals: 1247,
      activeReferrals: 89,
      completedReferrals: 1158,
      totalProviders: 156,
      activeProviders: 142,
      totalCaseManagers: 23,
      avgResponseTime: 2.4,
      referralGrowth: 12.5,
      providerGrowth: 8.3,
      completionRate: 92.8,
      monthlyData: [
        { month: 'Jan', referrals: 89, completions: 82, newProviders: 12 },
        { month: 'Feb', referrals: 94, completions: 87, newProviders: 8 },
        { month: 'Mar', referrals: 102, completions: 95, newProviders: 15 },
        { month: 'Apr', referrals: 98, completions: 91, newProviders: 6 },
        { month: 'May', referrals: 115, completions: 108, newProviders: 18 },
        { month: 'Jun', referrals: 127, completions: 119, newProviders: 22 },
        { month: 'Jul', referrals: 134, completions: 125, newProviders: 25 }
      ]
    };

    setAnalyticsData(mockData);
    setLoading(false);
  }, []);

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (loading || !analyticsData) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">Platform performance and insights</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.totalReferrals.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getGrowthIcon(analyticsData.referralGrowth)}
                  <span className={`text-sm font-medium ${getGrowthColor(analyticsData.referralGrowth)}`}>
                    {analyticsData.referralGrowth > 0 ? '+' : ''}{analyticsData.referralGrowth}%
                  </span>
                  <span className="text-xs text-gray-500">vs last period</span>
                </div>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Referrals</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.activeReferrals}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-blue-100 text-blue-800">
                    {((analyticsData.activeReferrals / analyticsData.totalReferrals) * 100).toFixed(1)}% of total
                  </Badge>
                </div>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.completionRate}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">
                    {analyticsData.completedReferrals} completed
                  </span>
                </div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.avgResponseTime} days</p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Provider response</span>
                </div>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider & User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Providers
            </CardTitle>
            <CardDescription>Healthcare provider statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Providers</span>
                <span className="font-semibold">{analyticsData.totalProviders}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Providers</span>
                <span className="font-semibold text-green-600">{analyticsData.activeProviders}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Growth</span>
                <div className="flex items-center gap-1">
                  {getGrowthIcon(analyticsData.providerGrowth)}
                  <span className={`text-sm font-medium ${getGrowthColor(analyticsData.providerGrowth)}`}>
                    {analyticsData.providerGrowth > 0 ? '+' : ''}{analyticsData.providerGrowth}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              Case Managers
            </CardTitle>
            <CardDescription>Case manager activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Case Managers</span>
                <span className="font-semibold">{analyticsData.totalCaseManagers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Referrals/CM</span>
                <span className="font-semibold">
                  {Math.round(analyticsData.totalReferrals / analyticsData.totalCaseManagers)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active This Month</span>
                <span className="font-semibold text-green-600">
                  {Math.round(analyticsData.totalCaseManagers * 0.85)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Performance
            </CardTitle>
            <CardDescription>Platform performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">System Uptime</span>
                <span className="font-semibold text-green-600">99.9%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Load Time</span>
                <span className="font-semibold">1.2s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Error Rate</span>
                <span className="font-semibold text-green-600">0.1%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Monthly Trends
          </CardTitle>
          <CardDescription>Referral and provider growth over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Month</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">New Referrals</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Completions</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">New Providers</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.monthlyData.map((data, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{data.month}</td>
                    <td className="py-3 px-4">{data.referrals}</td>
                    <td className="py-3 px-4 text-green-600">{data.completions}</td>
                    <td className="py-3 px-4 text-blue-600">{data.newProviders}</td>
                    <td className="py-3 px-4">
                      {((data.completions / data.referrals) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="flex items-center gap-2 h-auto p-4">
                <Users className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Manage Providers</div>
                  <div className="text-sm text-gray-500">Review and approve provider accounts</div>
                </div>
              </Button>
              
              <Button variant="outline" className="flex items-center gap-2 h-auto p-4">
                <FileText className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Review Referrals</div>
                  <div className="text-sm text-gray-500">Monitor referral assignments and progress</div>
                </div>
              </Button>
              
              <Button variant="outline" className="flex items-center gap-2 h-auto p-4">
                <BarChart3 className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Generate Reports</div>
                  <div className="text-sm text-gray-500">Create detailed performance reports</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 