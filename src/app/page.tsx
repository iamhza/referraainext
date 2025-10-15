'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, Users, Shield, Clock, MessageSquare, FileText, Zap, Star, TrendingUp, Target, Calendar, BarChart3, Phone, AlertCircle, Play, Eye, Sparkles } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Logo } from '@/components/ui/Logo';

export default function LandingPage() {
  const router = useRouter();

  const handleTryDemo = () => {
    router.push('/auth/sandbox-signup');
  };

  const handleGetStarted = () => {
    router.push('/auth/signup?type=case-manager');
  };

  const handleWatchDemo = () => {
    // Implement demo logic
    console.log('Watch demo');
  };

  const handleSignIn = () => {
    router.push('/auth/signin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-700 via-30% to-secondary-500 overflow-hidden relative">
      {/* Advanced Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(63,105,178,0.3),rgba(109,205,210,0.1))]" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary-800/20 via-transparent to-secondary-400/20" />
      
      {/* Professional Background Elements */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>
      <div className="absolute top-20 right-20 w-96 h-96 bg-secondary-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-primary-400/10 rounded-full blur-3xl" />
      
      {/* Header - Ultra Modern */}
      <header className="absolute top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/5 border-b border-white/10">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex justify-between h-16 items-center">
            <Logo className="h-8 w-auto transition-transform hover:scale-105 duration-300" />
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#product" className="text-white/80 hover:text-white font-medium text-sm tracking-wider uppercase transition-all duration-300 hover:scale-105 relative group">
                PRODUCT
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-orange-400 group-hover:w-full transition-all duration-300" />
              </a>
              <a href="#solutions" className="text-white/80 hover:text-white font-medium text-sm tracking-wider uppercase transition-all duration-300 hover:scale-105 relative group">
                SOLUTIONS
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-orange-400 group-hover:w-full transition-all duration-300" />
              </a>
              <a href="#pricing" className="text-white/80 hover:text-white font-medium text-sm tracking-wider uppercase transition-all duration-300 hover:scale-105 relative group">
                PRICING
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-orange-400 group-hover:w-full transition-all duration-300" />
              </a>
              <a href="#enterprise" className="text-white/80 hover:text-white font-medium text-sm tracking-wider uppercase transition-all duration-300 hover:scale-105 relative group">
                ENTERPRISE
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-orange-400 group-hover:w-full transition-all duration-300" />
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={handleSignIn} 
                className="text-white/80 hover:text-white hover:bg-white/10 font-medium text-sm px-4 py-2 transition-all duration-300 hover:scale-105"
              >
                Login
              </Button>
              <Button 
                onClick={handleTryDemo}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] backdrop-blur-sm"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Try Demo Free
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Ultra Modern */}
      <section className="relative min-h-screen flex items-center">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-8xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-24 items-center min-h-[95vh] py-24">
            
            {/* Left Side - Hero Content - Expanded Width */}
            <div className="space-y-12 text-white animate-in fade-in-0 slide-in-from-left-8 duration-1000 max-w-4xl">
              {/* Tagline - Advanced Typography */}
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-full px-5 py-3 text-xs font-semibold tracking-[0.2em] text-white/90 uppercase border border-white/20 shadow-2xl">
                <div className="w-2 h-2 bg-gradient-to-r from-secondary-400 to-primary-500 rounded-full animate-pulse" />
                SMART REFERRALS. ORGANIZED CARE. BUILT FOR CASE MANAGERS.
              </div>
              
              {/* Main Headline - Improved Copy & Professional Colors */}
              <h1 className="text-6xl md:text-7xl lg:text-9xl font-black leading-[0.85] tracking-tighter">
                <span className="bg-gradient-to-br from-white via-white to-white/90 bg-clip-text text-transparent drop-shadow-2xl">
                  The Last Referral<br />
                  Form You'll<br />
                  Ever Fill Out.
                </span>
              </h1>
              
              {/* Subhead - Emotional Hook */}
              <p className="text-2xl md:text-3xl text-white/85 leading-relaxed max-w-3xl font-light tracking-wide">
                Finally, a platform that connects case managers, providers, and agencies — so 
                <span className="text-secondary-300 font-medium"> clients get placed faster</span> and 
                <span className="text-primary-300 font-medium"> nothing slips through the cracks</span>.
              </p>
              
              {/* Executive Angle */}
              <p className="text-lg text-white/70 font-medium max-w-2xl border-l-2 border-secondary-400/50 pl-4">
                Track outcomes across all referrals, reduce admin hours, and stay audit-ready.
              </p>
              
              {/* CTAs - Improved Hierarchy */}
              <div className="flex flex-col sm:flex-row gap-6 pt-8">
                <Button 
                  onClick={handleTryDemo}
                  className="group bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-400 hover:to-secondary-500 text-white text-xl px-12 py-5 rounded-2xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_50px_rgba(109,205,210,0.4)] relative overflow-hidden shadow-2xl"
                >
                  <Sparkles className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
                  <span className="relative z-10">Try Interactive Demo Free →</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleWatchDemo}
                  className="group text-white hover:bg-white/10 text-xl px-12 py-5 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 border-2 border-white/30 hover:border-white/50 backdrop-blur-sm"
                >
                  <Play className="w-6 h-6 mr-3 fill-current group-hover:scale-110 transition-transform duration-300" />
                  Watch Video
                </Button>
              </div>
              
              {/* Demo Benefits */}
              <div className="flex flex-wrap gap-6 text-white/70 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-secondary-400" />
                  <span>2-minute setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-secondary-400" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-secondary-400" />
                  <span>Full platform access</span>
                </div>
              </div>

              {/* Trust Section - Moved Up & Enhanced */}
              <div className="pt-12 space-y-8">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                  <p className="text-white/60 text-sm uppercase tracking-[0.3em] font-bold mb-4">
                    TRUSTED BY MINNESOTA'S LEADING HEALTHCARE ORGANIZATIONS
                  </p>
                  <div className="flex flex-wrap items-center gap-10">
                    {['HENNEPIN COUNTY', 'RAMSEY COUNTY', 'DAKOTA COUNTY', 'WASHINGTON COUNTY'].map((county, index) => (
                      <div 
                        key={county}
                        className="text-white/70 font-bold text-base tracking-wider hover:text-white/90 transition-all duration-300 hover:scale-110 cursor-pointer"
                        style={{animationDelay: `${index * 100}ms`}}
                      >
                        {county}
                      </div>
                    ))}
                </div>
                </div>
                
                {/* Micro Testimonial */}
                <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                  <p className="text-white/90 text-lg italic mb-3">"Referra cut my referral time in half. It's the only tool I trust for my caseload."</p>
                  <p className="text-white/60 text-sm font-medium">— Sarah M., Case Manager @ Accord Healthcare</p>
                </div>
              </div>
            </div>

            {/* Right Side - Enhanced Larger Cards */}
            <div className="relative lg:pl-8 space-y-10 animate-in fade-in-0 slide-in-from-right-8 duration-1000 delay-300">
              
              {/* Success Metrics Card - Larger & Outcome-Driven */}
              <div className="group bg-gradient-to-br from-white/25 via-white/15 to-white/5 backdrop-blur-2xl rounded-3xl p-10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/20 hover:border-white/40 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary-500/10 via-transparent to-primary-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <div className="text-6xl font-black text-white tracking-tight mb-3 bg-gradient-to-br from-white to-white/80 bg-clip-text text-transparent">82%</div>
                      <div className="text-base text-white/80 flex items-center gap-3 font-medium tracking-wide">
                        Referrals Complete 
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                          <div className="w-2.5 h-2.5 rounded-full bg-white/90 animate-pulse"></div>
                      </div>
                      </div>
                    </div>
                    <div className="text-sm text-white/60 font-bold tracking-wider bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm border border-white/20">35 / 42</div>
                  </div>
                  <div className="mb-6">
                    <div className="text-white/70 text-sm font-medium mb-3">within 7 days</div>
                    <div className="w-full bg-gradient-to-r from-white/20 via-white/10 to-white/20 rounded-full h-5 backdrop-blur-sm shadow-inner">
                      <div className="bg-gradient-to-r from-secondary-400 via-secondary-500 to-primary-400 h-5 rounded-full shadow-lg transition-all duration-1000 ease-out" style={{width: '82%'}}></div>
                    </div>
                  </div>
                </div>
          </div>
          
              {/* Workflow Efficiency Card - Larger & Outcome-Driven */}
              <div className="group bg-gradient-to-br from-white/25 via-white/15 to-white/5 backdrop-blur-2xl rounded-3xl p-10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/20 hover:border-white/40 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-secondary-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 mb-8">
                  <div className="text-2xl font-bold text-white mb-3 tracking-tight">One Form. 5 Vetted Providers.</div>
                  <div className="text-base text-white/80 leading-relaxed font-light">
                    Clients placed without delays. Track everything in the service feed and collaborate seamlessly with your team.
                </div>
              </div>
              
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Star className="w-6 h-6 text-amber-400 fill-amber-400 drop-shadow-lg" />
                    <span className="text-base font-bold text-white tracking-wide">4.8/5</span>
              </div>
              
                  <div className="flex items-center gap-8">
                    <div className="flex -space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-3 border-white/30 backdrop-blur-sm shadow-lg transition-transform hover:scale-110"></div>
                      <div className="w-10 h-10 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full border-3 border-white/30 backdrop-blur-sm shadow-lg transition-transform hover:scale-110"></div>
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full border-3 border-white/30 backdrop-blur-sm shadow-lg transition-transform hover:scale-110"></div>
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full border-3 border-white/30 backdrop-blur-sm shadow-lg flex items-center justify-center text-sm text-white font-black transition-transform hover:scale-110">+12</div>
                    </div>
                    
                    <div className="flex items-center gap-5 text-base text-white/70">
                      <div className="flex items-center gap-2 hover:text-white/90 transition-colors cursor-pointer">
                        <Eye className="w-5 h-5" />
                        <span className="font-medium">156</span>
                  </div>
                      <div className="flex items-center gap-2 hover:text-white/90 transition-colors cursor-pointer">
                        <MessageSquare className="w-5 h-5" />
                        <span className="font-medium">43</span>
                    </div>
                      <div className="flex items-center gap-2 hover:text-white/90 transition-colors cursor-pointer">
                        <FileText className="w-5 h-5" />
                        <span className="font-medium">8</span>
                  </div>
                    </div>
                  </div>
                </div>
          </div>
          
              {/* Community Growth Card - Larger & Social Proof */}
              <div className="group bg-gradient-to-br from-white/25 via-white/15 to-white/5 backdrop-blur-2xl rounded-3xl p-10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/20 hover:border-white/40 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-secondary-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <div className="text-2xl font-bold text-white mb-3 tracking-tight">Join 500+ Case Managers</div>
                      <div className="text-base text-white/80 font-medium">
                        Already streamlining referrals with Referra
            </div>
          </div>
                    <Button className="bg-gradient-to-r from-secondary-500/80 to-secondary-600/80 hover:from-secondary-400 hover:to-secondary-500 text-white border border-secondary-400/40 hover:border-secondary-400/60 text-base px-8 py-4 rounded-2xl font-bold tracking-wide transition-all duration-300 hover:scale-105 backdrop-blur-sm shadow-lg hover:shadow-secondary-400/25">
                      JOIN COMMUNITY →
                    </Button>
          </div>
          
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="flex items-center gap-4 text-base">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm border border-white/20">
                          <span className="text-white text-sm font-black">R</span>
                </div>
                        <span className="font-semibold text-white/90 tracking-wide">Referra Network</span>
            </div>
          </div>

                    <div className="flex -space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-3 border-white/30 backdrop-blur-sm shadow-lg transition-transform hover:scale-110"></div>
                      <div className="w-12 h-12 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full border-3 border-white/30 backdrop-blur-sm shadow-lg transition-transform hover:scale-110"></div>
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full border-3 border-white/30 backdrop-blur-sm shadow-lg transition-transform hover:scale-110"></div>
              </div>
            </div>
                </div>
              </div>

            </div>
            </div>
          </div>
      </section>

    </div>
  );
}

