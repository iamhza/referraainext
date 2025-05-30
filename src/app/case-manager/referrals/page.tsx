'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { ReferralsList } from '@/components/referrals/ReferralsList';
import { TopNav } from '@/components/layout/TopNav';
import Link from 'next/link';
import { PlusCircle, Filter, ListFilter, SlidersHorizontal } from 'lucide-react';

export default function ReferralsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50/20">
      <div className="py-8">
        <div className="animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Referrals</h1>
              <p className="text-lg text-gray-600">View and manage all your client referrals</p>
            </div>
            
            <EnhancedButton 
              size="lg" 
              variant="gradient" 
              rounded="full"
              className="shadow-md hover:shadow-lg transition-all duration-200 sm:self-start" 
              asChild>
              <Link href="/case-manager/new-referral">
                <PlusCircle className="mr-2 h-5 w-5" />
                New Referral
              </Link>
            </EnhancedButton>
          </div>
          
          {/* Referrals List */}
          <ReferralsList />
        </div>
      </div>
    </div>
  );
} 