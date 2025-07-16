'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, Users, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'case_manager' | 'provider'>('case_manager');
  const [organization, setOrganization] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { signUp, signIn } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleRoleSelection = (selectedRole: 'case_manager' | 'provider') => {
    setRole(selectedRole);
    setShowForm(true);
  };

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
          window.location.href = '/case-manager';
        } else if (user?.user_metadata?.role === 'provider') {
          window.location.href = '/provider';
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
    <div className="min-h-screen flex">
      {/* Left Side - Blue Pattern Background - Made smaller */}
      <div className="hidden lg:flex lg:w-[420px] relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 25%, #2563eb 50%, #3b82f6 75%, #60a5fa 100%)'
      }}>
        {/* Decorative Pattern - Matching Remote's style */}
        <div className="absolute inset-0">
          <svg width="100%" height="100%" viewBox="0 0 800 800" className="opacity-30">
            <defs>
              <pattern id="dots" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="15" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
                <circle cx="30" cy="30" r="8" fill="rgba(255,255,255,0.2)"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)"/>
          </svg>
        </div>

        {/* Logo */}
        <div className="absolute top-8 left-8 z-10">
          <Link href="/" className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
              <span className="text-xl font-bold text-white">R</span>
            </div>
            <Image 
              src="/refrr.png" 
              alt="Referra Logo" 
              width={80} 
              height={32} 
              className="object-contain brightness-0 invert"
            />
          </Link>
        </div>
      </div>

      {/* Right Side - Form - Made larger and less pushed to right */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 lg:px-12 bg-gray-50 relative min-h-screen py-12">
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-8 left-8">
          <Link href="/" className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
              <span className="text-lg font-bold text-blue-600">R</span>
            </div>
            <Image 
              src="/refrr.png" 
              alt="Referra Logo" 
              width={60} 
              height={24} 
              className="object-contain brightness-0 invert"
            />
          </Link>
        </div>

        {/* Top Navigation */}
        <div className="absolute top-8 right-8 flex items-center gap-4">
          <span className="text-sm text-gray-600">Already have an account?</span>
          <Link 
            href="/auth/signin"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
          >
            Log in
          </Link>
        </div>

        {/* Back Button */}
        {showForm && (
          <div className="mb-8">
            <button 
              onClick={() => setShowForm(false)}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </button>
          </div>
        )}

        {!showForm ? (
          /* Role Selection Screen */
          <div className="max-w-lg mx-auto w-full">
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight whitespace-nowrap">
                How would you be using Referra?
              </h1>
            </div>

            <div className="space-y-4">
              <div 
                onClick={() => handleRoleSelection('case_manager')}
                className="group relative p-6 bg-white border border-gray-200 rounded-2xl cursor-pointer transition-all hover:border-blue-300 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      I'm a case manager
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      I want to manage my team or recruit new talent.
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => handleRoleSelection('provider')}
                className="group relative p-6 bg-white border border-gray-200 rounded-2xl cursor-pointer transition-all hover:border-blue-300 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      I'm a service provider
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      I'm a freelancer, job seeker, or employee.
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <div className="max-w-md mx-auto w-full">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Create your account
              </h2>
              <p className="text-gray-600">
                {role === 'case_manager' 
                  ? 'Start managing referrals and tracking client outcomes.' 
                  : 'Join our network of service providers.'
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-2">
                  Organization {role === 'provider' ? '' : '(Optional)'}
                </label>
                <Input
                  id="organization"
                  placeholder="Enter organization name"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  required={role === 'provider'}
                  className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Password must be at least 8 characters long
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base rounded-lg" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            {/* Terms */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500 leading-relaxed">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 