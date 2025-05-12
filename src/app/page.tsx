'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';
import { Logo } from '@/components/ui/Logo';

export default function LandingPage() {
  const [email, setEmail] = useState("");

  const handleStartNow = (e: React.FormEvent) => {
    e.preventDefault();
    // Just show an alert for now
    alert('Thank you for your interest! We will contact you soon.');
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
              <Button 
                onClick={handleStartNow}
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
    </div>
  );
}
