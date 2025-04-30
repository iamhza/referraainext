'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export function ClientSearch() {
  return (
    <div className="flex w-full max-w-sm items-center space-x-2">
      <Input
        type="text"
        placeholder="Search clients..."
        className="w-full"
      />
      <Button type="submit" size="icon">
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
} 