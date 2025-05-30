'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Clock, CheckCircle, Calendar, X, MessageSquare, ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ReferralComments } from '@/components/referrals/ReferralComments';
import { ReferralTasks } from '@/components/referrals/ReferralTasks';
import { createBrowserClient } from '@supabase/ssr';
import { BackButton } from '@/components/ui/BackButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function ProviderReferralTracker({ params }: { params: { referralId: string } }) {
  const [showMessages, setShowMessages] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [referral, setReferral] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    async function getSessionAndFetch() {
      setAuthLoading(true);
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAuthLoading(false);
        setProviderId(null);
        return;
      }
      setProviderId(session.user.id);
      setAuthLoading(false);
    }
    getSessionAndFetch();
  }, []);

  useEffect(() => {
    if (!providerId) return;
    async function fetchReferral() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/referrals/${params.referralId}`);
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
  }, [params.referralId, providerId]);

  // Determine if messaging is allowed
  const caseManagerAssigned = !!referral.caseManager?.id;
  const canMessage =
    (referral.status === 'in_progress' && caseManagerAssigned) ||
    (referral.status === 'provider_selection_required' && caseManagerAssigned);

  // Fetch messages for this referral
  useEffect(() => {
    if (!canMessage || !showChat) return;
    let isMounted = true;
    async function fetchMessages() {
      setChatLoading(true);
      setChatError(null);
      try {
        const res = await fetch(`/api/messages?referralId=${params.referralId}`);
        if (!res.ok) throw new Error('Failed to fetch messages');
        const data = await res.json();
        if (isMounted) setMessages(data.messages);
      } catch (err) {
        if (isMounted) setChatError('Could not load messages.');
      } finally {
        if (isMounted) setChatLoading(false);
      }
    }
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [canMessage, showChat, params.referralId]);

  if (authLoading) return <div className="p-8 text-center text-muted-foreground">Checking authentication...</div>;
  if (!providerId) return <div className="p-8 text-center text-red-500">Please log in as a provider to view this referral.</div>;

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading referral...</div>;
  if (error || !referral) return <div className="p-8 text-center text-red-500">{error || 'Referral not found.'}</div>;

  async function handleSendMessage() {
    if (!messageInput.trim() || !providerId) return;
    try {
      const toUserId = referral.caseManager?.id;
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId,
          content: messageInput,
          referralId: params.referralId,
        }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      setMessageInput('');
      // Refresh messages
      const data = await res.json();
      setMessages((msgs: any[]) => [...msgs, data.message]);
    } catch (err) {
      setChatError('Failed to send message.');
    }
  }

  return (
    <div>
      <BackButton fallback="/provider/referrals" />
      <DashboardLayout>
        <div className="container mx-auto p-4 md:p-6">
          <Button variant="ghost" size="sm" className="mb-6" asChild>
            <Link href="/provider/referrals" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to referrals
            </Link>
          </Button>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Referral Tracker</h1>
              <p className="text-gray-500">Track the progress of referral #{referral.id}</p>
            </div>
            {canMessage && (
              <Button onClick={() => setShowChat(true)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Message Case Manager
              </Button>
            )}
          </div>

          {/* Progress Overview */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Progress Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm text-muted-foreground">{referral.progressPercentage}%</span>
                  </div>
                  <Progress value={referral.progressPercentage} className="h-2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium">Next Milestone</h3>
                    <p className="text-sm text-muted-foreground">{referral.nextMilestone.title}</p>
                    <p className="text-sm text-muted-foreground">{referral.nextMilestone.date}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Case Manager</h3>
                    <p className="text-sm text-muted-foreground">{referral.caseManager.name}</p>
                    <p className="text-sm text-muted-foreground">{referral.caseManager.email}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {referral.recentActivity.map((activity: any, index: number) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      {activity.actor === "provider" ? (
                        <User className="h-4 w-4 text-gray-600" />
                      ) : activity.actor === "case_manager" ? (
                        <User className="h-4 w-4 text-gray-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tasks Checklist */}
          <ReferralTasks referralId={params.referralId as string} />

          {/* Comments Feed */}
          <ReferralComments referralId={params.referralId as string} />

          {/* Chat Modal */}
          <Dialog open={showChat} onOpenChange={setShowChat}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Chat with Case Manager</DialogTitle>
                <DialogDescription>Messages are private and secure.</DialogDescription>
              </DialogHeader>
              <div className="h-64 overflow-y-auto bg-gray-50 rounded p-2 mb-2 border">
                {chatLoading ? (
                  <div className="text-center text-muted-foreground py-8">Loading messages...</div>
                ) : chatError ? (
                  <div className="text-center text-red-500 py-8">{chatError}</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">No messages yet.</div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={msg._id || idx} className={msg.fromUserId === providerId ? 'text-right' : 'text-left'}>
                      <div className={
                        'inline-block px-3 py-2 rounded-lg mb-2 ' +
                        (msg.fromUserId === providerId ? 'bg-blue-100 text-blue-900' : 'bg-gray-200 text-gray-800')
                      }>
                        {msg.content}
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {new Date(msg.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Textarea
                  className="flex-1"
                  placeholder="Type your message..."
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  rows={2}
                />
                <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                  Send
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </div>
  );
} 