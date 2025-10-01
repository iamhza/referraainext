'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EnhancedLabel as Label } from '@/components/ui/enhanced-label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, UserPlus, Mail } from 'lucide-react';
import Link from 'next/link';

export default function InviteCaseManagerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    message: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast({
        title: "Validation Error",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/org/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          role: 'case_manager', // Supervisors can only invite case managers
          message: formData.message
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send invitation');
      }

      const result = await response.json();
      
      toast({
        title: "Invitation Sent!",
        description: `Case manager invitation sent to ${formData.email}`,
      });

      // Reset form
      setFormData({ email: '', message: '' });
      
      // Redirect to team page after short delay
      setTimeout(() => {
        router.push('/supervisor/team');
      }, 2000);
      
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/supervisor">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invite Case Manager</h1>
          <p className="text-gray-600">Add a new case manager to your team</p>
        </div>
      </div>

      <div className="max-w-2xl">
        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <UserPlus className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">Supervisor Invitation</h3>
                <p className="text-sm text-blue-700 mt-1">
                  As a supervisor, you can invite case managers to join your team. They will receive an email 
                  invitation to create their account and will be assigned to your supervision.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invitation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Send Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" required>Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="casemanager@example.com"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  The case manager will receive an invitation at this email address
                </p>
              </div>

              <div>
                <Label htmlFor="message">Personal Message (Optional)</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="Welcome to our team! I'm excited to work with you..."
                  rows={4}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Add a personal welcome message to the invitation email
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• The case manager will receive an email invitation</li>
                  <li>• They can create their account using the invitation link</li>
                  <li>• Once registered, they'll be assigned to your team</li>
                  <li>• You can then assign clients and manage their caseload</li>
                </ul>
              </div>

              <div className="flex justify-end gap-4">
                <Link href="/supervisor">
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Recent Invitations */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No recent invitations</p>
              <p className="text-sm">Invitations you send will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
