import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export type ProviderPlan = 'free' | 'pro' | 'scale';

export interface ProviderSubscription {
  user_id: string;
  plan: ProviderPlan;
  submissions_quota: number;
  submissions_used: number;
  max_clients: number;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

export const PLAN_LIMITS = {
  free: { submissions_quota: 0, max_clients: 3 },
  pro: { submissions_quota: 10, max_clients: 999999 },
  scale: { submissions_quota: 999999, max_clients: 999999 },
} as const;

export async function getSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient(
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
}

export async function getProviderSubscription(userId: string): Promise<ProviderSubscription | null> {
  const supabase = await getSupabaseClient();
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    console.error('Error fetching subscription:', error);
    return null;
  }

  return data;
}

export async function ensureProviderSubscription(userId: string): Promise<ProviderSubscription> {
  let subscription = await getProviderSubscription(userId);
  
  if (!subscription) {
    const supabase = await getSupabaseClient();
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    const newSub = {
      user_id: userId,
      plan: 'free' as ProviderPlan,
      submissions_quota: PLAN_LIMITS.free.submissions_quota,
      submissions_used: 0,
      max_clients: PLAN_LIMITS.free.max_clients,
      period_start: now.toISOString(),
      period_end: periodEnd.toISOString(),
    };

    const { data, error } = await supabase
      .from('subscriptions')
      .insert(newSub)
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }

    subscription = data;
  }

  return subscription;
}

export async function incrementSubmissionUsage(userId: string): Promise<void> {
  const supabase = await getSupabaseClient();
  
  const { error } = await supabase
    .from('subscriptions')
    .update({ 
      submissions_used: supabase.sql`submissions_used + 1`,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error incrementing submission usage:', error);
    throw new Error('Failed to update submission usage');
  }
}

export function canSubmitToNetwork(subscription: ProviderSubscription): boolean {
  if (subscription.plan === 'free') return false; // Free tier can't access network
  if (subscription.plan === 'scale') return true; // Unlimited
  
  // Pro tier: check quota
  return subscription.submissions_used < subscription.submissions_quota;
}

export function isOverClientLimit(subscription: ProviderSubscription, currentClientCount: number): boolean {
  return currentClientCount > subscription.max_clients;
}
