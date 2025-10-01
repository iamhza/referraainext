'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  FileText, 
  Send, 
  AlertCircle,
  CheckCircle,
  Users,
  Building,
  Globe,
  Phone,
  RefreshCw
} from 'lucide-react';
import { formatSafeDate } from '@/lib/date-utils';

interface OpenReferral {
  _id: string;
  serviceDetails: {
    type: string;
    urgency: string;
    description: string;
    expectedStartDate: string;
    location: string;
    requirements: string[];
  };
  createdAt: string;
  networkExpiry: string;
  hasSubmitted: boolean;
  daysLeft: number;
}

interface SubmissionData {
  coverNote: string;
  capacityFlag: boolean;
  earliestStartDate: string;
  serviceAreas: string[];
  languages: string[];
  credentials: string[];
  experienceTags: string[];
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  staffingPlan?: string;
  shiftAvailability?: string[];
  attachments?: File[];
}

const CREDENTIALS_OPTIONS = [
  'Licensed Social Worker (LSW)',
  'Licensed Clinical Social Worker (LCSW)',
  'Registered Nurse (RN)',
  'Licensed Practical Nurse (LPN)',
  'Certified Nursing Assistant (CNA)',
  'Personal Care Assistant (PCA)',
  'Direct Support Professional (DSP)',
  'Behavioral Health Professional',
  'Mental Health Professional',
  'Case Management Certification',
  'First Aid/CPR Certified',
  'Other Professional License'
];

const LANGUAGE_OPTIONS = [
  'English', 'Spanish', 'Somali', 'Hmong', 'Russian', 'Vietnamese', 
  'Arabic', 'French', 'German', 'Korean', 'Chinese (Mandarin)', 
  'Chinese (Cantonese)', 'ASL (American Sign Language)', 'Other'
];

const EXPERIENCE_TAGS = [
  'Autism Spectrum Disorders',
  'Developmental Disabilities',
  'Mental Health',
  'Behavioral Support',
  'Physical Disabilities',
  'Elderly Care',
  'Pediatric Care',
  'Trauma-Informed Care',
  'Crisis Intervention',
  'Medication Management',
  'Transportation Services',
  'Community Integration'
];

const SHIFT_AVAILABILITY = [
  'Morning (6am-12pm)',
  'Afternoon (12pm-6pm)', 
  'Evening (6pm-12am)',
  'Overnight (12am-6am)',
  'Weekends',
  'Holidays',
  'On-call/Emergency'
];

