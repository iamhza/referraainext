import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
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
  Eye,
  PaperclipIcon,
  Paperclip,
  Plus,
  History,
  Tag,
  Users,
  Bell,
  Flag
} from 'lucide-react';
import { ReferralTasks } from './ReferralTasks';
import { EnhancedActivityTimeline } from './EnhancedActivityTimeline';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EnhancedCollaborativeWorkspaceProps {
  referralId: string;
  referral: any;
  userRole: 'case_manager' | 'provider' | 'admin';
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  onStatusUpdate?: (status: string) => Promise<boolean | void>;
  onNewTask?: (task: any) => Promise<boolean | void>;
  onTaskComplete?: (taskId: string) => Promise<boolean | void>;
  onNewComment?: (eventId: string, comment: string, attachments?: File[], threadId?: string) => Promise<boolean | void>;
  onAddReaction?: (eventId: string, commentId: string, emoji: string) => Promise<boolean | void>;
  onAddAttachment?: (eventId: string, files: File[]) => Promise<boolean | void>;
  onTagEvent?: (eventId: string, tag: string) => Promise<boolean | void>;
  onViewEvent?: (eventId: string) => Promise<boolean | void>;
  onAssignUser?: (userId: string) => Promise<boolean | void>;
}

export function EnhancedCollaborativeWorkspace({
  referralId,
  referral,
  userRole,
  currentUser,
  onStatusUpdate,
  onNewTask,
  onTaskComplete,
  onNewComment,
  onAddReaction,
  onAddAttachment,
  onTagEvent,
  onViewEvent,
  onAssignUser
}: EnhancedCollaborativeWorkspaceProps) {
  const [activeTab, setActiveTab] = useState('timeline');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(true);

  // Fetch timeline events and participants
  useEffect(() => {
    if (!referral) return;
    
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch timeline events
        const eventsRes = await fetch(`/api/referrals/${referralId}/timeline`);
        if (!eventsRes.ok) throw new Error('Failed to fetch timeline');
        const eventsData = await eventsRes.json();
        setEvents(eventsData.events || []);
        
        // Fetch participants
        const participantsRes = await fetch(`/api/referrals/${referralId}/participants`);
        if (participantsRes.ok) {
          const participantsData = await participantsRes.json();
          setParticipants(participantsData.participants || []);
        }
        
        // Record view event
        await fetch(`/api/referrals/${referralId}/views`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        // Fetch recent views
        const viewsRes = await fetch(`/api/referrals/${referralId}/views`);
        if (viewsRes.ok) {
          const viewsData = await viewsRes.json();
          setRecentlyViewed(viewsData.views || []);
        }
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
              id: referral.caseManager?.id || 'unknown',
              name: referral.caseManager?.name || 'Case Manager',
              role: 'case_manager'
            }
          }
        ]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [referralId, referral]);

  const handleAddComment = async (eventId: string, comment: string, attachments?: File[], threadId?: string) => {
    if (!onNewComment) return;
    return onNewComment(eventId, comment, attachments, threadId);
  };

  const handleToggleSubscribe = async () => {
    try {
      // Toggle subscription status
      await fetch(`/api/referrals/${referralId}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscribed: !isSubscribed })
      });
      
      setIsSubscribed(!isSubscribed);
    } catch (error) {
      console.error('Failed to toggle subscription', error);
    }
  };

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

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Referral Context Panel */}
      <Card className="shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50">
          <div className="flex justify-between items-center px-6 py-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 rounded-lg border-2 border-white shadow-sm bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-medium">
                <AvatarFallback>{clientInitials}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{clientName}</h2>
                <p className="text-sm text-gray-600">{serviceType} Referral</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                className={cn(
                  "px-3 py-1 text-sm font-medium flex items-center gap-1.5 rounded-full",
                  statusConfig.color === 'amber' && "bg-amber-100 text-amber-800 border-amber-200",
                  statusConfig.color === 'green' && "bg-green-100 text-green-800 border-green-200",
                  statusConfig.color === 'blue' && "bg-blue-100 text-blue-800 border-blue-200",
                  statusConfig.color === 'red' && "bg-red-100 text-red-800 border-red-200",
                  statusConfig.color === 'purple' && "bg-purple-100 text-purple-800 border-purple-200"
                )}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {statusConfig.label}
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 text-sm font-medium"
                onClick={handleToggleSubscribe}
              >
                {isSubscribed ? (
                  <>
                    <Bell className="h-3.5 w-3.5 mr-1.5 text-green-600" />
                    Subscribed
                  </>
                ) : (
                  <>
                    <Bell className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                    Subscribe
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="px-6 pb-4">
            <Progress value={statusConfig.progressValue} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Progress</span>
              <span>{statusConfig.progressValue}%</span>
            </div>
          </div>
        </div>
        
        {/* Quick details section */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Case Manager</h3>
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                    {getInitials(caseManagerName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{caseManagerName}</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Provider</h3>
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                    {getInitials(providerName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{providerName}</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Date Created</h3>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium">
                  {referral.createdAt 
                    ? format(new Date(referral.createdAt), 'MMM d, yyyy') 
                    : 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left side - Timeline and Tasks */}
        <div className="lg:col-span-8 space-y-6">
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
                    <History className="h-4 w-4" />
                    <span>Activity</span>
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    <span>Tasks</span>
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Documents</span>
                  </TabsTrigger>
                </TabsList>
              </CardContent>

              <TabsContent value="timeline" className="m-0">
                <CardContent className="pt-0">
                  <EnhancedActivityTimeline 
                    events={events} 
                    loading={loading}
                    error={error}
                    userRole={userRole}
                    referralId={referralId}
                    currentUser={currentUser}
                    onAddComment={handleAddComment}
                    onAddReaction={onAddReaction}
                    onAddAttachment={onAddAttachment}
                    onTagEvent={onTagEvent}
                    onViewEvent={onViewEvent}
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

              <TabsContent value="documents" className="m-0">
                <CardContent className="pt-0">
                  <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                    <Paperclip className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-gray-800 font-medium mb-2">No documents yet</h3>
                    <p className="text-sm mb-4">Upload documents to collaborate on this referral</p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  </div>
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right side - Contextual Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Participants */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="h-4 w-4 text-gray-500 mr-2" />
                Participants
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-3">
                {participants.length > 0 ? (
                  participants.map((participant, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          {participant.avatar ? (
                            <AvatarImage src={participant.avatar} alt={participant.name} />
                          ) : (
                            <AvatarFallback className="text-xs">
                              {getInitials(participant.name)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{participant.name}</p>
                          <p className="text-xs text-gray-500">{participant.role}</p>
                        </div>
                      </div>
                      {participant.online && (
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-2 text-sm text-gray-500">
                    <p>No participants yet</p>
                  </div>
                )}
              </div>
              
              <Separator className="my-4" />
              
              <Button variant="outline" className="w-full text-sm">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Participant
              </Button>
            </CardContent>
          </Card>
          
          {/* Recently Viewed */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Eye className="h-4 w-4 text-gray-500 mr-2" />
                Recently Viewed
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-3">
                {recentlyViewed.length > 0 ? (
                  recentlyViewed.map((view, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          {view.user.avatar ? (
                            <AvatarImage src={view.user.avatar} alt={view.user.name} />
                          ) : (
                            <AvatarFallback className="text-xs">
                              {getInitials(view.user.name)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span className="text-sm">{view.user.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(view.timestamp), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-2 text-sm text-gray-500">
                    <p>No recent views</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Tags */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Tag className="h-4 w-4 text-gray-500 mr-2" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex flex-wrap gap-2 mb-4">
                {referral.tags && referral.tags.length > 0 ? (
                  referral.tags.map((tag: string, i: number) => (
                    <Badge key={i} variant="outline" className="bg-blue-50 text-blue-600 border-blue-100">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <div className="text-center w-full py-2 text-sm text-gray-500">
                    <p>No tags added</p>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Input placeholder="Add a tag..." className="text-sm" />
                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Priority Actions */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Flag className="h-4 w-4 text-gray-500 mr-2" />
                Priority Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 space-y-3">
              {userRole === 'case_manager' && status === 'provider_selection_required' && (
                <Button className="w-full justify-start text-sm">
                  <Building className="mr-2 h-4 w-4" />
                  Select Provider
                  <ChevronRight className="ml-auto h-4 w-4" />
                </Button>
              )}
              
              {userRole === 'provider' && status === 'under_review' && (
                <Button className="w-full justify-start text-sm" variant="outline">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Accept Referral
                </Button>
              )}
              
              {status === 'in_progress' && (
                <Button className="w-full justify-start text-sm" variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Appointment
                </Button>
              )}
              
              {status === 'in_progress' && (
                <Button className="w-full justify-start text-sm" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Update Service Plan
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 