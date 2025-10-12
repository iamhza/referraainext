'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Edit, Edit3, Send, Calendar, User, Building2, Phone, FileText, Loader2, AlertTriangle, ExternalLink, AlertCircle, MessageSquare, Link as LinkIcon, Plus, Trash2, Eye, EyeOff, Clock, ArrowRight, CheckCircle, XCircle, MapPin, Activity, ChevronRight, List, FolderOpen, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Timeline } from './Timeline';
import { formatDistanceToNow } from 'date-fns';
import { ReferralDetailsPanel } from '@/components/referrals/ReferralDetailsPanel';
import { formatSafeDate } from '@/lib/date-utils';
import { formatWaiverType } from '@/lib/formatting';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ServiceFeedTab } from '@/components/actions/ServiceFeedTab';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConnectModal } from '@/components/connections/ConnectModal';
import { 
  ProfessionalDrawer,
  DrawerHeader,
  DrawerBody,
  DrawerTitle,
  DrawerSubtitle,
  DrawerTabs,
  DrawerSection
} from '@/components/ui/professional-drawer';
import { cn } from '@/lib/utils';
import { getClientStatusConfig } from '@/types/index';

interface Client {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  sex?: string;
  phoneNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  insurance?: string | { type: string; provider?: string; number?: string; };
  insuranceProvider?: string;
  pmiNumber?: string;
  waiverType?: string;
  primaryLanguage?: string;
  mobilityStatus?: string;
  status: string;
  caseManagerId?: string;
  pmi?: string;
  serviceType?: string;
  serviceType1?: string;
  createdAt?: string;
  updatedAt?: string;
  activeReferrals?: number;
  pendingReferrals?: number;
  unreadMessages?: number;
  assignedBy?: string;
  assignedAt?: string;
}

interface Connection {
  _id: string;
  matchKey: string;
  isActivated: boolean;
  clientName: string;
  providerName: string;
}

interface ClientSideDrawerProps {
  client: Client | null;
  connections: Connection[];
  isOpen: boolean;
  onClose: () => void;
  onRequestUpdate?: (clientId: string) => void;
  onViewProfile?: () => void;
}

type TabType = 'overview' | 'referrals' | 'timeline' | 'actions' | 'documents';

export function ClientSideDrawer({ 
  client, 
  connections = [], 
  isOpen, 
  onClose, 
  onRequestUpdate,
  onViewProfile
}: ClientSideDrawerProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isReferralDetailsPanelOpen, setIsReferralDetailsPanelOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<any>(null);
  const [isConnectProviderModalOpen, setIsConnectProviderModalOpen] = useState(false);
  const [selectedServiceFeedContextId, setSelectedServiceFeedContextId] = useState<string | undefined>(undefined);
  const router = useRouter();

  // Enhanced close handler with animation
  const handleClose = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      onClose();
      setIsAnimating(false);
    }, 250); // Match animation duration
  }, [onClose]);

  // Referral details panel handlers
  const handleViewReferralDetails = useCallback((referral: any) => {
    setSelectedReferral(referral);
    setIsReferralDetailsPanelOpen(true);
  }, []);

  const handleCloseReferralDetails = useCallback(() => {
    setIsReferralDetailsPanelOpen(false);
    setSelectedReferral(null);
  }, []);

  const handleBackToDrawer = useCallback(() => {
    setIsReferralDetailsPanelOpen(false);
    // Keep the referral selected but close the panel
  }, []);

  // Navigation to Service Feed with specific referral selected
  const handleNavigateToServiceFeed = useCallback((referralId: string) => {
    setSelectedServiceFeedContextId(referralId);
    setActiveTab('actions');
  }, []);

  const handleConnectProvider = useCallback(() => {
    setIsConnectProviderModalOpen(true);
  }, []);

  const handleConnectionRequested = useCallback(() => {
    // Refresh the client data to show new connection status
    if (onRequestUpdate && client) {
      onRequestUpdate(client._id);
    }
  }, [client, onRequestUpdate]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, handleClose]);

  // Reset tab when drawer opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview');
      setSelectedServiceFeedContextId(undefined);
    }
  }, [isOpen]);

  if (!client) return null;

  // Helper functions
  const normalizeKey = (firstName: string, lastName: string, dob: string) => {
    return `${firstName.toLowerCase().trim()}_${lastName.toLowerCase().trim()}_${dob}`;
  };

  const getClientConnection = () => {
    if (!client.firstName || !client.lastName || !client.dateOfBirth) return null;
    const clientKey = normalizeKey(client.firstName, client.lastName, client.dateOfBirth);
    return connections.find(conn => conn.matchKey === clientKey);
  };

  const getConnectionStatus = () => {
    const connection = getClientConnection();
    if (!connection) return { badge: '❌', label: 'Not Connected', color: 'bg-red-100 text-red-700' };
    if (connection.isActivated) return { badge: '✅', label: 'Connected', color: 'bg-green-100 text-green-700' };
    return { badge: '⏳', label: 'Pending', color: 'bg-yellow-100 text-yellow-700' };
  };

  const connectionStatus = getConnectionStatus();
  const statusConfig = getClientStatusConfig(client.status as any);
  
  // Get proper status dot color based on centralized config
  const getStatusDotColor = (status: string) => {
    const config = getClientStatusConfig(status as any);
    switch (config.color) {
      case 'red': return 'bg-red-500';
      case 'blue': return 'bg-blue-500';
      case 'purple': return 'bg-purple-500';
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'gray': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: User },
    { id: 'referrals' as TabType, label: 'Referrals', icon: FileText },
    { id: 'timeline' as TabType, label: 'Timeline', icon: Calendar },
    { id: 'actions' as TabType, label: 'Service Feed', icon: List },
    { id: 'documents' as TabType, label: 'Documents', icon: FolderOpen },
  ];

  return (
    <>
      {/* Drawer content renders directly - positioning controlled by parent */}
      <div className="flex flex-col h-full w-full overflow-hidden bg-white">
          {/* Header - Compact Professional Design */}
          <div className="border-b border-slate-200/80 px-5 py-4 bg-gradient-to-br from-white via-slate-50/20 to-white">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                {/* Name, Status & Contact - Compact Single Section */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight mb-1.5">
                      {client.firstName} {client.lastName}
                    </h1>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div 
                        className={`w-2 h-2 rounded-full ring-2 ring-white shadow-sm ${getStatusDotColor(client.status)}`} 
                        title={statusConfig.label} 
                      />
                      <Badge 
                        variant="secondary" 
                        className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 border border-slate-200/60"
                      >
                        {statusConfig.label}
                      </Badge>
                      {client.assignedBy && (
                        <Badge className="text-[11px] font-medium px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60">
                          Supervisor
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Compact Contact & Meta Row */}
                <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                  {(client.phoneNumber || client.phone) && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span className="font-medium">{client.phoneNumber || client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-medium truncate max-w-[180px]" title={client.email}>
                        {client.email}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{client.updatedAt 
                      ? formatDistanceToNow(new Date(client.updatedAt), { addSuffix: true })
                      : 'recently'
                    }</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons - Compact */}
              <div className="flex items-start gap-1.5 flex-shrink-0">
                {onViewProfile ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onViewProfile}
                    className="text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-300 hover:border-slate-400 transition-all duration-200 h-7 px-2 text-xs"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    asChild 
                    className="text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-300 hover:border-slate-400 transition-all duration-200 h-7 px-2 text-xs"
                  >
                    <Link href={`/case-manager/clients/${client._id}`}>
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Link>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRequestUpdate?.(client._id)}
                  className="text-blue-700 hover:text-blue-900 hover:bg-blue-50 border-blue-300 hover:border-blue-400 transition-all duration-200 h-7 px-2 text-xs"
                >
                  <Send className="w-3 h-3 mr-1" />
                  Update
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group h-7 w-7 p-0"
                >
                  <X className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
                </Button>
              </div>
            </div>
          </div>

          {/* Professional Tab Navigation */}
          <DrawerTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(tabId) => setActiveTab(tabId as TabType)}
          />

          {/* Tab Content */}
          <DrawerBody>
            {activeTab === 'overview' && (
              <OverviewTab 
                client={client} 
                connection={getClientConnection()} 
                onConnectProvider={handleConnectProvider}
                onViewProfile={onViewProfile}
              />
            )}
            {activeTab === 'referrals' && (
              <ReferralsTab 
                clientId={client._id} 
                onViewReferralDetails={handleViewReferralDetails}
                onNavigateToServiceFeed={handleNavigateToServiceFeed}
              />
            )}
            {activeTab === 'timeline' && (
              <TimelineTab clientId={client._id} />
            )}
            {activeTab === 'actions' && (
              <ServiceFeedTab 
                clientId={client._id}
              />
            )}
            {activeTab === 'documents' && (
              <DocumentsTab 
                clientId={client._id}
              />
            )}
          </DrawerBody>
      </div>

      {/* Referral Details Panel */}
      <ReferralDetailsPanel
        referral={selectedReferral}
        isOpen={isReferralDetailsPanelOpen}
        onClose={handleCloseReferralDetails}
        onBackToDrawer={handleBackToDrawer}
      />

      {/* Connect Modal */}
      <ConnectModal
        isOpen={isConnectProviderModalOpen}
        onClose={() => setIsConnectProviderModalOpen(false)}
        client={client}
        userRole={user?.role as 'case_manager' | 'provider'}
        onConnectionRequested={handleConnectionRequested}
      />
    </>
  );
}

