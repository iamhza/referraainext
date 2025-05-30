import React, { useEffect, useState, useRef } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import Link from 'next/link';
import { MoreHorizontal, Hourglass, UserCheck, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface UIReferral {
  id: string;
  name: string;
  service: {
    type: string;
    urgency: 'high' | 'medium' | 'low';
  };
  status: string;
  createdAt: string;
}

type SortKey = 'id' | 'name' | 'service' | 'status' | 'createdAt';
type SortDirection = 'asc' | 'desc';

const BRAND_COLOR = '#11acf8fe';

// Add a UIReferralEdit type for local editing, including provider
type UIReferralEdit = Partial<UIReferral> & { provider?: string };

export function AdminReferralsTable() {
  const [referrals, setReferrals] = useState<UIReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('under_review');
  const [bulkCaseManager, setBulkCaseManager] = useState('Sarah Johnson');
  const [bulkProvider, setBulkProvider] = useState('Wellness Center');
  const caseManagers = ['Sarah Johnson', 'Alex Kim', 'Priya Patel'];
  const providers = ['Wellness Center', 'Hope Clinic', 'Bright Futures'];
  const statusOptions = [
    { value: 'under_review', label: 'Under Review' },
    { value: 'provider_selection_required', label: 'Provider Selection Required' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];
  const urgencyOptions = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];
  const serviceOptions = [
    { value: 'Adult rehabilitative mental health services (ARMHS)', label: 'ARMHS' },
    { value: 'Case Management', label: 'Case Management' },
    { value: 'Housing Support', label: 'Housing Support' },
    { value: 'Other', label: 'Other' },
  ];
  const [editingCell, setEditingCell] = useState<{ rowId: string; col: string } | null>(null);
  const [editValues, setEditValues] = useState<Record<string, UIReferralEdit>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchReferrals() {
      try {
        const response = await fetch('/api/referrals');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        const mapped: UIReferral[] = data.referrals.map((ref: any) => ({
          id: ref._id,
          name: `${ref.clientInfo?.firstName || ''} ${ref.clientInfo?.lastName || ''}`.trim(),
          service: {
            type: ref.serviceDetails?.type || '',
            urgency: ref.serviceDetails?.urgency || 'medium',
          },
          status: ref.status,
          createdAt: ref.createdAt,
        }));
        setReferrals(mapped);
      } catch (error) {
        setReferrals([]);
      } finally {
        setLoading(false);
      }
    }
    fetchReferrals();
  }, []);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  }

  function getSortedReferrals() {
    return [...referrals].sort((a, b) => {
      let aValue: any = a[sortKey];
      let bValue: any = b[sortKey];
      if (sortKey === 'service') {
        aValue = a.service.type;
        bValue = b.service.type;
      }
      if (sortKey === 'createdAt') {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      }
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        if (sortDirection === 'asc') return aValue.localeCompare(bValue);
        return bValue.localeCompare(aValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        if (sortDirection === 'asc') return aValue - bValue;
        return bValue - aValue;
      }
      return 0;
    });
  }

  // Pagination logic
  const sortedReferrals = getSortedReferrals();
  const totalPages = Math.ceil(sortedReferrals.length / PAGE_SIZE);
  const paginatedReferrals = sortedReferrals.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'under_review': {
        label: 'Under Review',
        className: 'bg-gray-50 border border-gray-200 text-gray-700',
        icon: Hourglass,
      },
      'provider_selection_required': {
        label: 'Provider Selection',
        className: 'bg-yellow-50 border border-yellow-200 text-yellow-700',
        icon: UserCheck,
      },
      'in_progress': {
        label: 'In Progress',
        className: 'bg-[#e6f7ff] border border-[#b3e5fc] text-[#11acf8fe]',
        icon: Clock,
      },
      'completed': {
        label: 'Completed',
        className: 'bg-green-50 border border-green-200 text-green-700',
        icon: CheckCircle,
      },
      'cancelled': {
        label: 'Cancelled',
        className: 'bg-red-50 border border-red-200 text-red-700',
        icon: XCircle,
      },
    }[status] || {
      label: status,
      className: 'bg-gray-50 border border-gray-200 text-gray-700',
      icon: AlertCircle,
    };
    const Icon = statusConfig.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.className}`}>
        <Icon className="h-3 w-3 mr-1" />
        {statusConfig.label}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: 'high' | 'medium' | 'low') => {
    const urgencyConfig = {
      high: { label: 'High', className: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
      medium: { label: 'Medium', className: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' },
      low: { label: 'Low', className: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
    }[urgency];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${urgencyConfig.className}`}>
        <span className={`w-2 h-2 rounded-full ${urgencyConfig.dot}`}></span>
        {urgencyConfig.label}
      </span>
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelected(new Set(paginatedReferrals.map(r => r.id)));
    } else {
      setSelected(new Set());
    }
  };
  const handleSelect = (id: string) => {
    setSelected(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  // Helper to get the value for a cell (from editValues or original)
  const getCellValue = (referral: UIReferral, col: string) => {
    const edits = editValues[referral.id] || {};
    if (col === 'name') return edits.name ?? referral.name;
    if (col === 'service') return edits.service?.type ?? referral.service.type;
    if (col === 'urgency') return edits.service?.urgency ?? referral.service.urgency;
    if (col === 'status') return edits.status ?? referral.status;
    if (col === 'provider') return edits.provider ?? '';
    return '';
  };

  // Add this function to update a referral
  async function updateReferral(id: string, update: Partial<UIReferral>) {
    const res = await fetch('/api/referrals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...update }),
    });
    if (!res.ok) throw new Error('Failed to update referral');
    const data = await res.json();
    return data.referral;
  }

  // Add this function to delete a referral
  async function deleteReferral(id: string) {
    const res = await fetch('/api/referrals', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error('Failed to delete referral');
  }

  // Update handleSave to PATCH for status/provider changes
  const handleSave = async (referral: UIReferral, col: string, value: any) => {
    setEditValues(prev => {
      const prevEdits = prev[referral.id] || {};
      let newEdits = { ...prevEdits };
      if (col === 'name') newEdits.name = value;
      if (col === 'status') newEdits.status = value;
      if (col === 'provider') (newEdits as any).provider = value; // UI only
      if (col === 'service') newEdits.service = { ...referral.service, type: value };
      if (col === 'urgency') newEdits.service = { ...referral.service, urgency: value };
      return {
        ...prev,
        [referral.id]: newEdits,
      };
    });
    setEditingCell(null);
    // Real PATCH for status/provider
    if (col === 'status' || col === 'provider') {
      try {
        const update: any = {};
        if (col === 'status') update.status = value;
        if (col === 'provider') update.assignedProvider = value;
        const updated = await updateReferral(referral.id, update);
        setReferrals(refs => refs.map(r => r.id === referral.id ? { ...r, ...update } : r));
        toast({ title: 'Referral updated', description: `Referral ${col} updated successfully.` });
      } catch (err) {
        toast({ title: 'Error', description: `Failed to update referral: ${err}`, variant: 'destructive' });
      }
    }
  };

  // Cancel edit
  const handleCancel = () => setEditingCell(null);

  // Keyboard handler for Enter/Escape
  const handleKeyDown = (e: React.KeyboardEvent, referral: UIReferral, col: string, value: any) => {
    if (e.key === 'Enter') {
      handleSave(referral, col, value);
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Helper to get service label
  const getServiceLabel = (value: string) => {
    const found = serviceOptions.find(opt => opt.value === value);
    return found ? found.label : value;
  };

  return (
    <div className="rounded-2xl shadow-xl bg-white/90 border border-gray-100 p-0 md:p-4 animate-fade-in relative">
      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div className="fixed left-0 right-0 top-0 z-30 bg-gradient-to-r from-white via-blue-50 to-white border-b border-blue-200 shadow-lg flex items-center justify-between px-8 py-3 animate-fade-in-up" style={{maxWidth: '100vw'}}>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-blue-700">{selected.size} selected</span>
            <Dialog open={showBulkStatusModal} onOpenChange={setShowBulkStatusModal}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-blue-400 text-blue-700 hover:bg-blue-100">Change Status</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Status (Bulk)</DialogTitle>
                  <DialogDescription>Select a new status for selected referrals.</DialogDescription>
                </DialogHeader>
                <Select value={bulkStatus} onValueChange={setBulkStatus}>
                  <SelectTrigger className="w-full mt-4">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DialogFooter className="mt-6">
                  <Button variant="default" onClick={() => setShowBulkStatusModal(false)}>Confirm</Button>
                  <Button variant="ghost" onClick={() => setShowBulkStatusModal(false)}>Cancel</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={showBulkAssignModal} onOpenChange={setShowBulkAssignModal}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-blue-400 text-blue-700 hover:bg-blue-100">Assign</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign (Bulk)</DialogTitle>
                  <DialogDescription>Select a case manager and provider for selected referrals.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Case Manager</label>
                    <Select value={bulkCaseManager} onValueChange={setBulkCaseManager}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select case manager" />
                      </SelectTrigger>
                      <SelectContent>
                        {caseManagers.map(cm => (
                          <SelectItem key={cm} value={cm}>{cm}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Provider</label>
                    <Select value={bulkProvider} onValueChange={setBulkProvider}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button variant="default" onClick={() => setShowBulkAssignModal(false)}>Confirm</Button>
                  <Button variant="ghost" onClick={() => setShowBulkAssignModal(false)}>Cancel</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="border-blue-400 text-blue-700 hover:bg-blue-100">Export</Button>
          </div>
          <Button variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}
      <div className="overflow-x-auto rounded-2xl">
        <Table className="min-w-full text-[15px] font-medium">
          <TableHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
            <TableRow>
              <TableHead className="w-10 px-3">
                <input
                  type="checkbox"
                  aria-label="Select all referrals"
                  checked={selected.size === paginatedReferrals.length && paginatedReferrals.length > 0}
                  onChange={handleSelectAll}
                  className="accent-[${BRAND_COLOR}] rounded border-gray-300 focus:ring-2 focus:ring-[${BRAND_COLOR}]"
                />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('id')}>
                Referral ID {sortKey === 'id' && (sortDirection === 'asc' ? '▲' : '▼')}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>Client Name {sortKey === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('service')}>Service {sortKey === 'service' && (sortDirection === 'asc' ? '▲' : '▼')}</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>Status {sortKey === 'status' && (sortDirection === 'asc' ? '▲' : '▼')}</TableHead>
              <TableHead className="text-center">Provider</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('createdAt')}>Created At {sortKey === 'createdAt' && (sortDirection === 'asc' ? '▲' : '▼')}</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-lg text-muted-foreground">Loading referrals...</TableCell>
              </TableRow>
            ) : paginatedReferrals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">No referrals found</TableCell>
              </TableRow>
            ) : (
              paginatedReferrals.map((referral) => {
                return (
                  <TableRow
                    key={referral.id}
                    className="transition-all duration-200 hover:bg-gradient-to-r hover:from-[#f0faff] hover:to-[#e6f7ff] hover:shadow-lg group"
                  >
                    <TableCell className="w-10 px-3">
                      <input
                        type="checkbox"
                        aria-label={`Select referral ${referral.id}`}
                        checked={selected.has(referral.id)}
                        onChange={() => handleSelect(referral.id)}
                        className="accent-[${BRAND_COLOR}] rounded border-gray-300 focus:ring-2 focus:ring-[${BRAND_COLOR}]"
                      />
                    </TableCell>
                    {/* Referral ID */}
                    <TableCell className="text-gray-600 font-mono text-xs select-all">
                      {referral.id}
                    </TableCell>
                    {/* Client Name */}
                    <TableCell
                      className={
                        editingCell?.rowId === referral.id && editingCell.col === 'name'
                          ? 'bg-blue-50 ring-2 ring-blue-300'
                          : 'text-gray-800 cursor-pointer'
                      }
                      onClick={() => setEditingCell({ rowId: referral.id, col: 'name' })}
                    >
                      {editingCell?.rowId === referral.id && editingCell.col === 'name' ? (
                        <input
                          ref={inputRef}
                          className="h-8 text-sm font-medium px-2 py-1 rounded border border-blue-300 focus:ring-2 focus:ring-blue-400"
                          defaultValue={getCellValue(referral, 'name')}
                          onBlur={e => handleSave(referral, 'name', e.target.value)}
                          onKeyDown={e => handleKeyDown(e, referral, 'name', (e.target as HTMLInputElement).value)}
                          autoFocus
                        />
                      ) : (
                        getCellValue(referral, 'name')
                      )}
                    </TableCell>
                    {/* Service */}
                    <TableCell
                      className={
                        editingCell?.rowId === referral.id && editingCell.col === 'service'
                          ? 'bg-blue-50 ring-2 ring-blue-300'
                          : 'text-gray-700 cursor-pointer'
                      }
                      onClick={() => setEditingCell({ rowId: referral.id, col: 'service' })}
                    >
                      {editingCell?.rowId === referral.id && editingCell.col === 'service' ? (
                        <Select
                          value={getCellValue(referral, 'service')}
                          onValueChange={val => handleSave(referral, 'service', val)}
                        >
                          <SelectTrigger className="h-8 text-sm font-medium px-3 py-1 rounded-full border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-[${BRAND_COLOR}] focus:border-[${BRAND_COLOR}] transition-colors">
                            <SelectValue placeholder="Select service" />
                          </SelectTrigger>
                          <SelectContent className="bg-white shadow-lg rounded-md border border-gray-200 py-1">
                            {serviceOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
                          {getServiceLabel(getCellValue(referral, 'service'))}
                        </span>
                      )}
                    </TableCell>
                    {/* Urgency */}
                    <TableCell
                      className={
                        editingCell?.rowId === referral.id && editingCell.col === 'urgency'
                          ? 'bg-blue-50 ring-2 ring-blue-300'
                          : 'cursor-pointer'
                      }
                      onClick={() => setEditingCell({ rowId: referral.id, col: 'urgency' })}
                    >
                      {editingCell?.rowId === referral.id && editingCell.col === 'urgency' ? (
                        <Select
                          value={getCellValue(referral, 'urgency')}
                          onValueChange={val => handleSave(referral, 'urgency', val)}
                        >
                          <SelectTrigger className="h-8 text-sm font-medium px-3 py-1 rounded-full border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-[${BRAND_COLOR}] focus:border-[${BRAND_COLOR}] transition-colors">
                            <SelectValue placeholder="Select urgency" />
                          </SelectTrigger>
                          <SelectContent className="bg-white shadow-lg rounded-md border border-gray-200 py-1">
                            {urgencyOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        getUrgencyBadge(getCellValue(referral, 'urgency') as 'high' | 'medium' | 'low')
                      )}
                    </TableCell>
                    {/* Status */}
                    <TableCell
                      className={
                        editingCell?.rowId === referral.id && editingCell.col === 'status'
                          ? 'bg-blue-50 ring-2 ring-blue-300'
                          : 'cursor-pointer'
                      }
                      onClick={() => setEditingCell({ rowId: referral.id, col: 'status' })}
                    >
                      {editingCell?.rowId === referral.id && editingCell.col === 'status' ? (
                        <Select
                          value={getCellValue(referral, 'status')}
                          onValueChange={val => handleSave(referral, 'status', val)}
                        >
                          <SelectTrigger className="h-8 text-sm font-medium px-3 py-1 rounded-full border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-[${BRAND_COLOR}] focus:border-[${BRAND_COLOR}] transition-colors">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent className="bg-white shadow-lg rounded-md border border-gray-200 py-1">
                            {statusOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        getStatusBadge(getCellValue(referral, 'status'))
                      )}
                    </TableCell>
                    {/* Provider */}
                    <TableCell
                      className={
                        editingCell?.rowId === referral.id && editingCell.col === 'provider'
                          ? 'bg-blue-50 ring-2 ring-blue-300'
                          : 'text-center cursor-pointer min-w-[180px]'
                      }
                      onClick={() => setEditingCell({ rowId: referral.id, col: 'provider' })}
                    >
                      {editingCell?.rowId === referral.id && editingCell.col === 'provider' ? (
                        <Select
                          value={getCellValue(referral, 'provider')}
                          onValueChange={val => handleSave(referral, 'provider', val)}
                        >
                          <SelectTrigger className="h-8 text-sm font-medium px-3 py-1 rounded-full border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-[${BRAND_COLOR}] focus:border-[${BRAND_COLOR}] transition-colors">
                            <SelectValue placeholder="Assign provider" />
                          </SelectTrigger>
                          <SelectContent className="bg-white shadow-lg rounded-md border border-gray-200 py-1">
                            {providers.map(p => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={
                          getCellValue(referral, 'provider')
                            ? 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors'
                            : 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-400 border border-gray-200 hover:bg-gray-200 transition-colors'
                        }>
                          {getCellValue(referral, 'provider') || 'Unassigned'}
                        </span>
                      )}
                    </TableCell>
                    {/* Created At */}
                    <TableCell className="text-gray-500">
                      {format(new Date(referral.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    {/* Actions */}
                    <TableCell className="flex gap-2 items-center">
                      <Button asChild size="sm" variant="outline" className="border-[${BRAND_COLOR}] text-[${BRAND_COLOR}] hover:bg-[${BRAND_COLOR}] hover:text-white transition-colors">
                        <Link href={`/admin/referrals/${referral.id}`}>View</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to delete this referral?')) {
                            try {
                              await deleteReferral(referral.id);
                              setReferrals(refs => refs.filter(r => r.id !== referral.id));
                              toast({ title: 'Referral deleted' });
                            } catch (err) {
                              toast({ title: 'Error', description: `Failed to delete referral: ${err}`, variant: 'destructive' });
                            }
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4 px-2">
        <div className="text-sm text-gray-500">
          Showing {(currentPage - 1) * PAGE_SIZE + 1}
          -{Math.min(currentPage * PAGE_SIZE, sortedReferrals.length)} of {sortedReferrals.length}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="border-gray-300"
          >
            Previous
          </Button>
          <span className="text-gray-700 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="border-gray-300"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
} 