export default function ProviderNetworkPage() {
  const [openReferrals, setOpenReferrals] = useState<OpenReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReferral, setSelectedReferral] = useState<OpenReferral | null>(null);
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quotaStatus, setQuotaStatus] = useState<{plan: string; submissionsUsed: number; submissionsQuota: number}>({
    plan: 'free',
    submissionsUsed: 0,
    submissionsQuota: 0
  });

  const { user } = useAuth();
  const { toast } = useToast();

  const [submissionData, setSubmissionData] = useState<SubmissionData>({
    coverNote: '',
    capacityFlag: true,
    earliestStartDate: '',
    serviceAreas: [],
    languages: [],
    credentials: [],
    experienceTags: [],
    contact: { name: '', email: '', phone: '' },
    staffingPlan: '',
    shiftAvailability: [],
  });

  useEffect(() => {
    fetchOpenReferrals();
    if (user?.id) {
      fetchQuotaStatus(user.id);
    }
  }, [user]);

  const fetchOpenReferrals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/referrals/potential?type=open_network');
      if (!response.ok) throw new Error('Failed to fetch open referrals');
      
      const data = await response.json();
      setOpenReferrals(data.openReferrals || []);
    } catch (error) {
      console.error('Error fetching open referrals:', error);
      toast({
        title: "Error",
        description: "Failed to load open referrals",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotaStatus = async (userId: string) => {
    try {
      const response = await fetch('/api/provider/quota-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setQuotaStatus({
          plan: data.plan,
          submissionsUsed: data.submissionsUsed,
          submissionsQuota: data.submissionsQuota
        });
      }
    } catch (error) {
      console.error('Failed to fetch quota status:', error);
    }
  };

  const handleSubmitProposal = async () => {
    if (!selectedReferral) return;

    // Validation
    if (submissionData.coverNote.length < 300) {
      toast({
        title: "Cover Note Too Short",
        description: "Cover note must be at least 300 characters",
        variant: "destructive"
      });
      return;
    }

    if (!submissionData.contact.name || !submissionData.contact.phone) {
      toast({
        title: "Contact Information Required",
        description: "Name and phone number are required",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/referrals/${selectedReferral._id}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.needsUpgrade) {
          toast({
            title: "Upgrade Required",
            description: result.error,
            variant: "destructive",
            action: (
              <Button 
                size="sm" 
                onClick={() => window.open('/provider/settings?tab=billing', '_blank')}
              >
                Upgrade Plan
              </Button>
            )
          });
        } else {
          throw new Error(result.error);
        }
        return;
      }

      toast({
        title: "Submission Successful",
        description: "Your proposal has been submitted to the case manager",
      });

      // Refresh data
      fetchOpenReferrals();
      if (user?.id) fetchQuotaStatus(user.id);
      
      setIsSubmissionDialogOpen(false);
      resetSubmissionForm();
      
    } catch (error) {
      console.error('Error submitting proposal:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit proposal",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSubmissionForm = () => {
    setSubmissionData({
      coverNote: '',
      capacityFlag: true,
      earliestStartDate: '',
      serviceAreas: [],
      languages: [],
      credentials: [],
      experienceTags: [],
      contact: { name: '', email: '', phone: '' },
      staffingPlan: '',
      shiftAvailability: [],
    });
  };

  const openSubmissionDialog = (referral: OpenReferral) => {
    setSelectedReferral(referral);
    resetSubmissionForm();
    setIsSubmissionDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading open referrals...</p>
          </div>
        </main>
      </div>
    );
  }

  const canSubmit = quotaStatus.plan === 'free' 
    ? false 
    : quotaStatus.submissionsUsed < quotaStatus.submissionsQuota || quotaStatus.plan === 'scale';

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Referral Network</h1>
                <p className="text-gray-600 mt-1">Browse and submit proposals for open referrals</p>
              </div>
              <Button onClick={fetchOpenReferrals} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Quota Status */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Current Plan: <span className="capitalize">{quotaStatus.plan}</span>
                  </p>
                  {quotaStatus.plan !== 'free' && (
                    <p className="text-sm text-gray-600">
                      Submissions: {quotaStatus.submissionsUsed} / {quotaStatus.plan === 'scale' ? '∞' : quotaStatus.submissionsQuota}
                    </p>
                  )}
                </div>
                {!canSubmit && (
                  <Button 
                    size="sm" 
                    onClick={() => window.open('/provider/settings?tab=billing', '_blank')}
                  >
                    Upgrade to Submit
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Open Referrals List */}
          <div className="space-y-6">
            {openReferrals.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Open Referrals</h3>
                  <p className="text-gray-600">There are no open referrals available for submission at the moment.</p>
                </CardContent>
              </Card>
            ) : (
              openReferrals.map((referral) => (
                <Card key={referral._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl flex items-center gap-2">
                          {referral.serviceDetails.type}
                          <Badge variant={referral.serviceDetails.urgency === 'high' ? 'destructive' : 
                                        referral.serviceDetails.urgency === 'medium' ? 'default' : 'secondary'}>
                            {referral.serviceDetails.urgency} priority
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {referral.serviceDetails.description}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {referral.hasSubmitted ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Submitted
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-blue-600">
                            <Clock className="h-3 w-3 mr-1" />
                            {referral.daysLeft} day{referral.daysLeft !== 1 ? 's' : ''} left
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {formatSafeDate(referral.serviceDetails.expectedStartDate)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {referral.serviceDetails.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        Service Type
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building className="h-4 w-4" />
                        Posted {formatSafeDate(referral.createdAt)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {referral.serviceDetails.requirements?.slice(0, 3).map((req, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {req}
                          </Badge>
                        ))}
                        {(referral.serviceDetails.requirements?.length || 0) > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(referral.serviceDetails.requirements?.length || 0) - 3} more
                          </Badge>
                        )}
                      </div>

                      <Button
                        onClick={() => openSubmissionDialog(referral)}
                        disabled={referral.hasSubmitted || referral.daysLeft === 0 || !canSubmit}
                        size="sm"
                      >
                        {referral.hasSubmitted ? 'View Submission' : 
                         referral.daysLeft === 0 ? 'Expired' :
                         !canSubmit ? 'Upgrade to Submit' : 'Submit Proposal'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Submission Dialog */}
        <Dialog open={isSubmissionDialogOpen} onOpenChange={setIsSubmissionDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submit Proposal</DialogTitle>
              <DialogDescription>
                Submit your proposal for: {selectedReferral?.serviceDetails.type}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Cover Note */}
              <div>
                <Label htmlFor="coverNote">Cover Note *</Label>
                <Textarea
                  id="coverNote"
                  placeholder="Describe your approach, experience, and why you're the best fit for this referral (minimum 300 characters)..."
                  value={submissionData.coverNote}
                  onChange={(e) => setSubmissionData(prev => ({ ...prev, coverNote: e.target.value }))}
                  className="min-h-[120px] mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {submissionData.coverNote.length}/300 characters minimum
                </p>
              </div>

              {/* Capacity and Start Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Current Capacity</Label>
                  <Select
                    value={submissionData.capacityFlag ? 'available' : 'limited'}
                    onValueChange={(value) => setSubmissionData(prev => ({ 
                      ...prev, 
                      capacityFlag: value === 'available' 
                    }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available - Can start immediately</SelectItem>
                      <SelectItem value="limited">Limited - May have constraints</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="startDate">Earliest Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={submissionData.earliestStartDate}
                    onChange={(e) => setSubmissionData(prev => ({ ...prev, earliestStartDate: e.target.value }))}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <Label className="text-base font-medium">Contact Information *</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div>
                    <Label htmlFor="contactName">Contact Name</Label>
                    <Input
                      id="contactName"
                      placeholder="Full name"
                      value={submissionData.contact.name}
                      onChange={(e) => setSubmissionData(prev => ({ 
                        ...prev, 
                        contact: { ...prev.contact, name: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactEmail">Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="email@example.com"
                      value={submissionData.contact.email}
                      onChange={(e) => setSubmissionData(prev => ({ 
                        ...prev, 
                        contact: { ...prev.contact, email: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Phone *</Label>
                    <Input
                      id="contactPhone"
                      placeholder="(555) 123-4567"
                      value={submissionData.contact.phone}
                      onChange={(e) => setSubmissionData(prev => ({ 
                        ...prev, 
                        contact: { ...prev.contact, phone: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* Service Areas */}
              <div>
                <Label htmlFor="serviceAreas">Service Areas (Counties/Zip Codes)</Label>
                <Textarea
                  id="serviceAreas"
                  placeholder="Enter counties or zip codes you serve, separated by commas"
                  value={submissionData.serviceAreas.join(', ')}
                  onChange={(e) => setSubmissionData(prev => ({ 
                    ...prev, 
                    serviceAreas: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }))}
                  className="mt-2"
                />
              </div>

              {/* Languages */}
              <div>
                <Label>Languages Spoken</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <div key={lang} className="flex items-center space-x-2">
                      <Checkbox
                        id={`lang-${lang}`}
                        checked={submissionData.languages.includes(lang)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSubmissionData(prev => ({ 
                              ...prev, 
                              languages: [...prev.languages, lang]
                            }));
                          } else {
                            setSubmissionData(prev => ({ 
                              ...prev, 
                              languages: prev.languages.filter(l => l !== lang)
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={`lang-${lang}`} className="text-sm">{lang}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Credentials */}
              <div>
                <Label>Credentials & Certifications</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {CREDENTIALS_OPTIONS.map((cred) => (
                    <div key={cred} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cred-${cred}`}
                        checked={submissionData.credentials.includes(cred)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSubmissionData(prev => ({ 
                              ...prev, 
                              credentials: [...prev.credentials, cred]
                            }));
                          } else {
                            setSubmissionData(prev => ({ 
                              ...prev, 
                              credentials: prev.credentials.filter(c => c !== cred)
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={`cred-${cred}`} className="text-sm">{cred}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Experience Tags */}
              <div>
                <Label>Experience & Specialties</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {EXPERIENCE_TAGS.map((tag) => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={`exp-${tag}`}
                        checked={submissionData.experienceTags.includes(tag)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSubmissionData(prev => ({ 
                              ...prev, 
                              experienceTags: [...prev.experienceTags, tag]
                            }));
                          } else {
                            setSubmissionData(prev => ({ 
                              ...prev, 
                              experienceTags: prev.experienceTags.filter(t => t !== tag)
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={`exp-${tag}`} className="text-sm">{tag}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional: Staffing Plan */}
              <div>
                <Label htmlFor="staffingPlan">Staffing Plan (Optional)</Label>
                <Textarea
                  id="staffingPlan"
                  placeholder="Describe your staffing approach, team size, and how you'll ensure continuity of care..."
                  value={submissionData.staffingPlan}
                  onChange={(e) => setSubmissionData(prev => ({ ...prev, staffingPlan: e.target.value }))}
                  className="mt-2"
                />
              </div>

              {/* Optional: Shift Availability */}
              <div>
                <Label>Shift Availability (Optional)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {SHIFT_AVAILABILITY.map((shift) => (
                    <div key={shift} className="flex items-center space-x-2">
                      <Checkbox
                        id={`shift-${shift}`}
                        checked={submissionData.shiftAvailability?.includes(shift)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSubmissionData(prev => ({ 
                              ...prev, 
                              shiftAvailability: [...(prev.shiftAvailability || []), shift]
                            }));
                          } else {
                            setSubmissionData(prev => ({ 
                              ...prev, 
                              shiftAvailability: (prev.shiftAvailability || []).filter(s => s !== shift)
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={`shift-${shift}`} className="text-sm">{shift}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsSubmissionDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitProposal}
                  disabled={isSubmitting || submissionData.coverNote.length < 300}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Proposal
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
