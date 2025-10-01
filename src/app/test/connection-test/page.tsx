'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ConnectionTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const createTestClients = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/create-connection-clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          providerUserId: 'cc12ff47-21a8-4320-99f4-5b75189d8f4e' // dannyghost
        })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to create test clients' });
    } finally {
      setLoading(false);
    }
  };

  const cleanupTestClients = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/cleanup-test-clients', {
        method: 'DELETE'
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to cleanup test clients' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Connection Test</CardTitle>
          <CardDescription>
            Create test clients to test the connection system between case manager and provider
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={createTestClients}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creating...' : 'Create Test Clients'}
            </Button>
            <Button 
              onClick={cleanupTestClients}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Cleaning...' : 'Cleanup Test Clients'}
            </Button>
          </div>
          
          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
          
          {result?.success && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Next Steps:</h4>
              <ol className="list-decimal list-inside text-sm text-green-700 space-y-1">
                <li>Go to your clients table</li>
                <li>Look for "John TestConnection"</li>
                <li>Check the Connection column</li>
                <li>Click "Activate" if available</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
