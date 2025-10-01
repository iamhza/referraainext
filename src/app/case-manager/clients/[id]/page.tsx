"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Copy, 
  Users, 
  Mail, 
  Phone, 
  Building,
  Building2,
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
  Send,
  Languages,
  Accessibility,
  Heart,
  FileText,
  CheckCircle,
  XCircle,
  Save,
  Loader2
} from "lucide-react";

import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { formatSafeDate, formatDateForInput } from '@/lib/date-utils';
import { formatWaiverType, formatWaiverTypeShort, WAIVER_TYPE_OPTIONS } from '@/lib/formatting';
import Link from "next/link";

import { ClientStatusSelector } from '@/components/clients/ClientStatusSelector';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Client, ClientStatus, RelationshipEvent } from '@/types';
import { useClientReferrals } from '@/hooks/use-client-referrals';
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function ClientDetailsPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showId, setShowId] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { referrals: activeReferrals, loading: referralsLoading, refreshReferrals: refreshActiveReferrals } = useClientReferrals(id as string, 'active');
  const { referrals: completedReferrals, loading: completedLoading } = useClientReferrals(id as string, 'completed');
  const { referrals: allReferrals, loading: allReferralsLoading, refreshReferrals: refreshAllReferrals } = useClientReferrals(id as string, 'all');
  const [relationshipEvents, setRelationshipEvents] = useState<RelationshipEvent[]>([]);
  const { toast } = useToast();

  // Form data for editing
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    sex: '' as 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | 'other' | '',
    email: '',
    phone: '',
    preferredContactMethod: 'email' as 'email' | 'phone' | 'both',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    insurance: '' as 'medicaid' | 'medicare' | 'private' | 'none' | '',
    insuranceProvider: '',
    insuranceNumber: '',
    pmiNumber: '',
    waiverType: '',
    primaryLanguage: 'English',
    needsTranslator: false,
    historyOfViolence: false,
    mobilityStatus: '' as 'ambulatory' | 'wheelchair-bound' | 'bed-bound' | 'other' | '',
    livingSituation: '' as 'alone' | 'with-family' | 'group-setting' | 'other' | '',
    primaryDiagnosis: '',
    culturalConsiderations: '',
    additionalNotes: '',
  });

  useEffect(() => {
    async function fetchClient() {
      setLoading(true);
      try {
        if (!id) throw new Error("Missing client ID");
        
        const res = await fetch(`/api/clients/${id}`);
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

  // Helper functions for displaying data
  const getSexLabel = (sex?: string) => {
    const sexLabels = {
      male: 'Male',
      female: 'Female',
      'non-binary': 'Non-binary',
      'prefer-not-to-say': 'Prefer not to say',
      other: 'Other'
    };
    return sexLabels[sex as keyof typeof sexLabels] || 'Not specified';
  };

  const getMobilityLabel = (status?: string) => {
    const mobilityLabels = {
      ambulatory: 'Ambulatory',
      'wheelchair-bound': 'Wheelchair-bound',
      'bed-bound': 'Bed-bound',
      other: 'Other'
    };
    return mobilityLabels[status as keyof typeof mobilityLabels] || 'Not specified';
  };

  const getLivingSituationLabel = (situation?: string) => {
    const situationLabels = {
      alone: 'Living Alone',
      'with-family': 'With Family',
      'group-setting': 'Group Setting',
      other: 'Other'
    };
    return situationLabels[situation as keyof typeof situationLabels] || 'Not specified';
  };

  const getInsuranceLabel = (type?: string) => {
    if (!type) return 'No insurance';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Initialize form data when client is loaded
  useEffect(() => {
    if (client) {
      setFormData({
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        dateOfBirth: formatDateForInput(client.dateOfBirth),
        sex: client.sex || '',
        email: client.email || '',
        phone: client.phone || '',
        preferredContactMethod: client.preferredContactMethod || 'email',
        address: typeof client.address === 'string' ? client.address : (client.address?.street || ''),
        city: client.city || '',
        state: client.state || '',
        zipCode: client.zipCode || '',
        insurance: (typeof client.insurance === 'string' ? client.insurance : client.insurance?.type) || '',
        insuranceProvider: client.insuranceProvider || '',
        insuranceNumber: client.insuranceNumber || '',
        pmiNumber: client.pmiNumber || '',
        waiverType: client.waiverType || '',
        primaryLanguage: client.primaryLanguage || 'English',
        needsTranslator: client.needsTranslator || false,
        historyOfViolence: client.historyOfViolence || false,
        mobilityStatus: client.mobilityStatus || '',
        livingSituation: client.livingSituation || '',
        primaryDiagnosis: client.primaryDiagnosis || '',
        culturalConsiderations: client.culturalConsiderations || '',
        additionalNotes: client.additionalNotes || '',
      });
    }
  }, [client]);

  // Handle form input changes
  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle save
  const handleSave = async () => {
    if (!id || !client) return;
    
    try {
      setSaving(true);
      
      const clientData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth || null,
        sex: formData.sex,
        email: formData.email,
        phone: formData.phone,
        preferredContactMethod: formData.preferredContactMethod,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        insuranceProvider: formData.insuranceProvider,
        insuranceNumber: formData.insuranceNumber,
        pmiNumber: formData.pmiNumber,
        waiverType: formData.waiverType,
        primaryLanguage: formData.primaryLanguage,
        needsTranslator: formData.needsTranslator,
        historyOfViolence: formData.historyOfViolence,
        mobilityStatus: formData.mobilityStatus,
        livingSituation: formData.livingSituation,
        primaryDiagnosis: formData.primaryDiagnosis,
        culturalConsiderations: formData.culturalConsiderations,
        additionalNotes: formData.additionalNotes,
      };
      
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update client");
      }
      
      const updatedClient = await res.json();
      setClient(updatedClient.client);
      setIsEditing(false);
      
      toast({
        title: "Success",
        description: "Client information updated successfully",
      });
    } catch (err: any) {
      console.error("Error updating client:", err);
      toast({
        title: "Error",
        description: err.message || "An error occurred while updating the client",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form data to original client data
    if (client) {
      setFormData({
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        dateOfBirth: formatDateForInput(client.dateOfBirth),
        sex: client.sex || '',
        email: client.email || '',
        phone: client.phone || '',
        preferredContactMethod: client.preferredContactMethod || 'email',
        address: typeof client.address === 'string' ? client.address : (client.address?.street || ''),
        city: client.city || '',
        state: client.state || '',
        zipCode: client.zipCode || '',
        insurance: (typeof client.insurance === 'string' ? client.insurance : client.insurance?.type) || '',
        insuranceProvider: client.insuranceProvider || '',
        insuranceNumber: client.insuranceNumber || '',
        pmiNumber: client.pmiNumber || '',
        waiverType: client.waiverType || '',
        primaryLanguage: client.primaryLanguage || 'English',
        needsTranslator: client.needsTranslator || false,
        historyOfViolence: client.historyOfViolence || false,
        mobilityStatus: client.mobilityStatus || '',
        livingSituation: client.livingSituation || '',
        primaryDiagnosis: client.primaryDiagnosis || '',
        culturalConsiderations: client.culturalConsiderations || '',
        additionalNotes: client.additionalNotes || '',
      });
    }
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background-500 to-secondary-50">
      {/* Enhanced Top Navigation */}
      <div className="bg-primary-50 border-b border-secondary-300 sticky top-0 z-10 shadow-sm">
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
              {!isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                  >
                    <Edit className="h-4 w-4 mr-2 text-gray-600" />
                    Edit Client
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
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCancelEdit}
                    className="border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                  >
                    <XCircle className="h-4 w-4 mr-2 text-gray-600" />
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar - Client Information */}
          <div className="w-96 flex-shrink-0">
            <div className="bg-primary-50 rounded-2xl shadow-sm border border-secondary-300 p-6 sticky top-24">
              <div className="text-center mb-6">
                <Avatar className="h-24 w-24 rounded-2xl border-4 border-white shadow-lg bg-gradient-to-br from-accent-500 to-accent-600 text-white font-bold text-2xl mx-auto mb-4">
                  <AvatarFallback>{clientInitials}</AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-semibold text-accent-800 mb-2">
                  {isEditing ? `${formData.firstName} ${formData.lastName}`.trim() || 'Enter Name' : clientName}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {isEditing ? 'Editing Client Profile' : 'Client Profile & Information'}
                </p>
                
                {/* Organization Context */}
                <div className="text-xs text-gray-500 mb-4 flex items-center justify-center gap-2">
                  <Building2 className="w-3 h-3" />
                  <span>{user?.organization?.name || 'Your Organization'}</span>
                  {client?.assignedBy && <span>• Supervisor Assigned</span>}
                </div>
                
                {/* Client ID with enhanced styling */}
                <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border">
                  <span className="text-sm font-medium text-gray-600">ID:</span>
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

              {/* Status Selector */}
              <div className="mb-6">
                <ClientStatusSelector
                  clientId={client._id}
                  initialStatus={client.status || 'UNPLACED_NEW'}
                  onStatusChange={handleStatusChange}
                  className="w-full bg-white shadow-sm"
                />
              </div>

              {/* Quick Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Active Referrals</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    {activeReferrals?.length || 0}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">Completed</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {completedReferrals?.length || 0}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium text-gray-700">Client Since</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {client.createdAt ? formatSafeDate(client.createdAt) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Basic Information */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="h-6 w-6 text-blue-500" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-600 mb-1">Full Name</dt>
                      {isEditing ? (
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            placeholder="First Name"
                            className="text-gray-900"
                          />
                          <Input
                            value={formData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            placeholder="Last Name"
                            className="text-gray-900"
                          />
                        </div>
                      ) : (
                        <dd className="text-lg text-gray-900 font-semibold">{clientName}</dd>
                      )}
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-600 mb-1">Date of Birth</dt>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                          className="text-gray-900"
                        />
                      ) : (
                        <dd className="text-gray-900 font-medium">
                          {client.dateOfBirth ? formatSafeDate(client.dateOfBirth) : 'Not provided'}
                        </dd>
                      )}
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-600 mb-1">Sex</dt>
                      {isEditing ? (
                        <Select value={formData.sex} onValueChange={(value) => handleInputChange('sex', value)}>
                          <SelectTrigger className="text-gray-900">
                            <SelectValue placeholder="Select sex" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="non-binary">Non-binary</SelectItem>
                            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <dd className="text-gray-900 font-medium">{getSexLabel(client.sex)}</dd>
                      )}
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-600 mb-1">Preferred Contact</dt>
                      {isEditing ? (
                        <Select value={formData.preferredContactMethod} onValueChange={(value) => handleInputChange('preferredContactMethod', value)}>
                          <SelectTrigger className="text-gray-900">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <dd className="text-gray-900 font-medium capitalize">
                          {client.preferredContactMethod || 'Email'}
                        </dd>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-600 mb-1">Primary Language</dt>
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={formData.primaryLanguage}
                            onChange={(e) => handleInputChange('primaryLanguage', e.target.value)}
                            placeholder="Primary Language"
                            className="text-gray-900"
                          />
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="needsTranslator"
                              checked={formData.needsTranslator}
                              onCheckedChange={(checked) => handleInputChange('needsTranslator', checked)}
                            />
                            <Label htmlFor="needsTranslator" className="text-sm">Needs translator</Label>
                          </div>
                        </div>
                      ) : (
                        <dd className="text-gray-900 font-medium flex items-center gap-2">
                          <Languages className="h-4 w-4 text-orange-500" />
                          {client.primaryLanguage || 'English'}
                          {client.needsTranslator && (
                            <Badge className="bg-orange-100 text-orange-800 text-xs">
                              Needs Translator
                            </Badge>
                          )}
                        </dd>
                      )}
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-600 mb-1">Mobility Status</dt>
                      {isEditing ? (
                        <Select value={formData.mobilityStatus} onValueChange={(value) => handleInputChange('mobilityStatus', value)}>
                          <SelectTrigger className="text-gray-900">
                            <SelectValue placeholder="Select mobility status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ambulatory">Ambulatory</SelectItem>
                            <SelectItem value="wheelchair-bound">Wheelchair-bound</SelectItem>
                            <SelectItem value="bed-bound">Bed-bound</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <dd className="text-gray-900 font-medium flex items-center gap-2">
                          <Accessibility className="h-4 w-4 text-teal-500" />
                          {getMobilityLabel(client.mobilityStatus)}
                        </dd>
                      )}
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-600 mb-1">Living Situation</dt>
                      {isEditing ? (
                        <Select value={formData.livingSituation} onValueChange={(value) => handleInputChange('livingSituation', value)}>
                          <SelectTrigger className="text-gray-900">
                            <SelectValue placeholder="Select living situation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="alone">Living Alone</SelectItem>
                            <SelectItem value="with-family">With Family</SelectItem>
                            <SelectItem value="group-setting">Group Setting</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <dd className="text-gray-900 font-medium flex items-center gap-2">
                          <Home className="h-4 w-4 text-pink-500" />
                          {getLivingSituationLabel(client.livingSituation)}
                        </dd>
                      )}
                    </div>
                    
                    {isEditing ? (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="historyOfViolence"
                          checked={formData.historyOfViolence}
                          onCheckedChange={(checked) => handleInputChange('historyOfViolence', checked)}
                        />
                        <Label htmlFor="historyOfViolence" className="text-sm">History of violence</Label>
                      </div>
                    ) : (
                      client.historyOfViolence && (
                        <div>
                          <dt className="text-sm font-medium text-gray-600 mb-1">Safety Note</dt>
                          <dd className="text-gray-900 font-medium flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            History of violence - special considerations needed
                          </dd>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Phone className="h-6 w-6 text-green-500" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-600 mb-1">Email Address</dt>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="Email address"
                          className="text-gray-900"
                        />
                      ) : (
                        <dd className="text-gray-900 font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4 text-blue-500" />
                          {client.email || 'No email'}
                        </dd>
                      )}
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-600 mb-1">Phone Number</dt>
                      {isEditing ? (
                        <Input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="Phone number"
                          className="text-gray-900"
                        />
                      ) : (
                        <dd className="text-gray-900 font-medium flex items-center gap-2">
                          <Phone className="h-4 w-4 text-green-500" />
                          {client.phone}
                        </dd>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-600 mb-1">Address</dt>
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={formData.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            placeholder="Street address"
                            className="text-gray-900"
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <Input
                              value={formData.city}
                              onChange={(e) => handleInputChange('city', e.target.value)}
                              placeholder="City"
                              className="text-gray-900"
                            />
                            <Input
                              value={formData.state}
                              onChange={(e) => handleInputChange('state', e.target.value)}
                              placeholder="State"
                              className="text-gray-900"
                            />
                            <Input
                              value={formData.zipCode}
                              onChange={(e) => handleInputChange('zipCode', e.target.value)}
                              placeholder="ZIP"
                              className="text-gray-900"
                            />
                          </div>
                        </div>
                      ) : (
                        <dd className="text-gray-900 font-medium flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-red-500" />
                          <div>
                            {typeof client.address === 'string' ? client.address : client.address?.street || 'N/A'}
                            {client.city && client.state && (
                              <div className="text-sm text-gray-600">
                                {client.city}, {client.state} {client.zipCode}
                              </div>
                            )}
                          </div>
                        </dd>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Insurance Information */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Shield className="h-6 w-6 text-emerald-500" />
                  Insurance Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-600 mb-1">Insurance Type</dt>
                      {isEditing ? (
                        <Select value={formData.insurance} onValueChange={(value) => handleInputChange('insurance', value)}>
                          <SelectTrigger className="text-gray-900">
                            <SelectValue placeholder="Select insurance type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="medicaid">Medicaid</SelectItem>
                            <SelectItem value="medicare">Medicare</SelectItem>
                            <SelectItem value="private">Private Insurance</SelectItem>
                            <SelectItem value="none">No Insurance</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <dd className="text-gray-900 font-medium">
                          {getInsuranceLabel(typeof client.insurance === 'string' ? client.insurance : client.insurance?.type) || 'Not specified'}
                        </dd>
                      )}
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-600 mb-1">Insurance Provider</dt>
                      {isEditing ? (
                        <Input
                          value={formData.insuranceProvider}
                          onChange={(e) => handleInputChange('insuranceProvider', e.target.value)}
                          placeholder="Insurance provider"
                          className="text-gray-900"
                        />
                      ) : (
                        <dd className="text-gray-900 font-medium">
                          {client.insurance?.provider || client.insuranceProvider || 'Not specified'}
                        </dd>
                      )}
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-600 mb-1">Insurance Number</dt>
                      {isEditing ? (
                        <Input
                          value={formData.insuranceNumber}
                          onChange={(e) => handleInputChange('insuranceNumber', e.target.value)}
                          placeholder="Insurance number"
                          className="text-gray-900"
                        />
                      ) : (
                        <dd className="text-gray-900 font-medium">
                          {client.insurance?.number || client.insuranceNumber || 'Not specified'}
                        </dd>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-600 mb-1">PMI Number</dt>
                      {isEditing ? (
                        <Input
                          value={formData.pmiNumber}
                          onChange={(e) => handleInputChange('pmiNumber', e.target.value)}
                          placeholder="PMI number"
                          className="text-gray-900"
                        />
                      ) : (
                        <dd className="text-gray-900 font-medium">
                          {client.pmiNumber || 'Not specified'}
                        </dd>
                      )}
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-600 mb-1">Waiver Type</dt>
                      {isEditing ? (
                        <Select value={formData.waiverType} onValueChange={(value) => handleInputChange('waiverType', value)}>
                          <SelectTrigger className="group h-12 text-base bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg">
                            <div className="flex items-center w-full">
                              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/10 mr-3 group-hover:from-blue-500/20 group-hover:to-blue-600/20 transition-all duration-300">
                                <Shield className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
                              </div>
                              <div className="flex-1 text-left">
                                <div className="text-base font-medium text-gray-900">
                                  {formData.waiverType ? formatWaiverTypeShort(formData.waiverType) : "Select waiver type"}
                                </div>
                              </div>
                            </div>
                          </SelectTrigger>
                          <SelectContent className="z-50 max-h-96 overflow-y-auto bg-white/95 backdrop-blur-xl border-2 border-gray-200/50 rounded-xl shadow-2xl">
                            {WAIVER_TYPE_OPTIONS.map(option => (
                              <SelectItem 
                                key={option.value} 
                                value={option.value}
                                className="h-10 text-base px-4 py-2 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-blue-600/5 cursor-pointer transition-all duration-200 rounded-lg mx-2 my-1"
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <dd className="text-gray-900 font-medium">
                          {formatWaiverType(client.waiverType)}
                        </dd>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medical & Additional Information */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Heart className="h-6 w-6 text-red-500" />
                  Medical & Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <dt className="text-sm font-medium text-gray-600 mb-1">Primary Diagnosis</dt>
                    {isEditing ? (
                      <Textarea
                        value={formData.primaryDiagnosis}
                        onChange={(e) => handleInputChange('primaryDiagnosis', e.target.value)}
                        placeholder="Primary diagnosis"
                        className="text-gray-900 min-h-[80px]"
                      />
                    ) : (
                      <dd className="text-gray-900 font-medium">
                        {client.primaryDiagnosis || 'Not specified'}
                      </dd>
                    )}
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-600 mb-1">Cultural Considerations</dt>
                    {isEditing ? (
                      <Textarea
                        value={formData.culturalConsiderations}
                        onChange={(e) => handleInputChange('culturalConsiderations', e.target.value)}
                        placeholder="Cultural considerations"
                        className="text-gray-900 min-h-[80px]"
                      />
                    ) : (
                      <dd className="text-gray-900 font-medium">
                        {client.culturalConsiderations || 'Not specified'}
                      </dd>
                    )}
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-600 mb-1">Additional Notes</dt>
                    {isEditing ? (
                      <Textarea
                        value={formData.additionalNotes}
                        onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                        placeholder="Additional notes"
                        className="text-gray-900 min-h-[100px]"
                      />
                    ) : (
                      <dd className="text-gray-900 font-medium whitespace-pre-wrap">
                        {client.additionalNotes || 'No additional notes'}
                      </dd>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Referrals Section */}
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
                                <Link href={`/case-manager/referrals/${referral._id}/workspace`}>
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