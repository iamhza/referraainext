'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Logo } from '@/components/ui/Logo';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, error } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('Attempting sign in...');
      const { user } = await signIn(email, password);
      console.log('Sign in successful, user:', user);
      console.log('User role:', user?.user_metadata?.role);
      
      // Wait a moment for the session to be fully established
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (user?.user_metadata?.role === 'case_manager') {
        console.log('Redirecting to case manager dashboard...');
        // Force a hard navigation
        window.location.href = '/case-manager/referrals';
      } else {
        console.log('Redirecting to home...');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Sign in error:', error);
      if (error instanceof Error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
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
                  <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
                  <p className="text-gray-600">Sign in to your account to continue</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full"
                        placeholder="Enter your email"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full"
                        placeholder="Enter your password"
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
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>

                  <div className="text-center text-sm">
                    <span className="text-gray-600">Don't have an account? </span>
                    <Link 
                      href="/auth/signup" 
                      className="text-[#0066FF] hover:underline font-medium"
                    >
                      Sign up
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