// World-Class Overview Tab with Advanced Micro-interactions
function OverviewTab({ 
  client, 
  connection, 
  onConnectProvider,
  onViewProfile
}: { 
  client: Client; 
  connection: any; 
  onConnectProvider: () => void;
  onViewProfile?: () => void;
}) {
  const { user } = useAuth();
  const [hoveredCard, setHoveredCard] = React.useState<string | null>(null);

  return (
    <>
      {/* Priority Action Items with Advanced Styling */}
      <DrawerSection title="Priority Actions" delay={0}>
        <div className="space-y-3">
          {(client.status === 'UNPLACED' || client.status === 'UNPLACED_NEW') && (
            <ActionCard
              type="critical"
              icon={AlertCircle}
              title="Client needs placement"
              description="Use Create Referral button on client card"
              onHover={() => setHoveredCard('placement')}
              isHovered={hoveredCard === 'placement'}
            />
          )}
          {(client.status === 'ACTIVE_NEEDS_ATTENTION' || client.status === 'ACTIVE_FRUSTRATED') && (
            <ActionCard
              type="warning"
              icon={AlertTriangle}
              title="Client needs attention"
              description="Requires immediate follow-up"
              action={
                <Button size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-sm hover:shadow-md transition-all duration-200">
                Request Update
              </Button>
              }
              onHover={() => setHoveredCard('attention')}
              isHovered={hoveredCard === 'attention'}
            />
          )}
          {(client.unreadMessages || 0) > 0 && (
            <ActionCard
              type="info"
              icon={MessageSquare}
              title={`${client.unreadMessages} unread messages`}
              description="New communications available"
              action={
                <Button size="sm" className="bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white shadow-sm hover:shadow-md transition-all duration-200">
                View Messages
              </Button>
              }
              onHover={() => setHoveredCard('messages')}
              isHovered={hoveredCard === 'messages'}
            />
          )}
          {!connection && (
            <ActionCard
              type="neutral"
              icon={LinkIcon}
              title={user?.role === 'case_manager' ? 'No provider connection' : 'No case manager connection'}
              description="Connect to enable collaboration"
              action={
              <Button 
                size="sm" 
                onClick={onConnectProvider}
                  className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
              >
                {user?.role === 'case_manager' ? 'Connect Provider' : 'Connect Case Manager'}
              </Button>
              }
              onHover={() => setHoveredCard('connection')}
              isHovered={hoveredCard === 'connection'}
            />
          )}
        </div>
      </DrawerSection>

      {/* Essential Information - Compact Professional Layout */}
      <DrawerSection title="Essential Information" delay={100}>
        <div className="grid gap-2">
          <InfoRow label="Date of Birth" value={client.dateOfBirth ? formatSafeDate(client.dateOfBirth) : 'Not provided'} icon={Calendar} />
          <InfoRow label="Gender" value={client.sex ? client.sex.replace('-', ' ').charAt(0).toUpperCase() + client.sex.replace('-', ' ').slice(1) : 'Not provided'} icon={User} />
          <InfoRow label="Address" value={[client.city, client.state, client.zipCode].filter(Boolean).join(', ') || 'Not provided'} icon={MapPin} />
          <InfoRow 
            label="Insurance" 
            value={
              typeof client.insurance === 'string' 
                ? client.insurance.charAt(0).toUpperCase() + client.insurance.slice(1)
                : client.insurance?.type ? client.insurance.type.charAt(0).toUpperCase() + client.insurance.type.slice(1) : client.insuranceProvider || 'Not provided'
              }
            icon={FileText}
          />
          {(client.pmi || client.pmiNumber) && (
            <InfoRow label="PMI Number" value={client.pmi || client.pmiNumber || ''} isMono icon={FileText} />
          )}
          {client.waiverType && (
            <InfoRow label="Waiver Type" value={formatWaiverType(client.waiverType)} icon={FileText} />
          )}
        </div>
      </DrawerSection>

      {/* Provider Connection with Premium Styling */}
      {connection && (
        <DrawerSection title="Provider Connection" delay={300}>
          <ConnectionCard connection={connection} />
        </DrawerSection>
      )}

      {/* Quick Actions */}
      <DrawerSection delay={400}>
        {onViewProfile ? (
          <Button 
            onClick={onViewProfile} 
            variant="outline" 
            size="sm" 
            className="w-full border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Profile
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm" className="w-full border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors">
            <Link href={`/case-manager/clients/${client._id}`} className="flex items-center justify-center gap-2">
              <Eye className="w-4 h-4" />
              View Profile
            </Link>
          </Button>
        )}
      </DrawerSection>
    </>
  );
}

