'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { EnhancedCollaborativeWorkspace } from '@/components/referrals/EnhancedCollaborativeWorkspace';
import { useReferralTimeline } from '@/hooks/use-referral-timeline';
import { useAuth } from '@/contexts/AuthContext';

export default function CaseManagerReferralWorkspace() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [referral, setReferral] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const referralId = typeof params?.id === 'string'
    ? params.id
    : Array.isArray(params?.id)
      ? params.id[0]
      : undefined;

  // Use the new timeline hook
  const {
    events,
    participants,
    recentlyViewed,
    loading: timelineLoading,
    error: timelineError,
    isSubscribed,
    addComment,
    addReaction,
    addTag,
    addAttachment,
    toggleSubscription,
    fetchTimeline
  } = useReferralTimeline(referralId as string);

  useEffect(() => {
    if (!referralId) return;
    
    async function fetchReferral() {
      setLoading(true);
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

  const handleStatusUpdate = async (newStatus: string) => {
    if (!referralId) return;
    
    try {
      const res = await fetch(`/api/referrals/${referralId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!res.ok) throw new Error('Failed to update status');
      
      // Refresh referral data
      const updatedRes = await fetch(`/api/referrals/${referralId}`);
      const data = await updatedRes.json();
      setReferral(data.referral);
      
      // Refresh timeline
      fetchTimeline();
      
      // Show success toast
      toast({
        title: 'Status updated',
        description: `Referral status has been updated to ${newStatus.replace(/_/g, ' ')}`,
      });
      
      return true;
    } catch (err) {
      toast({
        title: 'Error updating status',
        description: 'There was a problem updating the referral status',
        variant: 'destructive',
      });
      
      return false;
    }
  };

  const handleNewTask = async (task: any) => {
    if (!referralId) return;
    
    try {
      const res = await fetch(`/api/referrals/${referralId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      
      if (!res.ok) throw new Error('Failed to create task');
      
      // Refresh timeline
      fetchTimeline();
      
      toast({
        title: 'Task created',
        description: 'New task has been added to this referral',
      });
      
      return true;
    } catch (err) {
      toast({
        title: 'Error creating task',
        description: 'There was a problem creating the task',
        variant: 'destructive',
      });
      
      return false;
    }
  };

  const handleTaskComplete = async (taskId: string) => {
    if (!referralId) return;
    
    try {
      const res = await fetch(`/api/referrals/${referralId}/tasks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, completed: true }),
      });
      
      if (!res.ok) throw new Error('Failed to update task');
      
      // Refresh timeline
      fetchTimeline();
      
      toast({
        title: 'Task completed',
        description: 'The task has been marked as completed',
      });
      
      return true;
    } catch (err) {
      toast({
        title: 'Error updating task',
        description: 'There was a problem updating the task',
        variant: 'destructive',
      });
      
      return false;
    }
  };

  const handleViewEvent = async (eventId: string) => {
    // Implementation can be expanded later to track individual event views
    return;
  };

  const handleAssignUser = async (userId: string) => {
    if (!referralId) return;
    
    try {
      const res = await fetch(`/api/referrals/${referralId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      if (!res.ok) throw new Error('Failed to assign user');
      
      // Refresh referral data
      const updatedRes = await fetch(`/api/referrals/${referralId}`);
      const data = await updatedRes.json();
      setReferral(data.referral);
      
      // Refresh timeline
      fetchTimeline();
      
      toast({
        title: 'User assigned',
        description: 'The user has been assigned to this referral',
      });
      
      return true;
    } catch (err) {
      toast({
        title: 'Error assigning user',
        description: 'There was a problem assigning the user',
        variant: 'destructive',
      });
      
      return false;
    }
  };

  // Create current user object from authenticated user
  const currentUser = user ? {
    id: user.id,
    name: user.user_metadata?.name || user.email || 'Case Manager',
    avatar: user.user_metadata?.avatar_url,
    role: 'case_manager'
  } : {
    id: 'unknown',
    name: 'Case Manager',
    role: 'case_manager'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-500"></div>
      </div>
    );
  }

  if (error || !referral) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center gap-4">
        <AlertCircle className="h-16 w-16 text-red-500" />
        <h3 className="text-xl font-semibold text-gray-900">Error Loading Referral</h3>
        <p className="text-gray-600">{error || 'Referral not found.'}</p>
        <Button asChild>
          <Link href="/case-manager/referrals">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Referrals
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50/20">
      <div className="py-8 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="mb-6 flex items-center">
          <Button 
            variant="outline" 
            asChild
            className="mr-4 rounded-full border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group"
          >
            <Link href="/case-manager/referrals">
              <ArrowLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Back to Referrals
            </Link>
          </Button>
        </div>

        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Referral Collaboration
          </h1>
          
          <p className="text-gray-600 mb-6">
            This workspace provides collaborative features to manage this referral, including activity tracking, file sharing, and real-time collaboration.
          </p>
          
          <EnhancedCollaborativeWorkspace
            referralId={referralId as string}
            referral={referral}
            userRole="case_manager"
            currentUser={currentUser}
            onStatusUpdate={handleStatusUpdate}
            onNewTask={handleNewTask}
            onTaskComplete={handleTaskComplete}
            onNewComment={addComment}
            onAddReaction={addReaction}
            onAddAttachment={addAttachment}
            onTagEvent={addTag}
            onViewEvent={handleViewEvent}
            onAssignUser={handleAssignUser}
          />
        </div>
      </div>
    </div>
  );
} 