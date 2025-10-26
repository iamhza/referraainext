'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Loader2, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/shared/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Authorization {
  _id?: string;
  serviceRelationshipId: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'DENIED' | 'EXPIRED';
  approvalNumber?: string;
  startDate?: string;
  endDate?: string;
  units?: number;
  unitType?: 'HOURS' | 'DAYS' | 'SESSIONS' | 'VISITS';
  fundingSource?: string;
  notes?: string;
}

interface AuthorizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceRelationshipId: string;
  clientName: string;
  providerName: string;
  serviceName: string;
  existingAuthorization?: Authorization | null;
  onSuccess?: () => void;
}

const UNIT_TYPES = [
  { value: 'HOURS', label: 'Hours' },
  { value: 'DAYS', label: 'Days' },
  { value: 'SESSIONS', label: 'Sessions' },
  { value: 'VISITS', label: 'Visits' },
];

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  { value: 'SUBMITTED', label: 'Submitted', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'APPROVED', label: 'Approved', color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'DENIED', label: 'Denied', color: 'bg-red-100 text-red-700 border-red-300' },
  { value: 'EXPIRED', label: 'Expired', color: 'bg-gray-100 text-gray-700 border-gray-300' },
];

export function AuthorizationModal({
  open,
  onOpenChange,
  serviceRelationshipId,
  clientName,
  providerName,
  serviceName,
  existingAuthorization,
  onSuccess,
}: AuthorizationModalProps) {
  const isEditMode = !!existingAuthorization;
  
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [status, setStatus] = useState<Authorization['status']>('DRAFT');
  const [approvalNumber, setApprovalNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [units, setUnits] = useState('');
  const [unitType, setUnitType] = useState<Authorization['unitType']>('HOURS');
  const [fundingSource, setFundingSource] = useState('');
  const [notes, setNotes] = useState('');

  // Initialize form with existing data
  useEffect(() => {
    if (existingAuthorization) {
      setStatus(existingAuthorization.status);
      setApprovalNumber(existingAuthorization.approvalNumber || '');
      setStartDate(existingAuthorization.startDate ? format(new Date(existingAuthorization.startDate), 'yyyy-MM-dd') : '');
      setEndDate(existingAuthorization.endDate ? format(new Date(existingAuthorization.endDate), 'yyyy-MM-dd') : '');
      setUnits(existingAuthorization.units?.toString() || '');
      setUnitType(existingAuthorization.unitType || 'HOURS');
      setFundingSource(existingAuthorization.fundingSource || '');
      setNotes(existingAuthorization.notes || '');
    } else {
      // Reset for create mode
      setStatus('SUBMITTED');
      setApprovalNumber('');
      setStartDate('');
      setEndDate('');
      setUnits('');
      setUnitType('HOURS');
      setFundingSource('');
      setNotes('');
    }
  }, [existingAuthorization, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!units || parseInt(units) <= 0) {
      toast.error('Please enter a valid number of units');
      return;
    }

    if (!startDate) {
      toast.error('Start date is required');
      return;
    }

    setLoading(true);

    try {
      const payload: Partial<Authorization> = {
        serviceRelationshipId,
        status,
        approvalNumber: approvalNumber.trim() || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        units: parseInt(units),
        unitType,
        fundingSource: fundingSource.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const url = isEditMode 
        ? `/api/authorizations/${existingAuthorization._id}`
        : '/api/authorizations';
      
      const method = isEditMode ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save authorization');
      }

      toast.success(
        isEditMode ? 'Authorization updated successfully' : 'Authorization created successfully',
        {
          description: `${clientName} → ${providerName}`,
        }
      );

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving authorization:', error);
      toast.error('Failed to save authorization', {
        description: error.message || 'An unexpected error occurred',
        icon: <AlertCircle className="h-4 w-4" />,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingAuthorization?._id) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/authorizations/${existingAuthorization._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete authorization');
      }

      toast.success('Authorization deleted', {
        description: `Removed authorization for ${clientName}`,
      });

      onSuccess?.();
      onOpenChange(false);
      setDeleteDialogOpen(false);
    } catch (error: any) {
      console.error('Error deleting authorization:', error);
      toast.error('Failed to delete authorization', {
        description: error.message || 'An unexpected error occurred',
        icon: <AlertCircle className="h-4 w-4" />,
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="z-[9999] bg-white border-2 shadow-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" />
              {isEditMode ? 'Edit Authorization' : 'Create Authorization'}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              Manage funding authorization for this service relationship
            </DialogDescription>
          </DialogHeader>

          {/* Context Banner */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Client:</span>
                <span className="text-slate-900 font-bold">{clientName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Provider:</span>
                <span className="text-slate-900 font-bold">{providerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Service:</span>
                <span className="text-slate-900 font-bold">{serviceName}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-bold text-slate-900">
                Status *
              </Label>
              <Select value={status} onValueChange={(value) => setStatus(value as Authorization['status'])} modal={false}>
                <SelectTrigger id="status" className="bg-white border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 shadow-lg z-[10000]">
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
                      <span className={cn('px-2 py-1 rounded text-xs font-semibold', opt.color)}>
                        {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Approval Number */}
            <div className="space-y-2">
              <Label htmlFor="approvalNumber" className="text-sm font-bold text-slate-900">
                Approval Number
              </Label>
              <Input
                id="approvalNumber"
                value={approvalNumber}
                onChange={(e) => setApprovalNumber(e.target.value)}
                placeholder="e.g., AUTH-2025-001"
                className="bg-white border-2"
                disabled={loading}
              />
            </div>

            {/* Units & Unit Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="units" className="text-sm font-bold text-slate-900">
                  Units Authorized *
                </Label>
                <Input
                  id="units"
                  type="number"
                  min="1"
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                  placeholder="e.g., 40"
                  className="bg-white border-2"
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitType" className="text-sm font-bold text-slate-900">
                  Unit Type *
                </Label>
                <Select value={unitType} onValueChange={(value) => setUnitType(value as Authorization['unitType'])} modal={false}>
                  <SelectTrigger id="unitType" className="bg-white border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-2 shadow-lg z-[10000]">
                    {UNIT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="cursor-pointer">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm font-bold text-slate-900 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Start Date *
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white border-2"
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-sm font-bold text-slate-900 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white border-2"
                  disabled={loading}
                  min={startDate} // End date can't be before start date
                />
              </div>
            </div>

            {/* Funding Source */}
            <div className="space-y-2">
              <Label htmlFor="fundingSource" className="text-sm font-bold text-slate-900">
                Funding Source
              </Label>
              <Input
                id="fundingSource"
                value={fundingSource}
                onChange={(e) => setFundingSource(e.target.value)}
                placeholder="e.g., Medicaid, Private Insurance"
                className="bg-white border-2"
                disabled={loading}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-bold text-slate-900">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes or special conditions..."
                rows={3}
                className="bg-white border-2 resize-none"
                disabled={loading}
              />
            </div>

            <DialogFooter className="flex justify-between items-center">
              {/* Delete Button (Edit Mode Only) */}
              {isEditMode && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={loading}
                  className="mr-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}

              <div className="flex gap-3 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="px-6 py-2 text-sm font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>{isEditMode ? 'Update Authorization' : 'Create Authorization'}</>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="z-[9999] bg-white border-2 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-900">
              Delete Authorization?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600">
              This will permanently delete the authorization for <strong>{clientName}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Authorization'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

