'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ClientListItem } from './ClientListItem';
import type { Client as ClientType } from '@/types';

interface SortableClientListItemProps {
  client: ClientType;
  connections?: any[];
  onClick?: () => void;
  onRequestUpdate?: () => void;
  onCreateReferral?: () => void;
  onDelete?: (clientId: string) => void;
  className?: string;
  isSelected?: boolean;
}

export function SortableClientListItem({ 
  client, 
  connections = [], 
  onClick, 
  onRequestUpdate, 
  onCreateReferral,
  onDelete,
  className = '',
  isSelected = false
}: SortableClientListItemProps) {
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
        ${isDragging ? 'z-50' : 'z-0'}
        cursor-grab active:cursor-grabbing
      `}
    >
      <div className="relative group">
        {/* Drag handle indicator - only show on hover when not selected */}
        <div className={`absolute left-1 top-1/2 transform -translate-y-1/2 transition-opacity duration-200 pointer-events-none ${
          isSelected ? 'opacity-0' : 'opacity-0 group-hover:opacity-30'
        }`}>
          <div className="w-1 h-4 flex flex-col gap-0.5">
            <div className="w-full h-0.5 bg-gray-400 rounded-full"></div>
            <div className="w-full h-0.5 bg-gray-400 rounded-full"></div>
            <div className="w-full h-0.5 bg-gray-400 rounded-full"></div>
          </div>
        </div>
        
        <ClientListItem
          client={client}
          connections={connections}
          onClick={() => {
            if (!isDragging && onClick) {
              onClick();
            }
          }}
          onRequestUpdate={onRequestUpdate}
          onCreateReferral={onCreateReferral}
          onDelete={onDelete}
          isSelected={isSelected}
          className={`
            ${className}
            ${isDragging ? 'opacity-50 scale-95' : 'hover:shadow-md'}
            transition-all duration-500 ease-in-out relative z-20
          `}
        />
      </div>
    </div>
  );
}
