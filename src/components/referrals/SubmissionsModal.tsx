'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  MapPin, 
  Star, 
  Clock, 
  Users, 
  Award, 
  MessageSquare, 
  CheckCircle,
  Globe,
  Send,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  Building
} from 'lucide-react';
import { formatSafeDate } from '@/lib/shared/date-utils';

interface Submission {
  _id: string;
  providerId: string;
  coverNote: string;
  capacityFlag: boolean;
  earliestStartDate: string;
  serviceAreas: string[];
  languages: string[];
  credentials: string[];
  experienceTags: string[];
  contact: {
    name: string;
    email?: string;
    phone: string;
  };
  staffingPlan?: string;
  shiftAvailability?: string[];
  score: number;
  status: string;
  createdAt: string;
  // Enriched provider data (if available)
  provider?: {
    name: string;
    organization: string;
    profilePic?: string;
  };
}

interface NetworkSettings {
  isOpenToNetwork: boolean;
  networkExpiry: string;
}

interface SubmissionsModalProps {
  referralId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubmissionsModal({ referralId, open, onOpenChange }: SubmissionsModalProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [networkSettings, setNetworkSettings] = useState<NetworkSettings>({
    isOpenToNetwork: false,
    networkExpiry: ''
  });
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [askingQuestion, setAskingQuestion] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchSubmissions();
      fetchNetworkSettings();
    }
  }, [open, referralId]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/referrals/${referralId}/submissions`);
      if (!response.ok) throw new Error('Failed to fetch submissions');
      
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: "Error",
        description: "Failed to load submissions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNetworkSettings = async () => {
    try {
      const response = await fetch(`/api/referrals/${referralId}`);
      if (!response.ok) throw new Error('Failed to fetch referral');
      
      const data = await response.json();
      const referral = data.referral;
      
      setNetworkSettings({
        isOpenToNetwork: referral.isOpenToNetwork || false,
        networkExpiry: referral.networkExpiry || ''
      });
    } catch (error) {
      console.error('Error fetching network settings:', error);
    }
  };

  const handlePostToNetwork = async () => {
    try {
      setPosting(true);
      const response = await fetch(`/api/referrals/${referralId}/post-to-network`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          open: !networkSettings.isOpenToNetwork,
          expiryDays: 7
        }),
      });

      if (!response.ok) throw new Error('Failed to update network status');

      const result = await response.json();
      const referral = result.referral;
      setNetworkSettings({
        isOpenToNetwork: referral.isOpenToNetwork || false,
        networkExpiry: referral.networkExpiry || ''
      });

      toast({
        title: networkSettings.isOpenToNetwork ? "Removed from Network" : "Posted to Network",
        description: networkSettings.isOpenToNetwork 
          ? "This referral is no longer accepting submissions"
          : "This referral is now open for provider submissions",
      });

      if (!networkSettings.isOpenToNetwork) {
        // If we just posted to network, refresh submissions after a moment
        setTimeout(fetchSubmissions, 1000);
      }
    } catch (error) {
      console.error('Error posting to network:', error);
      toast({
        title: "Error",
        description: "Failed to update network status",
        variant: "destructive"
      });
    } finally {
      setPosting(false);
    }
  };

  const handleSelectProvider = async (submissionId: string, providerId: string) => {
    try {
      setSelecting(true);
      // Reuse existing assign-provider API
      const response = await fetch(`/api/referrals/${referralId}/assign-provider`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          status: 'confirmed',
          submissionId // Pass along for tracking
        }),
      });

      if (!response.ok) throw new Error('Failed to select provider');

      toast({
        title: "Provider Selected",
        description: "The provider has been assigned to this referral. You can now access the workspace.",
        action: (
          <Button size="sm" variant="outline" asChild>
            <a href={`/case-manager/referrals/${referralId}/workspace`}>
              Open Workspace
            </a>
          </Button>
        )
      });

      onOpenChange(false); // Close modal
    } catch (error) {
      console.error('Error selecting provider:', error);
      toast({
        title: "Error",
        description: "Failed to select provider",
        variant: "destructive"
      });
    } finally {
      setSelecting(false);
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const topSubmissions = submissions
    .filter(s => s.status === 'submitted')
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Referral Network & Submissions
          </DialogTitle>
          <DialogDescription>
            Manage network posting and review provider submissions for this referral.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Network Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Network Settings</CardTitle>
              <CardDescription>
                Control whether this referral accepts submissions from the provider network.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Switch
                    checked={networkSettings.isOpenToNetwork}
                    onCheckedChange={handlePostToNetwork}
                    disabled={posting}
                  />
                  <div>
                    <p className="font-medium">
                      {networkSettings.isOpenToNetwork ? 'Open to Network' : 'Private Referral'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {networkSettings.isOpenToNetwork 
                        ? `Accepting submissions until ${formatSafeDate(networkSettings.networkExpiry)}`
                        : 'Only manually assigned providers can access this referral'
                      }
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handlePostToNetwork}
                  disabled={posting}
                  variant={networkSettings.isOpenToNetwork ? "destructive" : "default"}
                >
                  {posting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Globe className="h-4 w-4 mr-2" />
                  )}
                  {networkSettings.isOpenToNetwork ? 'Remove from Network' : 'Post to Network'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Submissions List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Provider Submissions</CardTitle>
                  <CardDescription>
                    {topSubmissions.length > 0 
                      ? `${topSubmissions.length} submission${topSubmissions.length !== 1 ? 's' : ''} received (top 10 shown)`
                      : 'No submissions received yet'
                    }
                  </CardDescription>
                </div>
                <Button onClick={fetchSubmissions} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Loading submissions...</p>
                </div>
              ) : topSubmissions.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions Yet</h3>
                  <p className="text-gray-600 mb-4">
                    {networkSettings.isOpenToNetwork 
                      ? 'Providers will be able to submit proposals once they see this referral in the network.'
                      : 'Post this referral to the network to start receiving submissions from providers.'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topSubmissions.map((submission, index) => (
                    <Card key={submission._id} className="relative">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                              #{index + 1}
                            </div>
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {submission.contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{submission.contact.name}</h3>
                              <p className="text-sm text-gray-600">
                                {submission.provider?.organization || 'Independent Provider'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getScoreBadgeColor(submission.score)}>
                              <Star className="h-3 w-3 mr-1" />
                              {submission.score}/100
                            </Badge>
                            <Badge variant={submission.capacityFlag ? 'default' : 'secondary'}>
                              {submission.capacityFlag ? 'Available' : 'Limited'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {/* Quick Info */}
                        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            {formatSafeDate(submission.earliestStartDate)}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-4 w-4" />
                            {submission.serviceAreas.slice(0, 2).join(', ')}
                            {submission.serviceAreas.length > 2 && ` +${submission.serviceAreas.length - 2}`}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-4 w-4" />
                            {submission.contact.phone}
                          </div>
                        </div>

                        {/* Cover Note Preview */}
                        <div className="mb-4">
                          <p className="text-sm text-gray-800 line-clamp-3">
                            {submission.coverNote}
                          </p>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {submission.credentials.slice(0, 3).map((cred, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              <Award className="h-3 w-3 mr-1" />
                              {cred}
                            </Badge>
                          ))}
                          {submission.experienceTags.slice(0, 2).map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {(submission.credentials.length + submission.experienceTags.length > 5) && (
                            <Badge variant="outline" className="text-xs">
                              +{submission.credentials.length + submission.experienceTags.length - 5} more
                            </Badge>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpandedSubmission(
                              expandedSubmission === submission._id ? null : submission._id
                            )}
                          >
                            {expandedSubmission === submission._id ? (
                              <>
                                <ChevronUp className="h-4 w-4 mr-2" />
                                Hide Details
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4 mr-2" />
                                View Details
                              </>
                            )}
                          </Button>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAskingQuestion(submission._id)}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Ask Question
                            </Button>
                            <Button
                              onClick={() => handleSelectProvider(submission._id, submission.providerId)}
                              disabled={selecting}
                              size="sm"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Select Provider
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedSubmission === submission._id && (
                          <div className="mt-4 pt-4 border-t space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Full Cover Note</h4>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                                {submission.coverNote}
                              </p>
                            </div>
                            
                            {submission.staffingPlan && (
                              <div>
                                <h4 className="font-medium mb-2">Staffing Plan</h4>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                                  {submission.staffingPlan}
                                </p>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Languages</h4>
                                <div className="flex flex-wrap gap-1">
                                  {submission.languages.map((lang, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {lang}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              
                              {submission.shiftAvailability && submission.shiftAvailability.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">Shift Availability</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {submission.shiftAvailability.map((shift, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {shift}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
