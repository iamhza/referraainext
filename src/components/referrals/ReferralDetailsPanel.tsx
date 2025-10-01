'use client';

import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, Calendar, Clock, User, Building2, Phone, Mail, MapPin, FileText, MessageSquare, AlertCircle, CheckCircle, XCircle, Activity, Shield, Heart, Languages, Wheelchair, Home, Stethoscope, CreditCard, Flag, Globe, Users, ArrowRight, Circle, CheckCircle2, Send, UserPlus, Play, Award, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { 
  ProfessionalDrawer,
  DrawerHeader,
  DrawerBody,
  DrawerTitle,
  DrawerSubtitle,
  DrawerSection
} from '@/components/ui/professional-drawer';
import { STATUS_FLOW, type ReferralStatus } from '@/types';

// Accurate Status Journey Configuration based on your system
const STATUS_JOURNEY = [
  { 
    key: 'draft', 
    label: 'Draft', 
    icon: Clock, 
    description: 'Referral form started but not submitted',
    color: 'gray' 
  },
  { 
    key: 'submitted', 
    label: 'Submitted', 
    icon: AlertCircle, 
    description: 'Referral officially submitted for review',
    color: 'blue' 
  },
  { 
    key: 'matched', 
    label: 'Matched', 
    icon: UserPlus, 
    description: 'Provider shortlist generated',
    color: 'purple' 
  },
  { 
    key: 'sent_to_provider', 
    label: 'Sent to Provider', 
    icon: Send, 
    description: 'Referral delivered to selected provider',
    color: 'blue' 
  },
  { 
    key: 'accepted', 
    label: 'Accepted', 
    icon: CheckCircle, 
    description: 'Provider accepted the referral',
    color: 'green' 
  },
  { 
    key: 'active', 
    label: 'Active Service', 
    icon: Activity, 
    description: 'Services have started',
    color: 'emerald' 
  },
  { 
    key: 'completed', 
    label: 'Completed', 
    icon: CheckCircle2, 
    description: 'Services finished successfully',
    color: 'green' 
  },
];

const TERMINAL_STATUSES = ['completed', 'rejected', 'cancelled', 'expired'];

