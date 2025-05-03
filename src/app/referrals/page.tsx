'use client';

import { useState, useEffect } from 'react';
import { ReferralList } from '@/components/referrals/ReferralList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/referrals');
      if (!response.ok) {
        throw new Error('Failed to fetch referrals');
      }
      const data = await response.json();
      setReferrals(data.referrals);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      toast({
        title: "Error",
        description: "Failed to load referrals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const handleNewReferral = () => {
    router.push('/referrals/new');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Referrals</h1>
        <Button 
          onClick={handleNewReferral}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Referral
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <ReferralList 
          referrals={referrals} 
          onReferralDeleted={fetchReferrals}
        />
      )}
    </div>
  );
} 