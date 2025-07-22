'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  UserCheck,
  Building
} from 'lucide-react'

// Navigation items for case managers
const caseManagerNavItems = [
  {
    name: "Dashboard",
    href: "/case-manager",
    icon: LayoutDashboard,
    section: null
  },
  {
    name: "Clients",
    href: "/case-manager/clients", 
    icon: Users,
    section: "REFERRALS"
  },
  {
    name: "New referral",
    href: "/case-manager/new-referral",
    icon: Plus,
    section: "REFERRALS"
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
    icon: LayoutDashboard,
    section: null
  },
  {
    name: "Clients",
    href: "/provider/clients",
    icon: Users,
    section: "REFERRALS"
  },
  {
    name: "Referrals",
    href: "/provider/referrals",
    icon: ClipboardList,
    section: "REFERRALS"
  },
  {
    name: "Profile",
    href: "/provider/profile",
    icon: UserCheck,
    section: "MANAGEMENT"
  },
  {
    name: "Capacity",
    href: "/provider/capacity",
    icon: Building,
    section: "MANAGEMENT"
  },
  {
    name: "Settings",
    href: "/provider/settings",
    icon: Settings,
    section: "MANAGEMENT"
  }
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  // Get user role from user metadata
  const userRole = user?.user_metadata?.role || 'case_manager'
  
  // Select navigation items based on user role
  const navigationItems = userRole === 'provider' ? providerNavItems : caseManagerNavItems

  const userName = userRole === 'provider' 
    ? (user?.user_metadata?.organization || user?.email?.split('@')[0] || 'Provider')
    : (user?.user_metadata?.name ? 
        user.user_metadata.name.split(' ').map((name: string) => 
          name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
        ).join(' ') : (user?.email?.split('@')[0] || 'Case Manager'))

  const groupedNavItems = navigationItems.reduce((acc, item) => {
    const section = item.section || 'default'
    if (!acc[section]) acc[section] = []
    acc[section].push(item)
    return acc
  }, {} as Record<string, typeof navigationItems>)

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        className
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <Link href={userRole === 'provider' ? '/provider' : '/case-manager'} className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <span className="text-xl font-bold text-blue-600">R</span>
              </div>
              <img 
                src="/refrr.png" 
                alt="referra" 
                className="h-6 w-auto"
              />
            </Link>
          </div>

          {/* Navigation */}
          <nav id="sidebar-nav" className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
            {Object.entries(groupedNavItems).map(([section, items]) => (
              <div key={section}>
                {section !== 'default' && (
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {section}
                  </h3>
                )}
                <div className="space-y-1">
                  {items.map((item) => {
                    const isActive = pathname === item.href || 
                      (item.href !== '/case-manager' && pathname?.startsWith(item.href))
                    const Icon = item.icon

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                          isActive
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        )}
                        onClick={() => setIsMobileOpen(false)}
                      >
                        <Icon
                          className={cn(
                            "mr-3 h-5 w-5 flex-shrink-0",
                            isActive ? "text-blue-700" : "text-gray-500 group-hover:text-gray-700"
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

          {/* User section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
                  {user?.user_metadata?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 
                   user?.email?.split('@')[0].slice(0, 2).toUpperCase() || 'CM'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userName}
                </p>
                <p className="text-xs text-gray-500">{userRole === 'provider' ? 'Provider' : 'Case Manager'}</p>
              </div>
            </div>
            <Button
              onClick={signOut}
              variant="ghost"
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors justify-start"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-white shadow-md"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
    </>
  )
} 