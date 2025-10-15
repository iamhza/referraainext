'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Search, 
  Filter, 
  ArrowLeft, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  FileText,
  Send,
  MessageSquare,
  Calendar,
  User,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

// Mock data types
interface ActionItem {
  id: string;
  type: 'referral_followup' | 'document_needed' | 'service_review' | 'provider_response' | 'deadline';
  title: string;
  description: string;
  clientId: string;
  clientName: string;
  priority: 'urgent' | 'high' | 'normal';
  dueDate?: Date;
  overdueDays?: number;
  createdAt: Date;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  status: 'urgent' | 'pending' | 'stable';
  activeServices: string[];
  lastUpdate: Date;
  actions: ActionItem[];
  timeline: TimelineEvent[];
}

interface TimelineEvent {
  id: string;
  type: 'referral' | 'connection' | 'note' | 'status_change' | 'document';
  title: string;
  description: string;
  date: Date;
  icon: string;
}

// Mock data generator
const generateMockClients = (): Client[] => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  return [
    {
      id: '1',
      firstName: 'Jane',
      lastName: 'Doe',
      status: 'urgent',
      activeServices: ['Housing Stabilization', 'Day Training & Habilitation'],
      lastUpdate: threeDaysAgo,
      actions: [
        {
          id: 'a1',
          type: 'referral_followup',
          title: 'Follow up on housing referral',
          description: 'Provider Horizon Homes hasn\'t responded in 3 days (SLA breach)',
          clientId: '1',
          clientName: 'Jane Doe',
          priority: 'urgent',
          dueDate: yesterday,
          overdueDays: 1,
          createdAt: weekAgo
        },
        {
          id: 'a2',
          type: 'document_needed',
          title: 'IHP signature required',
          description: 'Individual Habilitation Plan needs signature for quarterly review',
          clientId: '1',
          clientName: 'Jane Doe',
          priority: 'urgent',
          dueDate: today,
          overdueDays: 0,
          createdAt: weekAgo
        }
      ],
      timeline: [
        {
          id: 't1',
          type: 'referral',
          title: 'Housing referral sent',
          description: 'Sent referral to Horizon Homes for emergency housing',
          date: weekAgo,
          icon: 'Send'
        },
        {
          id: 't2',
          type: 'note',
          title: 'Case note added',
          description: 'Client expressing frustration with current living situation. Escalated to urgent.',
          date: new Date(weekAgo.getTime() + 2 * 24 * 60 * 60 * 1000),
          icon: 'MessageSquare'
        },
        {
          id: 't3',
          type: 'connection',
          title: 'Active service: Day Training',
          description: 'Connected with Accord Inc. for day training services',
          date: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000),
          icon: 'CheckCircle2'
        }
      ]
    },
    {
      id: '2',
      firstName: 'Mike',
      lastName: 'Perez',
      status: 'urgent',
      activeServices: ['Day Habilitation', 'Transportation'],
      lastUpdate: yesterday,
      actions: [
        {
          id: 'a3',
          type: 'document_needed',
          title: 'Document signature overdue',
          description: 'Transportation authorization form overdue',
          clientId: '2',
          clientName: 'Mike Perez',
          priority: 'urgent',
          dueDate: threeDaysAgo,
          overdueDays: 2,
          createdAt: weekAgo
        }
      ],
      timeline: [
        {
          id: 't4',
          type: 'document',
          title: 'Authorization form sent',
          description: 'Transportation authorization sent to provider',
          date: weekAgo,
          icon: 'FileText'
        },
        {
          id: 't5',
          type: 'connection',
          title: 'Active service: Day Habilitation',
          description: 'Currently receiving services from Opportunity Partners',
          date: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000),
          icon: 'CheckCircle2'
        }
      ]
    },
    {
      id: '3',
      firstName: 'Sarah',
      lastName: 'Johnson',
      status: 'pending',
      activeServices: ['Supported Employment', 'Community Access'],
      lastUpdate: yesterday,
      actions: [
        {
          id: 'a4',
          type: 'service_review',
          title: '6-month service review due',
          description: 'Semi-annual review required for continued services',
          clientId: '3',
          clientName: 'Sarah Johnson',
          priority: 'high',
          dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
          createdAt: weekAgo
        }
      ],
      timeline: [
        {
          id: 't6',
          type: 'note',
          title: 'Progress update',
          description: 'Client making good progress in employment placement program',
          date: yesterday,
          icon: 'MessageSquare'
        }
      ]
    },
    {
      id: '4',
      firstName: 'John',
      lastName: 'Smith',
      status: 'pending',
      activeServices: ['Day Training & Habilitation'],
      lastUpdate: threeDaysAgo,
      actions: [
        {
          id: 'a5',
          type: 'provider_response',
          title: 'Provider update requested',
          description: 'Monthly progress report pending from service provider',
          clientId: '4',
          clientName: 'John Smith',
          priority: 'normal',
          dueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
          createdAt: weekAgo
        }
      ],
      timeline: [
        {
          id: 't7',
          type: 'connection',
          title: 'Service initiated',
          description: 'Started day training program with Community Partners',
          date: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000),
          icon: 'CheckCircle2'
        }
      ]
    },
    {
      id: '5',
      firstName: 'Emily',
      lastName: 'Rogers',
      status: 'stable',
      activeServices: ['Residential Services', 'Day Program'],
      lastUpdate: weekAgo,
      actions: [],
      timeline: [
        {
          id: 't8',
          type: 'note',
          title: 'All services stable',
          description: 'Client doing well in current placements. No concerns.',
          date: weekAgo,
          icon: 'CheckCircle2'
        }
      ]
    },
    {
      id: '6',
      firstName: 'David',
      lastName: 'Lee',
      status: 'stable',
      activeServices: ['Community Integration'],
      lastUpdate: twoWeeksAgo,
      actions: [],
      timeline: []
    },
    {
      id: '7',
      firstName: 'Lisa',
      lastName: 'Brown',
      status: 'stable',
      activeServices: ['Supported Living'],
      lastUpdate: twoWeeksAgo,
      actions: [],
      timeline: []
    },
    {
      id: '8',
      firstName: 'Tom',
      lastName: 'Wilson',
      status: 'pending',
      activeServices: ['Day Habilitation'],
      lastUpdate: yesterday,
      actions: [
        {
          id: 'a6',
          type: 'deadline',
          title: 'Insurance reauthorization needed',
          description: 'Medicaid waiver reauthorization due this week',
          clientId: '8',
          clientName: 'Tom Wilson',
          priority: 'high',
          dueDate: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000),
          createdAt: weekAgo
        }
      ],
      timeline: []
    }
  ];
};

