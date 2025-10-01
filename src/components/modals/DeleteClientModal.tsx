'use client';

import { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeleteClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  clientName: string;
  isDeleting?: boolean;
}

export function DeleteClientModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  clientName, 
  isDeleting = false 
}: DeleteClientModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isDeleting ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative max-w-md w-full mx-4 p-0 overflow-hidden bg-white border-0 shadow-2xl rounded-2xl animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="relative bg-gradient-to-br from-red-50 via-white to-red-50 rounded-2xl">
          {/* Header */}
          <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Delete Client</h2>
                  <p className="text-red-100 text-sm">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 group"
                aria-label="Close modal"
              >
                <X className="w-4 h-4 text-white group-hover:scale-110 transition-transform duration-200" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Are you sure you want to delete this client?
              </h3>
              
              <p className="text-gray-600 mb-4">
                You are about to permanently delete{' '}
                <span className="font-semibold text-gray-900">{clientName}</span>.
                This will remove all their information, referrals, and associated data.
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-red-700 font-medium">
                  ⚠️ This action is permanent and cannot be undone
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1 h-11 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </Button>
              
              <Button
                type="button"
                onClick={onConfirm}
                disabled={isDeleting}
                className="flex-1 h-11 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Client
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
