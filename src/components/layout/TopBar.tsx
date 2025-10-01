'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search, 
  Settings, 
  LogOut, 
  Users, 
  Bell, 
  Menu, 
  Plus,
  Home,
  CheckSquare,
  Send,
  FileText,
  BarChart,
  Camera,
  Upload,
  ChevronRight
} from 'lucide-react';

interface TopBarProps {
  className?: string;
  onMenuClick?: () => void;
  showNavigation?: boolean;
}

// Navigation items for case managers
const caseManagerNavItems = [
  {
    name: "Home",
    href: "/case-manager",
    icon: Home,
  },
  {
    name: "My Tasks",
    href: "/case-manager/tasks",
    icon: CheckSquare,
  },
  {
    name: "Workspace",
    href: "/case-manager/workspace",
    icon: Send,
  },
  {
    name: "Clients",
    href: "/case-manager/clients", 
    icon: Users,
  },
  {
    name: "Referrals",
    href: "/case-manager/referrals",
    icon: FileText,
  },
  {
    name: "Analytics",
    href: "/case-manager/analytics",
    icon: BarChart,
  },
  {
    name: "Settings",
    href: "/case-manager/settings",
    icon: Settings,
  }
];

export function TopBar({ className, onMenuClick, showNavigation = true }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { theme } = useTheme();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Load avatar URL from user data on mount and when user changes
  useEffect(() => {
    const loadUserAvatar = async () => {
      if (user) {
        // First check user metadata
        let userAvatarUrl = user?.user_metadata?.avatar_url || 
                           user?.avatar_url || 
                           user?.user_metadata?.picture ||
                           null;
        
        // If no avatar in user metadata, try to fetch from database
        if (!userAvatarUrl && user.id) {
          try {
            const response = await fetch(`/api/users/${user.id}`);
            if (response.ok) {
              const data = await response.json();
              userAvatarUrl = data.user?.avatar_url || null;
            }
          } catch (error) {
            console.error('Error fetching user avatar:', error);
          }
        }
        
        setAvatarUrl(userAvatarUrl);
      }
    };

    loadUserAvatar();
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement global search functionality
      console.log('Searching for:', searchQuery);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    
    try {
      // Create FormData for upload
      const formData = new FormData();
      formData.append('avatar', file);
      
      // Upload to MongoDB via API
      const response = await fetch('/api/auth/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setAvatarUrl(data.avatarUrl);
      
      // Optionally refresh user data to ensure persistence
      // This depends on your auth context implementation
      console.log('Avatar uploaded successfully');
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert(`Failed to upload avatar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      // Clear the input so the same file can be selected again if needed
      event.target.value = '';
    }
  };

  const userName = user?.user_metadata?.full_name || 
                   user?.user_metadata?.fullName || 
                   user?.user_metadata?.name || 
                   user?.name ||
                   user?.email?.split('@')[0] || 
                   'User';

  const userRole = user?.user_metadata?.role || 'case_manager';

  return (
    <div className={`relative ${className}`} style={{ 
      zIndex: 60, 
      height: showNavigation ? '80px' : '49px', 
      backgroundColor: theme === 'dark' ? '#2E2E30' : '#F7F7F7',
      borderBottom: theme === 'dark' ? '1px solid #4B5563' : '1px solid #E5E7EB'
    }}>
      {/* Top row - original topbar content */}
      <div className="flex items-center w-full relative h-12 px-6">
        {/* Left side - Create button */}
        <div className="flex items-center space-x-3">
          
          {/* Create Button - Pill shape with proper theming */}
          <button 
            className={cn(
              "inline-flex items-center px-3 py-1.5 text-[12px] font-medium rounded-full transition-all duration-200 hover:scale-105 active:scale-95",
              "border-2 shadow-sm hover:shadow-md",
              theme === 'dark'
                ? "bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:border-gray-500"
                : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400"
            )}
            onClick={() => router.push('/case-manager/new-referral')}
          >
            <div className={cn(
              "w-3.5 h-3.5 rounded-full flex items-center justify-center mr-2",
              theme === 'dark' ? "bg-gray-600" : "bg-gray-200"
            )}>
              <Plus className={cn(
                "h-2 w-2",
                theme === 'dark' ? "text-white" : "text-gray-700"
              )} />
            </div>
            Create
          </button>
        </div>

        {/* Center - Global Search */}
        <div className="flex-1 flex justify-center px-4">
          <form onSubmit={handleSearch} className="relative w-full max-w-sm">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
            <Input
              type="text"
              placeholder="Search clients, referrals, tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 pr-4 w-full rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              style={{ height: '28px', fontSize: '13px' }}
            />
          </form>
        </div>

        {/* Right side - Actions and User Profile */}
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <Button variant="ghost" size="sm" className={`p-2 ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            <Bell className={`h-5 w-5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Settings */}
          <Button 
            variant="ghost" 
            size="sm" 
            className={`p-2 ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            onClick={() => router.push('/case-manager/settings')}
          >
            <Settings className={`h-5 w-5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
          </Button>

          {/* User Profile Card */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-200 cursor-pointer ${
                theme === 'dark' 
                  ? 'border-transparent hover:border-gray-600/40 hover:bg-gray-700/20' 
                  : 'border-transparent hover:border-slate-300/60 hover:bg-slate-50/80'
              }`}>
                <div className="relative group">
                  <Avatar className="h-8 w-8 ring-1 ring-white/20 transition-all duration-200 group-hover:ring-2 group-hover:ring-primary-200/50">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={userName} className="object-cover" />
                    ) : null}
                    <AvatarFallback className={`text-sm font-medium transition-all duration-200 ${
                      theme === 'dark' 
                        ? 'bg-gray-600 text-gray-200 group-hover:bg-gray-500' 
                        : 'bg-secondary-100 text-secondary-700 group-hover:bg-secondary-200'
                    }`}>
                      {user?.user_metadata?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 
                       user?.user_metadata?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 
                       user?.user_metadata?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() ||
                       user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() ||
                       user?.email?.split('@')[0].slice(0, 2).toUpperCase() || 
                       ((userRole === 'admin' || userRole === 'platform_admin') ? 'PA' : userRole === 'provider' ? 'PR' : 'CM')}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Upload overlay */}
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Camera className="w-3 h-3 text-white" />
                  </div>
                  
                  {/* Hidden file input */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
                    disabled={isUploading}
                  />
                  
                  {/* Loading indicator */}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                
                {/* User Info */}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className={`text-sm font-semibold truncate transition-colors duration-200 ${
                    theme === 'dark' 
                      ? 'text-gray-100 group-hover:text-white' 
                      : 'text-slate-900 group-hover:text-slate-800'
                  }`}>
                    {userName}
                  </span>
                  <div className={`text-xs truncate transition-colors duration-200 ${
                    theme === 'dark' 
                      ? 'text-gray-400 group-hover:text-gray-300' 
                      : 'text-slate-500 group-hover:text-slate-600'
                  }`}>
                    <span>
                      {(userRole === 'admin' || userRole === 'platform_admin') 
                        ? 'Administrator' 
                        : userRole === 'provider' 
                        ? 'Provider' 
                        : 'Case Manager'
                      }
                    </span>
                    {user?.organization?.name && (
                      <span className={`ml-1 ${theme === 'dark' ? 'text-blue-400' : 'text-primary-600'}`}>
                        • {user.organization.name}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Dropdown indicator */}
                <ChevronRight className={`w-3 h-3 transition-all duration-200 ${
                  theme === 'dark' 
                    ? 'text-gray-500 group-hover:text-gray-400 group-hover:translate-x-0.5' 
                    : 'text-slate-400 group-hover:text-slate-500 group-hover:translate-x-0.5'
                }`} />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              sideOffset={4}
              alignOffset={0}
              className={`w-64 ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-slate-200'
              } shadow-xl rounded-xl border backdrop-blur-sm`}
              style={{ zIndex: 9999 }}
            >
              <DropdownMenuLabel className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-white/20">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={userName} className="object-cover" />
                    ) : null}
                    <AvatarFallback className={`text-sm font-medium ${
                      theme === 'dark' 
                        ? 'bg-gray-600 text-gray-200' 
                        : 'bg-secondary-100 text-secondary-700'
                    }`}>
                      {user?.user_metadata?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 
                       user?.user_metadata?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 
                       user?.user_metadata?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() ||
                       user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() ||
                       user?.email?.split('@')[0].slice(0, 2).toUpperCase() || 
                       ((userRole === 'admin' || userRole === 'platform_admin') ? 'PA' : userRole === 'provider' ? 'PR' : 'CM')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <p className={`text-sm font-semibold truncate ${
                      theme === 'dark' ? 'text-gray-100' : 'text-slate-900'
                    }`}>
                      {userName}
                    </p>
                    <p className={`text-xs truncate ${
                      theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                    }`}>
                      {(userRole === 'admin' || userRole === 'platform_admin') ? 'Administrator' : userRole === 'provider' ? 'Provider' : 'Case Manager'}
                      {user?.organization?.name && (
                        <span className={`ml-1 ${theme === 'dark' ? 'text-blue-400' : 'text-primary-600'}`}>
                          • {user.organization.name}
                        </span>
                      )}
                    </p>
                    <p className={`text-xs truncate mt-0.5 ${
                      theme === 'dark' ? 'text-gray-500' : 'text-slate-400'
                    }`}>
                      {user?.email}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className={theme === 'dark' ? 'bg-gray-700' : 'bg-slate-200'} />
              <div className="p-1">
                <DropdownMenuItem 
                  onClick={() => router.push('/case-manager/profile')}
                  className={`rounded-lg ${
                    theme === 'dark' 
                      ? 'hover:bg-gray-700 focus:bg-gray-700' 
                      : 'hover:bg-slate-50 focus:bg-slate-50'
                  }`}
                >
                  <Users className="mr-3 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => document.querySelector('input[type="file"]')?.click()}
                  disabled={isUploading}
                  className={`rounded-lg ${
                    theme === 'dark' 
                      ? 'hover:bg-gray-700 focus:bg-gray-700' 
                      : 'hover:bg-slate-50 focus:bg-slate-50'
                  }`}
                >
                  <Upload className="mr-3 h-4 w-4" />
                  {isUploading ? 'Uploading...' : 'Upload Photo'}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => router.push('/case-manager/settings')}
                  className={`rounded-lg ${
                    theme === 'dark' 
                      ? 'hover:bg-gray-700 focus:bg-gray-700' 
                      : 'hover:bg-slate-50 focus:bg-slate-50'
                  }`}
                >
                  <Settings className="mr-3 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator className={theme === 'dark' ? 'bg-gray-700' : 'bg-slate-200'} />
              <div className="p-1">
                <DropdownMenuItem 
                  onClick={signOut} 
                  className={`rounded-lg text-red-600 hover:text-red-700 ${
                    theme === 'dark' 
                      ? 'hover:bg-red-900/20 focus:bg-red-900/20' 
                      : 'hover:bg-red-50 focus:bg-red-50'
                  }`}
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Bottom row - Navigation menu */}
      {showNavigation && (
        <div className="flex items-center justify-center px-6 h-8 border-t" style={{
          borderTopColor: theme === 'dark' ? '#4B5563' : '#E5E7EB'
        }}>
          <nav className="flex items-center space-x-1">
            {caseManagerNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                    theme === 'dark'
                      ? isActive
                        ? "bg-gray-700 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                      : isActive
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className="mr-1.5 h-3.5 w-3.5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
