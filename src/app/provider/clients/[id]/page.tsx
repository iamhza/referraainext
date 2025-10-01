"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Loader2,
  Activity,
  Package,
  UserCheck,
  UserX
} from "lucide-react";

import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { formatSafeDate } from '@/lib/date-utils';
import Link from "next/link";

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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function ProviderClientDetailsPage() {
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
        
        const res = await fetch(`/api/clients?id=${id}&assignedToProvider=true`);
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

  const renderTruncatedId = (id: string) => {
    if (!id) return null;
    return `${id.slice(0, 4)}...${id.slice(-4)}`;
  };

  const getSexLabel = (sex?: string) => {
    switch (sex) {
      case 'male': return 'Male';
      case 'female': return 'Female';
      case 'non-binary': return 'Non-binary';
      case 'prefer-not-to-say': return 'Prefer not to say';
      case 'other': return 'Other';
      default: return 'Not specified';
    }
  };

  const getMobilityLabel = (status?: string) => {
    switch (status) {
      case 'ambulatory': return 'Ambulatory';
      case 'wheelchair-bound': return 'Wheelchair-bound';
      case 'bed-bound': return 'Bed-bound';
      case 'other': return 'Other';
      default: return 'Not specified';
    }
  };

  const getLivingSituationLabel = (situation?: string) => {
    switch (situation) {
      case 'alone': return 'Living alone';
      case 'with-family': return 'Living with family';
      case 'group-setting': return 'Group setting';
      case 'other': return 'Other';
      default: return 'Not specified';
    }
  };

  const getInsuranceLabel = (type?: string) => {
    switch (type) {
      case 'medicaid': return 'Medicaid';
      case 'medicare': return 'Medicare';
      case 'private': return 'Private Insurance';
      case 'self-pay': return 'Self-pay';
      case 'other': return 'Other';
      default: return 'Not specified';
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update client');
      }
      
      const updatedClient = await res.json();
      setClient(updatedClient.client);
      setIsEditing(false);
      
      toast({
        title: "Client updated",
        description: "Client information has been successfully updated.",
      });
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err.message || "Failed to update client information.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form data to current client data
    if (client) {
      setFormData({
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        dateOfBirth: client.dateOfBirth || '',
        sex: client.sex || '',
        email: client.email || '',
        phone: client.phone || '',
        preferredContactMethod: client.preferredContactMethod || 'email',
        address: typeof client.address === 'string' ? client.address : '',
        city: client.city || '',
        state: client.state || '',
        zipCode: client.zipCode || '',
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

  // Initialize form data when client is loaded
  useEffect(() => {
    if (client) {
      setFormData({
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        dateOfBirth: client.dateOfBirth || '',
        sex: client.sex || '',
        email: client.email || '',
        phone: client.phone || '',
        preferredContactMethod: client.preferredContactMethod || 'email',
        address: typeof client.address === 'string' ? client.address : '',
        city: client.city || '',
        state: client.state || '',
        zipCode: client.zipCode || '',
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
          <Link href="/provider/clients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Link>
        </Button>
      </div>
    );
  }

  const getInitials = (first: string, last: string) => {
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50/20">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="animate-fade-in">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  asChild
                  className="rounded-full border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                >
                  <Link href="/provider/clients">
                    <ChevronLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                    Back to Clients
                  </Link>
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">
                  Client Profile
                </h1>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={refreshReferrals}
                  disabled={referralsLoading}
                  className="rounded-full"
                >
                  <Loader2 className={`mr-2 h-4 w-4 ${referralsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(!isEditing)}
                  className="rounded-full"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
                {isEditing && (
                  <Button 
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-full"
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save
                  </Button>
                )}
              </div>
            </div>
            
            <div className="text-md text-gray-500 mt-1">
              Client ID: {showId ? client._id : renderTruncatedId(client._id)}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowId(!showId)}
                className="ml-2 h-auto p-1"
              >
                {showId ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCopyId}
                className="ml-1 h-auto p-1"
              >
                <Copy className="h-3 w-3" />
              </Button>
              {copied && <span className="text-xs text-green-600 ml-1">Copied!</span>}
            </div>
          </div>

          {/* Client Overview Card */}
          <Card className="mb-6 rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white font-medium text-xl shadow">
                    <AvatarFallback>{getInitials(client.firstName, client.lastName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      {client.firstName} {client.lastName}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-4 mt-1 text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-gray-400" />
                        ID: {renderTruncatedId(client._id)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {client.dateOfBirth ? formatSafeDate(client.dateOfBirth) : 'DOB not specified'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <StatusBadge status={client.status} />
                  <Badge 
                    className={cn(
                      "px-3 py-1 text-sm font-medium flex items-center gap-1.5 rounded-full",
                      client.profileComplete 
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-amber-100 text-amber-800 border-amber-200"
                    )}
                  >
                    {client.profileComplete ? (
                      <CheckCircle className="h-3.5 w-3.5" />
                    ) : (
                      <Clock className="h-3.5 w-3.5" />
                    )}
                    {client.profileComplete ? 'Complete' : 'Incomplete'} Profile
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Main Content */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Client Information */}
            <div className="lg:col-span-2 space-y-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="referrals">Referrals</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-6">
                  {/* Personal Information */}
                  <Card className="rounded-xl border border-gray-100">
                    <CardHeader className="pb-4 pt-6">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-500" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                            {isEditing ? (
                              <div className="grid grid-cols-2 gap-2 mt-1">
                                <Input
                                  value={formData.firstName}
                                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                                  placeholder="First name"
                                  className="rounded-lg"
                                />
                                <Input
                                  value={formData.lastName}
                                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                                  placeholder="Last name"
                                  className="rounded-lg"
                                />
                              </div>
                            ) : (
                              <p className="text-gray-900 mt-1">{client.firstName} {client.lastName}</p>
                            )}
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Date of Birth</Label>
                            {isEditing ? (
                              <Input
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                className="rounded-lg mt-1"
                              />
                            ) : (
                              <p className="text-gray-900 mt-1">
                                {client.dateOfBirth ? formatSafeDate(client.dateOfBirth) : 'Not specified'}
                              </p>
                            )}
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Sex</Label>
                            {isEditing ? (
                              <Select value={formData.sex} onValueChange={(value) => handleInputChange('sex', value)}>
                                <SelectTrigger className="rounded-lg mt-1">
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
                              <p className="text-gray-900 mt-1">{getSexLabel(client.sex)}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Email</Label>
                            {isEditing ? (
                              <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                placeholder="Email address"
                                className="rounded-lg mt-1"
                              />
                            ) : (
                              <p className="text-gray-900 mt-1">{client.email || 'Not specified'}</p>
                            )}
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Phone</Label>
                            {isEditing ? (
                              <Input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                placeholder="Phone number"
                                className="rounded-lg mt-1"
                              />
                            ) : (
                              <p className="text-gray-900 mt-1">{client.phone || 'Not specified'}</p>
                            )}
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Preferred Contact Method</Label>
                            {isEditing ? (
                              <Select value={formData.preferredContactMethod} onValueChange={(value) => handleInputChange('preferredContactMethod', value)}>
                                <SelectTrigger className="rounded-lg mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="phone">Phone</SelectItem>
                                  <SelectItem value="both">Both</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <p className="text-gray-900 mt-1 capitalize">{client.preferredContactMethod || 'Not specified'}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Address Information */}
                  <Card className="rounded-xl border border-gray-100">
                    <CardHeader className="pb-4 pt-6">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-blue-500" />
                        Address Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">City</Label>
                          {isEditing ? (
                            <Input
                              value={formData.city}
                              onChange={(e) => handleInputChange('city', e.target.value)}
                              placeholder="City"
                              className="rounded-lg mt-1"
                            />
                          ) : (
                            <p className="text-gray-900 mt-1">{client.city || 'Not specified'}</p>
                          )}
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-gray-600">State</Label>
                          {isEditing ? (
                            <Input
                              value={formData.state}
                              onChange={(e) => handleInputChange('state', e.target.value)}
                              placeholder="State"
                              className="rounded-lg mt-1"
                            />
                          ) : (
                            <p className="text-gray-900 mt-1">{client.state || 'Not specified'}</p>
                          )}
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-gray-600">ZIP Code</Label>
                          {isEditing ? (
                            <Input
                              value={formData.zipCode}
                              onChange={(e) => handleInputChange('zipCode', e.target.value)}
                              placeholder="ZIP code"
                              className="rounded-lg mt-1"
                            />
                          ) : (
                            <p className="text-gray-900 mt-1">{client.zipCode || 'Not specified'}</p>
                          )}
                        </div>
                      </div>
                      
                      {isEditing && (
                        <div className="mt-4">
                          <Label className="text-sm font-medium text-gray-600">Full Address (Optional)</Label>
                          <Textarea
                            value={formData.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            placeholder="Full address"
                            className="rounded-lg mt-1"
                            rows={2}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Additional Information */}
                  <Card className="rounded-xl border border-gray-100">
                    <CardHeader className="pb-4 pt-6">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2">
                        <Info className="h-5 w-5 text-blue-500" />
                        Additional Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Primary Language</Label>
                            {isEditing ? (
                              <Input
                                value={formData.primaryLanguage}
                                onChange={(e) => handleInputChange('primaryLanguage', e.target.value)}
                                placeholder="Primary language"
                                className="rounded-lg mt-1"
                              />
                            ) : (
                              <p className="text-gray-900 mt-1">{client.primaryLanguage || 'English'}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="needsTranslator"
                              checked={formData.needsTranslator}
                              onCheckedChange={(checked) => handleInputChange('needsTranslator', checked)}
                              disabled={!isEditing}
                            />
                            <Label htmlFor="needsTranslator" className="text-sm font-medium text-gray-600">
                              Needs translator
                            </Label>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Mobility Status</Label>
                            {isEditing ? (
                              <Select value={formData.mobilityStatus} onValueChange={(value) => handleInputChange('mobilityStatus', value)}>
                                <SelectTrigger className="rounded-lg mt-1">
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
                              <p className="text-gray-900 mt-1">{getMobilityLabel(client.mobilityStatus)}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Living Situation</Label>
                            {isEditing ? (
                              <Select value={formData.livingSituation} onValueChange={(value) => handleInputChange('livingSituation', value)}>
                                <SelectTrigger className="rounded-lg mt-1">
                                  <SelectValue placeholder="Select living situation" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="alone">Living alone</SelectItem>
                                  <SelectItem value="with-family">Living with family</SelectItem>
                                  <SelectItem value="group-setting">Group setting</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <p className="text-gray-900 mt-1">{getLivingSituationLabel(client.livingSituation)}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="historyOfViolence"
                              checked={formData.historyOfViolence}
                              onCheckedChange={(checked) => handleInputChange('historyOfViolence', checked)}
                              disabled={!isEditing}
                            />
                            <Label htmlFor="historyOfViolence" className="text-sm font-medium text-gray-600">
                              History of violence
                            </Label>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Primary Diagnosis</Label>
                            {isEditing ? (
                              <Textarea
                                value={formData.primaryDiagnosis}
                                onChange={(e) => handleInputChange('primaryDiagnosis', e.target.value)}
                                placeholder="Primary diagnosis"
                                className="rounded-lg mt-1"
                                rows={2}
                              />
                            ) : (
                              <p className="text-gray-900 mt-1">{client.primaryDiagnosis || 'Not specified'}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <Label className="text-sm font-medium text-gray-600">Cultural Considerations</Label>
                        {isEditing ? (
                          <Textarea
                            value={formData.culturalConsiderations}
                            onChange={(e) => handleInputChange('culturalConsiderations', e.target.value)}
                            placeholder="Cultural considerations"
                            className="rounded-lg mt-1"
                            rows={3}
                          />
                        ) : (
                          <p className="text-gray-900 mt-1">{client.culturalConsiderations || 'Not specified'}</p>
                        )}
                      </div>
                      
                      <div className="mt-6">
                        <Label className="text-sm font-medium text-gray-600">Additional Notes</Label>
                        {isEditing ? (
                          <Textarea
                            value={formData.additionalNotes}
                            onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                            placeholder="Additional notes"
                            className="rounded-lg mt-1"
                            rows={3}
                          />
                        ) : (
                          <p className="text-gray-900 mt-1">{client.additionalNotes || 'No additional notes'}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="referrals" className="space-y-6">
                  {/* Active Referrals */}
                  <Card className="rounded-xl border border-gray-100">
                    <CardHeader className="pb-4 pt-6">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2">
                        <Activity className="h-5 w-5 text-green-500" />
                        Active Referrals
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-6">
                      {referralsLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                      ) : activeReferrals.length === 0 ? (
                        <div className="text-center py-8">
                          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No active referrals for this client.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {activeReferrals.map((referral) => (
                            <div key={referral._id} className="p-4 border border-gray-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-gray-900">{referral.serviceDetails?.type || 'Service'}</h4>
                                  <p className="text-sm text-gray-600">Status: {referral.status}</p>
                                </div>
                                <Link href={`/provider/referrals/${referral._id}`}>
                                  <Button variant="outline" size="sm">
                                    View Details
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Completed Referrals */}
                  <Card className="rounded-xl border border-gray-100">
                    <CardHeader className="pb-4 pt-6">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                        Completed Referrals
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-6">
                      {completedLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                      ) : completedReferrals.length === 0 ? (
                        <div className="text-center py-8">
                          <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No completed referrals for this client.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {completedReferrals.map((referral) => (
                            <div key={referral._id} className="p-4 border border-gray-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-gray-900">{referral.serviceDetails?.type || 'Service'}</h4>
                                  <p className="text-sm text-gray-600">Completed: {referral.completedAt ? formatSafeDate(referral.completedAt) : 'Unknown'}</p>
                                </div>
                                <Link href={`/provider/referrals/${referral._id}`}>
                                  <Button variant="outline" size="sm">
                                    View Details
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="timeline" className="space-y-6">
                  {/* Relationship Timeline */}
                  <Card className="rounded-xl border border-gray-100">
                    <CardHeader className="pb-4 pt-6">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-500" />
                        Relationship Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-6">
                      {relationshipEvents.length === 0 ? (
                        <div className="text-center py-8">
                          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No timeline events yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {relationshipEvents.map((event, index) => (
                            <div key={index} className="flex items-start gap-4">
                              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{event.type}</h4>
                                <p className="text-sm text-gray-600">{event.description}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {event.timestamp ? formatSafeDate(event.timestamp) : 'Unknown date'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Right Column - Quick Actions & Summary */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="rounded-xl border border-gray-100">
                <CardHeader className="pb-4 pt-6">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-6 space-y-3">
                  <Link href={`/provider/referrals?clientId=${client._id}`}>
                    <Button variant="outline" className="w-full justify-start rounded-full">
                      <Package className="h-4 w-4 mr-2" />
                      View All Referrals
                    </Button>
                  </Link>
                  
                  <Link href={`/provider/referrals/${activeReferrals[0]?._id}/workspace`}>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start rounded-full"
                      disabled={activeReferrals.length === 0}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Open Workspace
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start rounded-full"
                    onClick={refreshReferrals}
                    disabled={referralsLoading}
                  >
                    <Loader2 className={`h-4 w-4 mr-2 ${referralsLoading ? 'animate-spin' : ''}`} />
                    Refresh Data
                  </Button>
                </CardContent>
              </Card>
              
              {/* Client Summary */}
              <Card className="rounded-xl border border-gray-100">
                <CardHeader className="pb-4 pt-6">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-500" />
                    Client Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white font-medium text-lg">
                      <AvatarFallback>{getInitials(client.firstName, client.lastName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{client.firstName} {client.lastName}</h3>
                      <p className="text-sm text-gray-600">ID: {renderTruncatedId(client._id)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{client.phone}</span>
                      </div>
                    )}
                    {(client.city || client.state) && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">
                          {[client.city, client.state].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <StatusBadge status={client.status} />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Profile:</span>
                      <span className={client.profileComplete ? 'text-green-600' : 'text-amber-600'}>
                        {client.profileComplete ? 'Complete' : 'Incomplete'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Active Referrals:</span>
                      <span className="text-gray-900">{activeReferrals.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Completed:</span>
                      <span className="text-gray-900">{completedReferrals.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 