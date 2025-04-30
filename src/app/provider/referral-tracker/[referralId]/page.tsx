'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Clock, CheckCircle, Calendar, X, MessageSquare, ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ProviderReferralTracker({ params }: { params: { referralId: string } }) {
  const [showMessages, setShowMessages] = useState(false);
  const [messageInput, setMessageInput] = useState('');

  // Mock referral data
  const referral = {
    id: params.referralId,
    client: "John Smith",
    status: "in_progress",
    serviceType: "Mental Health Counseling",
    urgency: "high",
    createdAt: "2025-04-10",
    startedAt: "2025-04-12",
    estimatedCompletionDate: "2025-05-12",
    progressPercentage: 40,
    caseManager: {
      name: "Michael Johnson",
      email: "mjohnson@agency.example.com",
      phone: "(651) 555-7890"
    },
    nextMilestone: {
      title: "Initial Assessment",
      date: "2025-04-15",
      status: "upcoming"
    },
    recentActivity: [
      {
        type: "message",
        description: "Case manager sent a message",
        timestamp: "2025-04-13 14:30",
        actor: "case_manager"
      },
      {
        type: "milestone",
        description: "Intake paperwork completed",
        timestamp: "2025-04-12 10:15",
        actor: "provider"
      },
      {
        type: "status_change",
        description: "Service started",
        timestamp: "2025-04-12 09:00",
        actor: "system"
      }
    ],
    messages: [
      {
        id: 1,
        sender: "case_manager",
        name: "Michael Johnson",
        message: "Client has completed all intake forms. Ready to schedule initial assessment.",
        timestamp: "2025-04-13 14:30"
      },
      {
        id: 2,
        sender: "provider",
        name: "Dr. Sarah Williams",
        message: "Great, I have availability this Friday at 2 PM or Monday at 10 AM.",
        timestamp: "2025-04-13 15:15"
      }
    ]
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    // Handle message sending
    setMessageInput('');
  };

  return (
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
          <Button onClick={() => setShowMessages(!showMessages)}>
            <MessageSquare className="mr-2 h-4 w-4" />
            {showMessages ? "Hide Messages" : "Show Messages"}
          </Button>
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
              {referral.recentActivity.map((activity, index) => (
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

        {/* Messages Section */}
        {showMessages && (
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Messages List */}
                <div className="space-y-4 mb-4">
                  {referral.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender === 'provider' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`rounded-lg p-3 max-w-[80%] ${
                          message.sender === 'provider'
                            ? 'bg-blue-50 text-blue-900'
                            : 'bg-gray-100'
                        }`}
                      >
                        <p className="text-sm font-medium">{message.name}</p>
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage}>Send</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
} 