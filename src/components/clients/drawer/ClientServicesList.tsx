'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertCircle, Building2, ChevronRight, Calendar, 
  Clock, CheckCircle, XCircle, Pause 
} from 'lucide-react';
import { format } from 'date-fns';
import { ServiceDetailDrawer } from '@/components/services/ServiceDetailDrawer';
import { useClientServices } from './hooks/use-client-services';
import type { ServiceRelationship } from './types';

interface ClientServicesListProps {
  clientId: string;
}

const STATUS_CONFIG = {
  PENDING_START: { 
    label: 'Pending Start', 
    icon: Clock, 
    className: 'bg-amber-100 text-amber-800 border-amber-300' 
  },
  ACTIVE: { 
    label: 'Active', 
    icon: CheckCircle, 
    className: 'bg-green-100 text-green-800 border-green-300' 
  },
  PAUSED: { 
    label: 'Paused', 
    icon: Pause, 
    className: 'bg-slate-100 text-slate-800 border-slate-300' 
  },
  CLOSED: { 
    label: 'Closed', 
    icon: XCircle, 
    className: 'bg-slate-100 text-slate-600 border-slate-300' 
  },
} as const;

export function ClientServicesList({ clientId }: ClientServicesListProps) {
  const { services, loading, error, refetch } = useClientServices(clientId);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [serviceDrawerOpen, setServiceDrawerOpen] = useState(false);

  const handleServiceClick = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setServiceDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (services.length === 0) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="h-12 w-12 text-slate-300 mb-3" />
          <h3 className="font-semibold text-slate-900 mb-1">No Services Yet</h3>
          <p className="text-sm text-slate-500">
            This client doesn&apos;t have any service relationships.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {services.map((service) => (
          <ServiceCard 
            key={service._id} 
            service={service} 
            onClick={() => handleServiceClick(service._id)}
          />
        ))}
      </div>

      {/* Service Detail Drawer */}
      <ServiceDetailDrawer
        serviceRelationshipId={selectedServiceId}
        isOpen={serviceDrawerOpen}
        onClose={() => {
          setServiceDrawerOpen(false);
          setSelectedServiceId(null);
        }}
        onRefresh={refetch}
      />
    </>
  );
}

function ServiceCard({ 
  service, 
  onClick 
}: { 
  service: ServiceRelationship; 
  onClick: () => void;
}) {
  const statusConfig = STATUS_CONFIG[service.status];
  const StatusIcon = statusConfig.icon;

  return (
    <Card 
      className="border-2 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Provider & Service Type */}
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <h3 className="font-semibold text-slate-900 truncate">
                {service.providerName}
              </h3>
            </div>
            
            <div className="text-sm text-slate-600 mb-3">
              {service.serviceType}
            </div>

            {/* Status & Dates */}
            <div className="flex items-center gap-3 text-xs">
              <Badge 
                variant="outline" 
                className={`flex items-center gap-1 ${statusConfig.className}`}
              >
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
              </Badge>
              
              {service.startDate && (
                <div className="flex items-center gap-1 text-slate-500">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(service.startDate), 'MMM dd, yyyy')}
                </div>
              )}
            </div>

            {/* Reason labels */}
            {service.status === 'PENDING_START' && service.pendingReason && (
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  {service.pendingReason.replace(/_/g, ' ')}
                </Badge>
              </div>
            )}
            {service.status === 'PAUSED' && service.pauseReason && (
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  {service.pauseReason.replace(/_/g, ' ')}
                </Badge>
              </div>
            )}
          </div>

          {/* View button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-shrink-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            View
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

