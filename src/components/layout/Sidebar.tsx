'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Logo } from '@/components/ui/Logo'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Users,
  Settings,
  LogOut,
  X,
  Menu,
  UserCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// Types
type NavItem = {
  title: string
  href: string
  icon: React.ReactNode
  role: 'case_manager' | 'provider' | 'admin' | 'both'
}

// Navigation items configuration
const navItems: NavItem[] = [
  // Admin nav
  {
    title: 'Admin Dashboard',
    href: '/admin',
    icon: <LayoutDashboard className="h-5 w-5" />, 
    role: 'admin'
  },
  {
    title: 'User Management',
    href: '/admin/users',
    icon: <Users className="h-5 w-5" />, 
    role: 'admin'
  },
  {
    title: 'Provider Management',
    href: '/admin/providers',
    icon: <UserCheck className="h-5 w-5" />, 
    role: 'admin'
  },
  {
    title: 'Referrals',
    href: '/admin/referrals',
    icon: <ClipboardList className="h-5 w-5" />, 
    role: 'admin'
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: <Settings className="h-5 w-5" />, 
    role: 'admin'
  },

  // Provider nav
  {
    title: 'Provider Dashboard',
    href: '/provider',
    icon: <LayoutDashboard className="h-5 w-5" />, 
    role: 'provider'
  },
  {
    title: 'My Referrals',
    href: '/provider/referrals',
    icon: <ClipboardList className="h-5 w-5" />, 
    role: 'provider'
  },
  {
    title: 'Profile',
    href: '/provider/profile',
    icon: <Users className="h-5 w-5" />, 
    role: 'provider'
  },
  {
    title: 'Settings',
    href: '/provider/settings',
    icon: <Settings className="h-5 w-5" />, 
    role: 'provider'
  },

  // Case Manager nav (existing)
  {
    title: 'Dashboard',
    href: '/case-manager',
    icon: <LayoutDashboard className="h-5 w-5" />, 
    role: 'case_manager'
  },
  {
    title: 'Clients',
    href: '/case-manager/clients',
    icon: <Users className="h-5 w-5" />, 
    role: 'case_manager'
  },
  {
    title: 'Referrals',
    href: '/case-manager/referrals',
    icon: <ClipboardList className="h-5 w-5" />, 
    role: 'case_manager'
  },
  {
    title: 'New Referral',
    href: '/case-manager/new-referral',
    icon: <FileText className="h-5 w-5" />, 
    role: 'case_manager'
  },
  {
    title: 'Matched Providers',
    href: '/case-manager/matched-providers',
    icon: <UserCheck className="h-5 w-5" />, 
    role: 'case_manager'
  },
  {
    title: 'Settings',
    href: '/case-manager/settings',
    icon: <Settings className="h-5 w-5" />, 
    role: 'case_manager'
  },
]

