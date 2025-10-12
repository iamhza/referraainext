'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProviderDirectoryIntegration } from '@/components/providers/ProviderDirectoryIntegration';
import type { Client as ClientType } from '@/types';
import { Logo } from '@/components/ui/Logo';
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
  Plus,
  ChevronDown,
  FileText,
  Users,
  Download,
  Megaphone,
  Settings,
  LogOut,
  Upload,
  Camera,
  ChevronRight
} from 'lucide-react';

interface CleanTopBarProps {
  totalClients?: number;
  onRefresh?: () => void;
  viewDensity?: 'comfortable' | 'compact';
  onViewDensityChange?: (density: 'comfortable' | 'compact') => void;
  onAddClient?: () => void;
  selectedClient?: ClientType | null;
  onReferralCreated?: () => void;
}

export function CleanTopBar({ 
  totalClients = 0, 
  onRefresh, 
  viewDensity = 'comfortable', 
  onViewDensityChange,
  onAddClient,
  selectedClient,
  onReferralCreated
}: CleanTopBarProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Load avatar URL from user data
  useEffect(() => {
    const loadUserAvatar = async () => {
      if (user) {
        let userAvatarUrl = user?.user_metadata?.avatar_url || 
                           (user as any)?.avatar_url || 
                           user?.user_metadata?.picture ||
                           null;
        
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
      console.log('Searching for:', searchQuery);
      // TODO: Implement search functionality
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await fetch('/api/auth/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setAvatarUrl(data.avatarUrl);
      console.log('Avatar uploaded successfully');
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert(`Failed to upload avatar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
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
    <div className={`w-full border-b ${
      theme === 'dark' 
        ? 'bg-gray-900 border-gray-800' 
        : 'bg-seasalt-50 border-slate-200'
    }`}>
      <div className="flex items-center justify-between px-6 py-3">
        
        {/* Left: Logo */}
        <div className="flex items-center">
          <Link href="/case-manager" className="flex items-center">
            <Logo className="h-8" />
          </Link>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-md mx-8">
          <form onSubmit={handleSearch} className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
              theme === 'dark' ? 'text-gray-400' : 'text-slate-400'
            }`} />
            <Input
              type="text"
              placeholder="Search clients, referrals, tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 pr-4 w-full rounded-lg border transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-gray-600' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-500 focus:border-slate-300'
              }`}
            />
          </form>
        </div>

        {/* Right: View Toggle, Action Buttons + Profile */}
        <div className="flex items-center gap-3">
          
          {/* View Density Toggle */}
          {onViewDensityChange && (
            <div className={`flex items-center gap-1 p-1 rounded-lg transition-colors duration-200 ${
              theme === 'dark' 
                ? 'bg-gray-800 border border-gray-700' 
                : 'bg-slate-100 border border-slate-200'
            }`}>
              <button
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  viewDensity === 'comfortable' 
                    ? theme === 'dark'
                      ? 'bg-gray-700 text-gray-100 shadow-sm border border-gray-600' 
                      : 'bg-seasalt-200 text-slate-900 shadow-sm border border-slate-300'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                onClick={() => onViewDensityChange('comfortable')}
              >
                Comfortable
              </button>
              <button
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  viewDensity === 'compact' 
                    ? theme === 'dark'
                      ? 'bg-gray-700 text-gray-100 shadow-sm border border-gray-600' 
                      : 'bg-seasalt-200 text-slate-900 shadow-sm border border-slate-300'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                onClick={() => onViewDensityChange('compact')}
              >
                Compact
              </button>
            </div>
          )}
          
          {/* Add Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className={`${
                  theme === 'dark' 
                    ? 'border-gray-700 hover:bg-gray-800' 
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
                <ChevronDown className="w-3 h-3 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onAddClient || (() => router.push('/case-manager/clients/new'))}>
                <Users className="mr-2 h-4 w-4" />
                Add Client
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/case-manager/new-referral')}>
                <FileText className="mr-2 h-4 w-4" />
                New Referral
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Provider Directory */}
          <ProviderDirectoryIntegration 
            selectedClient={selectedClient}
            prefilledCounty={user?.user_metadata?.county || 'Hennepin'}
            onReferralCreated={onReferralCreated}
          />

          {/* Report Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className={`${
                  theme === 'dark' 
                    ? 'border-gray-700 hover:bg-gray-800' 
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                Report
                <ChevronDown className="w-3 h-3 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Download Report
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Megaphone className="mr-2 h-4 w-4" />
                Request Updates
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile */}
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
                  
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Camera className="w-3 h-3 text-white" />
                  </div>
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
                    disabled={isUploading}
                  />
                  
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                
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
                  onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
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
    </div>
  );
}
