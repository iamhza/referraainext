'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  MapPin,
  ArrowRight,
  RefreshCw,
  Plus,
  ExternalLink,
  Activity
} from 'lucide-react';
import { formatSafeDate } from '@/lib/shared/date-utils';
import Link from 'next/link';

interface Connection {
  clientName: string;
  matchKey: string;
  county: string;
  caseManagerId: string;
  providerId: string;
  isActivated: boolean;
  referralId?: string;
  status?: string;
  lastActivity?: {
    date: string;
    fromRole: string;
  };
  needsAttention: boolean;
}

interface ConnectionsWidgetProps {
  className?: string;
  showActivateAll?: boolean;
  maxItems?: number;
  showPrioritized?: boolean; // Show connections needing attention first
}

export function ConnectionsWidget({ className, showActivateAll = true, maxItems = 5, showPrioritized = true }: ConnectionsWidgetProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [activatingAll, setActivatingAll] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const userRole = user?.user_metadata?.role;

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/connections');
      if (!response.ok) throw new Error('Failed to fetch connections');
      
      const data = await response.json();
      setConnections(data.connections || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast({
        title: "Error",
        description: "Failed to load connections",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (connection: Connection) => {
    try {
      setActivating(connection.matchKey);
      
      // Get current user data first
      const userResponse = await fetch('/api/auth/user');
      if (!userResponse.ok) throw new Error('Failed to get user data');
      const userData = await userResponse.json();
      
      // For providers, we need to use the current user ID as providerId
      // For case managers, we use the current user ID as caseManagerId
      const userRole = userData.user.role || userData.user.user_metadata?.role;
      const payload = {
        clientMatchKey: connection.matchKey,
        caseManagerId: userRole === 'case_manager' ? userData.user.id : connection.caseManagerId,
        providerId: userRole === 'provider' ? userData.user.id : connection.providerId,
      };
      

      const response = await fetch('/api/connections/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to activate connection');

      const result = await response.json();
      
      toast({
        title: "Connection Established", 
        description: `Successfully connected with ${connection.clientName}. Workspace is now available.`,
      });

      // Refresh connections to update status
      fetchConnections();
      
    } catch (error) {
      console.error('Error activating connection:', error);
      toast({
        title: "Activation Failed",
        description: error instanceof Error ? error.message : "Failed to activate connection",
        variant: "destructive"
      });
    } finally {
      setActivating(null);
    }
  };

  const handleActivateAll = async () => {
    const inactiveConnections = connections.filter(c => !c.isActivated);
    if (inactiveConnections.length === 0) return;

    try {
      setActivatingAll(true);
      
      // Activate connections in parallel (with some throttling)
      const activatePromises = inactiveConnections.map((connection, index) => 
        new Promise((resolve) => {
          setTimeout(async () => {
            try {
              // Get current user data for each activation
              const userResponse = await fetch('/api/auth/user');
              if (!userResponse.ok) throw new Error('Failed to get user data');
              const userData = await userResponse.json();
              
              const userRole = userData.user.role || userData.user.user_metadata?.role;
              const payload = {
                clientMatchKey: connection.matchKey,
                caseManagerId: userRole === 'case_manager' ? userData.user.id : connection.caseManagerId,
                providerId: userRole === 'provider' ? userData.user.id : connection.providerId,
              };
              
              const response = await fetch('/api/connections/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });
              resolve(response.ok);
            } catch (error) {
              resolve(false);
            }
          }, index * 200) // Stagger requests by 200ms
        })
      );

      const results = await Promise.all(activatePromises);
      const successCount = results.filter(Boolean).length;
      
      toast({
        title: "Bulk Activation Complete",
        description: `Activated ${successCount} of ${inactiveConnections.length} connections`,
      });

      fetchConnections();
      
    } catch (error) {
      console.error('Error bulk activating:', error);
      toast({
        title: "Bulk Activation Failed",
        description: "Some connections may not have been activated",
        variant: "destructive"
      });
    } finally {
      setActivatingAll(false);
    }
  };

  const getStatusBadge = (connection: Connection) => {
    if (!connection.isActivated) {
      return <Badge variant="outline" className="text-gray-600">Not Active</Badge>;
    }
    if (connection.needsAttention) {
      return <Badge variant="default" className="bg-orange-100 text-orange-800">Needs Response</Badge>;
    }
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full shadow-sm border border-green-200"></div>
        <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>
      </div>
    );
  };

  const getCounterpartName = (connection: Connection) => {
    if (userRole === 'case_manager') {
      return 'Provider'; // Could fetch provider name from Supabase if needed
    }
    return 'Case Manager'; // Could extract from caseManagerEmail if available
  };

  // Sort connections prioritizing those needing attention and inactive ones
  const sortedConnections = showPrioritized 
    ? [...connections].sort((a, b) => {
        // First: Connections needing attention
        if (a.needsAttention && !b.needsAttention) return -1;
        if (!a.needsAttention && b.needsAttention) return 1;
        
        // Second: Inactive connections
        if (!a.isActivated && b.isActivated) return -1;
        if (a.isActivated && !b.isActivated) return 1;
        
        // Third: Most recent activity
        if (a.lastActivity && b.lastActivity) {
          return new Date(b.lastActivity.date).getTime() - new Date(a.lastActivity.date).getTime();
        }
        if (a.lastActivity && !b.lastActivity) return -1;
        if (!a.lastActivity && b.lastActivity) return 1;
        
        return 0;
      })
    : connections;
    
  const limitedConnections = maxItems ? sortedConnections.slice(0, maxItems) : sortedConnections;
  const hasMoreConnections = maxItems && connections.length > maxItems;
  const inactiveCount = connections.filter(c => !c.isActivated).length;
  const attentionCount = connections.filter(c => c.needsAttention).length;

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading connections...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="pb-3 pt-6">
        <CardTitle className="text-base font-medium text-gray-900 flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-500" />
          Connections
          {connections.length > 0 && (
            <Badge variant="outline" className="ml-auto">{connections.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        {connections.length === 0 ? (
          <div>
            <p className="text-sm text-gray-600 font-normal mb-4 leading-5">
              Discover and manage shared clients with {userRole === 'case_manager' ? 'providers' : 'case managers'}. Upload your client list to find connections.
            </p>
            <Button 
              variant="outline"
              size="sm"
              className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
              asChild
            >
              <Link href={userRole === 'case_manager' ? '/case-manager/clients' : '/provider/clients'}>
                <Plus className="h-4 w-4 mr-2" />
                Upload Clients
              </Link>
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 font-normal mb-4 leading-5">
              Manage shared clients and activate connections with {userRole === 'case_manager' ? 'providers' : 'case managers'} for seamless communication.
            </p>
            
            {/* Quick Stats */}
            {(attentionCount > 0 || inactiveCount > 0) && (
              <div className="flex items-center gap-4 mb-4 p-2 bg-gray-50 rounded-lg">
                {inactiveCount > 0 && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    {inactiveCount} ready to activate
                  </div>
                )}
                {attentionCount > 0 && (
                  <div className="flex items-center gap-1 text-sm text-orange-600">
                    <AlertCircle className="h-4 w-4" />
                    {attentionCount} need response
                  </div>
                )}
              </div>
            )}

            {/* Bulk Actions */}
            {showActivateAll && inactiveCount > 0 && (
              <Button
                onClick={handleActivateAll}
                disabled={activatingAll}
                size="sm"
                className="w-full mb-4 bg-blue-600 hover:bg-blue-700"
              >
                {activatingAll ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Activating All...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Activate All {inactiveCount} Connections
                  </>
                )}
              </Button>
            )}

            {/* Connections List */}
            <div className="space-y-3 mb-4">
              {limitedConnections.map((connection) => (
                <div key={connection.matchKey} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-xs">
                        {connection.clientName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm text-gray-900 truncate">{connection.clientName}</p>
                        {getStatusBadge(connection)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {connection.county}
                        </div>
                        <div className="flex items-center gap-1 truncate">
                          <Users className="h-3 w-3" />
                          <span className="truncate">{getCounterpartName(connection)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {connection.isActivated ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-200 text-green-700 hover:bg-green-50"
                        asChild
                      >
                        <Link
                          href={userRole === 'case_manager' 
                            ? `/case-manager/workspace`
                            : `/provider/workspace`
                          }
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Workspace
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleActivate(connection)}
                        disabled={activating === connection.matchKey}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {activating === connection.matchKey ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Activating...
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* View All Button */}
            {hasMoreConnections ? (
              <Button 
                variant="outline"
                size="sm"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                asChild
              >
                <Link href={userRole === 'case_manager' ? '/case-manager/workspace' : '/provider/workspace'}>
                  <Users className="h-4 w-4 mr-2" />
                  View All {connections.length} Connections
                </Link>
              </Button>
            ) : (
              <Button 
                variant="outline"
                size="sm"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={fetchConnections}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Connections
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
