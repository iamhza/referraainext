'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Eye, EyeOff, Building2, Crown, User } from 'lucide-react';
import { signIn, getSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgDomain, setOrgDomain] = useState('');
  const [loginType, setLoginType] = useState<'org' | 'platform' | 'provider'>('org');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log('NextAuth: Attempting sign in...');
      
      // Prepare credentials for NextAuth
      const credentials: any = {
        email: email.trim(),
        password: password,
      };
      
      // Add org domain for organization users
      if (loginType === 'org' && orgDomain.trim()) {
        credentials.org_domain = orgDomain.trim();
      }
      
      // Add login type to help backend distinguish provider vs platform admin
      credentials.login_type = loginType;
      
      const result = await signIn('credentials', {
        ...credentials,
        redirect: false, // Don't redirect automatically
      });
      
      if (result?.error) {
        console.error('NextAuth sign in error:', result.error);
        setError('Invalid credentials. Please check your email, password, and organization.');
        toast({
          title: "Login Failed",
          description: "Invalid credentials. Please check your information and try again.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('NextAuth sign in successful');
      
      // Get the session to determine redirect
      const session = await getSession();
      console.log('Full session:', session);
      if (session?.user) {
        const userRole = session.user.role;
        console.log('User role:', userRole);
        console.log('User object:', session.user);
        
        // Role-based redirect with NextAuth
        switch (userRole as string) {
          case 'platform_admin':
            console.log('Redirecting to platform admin...');
            router.push('/admin');
            break;
          case 'admin': // Legacy role support
            console.log('Redirecting to platform admin (legacy)...');
            router.push('/admin');
            break;
          case 'org_admin':
            console.log('Redirecting to org admin...');
            router.push('/org-admin');
            break;
          case 'supervisor':
            console.log('Redirecting to supervisor dashboard...');
            router.push('/supervisor');
            break;
          case 'case_manager':
            console.log('Redirecting to case manager dashboard...');
            router.push('/case-manager');
            break;
          case 'provider':
            console.log('Redirecting to provider dashboard...');
            router.push('/provider');
            break;
          default:
            console.log('Unknown role, redirecting to home...');
            router.push('/');
        }
        
        toast({
          title: "Welcome!",
          description: `Signed in successfully as ${session.user.name || session.user.email}`,
        });
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setError('An unexpected error occurred. Please try again.');
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <span className="text-xl font-bold text-blue-600">R</span>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h1>
            <p className="text-gray-600">
              Don't have an account yet?{' '}
              <Link href="/auth/signup" className="text-blue-600 hover:underline font-medium">
                Sign up now
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Login Type Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Login as:
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setLoginType('org')}
                  className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all ${
                    loginType === 'org'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  <span className="text-sm">Organization User</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoginType('provider')}
                  className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all ${
                    loginType === 'provider'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <User className="w-4 h-4 mr-2" />
                  <span className="text-sm">Provider</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoginType('platform')}
                  className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all ${
                    loginType === 'platform'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  <span className="text-sm">Platform Admin</span>
                </button>
              </div>
            </div>

            {/* Organization Domain Input */}
            {loginType === 'org' && (
              <div>
                <Input
                  id="orgDomain"
                  type="text"
                  value={orgDomain}
                  onChange={(e) => setOrgDomain(e.target.value)}
                  required={loginType === 'org'}
                  className="w-full h-12 px-4 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Organization domain (e.g., riverside-social)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your organization's domain or slug
                </p>
              </div>
            )}

            <div>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 px-4 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Email address"
              />
            </div>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-12 px-4 pr-12 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Log in'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
} 