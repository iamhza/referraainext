'use client';

import EnhancedWorkspace from '@/components/workspace/EnhancedWorkspace';

export default function ProviderWorkspace() {
  return (
    <EnhancedWorkspace 
      userRole="provider"
      backUrl="/provider"
      backLabel="Back to Dashboard"
    />
  );
} 