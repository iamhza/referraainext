import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ReferralsList } from '@/components/referrals/ReferralsList';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { PageTemplate } from '@/components/templates/page-template';

export default async function ReferralsPage() {
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

  const actions = (
    <Button asChild>
      <Link href="/case-manager/new-referral">
        <PlusCircle className="mr-2 h-4 w-4" />
        New Referral
      </Link>
    </Button>
  );

  return (
    <PageTemplate
      title="Referrals"
      description="View and manage your referrals"
      actions={actions}
    >
      <ReferralsList />
    </PageTemplate>
  );
} 