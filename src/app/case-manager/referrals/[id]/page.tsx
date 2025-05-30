'use client';

import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ReferralComments } from '@/components/referrals/ReferralComments';
import { ReferralTasks } from '@/components/referrals/ReferralTasks';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import Link from 'next/link';
import { 
  MessageSquare, 
  AlertCircle, 
  Clock, 
  XCircle,
  CheckCircle,
  ChevronRight,
  Calendar,
  Phone,
  Mail,
  Building,
  MapPin,
  ArrowLeft, 
  ExternalLink,
  UserCircle,
  AlertOctagon,
  FileText,
  ChevronLeft, 
  ClipboardList, 
  CheckCircle2,
  Package,
  MoreHorizontal,
  Heart,
  Flag,
  Send,
  User,
  Users, 
  Info
} from 'lucide-react';
import { formatSafeDate } from '@/lib/date-utils';

type ReferralStatus = 
  | 'under_review'
  | 'provider_selection_required'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

interface Provider {
  id: string;
  name: string;
  organization: string;
  matchScore: number;
  distance: string;
  availability: string;
  waitTime: string;
  phone: string;
  email: string;
  address: string;
}

export default function ReferralDetails() {
  const params = useParams();
  // Defensive extraction of referralId
  const referralId = typeof params?.id === 'string'
    ? params.id
    : Array.isArray(params?.id)
      ? params.id[0]
      : undefined;

  // All hooks at the top
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [referral, setReferral] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const { user } = useAuth();
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch referral
  useEffect(() => {
    if (!referralId) return;
    async function fetchReferral() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/referrals/${referralId}`);
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
  }, [referralId]);

  // Map real data to UI fields (safe defaults)
  const clientName = referral ? `${referral.clientInfo?.firstName || ''} ${referral.clientInfo?.lastName || ''}`.trim() : '';
  const clientId = referral?.clientInfo?.referenceId || referral?.clientInfo?._id || referral?._id || '';
  const serviceType = referral?.serviceDetails?.type || '';
  const submittedDate = referral?.createdAt;
  const notes = referral?.serviceDetails?.additionalNotes || '';
  const status = referral?.status;
  const urgent = referral?.serviceDetails?.urgency === 'high';
  const clientInitials = referral ? 
    `${referral.clientInfo?.firstName?.charAt(0) || ''}${referral.clientInfo?.lastName?.charAt(0) || ''}`.trim().toUpperCase() : 
    'CL';

  const getStatusConfig = (status: ReferralStatus) => {
    const configs: Record<ReferralStatus, any> = {
      under_review: {
        icon: Clock,
        color: 'amber',
        label: 'Under Review',
        description: referral?.expectedReviewCompletion ? `Expected completion by ${new Date(referral.expectedReviewCompletion).toLocaleDateString()}` : '',
        progressValue: 25
      },
      provider_selection_required: {
        icon: AlertCircle,
        color: 'blue',
        label: 'Provider Selection Required',
        description: 'Please select a provider from the matched options',
        progressValue: 50
      },
      in_progress: {
        icon: Clock,
        color: 'green',
        label: 'In Progress',
        description: 'Service is currently being provided',
        progressValue: 75
      },
      completed: {
        icon: CheckCircle,
        color: 'green',
        label: 'Completed',
        description: 'Service has been completed',
        progressValue: 100
      },
      cancelled: {
        icon: XCircle,
        color: 'red',
        label: 'Cancelled',
        description: 'This referral has been cancelled',
        progressValue: 100
      }
    };
    return configs[status as ReferralStatus] || configs['under_review'];
  };

  const handleProviderSelection = async (providerId: string) => {
    setSelectedProvider(providerId);
  };

  const handleConfirmSelection = async () => {
    if (!selectedProvider || !referralId) return;
    setAssigning(true);
    setAssignError(null);
    try {
      const res = await fetch(`/api/referrals/${referralId}/assign-provider`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: selectedProvider, status: 'in_progress' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to assign provider');
      }
      // Refetch referral to update UI
      const refRes = await fetch(`/api/referrals/${referralId}`);
      const refData = await refRes.json();
      setReferral(refData.referral);
    } catch (err: any) {
      setAssignError(err.message || 'Error assigning provider');
    } finally {
      setAssigning(false);
    }
  };

  const handleAddNote = async (note: string) => {
    // API call to add a note
  };

  const handleCancelReferral = async () => {
    // API call to cancel referral
    setShowCancelDialog(false);
  };

  const statusConfig = getStatusConfig(status);

  // Determine if messaging is allowed
  const providerAssigned = !!referral?.selectedProvider?.id;
  const canMessage =
    (status === 'in_progress' && providerAssigned) ||
    (status === 'provider_selection_required' && providerAssigned);

  // Fetch messages for this referral
  useEffect(() => {
    if (!canMessage || !showChat || !referralId) return;
    let isMounted = true;
    async function fetchMessages() {
      setChatLoading(true);
      setChatError(null);
      try {
        const res = await fetch(`/api/messages?referralId=${referralId}`);
        if (!res.ok) throw new Error('Failed to fetch messages');
        const data = await res.json();
        if (isMounted) setMessages(data.messages);
      } catch (err) {
        if (isMounted) setChatError('Could not load messages.');
      } finally {
        if (isMounted) setChatLoading(false);
      }
    }
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [canMessage, showChat, referralId]);

  async function handleSendMessage() {
    if (!messageInput.trim() || !user || !referral?.selectedProvider?.id || !referralId) return;
    try {
      const toUserId = referral.selectedProvider.id;
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId,
          content: messageInput,
          referralId,
        }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      setMessageInput('');
      const data = await res.json();
      setMessages((msgs: any[]) => [...msgs, data.message]);
    } catch (err) {
      setChatError('Failed to send message.');
    }
  }

  // After all hooks, do conditional rendering
  if (!referralId) {
    return <div className="p-8 text-center text-red-500">Invalid referral ID. Please return to the dashboard.</div>;
  }
  if (loading) return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-500"></div>
    </div>
  );
  if (error || !referral) return (
    <div className="min-h-screen flex flex-col justify-center items-center gap-4">
      <AlertOctagon className="h-16 w-16 text-red-500" />
      <h3 className="text-xl font-semibold text-gray-900">Error Loading Referral</h3>
      <p className="text-gray-600">{error || 'Referral not found.'}</p>
      <Button asChild>
        <Link href="/case-manager/referrals">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Referrals
        </Link>
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50/20">
      <div className="py-8">
        <div className="animate-fade-in">
          {/* Header with Back Button and Basic Info */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">
                Referral Details
              </h1>
              
              <Button 
                variant="default" 
                className="bg-blue-600 hover:bg-blue-700 shadow-md"
                asChild
              >
                <Link href={`/case-manager/referrals/${referralId}/workspace`}>
                  <Users className="mr-2 h-4 w-4" />
                  Go to Collaboration Workspace
                </Link>
              </Button>
            </div>
            
            <div className="text-md text-gray-500 mt-1">
              Referral ID: {referralId}
            </div>
          </div>
          
          <div className="mb-6 flex items-center">
            <Button 
              variant="outline" 
              asChild
              className="mr-4 rounded-full border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group"
            >
              <Link href="/case-manager/referrals">
                <ChevronLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                Back to Referrals
              </Link>
            </Button>
            
            <div className="ml-auto flex gap-2">
              {status !== 'completed' && status !== 'cancelled' && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowCancelDialog(true)}
                  className="rounded-full border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 hover:text-red-700"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Referral
                </Button>
              )}
              
              {canMessage && (
                <EnhancedButton 
                  variant="gradient" 
                  rounded="full"
                  onClick={() => setShowChat(true)}
                  className="shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Message Provider
                </EnhancedButton>
              )}
            </div>
          </div>
          
          {/* Add an info banner about workspace purpose */}
          <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <Info className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium text-blue-800">About this page</h3>
                <p className="text-blue-700 mt-1">
                  This page provides a comprehensive view of the referral details. For collaborative features like task management, messaging, and timeline updates, use the <Link href={`/case-manager/referrals/${referralId}/workspace`} className="font-medium underline">Collaboration Workspace</Link>.
                </p>
              </div>
            </div>
          </div>
          
          {/* Status Banner & Progress */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-4xl font-bold tracking-tight text-gray-900">{clientName}</h1>
                  {urgent && (
                    <Badge variant="destructive" className="rounded-full px-3 py-1 text-base">Urgent</Badge>
                  )}
                </div>
                <p className="text-lg text-gray-600 mt-2">
                  Referral for {serviceType}
                </p>
              </div>
              
              <Badge 
                className={cn(
                  "flex items-center gap-2 py-2 px-4 rounded-full text-base shadow-sm md:self-start",
                  `bg-${statusConfig.color}-50 text-${statusConfig.color}-700 border-${statusConfig.color}-100`
                )}
              >
                <statusConfig.icon className="h-5 w-5" />
                {statusConfig.label}
              </Badge>
            </div>
            
            <Card className="rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white font-medium text-xl shadow transition-transform duration-200">
                      <AvatarFallback>{clientInitials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{clientName}</h2>
                      <div className="flex flex-wrap items-center gap-x-4 mt-1 text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-gray-400" />
                          ID: {clientId.substring(0, 8)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {submittedDate ? formatSafeDate(submittedDate) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full sm:w-auto flex items-center gap-2">
                    <div className="text-sm text-right font-medium">
                      <span className={`text-${statusConfig.color}-700`}>
                        {statusConfig.progressValue}% Complete
                      </span>
                    </div>
                  </div>
                </div>
                
                <Progress 
                  value={statusConfig.progressValue} 
                  className={cn("h-2 bg-gray-100", status === 'cancelled' && "bg-red-100")} 
                  style={{ 
                    '--progress-foreground': status === 'under_review' 
                      ? '#f59e0b' // amber-500
                      : status === 'provider_selection_required'
                      ? '#3b82f6' // blue-500 
                      : status === 'in_progress'
                      ? '#22c55e' // green-500
                      : status === 'completed'
                      ? '#16a34a' // green-600
                      : status === 'cancelled'
                      ? '#ef4444' // red-500
                      : '#3b82f6' // blue-500 (default)
                  } as React.CSSProperties}
                />
              </div>
            </Card>
          </div>

          {/* Tabs and Content */}
          <Tabs 
            defaultValue="overview" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="bg-blue-50/50 p-1 rounded-xl">
              <TabsTrigger 
                value="overview" 
                className="rounded-lg text-base py-2.5 px-4 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="details" 
                className="rounded-lg text-base py-2.5 px-4 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
              >
                Client Details
              </TabsTrigger>
              <TabsTrigger 
                value="tasks" 
                className="rounded-lg text-base py-2.5 px-4 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
              >
                Tasks
              </TabsTrigger>
              <TabsTrigger 
                value="comments" 
                className="rounded-lg text-base py-2.5 px-4 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
              >
                Comments
              </TabsTrigger>
              <TabsTrigger 
                value="timeline" 
                className="rounded-lg text-base py-2.5 px-4 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
              >
                Timeline
              </TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="animate-fade-in">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                  {/* Service Details */}
                  <Card className="rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300">
                    <CardHeader className="pb-4 pt-6">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2">
                        <Package className="h-5 w-5 text-blue-500" />
                        Service Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-gray-50/80">
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Service Type</h4>
                          <p className="text-base font-medium">{serviceType}</p>
                        </div>
                        
                        <div className="p-4 rounded-lg bg-gray-50/80">
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Priority</h4>
                          <p className="text-base font-medium flex items-center gap-2">
                            {referral?.serviceDetails?.urgency === 'high' && (
                              <><span className="w-2 h-2 rounded-full bg-red-500"></span> High</>
                            )}
                            {referral?.serviceDetails?.urgency === 'medium' && (
                              <><span className="w-2 h-2 rounded-full bg-amber-500"></span> Medium</>
                            )}
                            {referral?.serviceDetails?.urgency === 'low' && (
                              <><span className="w-2 h-2 rounded-full bg-green-500"></span> Low</>
                            )}
                          </p>
                        </div>
                        
                        {referral?.serviceDetails?.counties && referral.serviceDetails.counties.length > 0 && (
                          <div className="p-4 rounded-lg bg-gray-50/80">
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Service Area</h4>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {referral.serviceDetails.counties.map((county: string, idx: number) => (
                                <Badge 
                                  key={idx} 
                                  variant="outline" 
                                  className="bg-blue-50 text-blue-700 border-blue-200 rounded-full"
                                >
                                  {county}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {notes && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Additional Notes</h4>
                          <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-100 text-blue-900">
                            {notes}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Status-specific content */}
                  {status === 'provider_selection_required' && (
                    <Card className="rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300">
                      <CardHeader className="pb-4 pt-6">
                        <CardTitle className="text-xl font-semibold flex items-center gap-2">
                          <UserCircle className="h-5 w-5 text-blue-500" />
                          Select a Provider
                        </CardTitle>
                        <CardDescription className="text-base">
                          These providers match your client's needs
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0 pb-6 space-y-6">
                        {referral.matchedProviders && referral.matchedProviders.map((provider: any) => (
                          <div 
                            key={provider.id}
                            className={cn(
                              "border rounded-xl p-5",
                              "transition-all duration-200",
                              selectedProvider === provider.id 
                                ? "border-blue-300 bg-blue-50/60 shadow-sm" 
                                : "border-gray-100 hover:border-blue-200 hover:bg-blue-50/20"
                            )}
                          >
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                              <div className="space-y-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium text-lg">{provider.name}</h3>
                                    <Badge className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 rounded-full">
                                      <Heart className="h-3 w-3 fill-green-500 stroke-green-500" />
                                      {provider.matchScore}% Match
                                    </Badge>
                                  </div>
                                  <p className="text-base text-gray-600">{provider.organization}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="outline" className="flex items-center gap-1 rounded-full">
                                    <MapPin className="h-3 w-3" />
                                    {provider.distance}
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center gap-1 rounded-full">
                                    <Clock className="h-3 w-3" />
                                    Wait: {provider.waitTime}
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center gap-1 rounded-full">
                                    <Calendar className="h-3 w-3" />
                                    {provider.availability} availability
                                  </Badge>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-3 text-sm mt-2">
                                  <p className="flex items-center gap-2 text-gray-700">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    {provider.phone}
                                  </p>
                                  <p className="flex items-center gap-2 text-gray-700">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    {provider.email}
                                  </p>
                                  <p className="flex items-center gap-2 text-gray-700 sm:col-span-2">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    {provider.address}
                                  </p>
                                </div>
                              </div>
                              <div className="flex md:flex-col gap-2 mt-4 md:mt-0">
                                <Button
                                  variant={selectedProvider === provider.id ? "default" : "outline"}
                                  onClick={() => handleProviderSelection(provider.id)}
                                  className={cn(
                                    "flex-1 md:flex-none rounded-full",
                                    selectedProvider === provider.id 
                                      ? "bg-blue-600 hover:bg-blue-700"
                                      : "border-blue-200 text-blue-600 hover:text-blue-700"
                                  )}
                                >
                                  {selectedProvider === provider.id ? "Selected" : "Select Provider"}
                                </Button>
                                <Button variant="outline" className="flex-1 md:flex-none rounded-full">
                                  View Profile
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}

                        <div className="flex justify-end mt-6">
                          <EnhancedButton
                            disabled={!selectedProvider || assigning}
                            variant="gradient"
                            rounded="full"
                            onClick={handleConfirmSelection}
                            className="shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            {assigning ? 'Assigning...' : 'Confirm Selection'}
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </EnhancedButton>
                        </div>
                        {assignError && (
                          <div className="text-red-500 text-sm mt-2 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {assignError}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Active Provider Details */}
                  {status === 'in_progress' && referral.selectedProvider && (
                    <Card className="rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300">
                      <CardHeader className="pb-4 pt-6">
                        <CardTitle className="text-xl font-semibold flex items-center gap-2">
                          <UserCircle className="h-5 w-5 text-green-500" />
                          Active Provider
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 pb-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-lg">{referral.selectedProvider.name}</h3>
                            <p className="text-base text-gray-600">{referral.selectedProvider.organization}</p>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3 mt-4 p-4 rounded-lg bg-gray-50/80">
                          <p className="flex items-center gap-2 text-gray-700">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {referral.selectedProvider.phone}
                          </p>
                          <p className="flex items-center gap-2 text-gray-700">
                            <Mail className="h-4 w-4 text-gray-400" />
                            {referral.selectedProvider.email}
                          </p>
                          <p className="flex items-center gap-2 text-gray-700 sm:col-span-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            {referral.selectedProvider.address}
                          </p>
                        </div>

                        {referral.selectedProvider.nextAppointment && (
                          <div className="mt-4 p-4 border border-blue-100 rounded-lg bg-blue-50/50">
                            <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Upcoming Appointment
                            </h4>
                            <p className="text-blue-700">
                              {new Date(referral.selectedProvider.nextAppointment).toLocaleDateString()}{' '}
                              at {new Date(referral.selectedProvider.nextAppointment).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
                
                {/* Side Content */}
                <div className="space-y-6">
                  {/* What's Next? */}
                  <Card className="rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300">
                    <CardHeader className="pb-4 pt-6">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                        What's Next?
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-6">
                      <ul className="space-y-3 text-base">
                        {status === 'under_review' && referral.expectedReviewCompletion && (
                          <>
                            <li className="flex gap-2 items-start">
                              <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span>Admin team is reviewing your referral</span>
                            </li>
                            <li className="flex gap-2 items-start">
                              <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span>They will match suitable providers based on the requirements</span>
                            </li>
                            <li className="flex gap-2 items-start">
                              <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span>You'll be notified when providers are ready for selection</span>
                            </li>
                            <li className="flex gap-2 items-start">
                              <Calendar className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                              <span>Expected completion: {new Date(referral.expectedReviewCompletion).toLocaleDateString()}</span>
                            </li>
                          </>
                        )}
                        {status === 'provider_selection_required' && (
                          <>
                            <li className="flex gap-2 items-start">
                              <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span>Review the matched providers</span>
                            </li>
                            <li className="flex gap-2 items-start">
                              <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span>Compare match scores, availability, and location</span>
                            </li>
                            <li className="flex gap-2 items-start">
                              <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span>Select the most suitable provider for your client</span>
                            </li>
                            <li className="flex gap-2 items-start">
                              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                              <span>The provider will be notified after confirmation</span>
                            </li>
                          </>
                        )}
                        {status === 'in_progress' && (
                          <>
                            <li className="flex gap-2 items-start">
                              <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span>Monitor the client's progress with the provider</span>
                            </li>
                            <li className="flex gap-2 items-start">
                              <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span>Add notes for important updates or concerns</span>
                            </li>
                            <li className="flex gap-2 items-start">
                              <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span>Contact the provider directly for any questions</span>
                            </li>
                            <li className="flex gap-2 items-start">
                              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                              <span>The provider will update the status as needed</span>
                            </li>
                          </>
                        )}
                        {status === 'completed' && (
                          <>
                            <li className="flex gap-2 items-start">
                              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>This referral has been completed</span>
                            </li>
                            <li className="flex gap-2 items-start">
                              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>You can view the full history in the timeline</span>
                            </li>
                            <li className="flex gap-2 items-start">
                              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>Create a new referral if additional services are needed</span>
                            </li>
                          </>
                        )}
                        {status === 'cancelled' && (
                          <>
                            <li className="flex gap-2 items-start">
                              <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                              <span>This referral has been cancelled</span>
                            </li>
                            <li className="flex gap-2 items-start">
                              <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span>Create a new referral if needed</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                  
                  {/* Client Contact Info */}
                  <Card className="rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300">
                    <CardHeader className="pb-4 pt-6">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-500" />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-6 space-y-3">
                      {referral.clientInfo?.email && (
                        <p className="flex items-center gap-2 text-gray-700">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {referral.clientInfo.email}
                        </p>
                      )}
                      {referral.clientInfo?.phone && (
                        <p className="flex items-center gap-2 text-gray-700">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {referral.clientInfo.phone}
                        </p>
                      )}
                      {referral.clientInfo?.address && (
                        <p className="flex items-center gap-2 text-gray-700">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {typeof referral.clientInfo.address === 'string'
                            ? referral.clientInfo.address
                            : [
                                referral.clientInfo.address.street,
                                referral.clientInfo.address.city,
                                referral.clientInfo.address.state,
                                referral.clientInfo.address.zipCode
                              ].filter(Boolean).join(', ')}
                        </p>
                      )}
                      
                      <div className="pt-3 mt-3 border-t border-gray-100">
                        <Button 
                          className="w-full rounded-full" 
                          variant="outline"
                          asChild
                        >
                          <Link href={`/case-manager/clients/${referral.clientInfo?._id}`}>
                            <UserCircle className="h-4 w-4 mr-2" />
                            View Full Client Profile
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            {/* Client Details Tab */}
            <TabsContent value="details" className="animate-fade-in">
              <Card className="rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-4 pt-6">
                  <CardTitle className="text-xl font-semibold">Client Information</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-medium text-gray-500 mb-1">Basic Information</h3>
                        <div className="space-y-3 p-4 rounded-lg bg-gray-50/80">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Full Name</h4>
                            <p className="text-lg font-medium">{clientName}</p>
                          </div>
                          
                          {referral.clientInfo?.dateOfBirth && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Date of Birth</h4>
                              <p className="text-base">
                                {referral.clientInfo.dateOfBirth ? new Date(referral.clientInfo.dateOfBirth).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          )}
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Client ID</h4>
                            <p className="text-base font-mono">{clientId}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-base font-medium text-gray-500 mb-1">Contact Information</h3>
                        <div className="space-y-3 p-4 rounded-lg bg-gray-50/80">
                          {referral.clientInfo?.email && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Email</h4>
                              <p className="text-base">{referral.clientInfo.email}</p>
                            </div>
                          )}
                          
                          {referral.clientInfo?.phone && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Phone</h4>
                              <p className="text-base">{referral.clientInfo.phone}</p>
                            </div>
                          )}
                          
                          {referral.clientInfo?.preferredContactMethod && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Preferred Contact Method</h4>
                              <p className="text-base">{referral.clientInfo.preferredContactMethod}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-medium text-gray-500 mb-1">Address Information</h3>
                        <div className="space-y-3 p-4 rounded-lg bg-gray-50/80">
                          {referral.clientInfo?.address && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Address</h4>
                              <p className="text-base">
                                {typeof referral.clientInfo.address === 'string'
                                  ? referral.clientInfo.address
                                  : [
                                      referral.clientInfo.address.street,
                                      referral.clientInfo.address.city,
                                      referral.clientInfo.address.state,
                                      referral.clientInfo.address.zipCode
                                    ].filter(Boolean).join(', ')}
                              </p>
                            </div>
                          )}
                          
                          {referral.clientInfo?.county && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">County</h4>
                              <p className="text-base">{referral.clientInfo.county}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {referral.clientInfo?.insurance && (
                        <div>
                          <h3 className="text-base font-medium text-gray-500 mb-1">Insurance Information</h3>
                          <div className="space-y-3 p-4 rounded-lg bg-gray-50/80">
                            {referral.clientInfo.insurance.type && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Insurance Type</h4>
                                <p className="text-base">{referral.clientInfo.insurance.type}</p>
                              </div>
                            )}
                            
                            {referral.clientInfo.insurance.provider && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Provider</h4>
                                <p className="text-base">{referral.clientInfo.insurance.provider}</p>
                              </div>
                            )}
                            
                            {referral.clientInfo.insurance.number && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Policy Number</h4>
                                <p className="text-base font-mono">{referral.clientInfo.insurance.number}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Tasks Tab */}
            <TabsContent value="tasks" className="animate-fade-in">
              <Card className="rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-4 pt-6">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                    Tasks & Follow-ups
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-6">
                  <ReferralTasks referralId={referralId as string} />
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Comments Tab */}
            <TabsContent value="comments" className="animate-fade-in">
              <Card className="rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-4 pt-6">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    Comments & Updates
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-6">
                  <ReferralComments referralId={referralId as string} />
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Timeline Tab */}
            <TabsContent value="timeline" className="animate-fade-in">
              <Card className="rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-4 pt-6">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-6">
                  <div className="space-y-6">
                    {Array.isArray(referral.timeline) && referral.timeline.length > 0 ? (
                      referral.timeline.map((event: any, index: number) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-50"></div>
                            {index < referral.timeline.length - 1 && (
                              <div className="w-0.5 bg-blue-200 h-full mt-1"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-6">
                            <p className="font-medium text-lg text-gray-900">{event.status}</p>
                            <p className="text-base text-gray-600 mt-1">{event.description}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(event.date).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Clock className="h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-700">No timeline events yet</h3>
                        <p className="text-gray-500 max-w-md mt-1">
                          Timeline events will appear here as the referral progresses through different stages
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Cancel Dialog */}
          <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  Cancel Referral
                </DialogTitle>
                <DialogDescription className="text-base">
                  Are you sure you want to cancel this referral? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <label className="text-sm font-medium mb-2 block">
                  Please provide a reason for cancellation
                </label>
                <Textarea
                  className="mt-1 resize-none rounded-xl border-gray-200 focus:border-red-300 focus:ring-red-200"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter cancellation reason..."
                  rows={4}
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCancelDialog(false)}
                  className="rounded-xl border-gray-200"
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleCancelReferral}
                  className="rounded-xl"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Confirm Cancellation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Chat Modal */}
          <Dialog open={showChat} onOpenChange={setShowChat}>
            <DialogContent className="sm:max-w-lg rounded-2xl p-0 overflow-hidden">
              <DialogHeader className="px-6 pt-6 pb-4">
                <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  Message Provider
                </DialogTitle>
                <DialogDescription className="text-base">
                  Messages are private and secure between you and the provider.
                </DialogDescription>
              </DialogHeader>
              
              <div className="px-6 pb-6">
                <div className="h-64 overflow-y-auto bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                  {chatLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
                    </div>
                  ) : chatError ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                      <p className="text-red-600">{chatError}</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
                      <p className="text-gray-600 font-medium">No messages yet</p>
                      <p className="text-gray-500 text-sm max-w-xs">
                        Send a message to start the conversation with the provider
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg, idx) => (
                        <div key={msg._id || idx} className={msg.fromUserId === user?.id ? 'text-right' : 'text-left'}>
                          <div className={cn(
                            "inline-block max-w-[80%] px-4 py-2 rounded-xl mb-1 text-left",
                            msg.fromUserId === user?.id 
                              ? "bg-blue-600 text-white rounded-tr-none" 
                              : "bg-gray-200 text-gray-800 rounded-tl-none"
                          )}>
                            {msg.content}
                          </div>
                          <div className="text-xs text-gray-500">
                            {msg.createdAt && new Date(msg.createdAt).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Textarea
                    className="flex-1 rounded-xl resize-none min-h-[80px] border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                    placeholder="Type your message..."
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    rows={3}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!messageInput.trim()}
                    className="h-auto self-end rounded-xl aspect-square p-3"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
} 