'use client';

/**
 * Provider Directory Integration
 * 
 * Integrates Provider Directory with existing ReferralPanel system
 * Allows case managers to search providers and create referrals directly
 */

import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfessionalDrawer } from '@/components/ui/professional-drawer';
import { ProviderDirectoryPanel } from './ProviderDirectoryPanel';
import { ReferralPanel } from '@/components/referrals/ReferralPanel';
import type { Client as ClientType } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface ProviderDirectoryIntegrationProps {
  selectedClient?: ClientType | null;
  prefilledCounty?: string;
  onReferralCreated?: () => void;
}

/**
 * Integration component that manages both provider directory and referral panels
 * 
 * Usage in BoardView:
 * ```tsx
 * <ProviderDirectoryIntegration 
 *   selectedClient={selectedClient}
 *   prefilledCounty="Hennepin"
 *   onReferralCreated={() => refreshClients()}
 * />
 * ```
 */
export function ProviderDirectoryIntegration({ 
  selectedClient,
  prefilledCounty,
  onReferralCreated 
}: ProviderDirectoryIntegrationProps) {
  const [showProviderDirectory, setShowProviderDirectory] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showReferralPanel, setShowReferralPanel] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const { toast } = useToast();

  const handleCreateReferral = (provider: any) => {
    // Check if client is selected
    if (!selectedClient) {
      toast({
        title: "No Client Selected",
        description: "Please select a client first before creating a referral.",
        variant: "destructive"
      });
      return;
    }

    // Store provider info
    setSelectedProvider(provider);
    
    // Show confirmation toast
    toast({
      title: "Provider Selected",
      description: `Creating referral for ${provider.serviceName}`,
    });
    
    // Close provider directory
    setShowProviderDirectory(false);
    
    // Small delay for UX
    setTimeout(() => {
      // Open referral panel
      setShowReferralPanel(true);
    }, 300);
  };

  const handleReferralSuccess = () => {
    setShowReferralPanel(false);
    setSelectedProvider(null);
    onReferralCreated?.();
  };

  const handleCloseReferral = () => {
    setShowReferralPanel(false);
    setSelectedProvider(null);
  };

  const handleCloseDirectory = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setShowProviderDirectory(false);
      setIsAnimating(false);
    }, 300);
  };

  return (
    <>
      {/* Trigger Button */}
      <Button 
        onClick={() => {
          console.log('Find Providers clicked, current state:', showProviderDirectory);
          setShowProviderDirectory(true);
        }}
        variant="outline"
        className="gap-2"
      >
        <Building2 className="h-4 w-4" />
        Find Providers
      </Button>

      {/* Provider Directory - Matches drawer size and position */}
      {(showProviderDirectory || isAnimating) && (
        <div 
          className="fixed right-0 bottom-0 bg-white border-l border-slate-200"
          style={{
            width: '850px',
            top: '80px',
            zIndex: 50
          }}
        >
          {/* Panel Content - Fades into this zone */}
          <div 
            className="w-full h-full transition-all duration-500 ease-in-out overflow-hidden"
            style={{
              opacity: showProviderDirectory && !isAnimating ? 1 : 0,
              pointerEvents: showProviderDirectory && !isAnimating ? 'auto' : 'none',
              transform: showProviderDirectory && !isAnimating ? 'translateY(0)' : 'translateY(10px)'
            }}
          >
            <ProviderDirectoryPanel
              onCreateReferral={handleCreateReferral}
              prefilledCounty={prefilledCounty}
              onClose={handleCloseDirectory}
            />
          </div>
        </div>
      )}

      {/* Referral Panel (right side) */}
      <ReferralPanel
        isOpen={showReferralPanel}
        onClose={handleCloseReferral}
        selectedClient={selectedClient || null}
        onSuccess={handleReferralSuccess}
      />

      {/* Provider Context - Available to referral form via DOM */}
      {selectedProvider && showReferralPanel && (
        <div
          id="selected-provider-context"
          data-provider={JSON.stringify({
            providerName: selectedProvider.providerName,
            serviceName: selectedProvider.serviceName,
            locationName: selectedProvider.locationName,
            phone: selectedProvider.contact.phone,
            email: selectedProvider.contact.email,
            website: selectedProvider.providerWebsite,
            address: `${selectedProvider.address.city}, ${selectedProvider.address.county} County`,
            fullAddress: selectedProvider.address
          })}
          style={{ display: 'none' }}
        />
      )}
    </>
  );
}

/**
 * INTEGRATION EXAMPLES:
 * 
 * 1. Add to BoardView toolbar:
 * ```tsx
 * <ProviderDirectoryIntegration 
 *   selectedClient={selectedClient}
 *   prefilledCounty={user?.county}
 * />
 * ```
 * 
 * 2. Add to client detail actions:
 * ```tsx
 * <ProviderDirectoryIntegration 
 *   selectedClient={client}
 *   prefilledCounty={client.address?.county}
 * />
 * ```
 * 
 * 3. Standalone in navigation:
 * ```tsx
 * <ProviderDirectoryIntegration />
 * ```
 */

