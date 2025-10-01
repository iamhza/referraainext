'use client';

import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

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
  Info,
  Loader2,
  Activity,
  Star,
  Shield
} from 'lucide-react';
import { formatSafeDate } from '@/lib/date-utils';
import { ReferralStatus, getStatusConfig } from '@/types/index';

export default function ProviderReferralDetails() {
  const params = useParams();
  // Defensive extraction of referralId
  const referralId = typeof params?.id === 'string'
    ? params.id
    : Array.isArray(params?.id)
      ? params.id[0]
      : undefined;

  // All hooks at the top
  const [referral, setReferral] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

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

  // Using centralized status config - no local function needed

  // Determine if messaging is allowed  
  const canMessage = status === 'confirmed' || status === 'in_progress' || status === 'active' || status === 'accepted';

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
    if (!messageInput.trim() || !user || !referral?.caseManagerId || !referralId) return;
    try {
      const toUserId = referral.caseManagerId;
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
        <Link href="/provider/referrals">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Referrals
        </Link>
      </Button>
    </div>
  );

  const statusConfig = getStatusConfig(status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50/20">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="animate-fade-in">
          {/* Header with Back Button and Basic Info */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">
                Referral Details
              </h1>
            </div>
            
            <div className="text-md text-gray-500 mt-1">
              Referral ID: {referralId}
            </div>
          </div>
          
          {/* Navigation and Action Buttons */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                asChild
                className="rounded-full border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group"
              >
                <Link href="/provider/referrals">
                  <ChevronLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                  Back to Referrals
                </Link>
              </Button>
              
              <div className="h-4 w-px bg-gray-300"></div>
              
              <Badge 
                className={cn(
                  "px-3 py-1 text-sm font-medium flex items-center gap-1.5 rounded-full",
                  statusConfig.color === 'amber' && "bg-amber-100 text-amber-800 border-amber-200",
                  statusConfig.color === 'green' && "bg-green-100 text-green-800 border-green-200",
                  statusConfig.color === 'blue' && "bg-blue-100 text-blue-800 border-blue-200",
                  statusConfig.color === 'red' && "bg-red-100 text-red-800 border-red-200"
                )}
              >
                <statusConfig.icon className="h-3.5 w-3.5" />
                {statusConfig.label}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 sm:ml-auto">
              {canMessage && (
                <EnhancedButton 
                  variant="gradient" 
                  rounded="full"
                  onClick={() => setShowChat(true)}
                  className="shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Message Case Manager
                </EnhancedButton>
              )}
              
              <EnhancedButton 
                variant="gradient" 
                rounded="full"
                asChild
                className="shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Link href={`/provider/referrals/${referralId}/workspace`}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Open Workspace
                </Link>
              </EnhancedButton>
            </div>
          </div>
          
          {/* Workspace Access Banner */}
          <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-blue-900">Collaborate with the Case Manager</h3>
                <p className="text-blue-800 mt-1 mb-3">
                  Send updates, ask questions, and coordinate care through the unified workspace.
                </p>
                <div className="flex gap-2">
                  <Button variant="default" size="sm" asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Link href={`/provider/referrals/${referralId}/workspace`}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Open Workspace
                    </Link>
                  </Button>
                </div>
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

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Primary Information */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Service & Status Overview */}
              <Card className="rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-4 pt-6">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-500" />
                    Service Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-100">
                        <h4 className="text-sm font-medium text-blue-700 mb-2">Service Requested</h4>
                        <p className="text-lg font-semibold text-blue-900">{serviceType}</p>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-gray-50/80">
                        <h4 className="text-sm font-medium text-gray-600 mb-2">Priority Level</h4>
                        <div className="flex items-center gap-2">
                          {referral?.serviceDetails?.urgency === 'high' && (
                            <>
                              <span className="w-3 h-3 rounded-full bg-red-500"></span>
                              <span className="font-medium text-red-700">High Priority</span>
                            </>
                          )}
                          {referral?.serviceDetails?.urgency === 'medium' && (
                            <>
                              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                              <span className="font-medium text-amber-700">Medium Priority</span>
                            </>
                          )}
                          {referral?.serviceDetails?.urgency === 'low' && (
                            <>
                              <span className="w-3 h-3 rounded-full bg-green-500"></span>
                              <span className="font-medium text-green-700">Low Priority</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-gray-50/80">
                        <h4 className="text-sm font-medium text-gray-600 mb-2">Current Status</h4>
                        <div className="flex items-center gap-2">
                          <statusConfig.icon className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{statusConfig.label}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{statusConfig.description}</p>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-gray-50/80">
                        <h4 className="text-sm font-medium text-gray-600 mb-2">Submitted</h4>
                        <p className="font-medium">{submittedDate ? formatSafeDate(submittedDate) : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {referral?.serviceDetails?.counties && referral.serviceDetails.counties.length > 0 && (
                    <div className="mt-6 p-4 rounded-lg bg-gray-50/80">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">Service Areas</h4>
                      <div className="flex flex-wrap gap-2">
                        {referral.serviceDetails.counties.map((county: string, idx: number) => (
                          <Badge 
                            key={idx} 
                            variant="outline" 
                            className="bg-blue-50 text-blue-700 border-blue-200 rounded-full"
                          >
                            <MapPin className="h-3 w-3 mr-1" />
                            {county}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {notes && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">Additional Notes</h4>
                      <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-100">
                        <p className="text-blue-900 whitespace-pre-wrap">{notes}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Case Manager Information */}
              {referral?.caseManager && (
                <Card className="rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300">
                  <CardHeader className="pb-4 pt-6">
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <Shield className="h-5 w-5 text-purple-500" />
                      Case Manager
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 pb-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                        {referral.caseManager.name ? referral.caseManager.name.charAt(0) : 'CM'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{referral.caseManager.name || 'Case Manager'}</h3>
                        <p className="text-gray-600">{referral.caseManager.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-purple-50/50 border border-purple-100">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-purple-600" />
                        <span className="text-purple-800">{referral.caseManager.email}</span>
                      </div>
                      {referral.caseManager.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-purple-600" />
                          <span className="text-purple-800">{referral.caseManager.phone}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

            </div>
            
            {/* Right Column - Supporting Information */}
            <div className="space-y-6">
              {/* What's Next */}
              <Card className="rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-4 pt-6">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                    What's Next?
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-6">
                  <div className="space-y-3">
                    {status === 'under_review' && (
                      <>
                        <div className="flex gap-3 items-start">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                          <div>
                            <p className="font-medium text-gray-900">Review in Progress</p>
                            <p className="text-sm text-gray-600">Case manager is reviewing the referral</p>
                          </div>
                        </div>
                        <div className="flex gap-3 items-start">
                          <div className="w-2 h-2 rounded-full bg-gray-300 mt-2 flex-shrink-0"></div>
                          <div>
                            <p className="font-medium text-gray-700">Provider Assignment</p>
                            <p className="text-sm text-gray-600">You'll be notified when assigned</p>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {status === 'provider_selection_required' && (
                      <>
                        <div className="flex gap-3 items-start">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                          <div>
                            <p className="font-medium text-gray-900">Provider Selection</p>
                            <p className="text-sm text-gray-600">Case manager is selecting providers</p>
                          </div>
                        </div>
                        <div className="flex gap-3 items-start">
                          <div className="w-2 h-2 rounded-full bg-gray-300 mt-2 flex-shrink-0"></div>
                          <div>
                            <p className="font-medium text-gray-700">Assignment Notification</p>
                            <p className="text-sm text-gray-600">You'll be notified if selected</p>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {status === 'matched' && (
                      <>
                        <div className="flex gap-3 items-start">
                          <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                          <div>
                            <p className="font-medium text-gray-900">Admin Assignment</p>
                            <p className="text-sm text-gray-600">Admin has assigned you to this referral</p>
                          </div>
                        </div>
                        <div className="flex gap-3 items-start">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                          <div>
                            <p className="font-medium text-gray-900">Waiting for Confirmation</p>
                            <p className="text-sm text-gray-600">Case manager needs to confirm the match</p>
                          </div>
                        </div>
                        <div className="flex gap-3 items-start">
                          <div className="w-2 h-2 rounded-full bg-gray-300 mt-2 flex-shrink-0"></div>
                          <div>
                            <p className="font-medium text-gray-700">Service Begins</p>
                            <p className="text-sm text-gray-600">You'll get access once confirmed</p>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {status === 'confirmed' && (
                      <>
                        <div className="flex gap-3 items-start">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                          <div>
                            <p className="font-medium text-gray-900">Match Confirmed</p>
                            <p className="text-sm text-gray-600">Case manager has confirmed the match</p>
                          </div>
                        </div>
                        <div className="flex gap-3 items-start">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                          <div>
                            <p className="font-medium text-gray-900">Ready to Begin</p>
                            <p className="text-sm text-gray-600">You can now start providing service</p>
                          </div>
                        </div>
                        <div className="flex gap-3 items-start">
                          <div className="w-2 h-2 rounded-full bg-gray-300 mt-2 flex-shrink-0"></div>
                          <div>
                            <p className="font-medium text-gray-700">Communication</p>
                            <p className="text-sm text-gray-600">Use workspace to communicate with Case Manager</p>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {(status === 'in_progress' || status === 'active') && (
                      <>
                        <div className="flex gap-3 items-start">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                          <div>
                            <p className="font-medium text-gray-900">Service Active</p>
                            <p className="text-sm text-gray-600">Provide service and stay in touch</p>
                          </div>
                        </div>
                        <div className="flex gap-3 items-start">
                          <div className="w-2 h-2 rounded-full bg-gray-300 mt-2 flex-shrink-0"></div>
                          <div>
                            <p className="font-medium text-gray-700">Service Completion</p>
                            <p className="text-sm text-gray-600">Update when service is finished</p>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {status === 'completed' && (
                      <div className="flex gap-3 items-start">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="font-medium text-green-900">Service Completed</p>
                          <p className="text-sm text-green-700">Referral has been successfully completed</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Client Summary */}
              <Card className="rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-4 pt-6">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-500" />
                    Client Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white font-medium text-lg">
                      <AvatarFallback>{clientInitials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{clientName}</h3>
                      <p className="text-sm text-gray-600">ID: {clientId.substring(0, 8)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {referral.clientInfo?.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{referral.clientInfo.email}</span>
                      </div>
                    )}
                    {referral.clientInfo?.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{referral.clientInfo.phone}</span>
                      </div>
                    )}
                    {referral.clientInfo?.address && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">
                          {typeof referral.clientInfo.address === 'string'
                            ? referral.clientInfo.address
                            : [
                                referral.clientInfo.address.city,
                                referral.clientInfo.address.state
                              ].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Quick Actions */}
              <Card className="rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-4 pt-6">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-6 space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start rounded-full"
                    asChild
                  >
                    <Link href={`/provider/referrals/${referralId}/workspace`}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Open Workspace
                    </Link>
                  </Button>
                  
                  {canMessage && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start rounded-full"
                      onClick={() => setShowChat(true)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message Case Manager
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start rounded-full"
                    asChild
                  >
                    <Link href={`/provider/clients/${referral.clientInfo?._id}`}>
                      <User className="h-4 w-4 mr-2" />
                      View Client Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Chat Modal */}
          <Dialog open={showChat} onOpenChange={setShowChat}>
            <DialogContent className="sm:max-w-lg rounded-2xl p-0 overflow-hidden">
              <DialogHeader className="px-6 pt-6 pb-4">
                <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  Message Case Manager
                </DialogTitle>
                <DialogDescription className="text-base">
                  Messages are private and secure between you and the Case Manager.
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
                        Send a message to start the conversation with the Case Manager
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