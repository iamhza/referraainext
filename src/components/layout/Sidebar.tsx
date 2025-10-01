'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'
import {
  LayoutDashboard,
  LayoutGrid,
  ClipboardList,
  FileText,
  Users,
  Settings,
  LogOut,
  X,
  Menu,
  UserCheck,
  Building,
  Shield,
  Activity,
  BarChart3,
  Database,
  Send,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  MessageSquare,
  Globe,
  Bell,
  Home,
  CheckSquare,
  Inbox,
  BarChart,
  Folder,
  UserPlus
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

// Navigation items for case managers (relevant to your app)
const caseManagerNavItems = [
  {
    name: "Home",
    href: "/case-manager",
    icon: Home,
    section: null
  },
  {
    name: "My Tasks",
    href: "/case-manager/tasks",
    icon: CheckSquare,
    section: null
  },
  {
    name: "Workspace",
    href: "/case-manager/workspace",
    icon: Send,
    section: null
  },
  {
    name: "Clients",
    href: "/case-manager/clients", 
    icon: Users,
    section: "REFERRALS"
  },
  {
    name: "Referrals",
    href: "/case-manager/referrals",
    icon: FileText,
    section: "REFERRALS"
  },
  {
    name: "Analytics",
    href: "/case-manager/analytics",
    icon: BarChart,
    section: "INSIGHTS"
  },
  {
    name: "Settings",
    href: "/case-manager/settings",
    icon: Settings,
    section: "MANAGEMENT"
  }
]

// Navigation items for providers
const providerNavItems = [
  {
    name: "Dashboard",
    href: "/provider",
    icon: LayoutGrid,
    section: null
  },
  {
    name: "My Clients",
    href: "/provider/clients",
    icon: Users,
    section: null
  },
  {
    name: "Referrals",
    href: "/provider/referrals",
    icon: FileText,
    section: null
  },
  {
    name: "Network",
    href: "/provider/network",
    icon: Globe,
    section: null
  },
  {
    name: "Notifications",
    href: "/provider/notifications",
    icon: Bell,
    section: null
  },
  {
    name: "Settings",
    href: "/provider/settings",
    icon: Settings,
    section: "MANAGEMENT"
  }
]

// Navigation items for supervisors
const supervisorNavItems = [
  {
    name: "Dashboard",
    href: "/supervisor",
    icon: Home,
    section: null
  },
  {
    name: "Team Members",
    href: "/supervisor/team",
    icon: Users,
    section: "TEAM"
  },
  {
    name: "Client Management",
    href: "/supervisor/clients",
    icon: UserCheck,
    section: "TEAM"
  },
  {
    name: "Invite Case Managers",
    href: "/supervisor/invite",
    icon: UserPlus,
    section: "TEAM"
  },
  {
    name: "Client Assignments",
    href: "/supervisor/assignments",
    icon: ClipboardList,
    section: "TEAM"
  },
  {
    name: "Team Analytics",
    href: "/supervisor/analytics",
    icon: BarChart3,
    section: "INSIGHTS"
  },
  {
    name: "Settings",
    href: "/supervisor/settings",
    icon: Settings,
    section: "MANAGEMENT"
  }
]

// Navigation items for org admins
const orgAdminNavItems = [
  {
    name: "Dashboard",
    href: "/org-admin",
    icon: Home,
    section: null
  },
  {
    name: "Clients",
    href: "/org-admin/clients",
    icon: UserCheck,
    section: "ORGANIZATION"
  },
  {
    name: "Users",
    href: "/org-admin/users",
    icon: Users,
    section: "ORGANIZATION"
  },
  {
    name: "Teams",
    href: "/org-admin/teams",
    icon: Building,
    section: "ORGANIZATION"
  },
  {
    name: "Invitations",
    href: "/org-admin/invitations",
    icon: UserPlus,
    section: "ORGANIZATION"
  },
  {
    name: "Analytics",
    href: "/org-admin/analytics",
    icon: BarChart3,
    section: "INSIGHTS"
  },
  {
    name: "Settings",
    href: "/org-admin/settings",
    icon: Settings,
    section: "MANAGEMENT"
  },
  {
    name: "Audit Logs",
    href: "/org-admin/audit",
    icon: Shield,
    section: "MANAGEMENT"
  }
]

// Navigation items for admins
const adminNavItems = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutGrid,
    section: null
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
    section: null
  },
  {
    name: "Referrals",
    href: "/admin/referrals",
    icon: FileText,
    section: null
  },
  {
    name: "Providers",
    href: "/admin/providers",
    icon: Building,
    section: null
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    section: null
  },
  {
    name: "Activity",
    href: "/admin/activity",
    icon: Activity,
    section: null
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
    section: "MANAGEMENT"
  }
]

