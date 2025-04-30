'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Logo } from '@/components/ui/Logo';

interface SignUpFormData {
  email: string;
  password: string;
  fullName: string;
  role: 'case_manager' | 'provider';
  organization: string;
}

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    password: '',
    fullName: '',
    role: 'case_manager',
    organization: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const emailFromUrl = searchParams.get('email');
    if (emailFromUrl) {
      setFormData(prev => ({ ...prev, email: emailFromUrl }));
    }
  }, [searchParams]);

  if (user) {
    router.push('/case-manager/referrals');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await signUp(formData.email, formData.password, {
        fullName: formData.fullName,
        role: formData.role,
        organization: formData.organization,
      });
      toast({
        title: "Account created",
        description: "Please check your email to confirm your account",
      });
      setSuccess(true);
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "There was an error creating your account",
        variant: "destructive",
      });
      console.error("Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const SuccessState = () => (
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
              <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 text-center">
                <div className="w-16 h-16 bg-[#0066FF]/10 rounded-full mx-auto flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Check your email</h2>
                <p className="text-gray-600">
                  We've sent a confirmation link to your email address. Please check your inbox and follow the instructions to complete your registration.
                </p>
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    If you don't see the email, check your spam folder or contact support.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setSuccess(false)}
                    className="w-full border-[#0066FF] text-[#0066FF] hover:bg-[#0066FF]/5"
                  >
                    Go back
                  </Button>
                  <div className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link href="/auth/signin" className="text-[#0066FF] hover:underline font-medium">
                      Sign in
                    </Link>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#0066FF] rounded-2xl -z-10 opacity-20"></div>
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-[#0066FF]/20 rounded-2xl -z-10"></div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );

  if (success) {
    return <SuccessState />;
  }

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
                        value={formData.fullName}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
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
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
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
                        value={formData.role} 
                        onValueChange={(value: 'case_manager' | 'provider') => setFormData({...formData, role: value})}
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
                        value={formData.organization}
                        onChange={(e) => setFormData({...formData, organization: e.target.value})}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-[#0066FF] hover:bg-[#0066FF]/90" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
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