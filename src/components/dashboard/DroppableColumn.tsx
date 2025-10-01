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

  // Get column-specific styling
  const getColumnStyling = () => {
    switch (status) {
      case 'UNPLACED':
      case 'UNPLACED_NEW':
        return {
          headerBg: 'bg-slate-100',
          borderColor: 'border-slate-200'
        };
      case 'REFERRAL_SENT':
        return {
          headerBg: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'IN_PROCESS':
        return {
          headerBg: 'bg-purple-50',
          borderColor: 'border-purple-200'
        };
      case 'ACTIVE_STABLE':
        return {
          headerBg: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'ACTIVE_NEEDS_ATTENTION':
      case 'ACTIVE_FRUSTRATED':
        return {
          headerBg: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'CLOSED_DISCHARGED':
        return {
          headerBg: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
      default:
        return {
          headerBg: 'bg-slate-100',
          borderColor: 'border-slate-200'
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
        // List View for Compact - Separate scroll container
        <div className="flex-1 flex flex-col min-h-0">
          {/* Fixed Header - Outside scroll container */}
          <div className="flex-shrink-0 px-3 pt-3">
            <div className={`flex items-center px-4 py-2.5 text-xs font-semibold text-gray-600 ${columnStyle.headerBg} backdrop-blur-sm rounded-lg border ${columnStyle.borderColor} shadow-sm`}>
              <div className="w-3 mr-3"></div>
              <div className="w-40 sm:w-48 font-medium">Client</div>
              <div className="hidden sm:block w-32 font-medium">Service</div>
              <div className="hidden md:block w-24 text-center font-medium">PMI</div>
              <div className="hidden lg:block w-20 text-center font-medium">Updated</div>
              <div className="w-16 text-center font-medium">Action</div>
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent px-3 pt-3 pb-3">
            <SortableContext items={clientIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
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
