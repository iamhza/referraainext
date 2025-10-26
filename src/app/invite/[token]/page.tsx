'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, Eye, EyeOff, Check, X, Loader2 } from 'lucide-react';

interface InvitationData {
  email: string;
  role: string;
  org_id: string;
  inviter_name: string;
  organization_name?: string;
  expires_at: string;
}

export default function InviteSignupPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    password: '',
    confirm_password: ''
  });

  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    match: false
  });

  useEffect(() => {
    validateInvitation();
  }, [token]);

  useEffect(() => {
    validatePassword();
  }, [formData.password, formData.confirm_password]);

  const validateInvitation = async () => {
    try {
      const response = await fetch('/api/invitations/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (response.ok) {
        const data = await response.json();
        setInvitation(data.invitation);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Invalid invitation');
      }
    } catch (error) {
      setError('Failed to validate invitation');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = () => {
    const password = formData.password;
    setPasswordValidation({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      match: password === formData.confirm_password && password.length > 0
    });
  };

  const isFormValid = () => {
    return (
      formData.full_name.trim().length > 0 &&
      Object.values(passwordValidation).every(Boolean)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/invitations/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          full_name: formData.full_name.trim(),
          password: formData.password
        })
      });

      if (response.ok) {
        // Success! Redirect to login with success message
        router.push('/auth/signin?message=Account created successfully. Please sign in.');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to complete registration');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-800">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">{error}</p>
            <Button 
              onClick={() => router.push('/auth/signin')}
              variant="outline"
              className="w-full"
            >
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleDisplayName = invitation?.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Complete Your Registration</CardTitle>
          <p className="text-gray-600">
            You&apos;ve been invited by <strong>{invitation?.inviter_name}</strong>
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Invitation Details */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Email:</span>
              <span className="text-sm text-gray-900">{invitation?.email}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Role:</span>
              <Badge variant="secondary">{roleDisplayName}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Expires:</span>
              <span className="text-xs text-gray-600">
                {new Date(invitation?.expires_at || '').toLocaleDateString()}
              </span>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create a secure password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirm_password">Confirm Password</Label>
              <Input
                id="confirm_password"
                type={showPassword ? 'text' : 'password'}
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                placeholder="Confirm your password"
                required
              />
            </div>

            {/* Password Requirements */}
            {formData.password && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Password Requirements:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`flex items-center gap-1 ${passwordValidation.length ? 'text-green-600' : 'text-gray-400'}`}>
                    <Check className="h-3 w-3" />
                    8+ characters
                  </div>
                  <div className={`flex items-center gap-1 ${passwordValidation.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                    <Check className="h-3 w-3" />
                    Uppercase letter
                  </div>
                  <div className={`flex items-center gap-1 ${passwordValidation.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                    <Check className="h-3 w-3" />
                    Lowercase letter
                  </div>
                  <div className={`flex items-center gap-1 ${passwordValidation.number ? 'text-green-600' : 'text-gray-400'}`}>
                    <Check className="h-3 w-3" />
                    Number
                  </div>
                </div>
                {formData.confirm_password && (
                  <div className={`flex items-center gap-1 text-xs ${passwordValidation.match ? 'text-green-600' : 'text-red-600'}`}>
                    <Check className="h-3 w-3" />
                    Passwords match
                  </div>
                )}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={!isFormValid() || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Complete Registration'
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Already have an account?{' '}
              <button 
                onClick={() => router.push('/auth/signin')}
                className="text-blue-600 hover:underline"
              >
                Sign in here
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}