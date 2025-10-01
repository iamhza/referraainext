'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, FileText, AlertCircle, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  ActionDefinition, 
  ActionField, 
  UserRole, 
  getActionsByCategory,
  DocumentType,
  ServiceContext,
  Action
} from '@/types/actions';

interface AddActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActionCreated: (action: Action) => void;
  clientId: string;
  serviceContexts: ServiceContext[];
  selectedContextId?: string | null;
}

export function AddActionModal({ 
  isOpen, 
  onClose, 
  onActionCreated,
  clientId,
  serviceContexts,
  selectedContextId
}: AddActionModalProps) {
  const { user } = useAuth();
  const [selectedContext, setSelectedContext] = useState<ServiceContext | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionDefinition | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const userRole = user?.role as UserRole || 'case_manager';
  const actionCategories = getActionsByCategory(userRole);

  // Reset form when modal opens/closes and set selected context
  useEffect(() => {
    if (isOpen) {
      // Set the selected context from the parent if provided
      const contextToSelect = selectedContextId 
        ? serviceContexts.find(ctx => ctx.id === selectedContextId)
        : null;
      
      setSelectedContext(contextToSelect || null);
      setSelectedAction(null);
      setFormData({});
      setErrors({});
    }
  }, [isOpen, selectedContextId, serviceContexts]);

  const handleActionSelect = (action: ActionDefinition) => {
    setSelectedAction(action);
    setFormData({});
    setErrors({});
  };

  const handleBack = () => {
    setSelectedAction(null);
    setFormData({});
    setErrors({});
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    if (!selectedAction) return false;
    
    const newErrors: Record<string, string> = {};
    
    selectedAction.fields.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!selectedAction || !validateForm()) return;
    
    setIsSubmitting(true);
    try {
      // Check if we have file uploads
      const hasFiles = selectedAction.fields.some(field => 
        field.type === 'file' && formData[field.name] && formData[field.name].length > 0
      );

      if (hasFiles) {
        // Handle file uploads with FormData
        const formDataObj = new FormData();
        
        // Add basic action data
        formDataObj.append('clientId', clientId);
        formDataObj.append('type', selectedAction.id);
        formDataObj.append('title', selectedAction.label);
        formDataObj.append('description', selectedAction.description);
        formDataObj.append('urgency', selectedAction.urgency || 'normal');
        formDataObj.append('requiresROI', String(selectedAction.requiresROI || false));
        formDataObj.append('notes', formData.notes || '');
        
        // Add context information
        formDataObj.append('contextType', selectedContext ? selectedContext.type : 'general');
        if (selectedContext?.id) formDataObj.append('contextId', selectedContext.id);
        if (selectedContext?.providerId) formDataObj.append('providerId', selectedContext.providerId);
        if (selectedContext?.serviceType) formDataObj.append('serviceType', selectedContext.serviceType);
        
        // Add dates
        if (formData.target_date) formDataObj.append('targetDate', formData.target_date);
        if (formData.scheduled_date) formDataObj.append('scheduledDate', formData.scheduled_date);
        
        // Add other form data (excluding files)
        Object.entries(formData).forEach(([key, value]) => {
          if (key !== 'notes' && key !== 'target_date' && key !== 'scheduled_date') {
            const field = selectedAction.fields.find(f => f.name === key);
            if (field?.type === 'file' && value && value.length > 0) {
              // Add files
              Array.from(value as FileList).forEach((file, index) => {
                formDataObj.append(`files`, file);
              });
            } else if (field?.type !== 'file' && value) {
              formDataObj.append(`data.${key}`, String(value));
            }
          }
        });

        // For Submit Documentation, also upload to documents system
        if (selectedAction.id === 'submit_documentation' && formData.files && formData.files.length > 0) {
          // Upload each file to the documents system
          for (const file of Array.from(formData.files as FileList)) {
            const docFormData = new FormData();
            docFormData.append('file', file);
            docFormData.append('clientId', clientId);
            docFormData.append('type', formData.doc_type || 'other');
            docFormData.append('description', `Submitted via ${selectedAction.label} action`);
            
            // Add context information for document
            if (selectedContext) {
              docFormData.append('contextType', selectedContext.type);
              docFormData.append('contextId', selectedContext.id);
            } else {
              docFormData.append('contextType', 'general');
            }
            
            // Upload to documents system
            await fetch(`/api/clients/${clientId}/documents`, {
              method: 'POST',
              body: docFormData
            });
          }
        }

        // Create action
        const response = await fetch(`/api/clients/${clientId}/actions`, {
          method: 'POST',
          body: formDataObj
        });
        
        if (!response.ok) {
          throw new Error('Failed to create action');
        }
        
        const result = await response.json();
        onActionCreated(result.action);
      } else {
        // No files, use JSON
        const actionData = {
          clientId,
          type: selectedAction.id,
          title: selectedAction.label,
          description: selectedAction.description,
          urgency: selectedAction.urgency || 'normal',
          requiresROI: selectedAction.requiresROI || false,
          data: formData,
          notes: formData.notes || '',
          targetDate: formData.target_date || null,
          scheduledDate: formData.scheduled_date || null,
          // Context Information
          contextType: selectedContext ? selectedContext.type : 'general',
          contextId: selectedContext?.id || null,
          providerId: selectedContext?.providerId || null,
          serviceType: selectedContext?.serviceType || null
        };
        
        const response = await fetch(`/api/clients/${clientId}/actions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(actionData)
        });
        
        if (!response.ok) {
          throw new Error('Failed to create action');
        }
        
        const result = await response.json();
        onActionCreated(result.action);
      }
      
      onClose();
      handleBack();
    } catch (error) {
      console.error('Failed to create action:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: ActionField) => {
    const value = formData[field.name] || '';
    const hasError = !!errors[field.name];
    
    const baseClasses = `w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      hasError ? 'border-red-300 focus:border-red-300' : 'border-gray-300 focus:border-transparent'
    }`;

    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className={`${baseClasses} resize-none`}
            />
            {hasError && (
              <p className="text-xs text-red-600">{errors[field.name]}</p>
            )}
          </div>
        );
        
      case 'select':
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className={baseClasses}
            >
              <option value="">Select {field.label.toLowerCase()}...</option>
              {field.options?.map(option => (
                <option key={option} value={option.toLowerCase().replace(/\s+/g, '_')}>
                  {option}
                </option>
              ))}
            </select>
            {hasError && (
              <p className="text-xs text-red-600">{errors[field.name]}</p>
            )}
          </div>
        );
        
      case 'date':
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className={baseClasses}
            />
            {hasError && (
              <p className="text-xs text-red-600">{errors[field.name]}</p>
            )}
          </div>
        );
        
      case 'datetime':
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="datetime-local"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className={baseClasses}
            />
            {hasError && (
              <p className="text-xs text-red-600">{errors[field.name]}</p>
            )}
          </div>
        );
        
      case 'number':
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={baseClasses}
            />
            {hasError && (
              <p className="text-xs text-red-600">{errors[field.name]}</p>
            )}
          </div>
        );
        
      case 'file':
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="file"
              multiple
              onChange={(e) => handleFieldChange(field.name, e.target.files)}
              className={baseClasses}
            />
            {hasError && (
              <p className="text-xs text-red-600">{errors[field.name]}</p>
            )}
          </div>
        );
        
      default:
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={baseClasses}
            />
            {hasError && (
              <p className="text-xs text-red-600">{errors[field.name]}</p>
            )}
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-white border border-slate-200 shadow-2xl rounded-2xl">
        <DialogHeader className="pb-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex-shrink-0">
          <DialogTitle className="flex items-center gap-4 text-2xl font-semibold text-slate-900">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-sm">
              <Plus className="w-5 h-5 text-white" />
            </div>
            {selectedAction ? selectedAction.label : 'Add New Action'}
          </DialogTitle>
          <p className="text-sm text-slate-600 mt-3 leading-relaxed">
            {selectedAction 
              ? 'Fill out the details for this action to create a workflow item'
              : 'Create a new workflow action to manage client communications and tasks'
            }
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-white p-6 min-h-0">
          {!selectedAction ? (
            // Action Selection View
            <div className="space-y-6">
              {/* Context Selection */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary-600" />
                  </div>
                  Choose Context
                </h3>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  Select which service or referral this action relates to:
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-semibold text-slate-700 min-w-[100px]">Context:</label>
                    <select
                      value={selectedContext?.id || 'general'}
                      onChange={(e) => {
                        const contextId = e.target.value;
                        if (contextId === 'general') {
                          setSelectedContext(null);
                        } else {
                          const context = serviceContexts.find(ctx => ctx.id === contextId);
                          setSelectedContext(context || null);
                        }
                      }}
                      className="flex-1 px-4 py-3 border border-slate-300 rounded-lg bg-white hover:border-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all text-sm"
                    >
                      <option value="general">General Client Actions</option>
                      {serviceContexts.length > 0 && (
                        <optgroup label="Referrals">
                          {serviceContexts
                            .filter(ctx => ctx.type === 'referral')
                            .map(context => (
                              <option key={context.id} value={context.id}>
                                📄 {context.label} ({context.status})
                              </option>
                            ))}
                        </optgroup>
                      )}
                      {serviceContexts.filter(ctx => ctx.type === 'connection').length > 0 && (
                        <optgroup label="Active Connections">
                          {serviceContexts
                            .filter(ctx => ctx.type === 'connection')
                            .map(context => (
                              <option key={context.id} value={context.id}>
                                👥 {context.label} ({context.status})
                              </option>
                            ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                  
                  {/* Selected Context Display */}
                  {selectedContext && (
                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          selectedContext.type === 'referral' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          {selectedContext.type === 'referral' ? (
                            <FileText className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Users className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{selectedContext.label}</div>
                          <div className="text-sm text-slate-500">
                            {selectedContext.serviceType || 'Service'} • {selectedContext.status}
                          </div>
                        </div>
                        {selectedContext.pendingActionsCount > 0 && (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                            {selectedContext.pendingActionsCount} pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-slate-600 text-center mb-8 text-base">
                Select an action to add to this client's workflow:
              </p>

              {/* Priority Actions */}
              <div>
                <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                  Priority Actions
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {actionCategories.priority.map(action => (
                    <button
                      key={action.id}
                      onClick={() => handleActionSelect(action)}
                      className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 hover:shadow-sm transition-all duration-200 text-left group"
                    >
                      <div className="text-2xl group-hover:scale-110 transition-transform duration-200">{action.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold text-slate-900">{action.label}</span>
                          {action.urgency && (
                            <Badge 
                              variant={action.urgency === 'urgent' ? 'destructive' : 'secondary'} 
                              className="text-xs font-medium"
                            >
                              {action.urgency.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{action.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Authorization Actions (Case Manager only) */}
              {actionCategories.authorization && (
                <div>
                  <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    Authorization
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {actionCategories.authorization.map(action => (
                      <button
                        key={action.id}
                        onClick={() => handleActionSelect(action)}
                        className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 hover:shadow-sm transition-all duration-200 text-left group"
                      >
                        <div className="text-2xl group-hover:scale-110 transition-transform duration-200">{action.icon}</div>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900 mb-1">{action.label}</div>
                          <p className="text-sm text-slate-600 leading-relaxed">{action.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* General Actions */}
              {actionCategories.general && (
                <div>
                  <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-3">
                    <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-slate-600" />
                    </div>
                    General Actions
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {actionCategories.general.map(action => (
                      <button
                        key={action.id}
                        onClick={() => handleActionSelect(action)}
                        className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 hover:shadow-sm transition-all duration-200 text-left group"
                      >
                        <div className="text-2xl group-hover:scale-110 transition-transform duration-200">{action.icon}</div>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900 mb-1">{action.label}</div>
                          <p className="text-sm text-slate-600 leading-relaxed">{action.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* General Actions */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">General</h3>
                <div className="grid grid-cols-1 gap-2">
                  {actionCategories.general.map(action => (
                    <button
                      key={action.id}
                      onClick={() => handleActionSelect(action)}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                    >
                      <span className="text-lg">{action.icon}</span>
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{action.label}</span>
                        <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Action Form View
            <div className="space-y-6">
              {/* Action Header */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-2xl">{selectedAction.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedAction.label}</h3>
                  <p className="text-sm text-gray-600">{selectedAction.description}</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {selectedAction.fields.map(renderField)}
              </div>

              {/* ROI Warning */}
              {selectedAction.requiresROI && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">ROI Required</span>
                  </div>
                  <p className="text-xs text-amber-600 mt-1">
                    This action requires Release of Information approval to view sensitive details.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div>
            {selectedAction && (
              <Button
                onClick={handleBack}
                variant="outline"
                size="sm"
              >
                ← Back to Actions
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={onClose}
              variant="outline"
            >
              Cancel
            </Button>
            
            {selectedAction && (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Creating...' : 'Create Action'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
