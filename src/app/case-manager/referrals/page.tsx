'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ReferralsTable } from '@/components/tables/ReferralsTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Clock, 
  Edit, 
  Trash2, 
  Plus,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Draft {
  _id: string;
  clientName: string;
  clientId?: string;
  serviceType: string;
  urgency: 'low' | 'medium' | 'high';
  currentStep: number;
  lastSaved: string;
  createdAt: string;
}

export default function CaseManagerReferralsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'referrals' | 'drafts'>('referrals');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<Draft | null>(null);
  const { toast } = useToast();

  const handleCreateReferral = () => {
    router.push('/case-manager/new-referral');
  };

  const fetchDrafts = async () => {
    try {
      setDraftsLoading(true);
      const response = await fetch('/api/referrals/drafts');
      if (!response.ok) throw new Error('Failed to fetch drafts');
      
      const data = await response.json();
      setDrafts(data.drafts || []);
    } catch (error) {
      console.error('Error fetching drafts:', error);
      toast({
        title: "Error",
        description: "Failed to load drafts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDraftsLoading(false);
    }
  };

  const handleDeleteDraft = async (draft: Draft) => {
    setDraftToDelete(draft);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!draftToDelete) return;
    
    try {
      setDeletingId(draftToDelete._id);
      const response = await fetch(`/api/referrals/drafts/${draftToDelete._id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete draft');
      
      setDrafts(drafts.filter(d => d._id !== draftToDelete._id));
      toast({
        title: "Draft Deleted",
        description: "The draft has been permanently deleted.",
      });
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast({
        title: "Error",
        description: "Failed to delete draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
      setDeleteDialogOpen(false);
      setDraftToDelete(null);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStepProgress = (step: number) => {
    return Math.round((step / 4) * 100);
  };

  // Load drafts when switching to drafts tab
  // Fetch drafts on component mount
  useEffect(() => {
    fetchDrafts();
  }, []);

  const handleTabChange = (tab: 'referrals' | 'drafts') => {
    setActiveTab(tab);
    if (tab === 'drafts' && drafts.length === 0) {
      fetchDrafts();
    }
  };

  return (
    <div className="w-full max-w-none py-10 px-6 animate-fade-in">
      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          <Button
            variant={activeTab === 'referrals' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleTabChange('referrals')}
            className={activeTab === 'referrals' 
              ? 'bg-secondary-500 hover:bg-secondary-600 text-white' 
              : 'text-gray-600 hover:text-gray-700 hover:bg-accent-100'
            }
          >
            <FileText className="w-4 h-4 mr-2" />
            Active Referrals
          </Button>
          <Button
            variant={activeTab === 'drafts' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleTabChange('drafts')}
            className={activeTab === 'drafts' 
              ? 'bg-secondary-500 hover:bg-secondary-600 text-white' 
              : 'text-gray-600 hover:text-gray-700 hover:bg-accent-100'
            }
          >
            <Clock className="w-4 h-4 mr-2" />
            Drafts ({drafts.length})
          </Button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'referrals' ? (
        <ReferralsTable 
          role="case_manager"
          showNetworkColumn={true}
          onCreateClick={handleCreateReferral}
        />
      ) : (
        <div className="space-y-6">
          {/* Drafts Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Draft Referrals</h1>
              <p className="text-gray-600">
                Continue working on your saved referral drafts.
              </p>
            </div>
          </div>

          {/* Drafts Content */}
          {draftsLoading ? (
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="pt-8 pb-8">
                <div className="text-center">
                  <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-secondary-500" />
                  <p className="text-gray-600">Loading drafts...</p>
                </div>
              </CardContent>
            </Card>
          ) : drafts.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
              <CardContent className="pt-8 pb-8">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No drafts yet</h3>
                  <p className="text-gray-600 mb-6">
                    Your saved referral drafts will appear here. Start creating a referral to save your first draft.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {drafts.map((draft) => (
                <Card key={draft._id} className="bg-white border-gray-200 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                          {draft.clientName}
                        </CardTitle>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className={getUrgencyColor(draft.urgency)}>
                            {draft.urgency.charAt(0).toUpperCase() + draft.urgency.slice(1)} Priority
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDraft(draft)}
                        disabled={deletingId === draft._id}
                        className="text-gray-400 hover:text-red-500"
                      >
                        {deletingId === draft._id ? (
                          <Clock className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <FileText className="w-4 h-4 mr-2" />
                        <span>{draft.serviceType || 'Service not specified'}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>Step {draft.currentStep}/4 ({getStepProgress(draft.currentStep)}% complete)</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>
                          Last saved {formatDistanceToNow(new Date(draft.lastSaved), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-secondary-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getStepProgress(draft.currentStep)}%` }}
                        />
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button 
                          asChild 
                          className="flex-1 bg-secondary-500 hover:bg-secondary-600 text-white"
                        >
                          <Link href={`/case-manager/new-referral?draftId=${draft._id}`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Continue
                          </Link>
                        </Button>
                        
                        {draft.clientId && (
                          <Button 
                            asChild 
                            variant="outline" 
                            size="sm"
                          >
                            <Link href={`/case-manager/clients/${draft.clientId}`}>
                              <User className="w-4 h-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this draft? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}