import React from 'react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal,
  Building2,
  MessageSquare,
  AlertTriangle,
  Shield,
  Edit,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ServiceActionsMenuProps } from '../types';

/**
 * Actions dropdown menu - extracted to reduce main component size
 */
export const ServiceActionsMenu = React.memo(({
  service,
  onViewDetails,
  onMessage,
  onRaiseIssue,
  onEditAuth,
}: ServiceActionsMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all duration-200 rounded-md hover:ring-2 hover:ring-slate-200/50"
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-64 max-h-[calc(100vh-100px)] overflow-y-auto bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 z-50"
      >
        <div className="px-2 py-1.5 mb-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Actions</p>
        </div>
        <DropdownMenuItem 
          onClick={onViewDetails}
          className="rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-150 hover:bg-blue-50/80 focus:bg-blue-50/80 group"
        >
          <Building2 className="w-4 h-4 mr-3 text-slate-500 group-hover:text-blue-600 transition-colors" />
          <span className="text-sm font-medium text-slate-700 group-hover:text-blue-900">View Service Details</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={onMessage}
          className="rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-150 hover:bg-blue-50/80 focus:bg-blue-50/80 group"
        >
          <MessageSquare className="w-4 h-4 mr-3 text-slate-500 group-hover:text-blue-600 transition-colors" />
          <span className="text-sm font-medium text-slate-700 group-hover:text-blue-900">Message Provider</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="my-1.5 bg-slate-100" />
        
        <div className="px-2 py-1.5 mb-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Issues & Problems</p>
        </div>
        <DropdownMenuItem 
          onClick={onRaiseIssue}
          className="rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-150 hover:bg-orange-50/80 focus:bg-orange-50/80 group"
        >
          <AlertTriangle className="w-4 h-4 mr-3 text-slate-500 group-hover:text-orange-600 transition-colors" />
          <span className="text-sm font-medium text-slate-700 group-hover:text-orange-900">Raise Issue</span>
        </DropdownMenuItem>
        {service.activeIssuesCount && service.activeIssuesCount > 0 && (
          <DropdownMenuItem asChild>
            <Link 
              href="/case-manager/workspace"
              className="rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-150 hover:bg-orange-50/80 focus:bg-orange-50/80 group flex items-center"
            >
              <AlertTriangle className="w-4 h-4 mr-3 text-orange-500 group-hover:text-orange-700 transition-colors" />
              <span className="text-sm font-medium text-slate-700 group-hover:text-orange-900">View Active Issues ({service.activeIssuesCount})</span>
            </Link>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator className="my-1.5 bg-slate-100" />
        
        <div className="px-2 py-1.5 mb-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Authorization</p>
        </div>
        <DropdownMenuItem 
          onClick={onEditAuth}
          className="rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-150 hover:bg-green-50/80 focus:bg-green-50/80 group"
        >
          <Shield className="w-4 h-4 mr-3 text-slate-500 group-hover:text-green-600 transition-colors" />
          <span className="text-sm font-medium text-slate-700 group-hover:text-green-900">
            {service.authorization ? 'Edit Authorization' : 'Create Authorization'}
          </span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="my-1.5 bg-slate-100" />
        
        <div className="px-2 py-1.5 mb-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Management</p>
        </div>
        <DropdownMenuItem 
          onClick={() => toast.info('Edit service coming soon')}
          className="rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-150 hover:bg-slate-50 focus:bg-slate-50 group"
        >
          <Edit className="w-4 h-4 mr-3 text-slate-500 group-hover:text-slate-700 transition-colors" />
          <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Edit Service Details</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => toast.info('Close service workflow coming soon')}
          className="rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-150 hover:bg-slate-50 focus:bg-slate-50 group"
        >
          <XCircle className="w-4 h-4 mr-3 text-slate-500 group-hover:text-slate-700 transition-colors" />
          <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Close Service</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

ServiceActionsMenu.displayName = 'ServiceActionsMenu';
