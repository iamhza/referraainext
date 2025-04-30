'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function RecentReferrals() {
  const recentReferrals = [
    {
      id: '1',
      name: 'John Doe',
      service: 'Medical',
      status: 'In Progress',
      date: '2024-03-15'
    },
    {
      id: '2',
      name: 'Jane Smith',
      service: 'Dental',
      status: 'Pending',
      date: '2024-03-14'
    },
    {
      id: '3',
      name: 'Mike Johnson',
      service: 'Mental Health',
      status: 'Completed',
      date: '2024-03-13'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Referrals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentReferrals.map((referral) => (
            <div
              key={referral.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <p className="font-medium">{referral.name}</p>
                <p className="text-sm text-muted-foreground">{referral.service}</p>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="secondary">{referral.status}</Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(referral.date).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 