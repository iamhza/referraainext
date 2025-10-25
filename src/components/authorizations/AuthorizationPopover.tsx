'use client';

import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover as CalendarPopover, PopoverContent as CalendarPopoverContent, PopoverTrigger as CalendarPopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Check, X, Trash2, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Authorization {
  _id?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'DENIED' | 'EXPIRED';
  startDate: Date | string;
  endDate: Date | string;
  units: number;
  unitType: 'HOURS_PER_WEEK' | 'HOURS_PER_MONTH' | 'TOTAL_UNITS';
  approvalNumber?: string;
  daysUntilExpiration?: number;
}

interface AuthorizationPopoverProps {
  serviceRelationshipId: string;
  clientName: string;
  serviceName: string;
  existingAuth?: Authorization | null;
  onSuccess?: () => void;
  children: React.ReactNode;
}

export function AuthorizationPopover({
  serviceRelationshipId,
  clientName,
  serviceName,
  existingAuth,
  onSuccess,
  children,
}: AuthorizationPopoverProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit' | 'create'>(
    existingAuth ? 'view' : 'create'
  );

  // Form state
  const [startDate, setStartDate] = useState<Date | undefined>(
    existingAuth?.startDate ? new Date(existingAuth.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    existingAuth?.endDate ? new Date(existingAuth.endDate) : undefined
  );
  const [units, setUnits] = useState(existingAuth?.units?.toString() || '20');
  const [unitType, setUnitType] = useState<string>(
    existingAuth?.unitType || 'HOURS_PER_WEEK'
  );
  const [status, setStatus] = useState<string>(existingAuth?.status || 'DRAFT');

  const isEditing = mode === 'edit' || mode === 'create';
  const canEdit = !existingAuth || existingAuth.status === 'DRAFT' || existingAuth.status === 'SUBMITTED';

  const handleSave = async () => {
    if (!startDate || !endDate || !units) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        serviceRelationshipId,
        status,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        units: parseInt(units),
        unitType,
      };

      const response = await fetch(
        existingAuth?._id
          ? `/api/authorizations/${existingAuth._id}`
          : '/api/authorizations',
        {
          method: existingAuth?._id ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save authorization');
      }

      setOpen(false);
      setMode('view');
      onSuccess?.();
    } catch (error) {
      console.error('Error saving authorization:', error);
      alert('Failed to save authorization. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingAuth?._id) return;
    if (!confirm('Delete this authorization? This cannot be undone.')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/authorizations/${existingAuth._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete authorization');
      }

      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error deleting authorization:', error);
      alert('Failed to delete authorization. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitToCounty = async () => {
    if (!existingAuth?._id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/authorizations/${existingAuth._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SUBMITTED' }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit authorization');
      }

      setStatus('SUBMITTED');
      setMode('view');
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting authorization:', error);
      alert('Failed to submit authorization. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (authStatus: string) => {
    const config = {
      APPROVED: { label: 'Approved', class: 'bg-green-100 text-green-800 border-green-300' },
      SUBMITTED: { label: 'Pending', class: 'bg-blue-100 text-blue-800 border-blue-300' },
      DRAFT: { label: 'Draft', class: 'bg-slate-100 text-slate-800 border-slate-300' },
      DENIED: { label: 'Denied', class: 'bg-red-100 text-red-800 border-red-300' },
      EXPIRED: { label: 'Expired', class: 'bg-orange-100 text-orange-800 border-orange-300' },
    };
    const cfg = config[authStatus as keyof typeof config] || config.DRAFT;
    return <Badge className={cn('text-xs px-2 py-0.5 border', cfg.class)}>{cfg.label}</Badge>;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent 
        className="w-[400px] p-0 bg-white border-2 border-slate-200 shadow-2xl z-[9999]" 
        align="end"
        side="left"
      >
        {/* Header */}
        <div className="border-b-2 border-slate-100 p-4 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 text-sm leading-tight">
                {mode === 'create' ? 'New Authorization' : 'Authorization Details'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {clientName} • {serviceName}
              </p>
            </div>
            {existingAuth && mode === 'view' && (
              <div>{getStatusBadge(existingAuth.status)}</div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
          {/* Status (view mode) */}
          {mode === 'view' && existingAuth && (
            <div className="space-y-3 text-sm">
              {/* Authorization Period */}
              {existingAuth.startDate && existingAuth.endDate && (
                <div>
                  <span className="text-slate-500 text-xs font-medium">Authorization Period</span>
                  <p className="text-slate-900 font-medium mt-1">
                    {(() => {
                      try {
                        const start = new Date(existingAuth.startDate);
                        const end = new Date(existingAuth.endDate);
                        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                          return 'Invalid dates';
                        }
                        return `${format(start, 'MMM d, yyyy')} → ${format(end, 'MMM d, yyyy')}`;
                      } catch (error) {
                        return 'Invalid dates';
                      }
                    })()}
                  </p>
                </div>
              )}
              
              {/* Units */}
              {existingAuth.units && existingAuth.unitType && (
                <div>
                  <span className="text-slate-500 text-xs font-medium">Units Authorized</span>
                  <p className="text-slate-900 font-medium mt-1">
                    {existingAuth.units} {existingAuth.unitType.toLowerCase().replace(/_/g, ' ')}
                  </p>
                </div>
              )}

              {/* Approval Number */}
              {existingAuth.approvalNumber && (
                <div>
                  <span className="text-slate-500 text-xs font-medium">Approval Number</span>
                  <p className="text-slate-900 font-mono text-xs mt-1">{existingAuth.approvalNumber}</p>
                </div>
              )}

              {/* Expiration Status */}
              {existingAuth.daysUntilExpiration !== undefined && (
                <div>
                  <span className="text-slate-500 text-xs font-medium">Expiration</span>
                  <p className={cn(
                    'font-medium mt-1',
                    existingAuth.daysUntilExpiration < 0 ? 'text-red-600' :
                    existingAuth.daysUntilExpiration < 30 ? 'text-orange-600' :
                    'text-green-600'
                  )}>
                    {existingAuth.daysUntilExpiration < 0 
                      ? `Expired ${Math.abs(existingAuth.daysUntilExpiration)} days ago`
                      : existingAuth.daysUntilExpiration === 0
                      ? 'Expires today'
                      : `${existingAuth.daysUntilExpiration} days remaining`
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Form (edit/create mode) */}
          {isEditing && (
            <>
              {/* Status */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">Status</Label>
                <Select value={status} onValueChange={setStatus} modal={false}>
                  <SelectTrigger className="h-9 text-sm bg-white border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-2 shadow-lg z-[9999]">
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SUBMITTED">Submitted</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="DENIED">Denied</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">Start Date *</Label>
                <CalendarPopover>
                  <CalendarPopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal h-9 text-sm border-2',
                        !startDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'MMM d, yyyy') : 'Pick a date'}
                    </Button>
                  </CalendarPopoverTrigger>
                  <CalendarPopoverContent className="w-auto p-0 bg-white border-2 shadow-lg z-[9999]" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </CalendarPopoverContent>
                </CalendarPopover>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">End Date *</Label>
                <CalendarPopover>
                  <CalendarPopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal h-9 text-sm border-2',
                        !endDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'MMM d, yyyy') : 'Pick a date'}
                    </Button>
                  </CalendarPopoverTrigger>
                  <CalendarPopoverContent className="w-auto p-0 bg-white border-2 shadow-lg z-[9999]" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </CalendarPopoverContent>
                </CalendarPopover>
              </div>

              {/* Units */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">Units *</Label>
                <Input
                  type="number"
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                  className="h-9 text-sm bg-white border-2"
                  placeholder="20"
                  min="1"
                />
              </div>

              {/* Unit Type */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">Unit Type *</Label>
                <Select value={unitType} onValueChange={setUnitType} modal={false}>
                  <SelectTrigger className="h-9 text-sm bg-white border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-2 shadow-lg z-[9999]">
                    <SelectItem value="HOURS_PER_WEEK">Hours Per Week</SelectItem>
                    <SelectItem value="HOURS_PER_MONTH">Hours Per Month</SelectItem>
                    <SelectItem value="TOTAL_UNITS">Total Units</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t-2 border-slate-100 p-3 bg-slate-50/50 flex items-center justify-between gap-2">
          {mode === 'view' && existingAuth && (
            <>
              <div className="flex gap-2">
                {canEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setMode('edit')}
                    className="h-8 text-xs"
                  >
                    Edit
                  </Button>
                )}
                {existingAuth.status === 'DRAFT' && (
                  <Button
                    size="sm"
                    onClick={handleSubmitToCounty}
                    disabled={loading}
                    className="h-8 text-xs bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Submit to County'}
                  </Button>
                )}
              </div>
              {existingAuth.status === 'DRAFT' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDelete}
                  disabled={loading}
                  className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </>
          )}

          {isEditing && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (mode === 'create') {
                    setOpen(false);
                  } else {
                    setMode('view');
                  }
                }}
                disabled={loading}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={loading || !startDate || !endDate || !units}
                className="h-8 text-xs bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <Check className="w-3 h-3 mr-1" />
                )}
                Save
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

