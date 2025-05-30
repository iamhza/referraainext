import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';

interface Referral {
  id: string;
  status: string;
  patientName?: string;
  details?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProviderReferralDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query as { id: string };
  const [referral, setReferral] = useState<Referral | null>(null);
  const [referralLoading, setReferralLoading] = useState(true);

  useEffect(() => {
    async function fetchReferral() {
      setReferralLoading(true);
      try {
        if (!user || !id) return;
        const res = await fetch(`/api/referrals/${id}`);
        if (!res.ok) throw new Error('Failed to fetch referral');
        const data = await res.json();
        setReferral(data.referral || null);
      } catch (err) {
        setReferral(null);
      } finally {
        setReferralLoading(false);
      }
    }
    if (user && id) fetchReferral();
  }, [user, id]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!user) return <div className="p-8 text-center text-red-500">Not authenticated.</div>;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 animate-fade-in">
      <div className="mb-4">
        <Button variant="outline" asChild>
          <Link href="/provider">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle>Referral Details</CardTitle>
          <CardDescription>Referral ID: {id}</CardDescription>
        </CardHeader>
        <CardContent>
          {referralLoading ? (
            <div>Loading referral...</div>
          ) : !referral ? (
            <div className="text-gray-500">Referral not found.</div>
          ) : (
            <div className="space-y-4">
              <div><span className="font-semibold">Status:</span> {referral.status}</div>
              <div><span className="font-semibold">Patient Name:</span> {referral.patientName || '—'}</div>
              <div><span className="font-semibold">Details:</span> {referral.details || '—'}</div>
              <div><span className="font-semibold">Created At:</span> {new Date(referral.createdAt).toLocaleString()}</div>
              <div><span className="font-semibold">Updated At:</span> {new Date(referral.updatedAt).toLocaleString()}</div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                <Button variant="outline" onClick={() => router.back()}>Back</Button>
                <Button variant="outline" asChild className="ml-2">
                  <Link href={`/provider/referrals/${id}/workspace`}>
                    <Users className="mr-2 h-4 w-4" />
                    Collaboration Workspace
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 