/**
 * Sandbox Banner Component
 * 
 * Persistent banner displayed at the top of all pages when in sandbox mode.
 * Shows demo status, time remaining, and conversion CTA.
 */

'use client';

import { useSandbox, formatDaysRemaining, getDaysRemainingColor, isExpired, isNearExpiration } from '@/hooks/useSandbox';
import { useTour } from '@/contexts/TourContext';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, Sparkles, X, PlayCircle } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/shared/utils';

export function SandboxBanner() {
  const { sandbox, actions, isLoading } = useSandbox();
  const { startTour } = useTour();
  const [dismissed, setDismissed] = useState(false);
  const [extensionRequested, setExtensionRequested] = useState(false);
  
  // Don't show banner if not in sandbox or user dismissed it
  if (!sandbox.isSandbox || dismissed || isLoading) {
    return null;
  }
  
  const expired = isExpired(sandbox.status);
  const nearExpiration = isNearExpiration(sandbox.daysRemaining);
  
  // ========================================================================
  // HANDLE ACTIONS
  // ========================================================================
  
  const handleStartRealAccount = () => {
    actions.startConversion();
    actions.trackEvent('conversion_clicked', {
      fromBanner: true,
      daysRemaining: sandbox.daysRemaining,
    });
  };
  
  const handleRequestExtension = async () => {
    const success = await actions.requestExtension();
    if (success) {
      setExtensionRequested(true);
      setTimeout(() => setExtensionRequested(false), 3000);
    }
  };
  
  // ========================================================================
  // RENDER
  // ========================================================================
  
  return (
    <div className={cn(
      "relative border-b transition-all",
      expired 
        ? "bg-red-50 border-red-200" 
        : nearExpiration
        ? "bg-orange-50 border-orange-200"
        : "bg-yellow-50 border-yellow-200"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Demo Mode Indicator */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              "flex items-center gap-2 shrink-0",
              expired ? "text-red-700" : nearExpiration ? "text-orange-700" : "text-yellow-700"
            )}>
              {expired ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
              <span className="font-semibold">
                {expired ? 'Demo Expired' : 'Demo Mode'}
              </span>
            </div>
            
            <div className="hidden sm:block h-5 w-px bg-current opacity-20" />
            
            <div className="flex items-center gap-2 text-sm truncate">
              <span className="hidden md:inline text-gray-700">
                {expired 
                  ? 'Your demo has ended'
                  : 'Exploring Referra with sample data'
                }
              </span>
              
              {!expired && sandbox.daysRemaining !== null && (
                <>
                  <span className="hidden md:inline text-gray-400">•</span>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span className={cn(
                      "font-medium",
                      getDaysRemainingColor(sandbox.daysRemaining)
                    )}>
                      {formatDaysRemaining(sandbox.daysRemaining)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Start Tour Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => startTour()}
              className="hidden md:flex border-blue-300 hover:bg-blue-50"
            >
              <PlayCircle className="h-4 w-4 mr-1.5" />
              Start Tour
            </Button>
            
            {/* Extension Button (only for expired sandboxes) */}
            {expired && !extensionRequested && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRequestExtension}
                className="hidden sm:flex border-red-300 hover:bg-red-100"
              >
                <Clock className="h-4 w-4 mr-1.5" />
                Request Extension
              </Button>
            )}
            
            {extensionRequested && (
              <span className="text-sm text-green-700 font-medium">
                ✓ Extension requested
              </span>
            )}
            
            {/* Start Real Account Button */}
            <Button
              size="sm"
              onClick={handleStartRealAccount}
              className={cn(
                "font-semibold shadow-sm",
                expired 
                  ? "bg-red-600 hover:bg-red-700" 
                  : nearExpiration
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-yellow-600 hover:bg-yellow-700"
              )}
            >
              {expired ? 'Go Live Now' : 'Start Real Account'}
            </Button>
            
            {/* Dismiss Button (only if not expired) */}
            {!expired && (
              <button
                onClick={() => setDismissed(true)}
                className="p-1 rounded hover:bg-black/5 transition-colors"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>
        
        {/* Mobile: Full-width CTA */}
        <div className="sm:hidden mt-3">
          <Button
            size="sm"
            onClick={handleStartRealAccount}
            className="w-full bg-yellow-600 hover:bg-yellow-700 font-semibold"
          >
            {expired ? 'Go Live Now' : 'Start Real Account'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPACT VERSION (for mobile/smaller screens)
// ============================================================================

export function SandboxBannerCompact() {
  const { sandbox, actions } = useSandbox();
  
  if (!sandbox.isSandbox) return null;
  
  const expired = isExpired(sandbox.status);
  
  return (
    <div className={cn(
      "sticky top-0 z-40 border-b px-4 py-2",
      expired ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"
    )}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm min-w-0">
          <Sparkles className="h-4 w-4 shrink-0 text-yellow-700" />
          <span className="font-medium text-gray-700 truncate">
            Demo Mode
          </span>
          {!expired && sandbox.daysRemaining !== null && (
            <span className="text-xs text-gray-600">
              ({formatDaysRemaining(sandbox.daysRemaining)})
            </span>
          )}
        </div>
        
        <Button
          size="sm"
          onClick={() => actions.startConversion()}
          className="text-xs px-3 py-1 h-7 bg-yellow-600 hover:bg-yellow-700"
        >
          Go Live
        </Button>
      </div>
    </div>
  );
}

