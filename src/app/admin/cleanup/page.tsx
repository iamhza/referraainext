'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Search, AlertTriangle } from 'lucide-react';

export default function CleanupPage() {
  const [clientId, setClientId] = useState('68a68aeb92591f7ae022636f');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const inspectClient = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/admin/cleanup-client?clientId=${clientId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to inspect client');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteClient = async (force = false) => {
    if (!confirm(`Are you sure you want to ${force ? 'force ' : ''}delete this client? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/cleanup-client?clientId=${clientId}&force=${force}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete client');
      }

      setResult({ deleteSuccess: true, ...data });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Client Cleanup Tool</h1>
        <p className="text-gray-600">Debug and cleanup problematic client records</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Inspect Client
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Enter client ID"
              className="flex-1"
            />
            <Button onClick={inspectClient} disabled={loading || !clientId}>
              {loading ? 'Inspecting...' : 'Inspect'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && !result.deleteSuccess && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>ID:</strong> {result.client.id}
              </div>
              <div>
                <strong>Name:</strong> {result.client.firstName} {result.client.lastName}
              </div>
              <div>
                <strong>PMI:</strong> {result.client.pmi || 'None'}
              </div>
              <div>
                <strong>Date of Birth:</strong> {result.client.dateOfBirth || 'None'}
              </div>
              <div>
                <strong>Created By:</strong> {result.client.createdBy || 'Unknown'}
              </div>
              <div>
                <strong>Source:</strong> {result.client.source || 'Unknown'}
              </div>
              <div>
                <strong>Case Manager ID:</strong> {result.client.caseManagerId || 'None'}
              </div>
              <div>
                <strong>Current Provider:</strong> {result.client.currentProvider || 'None'}
              </div>
              <div>
                <strong>Has Pending Connection:</strong> {result.client.hasPendingConnection ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Related Connections:</strong> {result.relatedConnections}
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h4 className="font-semibold mb-2">Deletion Permissions:</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Is Admin:</strong> {result.canDelete.isAdmin ? '✅ Yes' : '❌ No'}
                </div>
                <div>
                  <strong>Is Creator:</strong> {result.canDelete.isCreator ? '✅ Yes' : '❌ No'}
                </div>
                <div>
                  <strong>Is Case Manager:</strong> {result.canDelete.isCaseManager ? '✅ Yes' : '❌ No'}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button 
                onClick={() => deleteClient(false)} 
                disabled={loading}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Client
              </Button>
              <Button 
                onClick={() => deleteClient(true)} 
                disabled={loading}
                variant="destructive"
                className="flex items-center gap-2 bg-red-700 hover:bg-red-800"
              >
                <Trash2 className="w-4 h-4" />
                Force Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {result && result.deleteSuccess && (
        <Alert className="mb-6">
          <AlertDescription>
            ✅ Client deleted successfully! 
            <br />• Client deleted: {result.clientDeleted}
            <br />• Pending connections cleaned: {result.pendingConnectionsDeleted}
            <br />• Client name: {result.clientData.name}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
