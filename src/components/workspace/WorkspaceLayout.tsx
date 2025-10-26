'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { capitalizeName, formatServiceType } from '@/lib/shared/formatting';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Search, 
  Send, 
  MessageSquare,
  User,
  Plus,
  Paperclip,
  Settings
} from 'lucide-react';

interface WorkspaceLayoutProps {
  // Header props
  backUrl: string;
  backLabel: string;
  title: string;
  subtitle: string;
  
  // Client/Provider info
  clientName: string;
  clientInitials: string;
  providerName: string;
  providerInitials: string;
  serviceType: string;
  isProviderOnline?: boolean;
  lastSeen?: string;
  
  // Message props
  children: React.ReactNode; // Message components
  
  // Composer props
  messageContent: string;
  messageCategory: string;
  messagePriority: string;
  isInternal?: boolean;
  isSending?: boolean;
  onMessageChange: (content: string) => void;
  onCategoryChange: (category: string) => void;
  onPriorityChange: (priority: string) => void;
  onInternalChange?: (internal: boolean) => void;
  onSendMessage: () => void;
  
  // Role
  userRole: 'case_manager' | 'provider' | 'admin';
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

export default function WorkspaceLayout({
  backUrl,
  backLabel,
  title,
  subtitle,
  clientName,
  clientInitials,
  providerName,
  providerInitials,
  serviceType,
  isProviderOnline = false,
  lastSeen = '2h ago',
  children,
  messageContent,
  messageCategory,
  messagePriority,
  isInternal = false,
  isSending = false,
  onMessageChange,
  onCategoryChange,
  onPriorityChange,
  onInternalChange,
  onSendMessage,
  userRole
}: WorkspaceLayoutProps) {
  
  return (
    <div className="h-screen flex bg-background-500">
      {/* Left Sidebar - Client Info */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="ghost" size="sm" className="flex items-center gap-2 h-8 px-2" asChild>
              <Link href={backUrl}>
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">{backLabel}</span>
              </Link>
            </Button>
          </div>
          
          <div>
            <h1 className="text-base font-semibold text-gray-900 mb-1">My Workspace</h1>
            <p className="text-xs text-gray-600">Manage your client relationships</p>
          </div>
          
          <div className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                className="pl-10 bg-accent-50 border-gray-200 h-8 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Current Client Card */}
        <div className="p-4">
          <div className="bg-secondary-50 rounded-lg p-3 border border-secondary-200">
            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-secondary-100 text-secondary-700 font-semibold text-sm">
                  {clientInitials || getInitials(clientName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{clientName}</h3>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs font-medium">
                    Active
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 truncate">{formatServiceType(serviceType)}</p>
                <p className="text-xs text-gray-500 mt-1">with {capitalizeName(providerName)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-accent-100 text-accent-700 font-semibold text-xs">
                  {providerInitials || getInitials(providerName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{capitalizeName(providerName)}</h2>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  {isProviderOnline ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Online now</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span>Last seen {lastSeen}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-white">
          {children}
        </div>

        {/* Message Composer */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="space-y-3">
            {/* Controls Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Select value={messageCategory} onValueChange={onCategoryChange}>
                  <SelectTrigger className="h-8 w-auto text-xs min-w-[140px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status_update">📘 Status Update</SelectItem>
                    <SelectItem value="document_request">🟣 Document Request</SelectItem>
                    <SelectItem value="service_coordination">🟢 Service Coordination</SelectItem>
                    <SelectItem value="follow_up_required">🟠 Follow-Up Required</SelectItem>
                    <SelectItem value="incident">🔴 Incident</SelectItem>
                    <SelectItem value="general">⚪ General</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={messagePriority} onValueChange={onPriorityChange}>
                  <SelectTrigger className="h-8 w-auto text-xs min-w-[100px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                
                {onInternalChange && (
                  <label className="flex items-center gap-1 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => onInternalChange(e.target.checked)}
                      className="rounded border-gray-300 text-secondary-600 focus:ring-secondary-500"
                    />
                    <span>Internal note</span>
                  </label>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500">
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Message Input */}
            <div className="flex gap-2">
              <Textarea
                value={messageContent}
                onChange={(e) => onMessageChange(e.target.value)}
                placeholder={`Send a ${messageCategory.replace('_', ' ')} message...`}
                className="flex-1 min-h-[60px] resize-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    onSendMessage();
                  }
                }}
              />
              
              <div className="flex flex-col justify-end">
                <Button
                  onClick={onSendMessage}
                  disabled={!messageContent.trim() || isSending}
                  className="h-10 w-10 p-0 bg-secondary-500 hover:bg-secondary-600"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded font-mono">⌘ + Enter</kbd> to send
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}