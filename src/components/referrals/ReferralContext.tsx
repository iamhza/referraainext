import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/shared/utils';
import { format } from 'date-fns';
import { 
  Clock,
  ChevronRight,
  User,
  Calendar,
  FileText
} from 'lucide-react';

interface ReferralContextProps {
  referral: any;
  statusConfig: {
    icon: any;
    color: string;
    label: string;
    description: string;
    progressValue: number;
  };
  userRole: 'case_manager' | 'provider' | 'admin';
  onStatusUpdate?: (status: string) => void;
}

export function ReferralContext({
  referral,
  statusConfig,
  userRole,
  onStatusUpdate
}: ReferralContextProps) {
  if (!referral) return null;

  // Extract info from referral
  const clientName = `${referral.clientInfo?.firstName || ''} ${referral.clientInfo?.lastName || ''}`.trim();
  const clientInitials = `${referral.clientInfo?.firstName?.[0] || ''}${referral.clientInfo?.lastName?.[0] || ''}`.toUpperCase();
  const serviceType = referral.serviceDetails?.type || 'Service';
  const submittedDate = referral.createdAt ? format(new Date(referral.createdAt), 'MMM d, yyyy') : 'Unknown';
  const StatusIcon = statusConfig.icon;

  return (
    <Card className={cn(
      "shadow-md bg-white/90 border border-gray-100 overflow-hidden",
      `border-l-4 border-l-${statusConfig.color}-500`
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 bg-blue-100 text-blue-700">
              <AvatarFallback>{clientInitials}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{clientName}</h2>
              <p className="text-gray-500 text-sm">{serviceType}</p>
            </div>
          </div>
          
          <Badge className={cn(
            "px-3 py-1.5 text-sm",
            `bg-${statusConfig.color}-100 text-${statusConfig.color}-800 border-${statusConfig.color}-200`
          )}>
            <StatusIcon className="mr-1 h-3.5 w-3.5 inline" />
            {statusConfig.label}
          </Badge>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>Progress</span>
            <span>{statusConfig.progressValue}%</span>
          </div>
          <Progress 
            value={statusConfig.progressValue} 
            className="h-2" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div>
              <p className="font-medium text-gray-700">Submitted</p>
              <p className="text-gray-500">{submittedDate}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <div>
              <p className="font-medium text-gray-700">Case Manager</p>
              <p className="text-gray-500">{referral.caseManager?.name || 'Not Assigned'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <div>
              <p className="font-medium text-gray-700">Provider</p>
              <p className="text-gray-500">{referral.provider?.name || referral.assignedProvider?.name || 'Not Assigned'}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 