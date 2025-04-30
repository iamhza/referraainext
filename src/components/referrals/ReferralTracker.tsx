'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface ReferralTrackerProps {
  referralId: string;
}

interface TrackerStep {
  id: string;
  title: string;
  status: 'completed' | 'in_progress' | 'pending';
  date?: string;
  description?: string;
}

export function ReferralTracker({ referralId }: ReferralTrackerProps) {
  const [steps, setSteps] = useState<TrackerStep[]>([
    {
      id: '1',
      title: 'Referral Created',
      status: 'completed',
      description: 'Initial referral submitted'
    },
    {
      id: '2',
      title: 'Provider Assigned',
      status: 'in_progress',
      description: 'Provider review in progress'
    },
    {
      id: '3',
      title: 'Provider Review',
      status: 'pending',
      description: 'Awaiting provider response'
    },
    {
      id: '4',
      title: 'Service Scheduled',
      status: 'pending',
      description: 'Service date to be determined'
    },
    {
      id: '5',
      title: 'Service Completed',
      status: 'pending',
      description: 'Service completion pending'
    }
  ]);

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Calculate progress based on completed steps
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    const totalSteps = steps.length;
    setProgress((completedSteps / totalSteps) * 100);
  }, [steps]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Referral Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Progress value={progress} className="h-2" />
          
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="flex items-start space-x-4"
              >
                <div className="flex-shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.status === 'completed'
                        ? 'bg-green-100 text-green-600'
                        : step.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">{step.title}</h3>
                    <Badge
                      variant={
                        step.status === 'completed'
                          ? 'success'
                          : step.status === 'in_progress'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {step.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  {step.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  )}
                  {step.date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(step.date), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 