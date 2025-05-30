'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ProviderSettingsPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState({ email: true, sms: false });

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
  const handleNotifChange = (type: 'email' | 'sms', value: boolean) => setNotificationPrefs((prev) => ({ ...prev, [type]: value }));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await fetch('/api/providers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, userId: user.id })
      });
      toast({ title: 'Settings saved', description: 'Your settings have been updated successfully.' });
    } finally {
      setSaving(false);
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
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="fullName">Full Name</label>
            <Input name="fullName" id="fullName" value={form.fullName || ''} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
            <Input name="email" id="email" value={form.email || ''} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="phone">Phone</label>
            <Input name="phone" id="phone" value={form.phone || ''} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email Notifications</label>
            <Switch checked={notificationPrefs.email} onCheckedChange={v => handleNotifChange('email', v)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">SMS Notifications</label>
            <Switch checked={notificationPrefs.sms} onCheckedChange={v => handleNotifChange('sms', v)} />
          </div>
          <Button onClick={handleSave} disabled={saving} className="mt-4">Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
} 