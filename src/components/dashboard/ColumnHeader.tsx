'use client';

import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal } from 'lucide-react';
import type { ClientStatus } from '@/types';

interface ColumnHeaderProps {
  status: ClientStatus;
  count: number;
  onAddClient?: () => void;
  className?: string;
  headerBg?: string;
}

export function ColumnHeader({ status, count, onAddClient, className = '', headerBg }: ColumnHeaderProps) {
  // Get column configuration with professional color scheme
  const getColumnConfig = () => {
    switch (status) {
      case 'UNPLACED':
        return {
          title: 'Unplaced',
          textColor: 'text-slate-900',
          countBg: 'bg-slate-200/80',
          countText: 'text-slate-700'
        };
      case 'REFERRAL_SENT':
        return {
          title: 'Referral Sent',
          textColor: 'text-slate-900',
          countBg: 'bg-blue-200/80',
          countText: 'text-blue-700'
        };
      case 'IN_PROCESS':
        return {
          title: 'In Process',
          textColor: 'text-slate-900',
          countBg: 'bg-purple-200/80',
          countText: 'text-purple-700'
        };
      case 'ACTIVE_STABLE':
        return {
          title: 'Active',
          textColor: 'text-slate-900',
          countBg: 'bg-emerald-200/80',
          countText: 'text-emerald-700'
        };
      case 'ACTIVE_NEEDS_ATTENTION':
        return {
          title: 'Needs Attention',
          textColor: 'text-slate-900',
          countBg: 'bg-amber-200/80',
          countText: 'text-amber-700'
        };
      case 'CLOSED_DISCHARGED':
        return {
          title: 'Closed/Discharged',
          textColor: 'text-slate-900',
          countBg: 'bg-gray-200/80',
          countText: 'text-gray-600'
        };
      // Legacy support
      case 'UNPLACED_NEW':
        return {
          title: 'Unplaced',
          textColor: 'text-slate-900',
          countBg: 'bg-slate-200/80',
          countText: 'text-slate-700'
        };
      case 'ACTIVE_FRUSTRATED':
        return {
          title: 'Needs Attention',
          textColor: 'text-slate-900',
          countBg: 'bg-amber-200/80',
          countText: 'text-amber-700'
        };
      default:
        return {
          title: 'Unknown',
          textColor: 'text-slate-900',
          countBg: 'bg-slate-200/80',
          countText: 'text-slate-700'
        };
    }
  };

  const config = getColumnConfig();

  return (
    <div className={`px-3 py-3 h-16 flex items-center border-b border-slate-200/60 ${headerBg || 'bg-slate-50'} rounded-t-xl ${className}`}>
      <div className="flex items-center justify-between w-full min-w-0">
        {/* Column title - compact for narrow layout */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h2 className={`text-[14px] font-bold ${config.textColor} leading-tight whitespace-nowrap truncate`}>
            {config.title}
          </h2>
          <span className={`text-[13px] font-semibold ${config.countBg} ${config.countText} px-2 py-0.5 rounded-full min-w-[24px] text-center shadow-sm flex-shrink-0`}>
            {count}
          </span>
        </div>

        {/* Column actions - compact */}
        <div className="flex items-center gap-0.5 flex-shrink-0 ml-1">
          <button
            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-all duration-200"
            onClick={onAddClient}
            title="Add client"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-all duration-200"
            title="Column options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
