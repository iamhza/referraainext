'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Edit2, Save, X, Calendar, BedDouble, Users as UsersIcon, Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProviderProfilePage() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Calculate available beds for capacity-based (must be before any early returns)
  const availableBeds = useMemo(() => {
    if (form.type !== 'capacity') return null;
    const total = Number(form.capacity?.totalBeds) || 0;
    const occupied = Number(form.capacity?.occupiedBeds) || 0;
    return Math.max(total - occupied, 0);
  }, [form]);

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

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading profile...</div>;
  if (!user) return <div className="p-8 text-center text-red-500">Not authenticated.</div>;

  // Profile completion logic
  const fields = [
    'fullName', 'bio', 'specialties', 'credentials', 'email', 'phone', 'address', 'experience', 'education', 'languages', 'availability', 'insurances', 'photoUrl'
  ];
  const completed = fields.filter(f => profile && profile[f] && profile[f].length > 0).length;
  const completion = Math.round((completed / fields.length) * 100);

  // Helper for days of week
  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  // Add slot for unit-based availability
  const handleAddSlot = () => {
    setForm((prev: any) => ({
      ...prev,
      availability: [
        ...(prev.availability || []),
        { day: 'Monday', start: '08:00', end: '17:00', maxClients: 1 }
      ]
    }));
  };
  // Remove slot
  const handleRemoveSlot = (idx: number) => {
    setForm((prev: any) => ({
      ...prev,
      availability: prev.availability.filter((_: any, i: number) => i !== idx)
    }));
  };
  // Update slot
  const handleSlotChange = (idx: number, field: string, value: any) => {
    setForm((prev: any) => {
      const updated = [...(prev.availability || [])];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, availability: updated };
    });
  };
  // Update capacity fields
  const handleCapacityChange = (field: string, value: any) => {
    setForm((prev: any) => ({
      ...prev,
      capacity: { ...prev.capacity, [field]: value }
    }));
  };

  // Handlers
  const handleEdit = () => setEditMode(true);
  const handleCancel = () => { setEditMode(false); setForm(profile); };
  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/providers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, userId: user.id })
      });
      if (!res.ok) throw new Error('Failed to save profile');
      const data = await res.json();
      setProfile(data.provider || form);
      setEditMode(false);
    } catch (err) {
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 animate-fade-in">
      <div className="mb-4">
        <Button variant="outline" asChild>
          <Link href="/provider">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      <Card className="mb-8 shadow-lg">
        <CardContent className="flex flex-col md:flex-row items-center gap-6 p-8">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile?.photoUrl} alt={profile?.fullName || user.email} />
            <AvatarFallback>{profile?.fullName?.[0] || user.email?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">{profile?.fullName || 'Provider'}</h2>
            <div className="flex flex-wrap gap-2 mb-2">
              {profile?.credentials && <Badge variant="outline">{profile.credentials}</Badge>}
              {profile?.specialties && profile.specialties.split(',').map((s: string) => <Badge key={s} variant="secondary">{s.trim()}</Badge>)}
            </div>
            <p className="text-gray-600 mb-2">{profile?.bio || 'No bio yet.'}</p>
            <div className="flex items-center gap-2">
              <Progress value={completion} className="w-40 h-2" />
              <span className="text-xs text-gray-500">Profile {completion}% complete</span>
            </div>
          </div>
          <div>
            {!editMode && <Button variant="outline" onClick={handleEdit}><Edit2 className="h-4 w-4 mr-1" /> Edit</Button>}
          </div>
        </CardContent>
      </Card>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Contact & Practice Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {editMode ? (
            <>
              <label className="block text-sm font-medium mb-1" htmlFor="fullName">Full Name</label>
              <Input name="fullName" id="fullName" placeholder="Full Name" value={form.fullName || ''} onChange={handleChange} className="mb-2" />
              <label className="block text-sm font-medium mb-1" htmlFor="bio">Bio</label>
              <Textarea name="bio" id="bio" placeholder="A brief professional bio" value={form.bio || ''} onChange={handleChange} className="mb-2" />
              <label className="block text-sm font-medium mb-1" htmlFor="credentials">Credentials</label>
              <Input name="credentials" id="credentials" placeholder="Credentials (e.g., MD, LCSW)" value={form.credentials || ''} onChange={handleChange} className="mb-2" />
              <label className="block text-sm font-medium mb-1" htmlFor="specialties">Specialties</label>
              <Input name="specialties" id="specialties" placeholder="Specialties (comma separated)" value={form.specialties || ''} onChange={handleChange} className="mb-2" />
              <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
              <Input name="email" id="email" placeholder="Email" value={form.email || ''} onChange={handleChange} className="mb-2" />
              <label className="block text-sm font-medium mb-1" htmlFor="phone">Phone</label>
              <Input name="phone" id="phone" placeholder="Phone" value={form.phone || ''} onChange={handleChange} className="mb-2" />
              <label className="block text-sm font-medium mb-1" htmlFor="address">Address</label>
              <Input name="address" id="address" placeholder="Address" value={form.address || ''} onChange={handleChange} className="mb-2" />
              <label className="block text-sm font-medium mb-1" htmlFor="website">Website</label>
              <Input name="website" id="website" placeholder="Website" value={form.website || ''} onChange={handleChange} className="mb-2" />
            </>
          ) : (
            <>
              <div><span className="font-semibold">Email:</span> {profile?.email || user.email}</div>
              <div><span className="font-semibold">Phone:</span> {profile?.phone || '—'}</div>
              <div><span className="font-semibold">Address:</span> {profile?.address || '—'}</div>
              <div><span className="font-semibold">Website:</span> {profile?.website || '—'}</div>
            </>
          )}
        </CardContent>
      </Card>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Professional Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {editMode ? (
            <>
              <label className="block text-sm font-medium mb-1" htmlFor="experience">Experience</label>
              <Textarea name="experience" id="experience" placeholder="Experience" value={form.experience || ''} onChange={handleChange} className="mb-2" />
              <label className="block text-sm font-medium mb-1" htmlFor="education">Education</label>
              <Textarea name="education" id="education" placeholder="Education" value={form.education || ''} onChange={handleChange} className="mb-2" />
              <label className="block text-sm font-medium mb-1" htmlFor="languages">Languages</label>
              <Input name="languages" id="languages" placeholder="Languages (comma separated)" value={form.languages || ''} onChange={handleChange} className="mb-2" />
              <label className="block text-sm font-medium mb-1" htmlFor="insurances">Insurances Accepted</label>
              <Input name="insurances" id="insurances" placeholder="Insurances (comma separated)" value={form.insurances || ''} onChange={handleChange} className="mb-2" />
            </>
          ) : (
            <>
              <div><span className="font-semibold">Experience:</span> {profile?.experience || '—'}</div>
              <div><span className="font-semibold">Education:</span> {profile?.education || '—'}</div>
              <div><span className="font-semibold">Languages:</span> {profile?.languages || '—'}</div>
              <div><span className="font-semibold">Insurances Accepted:</span> {profile?.insurances || '—'}</div>
            </>
          )}
        </CardContent>
      </Card>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Availability & Capacity</CardTitle>
          <CardDescription>
            {form.type === 'capacity'
              ? 'Track your beds/slots and manage occupancy.'
              : 'Set your available hours and max clients per slot.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Type selector */}
          {editMode && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Provider Type</label>
              <select
                className="input input-bordered w-full"
                value={form.type || 'unit'}
                onChange={e => setForm((prev: any) => ({ ...prev, type: e.target.value }))}
              >
                <option value="unit">Unit-based (hourly/visit)</option>
                <option value="capacity">Capacity-based (beds/slots)</option>
              </select>
            </div>
          )}
          {/* Unit-based availability */}
          {form.type !== 'capacity' && (
            <div>
              <div className="flex items-center mb-2">
                <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                <span className="font-semibold">Available Time Slots</span>
                {editMode && (
                  <Button variant="ghost" size="sm" className="ml-auto" onClick={handleAddSlot}>
                    <Plus className="h-4 w-4 mr-1" /> Add Slot
                  </Button>
                )}
              </div>
              {(form.availability || []).length === 0 && <div className="text-gray-500">No slots set.</div>}
              <div className="space-y-2">
                {(form.availability || []).map((slot: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 bg-blue-50 rounded p-2">
                    {editMode ? (
                      <>
                        <select
                          className="input input-bordered"
                          value={slot.day}
                          onChange={e => handleSlotChange(idx, 'day', e.target.value)}
                        >
                          {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}
                        </select>
                        <Input
                          type="time"
                          value={slot.start}
                          onChange={e => handleSlotChange(idx, 'start', e.target.value)}
                          className="w-24"
                        />
                        <span>-</span>
                        <Input
                          type="time"
                          value={slot.end}
                          onChange={e => handleSlotChange(idx, 'end', e.target.value)}
                          className="w-24"
                        />
                        <Input
                          type="number"
                          min={1}
                          value={slot.maxClients}
                          onChange={e => handleSlotChange(idx, 'maxClients', e.target.value)}
                          className="w-20"
                          placeholder="Max"
                        />
                        <span className="text-xs text-gray-500">clients</span>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveSlot(idx)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold">{slot.day}</span>
                        <span>{slot.start} - {slot.end}</span>
                        <span className="ml-2">Max {slot.maxClients} clients</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Capacity-based availability */}
          {form.type === 'capacity' && (
            <div>
              <div className="flex items-center mb-2">
                <BedDouble className="h-5 w-5 mr-2 text-green-600" />
                <span className="font-semibold">Bed/Slot Capacity</span>
              </div>
              <div className="flex flex-wrap gap-4 items-center mb-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Total Beds/Slots</label>
                  <Input
                    type="number"
                    min={0}
                    value={form.capacity?.totalBeds || ''}
                    onChange={e => handleCapacityChange('totalBeds', e.target.value)}
                    className="w-24"
                    disabled={!editMode}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Occupied</label>
                  <Input
                    type="number"
                    min={0}
                    value={form.capacity?.occupiedBeds || ''}
                    onChange={e => handleCapacityChange('occupiedBeds', e.target.value)}
                    className="w-24"
                    disabled={!editMode}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Available</label>
                  <Input
                    type="number"
                    min={0}
                    value={availableBeds ?? ''}
                    readOnly
                    className="w-24 bg-gray-100"
                  />
                </div>
              </div>
              <div className="mb-2">
                <label className="block text-xs font-medium mb-1">Waitlist (comma separated)</label>
                <Input
                  type="text"
                  value={(form.capacity?.waitlist || []).join(', ')}
                  onChange={e => handleCapacityChange('waitlist', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
                  disabled={!editMode}
                />
              </div>
              <div className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-600">{availableBeds} beds/slots available</span>
                <Progress value={form.capacity?.totalBeds ? (100 * (availableBeds || 0) / form.capacity.totalBeds) : 0} className="w-32 h-2" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {editMode && (
        <div className="flex gap-2 justify-end">
          <Button variant="default" onClick={handleSave} disabled={saving}><Save className="h-4 w-4 mr-1" /> Save</Button>
          <Button variant="ghost" onClick={handleCancel}><X className="h-4 w-4 mr-1" /> Cancel</Button>
        </div>
      )}
    </div>
  );
} 