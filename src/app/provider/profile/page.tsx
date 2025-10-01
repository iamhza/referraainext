'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Edit2, 
  Save, 
  X, 
  Calendar, 
  BedDouble, 
  Users as UsersIcon, 
  Plus, 
  Trash2, 
  ArrowLeft,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  Building,
  Shield,
  FileText,
  Upload,
  Settings,
  Star,
  TrendingUp,
  Activity,
  CheckSquare,
  Square
} from 'lucide-react';
import Link from 'next/link';

export default function ProviderProfilePage() {
  const { user, loading, updateProfile } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate available beds for capacity-based (must be before any early returns)
  const availableBeds = useMemo(() => {
    if (form.type !== 'capacity') return null;
    const total = Number(form.capacity?.totalBeds) || 0;
    const occupied = Number(form.capacity?.occupiedBeds) || 0;
    return Math.max(total - occupied, 0);
  }, [form]);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      try {
        const res = await fetch('/api/providers');
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        setProfile(data.provider || {});
        setForm(data.provider || {});
      } catch (err) {
        setProfile({});
        setForm({});
      }
    }
    fetchProfile();
  }, [user]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading profile...</div>;
  if (!user) return <div className="p-8 text-center text-red-500">Not authenticated.</div>;

  // Profile completion logic
  const requiredFields = [
    'full_name', 'organization_name', 'phone', 'email', 'address', 'npi_number', 'license_number'
  ];
  const optionalFields = [
    'bio', 'specialties', 'credentials', 'experience_years', 'languages', 'availability', 'insurances', 'photo_url', 'website'
  ];
  const allFields = [...requiredFields, ...optionalFields];
  
  const completedRequired = requiredFields.filter(f => profile && profile[f] && profile[f].length > 0).length;
  const completedOptional = optionalFields.filter(f => profile && profile[f] && profile[f].length > 0).length;
  const completion = Math.round(((completedRequired + completedOptional) / allFields.length) * 100);

  // Profile status
  const getProfileStatus = () => {
    if (completion < 50) return { status: 'Incomplete', color: 'bg-red-100 text-red-800 border-red-200', icon: Clock };
    if (completion < 80) return { status: 'Under Review', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock };
    return { status: 'Active', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle };
  };

  const profileStatus = getProfileStatus();

  // Mock referral stats (replace with real data)
  const referralStats = {
    total: 12,
    matched: 8,
    pending: 4
  };

  // Mock activity feed
  const activityFeed = [
    { action: 'Uploaded License.pdf', status: 'completed', time: '2 hours ago' },
    { action: 'Edited Service Area', status: 'completed', time: '1 day ago' },
    { action: 'Set Availability for May 2025', status: 'completed', time: '3 days ago' }
  ];

  // Helper for days of week
  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  // Add slot for unit-based availability
  const handleAddSlot = () => {
    setForm((prev: any) => ({
      ...prev,
      availability: [
        ...(prev.availability || []),
        { day: 'Monday', start: '08:00', end: '17:00', maxClients: 1 }
      ]
    }));
  };

  // Remove slot
  const handleRemoveSlot = (idx: number) => {
    setForm((prev: any) => ({
      ...prev,
      availability: prev.availability.filter((_: any, i: number) => i !== idx)
    }));
  };

  // Update slot
  const handleSlotChange = (idx: number, field: string, value: any) => {
    setForm((prev: any) => {
      const updated = [...(prev.availability || [])];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, availability: updated };
    });
  };

  // Update capacity fields
  const handleCapacityChange = (field: string, value: any) => {
    setForm((prev: any) => ({
      ...prev,
      capacity: { ...prev.capacity, [field]: value }
    }));
  };

  // Handlers
  const handleEdit = () => setEditMode(true);
  const handleCancel = () => { setEditMode(false); setForm(profile); };
  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/providers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Failed to save profile');
      
      // Refresh the profile data
      const profileRes = await fetch('/api/providers');
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.provider || {});
      }
      
      setEditMode(false);
      
      // Update auth context to refresh sidebar (email is handled separately)
      if (form.full_name || form.organization_name) {
        await updateProfile({
          fullName: form.full_name,
          organization: form.organization_name
        });
      }
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
            
            {/* Top Profile Header */}
            <div className="mb-8">
              <div className="relative">
                {/* Banner */}
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-xl"></div>
                
                {/* Avatar overlapping banner */}
                <div className="absolute -bottom-8 left-8">
                  <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                                          <AvatarImage src={profile?.photo_url} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xl font-semibold">
                      {profile?.full_name?.charAt(0) || profile?.organization_name?.charAt(0) || 'P'}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Edit Profile Button & Provider Tier Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-3">
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    <Star className="w-3 h-3 mr-1" />
                    Premium Provider
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white/90 backdrop-blur-sm border-white/20 text-gray-700 hover:bg-white"
                    onClick={handleEdit}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>

              {/* Profile Info */}
              <div className="mt-12 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile?.organization_name || profile?.full_name || 'Provider Name'}
                  </h1>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                </div>
                <div className="flex items-center gap-6 text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{profile?.address || 'Minneapolis, MN'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined March 2025</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Summary Card */}
            <Card className="mb-8 shadow-sm">
              <CardContent className="p-6">
                {editMode ? (
                  // Edit Form
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Edit Profile Information</h3>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleCancel}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                          <Save className="w-4 h-4 mr-2" />
                          {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Organization Name *
                          </label>
                          <Input
                            name="organization_name"
                            value={form.organization_name || ''}
                            onChange={handleChange}
                            placeholder="Enter organization name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name *
                          </label>
                          <Input
                            name="full_name"
                            value={form.full_name || ''}
                            onChange={handleChange}
                            placeholder="Enter full name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number *
                          </label>
                          <Input
                            name="phone"
                            value={form.phone || ''}
                            onChange={handleChange}
                            placeholder="(612) 555-1234"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                          </label>
                          <div className="flex items-center px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 text-sm">
                            {form.email || user?.email || 'No email set'}
                            <span className="ml-2 text-xs text-gray-500">(Change in Settings)</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address *
                          </label>
                          <Input
                            name="address"
                            value={form.address || ''}
                            onChange={handleChange}
                            placeholder="123 Main St, City, State ZIP"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            NPI Number *
                          </label>
                          <Input
                            name="npi_number"
                            value={form.npi_number || ''}
                            onChange={handleChange}
                            placeholder="1234567890"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            License Number *
                          </label>
                          <Input
                            name="license_number"
                            value={form.license_number || ''}
                            onChange={handleChange}
                            placeholder="Enter license number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Website
                          </label>
                          <Input
                            name="website"
                            value={form.website || ''}
                            onChange={handleChange}
                            placeholder="https://yourwebsite.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bio
                          </label>
                          <Textarea
                            name="bio"
                            value={form.bio || ''}
                            onChange={handleChange}
                            placeholder="Tell us about your organization and services..."
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{profile?.organization_name || 'Organization Name'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BedDouble className="w-4 h-4 text-gray-500" />
                        <span>Residential Care Facility</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{profile?.phone || '(612) 555-5555'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span>{profile?.email || 'contact@wellify.com'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>Serving: Twin Cities Metro Area</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-500" />
                        <Badge className={profileStatus.color}>
                          <profileStatus.icon className="w-3 h-3 mr-1" />
                          {profileStatus.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-500" />
                        <span>Website: {profile?.website || 'wellify.com'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-600" />
                        <span className="text-green-700 font-medium">NPI Verified</span>
                      </div>
                      
                      {/* Referral Stats - only shown for active providers */}
                      {profileStatus.status === 'Active' && (
                        <div className="pt-4 border-t border-gray-200">
                          <h4 className="font-medium text-gray-900 mb-3">Referral Activity</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className="text-lg font-semibold text-blue-600">{referralStats.total}</div>
                              <div className="text-xs text-gray-500">Total</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-green-600">{referralStats.matched}</div>
                              <div className="text-xs text-gray-500">Matched</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-yellow-600">{referralStats.pending}</div>
                              <div className="text-xs text-gray-500">Pending</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabbed Layout */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Profile Overview</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="availability">Availability</TabsTrigger>
                <TabsTrigger value="service-area">Service Area</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Profile Completion Progress */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Profile Completion</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Profile {completion}% Complete</span>
                      <span className="text-sm font-medium text-gray-900">{completion}%</span>
                    </div>
                    <Progress value={completion} className="h-2" />
                    
                    {/* Checklist */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Required Information</h4>
                      <div className="space-y-2">
                        {requiredFields.map((field) => {
                          const isCompleted = profile && profile[field] && profile[field].length > 0;
                          const fieldLabels: { [key: string]: string } = {
                            full_name: 'Add Full Name',
                            organization_name: 'Add Organization Name',
                            phone: 'Add Phone Number',
                            email: 'Add Email Address',
                            address: 'Add Address',
                            npi_number: 'Add NPI Number',
                            license_number: 'Upload License'
                          };
                          
                          return (
                            <div key={field} className="flex items-center gap-2">
                              {isCompleted ? (
                                <CheckSquare className="w-4 h-4 text-green-600" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-400" />
                              )}
                              <span className={`text-sm ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                                {fieldLabels[field] || field}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity Feed */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {activityFeed.map((activity, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Upload className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                            <p className="text-xs text-gray-500">{activity.time}</p>
                          </div>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="services" className="space-y-6">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Services Offered</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Services configuration will go here...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="availability" className="space-y-6">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Availability Schedule</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Availability configuration will go here...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="service-area" className="space-y-6">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Service Area</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Service area configuration will go here...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="space-y-6">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Documents & Licenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Document upload and management will go here...</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* FOMO CTA - Only show if profile is incomplete */}
            {completion < 80 && (
              <Card className="mt-8 border-blue-200 bg-blue-50/50 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Complete Your Profile to Start Receiving Referrals</h3>
                        <p className="text-sm text-gray-600">Finish setting up your profile to get matched with clients</p>
                      </div>
                    </div>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={completion < 50}
                    >
                      Complete Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
  );
} 