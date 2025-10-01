'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ClientCard } from './ClientCard';
import type { Client as ClientType } from '@/types';
import { useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DraggableClientCardProps {
  client: ClientType;
  connections?: any[];
  onClick?: () => void;
  onRequestUpdate?: () => void;
  onCreateReferral?: () => void;
  className?: string;
  isDragging?: boolean;
  isOver?: boolean;
  index?: number;
}

export function DraggableClientCard({ 
  client, 
  connections = [], 
  onClick, 
  onRequestUpdate, 
  onCreateReferral,
  className = '',
  isDragging = false,
  isOver = false,
  index = 0
}: DraggableClientCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isCurrentlyDragging,
  } = useSortable({
    id: client._id!,
    data: {
      type: 'client',
      client,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition,
    opacity: isDragging ? 0.4 : 1,
  };

  // Track if we're actually dragging vs just clicking
  const [hasStartedDrag, setHasStartedDrag] = useState(false);

  // Handle clicks - only trigger if not in the middle of dragging
  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Don't trigger click if we're dragging or have started dragging
    if (!hasStartedDrag && !isCurrentlyDragging && onClick) {
      onClick();
    }
  };

  // Track drag state changes
  useEffect(() => {
    if (isCurrentlyDragging) {
      setHasStartedDrag(true);
    } else {
      // Reset after a short delay to allow click to fire
      const timer = setTimeout(() => setHasStartedDrag(false), 100);
      return () => clearTimeout(timer);
    }
  }, [isCurrentlyDragging]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        ${isCurrentlyDragging ? 'z-50' : 'z-0'}
        transition-all duration-200
      `}
      {...attributes}
      {...listeners}
    >
      <div className="relative group">
        {/* Subtle drag indicator on hover */}
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-50 transition-opacity duration-200 pointer-events-none">
          <div className="w-3 h-3 flex flex-col gap-0.5">
            <div className="w-full h-0.5 bg-gray-400 rounded-full"></div>
            <div className="w-full h-0.5 bg-gray-400 rounded-full"></div>
            <div className="w-full h-0.5 bg-gray-400 rounded-full"></div>
          </div>
        </div>
        
        <ClientCard
          client={client}
          connections={connections}
          onClick={handleCardClick}
          onRequestUpdate={onRequestUpdate}
          onCreateReferral={onCreateReferral}
          className={`
            ${className}
            ${isCurrentlyDragging ? 'cursor-grabbing shadow-2xl ring-2 ring-blue-400 scale-105' : 'cursor-pointer hover:shadow-lg hover:scale-[1.02]'}
            transition-all duration-200
          `}
        />
      </div>
    </div>
  );
}
