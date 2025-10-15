/**
 * Sandbox Intelligence Dashboard
 * 
 * Sales intelligence page for tracking sandbox users,
 * lead scores, conversion funnel, and hot prospects.
 * 
 * Access: Platform Admin only
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import authOptions from '@/lib/auth';
import { 
  getHotLeads, 
  getExpiringSoon, 
  getConversionFunnel,
  getFeatureEngagement 
} from '@/lib/analytics/sandbox-tracker';
import { getSandboxStats } from '@/lib/sandbox/sandbox-manager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, Users, Target, Clock, 
  AlertCircle, CheckCircle2, Activity, Zap 
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SandboxIntelligencePage() {
  // ========================================================================
  // AUTHENTICATION
  // ========================================================================
  
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'platform_admin') {
    redirect('/');
  }
  
  // ========================================================================
  // FETCH DATA
  // ========================================================================
  
  const [
    hotLeads,
    expiringSoon,
    conversionFunnel,
    featureEngagement,
    sandboxStats
  ] = await Promise.all([
    getHotLeads(),
    getExpiringSoon(),
    getConversionFunnel(),
    getFeatureEngagement(),
    getSandboxStats(),
  ]);
  
  // ========================================================================
  // RENDER
  // ========================================================================
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sandbox Intelligence
        </h1>
        <p className="text-gray-600">
          Real-time insights into demo users and conversion opportunities
        </p>
      </div>
      
      {/* KPI Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Sandboxes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{sandboxStats.totalActive}</div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Hot Leads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-red-600">{hotLeads.length}</div>
              <Zap className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Conversion Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-green-600">
                {conversionFunnel.conversionRate.toFixed(1)}%
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Expiring Soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-orange-600">{expiringSoon.length}</div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>How users progress through the demo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <FunnelStep 
              label="Signups" 
              count={conversionFunnel.totalSignups} 
              percentage={100}
              color="blue"
            />
            <FunnelStep 
              label="Tour Completed" 
              count={conversionFunnel.tourCompleted} 
              percentage={(conversionFunnel.tourCompleted / conversionFunnel.totalSignups) * 100}
              color="indigo"
            />
            <FunnelStep 
              label="Challenge Attempted" 
              count={conversionFunnel.challengeAttempted} 
              percentage={(conversionFunnel.challengeAttempted / conversionFunnel.totalSignups) * 100}
              color="purple"
            />
            <FunnelStep 
              label="Clicked 'Go Live'" 
              count={conversionFunnel.conversionClicked} 
              percentage={(conversionFunnel.conversionClicked / conversionFunnel.totalSignups) * 100}
              color="pink"
            />
            <FunnelStep 
              label="Converted to Production" 
              count={conversionFunnel.converted} 
              percentage={(conversionFunnel.converted / conversionFunnel.totalSignups) * 100}
              color="green"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Hot Leads */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>🔥 Hot Leads (Score ≥ 70)</CardTitle>
              <CardDescription>High-engagement prospects ready for outreach</CardDescription>
            </div>
            <Button size="sm">Export CSV</Button>
          </div>
        </CardHeader>
        <CardContent>
          {hotLeads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hot leads yet. Check back as users engage with demos.
            </div>
          ) : (
            <div className="space-y-3">
              {hotLeads.map((lead) => (
                <div 
                  key={lead.sandboxOrgId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{lead.userId}</span>
                      <Badge variant={
                        lead.tier === 'ultra_hot' ? 'destructive' : 
                        lead.tier === 'hot' ? 'default' : 'secondary'
                      }>
                        {lead.tier.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Last active: {new Date(lead.lastActivityAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{lead.score}</div>
                      <div className="text-xs text-gray-500">Score</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {lead.conversionProbability}%
                      </div>
                      <div className="text-xs text-gray-500">Probability</div>
                    </div>
                    
                    <Button size="sm">
                      Contact
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Expiring Soon */}
      {expiringSoon.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Expiring in Next 2 Days
            </CardTitle>
            <CardDescription>Reach out before they lose access</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringSoon.map((sandbox: any) => (
                <div 
                  key={sandbox._id.toString()}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{sandbox.userId.toString()}</div>
                    <div className="text-sm text-gray-600">
                      {sandbox.tier} • {sandbox.role}
                    </div>
                  </div>
                  <div className="text-sm text-orange-600 font-medium">
                    Expires: {new Date(sandbox.expiresAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Tier Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sandboxes by Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <StatBar 
                label="Micro Organizations" 
                value={sandboxStats.byTier.micro}
                total={sandboxStats.totalActive}
                color="bg-green-500"
              />
              <StatBar 
                label="Mid-Tier Organizations" 
                value={sandboxStats.byTier.mid}
                total={sandboxStats.totalActive}
                color="bg-blue-500"
              />
              <StatBar 
                label="Enterprise Organizations" 
                value={sandboxStats.byTier.enterprise}
                total={sandboxStats.totalActive}
                color="bg-purple-500"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Sandboxes by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <StatBar 
                label="Case Managers" 
                value={sandboxStats.byRole.case_manager}
                total={sandboxStats.totalActive}
                color="bg-blue-500"
              />
              <StatBar 
                label="Supervisors" 
                value={sandboxStats.byRole.supervisor}
                total={sandboxStats.totalActive}
                color="bg-indigo-500"
              />
              <StatBar 
                label="Org Admins" 
                value={sandboxStats.byRole.org_admin}
                total={sandboxStats.totalActive}
                color="bg-purple-500"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function FunnelStep({ 
  label, 
  count, 
  percentage, 
  color 
}: { 
  label: string; 
  count: number; 
  percentage: number; 
  color: string; 
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">
          {count} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
        <div 
          className={`h-full bg-${color}-500 transition-all flex items-center px-3 text-white text-sm font-medium`}
          style={{ width: `${Math.max(percentage, 5)}%` }}
        >
          {count > 0 && `${count}`}
        </div>
      </div>
    </div>
  );
}

function StatBar({
  label,
  value,
  total,
  color
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-700">{label}</span>
        <span className="text-sm font-medium">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

