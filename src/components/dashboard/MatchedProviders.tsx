'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function MatchedProviders() {
  const providers = [
    {
      id: '1',
      name: 'Dr. Sarah Wilson',
      specialty: 'Medical',
      availability: 'Available',
      matches: 5
    },
    {
      id: '2',
      name: 'Dr. Robert Chen',
      specialty: 'Dental',
      availability: 'Busy',
      matches: 3
    },
    {
      id: '3',
      name: 'Dr. Emily Brown',
      specialty: 'Mental Health',
      availability: 'Available',
      matches: 4
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matched Providers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="flex items-center space-x-4 p-4 border rounded-lg"
            >
              <Avatar>
                <AvatarImage src={`/avatars/provider-${provider.id}.png`} />
                <AvatarFallback>
                  {provider.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{provider.name}</p>
                <p className="text-sm text-muted-foreground">{provider.specialty}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={provider.availability === 'Available' ? 'default' : 'secondary'}>
                  {provider.availability}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {provider.matches} matches
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 