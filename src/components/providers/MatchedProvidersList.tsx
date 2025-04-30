'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Phone } from 'lucide-react';

export function MatchedProvidersList() {
  const providers = [
    {
      id: '1',
      name: 'Dr. Sarah Wilson',
      specialty: 'Medical',
      availability: 'Available',
      matches: 5,
      rating: 4.8,
      location: 'New York, NY'
    },
    {
      id: '2',
      name: 'Dr. Robert Chen',
      specialty: 'Dental',
      availability: 'Busy',
      matches: 3,
      rating: 4.5,
      location: 'Los Angeles, CA'
    },
    {
      id: '3',
      name: 'Dr. Emily Brown',
      specialty: 'Mental Health',
      availability: 'Available',
      matches: 4,
      rating: 4.9,
      location: 'Chicago, IL'
    }
  ];

  return (
    <div className="space-y-4">
      {providers.map((provider) => (
        <Card key={provider.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={`/avatars/provider-${provider.id}.png`} />
                  <AvatarFallback>
                    {provider.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{provider.name}</h3>
                  <p className="text-sm text-muted-foreground">{provider.specialty}</p>
                  <p className="text-sm text-muted-foreground">{provider.location}</p>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <Badge variant={provider.availability === 'Available' ? 'default' : 'secondary'}>
                  {provider.availability}
                </Badge>
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium">{provider.rating}</span>
                  <span className="text-yellow-400">★</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {provider.matches} successful matches
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
                <Button variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 