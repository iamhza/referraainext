'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ProviderFilters() {
  return (
    <div className="flex items-center space-x-4">
      <Select defaultValue="all">
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Specialty" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Specialties</SelectItem>
          <SelectItem value="medical">Medical</SelectItem>
          <SelectItem value="dental">Dental</SelectItem>
          <SelectItem value="mental-health">Mental Health</SelectItem>
        </SelectContent>
      </Select>

      <Select defaultValue="all">
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Availability" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Availability</SelectItem>
          <SelectItem value="available">Available</SelectItem>
          <SelectItem value="busy">Busy</SelectItem>
        </SelectContent>
      </Select>

      <Select defaultValue="rating">
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort By" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="rating">Highest Rated</SelectItem>
          <SelectItem value="matches">Most Matches</SelectItem>
          <SelectItem value="name">Name A-Z</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline">Reset Filters</Button>
    </div>
  );
} 