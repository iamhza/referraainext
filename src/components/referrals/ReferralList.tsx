import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, FileText, Clock, AlertCircle, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface Referral {
  _id: string;
  clientInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    email: string;
    address: string;
  };
  serviceDetails: {
    type: string;
    urgency: string;
  };
  status: string;
  createdAt: string;
}

interface ReferralListProps {
  referrals: Referral[];
  onReferralDeleted: () => void;
}

export function ReferralList({ referrals, onReferralDeleted }: ReferralListProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedReferralId, setSelectedReferralId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'matched':
        return 'bg-purple-100 text-purple-800';
      case 'sent_to_provider':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleDelete = async (referralId: string) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/referrals/${referralId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete referral');
      }

      toast({
        title: "Referral Deleted",
        description: "The referral has been successfully deleted.",
      });

      onReferralDeleted();
    } catch (error) {
      console.error('Error deleting referral:', error);
      toast({
        title: "Error",
        description: "Failed to delete referral. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setSelectedReferralId(null);
    }
  };

  if (!referrals.length) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-10">
          <FileText className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-600">No referrals found</p>
          <p className="text-sm text-gray-500">Create a new referral to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {referrals.map((referral) => (
        <div key={referral._id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{referral.clientInfo.firstName} {referral.clientInfo.lastName}</h3>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  Medium Priority
                </Badge>
                <Badge variant="outline" className="ml-2">
                  {getStatusText(referral.status)}
                </Badge>
              </div>
              
              <p className="text-gray-600">{referral.serviceDetails.type || "No service type specified"}</p>
              
              <div className="flex items-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{referral.clientInfo.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">6513520147</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{referral.clientInfo.address || ", ,"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Created: {format(new Date(referral.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-9" onClick={() => router.push(`/referrals/${referral._id}`)}>
                View Details
              </Button>
              <Button variant="outline" className="h-9 bg-blue-50 text-blue-600 hover:bg-blue-100">
                Update Status
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-9 w-9 rounded-md hover:bg-red-100 hover:text-red-600 border border-gray-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="sm:max-w-[425px]">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                      <Trash2 className="h-5 w-5" />
                      Delete Referral
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>Are you sure you want to delete this referral for:</p>
                      <p className="font-medium text-foreground">
                        {referral.clientInfo.firstName} {referral.clientInfo.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        This action cannot be undone. This will permanently delete the
                        referral and remove all associated data.
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(referral._id)}
                      className="bg-red-600 text-white hover:bg-red-700 transition-colors"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Referral
                        </>
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 