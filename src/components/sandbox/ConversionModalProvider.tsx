/**
 * ConversionModalProvider
 * 
 * Global provider that manages the ConversionModal state.
 * Listens for 'sandbox-conversion-start' events from useSandbox hook.
 * Add to root layout to enable conversion from anywhere in the app.
 */

'use client';

import { useState, useEffect } from 'react';
import { ConversionModal } from './ConversionModal';
import { useSandbox } from '@/hooks/useSandbox';

export function ConversionModalProvider({ children }: { children: React.ReactNode }) {
  const { sandbox } = useSandbox();
  const [modalOpen, setModalOpen] = useState(false);
  
  useEffect(() => {
    const handleConversionStart = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('🔄 Conversion modal triggered:', customEvent.detail);
      setModalOpen(true);
    };
    
    window.addEventListener('sandbox-conversion-start', handleConversionStart);
    
    return () => {
      window.removeEventListener('sandbox-conversion-start', handleConversionStart);
    };
  }, []);
  
  return (
    <>
      {children}
      
      {/* Global Conversion Modal */}
      {sandbox.isSandbox && sandbox.sandboxOrgId && sandbox.tier && (
        <ConversionModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          sandboxOrgId={sandbox.sandboxOrgId}
          tier={sandbox.tier}
        />
      )}
    </>
  );
}

