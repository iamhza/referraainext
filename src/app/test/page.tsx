'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TestPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setResult({ error: 'Please enter a valid email address.' });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch('/api/waitlist/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          🧪 Waitlist Test
        </h1>
        
        <form onSubmit={handleTest} className="space-y-4">
          <div>
            <label htmlFor="test-email" className="block text-sm font-medium text-gray-700 mb-2">
              Test Email
            </label>
            <Input
              id="test-email"
              type="email"
              placeholder="test@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full"
            />
          </div>
          
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Testing...' : 'Test Waitlist Signup'}
          </Button>
        </form>

        {result && (
          <div className="mt-6 p-4 rounded-lg border">
            {result.success ? (
              <div className="space-y-2">
                <div className="text-green-600 font-medium">✅ Test Successful!</div>
                <div className="text-sm text-gray-600">
                  <div><strong>Message:</strong> {result.message}</div>
                  <div><strong>User Email:</strong> {result.userEmail}</div>
                  <div><strong>Notification Email:</strong> {result.notificationEmail}</div>
                  <div><strong>Email Configured:</strong> {result.emailConfigured ? 'Yes' : 'No'}</div>
                </div>
                {!result.emailConfigured && (
                  <div className="text-yellow-600 text-sm">
                    ⚠️ Email notifications not configured. Check EMAIL_SETUP.md for setup instructions.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-600">
                ❌ Error: {result.error}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-center">
          <a 
            href="/" 
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            ← Back to Landing Page
          </a>
        </div>
      </div>
    </div>
  );
} 