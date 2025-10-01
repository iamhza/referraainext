'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ReferralForm } from '@/components/referrals/ReferralForm';
import { PageTemplate } from '@/components/templates/page-template';

export default function NewReferralPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [prefilledClient, setPrefilledClient] = useState<any>(null);
  const [draftData, setDraftData] = useState<any>(null);
  const [isDraftLoading, setIsDraftLoading] = useState(false);

  // Check for client prefill or draft resume from URL params
  useEffect(() => {
    const clientId = searchParams?.get('clientId');
    const draftId = searchParams?.get('draftId');
    
    if (draftId) {
      // Resume draft
      fetchDraftForResume(draftId);
    } else if (clientId) {
      // Fetch client data for prefilling
      fetchClientForPrefill(clientId);
    }
  }, [searchParams]);

  const fetchClientForPrefill = async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setPrefilledClient(data.client);
      }
    } catch (error) {
      console.error('Failed to fetch client for prefill:', error);
    }
  };

  const fetchDraftForResume = async (draftId: string) => {
    setIsDraftLoading(true);
    try {
      const response = await fetch(`/api/referrals/drafts/${draftId}`);
      if (response.ok) {
        const data = await response.json();
        setDraftData(data.draft);
        
        // If draft has client data, set it for display
        if (data.draft.clientData) {
          setPrefilledClient(data.draft.clientData);
        }
      } else {
        console.error('Failed to fetch draft');
        // Could show a toast here
      }
    } catch (error) {
      console.error('Failed to fetch draft for resume:', error);
    } finally {
      setIsDraftLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!user) {
        console.log('No user, redirecting to signin');
        router.push('/auth/signin');
        return;
      }

      // Check if user has case_manager role
      const userRole = user.user_metadata?.role || user.role;
      if (userRole !== 'case_manager') {
        console.log('User role is not case_manager:', userRole, 'redirecting to /');
        router.push('/');
        return;
      }
    }
  }, [user, loading, router]);

  // Show loading while checking auth or loading draft
  if (loading || !user || isDraftLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isDraftLoading ? 'Loading draft...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Check role again after loading
  const userRole = user.user_metadata?.role || user.role;
  if (userRole !== 'case_manager') {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageTemplate
        title={draftData ? "Resume Draft Referral" : "New Referral"}
        description={draftData ? "Continue working on your saved referral" : "Create a new referral"}
      >
        <ReferralForm 
          prefilledClient={prefilledClient} 
          draftId={draftData?._id}
          draftData={draftData}
        />
      </PageTemplate>
    </div>
  );
} 