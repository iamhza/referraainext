'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { ReferralsTable } from '@/components/tables/ReferralsTable';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function ProviderReferrals() {
  const [providerId, setProviderId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function getSessionAndFetch() {
      setAuthLoading(true);
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAuthLoading(false);
        setProviderId(null);
        return;
      }
      setProviderId(session.user.id);
      setAuthLoading(false);
    }
    getSessionAndFetch();
  }, []);

  if (authLoading) return <div className="p-8 text-center text-muted-foreground">Checking authentication...</div>;
  if (!providerId) return <div className="p-8 text-center text-red-500">Please log in as a provider to view your referrals.</div>;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">
        <div className="w-full max-w-none py-10 px-6 animate-fade-in">
          {/* Shared Referrals Table */}
          <ReferralsTable 
            role="provider"
            providerId={providerId}
          />
        </div>
      </main>
    </div>
  );
}