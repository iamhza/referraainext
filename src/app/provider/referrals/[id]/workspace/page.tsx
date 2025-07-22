"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  MessageSquare,
  Clock,
  AlertCircle,
  Send,
  User,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Save,
  X,
  Users,
  Building,
  CheckCircle,
  Calendar,
  FileText,
  Activity,
  Mail,
  Phone,
  MapPin,
  UserCheck,
  Settings,
  Plus,
  Star,
  Flag,
  Eye,
  EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSafeDate } from '@/lib/date-utils';
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from '@/contexts/AuthContext';

// Types
interface Comment {
  _id: string;
  authorId: string;
  authorType: 'case_manager' | 'provider' | 'admin';
  authorName: string;
  category: 'status' | 'request' | 'progress' | 'issue' | 'admin';
  content: string;
  priority: 'normal' | 'important' | 'urgent';
  createdAt: string;
  editedAt?: string;
  metadata?: any;
  parentId?: string | null;
  replies?: Comment[];
  replyCount?: number;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  assignedTo: 'case_manager' | 'provider';
  assignedToId: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  completedBy?: string;
}

// Comment category colors and labels
const categoryConfig = {
  status: { label: 'Status Update', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  request: { label: 'Request', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  progress: { label: 'Progress Note', color: 'bg-green-100 text-green-800 border-green-200' },
  issue: { label: 'Issue/Concern', color: 'bg-red-100 text-red-800 border-red-200' },
  admin: { label: 'Administrative', color: 'bg-gray-100 text-gray-800 border-gray-200' }
};

const priorityConfig = {
  normal: { color: 'border-l-gray-300' },
  important: { color: 'border-l-orange-400' },
  urgent: { color: 'border-l-red-500' }
};

export default function ProviderWorkspacePage() {
  const params = useParams<{ id: string }>();
  const referralId = params?.id;
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [referral, setReferral] = useState<any>(null);
  const [newComment, setNewComment] = useState('');
  const [commentCategory, setCommentCategory] = useState<string>('progress');
  const [commentPriority, setCommentPriority] = useState<string>('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [showClientInfo, setShowClientInfo] = useState(false);

  useEffect(() => {
    if (referralId) {
      fetchReferralData();
    }
  }, [referralId]);

  useEffect(() => {
    if (user) {
      setCurrentUserId(user.id);
    }
  }, [user]);

  const fetchReferralData = async () => {
    setLoading(true);
    try {
      // Fetch referral details
      const referralResponse = await fetch(`/api/referrals/${referralId}`);
      if (!referralResponse.ok) throw new Error('Failed to fetch referral');
      const referralData = await referralResponse.json();
      setReferral(referralData.referral);

      // Fetch comments
      const commentsResponse = await fetch(`/api/referrals/${referralId}/comments`);
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json();
        setComments(commentsData.comments || []);
      }

      // Fetch tasks
      const tasksResponse = await fetch(`/api/referrals/${referralId}/tasks`);
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast({
        title: "Error",
        description: "Failed to load referral data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/referrals/${referralId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
          category: commentCategory,
          priority: commentPriority,
          authorType: 'provider',
          authorId: currentUserId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [...prev, data.comment]);
        setNewComment('');
        toast({
          title: "Comment posted",
          description: "Your comment has been posted successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTaskStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/referrals/${referralId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          completedBy: newStatus === 'completed' ? currentUserId : null,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : null
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(prev => prev.map(task => 
          task._id === taskId ? { ...task, ...data.task } : task
        ));
        toast({
          title: "Task updated",
          description: "Task status has been updated successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!referral) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Referral not found</h2>
          <p className="text-gray-600 mb-4">The referral you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/provider/referrals')}>
            Back to Referrals
          </Button>
        </div>
      </div>
    );
  }

  const clientName = referral.clientInfo ? `${referral.clientInfo.firstName} ${referral.clientInfo.lastName}` : 'Unknown Client';
  const clientInitials = referral.clientInfo ? 
    `${referral.clientInfo.firstName?.[0] || ''}${referral.clientInfo.lastName?.[0] || ''}`.toUpperCase() : 
    'UC';
  const serviceType = referral.serviceDetails?.type || 'Unknown Service';
  const status = referral.status;
  const urgency = referral.serviceDetails?.urgency || 'medium';

  // Status configuration for progress and display
  const getStatusConfig = (status: string) => {
    const configs: Record<string, any> = {
      under_review: {
        icon: Clock,
        color: 'amber',
        label: 'Under Review',
        description: 'Awaiting admin review',
        progressValue: 25
      },
      provider_selection_required: {
        icon: Building,
        color: 'blue',
        label: 'Select Provider',
        description: 'Case manager needs to select a provider',
        progressValue: 50
      },
      provider_accepted: {
        icon: CheckCircle,
        color: 'green',
        label: 'Provider Accepted',
        description: 'Provider has accepted the referral',
        progressValue: 75
      },
      in_progress: {
        icon: Activity,
        color: 'green',
        label: 'In Progress',
        description: 'Service is currently being provided',
        progressValue: 85
      },
      completed: {
        icon: CheckCircle,
        color: 'green',
        label: 'Completed',
        description: 'Service has been completed',
        progressValue: 100
      },
      cancelled: {
        icon: AlertCircle,
        color: 'red',
        label: 'Cancelled',
        description: 'This referral has been cancelled',
        progressValue: 100
      }
    };
    return configs[status] || configs.under_review;
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const myTasks = tasks.filter(task => task.assignedTo === 'provider');
  const caseManagerTasks = tasks.filter(task => task.assignedTo === 'case_manager');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Enhanced Referral Context Panel */}
          <Card className="shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50">
              <div className="flex justify-between items-center px-6 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 rounded-lg border-2 border-white shadow-sm bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                      {clientInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{clientName}</h2>
                    <p className="text-sm text-gray-600">{serviceType} Referral</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClientInfo(!showClientInfo)}
                    className="flex items-center gap-2"
                  >
                    {showClientInfo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showClientInfo ? 'Hide' : 'Show'} Client Info
                  </Button>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="text-sm font-medium">
                      {referral?.createdAt 
                        ? formatSafeDate(referral.createdAt, 'MMM d, yyyy') 
                        : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="px-6 pb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{statusConfig.progressValue}%</span>
                </div>
                <Progress value={statusConfig.progressValue} className="h-2" />
                <p className="text-xs text-gray-600 mt-1">{statusConfig.description}</p>
              </div>
            </div>
            
            {/* Client Information - Collapsible */}
            {showClientInfo && (
              <div className="px-6 py-4 bg-white border-b border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                    <div className="space-y-2">
                      {referral.clientInfo?.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          {referral.clientInfo.email}
                        </div>
                      )}
                      {referral.clientInfo?.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          {referral.clientInfo.phone}
                        </div>
                      )}
                      {referral.clientInfo?.address && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {referral.clientInfo.address}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Service Details</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Urgency:</span>
                        <Badge variant={urgency === 'high' ? 'destructive' : urgency === 'medium' ? 'default' : 'secondary'}>
                          {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <Badge variant="outline">
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Comments Section */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Communication Thread
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Comments List */}
                  <div className="space-y-4 mb-6">
                    {comments.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No comments yet. Start the conversation!</p>
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div
                          key={comment._id}
                          className={`border-l-4 ${priorityConfig[comment.priority]?.color} pl-4 pb-4 border-b border-gray-100 last:border-b-0`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                                  {getInitials(comment.authorName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm text-gray-900">{comment.authorName}</p>
                                  <Badge variant="outline" className={`text-xs ${categoryConfig[comment.category]?.color}`}>
                                    {categoryConfig[comment.category]?.label}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {formatSafeDate(comment.createdAt, 'MMM d, h:mm a')}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 capitalize">
                                  {comment.authorType.replace('_', ' ')}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="ml-11">
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* New Comment Form */}
                  <div className="border-t pt-6">
                    <div className="flex gap-4 mb-4">
                      <Select value={commentCategory} onValueChange={setCommentCategory}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="progress">Progress Note</SelectItem>
                          <SelectItem value="status">Status Update</SelectItem>
                          <SelectItem value="request">Request</SelectItem>
                          <SelectItem value="issue">Issue/Concern</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select value={commentPriority} onValueChange={setCommentPriority}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="important">Important</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Textarea
                      placeholder="Add a comment to communicate with the case manager..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="mb-4"
                      rows={3}
                    />
                    
                    <Button 
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Post Comment
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tasks and Actions Sidebar */}
            <div className="space-y-6">
              {/* My Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    My Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {myTasks.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No tasks assigned</p>
                    ) : (
                      myTasks.map((task) => (
                        <div key={task._id} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{task.title}</h4>
                              <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                            </div>
                            <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}>
                              {task.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              Due: {formatSafeDate(task.dueDate, 'MMM d')}
                            </span>
                            <Select
                              value={task.status}
                              onValueChange={(value) => handleTaskStatusUpdate(task._id, value)}
                            >
                              <SelectTrigger className="w-28 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Case Manager Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Case Manager Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {caseManagerTasks.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No tasks for case manager</p>
                    ) : (
                      caseManagerTasks.map((task) => (
                        <div key={task._id} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{task.title}</h4>
                              <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                            </div>
                            <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                              {task.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500">
                            Due: {formatSafeDate(task.dueDate, 'MMM d')}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      asChild
                    >
                      <Link href={`/provider/referrals/${referralId}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Full Details
                      </Link>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => window.print()}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Print Summary
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      asChild
                    >
                      <Link href="/provider/referrals">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Referrals
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 