'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { 
  Search, 
  ArrowLeft,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Clock,
  Filter,
  Star,
  StarIcon,
  Inbox,
  Users,
  UserPlus,
  MoreHorizontal,
  Archive,
  Trash2,
  ChevronDown,
  ChevronRight,
  Bell,
  UserCheck,
  Activity,
  Zap,
  Building,
  User
} from 'lucide-react';
import { formatSafeDate } from '@/lib/date-utils';
import { capitalizeName, formatServiceType } from '@/lib/formatting';

// Types
interface PendingConnection {
  _id: string;
  clientName: string;
  clientMatchKey: string;
  caseManagerId: string;
  providerId: string;
  initiatedBy: string;
  createdAt: string;
  isFromCurrentUser: boolean;
  counterpartType: 'case_manager' | 'provider';
  timeAgo: string;
}

interface Conversation {
  _id: string;
  referralId: string;
  clientId: string;
  clientName: string;
  serviceType: string;
  status: string;
  providerId: string;
  providerName: string;
  conversationStatus: 'referral_active' | 'services_starting' | 'ongoing_care';
  originType: 'referral_based' | 'existing_services';
  workspaceUrl: string;
  lastActivity: string;
  lastMessage: {
    content: string;
    authorName: string;
    authorType: 'case_manager' | 'provider' | 'admin';
    category: string;
    priority: string;
    timestamp: string;
  };
  totalMessages: number;
  unreadCount: number;
  urgencyScore: number;
  isUrgent: boolean;
  isRecentActivity: boolean;
  needsAttention: boolean;
  timeAgo: string;
}

interface ClientGroup {
  clientId: string;
  clientName: string;
  conversations: Conversation[];
  lastActivity: string;
  totalUnreadCount: number;
  hasUrgent: boolean;
  needsAttention: boolean;
  timeAgo: string;
}

interface WorkspaceData {
  success: boolean;
  conversations: Conversation[];
  groupedConversations: ClientGroup[];
  pendingConnections: PendingConnection[];
  stats: {
    total: number;
    totalClients: number;
    urgent: number;
    needsAttention: number;
    pending: number;
    inbox: number;
  };
}

interface EnhancedWorkspaceProps {
  userRole: 'case_manager' | 'provider';
  backUrl: string;
  backLabel: string;
}

