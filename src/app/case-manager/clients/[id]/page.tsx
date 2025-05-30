"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Copy, 
  Users, 
  Mail, 
  Phone, 
  Building,
  MapPin,
  Calendar,
  ClipboardList,
  User,
  ChevronLeft,
  Home,
  MessageSquare,
  Clock,
  FileText,
  AlertCircle,
  Shield,
  PlusCircle,
  Settings2,
  CheckCircle,
  Star,
  Edit,
  Info
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { formatSafeDate } from '@/lib/date-utils';
import Link from "next/link";
import { ClientTasks } from '@/components/referrals/ClientTasks';
import { ClientComments } from '@/components/referrals/ClientComments';
import { ClientStatusSelector } from '@/components/clients/ClientStatusSelector';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Client, ClientStatus, RelationshipEvent } from '@/types';
import { useClientReferrals } from '@/hooks/use-client-referrals';
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export default function ClientDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showId, setShowId] = useState(false);
  const [copied, setCopied] = useState(false);
  const { referrals: activeReferrals, loading: referralsLoading, refreshReferrals: refreshActiveReferrals } = useClientReferrals(id as string, 'active');
  const { referrals: completedReferrals, loading: completedLoading } = useClientReferrals(id as string, 'completed');
  const { referrals: allReferrals, loading: allReferralsLoading, refreshReferrals: refreshAllReferrals } = useClientReferrals(id as string, 'all');
  const [relationshipEvents, setRelationshipEvents] = useState<RelationshipEvent[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchClient() {
      setLoading(true);
      try {
        if (!id) throw new Error("Missing client ID");
        
        const res = await fetch(`/api/clients?id=${id}`);
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to fetch client");
        }
        
        const data = await res.json();
        if (!data.client) {
          throw new Error("Client not found");
        }
        
        setClient(data.client);
      } catch (err: any) {
        console.error("Error fetching client:", err);
        setError(err.message || "Failed to load client");
      } finally {
        setLoading(false);
      }
    }
    
    if (id) fetchClient();
  }, [id]);

  useEffect(() => {
    // Fetch relationship timeline events from the API
    async function fetchRelationshipEvents() {
      if (!id) return;
      
      try {
        const res = await fetch(`/api/clients/events?clientId=${id}`);
        if (!res.ok) throw new Error("Failed to fetch relationship events");
        const data = await res.json();
        setRelationshipEvents(data.events || []);
      } catch (err) {
        console.error("Error fetching relationship events:", err);
        // Set empty array instead of using mock data
        setRelationshipEvents([]);
      }
    }
    
    fetchRelationshipEvents();
  }, [id]);
  
  // Log active referrals to debug
  useEffect(() => {
    if (!referralsLoading) {
      console.log("Active referrals:", activeReferrals);
    }
  }, [activeReferrals, referralsLoading]);

  // Function to force refresh referrals data
  const refreshReferrals = async () => {
    try {
      toast({
        title: "Refreshing referrals data...",
        description: "Attempting to load the latest referrals for this client.",
      });
      
      // Refresh all types of referrals
      await refreshActiveReferrals();
      await refreshAllReferrals();
      
      toast({
        title: "Referrals refreshed",
        description: "Successfully loaded the latest referrals for this client.",
      });
    } catch (error) {
      console.error('Error refreshing referrals:', error);
      toast({
        title: "Refresh failed",
        description: "Could not refresh referrals data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCopyId = () => {
    if (client?._id) {
      navigator.clipboard.writeText(client._id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleStatusChange = (newStatus: ClientStatus) => {
    if (client) {
      setClient({
        ...client,
        status: newStatus
      });
    }
  };

  // Helper function to count pending tasks
  const countPendingTasks = () => {
    // If we have task data, use it, otherwise return 0
    return client?.tasks?.filter(task => !task.completed)?.length || 0;
  };

  const clientName = client ? `${client.firstName || ''} ${client.lastName || ''}`.trim() : '';
  const clientInitials = client ? 
    `${client.firstName?.charAt(0) || ''}${client.lastName?.charAt(0) || ''}`.trim().toUpperCase() : 
    'CL';

  if (loading) return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-500"></div>
    </div>
  );

  if (error || !client) return (
    <div className="min-h-screen flex flex-col justify-center items-center gap-4">
      <AlertCircle className="h-16 w-16 text-red-500" />
      <h3 className="text-xl font-semibold text-gray-900">Error Loading Client</h3>
      <p className="text-gray-600">{error || 'Client not found.'}</p>
      <Button asChild>
        <Link href="/case-manager/clients">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Link>
      </Button>
    </div>
  );

  function renderTruncatedId(id: string) {
    if (!id) return null;
    return `${id.slice(0, 4)}...${id.slice(-4)}`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button 
              variant="ghost" 
              asChild
              className="gap-1"
            >
              <Link href="/case-manager/clients">
                <ChevronLeft className="h-4 w-4" />
                Back to Clients
              </Link>
            </Button>
            
            <EnhancedButton 
              variant="gradient" 
              asChild
              rounded="default"
              className="shadow-sm"
            >
              <Link href={`/case-manager/new-referral?clientId=${id}`}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Referral
              </Link>
            </EnhancedButton>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Client Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 rounded-full border-4 border-white shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium text-xl">
                <AvatarFallback>{clientInitials}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{clientName}</h1>
                <div className="flex items-center gap-6 mt-2 text-sm text-gray-600">
                  {client.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {client.email}
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {client.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 items-center">
              <ClientStatusSelector
                clientId={client._id}
                initialStatus={client.status || 'UNPLACED_NEW'}
                onStatusChange={handleStatusChange}
                className="min-w-[180px] bg-white shadow-sm"
              />
              
              <Button 
                variant="outline" 
                asChild
                className="gap-1"
              >
                <Link href={`/case-manager/clients/${id}/edit`}>
                  <Edit className="h-4 w-4" />
                  Edit Client
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Client ID:</span>
            <code className="bg-gray-100 px-2 py-1 rounded text-gray-800 font-mono">
              {showId ? client._id : renderTruncatedId(client._id)}
            </code>
            <Button variant="ghost" size="icon" onClick={() => setShowId((v) => !v)} className="h-7 w-7 rounded-full">
              {showId ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCopyId} className="h-7 w-7 rounded-full">
              <Copy className="h-3.5 w-3.5" />
            </Button>
            {copied && <span className="text-green-600 text-xs">Copied!</span>}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: Client Information */}
          <div className="lg:col-span-1 space-y-6">
            {/* Client Information Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-500" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                      <Info className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                      Basic Information
                    </h3>
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-4 text-sm">
                      <div>
                        <dt className="text-gray-500">Full Name</dt>
                        <dd className="font-medium text-gray-900 mt-1">{clientName}</dd>
                      </div>
                      
                      {client.dateOfBirth && (
                        <div>
                          <dt className="text-gray-500">Date of Birth</dt>
                          <dd className="font-medium text-gray-900 mt-1">
                            {typeof client.dateOfBirth === 'string' 
                              ? new Date(client.dateOfBirth).toLocaleDateString() 
                              : 'N/A'}
                          </dd>
                        </div>
                      )}
                      
                      {client.preferredContactMethod && (
                        <div>
                          <dt className="text-gray-500">Preferred Contact</dt>
                          <dd className="font-medium text-gray-900 mt-1">{client.preferredContactMethod}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  
                  <Separator />
                  
                  {/* Contact Information */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                      <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                      Contact Information
                    </h3>
                    <dl className="grid grid-cols-1 gap-y-4 text-sm">
                      {client.email && (
                        <div>
                          <dt className="text-gray-500">Email</dt>
                          <dd className="font-medium text-gray-900 mt-1">{client.email}</dd>
                        </div>
                      )}
                      
                      {client.phone && (
                        <div>
                          <dt className="text-gray-500">Phone</dt>
                          <dd className="font-medium text-gray-900 mt-1">{client.phone}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  
                  <Separator />
                  
                  {/* Address Information */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                      Address Information
                    </h3>
                    <dl className="grid grid-cols-1 gap-y-4 text-sm">
                      {client.address && (
                        <div>
                          <dt className="text-gray-500">Street Address</dt>
                          <dd className="font-medium text-gray-900 mt-1">
                            {typeof client.address === 'string'
                              ? client.address
                              : client.address.street || 'N/A'}
                          </dd>
                        </div>
                      )}
                      
                      {client.city && client.state && (
                        <div>
                          <dt className="text-gray-500">City, State, ZIP</dt>
                          <dd className="font-medium text-gray-900 mt-1">
                            {client.city}, {client.state} {client.zipCode}
                          </dd>
                        </div>
                      )}
                      
                      {client.county && (
                        <div>
                          <dt className="text-gray-500">County</dt>
                          <dd className="font-medium text-gray-900 mt-1">{client.county}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  
                  {client.insurance && (
                    <>
                      <Separator />
                      
                      {/* Insurance Information */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                          <Shield className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                          Insurance Information
                        </h3>
                        <dl className="grid grid-cols-2 gap-x-3 gap-y-4 text-sm">
                          {client.insurance.type && (
                            <div>
                              <dt className="text-gray-500">Type</dt>
                              <dd className="font-medium text-gray-900 mt-1">{client.insurance.type}</dd>
                            </div>
                          )}
                          
                          {client.insurance.provider && (
                            <div>
                              <dt className="text-gray-500">Provider</dt>
                              <dd className="font-medium text-gray-900 mt-1">{client.insurance.provider}</dd>
                            </div>
                          )}
                          
                          {client.insurance.number && (
                            <div>
                              <dt className="text-gray-500">Policy Number</dt>
                              <dd className="font-medium text-gray-900 font-mono mt-1">{client.insurance.number}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </>
                  )}
                  
                  <Separator />
                  
                  {/* Account Information */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                      Account Information
                    </h3>
                    <dl className="grid grid-cols-1 gap-y-4 text-sm">
                      <div>
                        <dt className="text-gray-500">Client Created</dt>
                        <dd className="font-medium text-gray-900 mt-1">
                          {client.createdAt 
                            ? formatSafeDate(client.createdAt, 'MMMM d, yyyy') 
                            : 'Unknown date'}
                        </dd>
                      </div>
                      
                      {client.source === 'created_from_referral' && client.referralDate && (
                        <div>
                          <dt className="text-gray-500">Original Referral Date</dt>
                          <dd className="font-medium text-gray-900 mt-1">
                            {formatSafeDate(client.referralDate, 'MMMM d, yyyy')}
                          </dd>
                        </div>
                      )}
                      
                      {client.source && (
                        <div>
                          <dt className="text-gray-500">Source</dt>
                          <dd className="font-medium text-gray-900 mt-1">
                            {client.source === 'created_from_referral' ? 'Created from referral' : 
                             client.source === 'migration_from_referral' ? 'Migrated from referral' : 
                             client.source}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right column: Referrals, Tasks, Notes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Referrals - Unified section for all referrals */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-500" />
                  Client Referrals
                </CardTitle>
                <CardDescription className="flex items-center justify-between">
                  <span>
                    {allReferrals.length === 0 
                      ? 'This client does not have any referrals' 
                      : `${allReferrals.length} referral${allReferrals.length > 1 ? 's' : ''}`}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={refreshReferrals}
                    className="h-8 text-xs text-blue-600"
                  >
                    Refresh Referrals
                  </Button>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {allReferrals.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <ClipboardList className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <h3 className="text-gray-800 font-medium text-lg mb-2">No Referrals</h3>
                    <p className="text-gray-600 mb-4">
                      Create a new referral to connect this client with a service provider.
                    </p>
                    <EnhancedButton 
                      variant="gradient" 
                      asChild
                      rounded="default"
                      className="mx-auto"
                    >
                      <Link href={`/case-manager/new-referral?clientId=${id}`}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create First Referral
                      </Link>
                    </EnhancedButton>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Active Referrals Group */}
                    {activeReferrals.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                          Active ({activeReferrals.length})
                        </h3>
                        <div className="space-y-4">
                          {activeReferrals.map((referral) => (
                            <div 
                              key={referral._id} 
                              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                            >
                              <div className="p-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-medium text-gray-900">{referral.serviceDetails?.type || 'Service'}</h3>
                                      <Badge 
                                        className={cn(
                                          "rounded-full text-xs font-medium",
                                          referral.status === 'pending' && "bg-amber-100 text-amber-800 border-amber-200",
                                          referral.status === 'accepted' && "bg-green-100 text-green-800 border-green-200",
                                          referral.status === 'in_progress' && "bg-blue-100 text-blue-800 border-blue-200"
                                        )}
                                      >
                                        {referral.status === 'pending' && "Pending"}
                                        {referral.status === 'accepted' && "Accepted"}
                                        {referral.status === 'in_progress' && "In Progress"}
                                        {!referral.status && "Active"}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                      Provider: {referral.providerName || 'Pending Assignment'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Created: {formatSafeDate(referral.createdAt, 'MMM d, yyyy')}
                                    </p>
                                  </div>
                                  <div className="flex gap-2 self-end">
                                    <Button size="sm" variant="outline" asChild className="text-sm rounded">
                                      <Link href={`/case-manager/referrals/${referral._id}`}>
                                        View Details
                                      </Link>
                                    </Button>
                                    <Button size="sm" variant="outline" asChild className="text-sm rounded">
                                      <Link href={`/case-manager/referrals/${referral._id}/workspace`}>
                                        Workspace
                                      </Link>
                                    </Button>
                                  </div>
                                </div>
                                
                                {/* Progress Indicator */}
                                {referral.status !== 'pending' && (
                                  <div className="mt-4">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                      <span>Progress</span>
                                      <span>{referral.progressPercentage || 50}%</span>
                                    </div>
                                    <Progress value={referral.progressPercentage || 50} className="h-2" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Other Referrals Group */}
                    {allReferrals.filter(r => 
                      !['accepted', 'in_progress', 'active', 'pending', 'completed'].includes(r.status)
                    ).length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                          <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                          Other Status ({allReferrals.filter(r => 
                            !['accepted', 'in_progress', 'active', 'pending', 'completed'].includes(r.status)
                          ).length})
                        </h3>
                        <div className="space-y-3">
                          {allReferrals
                            .filter(r => !['accepted', 'in_progress', 'active', 'pending', 'completed'].includes(r.status))
                            .map((referral) => (
                              <div 
                                key={referral._id} 
                                className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col md:flex-row justify-between md:items-center gap-3"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium text-gray-900">{referral.serviceDetails?.type || 'Service'}</h3>
                                    <Badge className="bg-gray-100 text-gray-800 border-gray-200 rounded-full text-xs">
                                      {referral.status || 'Unknown Status'}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    Provider: {referral.providerName || 'Not Assigned'}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Created: {formatSafeDate(referral.createdAt, 'MMM d, yyyy')}
                                  </p>
                                </div>
                                <div className="flex gap-2 self-end">
                                  <Button size="sm" variant="outline" asChild className="text-sm rounded">
                                    <Link href={`/case-manager/referrals/${referral._id}`}>
                                      View Details
                                    </Link>
                                  </Button>
                                  <Button size="sm" variant="outline" asChild className="text-sm rounded">
                                    <Link href={`/case-manager/referrals/${referral._id}/workspace`}>
                                      Workspace
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    )}

                    {/* Completed Referrals Group */}
                    {completedReferrals.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                          <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                          Completed ({completedReferrals.length})
                        </h3>
                        <div className="space-y-3">
                          {completedReferrals.map((referral) => (
                            <div 
                              key={referral._id} 
                              className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col md:flex-row justify-between md:items-center gap-3"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-gray-900">{referral.serviceDetails?.type || 'Service'}</h3>
                                  <Badge className="bg-green-100 text-green-800 border-green-200 rounded-full text-xs">
                                    Completed
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">
                                  Provider: {referral.providerName || 'Unknown'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Completed: {referral.updatedAt ? formatSafeDate(referral.updatedAt, 'MMM d, yyyy') : 'Unknown'}
                                </p>
                              </div>
                              <Button size="sm" variant="outline" asChild className="text-sm rounded self-start md:self-center">
                                <Link href={`/case-manager/referrals/${referral._id}`}>
                                  View Details
                                </Link>
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add referral button at the bottom */}
                    <div className="flex justify-center mt-6">
                      <EnhancedButton 
                        variant="gradient" 
                        asChild
                        rounded="default"
                        className="shadow-sm"
                      >
                        <Link href={`/case-manager/new-referral?clientId=${id}`}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create New Referral
                        </Link>
                      </EnhancedButton>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Client Tasks */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                  Client Tasks
                  {countPendingTasks() > 0 && (
                    <Badge className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
                      {countPendingTasks()} pending
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Manage tasks related to this client
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {client && <ClientTasks clientId={client._id} />}
              </CardContent>
            </Card>
            
            {/* Client Notes */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  Client Notes
                </CardTitle>
                <CardDescription>
                  Notes and updates about this client
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {client && <ClientComments clientId={client._id} />}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 