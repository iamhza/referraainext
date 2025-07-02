'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Container, HeaderContainer } from '@/components/ui/container';
import { Logo } from '@/components/ui/Logo';

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const faqList = [
    { q: 'When will Referra launch?', a: "We're planning to launch in Q3 of 2025. Join our waitlist to be among the first to know when we go live." },
    { q: 'How does the waitlist work?', a: "By joining our waitlist, you'll get priority access to the platform, exclusive launch benefits, and the opportunity to shape our product development." },
    { q: 'What makes Referra different?', a: "Referra uses AI to match case managers with real-time, reliable, and pre-vetted service providers in seconds. Our comprehensive vetting process ensures quality care while eliminating manual searches and improving outcomes for all parties." },
    { q: 'How can I stay updated?', a: "Follow us on social media and join our waitlist to receive regular updates about our progress and launch plans." },
    { q: 'Is Referra secure and HIPAA compliant?', a: "Yes, Referra is built with security and HIPAA compliance as a top priority to protect your data and your clients' privacy." },
    { q: 'Can I refer providers outside my network?', a: "Yes, Referra allows you to access a broad network of pre-vetted providers, not just those in your immediate network." },
    { q: 'How do I provide feedback?', a: "Early users will have direct channels to provide feedback and help shape the product before and after launch." },
  ];

  const handleStartNow = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setSubmitStatus('error');
      setSubmitMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitMessage("");

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        setSubmitMessage(data.message);
        setEmail('');
      } else {
        setSubmitStatus('error');
        setSubmitMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setSubmitStatus('error');
      setSubmitMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const AnnouncementBanner = () => (
    <div className="inline-flex items-center gap-2 rounded-full bg-[#0066FF]/10 border border-[#0066FF]/20 px-4 py-1.5 text-sm font-medium text-[#0066FF]">
      <Badge variant="secondary" className="px-2 py-0.5 text-[11px]">NEW</Badge>
      <span>Launching Q3 2025 - Join the Waitlist</span>
      <ArrowRight className="h-3.5 w-3.5" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="border-b border-gray-100/50 bg-white/70 backdrop-blur-xl pt-4">
        <HeaderContainer>
          <div className="flex justify-between h-16 items-center">
            <div className="flex-1 pl-4">
              <Logo className="h-9 w-auto" />
            </div>
            <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
              <a href="#features" className="no-underline text-[15px] font-medium text-gray-600 hover:text-[#0066FF] transition-colors px-3 py-1 rounded-md hover:bg-blue-50">
                Features
              </a>
              <a href="#how-it-works" className="no-underline text-[15px] font-medium text-gray-600 hover:text-[#0066FF] transition-colors px-3 py-1 rounded-md hover:bg-blue-50">
                How It Works
              </a>
              <a href="#faq" className="no-underline text-[15px] font-medium text-gray-600 hover:text-[#0066FF] transition-colors px-3 py-1 rounded-md hover:bg-blue-50">
                FAQ
              </a>
            </nav>
            <div className="flex items-center gap-6 flex-1 justify-end">
              <Button 
                onClick={handleStartNow}
                disabled={isSubmitting}
                className="bg-[#0066FF] hover:bg-[#0055DD] text-white text-[15px] font-medium px-6 py-2 rounded-full transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Joining...' : 'Join Waitlist'}
              </Button>
            </div>
          </div>
        </HeaderContainer>
      </header>

      {/* Hero Section */}
      <Container>
        <section className="pt-12 md:pt-6 pb-12">
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
            <div className="pt-4 space-y-6">
              <p className="text-lg text-gray-600">
                Join our exclusive waitlist to get early access and special launch benefits.
              </p>
              <form onSubmit={handleStartNow} className="max-w-md mx-auto w-full">
                <label htmlFor="hero-email" className="sr-only">Email address</label>
                <div className="flex items-center bg-white rounded-full px-3 py-2 shadow-md border-2 border-gray-200 focus-within:border-[#0066FF]/50 transition">
                  <span className="text-gray-400 pl-2 pr-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M16 12l-4-4-4 4m8 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6" />
                    </svg>
                  </span>
                  <Input
                    id="hero-email"
                    type="email"
                    aria-label="Email address"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent px-2"
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="ml-2 rounded-full bg-[#0066FF] hover:bg-[#0055DD] text-white font-semibold px-6 py-2 transition-all duration-300 shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Joining...' : 'Join Waitlist'}
                  </Button>
                </div>
                {submitStatus === 'success' && (
                  <div className="mt-3 text-center">
                    <p className="text-green-600 text-sm font-medium">{submitMessage}</p>
                  </div>
                )}
                {submitStatus === 'error' && (
                  <div className="mt-3 text-center">
                    <p className="text-red-600 text-sm font-medium">{submitMessage}</p>
                  </div>
                )}
              </form>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-[#0066FF]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2">Priority Access</h3>
                  <p className="text-sm text-gray-600">Be among the first to use Referra when we launch</p>
                </div>
                <div className="p-6 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-[#0066FF]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2">Launch Discount</h3>
                  <p className="text-sm text-gray-600">Special pricing for early adopters</p>
                </div>
                <div className="p-6 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-[#0066FF]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2">Shape the Product</h3>
                  <p className="text-sm text-gray-600">Provide feedback and influence features</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Container>

      {/* Why Referra Section */}
      <section className="py-32 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#0066FF]/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#0066FF]/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#0066FF]/5 rounded-full blur-3xl"></div>
        </div>

        <Container>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center space-y-4 mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0066FF]/10 rounded-full">
                <span className="text-sm font-medium text-[#0066FF]">The Future of Healthcare Referrals</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Why Referra?
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Traditional referral processes are broken. Case managers spend hours searching for providers, while service providers struggle to find qualified clients. We're changing that.
              </p>
            </div>

            {/* Problem vs Solution Grid */}
            <div className="flex flex-col lg:flex-row gap-8 mb-20 items-start">
              {/* Problem Side */}
              <div className="relative flex-1 h-full min-h-[320px]">
                <div className="absolute -inset-4 bg-red-50/50 rounded-3xl blur-2xl"></div>
                <div className="relative p-8 rounded-2xl bg-white border border-red-100 shadow-lg flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900">The Problem</h3>
                  </div>
                  
                  <div className="space-y-6 flex-grow">
                    <div className="flex items-start gap-4 p-4 bg-red-50/50 rounded-xl">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-red-500 font-semibold">1</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Hours of Manual Work</h4>
                        <p className="text-gray-600">Case managers spend 4-6 hours weekly searching for providers, making calls, and following up on referrals.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-red-50/50 rounded-xl">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-red-500 font-semibold">2</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Poor Communication</h4>
                        <p className="text-gray-600">No centralized system leads to missed updates, delayed care, and frustrated clients.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-red-50/50 rounded-xl">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-red-500 font-semibold">3</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Inefficient Matching</h4>
                        <p className="text-gray-600">Providers struggle to find qualified clients, while case managers can't verify provider availability in real-time.</p>
                      </div>
                    </div>
                  </div>

                  {/* Impact Stats */}
                  <div className="p-6 bg-red-50 rounded-xl mt-6 h-full">
                    <h4 className="font-semibold text-gray-900 mb-4">The Impact</h4>
                    <div className="grid grid-cols-2 gap-4 h-full">
                      <div className="text-center p-4 bg-white rounded-lg shadow-sm h-24 flex flex-col justify-center">
                        <div className="text-2xl font-bold text-red-500 mb-1">68%</div>
                        <div className="text-sm text-gray-600">Time spent on manual searches</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg shadow-sm h-24 flex flex-col justify-center">
                        <div className="text-2xl font-bold text-red-500 mb-1">42%</div>
                        <div className="text-sm text-gray-600">Delayed care due to poor communication</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Solution Side */}
              <div className="relative flex-1 h-full min-h-[320px]">
                <div className="absolute -inset-4 bg-[#0066FF]/5 rounded-3xl blur-2xl"></div>
                <div className="relative p-8 rounded-2xl bg-white border border-[#0066FF]/20 shadow-lg flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-[#0066FF]/10 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900">Our Solution</h3>
                  </div>

                  <div className="space-y-6 flex-grow">
                    <div className="flex items-start gap-4 p-4 bg-[#0066FF]/5 rounded-xl">
                      <div className="w-8 h-8 bg-[#0066FF]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-[#0066FF] font-semibold">1</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">AI-Powered Matching</h4>
                        <p className="text-gray-600">Find the perfect provider match in seconds with our advanced AI algorithm.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-[#0066FF]/5 rounded-xl">
                      <div className="w-8 h-8 bg-[#0066FF]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-[#0066FF] font-semibold">2</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Real-Time Updates</h4>
                        <p className="text-gray-600">Track referral progress, communicate seamlessly, and ensure timely care delivery.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-[#0066FF]/5 rounded-xl">
                      <div className="w-8 h-8 bg-[#0066FF]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-[#0066FF] font-semibold">3</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Verified Providers</h4>
                        <p className="text-gray-600">Access a network of pre-vetted providers with verified availability and credentials.</p>
                      </div>
                    </div>
                  </div>

                  {/* Benefits Stats */}
                  <div className="p-6 bg-[#0066FF]/5 rounded-xl mt-6 h-full">
                    <h4 className="font-semibold text-gray-900 mb-4">The Benefits</h4>
                    <div className="grid grid-cols-2 gap-4 h-full">
                      <div className="text-center p-4 bg-white rounded-lg shadow-sm h-24 flex flex-col justify-center">
                        <div className="text-2xl font-bold text-[#0066FF] mb-1">90%</div>
                        <div className="text-sm text-gray-600">Faster referral process</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg shadow-sm h-24 flex flex-col justify-center">
                        <div className="text-2xl font-bold text-[#0066FF] mb-1">75%</div>
                        <div className="text-sm text-gray-600">Reduced administrative time</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Differentiators */}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-[#0066FF]/10 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Lightning Fast</h3>
                <p className="text-gray-600">Match clients with providers in seconds, not hours.</p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-[#0066FF]/10 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Trusted Network</h3>
                <p className="text-gray-600">Every provider is thoroughly vetted and verified.</p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-[#0066FF]/10 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Seamless Communication</h3>
                <p className="text-gray-600">Built-in messaging keeps everyone in sync.</p>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-16 text-center">
              <Button 
                onClick={handleStartNow}
                disabled={isSubmitting}
                className="bg-[#0066FF] hover:bg-[#0055DD] text-white text-lg px-8 py-6 rounded-full transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Joining...' : 'Join the Waitlist'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-32 bg-gradient-to-b from-white to-[#F8FAFC] relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#0066FF]/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#0066FF]/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#0066FF]/5 rounded-full blur-3xl"></div>
        </div>

        <Container>
          <div className="max-w-5xl mx-auto text-center space-y-16 relative z-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0066FF]/10 rounded-full">
                <span className="text-sm font-medium text-[#0066FF]">Simple Process</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                How It Works
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Getting started with Referra is simple. Here's how we'll transform your referral process.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-[#0066FF]/20 via-[#0066FF]/40 to-[#0066FF]/20 -translate-y-1/2"></div>

              <div className="relative group">
                <div className="p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="w-16 h-16 bg-[#0066FF]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-[#0066FF] font-bold text-2xl">1</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">Join the Waitlist</h3>
                  <p className="text-gray-600">Sign up to be among the first to experience Referra and get exclusive launch benefits.</p>
                  <div className="mt-6">
                    <div className="w-12 h-12 bg-[#0066FF]/5 rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-6 h-6 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <div className="p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="w-16 h-16 bg-[#0066FF]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-[#0066FF] font-bold text-2xl">2</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">Get Early Access</h3>
                  <p className="text-gray-600">Receive priority access to the platform and help shape its development.</p>
                  <div className="mt-6">
                    <div className="w-12 h-12 bg-[#0066FF]/5 rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-6 h-6 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <div className="p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="w-16 h-16 bg-[#0066FF]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-[#0066FF] font-bold text-2xl">3</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">Start Referring</h3>
                  <p className="text-gray-600">Begin making AI-powered referrals and transform your workflow from day one.</p>
                  <div className="mt-6">
                    <div className="w-12 h-12 bg-[#0066FF]/5 rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-6 h-6 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Button 
                onClick={handleStartNow}
                disabled={isSubmitting}
                className="bg-[#0066FF] hover:bg-[#0055DD] text-white text-lg px-8 py-6 rounded-full transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Joining...' : 'Join the Waitlist'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-32 bg-[#F4F8FF] relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#0066FF]/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#0066FF]/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#0066FF]/10 rounded-full blur-3xl"></div>
        </div>

        <Container>
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="text-center space-y-4 mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0066FF]/10 to-[#EAF2FF] rounded-full">
                <span className="text-sm font-medium text-[#0066FF]">Common Questions</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-semibold bg-gradient-to-r from-[#0066FF] to-[#0055DD] bg-clip-text text-transparent">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Everything you need to know about Referra and our launch.
              </p>
            </div>

            <div className="space-y-4 pb-12">
              {faqList.map((item, idx) => (
                <div
                  key={idx}
                  className={`border-l-4 rounded-xl bg-white shadow-sm border-[#EAF2FF] transition-all duration-200 ${openFaq === idx ? 'border-[#0066FF] bg-[#EAF2FF] shadow-lg' : 'border-[#EAF2FF]'} `}
                >
                  <button
                    className={`w-full flex justify-between items-center px-6 py-5 text-left text-lg font-medium transition-colors group rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] ${openFaq === idx ? 'text-[#0066FF]' : 'text-gray-900'} hover:text-[#0066FF]`}
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    aria-expanded={openFaq === idx}
                    aria-controls={`faq-panel-${idx}`}
                  >
                    <span>{item.q}</span>
                    <svg
                      className={`w-5 h-5 ml-4 transform transition-transform duration-200 ${openFaq === idx ? 'rotate-180 text-[#0066FF]' : 'text-[#0066FF]/70 group-hover:text-[#0066FF]'}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openFaq === idx && (
                    <div
                      id={`faq-panel-${idx}`}
                      className="px-6 pb-5 text-[#003366] animate-fade-in"
                    >
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="py-24 bg-white relative overflow-hidden">
        <Container className="px-4 sm:px-6 md:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Main Footer Content */}
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-semibold text-gray-800 mb-6">
                Ready to Transform Your Referral Process?
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto mb-10">
                Join our waitlist to be among the first to experience Referra and get exclusive launch benefits.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={handleStartNow}
                  disabled={isSubmitting}
                  className="bg-[#0066FF] hover:bg-[#0055DD] text-white text-lg px-8 py-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Joining...' : 'Join Waitlist'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleStartNow}
                  disabled={isSubmitting}
                  className="bg-transparent hover:bg-gray-50 text-gray-600 border-gray-300 hover:border-gray-400 text-lg px-8 py-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Joining...' : 'Learn More'}
                </Button>
              </div>
            </div>
            
            {/* Divider */}
            <div className="w-full border-t border-gray-200 mb-16"></div>
            
            {/* Footer Links and Info */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {/* Company Info */}
              <div className="text-center md:text-left">
                <a href="#" className="no-underline inline-block">
                  <Logo className="h-10 w-auto mx-auto md:mx-0 mb-4" />
                </a>
                <p className="text-gray-600 text-sm mt-4 max-w-xs mx-auto md:mx-0">
                  Connecting case managers with pre-vetted service providers through AI-powered referrals.
                </p>
              </div>
              
              {/* Quick Links */}
              <div className="text-center">
                <h3 className="text-gray-700 font-medium mb-4">Quick Links</h3>
                <div className="flex flex-col gap-3">
                  <a href="#features" className="no-underline text-gray-600 hover:bg-blue-50 hover:text-[#0066FF] font-medium transition-all px-4 py-2 rounded-lg">Features</a>
                  <a href="#how-it-works" className="no-underline text-gray-600 hover:bg-blue-50 hover:text-[#0066FF] font-medium transition-all px-4 py-2 rounded-lg">How It Works</a>
                  <a href="#faq" className="no-underline text-gray-600 hover:bg-blue-50 hover:text-[#0066FF] font-medium transition-all px-4 py-2 rounded-lg">FAQ</a>
                </div>
              </div>
              
              {/* Connect */}
              <div className="text-center md:text-right">
                <h3 className="text-gray-700 font-medium mb-4">Connect With Us</h3>
                <div className="flex flex-col items-center md:items-end gap-2">
                  <a 
                    href="https://www.linkedin.com/company/referra-us" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="no-underline inline-flex items-center gap-2 text-gray-600 hover:text-[#0066FF] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                    <span>LinkedIn</span>
                  </a>
                  <a 
                    href="mailto:info@referraai.com" 
                    className="no-underline text-gray-600 hover:text-[#0066FF] transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">info@referraai.com</span>
                  </a>
                </div>
              </div>
            </div>
            
            {/* Copyright */}
            <div className="text-center">
              <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()} Referra. All rights reserved.
              </p>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
