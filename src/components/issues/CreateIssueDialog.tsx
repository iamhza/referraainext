'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ISSUE_TYPE_CONFIG, type IssueType } from '@/types/issues';

interface CreateIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceRelationshipId: string;
  clientId: string;
  clientName: string;
  providerName: string;
  serviceName: string;
  onSuccess?: () => void;
  // For "Raise Issue from Message" feature
  sourceMessageId?: string;
  initialComment?: string;
}

export function CreateIssueDialog({
  open,
  onOpenChange,
  serviceRelationshipId,
  clientId,
  clientName,
  providerName,
  serviceName,
  onSuccess,
  sourceMessageId,
  initialComment: initialCommentProp,
}: CreateIssueDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [issueType, setIssueType] = useState<IssueType>('QUALITY_CONCERN');
  const [initialComment, setInitialComment] = useState(initialCommentProp || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!initialComment.trim()) {
      toast.error('Please describe the issue');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceRelationshipId,
          clientId,
          type: issueType,
          initialComment: initialComment.trim(),
          sourceMessageId, // For bidirectional linking
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create issue');
      }

      const data = await response.json();

      toast.success('Issue created successfully');
      
      // Close dialog
      onOpenChange(false);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Navigate to workspace
      router.push('/case-manager/workspace');

    } catch (error) {
      console.error('Error creating issue:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create issue');
    } finally {
      setLoading(false);
    }
  };

  // Update initialComment when prop changes (for "raise from message" feature)
  React.useEffect(() => {
    if (initialCommentProp) {
      setInitialComment(initialCommentProp);
    }
  }, [initialCommentProp]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen);
      // Reset form when closing
      if (!newOpen) {
        setIssueType('QUALITY_CONCERN');
        setInitialComment('');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="z-[9999] bg-white border-2 shadow-2xl max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">Raise Issue</DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            Create a collaborative workspace to resolve a service-related problem.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Context Banner */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Client:</span>
                <span className="text-slate-900 font-bold">{clientName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Provider:</span>
                <span className="text-slate-900 font-bold">{providerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Service:</span>
                <span className="text-slate-900 font-bold">{serviceName}</span>
              </div>
              {sourceMessageId && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-blue-300">
                  <span className="text-xs font-semibold text-blue-700">💬 Escalated from message thread</span>
                </div>
              )}
            </div>
          </div>

          {/* Issue Type */}
          <div className="space-y-2">
            <Label htmlFor="issueType" className="text-sm font-bold text-slate-900">
              Issue Type *
            </Label>
            <Select value={issueType} onValueChange={(value) => setIssueType(value as IssueType)}>
              <SelectTrigger 
                id="issueType"
                className="h-10 text-sm bg-white border-2 hover:border-slate-300"
                disabled={loading}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 shadow-lg z-[10000]">
                {(Object.keys(ISSUE_TYPE_CONFIG) as IssueType[]).map((type) => {
                  const config = ISSUE_TYPE_CONFIG[type];
                  return (
                    <SelectItem key={type} value={type} className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className={config.color}>{config.icon}</span>
                        <span className="font-medium">{config.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 mt-1">
              {ISSUE_TYPE_CONFIG[issueType].description}
            </p>
          </div>

          {/* Initial Comment */}
          <div className="space-y-2">
            <Label htmlFor="initialComment" className="text-sm font-bold text-slate-900">
              Describe the Issue *
            </Label>
            <Textarea
              id="initialComment"
              value={initialComment}
              onChange={(e) => setInitialComment(e.target.value)}
              placeholder="Provide details about what needs to be resolved..."
              className="min-h-[120px] bg-white border-2 resize-none text-sm"
              disabled={loading}
              required
            />
            <p className="text-xs text-slate-500">
              This will be the first message in the issue workspace. Be specific and include relevant details.
            </p>
          </div>

          {/* Info Banner */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-3 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-semibold">This will create a collaborative workspace</p>
              <p className="text-xs text-amber-700 mt-1">
                Team members can discuss this issue, add comments, and create tasks to resolve it.
                You'll be redirected to the workspace after creation.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
              className="border-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !initialComment.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Issue...
                </>
              ) : (
                'Create Issue & Open Workspace'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

