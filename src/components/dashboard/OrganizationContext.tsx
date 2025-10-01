'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, User } from 'lucide-react';

interface OrganizationContextProps {
  className?: string;
  compact?: boolean;
}

export function OrganizationContext({ className, compact = false }: OrganizationContextProps) {
  const { user } = useAuth();

  if (!user?.organization && !user?.org_id) {
    return null;
  }

  const organizationName = user?.organization?.name || 'Your Organization';
  const teamName = user?.team?.name;
  const userRole = user?.role || user?.user_metadata?.role;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <Building2 className="h-4 w-4 text-blue-500" />
        <span className="text-gray-700 font-medium">{organizationName}</span>
        {teamName && (
          <>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">{teamName}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <Card className={`bg-blue-50 border-blue-200 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm">{organizationName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {userRole === 'case_manager' ? 'Case Manager' : 
                 userRole === 'supervisor' ? 'Supervisor' : 
                 userRole === 'org_admin' ? 'Organization Admin' : 
                 'Team Member'}
              </Badge>
              {teamName && (
                <Badge variant="outline" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {teamName}
                </Badge>
              )}
            </div>
            {user?.org_id && (
              <p className="text-xs text-gray-500 mt-2">
                Connected to organizational workspace
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
