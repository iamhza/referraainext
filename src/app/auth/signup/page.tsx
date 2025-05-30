'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Logo } from '@/components/ui/Logo';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'case_manager' | 'provider'>('case_manager');
  const [organization, setOrganization] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUp, signIn } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signUp(email, password, {
        fullName,
        role,
        organization,
      });
      // Try to sign in immediately after signup
      try {
        const { user } = await signIn(email, password);
        await new Promise(resolve => setTimeout(resolve, 500));
        if (user?.user_metadata?.role === 'admin') {
          window.location.href = '/admin';
        } else if (user?.user_metadata?.role === 'case_manager') {
          window.location.href = '/case-manager/referrals';
        } else {
          window.location.href = '/';
        }
      } catch (signInError: any) {
        // If sign in fails, likely due to email confirmation required
        setError('Account created! Please check your email to confirm your account before signing in.');
      }
    } catch (error: any) {
      setError(error.message || 'There was an error creating your account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <Container>
          <div className="flex h-16 items-center">
            <Link href="/">
              <Logo className="h-8 w-auto" />
            </Link>
          </div>
        </Container>
      </header>

      <Container>
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
          <div className="w-full max-w-md">
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-semibold text-gray-900">Create your account</h1>
                  <p className="text-gray-600">Join Referra to streamline your referral process</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <Input
                        id="fullName"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Password must be at least 8 characters long
                      </p>
                    </div>

                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                        I am a
                      </label>
                      <Select 
                        value={role} 
                        onValueChange={(value: 'case_manager' | 'provider') => setRole(value)}
                      >
                        <SelectTrigger id="role" className="w-full">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="case_manager">Case Manager</SelectItem>
                          <SelectItem value="provider">Service Provider</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
                        Organization (Optional)
                      </label>
                      <Input
                        id="organization"
                        placeholder="Enter your organization name"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-[#0066FF] hover:bg-[#0066FF]/90" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>

                  <div className="text-center text-sm">
                    <span className="text-gray-600">Already have an account? </span>
                    <Link 
                      href="/auth/signin" 
                      className="text-[#0066FF] hover:underline font-medium"
                    >
                      Sign in
                    </Link>
                  </div>
                </form>
              </div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#0066FF] rounded-2xl -z-10 opacity-20"></div>
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-[#0066FF]/20 rounded-2xl -z-10"></div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
} 