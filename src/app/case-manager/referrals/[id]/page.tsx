'use client';

import { useParams } from 'next/navigation';
import { PageTemplate } from '@/components/templates/page-template';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  Clock4
} from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { cn } from '@/lib/utils';

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
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  // This would come from your API/database
  const referral = {
    id: params.id,
    clientName: 'John Doe',
    clientId: 'CLIENT-789',
    service: 'Medical Care',
    status: 'provider_selection_required' as ReferralStatus, // Change this to test different statuses
    statusText: 'Provider Selection Required',
    submittedDate: '2024-04-15T10:30:00Z',
    expectedReviewCompletion: '2024-04-17T10:30:00Z',
    urgent: true,
    notes: 'Client requires immediate medical attention for chronic condition management.',
    timeline: [
      {
        date: '2024-04-15T10:30:00Z',
        status: 'Submitted',
        description: 'Referral submitted by Case Manager'
      },
      {
        date: '2024-04-15T10:35:00Z',
        status: 'Under Review',
        description: 'Referral received by admin team for processing'
      },
      {
        date: '2024-04-16T14:20:00Z',
        status: 'Providers Matched',
        description: 'Admin team has matched suitable providers'
      }
    ],
    matchedProviders: [
      {
        id: 'PROV-1',
        name: 'Dr. Sarah Williams',
        organization: 'HealthFirst Clinic',
        matchScore: 95,
        distance: '2.3 miles away',
        availability: 'High',
        waitTime: '2-3 days',
        phone: '(612) 555-0123',
        email: 'swilliams@healthfirst.com',
        address: '123 Medical Center Dr, Minneapolis, MN 55401'
      },
      {
        id: 'PROV-2',
        name: 'Dr. Michael Chen',
        organization: 'Community Health Partners',
        matchScore: 88,
        distance: '3.7 miles away',
        availability: 'Medium',
        waitTime: '4-5 days',
        phone: '(612) 555-0124',
        email: 'mchen@chpartners.com',
        address: '456 Healthcare Ave, Minneapolis, MN 55402'
      }
    ],
    selectedProvider: {
      id: 'PROV-1',
      name: 'Dr. Sarah Williams',
      organization: 'HealthFirst Clinic',
      phone: '(612) 555-0123',
      email: 'swilliams@healthfirst.com',
      address: '123 Medical Center Dr, Minneapolis, MN 55401',
      nextAppointment: '2024-04-20T14:00:00Z',
      appointmentHistory: [
        {
          date: '2024-04-20T14:00:00Z',
          status: 'scheduled',
          type: 'Initial Consultation'
        }
      ]
    }
  };

  const getStatusConfig = (status: ReferralStatus) => {
    const configs = {
      under_review: {
        icon: Clock,
        color: 'amber',
        label: 'Under Admin Review',
        description: `Expected completion by ${new Date(referral.expectedReviewCompletion).toLocaleDateString()}`
      },
      provider_selection_required: {
        icon: AlertCircle,
        color: 'blue',
        label: 'Provider Selection Required',
        description: 'Please select a provider from the matched options'
      },
      in_progress: {
        icon: Clock4,
        color: 'green',
        label: 'In Progress',
        description: 'Service is currently being provided'
      },
      completed: {
        icon: CheckCircle,
        color: 'green',
        label: 'Completed',
        description: 'Service has been completed'
      },
      cancelled: {
        icon: XCircle,
        color: 'red',
        label: 'Cancelled',
        description: 'This referral has been cancelled'
      }
    };

    return configs[status];
  };

  const handleProviderSelection = async (providerId: string) => {
    // API call to select provider
    setSelectedProvider(providerId);
  };

  const handleConfirmSelection = async () => {
    if (!selectedProvider) return;
    // API call to confirm provider selection
    // After successful API call, redirect to active tracking page
    window.location.href = `/case-manager/referrals/${params.id}/active`;
  };

  const handleAddNote = async (note: string) => {
    // API call to add a note
  };

  const handleCancelReferral = async () => {
    // API call to cancel referral
    setShowCancelDialog(false);
  };

  const statusConfig = getStatusConfig(referral.status);

  return (
    <PageTemplate
      title={`Referral ${referral.id}`}
      description="View and manage referral details"
    >
      {/* Status Banner */}
      <Card className={cn(
        "mb-6 border-l-4",
        `border-l-${statusConfig.color}-500`
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {statusConfig.icon && <statusConfig.icon className={cn("h-5 w-5", `text-${statusConfig.color}-500`)} />}
              <div>
                <h3 className="font-medium">{statusConfig.label}</h3>
                <p className="text-sm text-muted-foreground">
                  {statusConfig.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {referral.urgent && (
                <Badge variant="destructive">Urgent</Badge>
              )}
              {referral.status === 'under_review' && (
                <Button variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Admin
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Main Content */}
          <Card>
            <CardHeader>
              <CardTitle>Referral Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Client Name</h4>
                  <p className="mt-1">{referral.clientName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Client ID</h4>
                  <p className="mt-1">{referral.clientId}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Service Type</h4>
                  <p className="mt-1">{referral.service}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Submitted Date</h4>
                  <p className="mt-1">{new Date(referral.submittedDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
                <p className="mt-1">{referral.notes}</p>
              </div>
            </CardContent>
          </Card>

          {/* Provider Selection (only shown when status is provider_selection_required) */}
          {referral.status === 'provider_selection_required' && (
            <Card>
              <CardHeader>
                <CardTitle>Matched Providers</CardTitle>
                <CardDescription>Select a provider from the matches below</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {referral.matchedProviders.map((provider) => (
                  <div 
                    key={provider.id}
                    className={cn(
                      "border rounded-lg p-4",
                      "transition-all duration-200",
                      selectedProvider === provider.id && "border-blue-500 bg-blue-50/50"
                    )}
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-lg">{provider.name}</h3>
                            <Badge className="bg-green-100 text-green-800">
                              {provider.matchScore}% Match
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{provider.organization}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {provider.distance}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Wait: {provider.waitTime}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {provider.availability} availability
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            {provider.phone}
                          </p>
                          <p className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {provider.email}
                          </p>
                          <p className="flex items-center gap-2">
                            <Building className="h-3 w-3" />
                            {provider.address}
                          </p>
                        </div>
                      </div>
                      <div className="flex md:flex-col gap-2">
                        <Button
                          variant={selectedProvider === provider.id ? "default" : "outline"}
                          onClick={() => handleProviderSelection(provider.id)}
                          className="flex-1 md:flex-none"
                        >
                          {selectedProvider === provider.id ? "Selected" : "Select Provider"}
                        </Button>
                        <Button variant="outline" className="flex-1 md:flex-none">
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end">
                  <Button
                    disabled={!selectedProvider}
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleConfirmSelection}
                  >
                    Confirm Selection
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Provider Details (only shown when status is in_progress) */}
          {referral.status === 'in_progress' && referral.selectedProvider && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Provider</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-lg">{referral.selectedProvider.name}</h3>
                    <p className="text-sm text-muted-foreground">{referral.selectedProvider.organization}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Contact Provider
                  </Button>
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    {referral.selectedProvider.phone}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    {referral.selectedProvider.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <Building className="h-3 w-3" />
                    {referral.selectedProvider.address}
                  </p>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-2">Upcoming Appointment</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(referral.selectedProvider.nextAppointment).toLocaleDateString()}{' '}
                      at {new Date(referral.selectedProvider.nextAppointment).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {referral.timeline.map((event, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                    <div>
                      <p className="font-medium">{event.status}</p>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Note
              </Button>
              {referral.status !== 'completed' && referral.status !== 'cancelled' && (
                <Button 
                  className="w-full" 
                  variant="destructive"
                  onClick={() => setShowCancelDialog(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Referral
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm">
              <ul className="list-disc pl-4 space-y-2">
                {referral.status === 'under_review' && (
                  <>
                    <li>Admin team is reviewing your referral</li>
                    <li>They will match suitable providers based on the requirements</li>
                    <li>You'll be notified when providers are ready for selection</li>
                    <li>Expected completion: {new Date(referral.expectedReviewCompletion).toLocaleDateString()}</li>
                  </>
                )}
                {referral.status === 'provider_selection_required' && (
                  <>
                    <li>Review the matched providers above</li>
                    <li>Compare their match scores, availability, and location</li>
                    <li>Select the most suitable provider for your client</li>
                    <li>The selected provider will be notified after confirmation</li>
                  </>
                )}
                {referral.status === 'in_progress' && (
                  <>
                    <li>Monitor the client's progress with the provider</li>
                    <li>Add notes for important updates or concerns</li>
                    <li>Contact the provider directly for any questions</li>
                    <li>The provider will update the status as needed</li>
                  </>
                )}
                {referral.status === 'completed' && (
                  <>
                    <li>This referral has been completed</li>
                    <li>You can view the full history in the timeline</li>
                    <li>Create a new referral if additional services are needed</li>
                  </>
                )}
                {referral.status === 'cancelled' && (
                  <>
                    <li>This referral has been cancelled</li>
                    <li>Create a new referral if needed</li>
                  </>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Referral</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this referral? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">
              Please provide a reason for cancellation
            </label>
            <Textarea
              className="mt-2"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter cancellation reason..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCancelReferral}>
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTemplate>
  );
} 