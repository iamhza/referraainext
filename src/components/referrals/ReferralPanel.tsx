'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, ArrowLeft, CheckCircle, Sparkles } from 'lucide-react';
import { ReferralFormPanel } from './ReferralFormPanel';
import { Button } from '@/components/ui/button';
import type { Client as ClientType } from '@/types';

interface ReferralPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClient: ClientType | null;
  onSuccess?: () => void;
}

export function ReferralPanel({ 
  isOpen, 
  onClose, 
  selectedClient,
  onSuccess 
}: ReferralPanelProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Enhanced close handler with animation
  const handleClose = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      onClose();
      setIsAnimating(false);
      setShowSuccess(false);
    }, 300);
  }, [onClose]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, handleClose]);

  // Handle form completion
  const handleFormComplete = useCallback(() => {
    setShowSuccess(true);
    
    // Auto-close after success celebration
    setTimeout(() => {
      handleClose();
      onSuccess?.();
    }, 2500);
  }, [handleClose, onSuccess]);

  if (!isOpen && !isAnimating) return null;

  return (
    <>
      {/* Referral Panel - Matches drawer size and position */}
      <div 
        className="fixed right-0 bottom-0 bg-white border-l border-slate-200"
        style={{
          width: '850px',
          top: '80px', // Below the top bar
          zIndex: 30
        }}
      >
        {/* Panel Content - Fades into this zone */}
        <div 
          className="w-full h-full transition-all duration-500 ease-in-out overflow-hidden"
          style={{
            opacity: isOpen && !isAnimating ? 1 : 0,
            pointerEvents: isOpen && !isAnimating ? 'auto' : 'none',
            transform: isOpen && !isAnimating ? 'translateY(0)' : 'translateY(10px)'
          }}
        >
        {/* Success State Overlay */}
        {showSuccess && (
          <div className="absolute inset-0 bg-white z-50 flex items-center justify-center">
            <div className="text-center animate-in fade-in duration-500">
              <div className="relative mb-6">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto animate-in zoom-in duration-700" />
                <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Referral Created!
              </h3>
              <p className="text-gray-600">
                Successfully submitted referral for {selectedClient?.firstName} {selectedClient?.lastName}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col h-full">
          {/* Compact Header - Matches drawer style */}
          <div className="flex-shrink-0 px-5 py-4 border-b border-gray-200/80 bg-gradient-to-r from-gray-50/50 to-white">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center space-x-2.5">
                <div className="w-1.5 h-7 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full" />
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Create Referral
                  </h2>
                  {selectedClient && (
                    <p className="text-xs text-gray-600 mt-0.5">
                      for {selectedClient.firstName} {selectedClient.lastName}
                    </p>
                  )}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 group rounded-full w-7 h-7 p-0"
              >
                <X className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
              </Button>
            </div>

            {/* Client Context Card - Compact */}
            {selectedClient && (
              <div className="bg-white border border-gray-200/60 rounded-lg p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                      <span className="text-blue-700 font-semibold text-xs">
                        {selectedClient.firstName?.[0]}{selectedClient.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {selectedClient.firstName} {selectedClient.lastName}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {selectedClient.dateOfBirth ? 
                          `DOB: ${new Date(selectedClient.dateOfBirth).toLocaleDateString()}` : 
                          'Client profile'
                        }
                      </p>
                    </div>
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    selectedClient.status === 'ACTIVE_STABLE' 
                      ? 'bg-green-100 text-green-700'
                      : selectedClient.status === 'ACTIVE_FRUSTRATED'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedClient.status === 'UNPLACED_NEW' ? 'Unplaced' :
                     selectedClient.status === 'ACTIVE_STABLE' ? 'Stable' : 'Needs Attention'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-hidden">
            <ReferralFormPanel
              prefilledClient={selectedClient}
              onComplete={handleFormComplete}
            />
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
