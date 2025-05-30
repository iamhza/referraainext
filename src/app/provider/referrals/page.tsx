'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { ReferralsList } from '@/components/referrals/ReferralsList';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

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
    <DashboardLayout>
      <div className="container mx-auto p-4 md:p-6">
        <div className="mb-4">
          <Button variant="outline" asChild>
            <Link href="/provider" className="no-underline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Referrals</h1>
            <p className="text-gray-500">Manage and track your active referrals</p>
          </div>
        </div>
        <ReferralsList providerId={providerId} mode="provider" />
      </div>
    </DashboardLayout>
  );
} 