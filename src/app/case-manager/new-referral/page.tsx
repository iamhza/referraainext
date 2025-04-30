import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ReferralForm } from '@/components/referrals/ReferralForm';
import { PageTemplate } from '@/components/templates/page-template';

export default async function NewReferralPage() {
  const cookieStore = cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/signin');
  }

  // Verify user role
  if (user.user_metadata.role !== 'case_manager') {
    redirect('/');
  }

  return (
    <PageTemplate
      title="New Referral"
      description="Create a new referral"
      backHref="/case-manager/referrals"
      backLabel="Back to Referrals"
    >
      <ReferralForm />
    </PageTemplate>
  );
} 