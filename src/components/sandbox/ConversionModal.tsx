/**
 * Conversion Modal
 * 
 * 3-step modal for converting sandbox to production account:
 * Step 1: Confirmation & Organization Details
 * Step 2: BAA Signing (e-signature)
 * Step 3: Success & Onboarding Checklist
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle2, Loader2, ArrowRight, Building2, 
  FileSignature, Sparkles, Users, Upload, FileText 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Step = 'confirmation' | 'baa' | 'success';

interface ConversionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sandboxOrgId: string;
  tier: 'micro' | 'mid' | 'enterprise';
}

export function ConversionModal({ 
  open, 
  onOpenChange, 
  sandboxOrgId,
  tier 
}: ConversionModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [step, setStep] = useState<Step>('confirmation');
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [orgName, setOrgName] = useState('');
  const [orgDomain, setOrgDomain] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminTitle, setAdminTitle] = useState('');
  const [productionOrgId, setProductionOrgId] = useState<string | null>(null);
  
  // ========================================================================
  // STEP 1: CONFIRMATION & ORG DETAILS
  // ========================================================================
  
  const handleConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orgName || !adminName || !adminTitle) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    setStep('baa');
  };
  
  // ========================================================================
  // STEP 2: BAA SIGNING (Simplified for MVP - can integrate PandaDoc later)
  // ========================================================================
  
  const handleBAAComplete = async () => {
    setLoading(true);
    
    try {
      // Call conversion API
      const response = await fetch('/api/sandbox/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sandboxOrgId,
          orgDetails: {
            orgName,
            orgDomain,
            adminName,
            adminTitle,
          },
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Conversion failed');
      }
      
      const data = await response.json();
      setProductionOrgId(data.productionOrgId);
      
      toast({
        title: '🎉 Welcome to Referra!',
        description: 'Your production account is ready.',
      });
      
      setStep('success');
      
    } catch (error: any) {
      console.error('Conversion error:', error);
      toast({
        title: 'Conversion Failed',
        description: error.message || 'Please try again or contact support',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // ========================================================================
  // STEP 3: SUCCESS
  // ========================================================================
  
  const handleGetStarted = () => {
    onOpenChange(false);
    // Force reload to update session with production org
    window.location.reload();
  };
  
  // ========================================================================
  // RENDER
  // ========================================================================
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {/* Step 1: Confirmation */}
        {step === 'confirmation' && (
          <>
            <DialogHeader>
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <DialogTitle className="text-2xl text-center">
                Ready to make this real?
              </DialogTitle>
              <DialogDescription className="text-center">
                Let's set up your production organization
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* What happens next */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm text-blue-900 mb-3">
                  What happens next:
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm text-blue-800">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-blue-600" />
                    <span>Fresh production environment (demo data won't transfer)</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-blue-800">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-blue-600" />
                    <span>Your demo remains accessible for 7 days (for training)</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-blue-800">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-blue-600" />
                    <span>Same login credentials work for both</span>
                  </div>
                </div>
              </div>
              
              {/* Organization Details Form */}
              <form onSubmit={handleConfirmation} className="space-y-4">
                <div>
                  <Label htmlFor="orgName">
                    Organization Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="TruWell Minnesota"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="orgDomain">
                    Organization Domain <span className="text-gray-500 text-xs">(optional)</span>
                  </Label>
                  <Input
                    id="orgDomain"
                    value={orgDomain}
                    onChange={(e) => setOrgDomain(e.target.value)}
                    placeholder="truwellmn"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Used for custom login URL: {orgDomain || 'yourorg'}.referra.com
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="adminName">
                      Your Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="adminName"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="adminTitle">
                      Your Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="adminTitle"
                      value={adminTitle}
                      onChange={(e) => setAdminTitle(e.target.value)}
                      placeholder="Director of Operations"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1"
                  >
                    Not Yet
                  </Button>
                  <Button type="submit" className="flex-1">
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          </>
        )}
        
        {/* Step 2: BAA Signing */}
        {step === 'baa' && (
          <>
            <DialogHeader>
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <FileSignature className="h-6 w-6 text-purple-600" />
              </div>
              <DialogTitle className="text-2xl text-center">
                Business Associate Agreement
              </DialogTitle>
              <DialogDescription className="text-center">
                Required for HIPAA compliance
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* BAA Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm text-gray-900 mb-3">
                  Why we need this:
                </h4>
                <p className="text-sm text-gray-700">
                  Since Referra handles protected health information (PHI), HIPAA requires 
                  a Business Associate Agreement between your organization and ours. This 
                  protects both parties and ensures compliance.
                </p>
              </div>
              
              {/* Simplified BAA (MVP - can integrate e-signature later) */}
              <div className="border border-gray-200 rounded-lg p-6 max-h-[300px] overflow-y-auto">
                <h4 className="font-bold text-sm mb-3">Business Associate Agreement</h4>
                <div className="text-xs text-gray-600 space-y-2">
                  <p><strong>Between:</strong> {orgName} ("Covered Entity")</p>
                  <p><strong>And:</strong> Referra, Inc. ("Business Associate")</p>
                  <p className="pt-2">
                    This Agreement establishes the terms under which Referra will 
                    create, receive, maintain, or transmit Protected Health Information (PHI) 
                    on behalf of {orgName}.
                  </p>
                  <p className="pt-2">
                    <strong>Business Associate agrees to:</strong>
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Use appropriate safeguards to prevent use or disclosure of PHI</li>
                    <li>Report any security incidents or breaches</li>
                    <li>Ensure compliance with HIPAA Privacy and Security Rules</li>
                    <li>Make PHI available to individuals upon request</li>
                    <li>Return or destroy PHI upon termination</li>
                  </ul>
                  <p className="pt-2 text-gray-500">
                    [This is a simplified version for demo purposes. Full BAA will be provided via DocuSign.]
                  </p>
                </div>
              </div>
              
              {/* Signature Section */}
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <input 
                    type="checkbox" 
                    id="baa-agree" 
                    className="mt-1"
                    required
                  />
                  <Label htmlFor="baa-agree" className="text-sm text-gray-700 cursor-pointer">
                    I, {adminName}, {adminTitle} of {orgName}, agree to the terms 
                    of this Business Associate Agreement on behalf of my organization.
                  </Label>
                </div>
                
                <p className="text-xs text-gray-500">
                  By checking this box, you're providing your electronic signature. 
                  A copy will be sent to your email.
                </p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('confirmation')}
                  className="flex-1"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleBAAComplete}
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Activating...
                    </>
                  ) : (
                    <>
                      Sign & Activate
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
        
        {/* Step 3: Success */}
        {step === 'success' && (
          <>
            <DialogHeader>
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <DialogTitle className="text-2xl text-center">
                Welcome to Referra! 🎉
              </DialogTitle>
              <DialogDescription className="text-center">
                Your production account is ready. Let's get you started.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Onboarding Checklist */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm text-blue-900 mb-3">
                  🚀 Next Steps - Get Started in Minutes
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <Users className="h-4 w-4 shrink-0" />
                    <span>Invite your team members</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <Upload className="h-4 w-4 shrink-0" />
                    <span>Import your clients (CSV upload)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <FileText className="h-4 w-4 shrink-0" />
                    <span>Create your first real referral</span>
                  </div>
                </div>
              </div>
              
              {/* Demo Still Available */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm text-yellow-900 mb-1">
                      Your demo is still available
                    </h4>
                    <p className="text-sm text-yellow-800">
                      Use it to train your team for the next 7 days. Access it anytime 
                      from your account settings.
                    </p>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleGetStarted}
                className="w-full"
                size="lg"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

