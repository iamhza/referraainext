'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { EnhancedButton } from '@/components/ui/enhanced-button'
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
  Menu,
  UserCheck,
  Search,
  ChevronDown,
  Home
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Types for navigation items
type NavItem = {
  title: string
  href: string
  icon: React.ReactNode
  role: 'case_manager' | 'provider' | 'admin' | 'both'
}

// Navigation items configuration - simplified for top nav
const navItems: NavItem[] = [
  // Case Manager nav (primary nav items only)
  {
    title: 'Dashboard',
    href: '/case-manager',
    icon: <Home className="h-5 w-5" />, 
    role: 'case_manager'
  },
  {
    title: 'Clients',
    href: '/case-manager/clients',
    icon: <Users className="h-5 w-5" />, 
    role: 'case_manager'
  },
]

// Admin navigation items
const adminNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: <LayoutDashboard className="h-5 w-5" />, 
    role: 'admin'
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: <Users className="h-5 w-5" />, 
    role: 'admin'
  },
  {
    title: 'Providers',
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
  }
];

export function TopNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const isSmallScreen = useMediaQuery('(max-width: 1024px)')
  const { user, signOut } = useAuth()

  // Get user role from auth context
  const userRole = user?.user_metadata?.role || 'case_manager'
  
  // Filter nav items based on user role
  const filteredNavItems = userRole === 'admin'
    ? adminNavItems
    : navItems.filter(item => item.role === userRole);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Determine if nav item is active or parent of active page
  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/case-manager' && pathname === '/case-manager') {
      return true;
    }
    return pathname.startsWith(href) && href !== '/case-manager';
  };

  return (
    <header className="w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-8 md:px-12 lg:px-16 xl:px-24 max-w-screen-2xl">
        {/* Main navigation bar */}
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Logo className="h-10" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center mx-auto">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-center px-5 py-6 text-base font-medium transition-colors border-b-2 mx-1",
                  isActive(item.href)
                    ? "text-blue-600 border-blue-600"
                    : "text-gray-600 border-transparent hover:text-blue-600 hover:border-blue-200"
                )}
              >
                {item.icon}
                <span className="ml-2">{item.title}</span>
              </Link>
            ))}
          </nav>

          {/* Right side - User menu, notifications */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <Button variant="ghost" size="icon" className="hidden md:flex text-gray-600 hover:text-blue-600 hover:bg-blue-50/60">
              <Search className="h-5 w-5" />
            </Button>

            {/* New Referral Button (only for case manager) */}
            {userRole !== 'admin' && (
              <EnhancedButton 
                variant="gradient" 
                size="sm" 
                asChild 
                rounded="full"
                className="hidden sm:flex shadow-md hover:shadow-lg transition-all duration-200">
                <Link href="/case-manager/new-referral">
                  <FileText className="mr-2 h-4 w-4" />
                  New Referral
                </Link>
              </EnhancedButton>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 ml-2 p-0 overflow-hidden border border-gray-200 hover:border-blue-300 transition-colors">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {user?.user_metadata?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                    </AvatarFallback>
                    {user?.user_metadata?.avatar_url && (
                      <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.name || 'User'} />
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2 p-1 border border-gray-100 shadow-lg rounded-xl">
                <DropdownMenuLabel className="px-4 py-3">
                  <div className="font-normal">
                    <div className="font-medium text-base">{user?.user_metadata?.name || 'User'}</div>
                    <div className="text-sm text-gray-500 mt-0.5">{user?.email}</div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-100" />
                <DropdownMenuItem asChild className="px-4 py-2.5 text-base rounded-lg focus:bg-blue-50 focus:text-blue-600">
                  <Link href={userRole === 'admin' ? "/admin/settings" : "/case-manager/settings"}>
                    <Settings className="mr-3 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-100" />
                <DropdownMenuItem onClick={() => signOut()} className="px-4 py-2.5 text-base rounded-lg text-red-600 focus:bg-red-50 focus:text-red-600">
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              className="ml-2 md:hidden text-gray-600 hover:text-blue-600 hover:bg-blue-50/60"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-gray-800/50 backdrop-blur-sm md:hidden" onClick={toggleMobileMenu}>
          <div 
            className="fixed top-0 right-0 w-3/4 max-w-sm h-full bg-white shadow-xl overflow-y-auto rounded-l-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b">
              <div className="flex items-center justify-between">
                <Logo className="h-8" />
                <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="text-gray-500 hover:text-gray-700">
                  <ChevronDown className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="p-5">
              {/* New Referral Button (only for case manager) */}
              {userRole !== 'admin' && (
                <EnhancedButton 
                  variant="gradient" 
                  className="w-full mb-6"
                  rounded="full"
                  size="lg"
                  asChild>
                  <Link href="/case-manager/new-referral">
                    <FileText className="mr-2 h-5 w-5" />
                    New Referral
                  </Link>
                </EnhancedButton>
              )}

              <nav className="space-y-2">
                {filteredNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center px-4 py-3 text-base rounded-xl w-full transition-colors",
                      isActive(item.href)
                        ? "text-blue-600 bg-blue-50 font-medium"
                        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    )}
                  >
                    {item.icon}
                    <span className="ml-3">{item.title}</span>
                  </Link>
                ))}
                
                <Link
                  href="/case-manager/settings"
                  className="flex items-center px-4 py-3 text-base rounded-xl w-full text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="h-5 w-5" />
                  <span className="ml-3">Settings</span>
                </Link>
              </nav>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 border-t p-5 bg-gray-50/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                    {user?.user_metadata?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                  </AvatarFallback>
                  {user?.user_metadata?.avatar_url && (
                    <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.name || 'User'} />
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-gray-900 truncate">
                    {user?.user_metadata?.name || 'User'}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-red-600 hover:bg-red-50" onClick={() => signOut()}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
} 