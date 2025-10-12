"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  X, 
  Edit, 
  Save, 
  Loader2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Shield, 
  Heart, 
  Home, 
  Languages, 
  AlertCircle,
  FileText,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { formatDateForInput } from '@/lib/date-utils';
import { formatWaiverType, WAIVER_TYPE_OPTIONS } from '@/lib/formatting';
import { cn } from '@/lib/utils';
import type { Client } from '@/types';

// Modern Field Display Component for Read Mode
function FieldDisplay({ 
  label, 
  value, 
  icon: Icon,
  className 
}: { 
  label: string; 
  value: string | React.ReactNode; 
  icon?: any;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
        <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</Label>
      </div>
      <div className="text-sm text-slate-900 font-medium px-0.5">
        {value || <span className="text-slate-400 italic">Not provided</span>}
      </div>
    </div>
  );
}

// Multi-select component for services
function MultiSelectServices({ 
  selected, 
  onChange, 
  disabled 
}: { 
  selected: string[];
  onChange: (services: string[]) => void;
  disabled?: boolean;
}) {
  const [services, setServices] = useState<{ residential: string[]; nonResidential: string[] }>({
    residential: [],
    nonResidential: []
  });
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    async function fetchServices() {
      try {
        const response = await fetch('/api/services');
        if (!response.ok) throw new Error('Failed to fetch services');
        const data = await response.json();
        setServices(data.services);
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, []);

  // Update dropdown position on scroll/resize when open
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const updatePosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const toggleService = (service: string) => {
    if (selected.includes(service)) {
      onChange(selected.filter(s => s !== service));
    } else {
      onChange([...selected, service]);
    }
  };

  const removeService = (service: string) => {
    onChange(selected.filter(s => s !== service));
  };

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map(service => (
            <Badge 
              key={service} 
              variant="secondary" 
              className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium border border-emerald-200"
            >
              {service}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeService(service)}
                  className="ml-1.5 hover:text-emerald-900 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {!disabled && (
        <div className="relative">
          <button
            ref={buttonRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!isOpen && buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                setDropdownPosition({
                  top: rect.bottom + window.scrollY + 8,
                  left: rect.left + window.scrollX,
                  width: rect.width
                });
              }
              setIsOpen(!isOpen);
            }}
            className="w-full px-3 py-2.5 text-left border border-slate-200 rounded-lg bg-white hover:bg-slate-50 hover:border-slate-300 text-sm transition-all duration-200 font-medium text-slate-700 flex items-center justify-between"
          >
            <span>{loading ? 'Loading services...' : 'Select services...'}</span>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isOpen && typeof document !== 'undefined' && createPortal(
            <>
              <div
                className="fixed inset-0 z-[100]"
                onClick={() => setIsOpen(false)}
              />
              <div 
                className="fixed z-[110] bg-white border border-slate-300 rounded-lg shadow-2xl max-h-96 overflow-hidden"
                style={{
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`,
                  width: `${dropdownPosition.width}px`,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)'
                }}>
                {/* Scrollable content */}
                <div className="overflow-y-auto max-h-96">
                  <div className="p-3">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-2 py-1 bg-slate-50 rounded">
                      Residential Services
                    </div>
                    <div className="space-y-0.5">
                      {services.residential.map(service => (
                        <label
                          key={service}
                          className="flex items-center px-3 py-2.5 hover:bg-emerald-50 cursor-pointer rounded-md transition-colors group"
                        >
                          <Checkbox
                            checked={selected.includes(service)}
                            onCheckedChange={() => toggleService(service)}
                            className="mr-3 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                          />
                          <span className="text-sm text-slate-700 font-medium group-hover:text-emerald-900">{service}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 border-t border-slate-200">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-2 py-1 bg-slate-50 rounded">
                      Non-Residential Services
                    </div>
                    <div className="space-y-0.5">
                      {services.nonResidential.map(service => (
                        <label
                          key={service}
                          className="flex items-center px-3 py-2.5 hover:bg-emerald-50 cursor-pointer rounded-md transition-colors group"
                        >
                          <Checkbox
                            checked={selected.includes(service)}
                            onCheckedChange={() => toggleService(service)}
                            className="mr-3 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                          />
                          <span className="text-sm text-slate-700 font-medium group-hover:text-emerald-900">{service}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>,
            document.body
          )}
        </div>
      )}
    </div>
  );
}

interface ClientDetailsPanelProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export function ClientDetailsPanel({ client, isOpen, onClose, onUpdate }: ClientDetailsPanelProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    firstName: client.firstName || '',
    lastName: client.lastName || '',
    dateOfBirth: formatDateForInput(client.dateOfBirth),
    sex: (client.sex || '') as 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | 'other' | '',
    email: client.email || '',
    phone: client.phone || '',
    phoneNumber: client.phoneNumber || '',
    preferredContactMethod: (client.preferredContactMethod || 'email') as 'email' | 'phone' | 'both',
    address: typeof client.address === 'string' ? client.address : (client.address?.street || ''),
    city: client.city || '',
    state: client.state || '',
    zipCode: client.zipCode || '',
    county: client.county || '',
    insurance: (client.insurance?.type || '') as 'medicaid' | 'medicare' | 'private' | 'none' | '',
    insuranceProvider: client.insurance?.provider || '',
    insuranceNumber: client.insurance?.number || '',
    pmiNumber: client.pmiNumber || client.pmi || '',
    waiverType: client.waiverType || '',
    primaryLanguage: client.primaryLanguage || 'English',
    needsTranslator: client.needsTranslator || false,
    historyOfViolence: client.historyOfViolence || false,
    mobilityStatus: (client.mobilityStatus || '') as 'ambulatory' | 'wheelchair-bound' | 'bed-bound' | 'other' | '',
    livingSituation: (client.livingSituation || '') as 'alone' | 'with-family' | 'group-setting' | 'other' | '',
    primaryDiagnosis: client.primaryDiagnosis || '',
    culturalConsiderations: client.culturalConsiderations || '',
    additionalNotes: client.additionalNotes || '',
    serviceTypes: (client as any).serviceTypes || [],
  });

  useEffect(() => {
    setFormData({
      firstName: client.firstName || '',
      lastName: client.lastName || '',
      dateOfBirth: formatDateForInput(client.dateOfBirth),
      sex: (client.sex || '') as 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | 'other' | '',
      email: client.email || '',
      phone: client.phone || '',
      phoneNumber: client.phoneNumber || '',
      preferredContactMethod: (client.preferredContactMethod || 'email') as 'email' | 'phone' | 'both',
      address: typeof client.address === 'string' ? client.address : (client.address?.street || ''),
      city: client.city || '',
      state: client.state || '',
      zipCode: client.zipCode || '',
      county: client.county || '',
      insurance: (client.insurance?.type || '') as 'medicaid' | 'medicare' | 'private' | 'none' | '',
      insuranceProvider: client.insurance?.provider || '',
      insuranceNumber: client.insurance?.number || '',
      pmiNumber: client.pmiNumber || client.pmi || '',
      waiverType: client.waiverType || '',
      primaryLanguage: client.primaryLanguage || 'English',
      needsTranslator: client.needsTranslator || false,
      historyOfViolence: client.historyOfViolence || false,
      mobilityStatus: (client.mobilityStatus || '') as 'ambulatory' | 'wheelchair-bound' | 'bed-bound' | 'other' | '',
      livingSituation: (client.livingSituation || '') as 'alone' | 'with-family' | 'group-setting' | 'other' | '',
      primaryDiagnosis: client.primaryDiagnosis || '',
      culturalConsiderations: client.culturalConsiderations || '',
      additionalNotes: client.additionalNotes || '',
      serviceTypes: (client as any).serviceTypes || [],
    });
  }, [client]);

  const getStatusColor = () => {
    switch (client.status) {
      case 'ACTIVE_STABLE': return 'bg-green-500';
      case 'ACTIVE_NEEDS_ATTENTION':
      case 'ACTIVE_FRUSTRATED': return 'bg-red-500';
      case 'IN_PROCESS': return 'bg-purple-500';
      case 'REFERRAL_SENT': return 'bg-blue-500';
      default: return 'bg-slate-400';
    }
  };

  const getStatusDisplay = () => {
    switch (client.status) {
      case 'UNPLACED':
      case 'UNPLACED_NEW':
        return { 
          label: 'Unplaced', 
          bg: 'bg-slate-100', 
          text: 'text-slate-700', 
          dot: 'bg-slate-500' 
        };
      case 'REFERRAL_SENT':
        return { 
          label: 'Referral Sent', 
          bg: 'bg-blue-100', 
          text: 'text-blue-700', 
          dot: 'bg-blue-500' 
        };
      case 'IN_PROCESS':
        return { 
          label: 'In Process', 
          bg: 'bg-purple-100', 
          text: 'text-purple-700', 
          dot: 'bg-purple-500' 
        };
      case 'ACTIVE_STABLE':
        return { 
          label: 'Active - Stable', 
          bg: 'bg-green-100', 
          text: 'text-green-700', 
          dot: 'bg-green-500' 
        };
      case 'ACTIVE_NEEDS_ATTENTION':
        return { 
          label: 'Needs Attention', 
          bg: 'bg-amber-100', 
          text: 'text-amber-700', 
          dot: 'bg-amber-500' 
        };
      case 'ACTIVE_FRUSTRATED':
        return { 
          label: 'Frustrated', 
          bg: 'bg-red-100', 
          text: 'text-red-700', 
          dot: 'bg-red-500' 
        };
      case 'CLOSED_DISCHARGED':
        return { 
          label: 'Closed / Discharged', 
          bg: 'bg-gray-100', 
          text: 'text-gray-700', 
          dot: 'bg-gray-500' 
        };
      default:
        return { 
          label: client.status || 'Unknown', 
          bg: 'bg-slate-100', 
          text: 'text-slate-700', 
          dot: 'bg-slate-400' 
        };
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch(`/api/clients/${client._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update client');
      }

      const updatedResponse = await fetch(`/api/clients/${client._id}`);
      if (updatedResponse.ok) {
        const data = await updatedResponse.json();
        if (data.client) {
          setFormData({
            firstName: data.client.firstName || '',
            lastName: data.client.lastName || '',
            dateOfBirth: formatDateForInput(data.client.dateOfBirth),
            sex: (data.client.sex || '') as 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | 'other' | '',
            email: data.client.email || '',
            phone: data.client.phone || '',
            phoneNumber: data.client.phoneNumber || '',
            preferredContactMethod: (data.client.preferredContactMethod || 'email') as 'email' | 'phone' | 'both',
            address: typeof data.client.address === 'string' ? data.client.address : (data.client.address?.street || ''),
            city: data.client.city || '',
            state: data.client.state || '',
            zipCode: data.client.zipCode || '',
            county: data.client.county || '',
            insurance: (data.client.insurance?.type || '') as 'medicaid' | 'medicare' | 'private' | 'none' | '',
            insuranceProvider: data.client.insurance?.provider || '',
            insuranceNumber: data.client.insurance?.number || '',
            pmiNumber: data.client.pmiNumber || data.client.pmi || '',
            waiverType: data.client.waiverType || '',
            primaryLanguage: data.client.primaryLanguage || 'English',
            needsTranslator: data.client.needsTranslator || false,
            historyOfViolence: data.client.historyOfViolence || false,
            mobilityStatus: (data.client.mobilityStatus || '') as 'ambulatory' | 'wheelchair-bound' | 'bed-bound' | 'other' | '',
            livingSituation: (data.client.livingSituation || '') as 'alone' | 'with-family' | 'group-setting' | 'other' | '',
            primaryDiagnosis: data.client.primaryDiagnosis || '',
            culturalConsiderations: data.client.culturalConsiderations || '',
            additionalNotes: data.client.additionalNotes || '',
            serviceTypes: data.client.serviceTypes || [],
          });
        }
      }

      toast({
        title: 'Client updated',
        description: 'Client information has been successfully updated.',
      });

      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: 'Update failed',
        description: 'Failed to update client. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: client.firstName || '',
      lastName: client.lastName || '',
      dateOfBirth: formatDateForInput(client.dateOfBirth),
      sex: (client.sex || '') as 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | 'other' | '',
      email: client.email || '',
      phone: client.phone || '',
      phoneNumber: client.phoneNumber || '',
      preferredContactMethod: (client.preferredContactMethod || 'email') as 'email' | 'phone' | 'both',
      address: typeof client.address === 'string' ? client.address : (client.address?.street || ''),
      city: client.city || '',
      state: client.state || '',
      zipCode: client.zipCode || '',
      county: client.county || '',
      insurance: (client.insurance?.type || '') as 'medicaid' | 'medicare' | 'private' | 'none' | '',
      insuranceProvider: client.insurance?.provider || '',
      insuranceNumber: client.insurance?.number || '',
      pmiNumber: client.pmiNumber || client.pmi || '',
      waiverType: client.waiverType || '',
      primaryLanguage: client.primaryLanguage || 'English',
      needsTranslator: client.needsTranslator || false,
      historyOfViolence: client.historyOfViolence || false,
      mobilityStatus: (client.mobilityStatus || '') as 'ambulatory' | 'wheelchair-bound' | 'bed-bound' | 'other' | '',
      livingSituation: (client.livingSituation || '') as 'alone' | 'with-family' | 'group-setting' | 'other' | '',
      primaryDiagnosis: client.primaryDiagnosis || '',
      culturalConsiderations: client.culturalConsiderations || '',
      additionalNotes: client.additionalNotes || '',
      serviceTypes: (client as any).serviceTypes || [],
    });
    setIsEditing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-4 bg-white shadow-sm flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {client.firstName} {client.lastName}
              </h1>
              {(() => {
                const statusDisplay = getStatusDisplay();
                return (
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${statusDisplay.bg} shadow-sm transition-all duration-200 border border-slate-200/60`}>
                    <div className={`w-2 h-2 rounded-full ${statusDisplay.dot} ring-2 ring-white shadow-sm animate-pulse`} />
                    <span className={`text-xs font-semibold ${statusDisplay.text} uppercase tracking-wide`}>
                      {statusDisplay.label}
                    </span>
                  </div>
                );
              })()}
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              {(client.phoneNumber || client.phone) && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span className="font-medium">{client.phoneNumber || client.phone}</span>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="font-medium truncate">{client.email}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {client.updatedAt 
                    ? formatDistanceToNow(new Date(client.updatedAt), { addSuffix: true })
                    : 'recently'
                  }
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-2 flex-shrink-0 ml-4">
            {isEditing ? (
              <>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleSave}
                  disabled={saving}
                  className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 shadow-sm"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancel}
                  disabled={saving}
                  className="h-8 px-3 text-xs"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(true)}
                className="h-8 px-3 text-xs hover:bg-slate-50"
              >
                <Edit className="w-3.5 h-3.5 mr-1.5" />
                Edit Profile
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl space-y-6">
          
          {/* Service Types Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-visible transition-all duration-200 hover:shadow-md">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 border-b border-emerald-100">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-emerald-900">Service Types</h3>
              </div>
            </div>
            <div className="p-4">
              {isEditing ? (
                <MultiSelectServices
                  selected={formData.serviceTypes}
                  onChange={(services) => setFormData(prev => ({ ...prev, serviceTypes: services }))}
                  disabled={false}
                />
              ) : (
                <div className="min-h-[60px] flex items-center">
                  {formData.serviceTypes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.serviceTypes.map((service, idx) => (
                        <span 
                          key={idx}
                          className="inline-flex items-center bg-slate-100 text-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold shadow-sm"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No services selected</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Personal Information Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-blue-100">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-blue-900">Personal Information</h3>
              </div>
            </div>
            <div className="p-5">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-xs font-semibold text-slate-600 mb-1.5">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-xs font-semibold text-slate-600 mb-1.5">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth" className="text-xs font-semibold text-slate-600 mb-1.5">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      className="h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sex" className="text-xs font-semibold text-slate-600 mb-1.5">Sex</Label>
                    <Select
                      value={formData.sex}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, sex: value as any }))}
                    >
                      <SelectTrigger className="h-10 border-slate-200">
                        <SelectValue placeholder="Select sex" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="non-binary">Non-binary</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  <FieldDisplay label="First Name" value={formData.firstName} />
                  <FieldDisplay label="Last Name" value={formData.lastName} />
                  <FieldDisplay 
                    label="Date of Birth" 
                    value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''} 
                    icon={Calendar}
                  />
                  <FieldDisplay label="Sex" value={formData.sex ? formData.sex.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : ''} />
                </div>
              )}
            </div>
          </div>

          {/* Contact Information Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-3 border-b border-emerald-100">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-emerald-900">Contact Information</h3>
              </div>
            </div>
            <div className="p-5">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="text-xs font-semibold text-slate-600 mb-1.5">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone || formData.phoneNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="h-10 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-xs font-semibold text-slate-600 mb-1.5">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="h-10 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="preferredContactMethod" className="text-xs font-semibold text-slate-600 mb-1.5">Preferred Contact Method</Label>
                    <Select
                      value={formData.preferredContactMethod}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, preferredContactMethod: value as any }))}
                    >
                      <SelectTrigger className="h-10 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  <FieldDisplay label="Phone" value={formData.phone || formData.phoneNumber} icon={Phone} />
                  <FieldDisplay label="Email" value={formData.email} icon={Mail} />
                  <FieldDisplay 
                    label="Preferred Contact" 
                    value={formData.preferredContactMethod.replace(/\b\w/g, l => l.toUpperCase())} 
                  />
                </div>
              )}
            </div>
          </div>

          {/* Address Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 px-4 py-3 border-b border-purple-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-purple-900">Address</h3>
              </div>
            </div>
            <div className="p-5">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="address" className="text-xs font-semibold text-slate-600 mb-1.5">Street Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="h-10 border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city" className="text-xs font-semibold text-slate-600 mb-1.5">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="h-10 border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-xs font-semibold text-slate-600 mb-1.5">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      className="h-10 border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode" className="text-xs font-semibold text-slate-600 mb-1.5">Zip Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                      className="h-10 border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="county" className="text-xs font-semibold text-slate-600 mb-1.5">County</Label>
                    <Input
                      id="county"
                      value={formData.county}
                      onChange={(e) => setFormData(prev => ({ ...prev, county: e.target.value }))}
                      className="h-10 border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  <div className="col-span-2">
                    <FieldDisplay label="Street Address" value={formData.address} />
                  </div>
                  <FieldDisplay label="City" value={formData.city} />
                  <FieldDisplay label="State" value={formData.state} />
                  <FieldDisplay label="Zip Code" value={formData.zipCode} />
                  <FieldDisplay label="County" value={formData.county} />
                </div>
              )}
            </div>
          </div>

          {/* Insurance & Waiver Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
            <div className="bg-gradient-to-r from-rose-50 to-red-50 px-4 py-3 border-b border-rose-100">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-rose-900">Insurance & Waiver</h3>
              </div>
            </div>
            <div className="p-5">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="insurance" className="text-xs font-semibold text-slate-600 mb-1.5">Insurance Type</Label>
                    <Select
                      value={formData.insurance}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, insurance: value as any }))}
                    >
                      <SelectTrigger className="h-10 border-slate-200">
                        <SelectValue placeholder="Select insurance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="medicaid">Medicaid</SelectItem>
                        <SelectItem value="medicare">Medicare</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="insuranceProvider" className="text-xs font-semibold text-slate-600 mb-1.5">Insurance Provider</Label>
                    <Input
                      id="insuranceProvider"
                      value={formData.insuranceProvider}
                      onChange={(e) => setFormData(prev => ({ ...prev, insuranceProvider: e.target.value }))}
                      className="h-10 border-slate-200 focus:border-rose-500 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="insuranceNumber" className="text-xs font-semibold text-slate-600 mb-1.5">Insurance Number</Label>
                    <Input
                      id="insuranceNumber"
                      value={formData.insuranceNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, insuranceNumber: e.target.value }))}
                      className="h-10 border-slate-200 focus:border-rose-500 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pmiNumber" className="text-xs font-semibold text-slate-600 mb-1.5">PMI Number</Label>
                    <Input
                      id="pmiNumber"
                      value={formData.pmiNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, pmiNumber: e.target.value }))}
                      className="h-10 border-slate-200 focus:border-rose-500 focus:ring-rose-500 font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="waiverType" className="text-xs font-semibold text-slate-600 mb-1.5">Waiver Type</Label>
                    <Select
                      value={formData.waiverType}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, waiverType: value }))}
                    >
                      <SelectTrigger className="h-10 border-slate-200">
                        <SelectValue placeholder="Select waiver type" />
                      </SelectTrigger>
                      <SelectContent>
                        {WAIVER_TYPE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  <FieldDisplay 
                    label="Insurance Type" 
                    value={formData.insurance ? formData.insurance.replace(/\b\w/g, l => l.toUpperCase()) : ''} 
                    icon={Shield}
                  />
                  <FieldDisplay label="Insurance Provider" value={formData.insuranceProvider} />
                  <FieldDisplay label="Insurance Number" value={formData.insuranceNumber} />
                  <FieldDisplay label="PMI Number" value={formData.pmiNumber} />
                  <div className="col-span-2">
                    <FieldDisplay 
                      label="Waiver Type" 
                      value={formData.waiverType ? formatWaiverType(formData.waiverType) : ''} 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Health & Care Preferences Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-amber-900">Health & Care Preferences</h3>
              </div>
            </div>
            <div className="p-5">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryLanguage" className="text-xs font-semibold text-slate-600 mb-1.5">Primary Language</Label>
                    <Input
                      id="primaryLanguage"
                      value={formData.primaryLanguage}
                      onChange={(e) => setFormData(prev => ({ ...prev, primaryLanguage: e.target.value }))}
                      className="h-10 border-slate-200 focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <Checkbox
                      id="needsTranslator"
                      checked={formData.needsTranslator}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, needsTranslator: !!checked }))}
                    />
                    <Label htmlFor="needsTranslator" className="ml-2 text-xs font-semibold text-slate-600">Needs Translator</Label>
                  </div>
                  <div>
                    <Label htmlFor="mobilityStatus" className="text-xs font-semibold text-slate-600 mb-1.5">Mobility Status</Label>
                    <Select
                      value={formData.mobilityStatus}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, mobilityStatus: value as any }))}
                    >
                      <SelectTrigger className="h-10 border-slate-200">
                        <SelectValue placeholder="Select mobility status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ambulatory">Ambulatory</SelectItem>
                        <SelectItem value="wheelchair-bound">Wheelchair-bound</SelectItem>
                        <SelectItem value="bed-bound">Bed-bound</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="livingSituation" className="text-xs font-semibold text-slate-600 mb-1.5">Living Situation</Label>
                    <Select
                      value={formData.livingSituation}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, livingSituation: value as any }))}
                    >
                      <SelectTrigger className="h-10 border-slate-200">
                        <SelectValue placeholder="Select living situation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alone">Alone</SelectItem>
                        <SelectItem value="with-family">With Family</SelectItem>
                        <SelectItem value="group-setting">Group Setting</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="primaryDiagnosis" className="text-xs font-semibold text-slate-600 mb-1.5">Primary Diagnosis</Label>
                    <Input
                      id="primaryDiagnosis"
                      value={formData.primaryDiagnosis}
                      onChange={(e) => setFormData(prev => ({ ...prev, primaryDiagnosis: e.target.value }))}
                      className="h-10 border-slate-200 focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>
                  <div className="col-span-2 flex items-center">
                    <Checkbox
                      id="historyOfViolence"
                      checked={formData.historyOfViolence}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, historyOfViolence: !!checked }))}
                    />
                    <Label htmlFor="historyOfViolence" className="ml-2 text-xs font-semibold text-slate-600">History of Violence</Label>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  <FieldDisplay label="Primary Language" value={formData.primaryLanguage} icon={Languages} />
                  <FieldDisplay 
                    label="Needs Translator" 
                    value={formData.needsTranslator ? 'Yes' : 'No'} 
                  />
                  <FieldDisplay 
                    label="Mobility Status" 
                    value={formData.mobilityStatus ? formData.mobilityStatus.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : ''} 
                    icon={Home}
                  />
                  <FieldDisplay 
                    label="Living Situation" 
                    value={formData.livingSituation ? formData.livingSituation.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : ''} 
                  />
                  <div className="col-span-2">
                    <FieldDisplay label="Primary Diagnosis" value={formData.primaryDiagnosis} />
                  </div>
                  <FieldDisplay 
                    label="History of Violence" 
                    value={formData.historyOfViolence ? 'Yes' : 'No'} 
                    icon={AlertCircle}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Additional Notes Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-900">Additional Information</h3>
              </div>
            </div>
            <div className="p-5">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="culturalConsiderations" className="text-xs font-semibold text-slate-600 mb-1.5">Cultural Considerations</Label>
                    <Textarea
                      id="culturalConsiderations"
                      value={formData.culturalConsiderations}
                      onChange={(e) => setFormData(prev => ({ ...prev, culturalConsiderations: e.target.value }))}
                      className="min-h-[100px] border-slate-200 focus:border-slate-500 focus:ring-slate-500 resize-none"
                      placeholder="Any cultural considerations or preferences..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="additionalNotes" className="text-xs font-semibold text-slate-600 mb-1.5">Additional Notes</Label>
                    <Textarea
                      id="additionalNotes"
                      value={formData.additionalNotes}
                      onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                      className="min-h-[100px] border-slate-200 focus:border-slate-500 focus:ring-slate-500 resize-none"
                      placeholder="Any additional notes about the client..."
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <FieldDisplay 
                      label="Cultural Considerations" 
                      value={formData.culturalConsiderations ? (
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {formData.culturalConsiderations}
                        </p>
                      ) : ''} 
                    />
                  </div>
                  <div>
                    <FieldDisplay 
                      label="Additional Notes" 
                      value={formData.additionalNotes ? (
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {formData.additionalNotes}
                        </p>
                      ) : ''} 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