export default function EnhancedWorkspace({ userRole, backUrl, backLabel }: EnhancedWorkspaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedView, setSelectedView] = useState<'needs_attention' | 'pending_connections' | 'all_clients' | 'urgent_only'>('needs_attention');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [acceptingConnection, setAcceptingConnection] = useState<string | null>(null);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  // Fetch workspace data
  const fetchData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    if (!showRefreshIndicator) setLoading(true);
    
    try {
      const response = await fetch('/api/workspace/conversations');
      if (response.ok) {
        const workspaceData: WorkspaceData = await response.json();
        setData(workspaceData);
      } else {
        throw new Error('Failed to fetch workspace data');
      }
    } catch (error) {
      console.error('Error fetching workspace:', error);
      toast({
        title: "Error",
        description: "Failed to load workspace",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Accept connection
  const handleAcceptConnection = async (connection: PendingConnection) => {
    setAcceptingConnection(connection._id);
    
    try {
      const response = await fetch('/api/connections/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientMatchKey: connection.clientMatchKey,
          caseManagerId: connection.caseManagerId,
          providerId: connection.providerId,
        }),
      });

      if (!response.ok) throw new Error('Failed to accept connection');

      const result = await response.json();
      
      toast({
        title: "Connection Accepted",
        description: `Successfully connected with ${connection.clientName}. Workspace is now available.`,
      });
      
      // Refresh data
      fetchData(true);
      
    } catch (error) {
      console.error('Error accepting connection:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to accept connection",
        variant: "destructive"
      });
    } finally {
      setAcceptingConnection(null);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter data based on selected view using grouped conversations (role-aware)
  const getFilteredData = () => {
    if (!data) return { clientGroups: [], pendingConnections: [] };
    
    const { groupedConversations, pendingConnections } = data;
    
    switch (selectedView) {
      case 'needs_attention':
        return {
          clientGroups: groupedConversations.filter(group => group.needsAttention),
          pendingConnections: pendingConnections.filter(pc => !pc.isFromCurrentUser)
        };
      case 'pending_connections':
        return {
          clientGroups: [],
          pendingConnections
        };
      case 'all_clients':
        return {
          clientGroups: groupedConversations,
          pendingConnections: []
        };
      case 'urgent_only':
        return {
          clientGroups: groupedConversations.filter(group => group.hasUrgent),
          pendingConnections: []
        };
      default:
        return { clientGroups: groupedConversations, pendingConnections };
    }
  };

  const filteredData = getFilteredData();
  
  // Search filter for client groups
  const searchFilteredClientGroups = filteredData.clientGroups.filter(group =>
    group.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.conversations.some(conv => 
      conv.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.serviceType.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const searchFilteredPending = filteredData.pendingConnections.filter(pc =>
    pc.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto-expand clients with urgent or attention-needed conversations
  React.useEffect(() => {
    if (data?.groupedConversations) {
      const autoExpandIds = new Set<string>();
      data.groupedConversations.forEach(group => {
        if (group.hasUrgent || group.needsAttention) {
          autoExpandIds.add(group.clientId);
        }
      });
      setExpandedClients(autoExpandIds);
    }
  }, [data]);

  const toggleClientExpansion = (clientId: string) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background-500">
      {/* Compact Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">My Workspace</h1>
              <p className="text-xs text-gray-600">
                Manage your client relationships
                {isRefreshing && (
                  <span className="inline-flex items-center gap-1 ml-2 text-secondary-600">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Syncing...
                  </span>
                )}
              </p>
              {/* Org Context */}
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <Building className="h-3 w-3" />
                <span>Connected to organizational network</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Compact Stats */}
            {data && (
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-secondary-500 rounded-full"></div>
                  <span>{data.stats.totalClients}</span>
                </div>
                {data.stats.pending > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span>{data.stats.pending}</span>
                  </div>
                )}
                {data.stats.urgent > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-red-600">{data.stats.urgent}</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => fetchData(true)} className="h-8 w-8 p-0">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-xs">
                <Link href={backUrl}>
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  {backLabel}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0 bg-gray-50">
        {/* Left Sidebar - Compact Navigation */}
        <div className="w-56 bg-white border-r border-gray-200 flex flex-col shadow-sm">
          {/* Navigation */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <nav className="space-y-2">
              <button
                onClick={() => setSelectedView('needs_attention')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  selectedView === 'needs_attention'
                    ? 'bg-secondary-50 text-secondary-700 border border-secondary-200 shadow-sm'
                    : 'text-gray-700 hover:bg-accent-50 hover:text-gray-900 hover:shadow-sm'
                }`}
              >
                <Bell className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 text-left min-w-0">
                  <div className="font-medium truncate">
                    {userRole === 'case_manager' ? 'Needs Response' : 'Action Required'}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">
                    {userRole === 'case_manager' 
                      ? 'Awaiting your response' 
                      : 'Messages from case managers'}
                  </div>
                </div>
                {data && data.stats.inbox > 0 && (
                  <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0.5 h-5 min-w-[18px]">
                    {data.stats.inbox}
                  </Badge>
                )}
              </button>
              
              <button
                onClick={() => setSelectedView('pending_connections')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  selectedView === 'pending_connections'
                    ? 'bg-secondary-50 text-secondary-700 border border-secondary-200 shadow-sm'
                    : 'text-gray-700 hover:bg-accent-50 hover:text-gray-900 hover:shadow-sm'
                }`}
              >
                <UserPlus className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 text-left min-w-0">
                  <div className="font-medium truncate">
                    {userRole === 'case_manager' ? 'New Connections' : 'Connection Requests'}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">
                    {userRole === 'case_manager' 
                      ? 'Providers wanting to connect' 
                      : 'Invitations to collaborate'}
                  </div>
                </div>
                {data && data.stats.pending > 0 && (
                  <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0.5 h-5 min-w-[18px]">
                    {data.stats.pending}
                  </Badge>
                )}
              </button>
              
              <button
                onClick={() => setSelectedView('all_clients')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  selectedView === 'all_clients'
                    ? 'bg-secondary-50 text-secondary-700 border border-secondary-200 shadow-sm'
                    : 'text-gray-700 hover:bg-accent-50 hover:text-gray-900 hover:shadow-sm'
                }`}
              >
                <Users className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 text-left min-w-0">
                  <div className="font-medium truncate">
                    {userRole === 'case_manager' ? 'All My Clients' : 'Active Services'}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">
                    {userRole === 'case_manager' 
                      ? 'Complete client list' 
                      : 'All active services'}
                  </div>
                </div>
                {data && data.stats.totalClients > 0 && (
                  <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0.5 h-5 min-w-[18px]">
                    {data.stats.totalClients}
                  </Badge>
                )}
              </button>
              
              <button
                onClick={() => setSelectedView('urgent_only')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  selectedView === 'urgent_only'
                    ? 'bg-secondary-50 text-secondary-700 border border-secondary-200 shadow-sm'
                    : 'text-gray-700 hover:bg-accent-50 hover:text-gray-900 hover:shadow-sm'
                }`}
              >
                <Zap className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 text-left min-w-0">
                  <div className="font-medium truncate">
                    {userRole === 'case_manager' ? 'Urgent Clients' : 'Priority Issues'}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">
                    {userRole === 'case_manager' 
                      ? 'Immediate attention needed' 
                      : 'Urgent situations'}
                  </div>
                </div>
                {data && data.stats.urgent > 0 && (
                  <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0.5 h-5 min-w-[18px]">
                    {data.stats.urgent}
                  </Badge>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Center - Compact List View */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm">
          {/* Enhanced Search */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 text-sm border-gray-200 focus:border-secondary-300 focus:ring-secondary-200"
              />
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Pending Connections */}
            {searchFilteredPending.length > 0 && (
              <div className="border-b border-gray-100">
                <div className="px-3 py-2 bg-accent-50">
                  <h3 className="text-xs font-medium text-gray-900">
                    Connection Requests ({searchFilteredPending.length})
                  </h3>
                </div>
                {searchFilteredPending.map((connection) => (
                  <div key={connection._id} className="p-4 border-b border-gray-50 hover:bg-accent-50 transition-colors duration-150">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-9 h-9 ring-2 ring-white shadow-sm">
                        <AvatarFallback className="bg-secondary-100 text-secondary-700 font-semibold text-xs">
                          {connection.clientName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {connection.clientName}
                          </h4>
                          <span className="text-xs text-gray-500">{connection.timeAgo}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {connection.isFromCurrentUser 
                            ? `Waiting for ${connection.counterpartType} to accept`
                            : `${connection.counterpartType} wants to connect`
                          }
                        </p>
                        {!connection.isFromCurrentUser && (
                          <Button
                            size="sm"
                            onClick={() => handleAcceptConnection(connection)}
                            disabled={acceptingConnection === connection._id}
                            className="mt-2 h-6 px-2 text-xs bg-secondary-500 hover:bg-secondary-600"
                          >
                            {acceptingConnection === connection._id ? (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                Accepting...
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-3 w-3 mr-1" />
                                Accept
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Client Groups */}
            {searchFilteredClientGroups.length > 0 && (
              <div>
                {selectedView !== 'pending_connections' && (
                  <div className="px-3 py-2 bg-accent-50">
                    <h3 className="text-xs font-medium text-gray-900">
                      Clients ({searchFilteredClientGroups.length})
                    </h3>
                  </div>
                )}
                {searchFilteredClientGroups.map((clientGroup) => (
                  <div key={clientGroup.clientId} className="border-b border-gray-50">
                    {/* Client Header */}
                    <div
                      className="p-4 hover:bg-accent-50 cursor-pointer transition-all duration-150 hover:shadow-sm"
                      onClick={() => toggleClientExpansion(clientGroup.clientId)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar className="w-9 h-9 ring-2 ring-white shadow-sm">
                            <AvatarFallback className="bg-gradient-to-br from-secondary-500 to-secondary-600 text-white font-semibold text-xs">
                              {clientGroup.clientName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {clientGroup.needsAttention && (
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-secondary-500 rounded-full border border-white"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {clientGroup.clientName}
                              </h4>
                              <Badge variant="outline" className="text-xs px-1 py-0.5 h-4 text-[10px]">
                                {clientGroup.conversations.length}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              {clientGroup.hasUrgent && (
                                <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" title="Has urgent conversations" />
                              )}
                              {clientGroup.totalUnreadCount > 0 && (
                                <Badge variant="secondary" className="text-xs px-1 py-0.5 h-4 min-w-[16px] text-[9px] font-medium">
                                  {clientGroup.totalUnreadCount}
                                </Badge>
                              )}
                              <span className="text-xs text-gray-500">{clientGroup.timeAgo}</span>
                              {expandedClients.has(clientGroup.clientId) ? (
                                <ChevronDown className="h-3 w-3 text-gray-400" />
                              ) : (
                                <ChevronRight className="h-3 w-3 text-gray-400" />
                              )}
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-600 mt-0.5 truncate">
                            {clientGroup.conversations.length} conversation{clientGroup.conversations.length !== 1 ? 's' : ''} with {clientGroup.conversations.length === 1 ? clientGroup.conversations[0].providerName : `${clientGroup.conversations.length} providers`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Conversations */}
                    {expandedClients.has(clientGroup.clientId) && (
                      <div className="bg-gray-25">
                        {clientGroup.conversations.map((conversation) => (
                          <div
                            key={conversation._id}
                            className={`pl-6 pr-3 py-2 border-b border-gray-100 hover:bg-accent-50 cursor-pointer transition-colors ${
                              selectedConversation?._id === conversation._id ? 'bg-secondary-50' : ''
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedConversation(conversation);
                            }}
                          >
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    <h5 className="text-xs font-medium text-gray-800 truncate">
                                      {conversation.providerName}
                                    </h5>
                                    {/* Sleek conversation type indicator */}
                                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                      conversation.originType === 'referral_based' 
                                        ? 'bg-green-500' 
                                        : 'bg-secondary-500'
                                    }`} 
                                    title={conversation.originType === 'referral_based' ? 'Referral-based conversation' : 'Direct conversation'}
                                    />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {conversation.isUrgent && (
                                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" title="Urgent" />
                                    )}
                                    {conversation.unreadCount > 0 && (
                                      <Badge variant="secondary" className="text-xs px-1 py-0.5 h-4 min-w-[16px] text-[9px] font-medium">
                                        {conversation.unreadCount}
                                      </Badge>
                                    )}
                                    <span className="text-xs text-gray-500">{conversation.timeAgo}</span>
                                  </div>
                                </div>
                                
                                <p className="text-xs text-gray-600 mt-0.5 truncate">
                                  {conversation.serviceType}
                                </p>
                                
                                <p className="text-xs text-gray-700 mt-0.5 truncate">
                                  {conversation.lastMessage.content}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Enhanced Empty State */}
            {searchFilteredClientGroups.length === 0 && searchFilteredPending.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery ? 'No results found' : 'No items in this view'}
                </h3>
                <p className="text-gray-600 text-center max-w-sm">
                  {searchQuery 
                    ? 'Try adjusting your search terms' 
                    : selectedView === 'pending_connections' 
                      ? 'No pending connections at the moment'
                      : selectedView === 'needs_attention'
                        ? `No ${userRole === 'case_manager' ? 'clients need your response' : 'action items'} right now`
                        : selectedView === 'urgent_only'
                          ? `No ${userRole === 'case_manager' ? 'urgent clients' : 'priority issues'} at the moment`
                          : 'Your client conversations will appear here'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Compact Preview/Details */}
        <div className="flex-1 bg-white flex flex-col shadow-sm">
          {selectedConversation ? (
            <>
              {/* Enhanced Conversation Header */}
              <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-start gap-4">
                  <Avatar className="w-11 h-11 ring-2 ring-white shadow-md">
                    <AvatarFallback className="bg-gradient-to-br from-secondary-500 to-secondary-600 text-white font-semibold text-sm">
                      {selectedConversation.clientName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-base font-semibold text-gray-900">
                      {selectedConversation.clientName}
                    </h2>
                    <p className="text-xs text-gray-600">
                      {selectedConversation.serviceType} with {selectedConversation.providerName}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-1.5 py-0.5 h-5 ${
                          selectedConversation.originType === 'referral_based' 
                            ? 'border-green-200 text-green-700' 
                            : 'border-secondary-200 text-secondary-700'
                        }`}
                      >
                        {selectedConversation.originType === 'referral_based' ? 'Referral-based' : 'Direct'}
                      </Badge>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-5">
                        {selectedConversation.totalMessages} msgs
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild className="h-8 px-3 text-xs">
                    <Link href={selectedConversation.workspaceUrl}>
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Open Chat
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Enhanced Quick Preview */}
              <div className="flex-1 p-5">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h3>
                    <div className="bg-gradient-to-r from-accent-50 to-secondary-50 rounded-lg p-4 border border-accent-200">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-7 h-7 ring-2 ring-white shadow-sm">
                          <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                            {selectedConversation.lastMessage.authorName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-xs font-medium text-gray-900">
                              {selectedConversation.lastMessage.authorName}
                            </span>
                            <Badge variant="outline" className="text-xs px-1 py-0.5 h-4">
                              {selectedConversation.lastMessage.category}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {selectedConversation.timeAgo}
                            </span>
                          </div>
                          <p className="text-xs text-gray-700">
                            {selectedConversation.lastMessage.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xs font-medium text-gray-900 mb-2">Quick Actions</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild className="h-7 px-3 text-xs">
                        <Link href={selectedConversation.workspaceUrl}>
                          Open Full Conversation
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-600 max-w-sm">
                  Choose a conversation from the list to see details and quick actions
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
