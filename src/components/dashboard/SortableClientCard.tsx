'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ClientCard } from './ClientCard';
import type { Client as ClientType } from '@/types';

interface SortableClientCardProps {
  client: ClientType;
  connections?: any[];
  onClick?: () => void;
  onRequestUpdate?: () => void;
  onCreateReferral?: () => void;
  onNavigateToTab?: (tab: string) => void;
  onDelete?: (clientId: string) => void;
  className?: string;
  isSelected?: boolean;
  viewDensity?: 'comfortable' | 'compact';
  shouldHideDetails?: boolean;
}

export function SortableClientCard({ 
  client, 
  connections = [], 
  onClick, 
  onRequestUpdate, 
  onCreateReferral,
  onNavigateToTab,
  onDelete,
  className = '',
  isSelected = false,
  viewDensity = 'comfortable',
  shouldHideDetails = false
}: SortableClientCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: client._id!,
    data: {
      type: 'client',
      client,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        ${isDragging ? 'z-50 opacity-50' : 'z-0'}
        cursor-grab active:cursor-grabbing
        py-2 -my-2
      `}
    >
      <div className="relative group">
        {/* Drag handle indicator */}
        <div className={`absolute right-2 top-2 transition-opacity duration-200 pointer-events-none ${
          isSelected ? 'opacity-0' : 'opacity-0 group-hover:opacity-50'
        }`}>
          <div className="w-3 h-3 flex flex-col gap-0.5">
            <div className="w-full h-0.5 bg-gray-400 rounded-full"></div>
            <div className="w-full h-0.5 bg-gray-400 rounded-full"></div>
            <div className="w-full h-0.5 bg-gray-400 rounded-full"></div>
          </div>
        </div>
        
        <ClientCard
          client={client}
          connections={connections}
          onClick={() => {
            if (!isDragging && onClick) {
              onClick();
            }
          }}
          onRequestUpdate={onRequestUpdate}
          onCreateReferral={onCreateReferral}
          onNavigateToTab={onNavigateToTab}
          onDelete={onDelete}
          viewDensity={viewDensity}
          shouldHideDetails={shouldHideDetails}
          className={`
            ${className}
            ${isDragging ? 'shadow-2xl ring-2 ring-blue-400' : isSelected ? 'ring-2 ring-blue-500 shadow-2xl scale-[1.03] bg-white relative z-[60]' : 'hover:shadow-lg hover:scale-[1.01]'}
            transition-all duration-500 ease-in-out relative z-20
          `}
        />
        
        {/* Selected state indicator - positioned AFTER card to be on top */}
        {isSelected && !isDragging && (
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-600 rounded-full shadow-2xl animate-pulse border-2 border-white z-[70] pointer-events-none" />
        )}
      </div>
    </div>
  );
}
