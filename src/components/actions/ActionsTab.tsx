'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Filter, Activity, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ActionCard } from './ActionCard';
import { AddActionModal } from './AddActionModal';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Action, ActionStatus } from '@/types/actions';

interface ActionsTabProps {
  clientId: string;
}

type FilterType = 'all' | 'pending' | 'complete';
type SortType = 'recent' | 'priority' | 'status';

export function ActionsTab({ clientId }: ActionsTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('recent');
  const [showAddModal, setShowAddModal] = useState(false);
  const [hasROI, setHasROI] = useState(true); // TODO: Implement ROI checking

  useEffect(() => {
    fetchActions();
  }, [clientId]);

  const fetchActions = async () => {
    if (!clientId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/clients/${clientId}/actions`);
      if (!response.ok) {
        throw new Error('Failed to fetch actions');
      }
      
      const data = await response.json();
      setActions(data.actions || []);
    } catch (err) {
      console.error('Error fetching actions:', err);
      setError('Failed to load actions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAction = async (actionData: any) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(actionData),
      });

      if (!response.ok) {
        throw new Error('Failed to create action');
      }

      const newAction = await response.json();
      setActions(prev => [newAction, ...prev]);
      
      toast({
        title: "Action Created",
        description: `${actionData.title} has been added to the workflow.`,
      });
    } catch (error) {
      console.error('Error creating action:', error);
      toast({
        title: "Error",
        description: "Failed to create action. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleCompleteAction = async (actionId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/actions/${actionId}/complete`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to complete action');
      }

      const updatedAction = await response.json();
      setActions(prev => prev.map(action => 
        action._id === actionId ? { ...action, ...updatedAction } : action
      ));
      
      toast({
        title: "Action Completed",
        description: "Action has been marked as complete.",
      });
    } catch (error) {
      console.error('Error completing action:', error);
      toast({
        title: "Error",
        description: "Failed to complete action. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async (actionId: string, comment: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/actions/${actionId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: comment }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const updatedAction = await response.json();
      setActions(prev => prev.map(action => 
        action._id === actionId ? updatedAction : action
      ));
      
      toast({
        title: "Comment Added",
        description: "Your comment has been added to the action.",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAttachFile = async (actionId: string) => {
    // TODO: Implement file attachment
    toast({
      title: "File Attachment",
      description: "File attachment feature coming soon.",
    });
  };

  // Filter and sort actions
  const filteredAndSortedActions = React.useMemo(() => {
    let filtered = actions;
    
    // Apply filter
    if (filter === 'pending') {
      filtered = actions.filter(action => action.status === 'pending');
    } else if (filter === 'complete') {
      filtered = actions.filter(action => action.status === 'complete');
    }
    
    // Apply sort
    return filtered.sort((a, b) => {
      switch (sort) {
        case 'priority':
          // Sort by urgency: urgent > issue > normal
          const urgencyOrder = { urgent: 3, issue: 2, normal: 1 };
          const aUrgency = urgencyOrder[a.urgency] || 1;
          const bUrgency = urgencyOrder[b.urgency] || 1;
          if (aUrgency !== bUrgency) return bUrgency - aUrgency;
          // Fall through to recent if urgency is same
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'status':
          // Pending first, then complete
          if (a.status !== b.status) {
            return a.status === 'pending' ? -1 : 1;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });
  }, [actions, filter, sort]);

  const getFilterCounts = () => {
    return {
      all: actions.length,
      pending: actions.filter(a => a.status === 'pending').length,
      complete: actions.filter(a => a.status === 'complete').length,
    };
  };

  const filterCounts = getFilterCounts();

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading actions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="text-gray-600">{error}</p>
        <Button 
          onClick={fetchActions}
          variant="outline" 
          size="sm" 
          className="mt-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Actions
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Structured workflow for case management and provider coordination
            </p>
          </div>
          
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Action
          </Button>
        </div>

        {/* Filters and Sort */}
        <div className="flex items-center gap-4">
          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <div className="flex items-center gap-1">
              {(['all', 'pending', 'complete'] as FilterType[]).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === filterType
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {filterCounts[filterType]}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortType)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">Most Recent</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Actions Feed */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredAndSortedActions.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'No Actions Yet' : `No ${filter} Actions`}
            </h4>
            <p className="text-gray-500 mb-4">
              {filter === 'all' 
                ? 'Start by adding an action to begin the workflow.'
                : `No actions with ${filter} status found.`
              }
            </p>
            {filter === 'all' && (
              <Button
                onClick={() => setShowAddModal(true)}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Action
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedActions.map((action) => (
              <ActionCard
                key={action._id}
                action={action}
                onComplete={handleCompleteAction}
                onAddComment={handleAddComment}
                onAttachFile={handleAttachFile}
                currentUserRole={user?.role as 'case_manager' | 'provider' || 'case_manager'}
                hasROI={hasROI}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Action Modal */}
      <AddActionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreateAction={handleCreateAction}
        userRole={user?.role as 'case_manager' | 'provider' || 'case_manager'}
        clientId={clientId}
      />
    </div>
  );
}
