'use client';

import React, { useState, useEffect } from 'react';
import { FileText, ExternalLink, Trash2, Loader2, Clock, User, Upload, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface InlineDocumentsExpansionProps {
  serviceRelationshipId: string;
  clientId: string;
}

export function InlineDocumentsExpansion({ serviceRelationshipId, clientId }: InlineDocumentsExpansionProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch documents for this service relationship
  useEffect(() => {
    async function fetchDocuments() {
      if (!clientId || !serviceRelationshipId) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/clients/${clientId}/documents`);
        if (response.ok) {
          const data = await response.json();
          // Filter to only documents for this service relationship
          const filteredDocs = (data.documents || []).filter(
            (doc: any) => doc.contextId === serviceRelationshipId
          );
          setDocuments(filteredDocs);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDocuments();
  }, [clientId, serviceRelationshipId]);

  // Handle document deletion
  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Delete this document? This cannot be undone.')) return;

    setIsDeleting(documentId);
    try {
      const response = await fetch(`/api/clients/${clientId}/documents?documentId=${documentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc._id !== documentId));
        toast({
          title: "Success",
          description: "Document deleted successfully"
        });
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const getDocumentIcon = (type: string) => {
    return <FileText className="w-4 h-4 text-blue-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="py-4 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        <span className="ml-2 text-sm text-slate-600">Loading documents...</span>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-slate-500">
        No documents for this service
      </div>
    );
  }

  return (
    <div className="space-y-2 py-3">
      {documents.map((doc) => (
        <div
          key={doc._id}
          className="bg-white border border-slate-200 rounded-lg p-3 hover:shadow-sm transition-all duration-200 group"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getDocumentIcon(doc.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="font-semibold text-xs text-slate-900 truncate mb-1">
                {doc.name}
              </h5>
              {doc.description && (
                <p className="text-xs text-slate-600 line-clamp-1 mb-2">
                  {doc.description}
                </p>
              )}
              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span className="font-medium">{doc.uploadedBy}</span>
                </div>
                <span className="text-slate-300">•</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDistanceToNow(new Date(doc.uploadedAt), { addSuffix: true })}</span>
                </div>
                <span className="text-slate-300">•</span>
                <span className="font-medium">{formatFileSize(doc.size)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(`/api/documents/secure/${doc.accessToken}`, '_blank')}
                className="h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-600"
                title="View document"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteDocument(doc._id)}
                disabled={isDeleting === doc._id}
                className="h-6 w-6 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                title="Delete document"
              >
                {isDeleting === doc._id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

