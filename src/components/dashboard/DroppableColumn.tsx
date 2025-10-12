'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ColumnHeader } from './ColumnHeader';
import { SortableClientCard } from './SortableClientCard';
import { SortableClientListItem } from './SortableClientListItem';
import { Plus } from 'lucide-react';
import type { Client as ClientType, ClientStatus } from '@/types';

interface DroppableColumnProps {
  id: string;
  status: ClientStatus;
  clients: ClientType[];
  connections?: any[];
  onClientClick?: (client: ClientType) => void;
  onRequestUpdate?: (client: ClientType) => void;
  onCreateReferral?: (client: ClientType) => void;
  onAddClient?: () => void;
  onDelete?: (clientId: string) => void;
  isDragging?: boolean;
  isOverColumn?: boolean;
  selectedClientId?: string;
  viewDensity?: 'comfortable' | 'compact';
  shouldHideDetails?: boolean;
  onNavigateToTab?: (tab: string) => void;
}

export function DroppableColumn({
  id,
  status,
  clients,
  connections = [],
  onClientClick,
  onRequestUpdate,
  onCreateReferral,
  onAddClient,
  onDelete,
  isDragging = false,
  isOverColumn = false,
  selectedClientId,
  viewDensity = 'comfortable',
  shouldHideDetails = false,
  onNavigateToTab
}: DroppableColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      type: 'column',
      status,
    },
  });

  const clientIds = clients.map(client => client._id!);

  // Get column-specific styling - Professional, distinguishable colors
  const getColumnStyling = () => {
    switch (status) {
      case 'UNPLACED':
      case 'UNPLACED_NEW':
        return {
          headerBg: 'bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100',
          borderColor: 'border-slate-300'
        };
      case 'REFERRAL_SENT':
        return {
          headerBg: 'bg-gradient-to-br from-blue-100 via-blue-50 to-blue-100',
          borderColor: 'border-blue-300'
        };
      case 'IN_PROCESS':
        return {
          headerBg: 'bg-gradient-to-br from-purple-100 via-purple-50 to-purple-100',
          borderColor: 'border-purple-300'
        };
      case 'ACTIVE_STABLE':
        return {
          headerBg: 'bg-gradient-to-br from-emerald-100 via-emerald-50 to-emerald-100',
          borderColor: 'border-emerald-300'
        };
      case 'ACTIVE_NEEDS_ATTENTION':
      case 'ACTIVE_FRUSTRATED':
        return {
          headerBg: 'bg-gradient-to-br from-amber-100 via-amber-50 to-amber-100',
          borderColor: 'border-amber-300'
        };
      case 'CLOSED_DISCHARGED':
        return {
          headerBg: 'bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100',
          borderColor: 'border-gray-300'
        };
      default:
        return {
          headerBg: 'bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100',
          borderColor: 'border-slate-300'
        };
    }
  };

  const columnStyle = getColumnStyling();

  return (
    <div className="relative min-w-0 w-full">
      {/* Column divider */}
      <div className="absolute -right-px top-4 bottom-4 w-px bg-slate-200/60 z-10" />
      
      <div 
        ref={setNodeRef}
        className={`
          flex flex-col transition-all duration-200 bg-white rounded-xl shadow-sm border ${columnStyle.borderColor}
          h-full
          ${(isOver || isOverColumn) ? 'bg-primary-50 ring-2 ring-accent-300 ring-opacity-50 shadow-lg' : ''}
          ${isDragging ? 'ring-1 ring-secondary-300' : ''}
          hover:shadow-md
        `}
      style={{ 
        height: 'calc(100vh - 160px)' // Explicit height for independent scrolling
      }}
    >
      <ColumnHeader 
        status={status} 
        count={clients.length}
        onAddClient={onAddClient}
        headerBg={columnStyle.headerBg}
      />
      
      {viewDensity === 'compact' ? (
        // List View for Compact - Optimized for narrow layout
        <div className="flex-1 flex flex-col min-h-0">
          {/* Fixed Header - Hidden for narrow layout, takes too much space */}
          <div className="flex-shrink-0 px-2 pt-2 hidden">
            <div className={`flex items-center px-3 py-2 text-[10px] font-semibold text-gray-600 ${columnStyle.headerBg} backdrop-blur-sm rounded-lg border ${columnStyle.borderColor} shadow-sm`}>
              <div className="w-2 mr-2"></div>
              <div className="flex-1 font-medium">Client</div>
              <div className="w-12 text-center font-medium">Action</div>
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent px-2 pt-2 pb-2">
            <SortableContext items={clientIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5">
                {clients.map((client) => (
                  <SortableClientListItem
                    key={client._id}
                    client={client}
                    connections={connections}
                    onClick={() => onClientClick?.(client)}
                    onRequestUpdate={() => onRequestUpdate?.(client)}
                    onCreateReferral={() => onCreateReferral?.(client)}
                    onDelete={onDelete}
                    isSelected={selectedClientId === client._id}
                  />
                ))}
              </div>
            </SortableContext>
            
            {clients.length === 0 && (
              <div className={`
                text-center py-16 transition-all duration-200 min-h-[240px] flex items-center justify-center
                ${isOver ? 'text-accent-600 bg-primary-100' : 'text-accent-500'}
              `}>
                <p className="text-[14px] text-accent-400 font-medium">
                  {isOver ? 'Drop client here' : 'No clients'}
                </p>
              </div>
            )}
            
            {/* Add client button */}
            <button 
              className={`
                w-full text-left text-accent-600 flex items-center transition-all duration-200 font-medium
                hover:shadow-sm border border-transparent hover:border-gray-200/60 hover:bg-primary-100
                text-[13px] py-2.5 px-0 gap-2 rounded-lg mb-2
                ${isOver ? 'bg-primary-200 text-accent-700' : ''}
              `}
              onClick={onAddClient}
            >
              <Plus className="w-5 h-5 text-accent-500" />
              Add client
            </button>
          </div>
        </div>
      ) : (
        // Card View for Comfortable - Original structure
        <div className={`flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent min-h-0 px-5 pt-4 pb-5`}>
          <SortableContext items={clientIds} strategy={verticalListSortingStrategy}>
            {clients.map((client) => (
              <SortableClientCard
                key={client._id}
                client={client}
                connections={connections}
                onClick={() => onClientClick?.(client)}
                onRequestUpdate={() => onRequestUpdate?.(client)}
                onCreateReferral={() => onCreateReferral?.(client)}
                onNavigateToTab={onNavigateToTab}
                onDelete={onDelete}
                isSelected={selectedClientId === client._id}
                viewDensity={viewDensity}
                shouldHideDetails={shouldHideDetails}
              />
            ))}
          </SortableContext>
          
          {clients.length === 0 && (
            <div className={`
              text-center py-16 transition-all duration-200 min-h-[240px] flex items-center justify-center
              ${isOver ? 'text-accent-600 bg-primary-100' : 'text-accent-500'}
            `}>
              <p className="text-[14px] text-accent-400 font-medium">
                {isOver ? 'Drop client here' : 'No clients'}
              </p>
            </div>
          )}
          
          {/* Add client button */}
          <button 
            className={`
              w-full text-left text-accent-600 flex items-center transition-all duration-200 font-medium
              hover:shadow-sm border border-transparent hover:border-gray-200/60 hover:bg-primary-100
              text-[15px] py-4 px-0 gap-3 rounded-[12px] mb-3
              ${isOver ? 'bg-primary-200 text-accent-700' : ''}
            `}
            onClick={onAddClient}
          >
            <Plus className="w-5 h-5 text-accent-500" />
            Add client
          </button>
        </div>
      )}
    </div>
    </div>
  );
}