export default function TriageFeedPage() {
  const [clients] = useState<Client[]>(generateMockClients());
  const [selectedFilter, setSelectedFilter] = useState<'needs-action' | 'all' | 'recent'>('needs-action');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Get all actions sorted by priority
  const allActions = useMemo(() => {
    const actions: ActionItem[] = [];
    clients.forEach(client => {
      actions.push(...client.actions);
    });
    
    // Sort by priority and due date
    return actions.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, normal: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      return 0;
    });
  }, [clients]);

  // Filter clients based on search and selected filter
  const filteredClients = useMemo(() => {
    let filtered = clients;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(client =>
        `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (selectedFilter === 'needs-action') {
      filtered = filtered.filter(client => client.actions.length > 0);
    } else if (selectedFilter === 'recent') {
      filtered = [...filtered].sort((a, b) => b.lastUpdate.getTime() - a.lastUpdate.getTime());
    }

    return filtered;
  }, [clients, searchQuery, selectedFilter]);

  // Get content for right panel
  const rightPanelContent = useMemo(() => {
    if (selectedClientId) {
      const client = clients.find(c => c.id === selectedClientId);
      return { mode: 'client', client };
    }
    return { mode: 'triage', actions: allActions };
  }, [selectedClientId, clients, allActions]);

  const getStatusColor = (status: 'urgent' | 'pending' | 'stable') => {
    switch (status) {
      case 'urgent': return 'text-red-500';
      case 'pending': return 'text-yellow-500';
      case 'stable': return 'text-green-500';
    }
  };

  const getStatusIcon = (status: 'urgent' | 'pending' | 'stable') => {
    switch (status) {
      case 'urgent': return '🔴';
      case 'pending': return '🟡';
      case 'stable': return '🟢';
    }
  };

  const getPriorityColor = (priority: 'urgent' | 'high' | 'normal') => {
    switch (priority) {
      case 'urgent': return 'bg-red-50 border-red-200';
      case 'high': return 'bg-orange-50 border-orange-200';
      case 'normal': return 'bg-blue-50 border-blue-200';
    }
  };

  const getActionIcon = (type: ActionItem['type']) => {
    switch (type) {
      case 'referral_followup': return Send;
      case 'document_needed': return FileText;
      case 'service_review': return Calendar;
      case 'provider_response': return MessageSquare;
      case 'deadline': return Clock;
    }
  };

  const getTimelineIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'referral': return Send;
      case 'connection': return CheckCircle2;
      case 'note': return MessageSquare;
      case 'status_change': return AlertCircle;
      case 'document': return FileText;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/case-manager">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Board
              </Button>
            </Link>
            <div className="border-l border-gray-300 h-6" />
            <h1 className="text-xl font-semibold text-gray-900">Triage Feed & Caseload Hub</h1>
            <Badge variant="secondary" className="ml-2">
              Proof of Concept
            </Badge>
          </div>
          <div className="text-sm text-gray-600">
            Case Manager: <span className="font-medium">miknabil@yahoo.com</span>
          </div>
        </div>
      </div>

      {/* Main Content: Two-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL: CASELOAD HUB */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Search and Filter */}
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Filter Buttons */}
            <div className="space-y-1">
              <Button
                variant={selectedFilter === 'needs-action' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  setSelectedFilter('needs-action');
                  setSelectedClientId(null);
                }}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                🔴 Needs Action ({clients.filter(c => c.actions.length > 0).length})
              </Button>
              
              <Button
                variant={selectedFilter === 'all' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  setSelectedFilter('all');
                  setSelectedClientId(null);
                }}
              >
                <User className="h-4 w-4 mr-2" />
                All Clients ({clients.length})
              </Button>
              
              <Button
                variant={selectedFilter === 'recent' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  setSelectedFilter('recent');
                  setSelectedClientId(null);
                }}
              >
                <Clock className="h-4 w-4 mr-2" />
                Recently Updated
              </Button>
            </div>
          </div>

          {/* Client List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedClientId === client.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getStatusIcon(client.status)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {client.firstName} {client.lastName}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {client.activeServices[0]}
                        {client.activeServices.length > 1 && ` +${client.activeServices.length - 1}`}
                      </div>
                    </div>
                    {client.actions.length > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {client.actions.length}
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: ACTION FEED */}
        <div className="flex-1 bg-gray-50 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            {rightPanelContent.mode === 'triage' ? (
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    🔴 Needs Action (All Clients)
                  </h2>
                  <p className="text-sm text-gray-600">
                    {allActions.length} action{allActions.length !== 1 ? 's' : ''} requiring attention
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Sort:</span>
                  <Button variant="ghost" size="sm">
                    ▼ Priority
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {rightPanelContent.client?.firstName} {rightPanelContent.client?.lastName}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedClientId(null)}
                  >
                    Back to All Actions
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  {rightPanelContent.client?.activeServices.join(' • ')}
                </p>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {rightPanelContent.mode === 'triage' ? (
              // TRIAGE VIEW: Action Cards
              <div className="space-y-4 max-w-3xl">
                {allActions.length === 0 ? (
                  <Card className="p-8 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      All Caught Up!
                    </h3>
                    <p className="text-gray-600">
                      No urgent actions needed right now. Great work!
                    </p>
                  </Card>
                ) : (
                  allActions.map((action) => {
                    const Icon = getActionIcon(action.type);
                    return (
                      <Card
                        key={action.id}
                        className={`p-5 border-l-4 ${getPriorityColor(action.priority)}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${
                            action.priority === 'urgent' 
                              ? 'bg-red-100' 
                              : action.priority === 'high'
                              ? 'bg-orange-100'
                              : 'bg-blue-100'
                          }`}>
                            <Icon className={`h-5 w-5 ${
                              action.priority === 'urgent'
                                ? 'text-red-600'
                                : action.priority === 'high'
                                ? 'text-orange-600'
                                : 'text-blue-600'
                            }`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-1">
                                  {action.title}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {action.description}
                                </p>
                              </div>
                              {action.priority === 'urgent' && (
                                <Badge variant="destructive" className="flex-shrink-0">
                                  URGENT
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                              <span className="font-medium">
                                Client: {action.clientName}
                              </span>
                              {action.overdueDays !== undefined && action.overdueDays > 0 && (
                                <span className="text-red-600 font-medium">
                                  Overdue: {action.overdueDays} day{action.overdueDays !== 1 ? 's' : ''}
                                </span>
                              )}
                              {action.dueDate && action.overdueDays === 0 && (
                                <span className="text-orange-600 font-medium">
                                  Due: Today
                                </span>
                              )}
                              {action.dueDate && !action.overdueDays && action.overdueDays !== 0 && (
                                <span>
                                  Due: {formatDistanceToNow(action.dueDate, { addSuffix: true })}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <Button size="sm" variant="default">
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Mark Complete
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedClientId(action.clientId)}
                              >
                                View Client
                              </Button>
                              {action.type === 'document_needed' && (
                                <Button size="sm" variant="outline">
                                  <FileText className="h-4 w-4 mr-1" />
                                  Upload Doc
                                </Button>
                              )}
                              {action.type === 'referral_followup' && (
                                <Button size="sm" variant="outline">
                                  <Send className="h-4 w-4 mr-1" />
                                  Send Reminder
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            ) : (
              // CLIENT-SPECIFIC VIEW: Timeline
              <div className="space-y-6 max-w-3xl">
                {/* Client Info Card */}
                <Card className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {rightPanelContent.client?.firstName} {rightPanelContent.client?.lastName}
                      </h3>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={getStatusColor(rightPanelContent.client?.status || 'stable')}>
                          {getStatusIcon(rightPanelContent.client?.status || 'stable')} 
                          {' '}
                          {rightPanelContent.client?.status === 'urgent' && 'Needs Attention'}
                          {rightPanelContent.client?.status === 'pending' && 'Pending Actions'}
                          {rightPanelContent.client?.status === 'stable' && 'All Stable'}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600">
                          Last updated {formatDistanceToNow(rightPanelContent.client?.lastUpdate || new Date(), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Active Services</h4>
                    <div className="flex flex-wrap gap-2">
                      {rightPanelContent.client?.activeServices.map((service, idx) => (
                        <Badge key={idx} variant="secondary">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Current Actions */}
                {rightPanelContent.client && rightPanelContent.client.actions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Current Actions ({rightPanelContent.client.actions.length})
                    </h3>
                    <div className="space-y-3">
                      {rightPanelContent.client.actions.map((action) => {
                        const Icon = getActionIcon(action.type);
                        return (
                          <Card key={action.id} className={`p-4 border-l-4 ${getPriorityColor(action.priority)}`}>
                            <div className="flex items-start gap-3">
                              <Icon className="h-5 w-5 text-gray-600 mt-0.5" />
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 mb-1">{action.title}</h4>
                                <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                                <div className="flex gap-2">
                                  <Button size="sm">Mark Complete</Button>
                                  <Button size="sm" variant="outline">Add Note</Button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Client History & Timeline
                  </h3>
                  {rightPanelContent.client && rightPanelContent.client.timeline.length > 0 ? (
                    <div className="space-y-4">
                      {rightPanelContent.client.timeline.map((event, idx) => {
                        const Icon = getTimelineIcon(event.type);
                        return (
                          <div key={event.id} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <Icon className="h-4 w-4 text-blue-600" />
                              </div>
                              {idx < rightPanelContent.client!.timeline.length - 1 && (
                                <div className="w-0.5 h-full bg-gray-200 mt-2" />
                              )}
                            </div>
                            <div className="flex-1 pb-6">
                              <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-medium text-gray-900">{event.title}</h4>
                                  <span className="text-xs text-gray-500">
                                    {formatDistanceToNow(event.date, { addSuffix: true })}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">{event.description}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <Card className="p-6 text-center text-gray-500">
                      No timeline events to display
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

