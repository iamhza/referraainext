import { useState, useEffect, useRef } from 'react';
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
  Building,
  Paperclip,
  Smile,
  ArrowRight,
  UserCheck,
  Users,
  FilePlus,
  Tag,
  Activity,
  Loader2
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
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Next Step logic
  const getNextStep = () => {
    switch (status) {
      case 'under_review':
        return 'Waiting for admin review.';
      case 'provider_selection_required':
        return 'Select a provider to move forward.';
      case 'provider_accepted':
        return 'Begin collaboration with the provider.';
      case 'in_progress':
        return 'Continue collaboration and update progress.';
      case 'completed':
        return 'Referral completed. Review and close.';
      case 'cancelled':
        return 'Referral cancelled.';
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Main Workspace */}
      <div className="flex-1 space-y-4">
        {/* Progress & Next Step */}
        <div className="flex items-center gap-4 mb-2">
          <Progress value={statusConfig.progressValue} className="w-1/2" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Next Step</span>
            <span className="text-base font-semibold">{getNextStep()}</span>
          </div>
        </div>
        {/* Activity Feed */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> Activity Feed
            </CardTitle>
            {loading && <Loader2 className="animate-spin h-4 w-4 text-muted-foreground" />}
          </CardHeader>
          <CardContent className="pt-0">
            {events.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No activity yet. Start by sending a message or uploading a file!
              </div>
            ) : (
              <ul className="space-y-4">
                {events.map((event) => (
                  <li key={event.id} className="flex items-start gap-3 animate-fade-in">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{event.actor?.name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{event.actor?.name}</span>
                        <Badge variant="outline">{event.actor?.role}</Badge>
                        <span className="text-xs text-muted-foreground">{format(new Date(event.timestamp), 'PPpp')}</span>
                      </div>
                      <div className="text-sm mt-1">{event.title}</div>
                      {event.description && <div className="text-xs text-muted-foreground mt-1">{event.description}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
          {/* Smart Comment Box */}
          <CardFooter className="flex flex-col gap-2 border-t pt-4">
            <div className="flex items-center gap-2 w-full">
              <Avatar className="h-8 w-8"><AvatarFallback>M</AvatarFallback></Avatar>
              <input
                className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none"
                placeholder="Comment, @mention, or / for commands..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                disabled={sending}
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                title="Attach file"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" title="Emoji">
                <Smile className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                onClick={async () => {
                  setSending(true);
                  await onNewComment?.(comment);
                  setComment('');
                  setSending(false);
                }}
                disabled={!comment.trim() || sending}
                title="Send"
              >
                <Send className="h-5 w-5" />
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={() => {}}
              />
            </div>
            <Button variant="outline" className="w-full" title="Send update to client">
              <ArrowRight className="mr-2 h-4 w-4" /> Send Client Update
            </Button>
          </CardFooter>
        </Card>
      </div>
      {/* Sidebar */}
      <div className="w-full md:w-80 flex flex-col gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" /> Participants
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {/* List participants with avatars, roles, and online status */}
            {/* ... */}
            <Button variant="outline" className="w-full mt-2">
              <UserCheck className="mr-2 h-4 w-4" /> Add Participant
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Quick add/assign tasks, show list */}
            {/* ... */}
            <Button variant="outline" className="w-full mt-2">
              <FilePlus className="mr-2 h-4 w-4" /> Add Task
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FilePlus className="h-4 w-4" /> Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Drag-and-drop upload, preview files */}
            {/* ... */}
            <Button variant="outline" className="w-full mt-2">
              <FilePlus className="mr-2 h-4 w-4" /> Upload Document
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Tag className="h-4 w-4" /> Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add/search tags */}
            {/* ... */}
            <input className="w-full border rounded-md px-2 py-1 text-sm mt-2" placeholder="Add a tag..." />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ArrowRight className="h-4 w-4" /> Priority Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium text-primary">{getNextStep()}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 