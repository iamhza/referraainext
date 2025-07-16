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
  Clock,
  MessageSquare,
  AlertCircle,
  Shield,
  PlusCircle,
  Settings2,
  Star,
  Edit,
  Info,
  Send
} from "lucide-react";

import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { formatSafeDate } from '@/lib/date-utils';
import Link from "next/link";

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



  const clientName = client ? `${client.firstName || ''} ${client.lastName || ''}`.trim() : '';
  const clientInitials = client ? 
    `${client.firstName?.charAt(0) || ''}${client.lastName?.charAt(0) || ''}`.trim().toUpperCase() : 
    'CL';

  // Helper function to render truncated ID
  const renderTruncatedId = (id: string) => {
    if (!id) return null;
    return `${id.slice(0, 4)}...${id.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-500"></div>
      </div>
    );
  }

  if (error || !client) {
    return (
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
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Top Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-sm">
              <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                <Link href="/case-manager">
                  <Home className="h-4 w-4 mr-1" />
                  Dashboard
                </Link>
              </Button>
              <span className="text-gray-400">/</span>
              <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                <Link href="/case-manager/clients">
                  <Users className="h-4 w-4 mr-1" />
                  Clients
                </Link>
              </Button>
              <span className="text-gray-400">/</span>
              <span className="font-medium text-gray-900">{clientName}</span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                asChild
                className="border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
              >
                <Link href={`/case-manager/clients/${id}/edit`}>
                  <Edit className="h-4 w-4 mr-2 text-gray-600" />
                  Edit Client
                </Link>
              </Button>
              <Button 
                size="sm"
                asChild
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200 font-medium"
              >
                <Link href={`/case-manager/new-referral?clientId=${id}`}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Referral
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Client Header */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24 rounded-2xl border-4 border-white shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-2xl">
                    <AvatarFallback>{clientInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">{clientName}</h1>
                    <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-600">
                      {client.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-green-500" />
                          <span className="font-medium">{client.phone}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Client ID with enhanced styling */}
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-sm font-medium text-gray-600">Client ID:</span>
                      <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1 border">
                        <code className="text-gray-800 font-mono text-sm">
                          {showId ? client._id : renderTruncatedId(client._id)}
                        </code>
                        <Button variant="ghost" size="icon" onClick={() => setShowId((v) => !v)} className="h-6 w-6">
                          {showId ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleCopyId} className="h-6 w-6">
                          <Copy className="h-3 w-3" />
                        </Button>
                        {copied && <span className="text-green-600 text-xs font-medium">Copied!</span>}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Status Selector */}
                <div className="flex flex-col items-end gap-3">
                  <ClientStatusSelector
                    clientId={client._id}
                    initialStatus={client.status || 'UNPLACED_NEW'}
                    onStatusChange={handleStatusChange}
                    className="min-w-[200px] bg-white shadow-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Client Information */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Information */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-blue-500" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-600 mb-1">Full Name</dt>
                    <dd className="text-sm text-gray-900 font-medium">{clientName}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-600 mb-1">Date of Birth</dt>
                    <dd className="text-sm text-gray-900 font-medium">
                      {client.dateOfBirth ? formatSafeDate(client.dateOfBirth) : 'Not provided'}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-600 mb-1">Preferred Contact</dt>
                    <dd className="text-sm text-gray-900 font-medium">
                      {client.preferredContactMethod || 'email'}
                    </dd>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="h-5 w-5 text-green-500" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  {client.email && (
                    <div>
                      <dt className="text-sm font-medium text-gray-600 mb-1">Email</dt>
                      <dd className="text-sm text-gray-900 font-medium">{client.email}</dd>
                    </div>
                  )}
                  
                  {client.phone && (
                    <div>
                      <dt className="text-sm font-medium text-gray-600 mb-1">Phone</dt>
                      <dd className="text-sm text-gray-900 font-medium">{client.phone}</dd>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-red-500" />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                                     {client.address && (
                     <div>
                       <dt className="text-sm font-medium text-gray-600 mb-1">Street Address</dt>
                       <dd className="text-sm text-gray-900 font-medium">
                         {typeof client.address === 'string' ? client.address : client.address.street || 'N/A'}
                       </dd>
                     </div>
                   )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    {client.city && (
                      <div>
                        <dt className="text-sm font-medium text-gray-600 mb-1">City</dt>
                        <dd className="text-sm text-gray-900 font-medium">{client.city}</dd>
                      </div>
                    )}
                    
                    {client.state && (
                      <div>
                        <dt className="text-sm font-medium text-gray-600 mb-1">State</dt>
                        <dd className="text-sm text-gray-900 font-medium">{client.state}</dd>
                      </div>
                    )}
                  </div>
                  
                  {client.zipCode && (
                    <div>
                      <dt className="text-sm font-medium text-gray-600 mb-1">ZIP Code</dt>
                      <dd className="text-sm text-gray-900 font-medium">{client.zipCode}</dd>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column: Referrals and Services */}
          <div className="lg:col-span-2 space-y-6">
            {/* All Referrals - Enhanced */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <ClipboardList className="h-6 w-6 text-blue-500" />
                      Referrals & Services
                    </CardTitle>
                    <CardDescription className="mt-1">
                      All referrals for this client, their status, and provider connections
                    </CardDescription>
                  </div>
                  {activeReferrals && activeReferrals.length > 0 && (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                      {activeReferrals.length} Active
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {referralsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-blue-500"></div>
                  </div>
                ) : activeReferrals && activeReferrals.length > 0 ? (
                  <div className="space-y-4">
                    {activeReferrals.map((referral, index) => (
                      <div key={referral._id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200 bg-white">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                              {referral.providerName ? referral.providerName.substring(0, 2).toUpperCase() : 'PR'}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 text-lg">
                                {referral.providerName || 'Provider Assignment Pending'}
                              </h4>
                              <p className="text-gray-600 font-medium">
                                {referral.serviceDetails?.type || 'Service Details Pending'}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                <Calendar className="h-4 w-4" />
                                <span>Created {formatSafeDate(referral.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <StatusBadge status={referral.status as ClientStatus} />
                        </div>
                        
                        {referral.serviceDetails?.description && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <p className="text-sm text-gray-700">
                              {referral.serviceDetails.description}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6 text-sm text-gray-500">
                            {referral.updatedAt && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>Updated {formatSafeDate(referral.updatedAt)}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-3">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              asChild
                              className="border-gray-300 hover:border-blue-400 hover:text-blue-600"
                            >
                              <Link href={`/case-manager/referrals/${referral._id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </Button>
                            
                            {referral.status === 'in_progress' && (
                              <Button 
                                size="sm" 
                                asChild
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Link href={`/case-manager/referrals/${referral._id}/thread`}>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Workspace
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Create New Referral Card */}
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200">
                      <PlusCircle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                      <h4 className="font-medium text-gray-900 mb-2">Add Another Referral</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Connect this client with additional services or providers
                      </p>
                      <Button 
                        size="sm"
                        asChild
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Link href={`/case-manager/new-referral?clientId=${id}`}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create New Referral
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ClipboardList className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Referrals Yet</h3>
                    <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                      This client doesn't have any referrals yet. Create their first referral to connect them with services.
                    </p>
                    <Button 
                      asChild
                      className="bg-blue-600 hover:bg-blue-700 px-6"
                    >
                      <Link href={`/case-manager/new-referral?clientId=${id}`}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create First Referral
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 