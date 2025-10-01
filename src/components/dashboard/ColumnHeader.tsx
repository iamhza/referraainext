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
  // Get column configuration - exactly like Asana
  const getColumnConfig = () => {
    switch (status) {
      case 'UNPLACED':
        return {
          title: 'Unplaced',
        };
      case 'REFERRAL_SENT':
        return {
          title: 'Referral Sent',
        };
      case 'IN_PROCESS':
        return {
          title: 'In Process',
        };
      case 'ACTIVE_STABLE':
        return {
          title: 'Active',
        };
      case 'ACTIVE_NEEDS_ATTENTION':
        return {
          title: 'Needs Attention',
        };
      case 'CLOSED_DISCHARGED':
        return {
          title: 'Closed/Discharged',
        };
      // Legacy support
      case 'UNPLACED_NEW':
        return {
          title: 'Unplaced',
        };
      case 'ACTIVE_FRUSTRATED':
        return {
          title: 'Needs Attention',
        };
      default:
        return {
          title: 'Unknown',
        };
    }
  };

  const config = getColumnConfig();

  return (
    <div className={`px-5 py-4 h-18 flex items-center border-b border-slate-200/60 ${headerBg || 'bg-slate-50'} rounded-t-xl ${className}`}>
      <div className="flex items-center justify-between w-full">
        {/* Column title - enhanced for full-screen experience */}
        <div className="flex items-center gap-3">
          <h2 className="text-[17px] font-bold text-gray-800 leading-tight">
            {config.title}
          </h2>
          <span className="text-[15px] text-gray-500 font-semibold bg-gray-100 px-2.5 py-1 rounded-full min-w-[28px] text-center">
            {count}
          </span>
        </div>

        {/* Column actions - larger and more prominent */}
        <div className="flex items-center gap-1">
          <button
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105"
            onClick={onAddClient}
            title="Add client"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105"
            title="Column options"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