interface SidebarProps {
  className?: string;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

export function Sidebar({ className, isMobileOpen: externalIsMobileOpen, setIsMobileOpen: externalSetIsMobileOpen }: SidebarProps) {
  const [internalIsMobileOpen, setInternalIsMobileOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const isMobileOpen = externalIsMobileOpen !== undefined ? externalIsMobileOpen : internalIsMobileOpen;
  const setIsMobileOpen = externalSetIsMobileOpen || setInternalIsMobileOpen;
  const pathname = usePathname()
  const router = useRouter()
  const { theme } = useTheme()
  const { user, signOut } = useAuth()

  // Get user role from user metadata
  const userRole = user?.user_metadata?.role || 'case_manager'
  
  // Select navigation items based on user role
  const navItems = userRole === 'admin' || userRole === 'platform_admin' 
    ? adminNavItems 
    : userRole === 'supervisor'
    ? supervisorNavItems
    : userRole === 'org_admin'
    ? orgAdminNavItems
    : userRole === 'provider' 
    ? providerNavItems 
    : caseManagerNavItems

  // Group navigation items by section
  const groupedNavItems = navItems.reduce((acc, item) => {
    const section = item.section || 'default'
    if (!acc[section]) {
      acc[section] = []
    }
    acc[section].push(item)
    return acc
  }, {} as Record<string, typeof navItems>)

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-56 backdrop-blur-sm border-r transform transition-all duration-300 ease-in-out lg:translate-x-0",
        theme === 'dark' 
          ? "bg-[#2E2E30] border-gray-600/30" 
          : "bg-[#F7F7F7] border-gray-200/30",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        className
      )}>
        <div className="flex flex-col h-full">
          {/* Top section - just padding for alignment */}
          <div className="h-12"></div>

          {/* Navigation */}
          <nav id="sidebar-nav" className="flex-1 px-3 py-6 space-y-6 overflow-y-auto">
            {Object.entries(groupedNavItems).map(([section, items]) => (
              <div key={section}>
                {section !== 'default' && (
                  <h3 className={cn(
                    "px-3 text-xs font-semibold uppercase tracking-wider mb-3",
                    theme === 'dark' 
                      ? "text-gray-400" 
                      : "text-gray-500"
                  )}>
                    {section}
                  </h3>
                )}
                <div className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "group flex items-center px-3 py-2 text-sm transition-colors",
                          theme === 'dark'
                            ? isActive
                              ? "bg-[#3C3C3C] text-white rounded-md font-medium"
                              : "text-gray-300 hover:bg-[#3C3C3C] hover:text-white rounded-md font-medium"
                            : isActive
                              ? "bg-gray-100 text-gray-900 rounded-md font-medium"
                              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md font-medium"
                        )}
                        onClick={() => setIsMobileOpen(false)}
                      >
                        <Icon
                          className={cn(
                            "mr-2.5 h-4 w-4 flex-shrink-0",
                            theme === 'dark'
                              ? isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                              : isActive ? "text-gray-700" : "text-gray-500 group-hover:text-gray-700"
                          )}
                        />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileOpen(true)}
          className="bg-white shadow-md"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>
    </>
  )
}