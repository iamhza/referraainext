import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { PageHeader } from '@/components/ui/page-header';

export default async function SettingsPage() {
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
    <Container>
      <PageHeader 
        title="Settings"
        description="Manage your account settings">
      </PageHeader>
      <div className="space-y-4">
        {/* Settings components will be added here */}
        <div className="text-center text-gray-500 py-8">
          Settings functionality coming soon
        </div>
      </div>
    </Container>
  );
} 