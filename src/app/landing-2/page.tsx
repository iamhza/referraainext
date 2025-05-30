'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, ArrowRightCircle, Clock, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';
import { Logo } from '@/components/ui/Logo';
import { Card } from '@/components/ui/card';

export default function LandingPage2() {
  const [email, setEmail] = useState("");
  const [showUrgencyBanner, setShowUrgencyBanner] = useState(true);
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

  const handleProviderSignup = () => {
    router.push('/auth/signup?type=provider');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50/20">
      {/* Urgency Banner */}
      {showUrgencyBanner && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 relative">
          <Container>
            <div className="flex items-center justify-center gap-3 text-sm md:text-base">
              <Clock className="h-4 w-4" />
              <span>
                <span className="font-semibold">Limited Time:</span> Get 3 months free when you sign up today
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:text-white/90 p-0"
                onClick={() => setShowUrgencyBanner(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Container>
        </div>
      )}

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
                className="bg-blue-600 hover:bg-blue-700"
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
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <Badge className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">
                Trusted by 500+ Case Managers & Service Providers
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">
                Stop Wasting <span className="text-blue-600">3+ Hours</span> Per Referral
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Get matched with perfect-fit providers in <span className="font-semibold">under 5 minutes</span>. 
                No more endless emails, phone tag, or spreadsheet chaos.
              </p>

              {/* Pain Points */}
              <div className="grid md:grid-cols-3 gap-4 mb-8 text-left">
                <div className="flex items-start gap-2">
                  <X className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                  <p className="text-gray-600">Spending hours searching for providers</p>
                </div>
                <div className="flex items-start gap-2">
                  <X className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                  <p className="text-gray-600">Playing phone tag with no responses</p>
                </div>
                <div className="flex items-start gap-2">
                  <X className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                  <p className="text-gray-600">Managing referrals in messy spreadsheets</p>
                </div>
              </div>

              {/* CTA Section */}
              <div className="max-w-md mx-auto space-y-4">
                <form onSubmit={handleStartNow} className="relative">
                  <Input
                    type="email"
                    placeholder="Enter your work email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 pl-5 pr-36 rounded-full text-lg border-2 border-gray-200 focus:border-blue-500"
                  />
                  <Button 
                    type="submit"
                    className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-700 rounded-full h-10 px-6"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
                
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Free 30-day trial • No credit card required</span>
                </div>
              </div>

              {/* Social Proof */}
              <div className="mt-12 pt-12 border-t">
                <p className="text-sm text-gray-500 mb-6">Trusted by leading organizations</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-center opacity-70">
                  {/* Replace with actual logos */}
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Container>

      {/* Stats Section */}
      <div className="bg-blue-600 text-white py-12 border-y">
        <Container>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">93%</div>
              <p className="text-blue-100">Faster Referral Process</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">15hrs</div>
              <p className="text-blue-100">Saved Per Week</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">98%</div>
              <p className="text-blue-100">Provider Response Rate</p>
            </div>
          </div>
        </Container>
      </div>

      {/* How It Works Section */}
      <section className="py-24 bg-white">
        <Container>
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <Badge className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-700">
              Simple 4-Step Process
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              From Chaos to Control in Minutes
            </h2>
            <p className="text-xl text-gray-600">
              Our AI-powered platform handles the heavy lifting, so you can focus on what matters most - your clients.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connection Lines (Desktop Only) */}
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-blue-100 -z-10 transform -translate-y-1/2" />
            
            <Card className="p-6 rounded-xl border-2 hover:border-blue-200 transition-all bg-white relative">
              <div className="mb-4 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center">
                <span className="text-xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3">One Simple Form</h3>
              <p className="text-gray-600 mb-4">
                5-minute intake form captures everything providers need to know.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Smart form auto-fills client details</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Save templates for similar referrals</span>
                </li>
              </ul>
            </Card>

            <Card className="p-6 rounded-xl border-2 hover:border-blue-200 transition-all bg-white relative">
              <div className="mb-4 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center">
                <span className="text-xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3">AI-Powered Matching</h3>
              <p className="text-gray-600 mb-4">
                Our AI finds the perfect providers in seconds, not hours.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>98% match accuracy rate</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Considers 20+ matching factors</span>
                </li>
              </ul>
            </Card>

            <Card className="p-6 rounded-xl border-2 hover:border-blue-200 transition-all bg-white relative">
              <div className="mb-4 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center">
                <span className="text-xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Choose Your Match</h3>
              <p className="text-gray-600 mb-4">
                Compare pre-vetted providers side-by-side instantly.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>View real-time availability</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Compare success metrics</span>
                </li>
              </ul>
            </Card>

            <Card className="p-6 rounded-xl border-2 hover:border-blue-200 transition-all bg-white relative">
              <div className="mb-4 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center">
                <span className="text-xl font-bold">4</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Track Everything</h3>
              <p className="text-gray-600 mb-4">
                Real-time updates in one unified dashboard.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Automated status updates</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Document sharing built-in</span>
                </li>
              </ul>
            </Card>
          </div>

          {/* Proof Points */}
          <div className="mt-16 pt-16 border-t">
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6 rounded-xl bg-blue-50/50 border-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">93% Faster</div>
                    <p className="text-gray-600">Than manual referrals</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 rounded-xl bg-blue-50/50 border-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">15,000+</div>
                    <p className="text-gray-600">Successful matches</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 rounded-xl bg-blue-50/50 border-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <ArrowRightCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">24hr</div>
                    <p className="text-gray-600">Average response time</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="bg-blue-600 hover:bg-blue-700 rounded-full text-lg h-12 px-8"
            >
              Start Making Better Referrals
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="mt-4 text-sm text-gray-500">
              Join 500+ case managers already using Referra
            </p>
          </div>
        </Container>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-white relative overflow-hidden">
        <Container>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl"></div>
          </div>

          <div className="relative">
            <div className="text-center mb-16">
              <Badge className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">
                500+ Case Managers Trust Referra
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Don't Take Our Word For It
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                See why case managers are switching to Referra and never looking back
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 rounded-xl bg-white shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                
                <p className="text-lg mb-6">
                  "It used to take me days to find a provider — now I get matched in minutes. The time savings alone is worth it, but the quality of matches is what really impressed me."
                </p>
                
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <span className="font-semibold text-blue-700">SB</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Sara B.</p>
                    <p className="text-sm text-gray-600">County Case Manager</p>
                    <p className="text-sm text-blue-600 mt-1">Reduced referral time by 85%</p>
                  </div>
                </div>
              </Card>

              <Card className="p-8 rounded-xl bg-white shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                
                <p className="text-lg mb-6">
                  "No more spreadsheets or chasing updates. I finally feel in control of my caseload. The automated updates and tracking save me hours of follow-up time."
                </p>
                
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <span className="font-semibold text-blue-700">JM</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Juan M.</p>
                    <p className="text-sm text-gray-600">Nonprofit TCM</p>
                    <p className="text-sm text-blue-600 mt-1">Manages 50+ referrals/month</p>
                  </div>
                </div>
              </Card>

              <Card className="p-8 rounded-xl bg-white shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                
                <p className="text-lg mb-6">
                  "My team moved all referrals to Referra. The ROI was immediate - we're saving 15+ hours per week on referral management."
                </p>
                
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <span className="font-semibold text-blue-700">LT</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Linda T.</p>
                    <p className="text-sm text-gray-600">Housing Stabilization Lead</p>
                    <p className="text-sm text-blue-600 mt-1">100% team adoption</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Trust Indicators */}
            <div className="mt-16 pt-16 border-t">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">500+</div>
                  <p className="text-sm text-gray-600">Active Case Managers</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">15k+</div>
                  <p className="text-sm text-gray-600">Referrals Processed</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">98%</div>
                  <p className="text-sm text-gray-600">Satisfaction Rate</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">24/7</div>
                  <p className="text-sm text-gray-600">Support Available</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-16 text-center">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="bg-blue-600 hover:bg-blue-700 rounded-full text-lg h-12 px-8"
              >
                Join Successful Case Managers
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="mt-4 text-sm text-gray-500">
                30-day free trial • No credit card required
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Provider Value Section */}
      <section className="py-24 bg-white border-y">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get Referred by the Case Managers Who Matter
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join the referral network built for providers who serve Medicaid and waiver clients.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 rounded-xl border-2 hover:border-blue-200 transition-all">
              <div className="mb-4 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <ArrowRightCircle className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Be Seen by the Right Case Managers</h3>
              <p className="text-gray-600">
                AI matches your profile to active referrals that fit your services and availability.
              </p>
            </Card>

            <Card className="p-6 rounded-xl border-2 hover:border-blue-200 transition-all">
              <div className="mb-4 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <ArrowRightCircle className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Showcase What Makes You Great</h3>
              <p className="text-gray-600">
                Create a strong provider profile — services, licenses, open capacity, and more.
              </p>
            </Card>

            <Card className="p-6 rounded-xl border-2 hover:border-blue-200 transition-all">
              <div className="mb-4 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <ArrowRightCircle className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Manage Referrals from Start to Service</h3>
              <p className="text-gray-600">
                No more missed emails. Get notified, accept or decline, track tasks, and update case managers — all in one place.
              </p>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              onClick={handleProviderSignup}
              className="bg-blue-600 hover:bg-blue-700 rounded-full text-lg h-12 px-8"
            >
              Apply to Join the Network
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </Container>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-white">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">
              Designed for People Who Care
            </h2>
            
            <blockquote className="text-xl md:text-2xl text-gray-700 mb-8">
              "We're not a tech company trying to break into social services. We're social service people who built tech to make this work better for everyone."
            </blockquote>
            
            <p className="text-lg text-gray-600">
              This isn't just a platform — it's a mission to make referrals easier, more transparent, and less exhausting for everyone involved.
            </p>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white border-y">
        <Container>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            What You Get
          </h2>

          <div className="grid md:grid-cols-2 gap-12">
            <Card className="p-8 rounded-xl border-2">
              <h3 className="text-2xl font-bold mb-6">Case Managers</h3>
              <ul className="space-y-4">
                {[
                  'One referral form, many matches',
                  'AI-powered matching',
                  'Dashboard to track all referrals',
                  'Weekly provider updates',
                  'Built-in task and document sharing',
                  'No searching, no cold calling'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-8 rounded-xl border-2">
              <h3 className="text-2xl font-bold mb-6">Providers</h3>
              <ul className="space-y-4">
                {[
                  'Referral queue access',
                  'Personalized match alerts',
                  'Provider profile dashboard',
                  'Communication + task tracking',
                  'Capacity visibility',
                  'Ongoing profile optimization'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Container>
      </section>

      {/* Trust Section */}
      <section className="py-12 bg-gradient-to-br from-blue-50 to-white">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Powered by Trust. Backed by Vetted Providers.
            </h2>
            <p className="text-lg text-gray-600">
              We vet every provider in our system before they're matched to case managers.
              No more guessing who's active, who's full, or who never replies.
            </p>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white border-t">
        <Container>
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-12">
              Start Using Referra
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="bg-blue-600 hover:bg-blue-700 rounded-full text-lg h-12 px-8"
              >
                Start Referring Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={handleProviderSignup}
                className="rounded-full text-lg h-12 px-8 border-2"
              >
                Become a Matched Provider
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
} 