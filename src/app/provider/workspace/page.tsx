'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProviderWorkspace() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect providers back to their dashboard
    // Provider workspace functionality coming soon
    router.push('/provider');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-900">Redirecting...</h2>
        <p className="text-sm text-slate-600 mt-2">Taking you back to your dashboard</p>
      </div>
    </div>
  );
} 