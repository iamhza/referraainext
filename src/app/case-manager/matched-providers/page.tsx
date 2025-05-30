'use client';

import { Container } from '@/components/ui/container';
import { PageHeader } from '@/components/ui/page-header';
import { MatchedProvidersList } from '@/components/providers/MatchedProvidersList';
import { ProviderFilters } from '@/components/providers/ProviderFilters';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Calendar, Phone, Mail } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { EnhancedButton } from '@/components/ui/enhanced-button';
import Link from 'next/link';
import { BackButton } from '@/components/ui/BackButton';

// Featured providers data - will come from API
const featuredProviders = [
  {
    id: 'PROV-1',
    name: 'Dr. Sarah Williams',
    organization: 'HealthFirst Clinic',
    image: '/providers/provider1.jpg',
    specialty: 'Mental Health',
    rating: 4.9,
    reviewCount: 128,
    distance: '2.3 miles',
    availability: 'High',
    nextAvailable: '2024-04-20',
    phone: '(612) 555-0123',
    email: 'swilliams@healthfirst.com'
  },
  {
    id: 'PROV-2',
    name: 'Dr. Michael Chen',
    organization: 'Community Health Partners',
    image: '/providers/provider2.jpg',
    specialty: 'Physical Therapy',
    rating: 4.8,
    reviewCount: 96,
    distance: '3.7 miles',
    availability: 'Medium',
    nextAvailable: '2024-04-22',
    phone: '(612) 555-0124',
    email: 'mchen@chpartners.com'
  },
  {
    id: 'PROV-3',
    name: 'Dr. Emily Rodriguez',
    organization: 'Wellness Center',
    image: '/providers/provider3.jpg',
    specialty: 'Medical Care',
    rating: 4.7,
    reviewCount: 156,
    distance: '1.5 miles',
    availability: 'High',
    nextAvailable: '2024-04-21',
    phone: '(612) 555-0125',
    email: 'erodriguez@wellness.com'
  }
];

export default function MatchedProvidersPage() {
  return (
    <div>
      <BackButton fallback="/case-manager/referrals" />
      <Container>
        <PageHeader 
          title="Matched Providers"
          description="View and manage provider matches">
        </PageHeader>

        {/* Featured Providers Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
              Featured Providers
            </CardTitle>
            <CardDescription>Top-rated providers in your network</CardDescription>
          </CardHeader>
          <CardContent>
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {featuredProviders.map((provider) => (
                  <CarouselItem key={provider.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                    <Card className="h-full">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-lg">{provider.name}</h3>
                            <p className="text-sm text-muted-foreground">{provider.organization}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{provider.rating}</span>
                            <span className="text-muted-foreground">({provider.reviewCount})</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{provider.distance}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>Next available: {new Date(provider.nextAvailable).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{provider.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{provider.email}</span>
                            </div>
                          </div>
                          <div className="pt-3">
                            <Badge variant={provider.availability === 'High' ? 'default' : 'secondary'}>
                              {provider.availability} Availability
                            </Badge>
                          </div>
                          <EnhancedButton 
                            variant="gradient" 
                            className="w-full mt-4" 
                            asChild
                          >
                            <Link href={`/case-manager/providers/${provider.id}`}>
                              View Profile
                            </Link>
                          </EnhancedButton>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <ProviderFilters />
          <MatchedProvidersList />
        </div>
      </Container>
    </div>
  );
} 