'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, FileText, Calendar, Users } from 'lucide-react';
import { useEffect } from 'react';

export type FilterType = 'all' | 'overdue' | 'due_today' | 'this_week' | 'needs_docs' | 'no_activity';

export interface FilterCounts {
  all: number;
  overdue: number;
  dueToday: number;
  thisWeek: number;
  needsDocs: number;
  noActivity: number;
}

interface FilterBarProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts: FilterCounts;
  className?: string;
}

interface FilterOption {
  id: FilterType;
  label: string;
  shortcut: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'red' | 'orange' | 'blue' | 'gray' | 'default';
}

const filterOptions: FilterOption[] = [
  {
    id: 'overdue',
    label: 'OVERDUE',
    shortcut: '1',
    icon: AlertCircle,
    color: 'red',
  },
  {
    id: 'due_today',
    label: 'DUE TODAY',
    shortcut: '2',
    icon: Clock,
    color: 'orange',
  },
  {
    id: 'this_week',
    label: 'THIS WEEK',
    shortcut: '3',
    icon: Calendar,
    color: 'orange',
  },
  {
    id: 'needs_docs',
    label: 'NEEDS DOCS',
    shortcut: '4',
    icon: FileText,
    color: 'blue',
  },
  {
    id: 'no_activity',
    label: 'NO ACTIVITY',
    shortcut: '5',
    icon: Clock,
    color: 'gray',
  },
  {
    id: 'all',
    label: 'ALL CLIENTS',
    shortcut: '6',
    icon: Users,
    color: 'default',
  },
];

const colorStyles = {
  red: {
    active: 'bg-red-600 text-white border-red-700 shadow-sm',
    inactive: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300',
    badge: 'bg-red-100 text-red-800',
  },
  orange: {
    active: 'bg-orange-600 text-white border-orange-700 shadow-sm',
    inactive: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 hover:border-orange-300',
    badge: 'bg-orange-100 text-orange-800',
  },
  blue: {
    active: 'bg-blue-600 text-white border-blue-700 shadow-sm',
    inactive: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300',
    badge: 'bg-blue-100 text-blue-800',
  },
  gray: {
    active: 'bg-gray-600 text-white border-gray-700 shadow-sm',
    inactive: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300',
    badge: 'bg-gray-100 text-gray-800',
  },
  default: {
    active: 'bg-slate-700 text-white border-slate-800 shadow-sm',
    inactive: 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300',
    badge: 'bg-slate-100 text-slate-800',
  },
};

export function FilterBar({ activeFilter, onFilterChange, counts, className }: FilterBarProps) {
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if no input is focused
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const option = filterOptions.find(opt => opt.shortcut === e.key);
      if (option) {
        onFilterChange(option.id);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [onFilterChange]);

  const getCount = (filterId: FilterType): number => {
    switch (filterId) {
      case 'overdue': return counts.overdue;
      case 'due_today': return counts.dueToday;
      case 'this_week': return counts.thisWeek;
      case 'needs_docs': return counts.needsDocs;
      case 'no_activity': return counts.noActivity;
      case 'all': return counts.all;
      default: return 0;
    }
  };

  return (
    <div className={cn(
      'w-full bg-white border-b border-slate-200 px-6 py-3',
      className
    )}>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Label */}
        <span className="text-xs font-medium text-slate-600 mr-2">
          QUICK FILTERS
        </span>

        {/* Filter Pills */}
        {filterOptions.map((option) => {
          const count = getCount(option.id);
          const isActive = activeFilter === option.id;
          const styles = colorStyles[option.color];
          const Icon = option.icon;

          return (
            <button
              key={option.id}
              onClick={() => onFilterChange(option.id)}
              className={cn(
                'group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold',
                'border transition-all duration-200 ease-out',
                'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400',
                isActive ? styles.active : styles.inactive
              )}
            >
              {/* Icon */}
              <Icon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2.5} />

              {/* Label */}
              <span className="leading-none">{option.label}</span>

              {/* Count Badge */}
              {count > 0 && (
                <Badge 
                  className={cn(
                    'h-5 min-w-[20px] px-1.5 text-[10px] font-bold',
                    isActive ? 'bg-white/20 text-white' : styles.badge
                  )}
                  variant="secondary"
                >
                  {count}
                </Badge>
              )}

              {/* Keyboard Shortcut Hint */}
              <kbd className={cn(
                'hidden md:inline-flex h-4 min-w-[16px] items-center justify-center rounded px-1',
                'text-[10px] font-mono font-semibold',
                'transition-opacity duration-200',
                isActive 
                  ? 'bg-white/20 text-white opacity-70' 
                  : 'bg-slate-200 text-slate-600 opacity-0 group-hover:opacity-100'
              )}>
                {option.shortcut}
              </kbd>

              {/* Active Indicator Dot */}
              {isActive && (
                <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-white animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Filter Description */}
      {activeFilter !== 'all' && (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="font-medium">
            Showing {getCount(activeFilter)} of {counts.all} clients
          </span>
          <button
            onClick={() => onFilterChange('all')}
            className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
          >
            Clear filter
          </button>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
      )}
    </div>
  );
}

