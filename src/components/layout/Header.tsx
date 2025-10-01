'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Settings, LogOut, User, Bell } from 'lucide-react';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement global search functionality
      console.log('Searching for:', searchQuery);
    }
  };

  const userName = user?.user_metadata?.fullName || 
                   user?.user_metadata?.name || 
                   user?.email?.split('@')[0] || 
                   'User';

  const userRole = user?.user_metadata?.role || 'case_manager';

  return (
    <header className={`bg-white border-b border-gray-200 px-6 py-4 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Left side - Logo placeholder */}
        <div className="flex items-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 mr-3">
            <span className="text-lg font-bold text-white">R</span>
          </div>
          <span className="text-xl font-semibold text-gray-900">referra</span>
        </div>

        {/* Center - Global Search */}
        <div className="flex-1 max-w-md mx-8">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search clients, referrals, tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
            />
          </form>
        </div>

        {/* Right side - Actions and User Profile */}
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <Button variant="ghost" size="sm" className="p-2">
            <Bell className="h-5 w-5 text-gray-600" />
          </Button>

          {/* Settings */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2"
            onClick={() => router.push('/case-manager/settings')}
          >
            <Settings className="h-5 w-5 text-gray-600" />
          </Button>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-secondary-100 text-secondary-700 text-sm font-medium">
                    {user?.user_metadata?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 
                     user?.user_metadata?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() ||
                     user?.email?.split('@')[0].slice(0, 2).toUpperCase() || 
                     ((userRole === 'admin' || userRole === 'platform_admin') ? 'PA' : userRole === 'provider' ? 'PR' : 'CM')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-700">{userName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-gray-500">
                    {(userRole === 'admin' || userRole === 'platform_admin') ? 'Platform Administrator' : userRole === 'provider' ? 'Provider' : 'Case Manager'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/case-manager/profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/case-manager/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