// World-Class Horizontal Progress Component
function StatusJourney({ currentStatus }: { currentStatus: string }) {
  const currentIndex = STATUS_JOURNEY.findIndex(status => status.key === currentStatus);
  const isTerminalStatus = TERMINAL_STATUSES.includes(currentStatus);
  const statusConfig = STATUS_FLOW[currentStatus as ReferralStatus] || STATUS_FLOW.draft;
  
  // Handle terminal statuses that aren't in the main flow
  const isRejected = currentStatus === 'rejected';
  const isCancelled = currentStatus === 'cancelled';
  const isExpired = currentStatus === 'expired';
  const isTerminalFailure = isRejected || isCancelled || isExpired;
  
  return (
    <div className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-slate-900">Referral Progress</h4>
          <Badge 
            className={`text-xs h-5 px-2 ${
              currentStatus === 'completed' 
                ? 'bg-green-100 text-green-700 border-green-200' 
                : isTerminalFailure
                  ? 'bg-red-100 text-red-700 border-red-200'
                : 'bg-primary-100 text-primary-700 border-primary-200'
            }`}
          >
            {currentStatus === 'completed' ? 'Complete' : 
             isTerminalFailure ? statusConfig.label : 'In Progress'}
          </Badge>
        </div>
        <p className="text-xs text-slate-600">
          {statusConfig.description || 'Track the status of this referral through each stage'}
        </p>
      </div>
      
      <div className="relative">
        {/* Progress Line Background */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 rounded-full" />
        
        {/* Active Progress Line */}
        <div 
          className={`absolute top-4 left-4 h-0.5 rounded-full transition-all duration-1000 ease-out ${
            isTerminalFailure 
              ? 'bg-gradient-to-r from-red-400 to-red-500' 
              : 'bg-gradient-to-r from-secondary-500 to-primary-500'
          }`}
          style={{ 
            width: isTerminalFailure 
              ? '100%' 
              : currentIndex >= 0 
                ? `calc(${(currentIndex / (STATUS_JOURNEY.length - 1)) * 100}% - 16px)` 
                : '0%' 
          }}
        />
        
        {/* Status Steps */}
        <div className="relative flex justify-between">
          {STATUS_JOURNEY.map((status, index) => {
            const Icon = status.icon;
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isUpcoming = index > currentIndex;
            
            // Handle terminal failure states
            const isFailedStep = isTerminalFailure && index > 0;
            
            return (
              <div key={status.key} className="flex flex-col items-center group">
                {/* Step Circle */}
                <div className={`
                  relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ease-out
                  ${isTerminalFailure && index === 0
                    ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md shadow-red-500/25'
                    : isFailedStep
                      ? 'bg-red-100 border-2 border-red-200 text-red-400'
                      : isCompleted 
                        ? 'bg-gradient-to-br from-secondary-500 to-secondary-600 text-white shadow-md shadow-secondary-500/25' 
                        : isCurrent 
                          ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/25 scale-110 ring-2 ring-primary-100' 
                          : 'bg-white border-2 border-slate-200 text-slate-400 hover:border-slate-300'
                  }
                `}>
                  {isTerminalFailure && index === 0 ? (
                    <XCircle className="w-4 h-4" />
                  ) : isFailedStep ? (
                    <XCircle className="w-4 h-4" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Icon className={`w-4 h-4 transition-transform duration-300 ${isCurrent ? 'scale-110' : ''}`} />
                  )}
                  
                  {/* Pulse animation for current step */}
                  {isCurrent && !isTerminalFailure && (
                    <div className="absolute inset-0 rounded-full bg-primary-500 animate-ping opacity-20" />
                  )}
                </div>
                
                {/* Step Label */}
                <div className="mt-2 text-center max-w-[70px]">
                  <span className={`
                    text-xs font-medium leading-tight transition-colors duration-300 block
                    ${isTerminalFailure && index === 0
                      ? 'text-red-700'
                      : isFailedStep
                        ? 'text-red-400'
                        : isCompleted || isCurrent 
                          ? 'text-slate-900' 
                          : 'text-slate-500 group-hover:text-slate-600'
                    }
                  `}>
                    {status.key === 'sent_to_provider' ? (
                      <>
                        <span className="block">Sent to</span>
                        <span className="block">Provider</span>
                      </>
                    ) : (
                      status.label
                    )}
                  </span>
                  
                  {/* Current step indicator */}
                  {isCurrent && !isTerminalFailure && (
                    <div className="mt-1">
                      <div className="w-1 h-1 bg-primary-500 rounded-full mx-auto animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Terminal Status Display */}
        {isTerminalFailure && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="w-4 h-4" />
              <span className="font-medium text-sm">
                Referral {statusConfig.label}
              </span>
            </div>
            <p className="text-xs text-red-600 mt-1">
              {statusConfig.description}
            </p>
          </div>
        )}
        
        {/* Status Summary */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">
              {isTerminalFailure 
                ? `Stopped at: ${statusConfig.label}` 
                : `Step ${Math.max(currentIndex + 1, 1)} of ${STATUS_JOURNEY.length}`
              }
            </span>
            <span className="text-slate-900 font-medium">
              Progress: {statusConfig.progressValue}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ReferralDetailsPanelProps {
  referral: any;
  isOpen: boolean;
  onClose: () => void;
  onBackToDrawer: () => void;
}

export function ReferralDetailsPanel({ referral, isOpen, onClose, onBackToDrawer }: ReferralDetailsPanelProps) {
  const [showId, setShowId] = useState(false);
  const [currentCaseManager, setCurrentCaseManager] = useState<any>(null);
  const [caseManagerLoading, setCaseManagerLoading] = useState(false);

  // Fetch current case manager information
  useEffect(() => {
    if (!isOpen || !referral?.caseManagerId) return;
    
    const fetchCurrentCaseManager = async () => {
      setCaseManagerLoading(true);
      try {
        const response = await fetch(`/api/users/${referral.caseManagerId}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentCaseManager(data.user);
        }
      } catch (error) {
        console.error('Failed to fetch current case manager:', error);
      } finally {
        setCaseManagerLoading(false);
      }
    };

    fetchCurrentCaseManager();
  }, [isOpen, referral?.caseManagerId]);

  if (!isOpen || !referral) return null;

  // Helper functions
  const getStatusConfig = (status: string) => {
    const configs = {
      'draft': { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: FileText, bg: 'bg-gray-100' },
      'submitted': { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: CheckCircle, bg: 'bg-blue-100' },
      'matched': { label: 'Matched', color: 'bg-purple-100 text-purple-700', icon: Users, bg: 'bg-purple-100' },
      'sent_to_provider': { label: 'Sent to Provider', color: 'bg-blue-100 text-blue-700', icon: Activity, bg: 'bg-blue-100' },
      'accepted': { label: 'Accepted', color: 'bg-green-100 text-green-700', icon: CheckCircle, bg: 'bg-green-100' },
      'active': { label: 'Active', color: 'bg-emerald-100 text-emerald-700', icon: Activity, bg: 'bg-emerald-100' },
      'completed': { label: 'Completed', color: 'bg-slate-100 text-slate-700', icon: CheckCircle, bg: 'bg-slate-100' },
      'rejected': { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle, bg: 'bg-red-100' },
      'cancelled': { label: 'Cancelled', color: 'bg-orange-100 text-orange-700', icon: XCircle, bg: 'bg-orange-100' },
      'expired': { label: 'Expired', color: 'bg-gray-100 text-gray-700', icon: Clock, bg: 'bg-gray-100' }
    };
    return configs[status as keyof typeof configs] || configs.draft;
  };

  const getUrgencyConfig = (urgency: string) => {
    const configs = {
      'low': { label: 'Low Priority', color: 'text-green-600 border-green-200', dot: 'bg-green-400' },
      'medium': { label: 'Medium Priority', color: 'text-yellow-600 border-yellow-200', dot: 'bg-yellow-400' },
      'high': { label: 'High Priority', color: 'text-red-600 border-red-200', dot: 'bg-red-400' }
    };
    return configs[urgency as keyof typeof configs] || configs.medium;
  };

  const statusConfig = getStatusConfig(referral.status);
  const urgencyConfig = getUrgencyConfig(referral.serviceDetails?.urgency || referral.urgency);
  const StatusIcon = statusConfig.icon;

  // Format data helpers
  const formatCounties = (counties: string[] | string) => {
    if (!counties) return null;
    const countiesArray = Array.isArray(counties) ? counties : [counties];
    return countiesArray.map(county => 
      county.charAt(0).toUpperCase() + county.slice(1).toLowerCase()
    ).join(', ');
  };

  const formatInsurance = (insurance: any) => {
    if (typeof insurance === 'string') return insurance;
    if (!insurance) return null;
    return insurance.type || 'On File';
  };

  // Enhanced text formatting utilities
  const formatProperCase = (text: string) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .split(/[\s_-]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatServiceType = (serviceType: string) => {
    if (!serviceType) return 'Not specified';
    return serviceType
      .replace(/[_-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    // Format as (XXX) XXX-XXXX if 10 digits
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone; // Return original if not 10 digits
  };

  const formatAddress = (address: any) => {
    if (typeof address === 'string') return address;
    if (!address) return null;
    
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state && address.zipCode) {
      parts.push(`${address.state} ${address.zipCode}`);
    } else if (address.state) {
      parts.push(address.state);
    } else if (address.zipCode) {
      parts.push(address.zipCode);
    }
    
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const formatClientName = (clientInfo: any) => {
    if (!clientInfo) return 'Unknown Client';
    
    const firstName = clientInfo.firstName?.trim() || '';
    const lastName = clientInfo.lastName?.trim() || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    }
    
    return 'Unknown Client';
  };

  const formatArrayList = (items: string[] | string) => {
    if (!items) return '';
    if (typeof items === 'string') return items;
    if (Array.isArray(items) && items.length > 0) {
      return items.map(item => formatProperCase(item)).join(', ');
    }
    return '';
  };

  return (
    <ProfessionalDrawer
      isOpen={isOpen}
      onClose={onClose}
      side="right"
      width="600px"
      className="top-20 h-[calc(100vh-5rem)] z-50"
    >
      <div className="flex flex-col h-full">
        <DrawerHeader onClose={onClose} showCloseButton={false}>
        <div className="space-y-4">
          {/* Top Row - Navigation and Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToDrawer}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Client
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowId(!showId)}
                className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-2 transition-colors"
                title={showId ? "Hide referral ID" : "Show referral ID"}
              >
                {showId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Main Header Content */}
          <div className="space-y-3">
            {/* Title and Service Type */}
            <div>
              <DrawerTitle className="text-xl font-semibold text-slate-900">
                Referral Details
              </DrawerTitle>
              <DrawerSubtitle className="text-sm text-slate-600 mt-1">
                {formatServiceType(referral.serviceDetails?.type || referral.serviceType)}
              </DrawerSubtitle>
            </div>

            {/* Client Information Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-start gap-4">
                  {/* Client Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center text-white font-semibold text-lg shadow-sm border-2 border-white ring-2 ring-slate-100">
                      {referral.clientInfo ? 
                        `${referral.clientInfo.firstName?.[0] || ''}${referral.clientInfo.lastName?.[0] || ''}`.toUpperCase() || 'C' :
                        'C'
                      }
                    </div>
                  </div>

                {/* Client Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900 truncate">
                      {referral.clientInfo ? formatClientName(referral.clientInfo) : 'Unknown Client'}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge className={`${statusConfig.color} text-xs h-6 px-3 shadow-sm`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                      <Badge className={`${urgencyConfig.color} border text-xs h-6 px-3 shadow-sm`}>
                        <div className={`w-2 h-2 rounded-full ${urgencyConfig.dot} mr-1`} />
                        {urgencyConfig.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>Case Manager: {
                        caseManagerLoading ? 'Loading...' : 
                        formatProperCase(currentCaseManager?.full_name || currentCaseManager?.name || referral.caseManager?.name || referral.caseManagerName || 'Unassigned')
                      }</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Created {formatDistanceToNow(new Date(referral.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>

                  {/* Referral ID (if shown) */}
                  {showId && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Referral ID:</span>
                        <code className="text-xs bg-white px-2 py-1 rounded border font-mono text-slate-700 select-all">
                          {referral._id}
                        </code>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DrawerHeader>

      <DrawerBody>
        {/* Progress Indicator */}
        <DrawerSection>
          <StatusJourney currentStatus={referral.status} />
        </DrawerSection>

        {/* Referral Overview */}
        <DrawerSection>
          <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Overview</h3>
              <div className="flex items-center gap-2">
                <Badge className={`${statusConfig.color} text-xs h-6 px-3`}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig.label}
                </Badge>
                <Badge className={`${urgencyConfig.color} border text-xs h-6 px-3`}>
                  <div className={`w-2 h-2 rounded-full ${urgencyConfig.dot} mr-1`} />
                  {urgencyConfig.label}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Service Type</label>
                  <p className="text-sm font-medium text-slate-900">
                    {formatServiceType(referral.serviceDetails?.type || referral.serviceType)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Client</label>
                  <p className="text-sm font-medium text-slate-900">
                    {referral.clientInfo ? formatClientName(referral.clientInfo) : (referral.clientName || 'Unknown Client')}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Case Manager</label>
                  <p className="text-sm font-medium text-slate-900">
                    {caseManagerLoading ? 'Loading...' : 
                     formatProperCase(currentCaseManager?.full_name || currentCaseManager?.name || referral.caseManager?.name || referral.caseManagerName || 'Unassigned')
                    }
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Created</label>
                  <p className="text-sm font-medium text-slate-900">{formatDistanceToNow(new Date(referral.createdAt), { addSuffix: true })}</p>
                  {referral.updatedAt && referral.updatedAt !== referral.createdAt && (
                    <p className="text-xs text-slate-600 mt-1">
                      Updated {formatDistanceToNow(new Date(referral.updatedAt), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DrawerSection>

        {/* Service Details */}
        <DrawerSection>
          <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Service Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                {(referral.serviceDetails?.description || referral.serviceDetails?.additionalNotes) && (
                  <div>
                    <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Description</label>
                    <p className="text-sm text-slate-900 mt-1">
                      {referral.serviceDetails?.description || referral.serviceDetails?.additionalNotes || 'No description provided'}
                    </p>
                  </div>
                )}
                {referral.serviceDetails?.urgency && (
                  <div>
                    <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Urgency</label>
                    <p className="text-sm text-slate-900 mt-1">{formatProperCase(referral.serviceDetails.urgency)}</p>
                  </div>
                )}
                {referral.serviceDetails?.referralReason && (
                  <div>
                    <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Referral Reason</label>
                    <p className="text-sm text-slate-900 mt-1">{referral.serviceDetails.referralReason}</p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {referral.serviceDetails?.counties && (
                  <div>
                    <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Counties</label>
                    <p className="text-sm text-slate-900 mt-1">
                      {formatArrayList(referral.serviceDetails.counties)}
                    </p>
                  </div>
                )}
                {referral.serviceDetails?.requestedStartDate && (
                  <div>
                    <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Requested Start Date</label>
                    <p className="text-sm text-slate-900 mt-1">
                      {new Date(referral.serviceDetails.requestedStartDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DrawerSection>

        {/* Clinical Information */}
        {(referral.clientInfo?.mobilityStatus || referral.clientInfo?.primaryDiagnosis || referral.clientInfo?.livingSituation || referral.clientInfo?.culturalConsiderations) && (
          <DrawerSection>
            <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Clinical Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  {referral.clientInfo?.mobilityStatus && (
                    <div>
                      <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Mobility Status</label>
                      <p className="text-sm text-slate-900 mt-1">
                        {formatProperCase(referral.clientInfo.mobilityStatus)}
                      </p>
                    </div>
                  )}
                  {referral.clientInfo?.primaryDiagnosis && (
                    <div>
                      <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Primary Diagnosis</label>
                      <p className="text-sm text-slate-900 mt-1">{referral.clientInfo.primaryDiagnosis}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {referral.clientInfo?.livingSituation && (
                    <div>
                      <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Living Situation</label>
                      <p className="text-sm text-slate-900 mt-1">
                        {formatProperCase(referral.clientInfo.livingSituation)}
                      </p>
                    </div>
                  )}
                  {referral.clientInfo?.culturalConsiderations && (
                    <div>
                      <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Cultural Considerations</label>
                      <p className="text-sm text-slate-900 mt-1">{referral.clientInfo.culturalConsiderations}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DrawerSection>
        )}

        {/* Client Information */}
        {referral.clientInfo && (
          <DrawerSection>
            <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Client Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  {referral.clientInfo.email && (
                    <div>
                      <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Email</label>
                      <p className="text-sm text-slate-900 mt-1">{referral.clientInfo.email}</p>
                    </div>
                  )}
                  {referral.clientInfo.phone && (
                    <div>
                      <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Phone</label>
                      <p className="text-sm text-slate-900 mt-1">{formatPhoneNumber(referral.clientInfo.phone)}</p>
                    </div>
                  )}
                  {referral.clientInfo.dateOfBirth && (
                    <div>
                      <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Date of Birth</label>
                      <p className="text-sm text-slate-900 mt-1">
                        {new Date(referral.clientInfo.dateOfBirth).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {referral.clientInfo.sex && (
                    <div>
                      <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Gender</label>
                      <p className="text-sm text-slate-900 mt-1">
                        {formatProperCase(referral.clientInfo.sex)}
                      </p>
                    </div>
                  )}
                  {referral.clientInfo.pmiNumber && (
                    <div>
                      <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">PMI Number</label>
                      <p className="text-sm text-slate-900 mt-1">{referral.clientInfo.pmiNumber}</p>
                    </div>
                  )}
                  {referral.clientInfo.waiverType && (
                    <div>
                      <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Waiver Type</label>
                      <p className="text-sm text-slate-900 mt-1 uppercase">{referral.clientInfo.waiverType}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {referral.clientInfo.address && (
                    <div>
                      <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Address</label>
                      <p className="text-sm text-slate-900 mt-1">
                        {formatAddress(referral.clientInfo.address)}
                      </p>
                    </div>
                  )}
                  {referral.clientInfo.insurance && (
                    <div>
                      <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Insurance</label>
                      <p className="text-sm text-slate-900 mt-1">
                        {typeof referral.clientInfo.insurance === 'string' 
                          ? referral.clientInfo.insurance
                          : referral.clientInfo.insurance.type || 'On file'
                        }
                        {referral.clientInfo.insurance?.provider && (
                          <span className="block text-xs text-slate-600 mt-1">
                            Provider: {referral.clientInfo.insurance.provider}
                          </span>
                        )}
                        {referral.clientInfo.insurance?.number && (
                          <span className="block text-xs text-slate-600 mt-1">
                            Number: {referral.clientInfo.insurance.number}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                  {referral.clientInfo.preferredContactMethod && (
                    <div>
                      <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Preferred Contact</label>
                      <p className="text-sm text-slate-900 mt-1">
                        {formatProperCase(referral.clientInfo.preferredContactMethod)}
                      </p>
                    </div>
                  )}
                  {referral.clientInfo.primaryLanguage && (
                    <div>
                      <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Primary Language</label>
                      <p className="text-sm text-slate-900 mt-1">
                        {referral.clientInfo.primaryLanguage}
                        {referral.clientInfo.needsTranslator && (
                          <span className="ml-2 text-xs text-amber-600">(Translator needed)</span>
                        )}
                      </p>
                    </div>
                  )}
                  {referral.clientInfo.historyOfViolence !== undefined && (
                    <div>
                      <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">History of Violence</label>
                      <p className="text-sm text-slate-900 mt-1">
                        {referral.clientInfo.historyOfViolence ? 'Yes' : 'No'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DrawerSection>
        )}

        {/* Provider Preferences */}
        {referral.providerPreferences && (
          <DrawerSection>
            <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Provider Preferences</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  {referral.providerPreferences.providerType && referral.providerPreferences.providerType !== 'no-preference' && (
                    <div>
                      <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Provider Type</label>
                      <p className="text-sm text-slate-900 mt-1">
                        {formatProperCase(referral.providerPreferences.providerType)}
                      </p>
                    </div>
                  )}
                  {referral.providerPreferences.languages && referral.providerPreferences.languages.length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Languages</label>
                      <p className="text-sm text-slate-900 mt-1">
                        {formatArrayList(referral.providerPreferences.languages)}
                      </p>
                    </div>
                  )}
                  {referral.providerPreferences.availableTimes && referral.providerPreferences.availableTimes.length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Available Times</label>
                      <p className="text-sm text-slate-900 mt-1">
                        {formatArrayList(referral.providerPreferences.availableTimes)}
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {referral.providerPreferences.insuranceAccepted && referral.providerPreferences.insuranceAccepted.length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Insurance Accepted</label>
                      <p className="text-sm text-slate-900 mt-1">
                        {formatArrayList(referral.providerPreferences.insuranceAccepted)}
                      </p>
                    </div>
                  )}
                  {referral.providerPreferences.emergencyServices !== undefined && (
                    <div>
                      <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Emergency Services</label>
                      <p className="text-sm text-slate-900 mt-1">
                        {referral.providerPreferences.emergencyServices ? 'Required' : 'Not required'}
                      </p>
                    </div>
                  )}
                  {referral.providerPreferences.showAvailableOnly !== undefined && (
                    <div>
                      <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Show Available Only</label>
                      <p className="text-sm text-slate-900 mt-1">
                        {referral.providerPreferences.showAvailableOnly ? 'Yes' : 'No'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DrawerSection>
        )}

        {/* Provider Assignment Status */}
        <DrawerSection>
          <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Provider Assignment</h3>
            {referral.assignedProvider?.name || referral.assignedProviderName || referral.providerName ? (
              <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-green-900">
                    {formatProperCase(referral.assignedProvider?.name || referral.assignedProviderName || referral.providerName)}
                  </p>
                  {(referral.assignedProvider?.organization || referral.assignedProviderOrganization) && (
                    <p className="text-green-700 text-sm mt-1">
                      {formatProperCase(referral.assignedProvider?.organization || referral.assignedProviderOrganization)}
                    </p>
                  )}
                  <p className="text-green-600 text-sm mt-1">✓ Provider assigned and ready to begin services</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center justify-center w-10 h-10 bg-amber-100 rounded-full">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-amber-900">Awaiting Provider Assignment</p>
                  <p className="text-amber-700 text-sm mt-1">No provider has been assigned yet</p>
                  <p className="text-amber-600 text-sm mt-1">⏳ Referral is in queue for provider matching</p>
                </div>
              </div>
            )}
          </div>
        </DrawerSection>
      </DrawerBody>
      </div>
    </ProfessionalDrawer>
  );
}