// Real Referrals Tab Component
function ReferralsTab({ 
  clientId, 
  onViewReferralDetails, 
  onNavigateToServiceFeed 
}: { 
  clientId: string; 
  onViewReferralDetails: (referral: any) => void;
  onNavigateToServiceFeed?: (referralId: string) => void;
}) {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingReferralId, setDeletingReferralId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchReferrals() {
      if (!clientId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/clients/${clientId}/referrals`);
        if (!response.ok) {
          throw new Error('Failed to fetch referrals');
        }
        
        const data = await response.json();
        setReferrals(data.referrals || []);
      } catch (err) {
        console.error('Error fetching referrals:', err);
        setError('Failed to load referrals');
      } finally {
        setLoading(false);
      }
    }

    fetchReferrals();
  }, [clientId]);

  const handleDeleteReferral = async (referralId: string) => {
    if (!confirm('Are you sure you want to delete this referral? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingReferralId(referralId);
      
      const response = await fetch(`/api/referrals/${referralId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete referral');
      }

      // Remove the referral from the local state
      setReferrals(prev => prev.filter(r => r._id !== referralId));
      
      toast({
        title: "Referral Deleted",
        description: "The referral has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting referral:', error);
      toast({
        title: "Error",
        description: "Failed to delete referral. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingReferralId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'draft': { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
      'submitted': { label: 'Submitted', color: 'bg-blue-100 text-blue-700' },
      'matched': { label: 'Matched', color: 'bg-purple-100 text-purple-700' },
      'sent_to_provider': { label: 'Sent to Provider', color: 'bg-blue-100 text-blue-700' },
      'accepted': { label: 'Accepted', color: 'bg-green-100 text-green-700' },
      'active': { label: 'Active', color: 'bg-emerald-100 text-emerald-700' },
      'completed': { label: 'Completed', color: 'bg-slate-100 text-slate-700' },
      'rejected': { label: 'Rejected', color: 'bg-red-100 text-red-700' },
      'cancelled': { label: 'Cancelled', color: 'bg-orange-100 text-orange-700' },
      'expired': { label: 'Expired', color: 'bg-gray-100 text-gray-700' }
    }[status] || { label: status, color: 'bg-gray-100 text-gray-700' };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
        {statusConfig.label}
      </span>
    );
  };

  const getServiceTypeLabel = (serviceType: string) => {
    const serviceMap: { [key: string]: string } = {
      'mental_health': 'Mental Health',
      'substance_abuse': 'Substance Abuse',
      'housing': 'Housing',
      'employment': 'Employment',
      'healthcare': 'Healthcare',
      'legal': 'Legal Services',
      'financial': 'Financial Assistance',
      'transportation': 'Transportation'
    };
    return serviceMap[serviceType] || serviceType?.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') || 'Service';
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading referrals...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <>
      {referrals.length === 0 ? (
        <DrawerSection delay={0}>
          <div className="text-center py-16">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 to-slate-200/30 rounded-full blur-3xl opacity-60" />
              <FileText className="relative w-16 h-16 text-slate-300 mx-auto mb-6 transition-all duration-500 hover:text-slate-400 hover:scale-110" />
        </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text">
              No Referrals Yet
            </h3>
            <p className="text-slate-600 leading-relaxed max-w-sm mx-auto">
              No referrals have been created for this client. Start by creating a new referral to connect them with services.
            </p>
          </div>
        </DrawerSection>
      ) : (
        <>
          <DrawerSection title={`Referrals (${referrals.length})`} delay={0}>
        <div className="space-y-4">
              {referrals.map((referral, index) => (
            <EnhancedReferralCard 
              key={referral._id} 
              referral={referral}
              onDelete={() => handleDeleteReferral(referral._id)}
              isDeleting={deletingReferralId === referral._id}
              onViewDetails={() => onViewReferralDetails(referral)}
              onNavigateToServiceFeed={onNavigateToServiceFeed}
                  delay={index * 50}
            />
          ))}
        </div>
          </DrawerSection>
        </>
      )}
    </>
  );
}

function TimelineTab({ clientId }: { clientId: string }) {
  return <Timeline clientId={clientId} />;
}

// World-Class Helper Components for Premium UX

interface ActionCardProps {
  type: 'critical' | 'warning' | 'info' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: React.ReactNode
  onHover?: () => void
  isHovered?: boolean
}

function ActionCard({ type, icon: Icon, title, description, action, onHover, isHovered }: ActionCardProps) {
  const typeStyles = {
    critical: 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200/60 hover:border-red-300/80',
    warning: 'bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/60 hover:border-orange-300/80',
    info: 'bg-gradient-to-br from-accent-50 to-accent-100/50 border-accent-200/60 hover:border-accent-300/80',
    neutral: 'bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200/60 hover:border-slate-300/80'
  }

  const iconStyles = {
    critical: 'text-red-500',
    warning: 'text-orange-500',
    info: 'text-secondary-500',
    neutral: 'text-slate-500'
  }

  return (
    <div 
      className={cn(
        "relative p-4 rounded-xl border transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group cursor-pointer",
        "hover:shadow-lg hover:shadow-black/5 hover:scale-[1.02] active:scale-[0.98]",
        "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-white/40 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
        typeStyles[type],
        isHovered && "shadow-lg shadow-black/5 scale-[1.02]"
      )}
      onMouseEnter={onHover}
    >
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className={cn(
            "p-2 rounded-lg bg-white/60 backdrop-blur-sm transition-all duration-300",
            "group-hover:scale-110 group-hover:rotate-3",
            iconStyles[type]
          )}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-slate-900 mb-1 transition-colors duration-200">
              {title}
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
        {action && (
          <div className="ml-3 transition-transform duration-300 group-hover:scale-105">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}

interface InfoRowProps {
  label: string
  value: string
  isMono?: boolean
  icon?: React.ComponentType<{ className?: string }>
}

function InfoRow({ label, value, isMono, icon: Icon }: InfoRowProps) {
  return (
    <div className="group flex items-center justify-between py-2 px-3 rounded-lg bg-white border border-slate-200/60 hover:border-slate-300 hover:shadow-sm transition-all duration-150">
      <div className="flex items-center gap-2">
        {Icon && (
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-50 border border-slate-200/40">
            <Icon className="w-3.5 h-3.5 text-slate-600" />
          </div>
        )}
        <span className="text-slate-700 font-medium text-xs">{label}</span>
      </div>
      <span className={cn(
        "text-slate-900 font-semibold text-xs text-right max-w-[60%] truncate",
        isMono && "font-mono text-[11px] bg-slate-100/80 px-2 py-1 rounded border border-slate-200"
      )}>
        {value}
      </span>
    </div>
  )
}


interface ConnectionCardProps {
  connection: any
}

function ConnectionCard({ connection }: ConnectionCardProps) {
  return (
    <div className="relative p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/60 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/60 backdrop-blur-sm">
            <Building2 className="w-4 h-4 text-secondary-600" />
          </div>
          <div>
            <p className="font-semibold text-emerald-900 group-hover:text-emerald-800 transition-colors duration-200">
              {connection.providerName}
            </p>
            <p className="text-xs text-emerald-700/80 font-medium">
              {connection.isActivated ? 'Active connection' : 'Pending approval'}
            </p>
          </div>
        </div>
        <div className={cn(
          "w-3 h-3 rounded-full transition-all duration-300 group-hover:scale-125",
          connection.isActivated ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40' : 'bg-amber-500 shadow-lg shadow-amber-500/40'
        )} />
      </div>
    </div>
  )
}


// World-Class Referral Card Component - Premium UX Design
interface EnhancedReferralCardProps {
  referral: any;
  onDelete: () => void;
  isDeleting: boolean;
  onViewDetails: () => void;
  onNavigateToServiceFeed?: (referralId: string) => void;
  delay?: number;
}

function EnhancedReferralCard({ referral, onDelete, isDeleting, onViewDetails, onNavigateToServiceFeed }: EnhancedReferralCardProps) {
  const [showId, setShowId] = useState(false);
  const [actionCount, setActionCount] = useState(0);
  const [loadingActions, setLoadingActions] = useState(false);

  // Fetch action count for this referral
  useEffect(() => {
    const fetchActionCount = async () => {
      // Get the correct client ID from the referral
      const clientId = referral.clientId || referral.clientInfo?._id;
      
      if (!clientId || !['accepted', 'active'].includes(referral.status)) {
        return;
      }
      
      setLoadingActions(true);
      try {
        const response = await fetch(`/api/clients/${clientId}/actions`);
        if (response.ok) {
          const data = await response.json();
          // Count actions that are related to this referral
          const referralActions = data.actions?.filter((action: any) => 
            action.contextType === 'referral' && action.contextId === referral._id
          ) || [];
          setActionCount(referralActions.length);
        }
      } catch (error) {
        console.error('Error fetching action count:', error);
      } finally {
        setLoadingActions(false);
      }
    };

    fetchActionCount();
  }, [referral._id, referral.clientId, referral.clientInfo?._id, referral.status]);
  const getUrgencyConfig = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case 'high':
        return { 
          label: 'High Priority', 
          color: 'bg-red-100 text-red-700 border-red-200',
          icon: '🔥',
          dot: 'bg-red-500'
        };
      case 'medium':
        return { 
          label: 'Medium Priority', 
          color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          icon: '⚡',
          dot: 'bg-yellow-500'
        };
      case 'low':
        return { 
          label: 'Low Priority', 
          color: 'bg-green-100 text-green-700 border-green-200',
          icon: '📋',
          dot: 'bg-green-500'
        };
      default:
        return { 
          label: 'Normal', 
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: '📋',
          dot: 'bg-gray-500'
        };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'submitted':
        return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'matched':
        return { icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50' };
      case 'accepted':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' };
      case 'active':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' };
      case 'rejected':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' };
      default:
        return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  const urgencyConfig = getUrgencyConfig(referral.urgency);
  const statusConfig = getStatusConfig(referral.status);
  const StatusIcon = statusConfig.icon;

  // Get description from various possible fields
  const getDescription = () => {
    return referral.serviceDetails?.referralReason || 
           referral.serviceDetails?.additionalNotes || 
           referral.serviceDetails?.description || 
           referral.referralReason || 
           referral.additionalNotes ||
           referral.description || 
           'Service referral submitted - click to view full details';
  };

  const getServiceType = () => {
    return referral.serviceDetails?.type || 
           referral.serviceType || 
           referral.service_type || 
           'Service';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'draft': { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
      'submitted': { label: 'Submitted', color: 'bg-blue-100 text-blue-700' },
      'matched': { label: 'Matched', color: 'bg-purple-100 text-purple-700' },
      'sent_to_provider': { label: 'Sent to Provider', color: 'bg-blue-100 text-blue-700' },
      'accepted': { label: 'Accepted', color: 'bg-green-100 text-green-700' },
      'active': { label: 'Active', color: 'bg-emerald-100 text-emerald-700' },
      'completed': { label: 'Completed', color: 'bg-slate-100 text-slate-700' },
      'rejected': { label: 'Rejected', color: 'bg-red-100 text-red-700' },
      'cancelled': { label: 'Cancelled', color: 'bg-orange-100 text-orange-700' },
      'expired': { label: 'Expired', color: 'bg-gray-100 text-gray-700' }
    }[status] || { label: status, color: 'bg-gray-100 text-gray-700' };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
        {statusConfig.label}
      </span>
    );
  };

  return (
    <div className="group relative bg-white border border-slate-200 rounded-xl p-6 hover:shadow-xl hover:shadow-primary-500/10 hover:border-primary-200 transition-all duration-300 overflow-hidden transform hover:scale-[1.01]">
      {/* Priority indicator bar */}
      <div className={`absolute top-0 left-0 w-1 h-full ${urgencyConfig.dot}`} />
      
      {/* Enhanced gradient overlay for premium feel */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-slate-50/30 pointer-events-none" />
      
      {/* Header Row: Service + Status */}
      <div className="relative space-y-3 mb-4">
        <div className="flex items-start gap-3">
          {/* Status Icon */}
          <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${statusConfig.bg} ring-2 ring-white shadow-sm`}>
            <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
          </div>
          
          {/* Service Title and Status - Full Width */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h4 className="font-semibold text-slate-900 text-base leading-tight">
                {getServiceType()}
              </h4>
              {/* Delete Action */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                disabled={isDeleting}
                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0"
                title="Delete referral"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            {/* Status and Provider Row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {getStatusBadge(referral.status)}
              </div>
              
              {/* Provider Status */}
              {referral.assignedProviderName ? (
                <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg text-sm border border-emerald-200">
                  <User className="w-4 h-4" />
                  <span className="font-medium">
                    {referral.assignedProviderName}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg text-sm border border-amber-200">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">No Provider</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Referral ID Section */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowId(!showId)}
            className="text-gray-500 hover:text-gray-700 p-1 h-6 w-6"
            title={showId ? "Hide referral ID" : "Show referral ID"}
          >
            {showId ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </Button>
          {showId && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 font-medium">ID:</span>
              <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-700">
                {referral._id}
              </code>
            </div>
          )}
        </div>
      </div>

      {/* Key Details - 2 Rows Max */}
      <div className="space-y-2 mb-4">
        {/* Row 1: Priority + Location */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {referral.serviceDetails?.urgency && (
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="w-3.5 h-3.5" />
                <span className="capitalize font-medium">
                  {referral.serviceDetails.urgency} Priority
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1 text-gray-600">
            {(referral.serviceDetails?.counties || referral.counties) && (
              <>
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate max-w-32">
                  {(() => {
                    const counties = referral.serviceDetails?.counties || referral.counties;
                    const countiesArray = Array.isArray(counties) ? counties : [counties];
                    return countiesArray.map(county => 
                      county.charAt(0).toUpperCase() + county.slice(1).toLowerCase()
                    ).join(', ');
                  })()}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Row 2: Timeline */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Created {new Date(referral.createdAt).toLocaleDateString()}</span>
          </div>
          {referral.updatedAt && referral.updatedAt !== referral.createdAt && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Updated {new Date(referral.updatedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Notes Preview - With Field Labels */}
      {(() => {
        const noteItems = [];
        const description = getDescription();
        
        if (description !== 'Service referral submitted - click to view full details') {
          noteItems.push(`Reason: ${description}`);
        }
        if (referral.serviceDetails?.additionalNotes || referral.additionalNotes) {
          noteItems.push(`Notes: ${referral.serviceDetails?.additionalNotes || referral.additionalNotes}`);
        }
        if (referral.clientInfo?.culturalConsiderations || referral.culturalConsiderations) {
          noteItems.push(`Cultural: ${referral.clientInfo?.culturalConsiderations || referral.culturalConsiderations}`);
        }
        
        return noteItems.length > 0 && (
          <div className="mb-4">
            <div className="space-y-1">
              {noteItems.map((note, index) => (
                <p key={index} className="text-sm text-gray-600 line-clamp-1 leading-relaxed">
                  <span className="font-medium text-gray-700">{note.split(': ')[0]}:</span>{' '}
                  <span>{note.split(': ').slice(1).join(': ')}</span>
                </p>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Action Count and Navigation - Only show for accepted/active referrals */}
      {['accepted', 'active'].includes(referral.status) && (
        <div className="mb-4 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary-100 rounded-lg">
                <Activity className="w-4 h-4 text-primary-600" />
              </div>
              <span className="text-sm font-semibold text-primary-900">
                {loadingActions ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                    Loading workflow actions...
                  </span>
                ) : (
                  `${actionCount} workflow ${actionCount === 1 ? 'action' : 'actions'}`
                )}
              </span>
            </div>
            {actionCount > 0 && onNavigateToServiceFeed && (
              <Button
                onClick={() => onNavigateToServiceFeed(referral._id)}
                variant="ghost"
                size="sm"
                className="text-primary-700 hover:text-primary-800 hover:bg-primary-100 px-3 py-2 h-auto text-sm font-medium rounded-lg transition-all duration-200"
              >
                View Actions
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="relative flex gap-2">
        <Button 
          onClick={onViewDetails}
          variant="outline"
          size="sm"
          className="px-4 py-2 bg-white hover:bg-slate-50 border-slate-200 hover:border-primary-300 hover:shadow-md transition-all duration-200 group/btn"
        >
          <Eye className="w-4 h-4 text-slate-600 group-hover/btn:text-primary-600 transition-colors mr-2" />
          <span className="font-medium">Details</span>
        </Button>
        
        {/* Service Feed Navigation Button - Only for accepted/active referrals */}
        {['accepted', 'active'].includes(referral.status) && onNavigateToServiceFeed && (
          <Button
            onClick={() => onNavigateToServiceFeed(referral._id)}
            variant="outline"
            size="sm"
            className="px-4 bg-primary-50 border-primary-200 text-primary-700 hover:text-primary-800 hover:bg-primary-100 hover:border-primary-300 hover:shadow-md transition-all duration-200 group/feed"
            title="Go to Service Feed"
          >
            <List className="w-4 h-4 group-hover/feed:scale-110 transition-transform duration-200" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Documents Tab Component
function DocumentsTab({ clientId }: { clientId: string }) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedContext, setSelectedContext] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadContext, setUploadContext] = useState<string>('general');
  const [uploadType, setUploadType] = useState<string>('other');
  const [uploadDescription, setUploadDescription] = useState<string>('');
  
    // Delete functionality state
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Edit context functionality state
    const [editingDocument, setEditingDocument] = useState<any>(null);
  
  // Context data for filtering and upload
  const [referrals, setReferrals] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [contextsLoading, setContextsLoading] = useState(true);
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Document types for filtering
  const documentTypes = [
    { value: 'all', label: 'All Documents' },
    { value: 'intake', label: 'Intake Forms' },
    { value: 'assessment', label: 'Assessments' },
    { value: 'service_plan', label: 'Service Plans' },
    { value: 'progress_note', label: 'Progress Notes' },
    { value: 'discharge', label: 'Discharge Summaries' },
    { value: 'roi', label: 'Release of Information' },
    { value: 'incident', label: 'Incident Reports' },
    { value: 'other', label: 'Other' }
  ];

  // Fetch documents and contexts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setContextsLoading(true);
        
        // Fetch documents
        const documentsResponse = await fetch(`/api/clients/${clientId}/documents`);
        if (documentsResponse.ok) {
          const documentsData = await documentsResponse.json();
          setDocuments(documentsData.documents || []);
        }
        
        // Fetch referrals for context options
        const referralsResponse = await fetch(`/api/clients/${clientId}/referrals`);
        if (referralsResponse.ok) {
          const referralsData = await referralsResponse.json();
          setReferrals(referralsData.referrals || []);
        }
        
        // Fetch connections for context options
        const connectionsResponse = await fetch(`/api/clients/${clientId}/connections`);
        if (connectionsResponse.ok) {
          const connectionsData = await connectionsResponse.json();
          setConnections(connectionsData.connections || []);
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load documents and contexts",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
        setContextsLoading(false);
      }
    };

    fetchData();
  }, [clientId, toast]);

  // Filter documents with enhanced context matching
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || doc.type === selectedType;
    
    // Enhanced context filtering
    let matchesContext = true;
    if (selectedContext !== 'all') {
      if (selectedContext === 'general') {
        matchesContext = doc.contextType === 'general' || !doc.contextType;
      } else if (selectedContext === 'referral') {
        matchesContext = doc.contextType === 'referral';
      } else if (selectedContext === 'connection') {
        matchesContext = doc.contextType === 'connection';
      } else if (selectedContext.startsWith('referral_')) {
        // Specific referral selected
        const referralId = selectedContext.replace('referral_', '');
        matchesContext = doc.contextType === 'referral' && doc.contextId === referralId;
      } else if (selectedContext.startsWith('connection_')) {
        // Specific connection selected
        const connectionId = selectedContext.replace('connection_', '');
        matchesContext = doc.contextType === 'connection' && doc.contextId === connectionId;
      }
    }
    
    return matchesSearch && matchesType && matchesContext;
  });

  // Group documents by type
  const groupedDocuments = documentTypes.reduce((acc, type) => {
    if (type.value === 'all') return acc;
    
    const docsOfType = filteredDocuments.filter(doc => doc.type === type.value);
    if (docsOfType.length > 0) {
      acc[type.value] = {
        label: type.label,
        documents: docsOfType
      };
    }
    return acc;
  }, {} as Record<string, { label: string; documents: any[] }>);

  // Handle file selection for upload modal
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setShowUploadModal(true);
    }
    // Reset input
    event.target.value = '';
  };

    // Handle context update for existing document
    const handleContextUpdate = async () => {
      if (!editingDocument) return;

      setIsUploading(true);
      try {
        const requestBody: any = {
          documentId: editingDocument._id,
          type: uploadType,
          description: uploadDescription
        };
        
        // Add context information
        if (uploadContext !== 'general') {
          if (uploadContext.startsWith('referral_')) {
            requestBody.contextType = 'referral';
            requestBody.contextId = uploadContext.replace('referral_', '');
          } else if (uploadContext.startsWith('connection_')) {
            requestBody.contextType = 'connection';
            requestBody.contextId = uploadContext.replace('connection_', '');
          }
        } else {
          requestBody.contextType = 'general';
          requestBody.contextId = null;
        }
        
        const response = await fetch(`/api/clients/${clientId}/documents`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          const updatedDocument = await response.json();
          
          // Update local state
          setDocuments(prev => prev.map(doc => 
            doc._id === editingDocument._id ? updatedDocument : doc
          ));
          
          toast({
            title: "Success",
            description: "Document context updated successfully"
          });
          
          // Reset state
          setShowUploadModal(false);
          setEditingDocument(null);
          setUploadContext('general');
          setUploadType('other');
          setUploadDescription('');
        } else {
          throw new Error('Context update failed');
        }
      } catch (error) {
        console.error('Error updating document context:', error);
        toast({
          title: "Error",
          description: (error as Error).message || "Failed to update document context",
          variant: "destructive"
        });
      } finally {
        setIsUploading(false);
      }
    };

    // Handle actual file upload with context
    const handleFileUpload = async () => {
      if (!uploadFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('clientId', clientId);
      formData.append('type', uploadType);
      formData.append('description', uploadDescription);
      
      // Add context information
      if (uploadContext !== 'general') {
        if (uploadContext.startsWith('referral_')) {
          formData.append('contextType', 'referral');
          formData.append('contextId', uploadContext.replace('referral_', ''));
        } else if (uploadContext.startsWith('connection_')) {
          formData.append('contextType', 'connection');
          formData.append('contextId', uploadContext.replace('connection_', ''));
        }
      } else {
        formData.append('contextType', 'general');
      }
      
      const response = await fetch(`/api/clients/${clientId}/documents`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const newDocument = await response.json();
        setDocuments(prev => [newDocument, ...prev]);
        toast({
          title: "Success",
          description: "Document uploaded successfully"
        });
        
        // Reset upload state
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadContext('general');
        setUploadType('other');
        setUploadDescription('');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle document deletion
  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/documents?documentId=${documentToDelete._id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove document from local state
        setDocuments(prev => prev.filter(doc => doc._id !== documentToDelete._id));
        toast({
          title: "Success",
          description: "Document deleted successfully"
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to delete document",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setDocumentToDelete(null);
    }
  };

    // Handle delete button click
    const handleDeleteClick = (document: any) => {
      setDocumentToDelete(document);
      setShowDeleteDialog(true);
    };

    // Handle editing document context
    const handleEditDocumentContext = (document: any) => {
      // Set the document for editing and open upload modal with pre-filled data
      setUploadFile(null); // No file since we're just editing context
      setUploadContext(document.contextType === 'referral' ? `referral_${document.contextId}` : 
                      document.contextType === 'connection' ? `connection_${document.contextId}` : 'general');
      setUploadType(document.type);
      setUploadDescription(document.description || '');
      setEditingDocument(document);
      setShowUploadModal(true);
    };

    // Handle unlinking document context
    const handleUnlinkDocumentContext = async (document: any) => {
      try {
        const response = await fetch(`/api/clients/${clientId}/documents`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            documentId: document._id,
            contextType: 'general',
            contextId: null
          })
        });

        if (response.ok) {
          // Update local state
          setDocuments(prev => prev.map(doc => 
            doc._id === document._id 
              ? { ...doc, contextType: 'general', contextId: null }
              : doc
          ));
          
          toast({
            title: "Success",
            description: "Document context removed successfully"
          });
        } else {
          throw new Error('Failed to update document context');
        }
      } catch (error) {
        console.error('Error updating document context:', error);
        toast({
          title: "Error",
          description: "Failed to remove document context",
          variant: "destructive"
        });
      }
    };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'intake': return <FileText className="w-5 h-5 text-blue-600" />;
      case 'assessment': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'service_plan': return <Calendar className="w-5 h-5 text-purple-600" />;
      case 'progress_note': return <Activity className="w-5 h-5 text-orange-600" />;
      case 'discharge': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'roi': return <Eye className="w-5 h-5 text-indigo-600" />;
      case 'incident': return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      default: return <FileText className="w-5 h-5 text-slate-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get detailed context information for a document
  const getDocumentContext = (doc: any) => {
    if (!doc.contextType || doc.contextType === 'general') {
      return null;
    }

    if (doc.contextType === 'referral') {
      const referral = referrals.find(r => r._id === doc.contextId);
      if (referral) {
        const serviceType = referral.serviceDetails?.type || 
                          referral.serviceType || 
                          referral.service || 
                          'Referral Service';
        
        return {
          type: 'referral',
          icon: '📄',
          serviceType,
          providerName: referral.assignedProviderName,
          status: referral.status,
          organization: referral.assignedProviderOrganization
        };
      }
    }

    if (doc.contextType === 'connection') {
      const connection = connections.find(c => c._id === doc.contextId);
      if (connection) {
        return {
          type: 'connection',
          icon: '👥',
          serviceType: connection.serviceType || 'Service Connection',
          providerName: connection.providerName,
          status: connection.status,
          organization: connection.providerOrganization
        };
      }
    }

    return {
      type: doc.contextType,
      icon: doc.contextType === 'referral' ? '📄' : '👥',
      serviceType: doc.contextType === 'referral' ? 'Referral' : 'Connection',
      status: 'unknown'
    };
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Section - Professional spacing and hierarchy */}
      <div className="flex-shrink-0 px-6 py-5 border-b border-slate-200 bg-gradient-to-br from-white via-slate-50/30 to-white">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900 mb-1">Documents</h3>
            <p className="text-xs text-slate-500">Organized repository of all client files</p>
          </div>
          <div className="relative flex-shrink-0">
            <input
              type="file"
              id="document-upload"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            <Button
              asChild
              size="sm"
              disabled={isUploading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm hover:shadow-md transition-all duration-200 h-8 px-3 text-xs"
            >
              <label htmlFor="document-upload" className="cursor-pointer flex items-center gap-1.5">
                {isUploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                {isUploading ? 'Uploading...' : 'Upload'}
              </label>
            </Button>
          </div>
        </div>

        {/* Filters Section - Stacked for better fit in 850px */}
        <div className="space-y-3">
          <div>
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="h-9 text-sm bg-white">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-300 shadow-xl z-50">
                  {documentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value} className="text-sm hover:bg-slate-50 cursor-pointer">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={selectedContext} onValueChange={setSelectedContext}>
                <SelectTrigger className="h-9 text-sm bg-white">
                  <SelectValue placeholder="Filter by context" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-300 shadow-xl z-50">
                  <SelectItem value="all" className="text-sm hover:bg-slate-50 cursor-pointer">All Contexts</SelectItem>
                  <SelectItem value="referral" className="text-sm hover:bg-slate-50 cursor-pointer">Referrals</SelectItem>
                  <SelectItem value="connection" className="text-sm hover:bg-slate-50 cursor-pointer">Provider Connections</SelectItem>
                  <SelectItem value="general" className="text-sm hover:bg-slate-50 cursor-pointer">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Document Count Badge - Professional styling */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-slate-100 bg-slate-50/40">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>{filteredDocuments.length}</span>
          </div>
          <span className="text-xs text-slate-500">
            {filteredDocuments.length === 1 ? 'document' : 'documents'} found
          </span>
        </div>
      </div>

      {/* Documents List - Scrollable with proper padding */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
              <span className="text-sm text-slate-500 font-medium">Loading documents...</span>
            </div>
          </div>
        ) : Object.keys(groupedDocuments).length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-slate-400" />
              </div>
              <h4 className="text-base font-semibold text-slate-900 mb-2">No documents found</h4>
              <p className="text-sm text-slate-500 mb-6">
                {searchQuery || selectedType !== 'all' || selectedContext !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Upload your first document to get started'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedDocuments).map(([type, group]) => (
              <div key={type} className="space-y-3">
                {/* Category Header - Professional hierarchy */}
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {group.label}
                  </h4>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {group.documents.length}
                  </span>
                </div>
                <div className="grid gap-3">
                {group.documents.map((doc) => (
                  <div
                    key={doc._id}
                    className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-sm hover:border-slate-300 transition-all duration-200 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getDocumentIcon(doc.type)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Document Name & Description */}
                        <div>
                          <h5 className="font-semibold text-sm text-slate-900 truncate group-hover:text-blue-600 transition-colors mb-1">
                            {doc.name}
                          </h5>
                          {doc.description && (
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {doc.description}
                            </p>
                          )}
                        </div>
                        {/* Context Information - Compact and professional */}
                        {(() => {
                          const context = getDocumentContext(doc);
                          return context ? (
                            <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200">
                              <div className="flex items-start gap-2 mb-2">
                                <div className="text-base flex-shrink-0">{context.icon}</div>
                                <div className="flex-1 min-w-0">
                                  {/* Context Type Badge */}
                                  <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                                    <Badge 
                                      variant="outline" 
                                      className="text-[10px] font-semibold bg-blue-50 text-blue-700 border-blue-200 px-1.5 py-0.5"
                                    >
                                      {context.type === 'referral' ? 'Referral' : 'Connection'}
                                    </Badge>
                                    {context.status && (
                                      <Badge 
                                        variant={
                                          context.status === 'accepted' || context.status === 'active' ? 'default' : 
                                          context.status === 'pending' || context.status === 'sent' ? 'secondary' :
                                          context.status === 'rejected' || context.status === 'closed' ? 'destructive' : 'secondary'
                                        }
                                        className="text-[10px] capitalize px-1.5 py-0.5"
                                      >
                                        {context.status}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {/* Service Type */}
                                  <div className="text-xs font-semibold text-slate-900 mb-1">
                                    {context.serviceType}
                                  </div>
                                  
                                  {/* Provider & Organization */}
                                  {context.providerName && (
                                    <div className="text-[11px] text-slate-600 mb-0.5">
                                      <span className="font-medium">Provider:</span> {context.providerName}
                                    </div>
                                  )}
                                  {context.organization && (
                                    <div className="text-[11px] text-slate-500">
                                      <span className="font-medium">Org:</span> {context.organization}
                                    </div>
                                  )}
                                </div>
                                    
                                    {/* Context Management Actions */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover/context:opacity-100 transition-opacity">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditDocumentContext(doc)}
                                        className="h-6 w-6 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                        title="Change context"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleUnlinkDocumentContext(doc)}
                                        className="h-6 w-6 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                        title="Remove context link"
                                      >
                                        <XCircle className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ) : null;
                            })()}

                        {/* Document Metadata - Compact footer */}
                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100">
                          <div className="flex items-center gap-3 text-[11px] text-slate-500">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span className="font-medium">{doc.uploadedBy}</span>
                            </div>
                            <span className="text-slate-300">•</span>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatDistanceToNow(new Date(doc.uploadedAt), { addSuffix: true })}</span>
                            </div>
                            <span className="text-slate-300">•</span>
                            <span className="font-medium">{formatFileSize(doc.size)}</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/api/documents/secure/${doc.accessToken}`, '_blank')}
                              className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                              title="View document"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(doc)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Delete document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (uploadFile || editingDocument) && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-slate-200 pointer-events-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {editingDocument ? 'Edit Document Context' : 'Upload Document'}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {editingDocument ? 'Update document context and details' : 'Add document to client file'}
                          </p>
                        </div>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-slate-500" />
                <span className="font-medium text-slate-700">
                  {editingDocument ? editingDocument.name : uploadFile?.name}
                </span>
                {(uploadFile || editingDocument) && (
                  <span className="px-2 py-1 bg-slate-200 text-slate-700 rounded-full text-xs">
                    {editingDocument ? 
                      formatFileSize(editingDocument.size) : 
                      `${(uploadFile!.size / 1024).toFixed(1)} KB`
                    }
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Document Type
                </label>
                <Select value={uploadType} onValueChange={setUploadType}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[100] bg-white border-slate-300 shadow-xl">
                    {documentTypes.filter(type => type.value !== 'all').map(type => (
                      <SelectItem key={type.value} value={type.value} className="hover:bg-slate-50 cursor-pointer">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Context
                </label>
                <Select value={uploadContext} onValueChange={setUploadContext}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[100] bg-white border-slate-300 shadow-xl max-h-[300px]">
                    <SelectItem value="general" className="hover:bg-slate-50 cursor-pointer">
                      General (Client-level)
                    </SelectItem>
                    {referrals.length > 0 && referrals.map(referral => {
                      // Extract service type from serviceDetails.type (this is where it's stored)
                      const serviceType = referral.serviceDetails?.type || 
                                        referral.serviceType || 
                                        referral.service || 
                                        referral.requestedService ||
                                        'Referral';
                      
                      const providerInfo = referral.assignedProviderName ? ` - ${referral.assignedProviderName}` : '';
                      const statusInfo = referral.status ? ` (${referral.status})` : '';
                      
                      return (
                        <SelectItem key={`referral_${referral._id}`} value={`referral_${referral._id}`} className="hover:bg-slate-50 cursor-pointer">
                          📄 {serviceType}{providerInfo}{statusInfo}
                        </SelectItem>
                      );
                    })}
                    {connections.length > 0 && connections.map(connection => (
                      <SelectItem key={`connection_${connection._id}`} value={`connection_${connection._id}`} className="hover:bg-slate-50 cursor-pointer">
                        👥 {connection.serviceType || 'Service'} Connection
                        {connection.providerName && ` - ${connection.providerName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Brief description of this document..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setEditingDocument(null);
                  setUploadContext('general');
                  setUploadType('other');
                  setUploadDescription('');
                }}
                disabled={isUploading}
              >
                Cancel
              </Button>
                        <Button
                          onClick={editingDocument ? handleContextUpdate : handleFileUpload}
                          disabled={isUploading}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              {editingDocument ? 'Updating...' : 'Uploading...'}
                            </>
                          ) : (
                            <>
                              {editingDocument ? (
                                <>
                                  <Edit3 className="w-4 h-4 mr-2" />
                                  Update Context
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Upload Document
                                </>
                              )}
                            </>
                          )}
                        </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && documentToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-slate-200 pointer-events-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Delete Document</h3>
                <p className="text-sm text-slate-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                {getDocumentIcon(documentToDelete.type)}
                <span className="font-medium text-slate-700">{documentToDelete.name}</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {documentToDelete.type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to permanently delete this document? This action will be logged for HIPAA compliance.
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDocumentToDelete(null);
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteDocument}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Document
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
