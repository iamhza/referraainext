'use client';

import { useParams } from 'next/navigation';
import { PageTemplate } from '@/components/templates/page-template';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle,
  Clock,
  Calendar,
  Phone,
  Mail,
  Building,
  ChevronRight,
  AlertCircle,
  FileText,
  ClipboardList,
  Users,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: 'provider' | 'case_manager';
  status: 'pending' | 'completed';
  dueDate: string;
  completedDate?: string;
  completedBy?: string;
}

interface Update {
  id: string;
  type: 'progress' | 'outcome' | 'general';
  title: string;
  content: string;
  createdAt: string;
  createdBy: {
    name: string;
    role: 'provider' | 'case_manager';
  };
}

export default function ActiveReferralPage() {
  const params = useParams();
  const [newUpdate, setNewUpdate] = useState('');
  const [updateType, setUpdateType] = useState<'progress' | 'outcome' | 'general'>('progress');

  if (!params) {
    return <div>Loading...</div>;
  }
  // This would come from your API/database
  const referral = {
    id: params.id,
    clientName: 'John Doe',
    clientId: 'CLIENT-789',
    service: 'Medical Care',
    status: 'in_progress',
    startDate: '2024-04-16T14:20:00Z',
    urgent: true,
    provider: {
      id: 'PROV-1',
      name: 'Dr. Sarah Williams',
      organization: 'HealthFirst Clinic',
      phone: '(612) 555-0123',
      email: 'swilliams@healthfirst.com',
      address: '123 Medical Center Dr, Minneapolis, MN 55401'
    },
    caseManager: {
      id: 'CM-456',
      name: 'Michael Thompson',
      phone: '(612) 555-0789',
      email: 'mthompson@referra.com'
    },
    tasks: [
      {
        id: 'TASK-1',
        title: 'Initial Assessment',
        description: 'Complete initial client assessment and document findings',
        assignedTo: 'provider',
        status: 'completed',
        dueDate: '2024-04-18T17:00:00Z',
        completedDate: '2024-04-18T15:30:00Z',
        completedBy: 'Dr. Sarah Williams'
      },
      {
        id: 'TASK-2',
        title: 'Treatment Plan Review',
        description: 'Review and approve proposed treatment plan',
        assignedTo: 'case_manager',
        status: 'pending',
        dueDate: '2024-04-20T17:00:00Z'
      },
      {
        id: 'TASK-3',
        title: 'Schedule Follow-up',
        description: 'Schedule follow-up appointment with client',
        assignedTo: 'provider',
        status: 'pending',
        dueDate: '2024-04-22T17:00:00Z'
      }
    ] as Task[],
    updates: [
      {
        id: 'UPD-1',
        type: 'progress',
        title: 'Initial Assessment Complete',
        content: 'Client has completed initial assessment. Key findings include...',
        createdAt: '2024-04-18T15:30:00Z',
        createdBy: {
          name: 'Dr. Sarah Williams',
          role: 'provider'
        }
      },
      {
        id: 'UPD-2',
        type: 'general',
        title: 'Client Preferences Note',
        content: 'Client has expressed preference for afternoon appointments...',
        createdAt: '2024-04-18T16:00:00Z',
        createdBy: {
          name: 'Michael Thompson',
          role: 'case_manager'
        }
      }
    ] as Update[],
  };

  const handleCompleteTask = async (taskId: string) => {
    // API call to complete task
  };

  const handleAddUpdate = async () => {
    if (!newUpdate.trim()) return;
    // API call to add update
    setNewUpdate('');
  };

  return (
    <PageTemplate
      title={`Active Referral: ${referral.clientName}`}
      description="Track and manage active referral"
    >
      {/* Status Banner */}
      <Card className="mb-6 border-l-4 border-l-green-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <h3 className="font-medium">Active Referral</h3>
                <p className="text-sm text-muted-foreground">
                  Started {new Date(referral.startDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {referral.urgent && (
                <Badge variant="destructive">Urgent</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Main Content Tabs */}
          <Tabs defaultValue="tasks" className="space-y-6">
            <TabsList>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
            </TabsList>

            {/* Tasks Tab */}
            <TabsContent value="tasks">
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Tasks</CardTitle>
                  <CardDescription>Track and manage required tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {referral.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "border rounded-lg p-4",
                        "transition-all duration-200",
                        task.status === 'completed' && "bg-green-50/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{task.title}</h3>
                            <Badge variant={task.status === 'completed' ? "default" : "outline"}>
                              {task.status === 'completed' ? 'Completed' : 'Pending'}
                            </Badge>
                            <Badge variant="outline">
                              {task.assignedTo === 'provider' ? 'Provider Task' : 'Case Manager Task'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                            {task.completedDate && (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Completed: {new Date(task.completedDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        {task.status === 'pending' && task.assignedTo === 'case_manager' && (
                          <Button
                            size="sm"
                            onClick={() => handleCompleteTask(task.id)}
                          >
                            Complete Task
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Updates Tab */}
            <TabsContent value="updates">
              <Card>
                <CardHeader>
                  <CardTitle>Service Updates</CardTitle>
                  <CardDescription>Log and view progress or outcome updates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Add new update */}
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Enter a new update..."
                      value={newUpdate}
                      onChange={(e) => setNewUpdate(e.target.value)}
                    />
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                         {/* RadioGroup for update type would go here */}
                      </div>
                      <Button onClick={handleAddUpdate}>Add Update</Button>
                    </div>
                  </div>
                  {/* List of updates */}
                  <div className="space-y-4">
                    {referral.updates.map((update) => (
                      <div key={update.id} className="border-t pt-4">
                        <p className="font-medium">{update.title}</p>
                        <p className="text-sm text-muted-foreground">{update.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {update.createdBy.name} on {new Date(update.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Referral Info */}
          <Card>
            <CardHeader>
              <CardTitle>Referral Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Client</h4>
                <p className="mt-1">{referral.clientName}</p>
                <p className="text-sm text-muted-foreground">{referral.clientId}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Service</h4>
                <p className="mt-1">{referral.service}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Start Date</h4>
                <p className="mt-1">{new Date(referral.startDate).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Provider Info */}
          <Card>
            <CardHeader>
              <CardTitle>Provider Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">{referral.provider.name}</h3>
                <p className="text-sm text-muted-foreground">{referral.provider.organization}</p>
              </div>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  {referral.provider.phone}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  {referral.provider.email}
                </p>
                <p className="flex items-center gap-2">
                  <Building className="h-3 w-3" />
                  {referral.provider.address}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                <Phone className="h-4 w-4 mr-2" />
                Call Provider
              </Button>
              <Button className="w-full" variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Email Provider
              </Button>
              <Button className="w-full" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                View Documents
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTemplate>
  );
} 