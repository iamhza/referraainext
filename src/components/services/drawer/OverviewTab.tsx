'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, User, Calendar, Shield, AlertTriangle, 
  CheckCircle, Clock, FileText, Mail, Phone 
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { getServiceRelationshipStatusConfig } from '@/types/service-relationships';
import type { ServiceDetails } from './types';

interface OverviewTabProps {
  service: ServiceDetails;
  onRaiseIssue?: () => void;
}

export function OverviewTab({ service, onRaiseIssue }: OverviewTabProps) {
  const statusConfig = getServiceRelationshipStatusConfig(service.status as any);

  return (
    <div className="space-y-4">
      {/* Service Info */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            Service Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <InfoRow label="Provider" value={service.providerName} icon={<Building2 className="h-4 w-4" />} />
          <InfoRow label="Service Type" value={service.serviceName || service.serviceType} />
          <InfoRow 
            label="Status" 
            value={
              <Badge 
                variant="outline" 
                className={statusConfig.className}
              >
                {statusConfig.icon && <statusConfig.icon className="h-3 w-3 mr-1" />}
                {statusConfig.label}
              </Badge>
            } 
          />
          {service.startDate && (
            <InfoRow 
              label="Start Date" 
              value={format(new Date(service.startDate), 'MMM dd, yyyy')} 
              icon={<Calendar className="h-4 w-4" />}
            />
          )}
          {service.lastActivityAt && (
            <InfoRow 
              label="Last Activity" 
              value={formatDistanceToNow(new Date(service.lastActivityAt), { addSuffix: true })} 
              icon={<Clock className="h-4 w-4" />}
            />
          )}
        </CardContent>
      </Card>

      {/* Status Reasons */}
      {(service.pendingReason || service.pauseReason || service.closeReason) && (
        <Card className="border-2 border-amber-200 bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-900 mb-1">
                  {service.pendingReason && 'Pending Reason'}
                  {service.pauseReason && 'Paused Reason'}
                  {service.closeReason && 'Close Reason'}
                </div>
                <div className="text-sm text-amber-800">
                  {(service.pendingReason || service.pauseReason || service.closeReason)?.replace(/_/g, ' ')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Provider Contact */}
      {(service.providerEmail || service.providerPhone) && (
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              Provider Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {service.providerEmail && (
              <InfoRow 
                label="Email" 
                value={
                  <a href={`mailto:${service.providerEmail}`} className="text-blue-600 hover:underline">
                    {service.providerEmail}
                  </a>
                } 
                icon={<Mail className="h-4 w-4" />}
              />
            )}
            {service.providerPhone && (
              <InfoRow 
                label="Phone" 
                value={
                  <a href={`tel:${service.providerPhone}`} className="text-blue-600 hover:underline">
                    {service.providerPhone}
                  </a>
                } 
                icon={<Phone className="h-4 w-4" />}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Authorization */}
      {service.authorization && (
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              Authorization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow 
              label="Status" 
              value={
                <Badge 
                  variant="outline"
                  className={
                    service.authorization.status === 'APPROVED' 
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : service.authorization.status === 'EXPIRED'
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }
                >
                  {service.authorization.status}
                </Badge>
              } 
            />
            {service.authorization.startDate && service.authorization.endDate && (
              <InfoRow 
                label="Valid Period" 
                value={`${format(new Date(service.authorization.startDate), 'MMM dd, yyyy')} - ${format(new Date(service.authorization.endDate), 'MMM dd, yyyy')}`} 
              />
            )}
            {service.authorization.units && (
              <InfoRow label="Units" value={`${service.authorization.units} units`} />
            )}
            {service.authorization.daysUntilExpiration !== undefined && service.authorization.daysUntilExpiration <= 30 && (
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    Expires in {service.authorization.daysUntilExpiration} days
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Activity Counts */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard 
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Issues"
          value={service.activeIssuesCount || 0}
          onClick={onRaiseIssue}
          color="amber"
        />
        <StatCard 
          icon={<CheckCircle className="h-5 w-5" />}
          label="Actions"
          value={service.openActionsCount || 0}
          color="blue"
        />
        <StatCard 
          icon={<FileText className="h-5 w-5" />}
          label="Documents"
          value={service.documentsCount || 0}
          color="slate"
        />
      </div>

      {/* Quick Actions */}
      <Card className="border-2 bg-slate-50">
        <CardContent className="pt-4">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={onRaiseIssue}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Raise Issue
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <FileText className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ 
  icon, 
  label, 
  value 
}: { 
  icon?: React.ReactNode; 
  label: string; 
  value: React.ReactNode; 
}) {
  return (
    <div className="flex items-start gap-3">
      {icon && <div className="text-slate-400 mt-0.5">{icon}</div>}
      <div className="flex-1 min-w-0">
        <div className="text-slate-500 text-xs mb-0.5">{label}</div>
        <div className="text-slate-900 font-medium break-words">{value}</div>
      </div>
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  onClick,
  color = 'slate' 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number;
  onClick?: () => void;
  color?: 'amber' | 'blue' | 'slate';
}) {
  const colorClasses = {
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    slate: 'bg-slate-50 border-slate-200 text-slate-900',
  };

  return (
    <Card 
      className={`border-2 ${colorClasses[color]} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <CardContent className="pt-4 text-center">
        <div className="flex justify-center mb-2">{icon}</div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <div className="text-xs font-medium">{label}</div>
      </CardContent>
    </Card>
  );
}

