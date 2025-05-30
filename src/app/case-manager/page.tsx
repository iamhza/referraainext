'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  PlusCircle, 
  Clock, 
  ArrowRight,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock4,
  User,
  Calendar,
  Star,
  TrendingUp,
  Activity,
  Users,
  Search,
  UserPlus,
  ClipboardList,
  Bell,
  FileText,
  BarChart3,
  ArrowUpRight,
  CalendarClock,
  ListTodo,
  Shield,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { RecentReferrals } from '@/components/dashboard/RecentReferrals';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { format, isToday, isPast, addDays, isTomorrow } from 'date-fns';
import { Separator } from '@/components/ui/separator';

export default function CaseManagerDashboard() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [progressValue, setProgressValue] = useState(0);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  
  // Overview stats for the current period
  const overviewStats = {
    activeReferrals: 23,
    pendingMatches: 5,
    completedThisMonth: 12,
    averageMatchTime: '2.3 days'
  };

  // Priority tasks for today
  const priorityTasks = [
    { 
      id: 1, 
      client: 'Hamza Suleman', 
      service: 'Adult day services (ADS)', 
      priority: 'Medium',
      status: 'Under Review',
      action: 'Provider selection needed',
      dueDate: new Date(),
      clientId: 'client-001'
    },
    { 
      id: 2, 
      client: 'Iqra Hassan', 
      service: 'Certified community behavioral health clinic (CCBHC)', 
      priority: 'Medium',
      status: 'Under Review',
      action: 'Insurance verification needed',
      dueDate: new Date(),
      clientId: 'client-002'
    },
    { 
      id: 3, 
      client: 'Marcus Johnson', 
      service: 'Housing assistance', 
      priority: 'High',
      status: 'Pending',
      action: 'Documentation review needed',
      dueDate: addDays(new Date(), 1),
      clientId: 'client-003'
    }
  ];

  // Recent clients
  const recentClients = [
    {
      id: 'client-001',
      name: 'Hamza Suleman',
      avatar: null,
      status: 'Active',
      referralsCount: 2,
      lastContact: new Date()
    },
    {
      id: 'client-002',
      name: 'Iqra Hassan',
      avatar: null,
      status: 'Active',
      referralsCount: 3,
      lastContact: addDays(new Date(), -1)
    },
    {
      id: 'client-003',
      name: 'Marcus Johnson',
      avatar: null,
      status: 'New',
      referralsCount: 1,
      lastContact: addDays(new Date(), -2)
    },
    {
      id: 'client-004',
      name: 'Sarah Chen',
      avatar: null,
      status: 'Active',
      referralsCount: 2,
      lastContact: addDays(new Date(), -3)
    }
  ];

  // Upcoming events
  const upcomingEvents = [
    {
      id: 'event-1',
      title: 'Team Huddle',
      time: '9:30 AM',
      date: new Date(),
      type: 'meeting'
    },
    {
      id: 'event-2',
      title: 'Follow-up with Hamza',
      time: '11:00 AM',
      date: addDays(new Date(), 1),
      type: 'client',
      clientId: 'client-001'
    },
    {
      id: 'event-3',
      title: 'Provider Monthly Check-in',
      time: '2:30 PM',
      date: addDays(new Date(), 2),
      type: 'provider'
    }
  ];

  // Impact metrics
  const impactMetrics = {
    clientsHelped: 143,
    successfulMatches: 89,
    averageSatisfaction: 4.7
  };

  useEffect(() => {
    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
    
    // Animate progress bar
    const timer = setTimeout(() => setProgressValue(76), 500);
    return () => clearTimeout(timer);
  }, []);

  // Function to get initials from a name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase();
  };

  // Function to format date for display
  const formatEventDate = (date: Date): string => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

  // Function to style task priority
  const getTaskPriorityStyles = (priority: string): string => {
    switch (priority) {
      case 'High':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Low':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Main layout render
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50/20">
      <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Top navigation area with search */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-blue-600 font-medium text-sm">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
            <h1 className="text-3xl font-bold text-gray-900 mt-1 flex items-center gap-2">
              {greeting}, {user?.user_metadata?.name?.split(' ')[0] || 'there'} 
              <span className="text-2xl">👋</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={cn(
              "relative transition-all duration-300 flex items-center",
              isSearchExpanded ? "w-64" : "w-9"
            )}>
              <Input 
                placeholder="Search clients, referrals..." 
                className={cn(
                  "pr-9 border-blue-100 focus:border-blue-300 transition-all duration-300",
                  isSearchExpanded ? "w-full opacity-100" : "w-0 opacity-0 p-0"
                )}
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 absolute right-0 text-gray-500 hover:text-blue-600"
                onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            <EnhancedButton
              variant="gradient" 
              size="sm"
              className="shadow-sm gap-1 px-4"
              asChild
            >
              <Link href="/case-manager/new-referral">
                <PlusCircle className="h-4 w-4" />
                New Referral
              </Link>
            </EnhancedButton>
          </div>
        </div>

        {/* Dashboard grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main content area (3 columns) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Impact and quick actions area */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Impact card */}
              <Card className="sm:col-span-2 border-blue-100 hover:border-blue-200 transition-all hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-blue-600 mb-1 flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5" />
                        Your Impact
                      </h3>
                      <p className="text-2xl font-bold text-gray-900">
                        {impactMetrics.clientsHelped} clients helped
                      </p>
                      <div className="mt-2 flex items-center gap-1">
                        <Progress value={progressValue} className="h-2 w-36" />
                        <span className="text-xs text-blue-600 font-medium">{progressValue}% to goal</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-600">{impactMetrics.successfulMatches}</div>
                        <div className="text-xs text-gray-500">Matches</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-xl font-bold text-gray-900">{impactMetrics.averageSatisfaction}</span>
                        </div>
                        <div className="text-xs text-gray-500">Rating</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Quick stats cards */}
              <Card className="border-blue-100 hover:border-blue-200 transition-all hover:shadow-md bg-gradient-to-br from-blue-50 to-white">
                <CardContent className="p-4">
                  <div className="flex flex-col h-full justify-between">
                    <h3 className="text-sm font-medium text-blue-600 mb-1 flex items-center gap-1.5">
                      <ListTodo className="h-3.5 w-3.5" />
                      Active Referrals
                    </h3>
                    <div className="mt-1">
                      <p className="text-2xl font-bold text-gray-900">{overviewStats.activeReferrals}</p>
                      <Button variant="ghost" size="sm" className="px-0 h-7 text-blue-600 hover:text-blue-700 hover:bg-transparent" asChild>
                        <Link href="/case-manager/referrals?status=active">
                          <span className="text-xs">View all</span>
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-amber-100 hover:border-amber-200 transition-all hover:shadow-md bg-gradient-to-br from-amber-50 to-white">
                <CardContent className="p-4">
                  <div className="flex flex-col h-full justify-between">
                    <h3 className="text-sm font-medium text-amber-600 mb-1 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Pending Matches
                    </h3>
                    <div className="mt-1">
                      <p className="text-2xl font-bold text-gray-900">{overviewStats.pendingMatches}</p>
                      <Button variant="ghost" size="sm" className="px-0 h-7 text-amber-600 hover:text-amber-700 hover:bg-transparent" asChild>
                        <Link href="/case-manager/referrals?status=pending">
                          <span className="text-xs">Match now</span>
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for main dashboard content */}
            <Tabs defaultValue="tasks" className="space-y-6">
              <div className="flex items-center justify-between">
                <TabsList className="bg-white border border-gray-200 p-1">
                  <TabsTrigger value="tasks" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                    <ListTodo className="h-4 w-4 mr-2" />
                    Tasks & Priorities
                  </TabsTrigger>
                  <TabsTrigger value="referrals" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Recent Referrals
                  </TabsTrigger>
                  <TabsTrigger value="clients" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                    <Users className="h-4 w-4 mr-2" />
                    Recent Clients
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex gap-3">
                  <Button size="sm" variant="outline" className="text-sm gap-1" asChild>
                    <Link href="/case-manager/clients/new">
                      <UserPlus className="h-3.5 w-3.5" />
                      Add Client
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Tasks & Priorities Tab Content */}
              <TabsContent value="tasks" className="m-0">
                <Card className="border-gray-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold flex items-center gap-1.5">
                        Priority Tasks
                        <Badge className="ml-2 bg-amber-100 text-amber-800 border-amber-200 font-normal">
                          {priorityTasks.length} tasks
                        </Badge>
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="text-blue-600 gap-1 hover:bg-blue-50" asChild>
                        <Link href="/case-manager/tasks">
                          <span className="text-sm">View all tasks</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                    <CardDescription>
                      Tasks that need your attention, sorted by priority and due date
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {priorityTasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="rounded-full bg-green-50 p-3 mb-3">
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        </div>
                        <h3 className="text-base font-medium text-gray-900">All caught up!</h3>
                        <p className="text-sm text-gray-500 max-w-sm mt-1">
                          You've completed all your priority tasks. Great job!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {priorityTasks.map((task) => (
                          <div key={task.id} className="group rounded-lg border border-gray-100 bg-white p-4 hover:border-blue-200 hover:shadow-sm transition-all">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                                      {getInitials(task.client)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                      {task.client}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                      {task.service}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 mt-2 ml-10">
                                  <Badge variant="outline" className={cn("text-xs py-0.5", getTaskPriorityStyles(task.priority))}>
                                    {task.priority} Priority
                                  </Badge>
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs py-0.5">
                                    {task.status}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-blue-600">{task.action}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Due: {isToday(task.dueDate) ? 'Today' : format(task.dueDate, 'MMM d')}
                                </div>
                                <Button variant="outline" size="sm" className="mt-2 text-xs" asChild>
                                  <Link href={`/case-manager/clients/${task.clientId}`}>
                                    Take Action
                                    <ChevronRight className="ml-1 h-3.5 w-3.5" />
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Recent Referrals Tab Content */}
              <TabsContent value="referrals" className="m-0">
                <RecentReferrals />
              </TabsContent>

              {/* Recent Clients Tab Content */}
              <TabsContent value="clients" className="m-0">
                <Card className="border-gray-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold">Recent Clients</CardTitle>
                      <Button variant="ghost" size="sm" className="text-blue-600 gap-1 hover:bg-blue-50" asChild>
                        <Link href="/case-manager/clients">
                          <span className="text-sm">View all clients</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                    <CardDescription>
                      Clients you've recently interacted with or created
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentClients.map((client) => (
                        <div key={client.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-blue-100 text-blue-700">
                                {getInitials(client.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium text-gray-900">{client.name}</h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge className={
                                  client.status === 'Active' 
                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }>
                                  {client.status}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {client.referralsCount} {client.referralsCount === 1 ? 'referral' : 'referrals'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="text-xs rounded-lg" asChild>
                              <Link href={`/case-manager/clients/${client.id}`}>
                                View Profile
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" className="text-xs rounded-lg" asChild>
                              <Link href={`/case-manager/new-referral?clientId=${client.id}`}>
                                New Referral
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Completed this month section with visualization */}
            <Card className="border-green-100 hover:border-green-200 transition-all hover:shadow-md bg-gradient-to-br from-green-50/70 to-white">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-1.5">
                    <CheckCircle className="h-4.5 w-4.5 text-green-600" />
                    Completed Referrals
                  </CardTitle>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    {overviewStats.completedThisMonth} this month
                  </Badge>
                </div>
                <CardDescription>
                  Track your successful referral completions and impact
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mt-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-green-500"></div>
                      <div className="text-sm">
                        <span className="font-medium">Completed</span>
                        <span className="text-gray-500 ml-2">{overviewStats.completedThisMonth}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-blue-500"></div>
                      <div className="text-sm">
                        <span className="font-medium">In Progress</span>
                        <span className="text-gray-500 ml-2">{overviewStats.activeReferrals}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-amber-500"></div>
                      <div className="text-sm">
                        <span className="font-medium">Pending</span>
                        <span className="text-gray-500 ml-2">{overviewStats.pendingMatches}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative h-24 w-24">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900">{overviewStats.completedThisMonth}</div>
                        <div className="text-xs text-gray-500">Completed</div>
                      </div>
                    </div>
                    <svg viewBox="0 0 100 100" className="h-full w-full rotate-[-90deg]">
                      <circle 
                        cx="50" cy="50" r="40" 
                        stroke="#e2e8f0" 
                        strokeWidth="10" 
                        fill="none" 
                      />
                      <circle 
                        cx="50" cy="50" r="40" 
                        stroke="#22c55e" 
                        strokeWidth="10" 
                        fill="none" 
                        strokeDasharray="251.2" 
                        strokeDashoffset={251.2 - (251.2 * overviewStats.completedThisMonth / (overviewStats.activeReferrals + overviewStats.pendingMatches + overviewStats.completedThisMonth))}
                      />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar (1 column) */}
          <div className="space-y-6">
            {/* Today's Schedule */}
            <Card className="border-blue-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-1.5">
                  <CalendarClock className="h-4.5 w-4.5 text-blue-600" />
                  Upcoming Schedule
                </CardTitle>
                <CardDescription>
                  Your upcoming meetings and follow-ups
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-6">
                    <Calendar className="h-10 w-10 text-blue-300 mx-auto mb-2" />
                    <h3 className="text-sm font-medium text-gray-700">No upcoming events</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Your calendar is clear for now
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingEvents.map((event, index) => (
                      <div key={event.id}>
                        {(index === 0 || formatEventDate(event.date) !== formatEventDate(upcomingEvents[index-1].date)) && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className={cn(
                              "text-xs font-medium px-2 py-0.5 rounded-full",
                              isToday(event.date) ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                            )}>
                              {formatEventDate(event.date)}
                            </div>
                            {isToday(event.date) && <div className="text-xs text-gray-500">Today</div>}
                          </div>
                        )}
                        
                        <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-white",
                            event.type === 'meeting' ? "bg-blue-500" : 
                            event.type === 'client' ? "bg-green-500" : 
                            "bg-purple-500"
                          )}>
                            {event.type === 'meeting' ? <Users className="h-4 w-4" /> : 
                             event.type === 'client' ? <User className="h-4 w-4" /> : 
                             <Shield className="h-4 w-4" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">{event.title}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">{event.time}</p>
                          </div>
                          
                          {event.type === 'client' && (
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                              <Link href={`/case-manager/clients/${event.clientId}`}>
                                <ArrowUpRight className="h-3.5 w-3.5 text-gray-500" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0 pb-3">
                <Button variant="outline" size="sm" className="w-full text-blue-600 gap-1 text-sm" asChild>
                  <Link href="/case-manager/calendar">
                    <Calendar className="h-3.5 w-3.5" />
                    View Calendar
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Quick Actions */}
            <Card className="border-blue-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <Button variant="outline" className="w-full justify-start text-sm" asChild>
                  <Link href="/case-manager/clients">
                    <Users className="h-4 w-4 mr-2 text-blue-600" />
                    Manage Clients
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm" asChild>
                  <Link href="/case-manager/referrals">
                    <ClipboardList className="h-4 w-4 mr-2 text-blue-600" />
                    All Referrals
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm" asChild>
                  <Link href="/case-manager/providers">
                    <Shield className="h-4 w-4 mr-2 text-green-600" />
                    Provider Directory
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm" asChild>
                  <Link href="/case-manager/messages">
                    <MessageSquare className="h-4 w-4 mr-2 text-purple-600" />
                    Messages
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm" asChild>
                  <Link href="/case-manager/reports">
                    <BarChart3 className="h-4 w-4 mr-2 text-amber-600" />
                    Reports & Analytics
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm" asChild>
                  <Link href="/resources">
                    <FileText className="h-4 w-4 mr-2 text-gray-600" />
                    Resources & Guides
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            {/* Recent Activity Feed (Simplified) */}
            <Card className="border-blue-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-1.5">
                  <Activity className="h-4.5 w-4.5 text-blue-600" />
                  Activity Feed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[220px] pr-4">
                  <div className="space-y-4 relative">
                    <div className="absolute left-[7px] top-0 bottom-0 w-[2px] bg-gray-100"></div>
                    
                    <div className="relative pl-6">
                      <div className="absolute left-0 top-1 h-3 w-3 rounded-full bg-green-500 z-10"></div>
                      <div className="text-sm">
                        <p className="text-gray-900 font-medium">Referral completed</p>
                        <p className="text-gray-600 text-xs">Marcus Johnson's housing referral was completed</p>
                        <p className="text-gray-400 text-xs mt-1">10 minutes ago</p>
                      </div>
                    </div>
                    
                    <div className="relative pl-6">
                      <div className="absolute left-0 top-1 h-3 w-3 rounded-full bg-blue-500 z-10"></div>
                      <div className="text-sm">
                        <p className="text-gray-900 font-medium">New client added</p>
                        <p className="text-gray-600 text-xs">You added Sarah Chen as a new client</p>
                        <p className="text-gray-400 text-xs mt-1">1 hour ago</p>
                      </div>
                    </div>
                    
                    <div className="relative pl-6">
                      <div className="absolute left-0 top-1 h-3 w-3 rounded-full bg-amber-500 z-10"></div>
                      <div className="text-sm">
                        <p className="text-gray-900 font-medium">Referral status update</p>
                        <p className="text-gray-600 text-xs">Iqra Hassan's CCBHC referral needs insurance verification</p>
                        <p className="text-gray-400 text-xs mt-1">3 hours ago</p>
                      </div>
                    </div>
                    
                    <div className="relative pl-6">
                      <div className="absolute left-0 top-1 h-3 w-3 rounded-full bg-purple-500 z-10"></div>
                      <div className="text-sm">
                        <p className="text-gray-900 font-medium">Message received</p>
                        <p className="text-gray-600 text-xs">New message from Wellness Center regarding Sofia's referral</p>
                        <p className="text-gray-400 text-xs mt-1">Yesterday</p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 