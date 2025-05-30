"use client";
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BackButton({ fallback = '/' }: { fallback?: string }) {
  const router = useRouter();

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  }

  return (
    <Button
      variant="ghost"
      onClick={handleBack}
      className="mb-4 flex items-center gap-2"
      aria-label="Go back"
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </Button>
  );
} 