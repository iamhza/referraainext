'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Hourglass, UserCheck, CheckCircle, XCircle, AlertCircle, Clock, Users, Mail, Phone, Building, ChevronRight, MessageSquare, FileText, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { BackButton } from '@/components/ui/BackButton';
import Link from 'next/link';

const BRAND_COLOR = '#81D8D0'; // Tiffany Blue

const statusConfigs: Record<string, {
  label: string;
  color: string;
  icon: any;
  description: string;
}> = {
  under_review: {
    label: 'Under Review',
    color: 'amber',
    icon: Hourglass,
    description: 'This referral is under admin review.'
  },
  provider_selection_required: {
    label: 'Provider Selection Required',
    color: 'secondary',
    icon: UserCheck,
    description: 'Select a provider for this referral.'
  },
  in_progress: {
    label: 'In Progress',
    color: 'green',
    icon: Clock,
    description: 'Service is currently being provided.'
  },
  completed: {
    label: 'Completed',
    color: 'secondary',
    icon: CheckCircle,
    description: 'Service has been completed.'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'red',
    icon: XCircle,
    description: 'This referral has been cancelled.'
  }
};

export default function AdminReferralDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const [referral, setReferral] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCaseManager, setSelectedCaseManager] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');

  useEffect(() => {
    async function fetchReferral() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/referrals/${id}`);
        if (!res.ok) throw new Error('Failed to fetch referral');
        const data = await res.json();
        setReferral(data.referral);
        setSelectedStatus(data.referral.status);
        setSelectedCaseManager(data.referral.assignedCaseManager || '');
        setSelectedProvider(data.referral.assignedProvider || '');
      } catch (err) {
        setError('Could not load referral.');
      } finally {
        setLoading(false);
      }
    }
    fetchReferral();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading referral...</div>;
  if (error || !referral) return <div className="p-8 text-center text-red-500">{error || 'Referral not found.'}</div>;

  const statusConfig = statusConfigs[referral.status] || statusConfigs['under_review'];
  const StatusIcon = statusConfig.icon;

  // Fallbacks for missing fields
  const client = referral.clientInfo || referral.client || {};
  const service = referral.serviceDetails || referral.service || {};
  const notesArr = referral.notes || referral.internalNotes || [];
  const activityArr = referral.activity || referral.timeline || [];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 animate-fade-in">
      <div className="mb-4">
        <Button variant="outline" asChild>
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      <BackButton fallback="/admin/referrals" />
      {/* Status Banner */}
      <Card className={cn(
        'mb-8 border-l-8',
        `border-l-${statusConfig.color}-400`,
        'shadow-md bg-gradient-to-r from-white to-gray-50/80'
      )}>
        <CardContent className="p-6 flex items-center gap-4">
          <StatusIcon className={cn('h-8 w-8', `text-${statusConfig.color}-500`)} />
          <div>
            <h2 className="text-xl font-bold mb-1">{statusConfig.label}</h2>
            <p className="text-sm text-muted-foreground">{statusConfig.description}</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
              <DialogTrigger asChild>
                <Button variant="outline" className={`border-[${BRAND_COLOR}] text-[${BRAND_COLOR}] hover:bg-[${BRAND_COLOR}] hover:text-white transition-colors`}>Change Status</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Referral Status</DialogTitle>
                  <DialogDescription>Select a new status for this referral.</DialogDescription>
                </DialogHeader>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full mt-4">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfigs).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DialogFooter className="mt-6">
                  <Button variant="default" onClick={() => setShowStatusModal(false)}>Confirm</Button>
                  <Button variant="ghost" onClick={() => setShowStatusModal(false)}>Cancel</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-gray-300">Assign</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Case Manager & Provider</DialogTitle>
                  <DialogDescription>Select a case manager and provider for this referral.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Case Manager</label>
                    <Select value={selectedCaseManager} onValueChange={setSelectedCaseManager}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select case manager" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Add case managers to the select options */}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Provider</label>
                    <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Add providers to the select options */}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button variant="default" onClick={() => setShowAssignModal(false)}>Confirm</Button>
                  <Button variant="ghost" onClick={() => setShowAssignModal(false)}>Cancel</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Referral Details */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Referral Details</CardTitle>
              <CardDescription>All information about this referral</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold text-gray-900">Client</h4>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Users className="h-4 w-4" /> {client.firstName || client.name} {client.lastName || ''}
                  </div>
                  {client.email && <div className="flex items-center gap-2 text-gray-700"><Mail className="h-4 w-4" /> {client.email}</div>}
                  {client.phone && <div className="flex items-center gap-2 text-gray-700"><Phone className="h-4 w-4" /> {client.phone}</div>}
                  {client.address && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Building className="h-4 w-4" /> {
                        typeof client.address === 'string'
                          ? client.address
                          : [client.address.street, client.address.city, client.address.state, client.address.zipCode]
                              .filter(Boolean)
                              .join(', ')
                      }
                    </div>
                  )}
                  {client.county && <div className="flex items-center gap-2 text-gray-700"><Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{client.county} County</Badge></div>}
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold text-gray-900">Service</h4>
                  <div className="flex items-center gap-2 text-gray-700">
                    <FileText className="h-4 w-4" /> {service.type}
                  </div>
                  {service.urgency && <div className="flex items-center gap-2 text-gray-700"><Badge variant="outline" className="bg-red-100 text-red-700">{service.urgency.charAt(0).toUpperCase() + service.urgency.slice(1)} Priority</Badge></div>}
                  {service.additionalNotes && <div className="text-gray-700 text-sm">{service.additionalNotes}</div>}
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-8 mt-4">
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold text-gray-900">Assigned Case Manager</h4>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Users className="h-4 w-4" /> {referral.assignedCaseManager || '-'}
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold text-gray-900">Assigned Provider</h4>
                  <div className="flex items-center gap-2 text-gray-700">
                    <UserCheck className="h-4 w-4" /> {referral.assignedProvider?.name || referral.assignedProvider || '-'}
                  </div>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-8 mt-4">
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold text-gray-900">Created</h4>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="h-4 w-4" /> {referral.createdAt ? format(new Date(referral.createdAt), 'MMM d, yyyy, h:mm a') : '-'}
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold text-gray-900">Last Updated</h4>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="h-4 w-4" /> {referral.updatedAt ? format(new Date(referral.updatedAt), 'MMM d, yyyy, h:mm a') : '-'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Internal notes for this referral</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {Array.isArray(notesArr) && notesArr.length > 0 ? notesArr.map((note: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-400 mt-1" />
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{note.author || note.user || '-'}</div>
                      <div className="text-xs text-muted-foreground">{note.date ? format(new Date(note.date), 'MMM d, yyyy, h:mm a') : '-'}</div>
                      <div className="text-sm text-gray-700 mt-1">{note.content || note.text || note.message || '-'}</div>
                    </div>
                  </div>
                )) : <div className="text-muted-foreground text-sm">No notes yet.</div>}
              </div>
              {/* Add note form (optional, not wired up) */}
              {/* <form className="flex gap-2 mt-4">
                <Textarea
                  placeholder="Add a note..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="flex-1"
                  rows={2}
                />
                <Button type="button" variant="default" className="self-end">Add Note</Button>
              </form> */}
            </CardContent>
          </Card>
        </div>

        {/* Right: Activity Log */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>All actions for this referral</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.isArray(activityArr) && activityArr.length > 0 ? activityArr.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-gray-100 text-gray-700">
                    {item.actor || item.user || '-'}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-800">{item.action || item.status || '-'}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{item.date ? format(new Date(item.date), 'MMM d, yyyy, h:mm a') : '-'}</span>
                </div>
              )) : <div className="text-muted-foreground text-sm">No activity yet.</div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 