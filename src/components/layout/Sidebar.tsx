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
  MessageSquare,
  Settings,
  LogOut,
  X,
  Menu,
  UserCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

// Types
type NavItem = {
  title: string
  href: string
  icon: React.ReactNode
  role: 'case_manager' | 'provider' | 'both'
}

// Navigation items configuration
const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/case-manager',
    icon: <LayoutDashboard className="h-5 w-5" />,
    role: 'both'
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
    role: 'both'
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
    title: 'Messages',
    href: '/case-manager/messages',
    icon: <MessageSquare className="h-5 w-5" />,
    role: 'both'
  },
  {
    title: 'Settings',
    href: '/case-manager/settings',
    icon: <Settings className="h-5 w-5" />,
    role: 'both'
  }
]

export function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const isSmallScreen = useMediaQuery('(max-width: 1024px)')
  const { user, signOut } = useAuth()

  // Get user role from auth context
  const userRole = user?.user_metadata?.role || 'case_manager'

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(
    item => item.role === 'both' || item.role === userRole
  )

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
          "bg-white border-r border-gray-200 fixed h-full z-20 top-0 transition-all duration-300 ease-in-out",
          isSmallScreen ? (
            isMobileMenuOpen ? "left-0 w-64" : "-left-64 w-64"
          ) : (
            sidebarOpen ? "left-0 w-64" : "left-0 w-16"
          )
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="h-16 border-b flex items-center justify-between px-4">
            <div className="w-full">
              <Link 
                href="/" 
                className="flex items-center justify-center w-full relative h-8 overflow-hidden no-underline hover:no-underline focus:no-underline active:no-underline"
                style={{ textDecoration: 'none' }}
              >
                <div className={cn(
                  "absolute inset-0 flex items-center transition-transform duration-300 ease-in-out",
                  !sidebarOpen && !isSmallScreen ? "translate-x-[-100%]" : "translate-x-0"
                )}>
                  <Logo className="h-8 w-auto" />
                </div>
                <div className={cn(
                  "absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-in-out",
                  !sidebarOpen && !isSmallScreen ? "translate-x-0" : "translate-x-[100%]"
                )}>
                  <span className="text-2xl font-bold text-primary-600">R</span>
                </div>
              </Link>
            </div>
            {isSmallScreen && (
              <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="ml-2">
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center py-2 px-3 text-gray-700 rounded-md transition-colors group relative no-underline",
                  "hover:bg-gray-100 hover:text-primary-600 hover:border-b hover:border-primary-600",
                  pathname === item.href && "bg-referra-50 text-referra-700",
                  !sidebarOpen && !isSmallScreen && "justify-center px-2"
                )}
              >
                <div className="flex items-center">
                  {item.icon}
                  <span className={cn(
                    "ml-3 transition-all duration-300",
                    !sidebarOpen && !isSmallScreen && "hidden"
                  )}>
                    {item.title}
                  </span>
                </div>
                {(!sidebarOpen && !isSmallScreen) && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity invisible group-hover:visible whitespace-nowrap">
                    {item.title}
                  </div>
                )}
              </Link>
            ))}
          </nav>

          {/* User Profile Section */}
          <div className="p-4 border-t">
            <div className={cn(
              "flex items-center",
              sidebarOpen || isSmallScreen ? "space-x-3" : "justify-center"
            )}>
              <div className="relative group">
                <Avatar>
                  <AvatarImage src="/avatars/user.png" />
                  <AvatarFallback className="bg-referra-100 text-referra-700">
                    {userRole === 'provider' ? 'P' : 'CM'}
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
                      {userRole === 'provider' ? 'Service Provider' : 'Case Management'}
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
            sidebarOpen ? "left-60" : "left-[3.25rem]"
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