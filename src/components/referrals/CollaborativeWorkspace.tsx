import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from '@/components/ui/progress';
import { ReferralTasks } from '@/components/referrals/ReferralTasks';
import { ReferralComments } from '@/components/referrals/ReferralComments';
import { format } from 'date-fns';
import { 
  MessageSquare, 
  Clock, 
  ClipboardList, 
  FileText, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Send,
  ChevronRight,
  User,
  Building
} from 'lucide-react';
import { ActivityTimeline } from './ActivityTimeline';
import { ReferralContext } from './ReferralContext';

interface CollaborativeWorkspaceProps {
  referralId: string;
  referral: any;
  userRole: 'case_manager' | 'provider' | 'admin';
  onStatusUpdate?: (status: string) => void;
  onNewTask?: (task: any) => void;
  onTaskComplete?: (taskId: string) => void;
  onNewComment?: (comment: string) => void;
}

export function CollaborativeWorkspace({
  referralId,
  referral,
  userRole,
  onStatusUpdate,
  onNewTask,
  onTaskComplete,
  onNewComment
}: CollaborativeWorkspaceProps) {
  const [activeTab, setActiveTab] = useState('timeline');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);

  // Combine all activities for a unified timeline
  useEffect(() => {
    if (!referral) return;
    
    // Fetch timeline events
    async function fetchTimeline() {
      setLoading(true);
      try {
        const res = await fetch(`/api/referrals/${referralId}/timeline`);
        if (!res.ok) throw new Error('Failed to fetch timeline');
        const data = await res.json();
        setEvents(data.events || []);
      } catch (err) {
        setError('Could not load timeline events.');
        // Use mock data as fallback
        setEvents([
          {
            id: '1',
            type: 'referral_created',
            title: 'Referral Created',
            description: `Referral submitted for ${referral.serviceDetails?.type || 'services'}`,
            timestamp: referral.createdAt,
            actor: {
              name: referral.caseManager?.name || 'Case Manager',
              role: 'case_manager'
            }
          },
          // Add more fallback events if needed
        ]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTimeline();
  }, [referralId, referral]);

  if (!referral) return null;

  // Extract info from referral
  const clientName = `${referral.clientInfo?.firstName || ''} ${referral.clientInfo?.lastName || ''}`.trim();
  const clientInitials = `${referral.clientInfo?.firstName?.[0] || ''}${referral.clientInfo?.lastName?.[0] || ''}`.toUpperCase();
  const serviceType = referral.serviceDetails?.type || 'Service';
  const status = referral.status || 'under_review';
  const caseManagerName = referral.caseManager?.name || 'Case Manager';
  const providerName = referral.provider?.name || referral.assignedProvider?.name || 'Provider';
  
  // Status configuration
  const getStatusConfig = (status: string) => {
    const configs: Record<string, any> = {
      under_review: {
        icon: Clock,
        color: 'amber',
        label: 'Under Review',
        description: 'Awaiting admin review',
        progressValue: 25
      },
      provider_selection_required: {
        icon: Building,
        color: 'blue',
        label: 'Select Provider',
        description: 'Case manager needs to select a provider',
        progressValue: 50
      },
      provider_accepted: {
        icon: CheckCircle,
        color: 'green',
        label: 'Provider Accepted',
        description: 'Provider has accepted the referral',
        progressValue: 75
      },
      in_progress: {
        icon: Clock,
        color: 'green',
        label: 'In Progress',
        description: 'Service is currently being provided',
        progressValue: 85
      },
      completed: {
        icon: CheckCircle,
        color: 'green',
        label: 'Completed',
        description: 'Service has been completed',
        progressValue: 100
      },
      cancelled: {
        icon: AlertCircle,
        color: 'red',
        label: 'Cancelled',
        description: 'This referral has been cancelled',
        progressValue: 100
      }
    };
    return configs[status] || configs.under_review;
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Shared Context Panel */}
      <ReferralContext 
        referral={referral}
        statusConfig={statusConfig}
        userRole={userRole}
        onStatusUpdate={onStatusUpdate}
      />

      {/* Activity Tabs */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Collaboration Workspace</CardTitle>
          <CardDescription>Work together on this referral</CardDescription>
        </CardHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardContent className="pt-2 pb-0">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Timeline</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                <span>Tasks</span>
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>Messages</span>
              </TabsTrigger>
            </TabsList>
          </CardContent>

          <TabsContent value="timeline" className="m-0">
            <CardContent className="pt-0">
              <ActivityTimeline 
                events={events} 
                loading={loading}
                error={error}
                userRole={userRole}
                referralId={referralId}
              />
            </CardContent>
          </TabsContent>

          <TabsContent value="tasks" className="m-0">
            <CardContent className="pt-0">
              <ReferralTasks 
                referralId={referralId}
              />
            </CardContent>
          </TabsContent>

          <TabsContent value="messages" className="m-0">
            <CardContent className="pt-0">
              <ReferralComments 
                referralId={referralId}
              />
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Action Panel */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {userRole === 'case_manager' && status === 'provider_selection_required' && (
            <Button className="w-full justify-start">
              <Building className="mr-2 h-4 w-4" />
              Select Provider
              <ChevronRight className="ml-auto h-4 w-4" />
            </Button>
          )}
          
          {userRole === 'provider' && status === 'under_review' && (
            <Button className="w-full justify-start" variant="outline">
              <CheckCircle className="mr-2 h-4 w-4" />
              Accept Referral
            </Button>
          )}
          
          {status === 'in_progress' && (
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Appointment
            </Button>
          )}
          
          {status === 'in_progress' && (
            <Button className="w-full justify-start" variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Update Service Plan
            </Button>
          )}
          
          <Button className="w-full justify-start" variant="outline">
            <MessageSquare className="mr-2 h-4 w-4" />
            Send Message
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 