import { useState, useEffect, useCallback } from 'react';

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string;
  actor?: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  metadata?: Record<string, any>;
  comments?: any[];
  tags?: string[];
  attachments?: any[];
}

interface TimelineParticipant {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  online?: boolean;
}

interface TimelineView {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  timestamp: string;
}

export function useReferralTimeline(referralId: string) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [participants, setParticipants] = useState<TimelineParticipant[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<TimelineView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(true);

  const fetchTimeline = useCallback(async () => {
    if (!referralId) return;
    
    setLoading(true);
    try {
      // Fetch timeline events
      const eventsRes = await fetch(`/api/referrals/${referralId}/timeline`);
      if (!eventsRes.ok) throw new Error('Failed to fetch timeline');
      const eventsData = await eventsRes.json();
      setEvents(eventsData.events || []);
    } catch (err) {
      setError('Could not load timeline events.');
      console.error('Error fetching timeline:', err);
    } finally {
      setLoading(false);
    }
  }, [referralId]);

  const fetchParticipants = useCallback(async () => {
    if (!referralId) return;
    
    try {
      const res = await fetch(`/api/referrals/${referralId}/participants`);
      if (!res.ok) throw new Error('Failed to fetch participants');
      const data = await res.json();
      setParticipants(data.participants || []);
    } catch (err) {
      console.error('Error fetching participants:', err);
    }
  }, [referralId]);

  const fetchRecentViews = useCallback(async () => {
    if (!referralId) return;
    
    try {
      const res = await fetch(`/api/referrals/${referralId}/views`);
      if (!res.ok) throw new Error('Failed to fetch views');
      const data = await res.json();
      setRecentlyViewed(data.views || []);
    } catch (err) {
      console.error('Error fetching views:', err);
    }
  }, [referralId]);

  const recordView = useCallback(async () => {
    if (!referralId) return;
    
    try {
      await fetch(`/api/referrals/${referralId}/views`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.error('Error recording view:', err);
    }
  }, [referralId]);

  const toggleSubscription = useCallback(async () => {
    if (!referralId) return;
    
    try {
      const res = await fetch(`/api/referrals/${referralId}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscribed: !isSubscribed })
      });
      
      if (res.ok) {
        setIsSubscribed(!isSubscribed);
      }
    } catch (err) {
      console.error('Error toggling subscription:', err);
    }
  }, [referralId, isSubscribed]);

  const addComment = useCallback(async (
    eventId: string, 
    content: string, 
    attachments?: File[], 
    threadId?: string
  ) => {
    if (!referralId) return;
    
    try {
      const formData = new FormData();
      formData.append('eventId', eventId);
      formData.append('content', content);
      
      if (threadId) {
        formData.append('threadId', threadId);
      }
      
      if (attachments && attachments.length > 0) {
        attachments.forEach(file => {
          formData.append('attachments', file);
        });
      }
      
      const res = await fetch(`/api/referrals/${referralId}/comments`, {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) throw new Error('Failed to add comment');
      
      // Refresh timeline data
      fetchTimeline();
      
      return true;
    } catch (err) {
      console.error('Error adding comment:', err);
      return false;
    }
  }, [referralId, fetchTimeline]);

  const addReaction = useCallback(async (
    eventId: string, 
    commentId: string, 
    emoji: string
  ) => {
    if (!referralId) return;
    
    try {
      const res = await fetch(`/api/referrals/${referralId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, commentId, emoji })
      });
      
      if (!res.ok) throw new Error('Failed to add reaction');
      
      // Refresh timeline data
      fetchTimeline();
      
      return true;
    } catch (err) {
      console.error('Error adding reaction:', err);
      return false;
    }
  }, [referralId, fetchTimeline]);

  const addTag = useCallback(async (eventId: string, tag: string) => {
    if (!referralId) return;
    
    try {
      const res = await fetch(`/api/referrals/${referralId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, tag })
      });
      
      if (!res.ok) throw new Error('Failed to add tag');
      
      // Refresh timeline data
      fetchTimeline();
      
      return true;
    } catch (err) {
      console.error('Error adding tag:', err);
      return false;
    }
  }, [referralId, fetchTimeline]);

  const addAttachment = useCallback(async (eventId: string, files: File[]) => {
    if (!referralId || !files.length) return;
    
    try {
      const formData = new FormData();
      formData.append('eventId', eventId);
      
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const res = await fetch(`/api/referrals/${referralId}/attachments`, {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) throw new Error('Failed to add attachments');
      
      // Refresh timeline data
      fetchTimeline();
      
      return true;
    } catch (err) {
      console.error('Error adding attachments:', err);
      return false;
    }
  }, [referralId, fetchTimeline]);

  // Initial data fetch
  useEffect(() => {
    if (referralId) {
      fetchTimeline();
      fetchParticipants();
      recordView();
      fetchRecentViews();
    }
  }, [referralId, fetchTimeline, fetchParticipants, recordView, fetchRecentViews]);

  // Set up polling for real-time updates (every 30 seconds)
  useEffect(() => {
    if (!referralId) return;
    
    const interval = setInterval(() => {
      fetchTimeline();
      fetchParticipants();
      fetchRecentViews();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [referralId, fetchTimeline, fetchParticipants, fetchRecentViews]);

  return {
    events,
    participants,
    recentlyViewed,
    loading,
    error,
    isSubscribed,
    fetchTimeline,
    fetchParticipants,
    fetchRecentViews,
    addComment,
    addReaction,
    addTag,
    addAttachment,
    toggleSubscription
  };
} 