'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Trash2 } from 'lucide-react';

export default function TestEnhancedCardsPage() {
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const clearMockData = async () => {
    setClearing(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/clear-mock-data', {
        method: 'POST',
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: 'Failed to clear data' });
    } finally {
      setClearing(false);
    }
  };

  const seedMockData = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/seed-mock-clients', {
        method: 'POST',
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: 'Failed to seed data' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Enhanced Client Cards - Test Data Setup
          </h1>
          <p className="text-gray-600 mb-8">
            Generate mock data for case manager <code className="bg-gray-100 px-2 py-1 rounded">miknabil@yahoo.com</code> to test the enhanced client cards.
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex gap-4">
              <Button
                onClick={clearMockData}
                disabled={clearing || loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {clearing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Clear Existing Data
              </Button>

              <Button
                onClick={seedMockData}
                disabled={loading || clearing}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Generate Enhanced Mock Data
              </Button>
            </div>

            <p className="text-sm text-gray-500">
              Recommended: Clear existing data first, then generate new enhanced data.
            </p>
          </div>

          {result && (
            <div className={`p-4 rounded-lg ${
              result.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <h3 className={`font-semibold mb-2 ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.success ? '✅ Success!' : '❌ Error'}
              </h3>
              
              <p className={`text-sm mb-3 ${
                result.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {result.message}
              </p>

              {result.success && result.distribution && (
                <div className="mt-4">
                  <h4 className="font-medium text-green-800 mb-2">Client Distribution:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    {Object.entries(result.distribution).map(([status, count]) => (
                      <div key={status} className="bg-white p-2 rounded border">
                        <div className="font-medium text-gray-900">
                          {status.replace('_', ' ')}
                        </div>
                        <div className="text-green-600">{count as number} clients</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.success && (result.referralsCreated || result.connectionsCreated) && (
                <div className="mt-4 text-sm text-green-700">
                  <div>📄 Referrals created: {result.referralsCreated || 0}</div>
                  <div>👥 Connections created: {result.connectionsCreated || 0}</div>
                </div>
              )}

              {result.success && result.deletedCounts && (
                <div className="mt-4 text-sm text-green-700">
                  <div>🗑️ Clients deleted: {result.deletedCounts.clients}</div>
                  <div>📄 Referrals deleted: {result.deletedCounts.referrals}</div>
                  <div>👥 Connections deleted: {result.deletedCounts.connections}</div>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">What's Enhanced:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✅ <strong>PMI Numbers</strong> - Always visible unique identifiers</li>
              <li>✅ <strong>Waiver Types</strong> - DD, BI, CADI, CAC, EW, AC waivers</li>
              <li>✅ <strong>Provider Connections</strong> - Realistic provider names and organizations</li>
              <li>✅ <strong>Service Types</strong> - SILS, SLS, ADT, and other real services</li>
              <li>✅ <strong>Smart Contact Info</strong> - Phone priority, email fallback</li>
              <li>✅ <strong>Referral Summaries</strong> - Active and pending referral counts</li>
              <li>✅ <strong>Last Activity</strong> - Recent update timestamps</li>
              <li>✅ <strong>Status Distribution</strong> - Across all 6 board columns</li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Next Steps:</h3>
            <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
              <li>Generate the enhanced mock data using the button above</li>
              <li>Navigate to <code className="bg-yellow-100 px-1 rounded">/case-manager</code> to see the board</li>
              <li>Log in as <code className="bg-yellow-100 px-1 rounded">miknabil@yahoo.com</code></li>
              <li>Observe the enhanced client cards with real data</li>
              <li>Test responsive behavior by zooming in/out</li>
              <li>Click on provider/referral links to test navigation</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}





