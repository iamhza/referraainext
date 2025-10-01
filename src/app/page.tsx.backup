'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';
import { Logo } from '@/components/ui/Logo';

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleStartNow = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      router.push(`/auth/signup?email=${encodeURIComponent(email)}`);
    } else {
      router.push('/auth/signup');
    }
  };

  const handleSignIn = () => {
    router.push('/auth/signin');
  };

  const handleGetStarted = () => {
    router.push('/auth/signup');
  };

  const AnnouncementBanner = () => (
    <div className="inline-flex items-center gap-2 rounded-full bg-[#0066FF]/10 border border-[#0066FF]/20 px-4 py-1.5 text-sm font-medium text-[#0066FF]">
      <Badge variant="secondary" className="px-2 py-0.5 text-[11px]">NEW</Badge>
      <span>Now offering AI-powered provider matching</span>
      <ArrowRight className="h-3.5 w-3.5" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <Container>
          <div className="flex justify-between h-16 items-center">
            <Logo className="h-8 w-auto" />
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={handleSignIn}>
                Sign In
              </Button>
              <Button 
                onClick={handleGetStarted}
                className="bg-[#0066FF] hover:bg-[#0066FF]/90"
              >
                Get Started
              </Button>
            </div>
          </div>
        </Container>
      </header>

      {/* Hero Section */}
      <Container>
        <section className="pt-16 md:pt-32 pb-16">
          <div className="max-w-3xl mx-auto space-y-8 text-center">
            <AnnouncementBanner />
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-gray-900">
              Effortless <span className="bg-gradient-to-r from-[#0066FF] to-[#0066FF]/70 bg-clip-text text-transparent">AI-Powered Referrals</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600">
              Referra connects case managers with pre-vetted service providers in seconds.
            </p>
            <div className="flex flex-col md:flex-row justify-center gap-4">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-[#0066FF]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>No manual searches</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-[#0066FF]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Qualified referrals</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-[#0066FF]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Enhanced outcomes</span>
              </div>
            </div>
            <div className="pt-4">
              <form onSubmit={handleStartNow} className="max-w-md mx-auto">
                <div className="bg-white rounded-full p-1.5 flex items-center border-2 border-gray-200 focus-within:border-[#0066FF]/50">
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Button 
                    type="submit" 
                    className="rounded-full whitespace-nowrap bg-[#0066FF] hover:bg-[#0066FF]/90"
                  >
                    Start now
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </Container>

      {/* Features Section */}
      <section className="py-20 md:py-32 bg-white border-t">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold mb-4 text-gray-900">Streamline Your Referral Process</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform helps you find the right providers faster, track progress effortlessly, and improve client outcomes.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-12 h-12 bg-[#0066FF]/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Smart Matching</h3>
              <p className="text-gray-600">AI-powered matching algorithm finds the most suitable providers based on client needs.</p>
            </div>
            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-12 h-12 bg-[#0066FF]/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Progress Tracking</h3>
              <p className="text-gray-600">Real-time updates and milestone tracking for every referral in your pipeline.</p>
            </div>
            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-12 h-12 bg-[#0066FF]/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Seamless Communication</h3>
              <p className="text-gray-600">Built-in messaging system keeps everyone in the loop and reduces back-and-forth.</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Preview App Section */}
      <section className="py-20 md:py-32 bg-[#F8FAFC] border-t relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50"></div>
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-gray-900">
              Powerful Platform for Both Sides
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Whether you're a case manager or service provider, Referra streamlines your workflow and helps you deliver better outcomes.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Case Manager Side */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0066FF]/5 rounded-full">
                  <svg className="w-5 h-5 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm font-medium text-[#0066FF]">For Case Managers</span>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  Find the Perfect Match in Minutes
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#0066FF]/10 flex items-center justify-center mt-1">
                      <svg className="w-4 h-4 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">AI-Powered Matching</h4>
                      <p className="text-gray-600">Get instant provider recommendations based on client needs and preferences</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#0066FF]/10 flex items-center justify-center mt-1">
                      <svg className="w-4 h-4 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Progress Dashboard</h4>
                      <p className="text-gray-600">Track all referrals in one place with real-time status updates</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#0066FF]/10 flex items-center justify-center mt-1">
                      <svg className="w-4 h-4 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Outcome Tracking</h4>
                      <p className="text-gray-600">Measure success with detailed analytics and reporting tools</p>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleGetStarted}
                  className="w-full bg-[#0066FF] hover:bg-[#0066FF]/90 mt-4"
                >
                  Start Making Referrals
                </Button>
              </div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#0066FF] rounded-2xl -z-10 opacity-20"></div>
            </div>

            {/* Provider Side */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0066FF]/5 rounded-full">
                  <svg className="w-5 h-5 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-sm font-medium text-[#0066FF]">For Service Providers</span>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  Grow Your Practice Efficiently
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#0066FF]/10 flex items-center justify-center mt-1">
                      <svg className="w-4 h-4 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Qualified Referrals</h4>
                      <p className="text-gray-600">Receive pre-screened referrals that match your expertise and capacity</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#0066FF]/10 flex items-center justify-center mt-1">
                      <svg className="w-4 h-4 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Streamlined Communication</h4>
                      <p className="text-gray-600">Manage all case manager interactions in one secure platform</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#0066FF]/10 flex items-center justify-center mt-1">
                      <svg className="w-4 h-4 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Practice Growth</h4>
                      <p className="text-gray-600">Expand your client base while maintaining quality of care</p>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleGetStarted}
                  className="w-full bg-[#0066FF] hover:bg-[#0066FF]/90 mt-4"
                >
                  Join Our Network
                </Button>
              </div>
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-[#0066FF] rounded-2xl -z-10 opacity-20"></div>
            </div>
          </div>
        </Container>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 md:py-32 bg-white border-t">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold mb-4 text-gray-900">Trusted by Case Managers</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See what case managers are saying about how Referra has transformed their referral process.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#0066FF]/10 flex items-center justify-center">
                  <span className="text-[#0066FF] font-semibold">SK</span>
                </div>
                <div>
                  <h4 className="font-semibold">Sarah K.</h4>
                  <p className="text-sm text-gray-600">Healthcare Case Manager</p>
                </div>
              </div>
              <p className="text-gray-600">"Referra has cut my referral processing time in half. The AI matching is incredibly accurate and saves me hours of manual searching."</p>
            </div>
            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#0066FF]/10 flex items-center justify-center">
                  <span className="text-[#0066FF] font-semibold">MR</span>
                </div>
                <div>
                  <h4 className="font-semibold">Michael R.</h4>
                  <p className="text-sm text-gray-600">Social Services Director</p>
                </div>
              </div>
              <p className="text-gray-600">"The tracking features are game-changing. I can see the status of all my referrals at a glance and follow up when needed."</p>
            </div>
            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#0066FF]/10 flex items-center justify-center">
                  <span className="text-[#0066FF] font-semibold">JD</span>
                </div>
                <div>
                  <h4 className="font-semibold">Jessica D.</h4>
                  <p className="text-sm text-gray-600">Mental Health Coordinator</p>
                </div>
              </div>
              <p className="text-gray-600">"Having all communications in one place has improved our coordination with providers significantly. Great platform!"</p>
            </div>
        </div>
        </Container>
      </section>

      {/* Modern CTA Section */}
      <section className="py-24 bg-white border-t relative overflow-hidden">
        <Container>
          <div className="relative z-10 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-[#0066FF] to-[#0055DD] rounded-3xl p-1">
              <div className="bg-white rounded-[23px] p-12 text-center space-y-8">
                <h2 className="text-3xl md:text-4xl font-semibold bg-gradient-to-r from-[#0066FF] to-[#0055DD] bg-clip-text text-transparent">
                  Ready to Transform Your Referral Process?
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Join thousands of healthcare professionals already using Referra to streamline their workflow and improve outcomes.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={handleGetStarted}
                    className="bg-[#0066FF] hover:bg-[#0066FF]/90 text-lg px-8"
                  >
                    Get Started Free
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {}}
                    className="border-[#0066FF] text-[#0066FF] hover:bg-[#0066FF]/5 text-lg px-8"
                  >
                    Schedule a Demo
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-[#0066FF]/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 bg-[#0066FF]/5 rounded-full blur-3xl"></div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="bg-[#F8FAFC] border-t">
        <Container>
          <div className="py-16 grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Logo className="h-8 w-auto" />
              <p className="text-gray-600">AI-Powered Referrals</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-[#0066FF]">Features</a></li>
                <li><a href="#" className="text-gray-600 hover:text-[#0066FF]">Pricing</a></li>
                <li><a href="#" className="text-gray-600 hover:text-[#0066FF]">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-[#0066FF]">About Us</a></li>
                <li><a href="#" className="text-gray-600 hover:text-[#0066FF]">Careers</a></li>
                <li><a href="#" className="text-gray-600 hover:text-[#0066FF]">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-[#0066FF]">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-600 hover:text-[#0066FF]">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t py-8 text-center text-gray-600 text-sm">
            &copy; 2024 Referra. All rights reserved.
          </div>
        </Container>
      </footer>
    </div>
  );
}
