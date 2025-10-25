'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, Mail, Phone, MapPin, CreditCard, Shield, 
  Heart, Activity, Languages, Calendar 
} from 'lucide-react';
import { format } from 'date-fns';
import type { Client } from './types';

interface ClientProfileSectionProps {
  client: Client;
}

export function ClientProfileSection({ client }: ClientProfileSectionProps) {
  return (
    <div className="space-y-4">
      {/* Identity & Contact */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <InfoRow 
            icon={<Calendar className="h-4 w-4" />}
            label="Date of Birth" 
            value={client.identity.dob ? format(new Date(client.identity.dob), 'MMM dd, yyyy') : 'N/A'} 
          />
          {client.identity.externalId && (
            <InfoRow 
              icon={<Shield className="h-4 w-4" />}
              label="PMI Number" 
              value={client.identity.externalId} 
            />
          )}
          <InfoRow 
            icon={<Mail className="h-4 w-4" />}
            label="Email" 
            value={client.contact.email || 'N/A'} 
          />
          <InfoRow 
            icon={<Phone className="h-4 w-4" />}
            label="Phone" 
            value={client.contact.phone || 'N/A'} 
          />
        </CardContent>
      </Card>

      {/* Address */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            Address
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="text-slate-700">
            <div>{client.contact.address.line1}</div>
            <div>
              {client.contact.address.city}, {client.contact.address.state} {client.contact.address.zip}
            </div>
            {client.contact.address.county && (
              <div className="text-slate-500 mt-1">County: {client.contact.address.county}</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Insurance */}
      {client.insurance && (
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              Insurance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow 
              label="Type" 
              value={
                <Badge variant="outline" className="font-medium">
                  {client.insurance.type.toUpperCase()}
                </Badge>
              } 
            />
            {client.insurance.provider && (
              <InfoRow label="Provider" value={client.insurance.provider} />
            )}
            {client.insurance.number && (
              <InfoRow label="Policy Number" value={client.insurance.number} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Clinical Information */}
      {(client.clinical.primaryDiagnosis || client.clinical.mentalHealthNeeds || client.clinical.physicalLimitations) && (
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4 text-blue-600" />
              Clinical Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {client.clinical.primaryDiagnosis && (
              <InfoRow 
                icon={<Activity className="h-4 w-4" />}
                label="Primary Diagnosis" 
                value={client.clinical.primaryDiagnosis} 
              />
            )}
            {client.clinical.mentalHealthNeeds && (
              <InfoRow 
                label="Mental Health Needs" 
                value={client.clinical.mentalHealthNeeds} 
              />
            )}
            {client.clinical.physicalLimitations && (
              <InfoRow 
                label="Physical Limitations" 
                value={client.clinical.physicalLimitations} 
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Language & Accessibility */}
      {(client.bands.language || client.bands.accessibility) && (
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Languages className="h-4 w-4 text-blue-600" />
              Language & Accessibility
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {client.bands.language && (
              <InfoRow label="Primary Language" value={client.bands.language} />
            )}
            {client.bands.accessibility && client.bands.accessibility.length > 0 && (
              <div>
                <div className="text-slate-500 mb-2">Accessibility Needs:</div>
                <div className="flex flex-wrap gap-2">
                  {client.bands.accessibility.map((need) => (
                    <Badge key={need} variant="secondary" className="text-xs">
                      {need}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper component for consistent info rows
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

