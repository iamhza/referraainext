'use client';

import EnhancedWorkspace from '@/components/workspace/EnhancedWorkspace';

export default function CaseManagerWorkspace() {
  return (
    <EnhancedWorkspace 
      userRole="case_manager"
      backUrl="/case-manager"
      backLabel="Back to Dashboard"
    />
  );
} 