'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  BedDouble,
  Users,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Settings,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Star,
  Activity,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface CapacitySettings {
  type: 'unit' | 'capacity';
  maxCapacity: number;
  currentCapacity: number;
  availabilityStatus: 'available' | 'limited' | 'unavailable';
  autoAcceptReferrals: boolean;
  maxAutoAccept: number;
  workingHours: Array<{
    day: string;
    start: string;
    end: string;
    available: boolean;
  }>;
  specialNotes: string;
  emergencyAvailable: boolean;
  waitlistEnabled: boolean;
}

interface CapacityStats {
  utilizationRate: number;
  avgResponseTime: number;
  completedThisWeek: number;
  pendingReferrals: number;
  weeklyTrend: number;
}

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export default function ProviderCapacityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<CapacitySettings>({
    type: 'unit',
    maxCapacity: 20,
    currentCapacity: 5,
    availabilityStatus: 'available',
    autoAcceptReferrals: false,
    maxAutoAccept: 5,
    workingHours: DAYS_OF_WEEK.map(day => ({
      day,
      start: '09:00',
      end: '17:00',
      available: day !== 'Saturday' && day !== 'Sunday'
    })),
    specialNotes: '',
    emergencyAvailable: false,
    waitlistEnabled: true
  });
  const [stats, setStats] = useState<CapacityStats>({
    utilizationRate: 0,
    avgResponseTime: 0,
    completedThisWeek: 0,
    pendingReferrals: 0,
    weeklyTrend: 0
  });

  useEffect(() => {
    fetchCapacityData();
  }, [user]);

  const fetchCapacityData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch provider capacity settings
      const response = await fetch('/api/providers/capacity');
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, ...data.settings }));
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Error fetching capacity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/providers/capacity', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        toast({
          title: "Settings saved",
          description: "Your capacity settings have been updated successfully.",
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save capacity settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateWorkingHours = (dayIndex: number, field: string, value: any) => {
    const newWorkingHours = [...settings.workingHours];
    newWorkingHours[dayIndex] = { ...newWorkingHours[dayIndex], [field]: value };
    setSettings(prev => ({ ...prev, workingHours: newWorkingHours }));
  };

  const availableCapacity = settings.maxCapacity - settings.currentCapacity;
  const utilizationPercentage = (settings.currentCapacity / settings.maxCapacity) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading capacity settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Capacity Management</h1>
          <p className="text-gray-600">Manage your availability and capacity for new referrals</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Current Utilization</p>
                  <p className="text-2xl font-bold text-gray-900">{utilizationPercentage.toFixed(0)}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
              <Progress value={utilizationPercentage} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Available Capacity</p>
                  <p className="text-2xl font-bold text-green-600">{availableCapacity}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Avg Response Time</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.avgResponseTime}h</p>
                </div>
                <Clock className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending Referrals</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingReferrals}</p>
                </div>
                <Activity className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Capacity Settings */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BedDouble className="h-5 w-5" />
                  Capacity Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="capacity-type">Capacity Type</Label>
                  <Select 
                    value={settings.type} 
                    onValueChange={(value: 'unit' | 'capacity') => 
                      setSettings(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select capacity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unit">Unit-based (visits/hours)</SelectItem>
                      <SelectItem value="capacity">Capacity-based (beds/slots)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max-capacity">Max Capacity</Label>
                    <Input
                      id="max-capacity"
                      type="number"
                      value={settings.maxCapacity}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        maxCapacity: parseInt(e.target.value) || 0 
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current-capacity">Current Capacity</Label>
                    <Input
                      id="current-capacity"
                      type="number"
                      value={settings.currentCapacity}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        currentCapacity: parseInt(e.target.value) || 0 
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availability-status">Availability Status</Label>
                  <Select 
                    value={settings.availabilityStatus} 
                    onValueChange={(value: 'available' | 'limited' | 'unavailable') => 
                      setSettings(prev => ({ ...prev, availabilityStatus: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select availability status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="limited">Limited Availability</SelectItem>
                      <SelectItem value="unavailable">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="auto-accept">Auto-accept Referrals</Label>
                    <p className="text-sm text-gray-600">
                      Automatically accept referrals when within capacity
                    </p>
                  </div>
                  <Switch
                    id="auto-accept"
                    checked={settings.autoAcceptReferrals}
                    onCheckedChange={(checked) => setSettings(prev => ({ 
                      ...prev, 
                      autoAcceptReferrals: checked 
                    }))}
                  />
                </div>

                {settings.autoAcceptReferrals && (
                  <div className="space-y-2">
                    <Label htmlFor="max-auto-accept">Max Auto-accept</Label>
                    <Input
                      id="max-auto-accept"
                      type="number"
                      value={settings.maxAutoAccept}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        maxAutoAccept: parseInt(e.target.value) || 0 
                      }))}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="special-notes">Special Notes</Label>
                  <Textarea
                    id="special-notes"
                    placeholder="Any special notes about your availability..."
                    value={settings.specialNotes}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      specialNotes: e.target.value 
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Additional Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="emergency-available">Emergency Availability</Label>
                    <p className="text-sm text-gray-600">
                      Available for emergency referrals
                    </p>
                  </div>
                  <Switch
                    id="emergency-available"
                    checked={settings.emergencyAvailable}
                    onCheckedChange={(checked) => setSettings(prev => ({ 
                      ...prev, 
                      emergencyAvailable: checked 
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="waitlist-enabled">Waitlist Enabled</Label>
                    <p className="text-sm text-gray-600">
                      Allow clients to join a waitlist when at capacity
                    </p>
                  </div>
                  <Switch
                    id="waitlist-enabled"
                    checked={settings.waitlistEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ 
                      ...prev, 
                      waitlistEnabled: checked 
                    }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Working Hours */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Working Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {settings.workingHours.map((day, index) => (
                    <div key={day.day} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={day.available}
                          onCheckedChange={(checked) => updateWorkingHours(index, 'available', checked)}
                        />
                        <span className="w-20 text-sm font-medium">{day.day}</span>
                      </div>
                      
                      {day.available && (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="time"
                            value={day.start}
                            onChange={(e) => updateWorkingHours(index, 'start', e.target.value)}
                            className="w-32"
                          />
                          <span className="text-gray-500">to</span>
                          <Input
                            type="time"
                            value={day.end}
                            onChange={(e) => updateWorkingHours(index, 'end', e.target.value)}
                            className="w-32"
                          />
                        </div>
                      )}
                      
                      {!day.available && (
                        <div className="flex-1 text-sm text-gray-500">
                          Unavailable
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Current Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge variant={settings.availabilityStatus === 'available' ? 'default' : 'secondary'}>
                      {settings.availabilityStatus.charAt(0).toUpperCase() + settings.availabilityStatus.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Capacity Utilization</span>
                    <span className="text-sm text-gray-600">
                      {settings.currentCapacity}/{settings.maxCapacity} ({utilizationPercentage.toFixed(0)}%)
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Auto-accept</span>
                    <Badge variant={settings.autoAcceptReferrals ? 'default' : 'secondary'}>
                      {settings.autoAcceptReferrals ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Emergency Available</span>
                    <Badge variant={settings.emergencyAvailable ? 'default' : 'secondary'}>
                      {settings.emergencyAvailable ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 