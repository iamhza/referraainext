'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ProviderSettingsPage() {
  const { user, loading, updateProfile } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

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

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Update profile data (excluding email)
      const { email, ...profileData } = form;
      await fetch('/api/providers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      
      // Update auth metadata for name/organization
      if (form.full_name || form.organization_name) {
        await updateProfile({
          fullName: form.full_name,
          organization: form.organization_name
        });
      }
      
      toast({ title: 'Settings saved', description: 'Your settings have been updated successfully.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChange = async () => {
    if (!user || !newEmail || !currentPassword) return;
    setChangingEmail(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });
      
      if (error) throw error;
      
      toast({ 
        title: 'Email change initiated', 
        description: 'Please check your new email for a confirmation link.' 
      });
      
      setNewEmail('');
      setCurrentPassword('');
      setChangingEmail(false);
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to change email. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setChangingEmail(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!user) return <div className="p-8 text-center text-red-500">Not authenticated.</div>;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 animate-fade-in">
      <div className="mb-4">
        <Button variant="outline" asChild>
          <Link href="/provider">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle>Provider Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="full_name">Full Name</label>
            <Input name="full_name" id="full_name" value={form.full_name || ''} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="phone">Phone</label>
            <Input name="phone" id="phone" value={form.phone || ''} onChange={handleChange} />
          </div>
          <Button onClick={handleSave} disabled={saving} className="mt-4">Save Settings</Button>
          
          {/* Email Change Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Change Email Address</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Current Email</label>
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">
                  {user?.email || 'No email set'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Email</label>
                <Input 
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter new email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Current Password</label>
                <Input 
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                />
              </div>
              <Button 
                onClick={handleEmailChange} 
                disabled={changingEmail || !newEmail || !currentPassword}
                variant="outline"
              >
                {changingEmail ? 'Changing Email...' : 'Change Email'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 