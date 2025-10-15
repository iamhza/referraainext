/**
 * Sandbox Signup Page
 * 
 * Enhanced signup flow specifically for sandbox demo creation.
 * Multi-step process: Email/Password → Tier Selection → Role Selection → Create Sandbox
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Loader2, ArrowRight, ArrowLeft, Building2, Users, UserCheck, 
  Sparkles, CheckCircle2, Clock, TrendingUp 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Step = 'account' | 'tier' | 'role' | 'creating';
type Tier = 'micro' | 'mid' | 'enterprise';
type Role = 'case_manager' | 'supervisor' | 'org_admin';

export default function SandboxSignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Form state
  const [step, setStep] = useState<Step>('account');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [tier, setTier] = useState<Tier | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ========================================================================
  // STEP 1: Create Account
  // ========================================================================
  
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password || !name) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setStep('tier');
  };
  
  // ========================================================================
  // STEP 2: Select Tier
  // ========================================================================
  
  const handleTierSelect = (selectedTier: Tier) => {
    setTier(selectedTier);
    setStep('role');
  };
  
  // ========================================================================
  // STEP 3: Select Role & Create Sandbox
  // ========================================================================
  
  const handleRoleSelect = async (selectedRole: Role) => {
    setRole(selectedRole);
    setStep('creating');
    setLoading(true);
    
    try {
      // 1. Create user account via API
      const signupResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          role: selectedRole,
        }),
      });
      
      if (!signupResponse.ok) {
        const errorData = await signupResponse.json();
        throw new Error(errorData.error || 'Failed to create account');
      }
      
      const { userId } = await signupResponse.json();
      
      // 2. Sign in to get session
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      
      if (signInResult?.error) {
        throw new Error('Account created but sign-in failed. Please try signing in manually.');
      }
      
      // 3. Create sandbox organization
      const sandboxResponse = await fetch('/api/sandbox/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: tier,
          role: selectedRole,
          orgName: orgName,
          metadata: {
            signupSource: 'sandbox-signup-page',
          },
        }),
      });
      
      if (!sandboxResponse.ok) {
        throw new Error('Failed to create demo environment');
      }
      
      const sandboxData = await sandboxResponse.json();
      
      // 4. Show success and redirect
      toast({
        title: '🎉 Demo Ready!',
        description: `Your ${tier} ${selectedRole.replace('_', ' ')} demo is ready to explore.`,
      });
      
      // Redirect based on role
      setTimeout(() => {
        if (selectedRole === 'case_manager') {
          router.push('/case-manager');
        } else if (selectedRole === 'supervisor') {
          router.push('/supervisor');
        } else if (selectedRole === 'org_admin') {
          router.push('/org-admin');
        }
      }, 1500);
      
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || 'Failed to create demo. Please try again.');
      setStep('role');
      setLoading(false);
    }
  };
  
  // ========================================================================
  // RENDER
  // ========================================================================
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6">
        <Link href="/" className="flex items-center gap-2 text-gray-900 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
      
      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-4xl">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2">
              {['account', 'tier', 'role'].map((s, idx) => (
                <div key={s} className="flex items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    step === s || (s === 'account' && ['tier', 'role', 'creating'].includes(step)) || (s === 'tier' && ['role', 'creating'].includes(step))
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  )}>
                    {idx + 1}
                  </div>
                  {idx < 2 && (
                    <div className={cn(
                      "w-16 h-0.5 mx-2 transition-colors",
                      (s === 'account' && ['tier', 'role', 'creating'].includes(step)) || (s === 'tier' && ['role', 'creating'].includes(step))
                        ? "bg-blue-600"
                        : "bg-gray-200"
                    )} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-20 mt-2">
              <span className="text-xs text-gray-600">Account</span>
              <span className="text-xs text-gray-600">Org Size</span>
              <span className="text-xs text-gray-600">Your Role</span>
            </div>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          
          {/* Step 1: Account Creation */}
          {step === 'account' && (
            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Try Referra Demo</CardTitle>
                <CardDescription>
                  Experience our platform with realistic demo data. No credit card required.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAccountSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Acme Social Services"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
                  </div>
                  
                  <Button type="submit" className="w-full" size="lg">
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  
                  <p className="text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link href="/auth/signin" className="text-blue-600 hover:underline">
                      Sign in
                    </Link>
                  </p>
                </form>
              </CardContent>
            </Card>
          )}
          
          {/* Step 2: Tier Selection */}
          {step === 'tier' && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  What size is your organization?
                </h2>
                <p className="text-gray-600">
                  We'll customize your demo experience based on your organization's scale
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                {/* Micro */}
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all hover:border-blue-500"
                  onClick={() => handleTierSelect('micro')}
                >
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle>Micro Organization</CardTitle>
                    <CardDescription>Perfect for smaller teams</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Under 100 clients</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>1-3 case managers</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-600">7-day demo</span>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Mid-Tier */}
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all hover:border-blue-500 border-2 border-blue-200"
                  onClick={() => handleTierSelect('mid')}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        POPULAR
                      </span>
                    </div>
                    <CardTitle>Mid-Tier Organization</CardTitle>
                    <CardDescription>Most common size</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>100-400 clients</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>3-10 case managers</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-600">14-day demo</span>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Enterprise */}
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all hover:border-blue-500"
                  onClick={() => handleTierSelect('enterprise')}
                >
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                    <CardTitle>Enterprise Organization</CardTitle>
                    <CardDescription>Large-scale operations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>400+ clients</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>10+ case managers</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-600">30-day demo</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="text-center mt-6">
                <Button variant="ghost" onClick={() => setStep('account')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 3: Role Selection */}
          {step === 'role' && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  What's your role?
                </h2>
                <p className="text-gray-600">
                  We'll tailor the demo to show features relevant to your daily work
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                {/* Case Manager */}
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all hover:border-blue-500"
                  onClick={() => handleRoleSelect('case_manager')}
                >
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                      <UserCheck className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle>Case Manager</CardTitle>
                    <CardDescription className="min-h-[40px]">
                      Manage client referrals and coordinate services
                    </CardDescription>
                  </CardHeader>
                </Card>
                
                {/* Supervisor */}
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all hover:border-blue-500"
                  onClick={() => handleRoleSelect('supervisor')}
                >
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle>Supervisor</CardTitle>
                    <CardDescription className="min-h-[40px]">
                      Oversee team performance and balance caseloads
                    </CardDescription>
                  </CardHeader>
                </Card>
                
                {/* Org Admin */}
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all hover:border-blue-500"
                  onClick={() => handleRoleSelect('org_admin')}
                >
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                      <Building2 className="h-6 w-6 text-purple-600" />
                    </div>
                    <CardTitle>Org Admin</CardTitle>
                    <CardDescription className="min-h-[40px]">
                      Manage organization settings and analytics
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
              
              <div className="text-center mt-6">
                <Button variant="ghost" onClick={() => setStep('tier')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 4: Creating Sandbox */}
          {step === 'creating' && (
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6">
                <div className="text-center space-y-6">
                  <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Setting up your personalized demo...
                    </h3>
                    <p className="text-gray-600">
                      Creating your {tier} organization with realistic data
                    </p>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span>Generating clients and referrals</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse animation-delay-200" />
                      <span>Setting up provider network</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse animation-delay-400" />
                      <span>Preparing your workspace</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