export function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const isSmallScreen = useMediaQuery('(max-width: 1024px)')
  const { user, signOut } = useAuth()

  // Get user role from auth context
  const userRole = user?.user_metadata?.role || 'case_manager'
  // TEMP DEBUG: Log the detected user role
  useEffect(() => {
    console.log('[Sidebar] Detected userRole:', userRole);
  }, [userRole]);

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(
    item => item.role === userRole
  )

  // Group nav items by section
  const navSections = [
    {
      label: 'Main',
      items: filteredNavItems.filter(item => item.title.toLowerCase().includes('dashboard')),
    },
    {
      label: 'Clients & Providers',
      items: filteredNavItems.filter(item =>
        item.title.toLowerCase().includes('client') ||
        item.title.toLowerCase().includes('provider')
      ),
    },
    {
      label: 'Referrals',
      items: filteredNavItems.filter(item => item.title.toLowerCase().includes('referral')),
    },
    {
      label: 'Profile & Settings',
      items: filteredNavItems.filter(item => item.title.toLowerCase().includes('profile') || item.title.toLowerCase().includes('settings')),
    },
  ];

  // Toggle sidebar for desktop
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Close mobile menu on larger screens
  useEffect(() => {
    if (!isSmallScreen) {
      setIsMobileMenuOpen(false)
    }
  }, [isSmallScreen])

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed h-full z-20 top-0 left-0 transition-all duration-300 ease-in-out",
          "backdrop-blur-xl bg-white/80 bg-gradient-to-br from-white/80 to-blue-50/60 shadow-xl",
          isSmallScreen ? (
            isMobileMenuOpen ? "w-64" : "-left-64 w-64"
          ) : (
            sidebarOpen ? "w-64" : "w-20"
          )
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="h-16 border-b-0 flex items-center justify-between px-4">
            <div className="w-full flex items-center gap-2">
              <Link 
                href="/" 
                className="flex items-center justify-center w-full relative h-8 overflow-hidden no-underline hover:no-underline focus:no-underline active:no-underline"
                style={{ textDecoration: 'none' }}
              >
                <Logo className="h-8 w-auto animate-fade-in" />
              </Link>
            </div>
            {isSmallScreen && (
              <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="ml-2">
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Navigation Sections */}
          <nav className="flex-1 px-2 py-4 space-y-4 overflow-y-auto">
            {navSections.map(section => (
              section.items.length > 0 && (
                <div key={section.label}>
                  <div className={cn("text-xs font-semibold uppercase tracking-wider text-gray-400 px-3 mb-2", !sidebarOpen && "hidden")}>{section.label}</div>
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href || (item.href === '/provider' && pathname?.startsWith('/provider')) || (item.href === '/admin' && pathname?.startsWith('/admin')) || (item.href === '/case-manager' && pathname?.startsWith('/case-manager'));
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 py-2 px-3 rounded-lg transition-all group relative font-medium",
                              isActive ? "bg-primary/10 text-primary-700" : "text-gray-700 hover:bg-primary/5 hover:text-primary-600",
                              sidebarOpen ? "" : "justify-center px-2"
                            )}
                          >
                            {/* Active pill indicator */}
                            {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-2 bg-primary-500 rounded-full shadow-md transition-all" />}
                            <span className="z-10">{item.icon}</span>
                            <span className={cn("ml-2 z-10 transition-all duration-300", !sidebarOpen && "hidden")}>{item.title}</span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            ))}
          </nav>

          {/* User Profile Section */}
          <div className="p-4 border-t-0 mt-auto">
            <div className={cn(
              "flex items-center gap-3",
              sidebarOpen || isSmallScreen ? "" : "justify-center"
            )}>
              <div className="relative group">
                <Avatar>
                  <AvatarImage src="/avatars/user.png" />
                  <AvatarFallback className="bg-referra-100 text-referra-700">
                    {userRole === 'admin' ? 'A' : userRole === 'provider' ? 'P' : 'CM'}
                  </AvatarFallback>
                </Avatar>
                {(!sidebarOpen && !isSmallScreen) && (
                  <div className="absolute left-full bottom-0 ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity invisible group-hover:visible whitespace-nowrap">
                    {user?.email || 'Case Manager'}
                  </div>
                )}
              </div>
              {(sidebarOpen || isSmallScreen) && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.email || 'Case Manager'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {userRole === 'provider' ? 'Service Provider' : userRole === 'admin' ? 'Admin' : 'Case Management'}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={signOut}>
                    <LogOut className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Desktop Sidebar Toggle */}
      {!isSmallScreen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            "fixed top-5 z-30 transition-all duration-300",
            sidebarOpen ? "left-60" : "left-8"
          )}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </Button>
      )}

      {/* Mobile Overlay */}
      {isMobileMenuOpen && isSmallScreen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Mobile Menu Button */}
      {isSmallScreen && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleMobileMenu} 
          className="fixed top-4 left-4 z-30 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
    </>
  )
} 