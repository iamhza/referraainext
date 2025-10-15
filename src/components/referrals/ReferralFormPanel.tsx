'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2, AlertCircle, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { WAIVER_TYPE_OPTIONS, formatWaiverTypeShort } from '@/lib/formatting';

// Types from original form
type InsuranceType = 'medicaid' | 'medicare' | 'private' | 'none';
type ServiceType = 'mental_health' | 'substance_abuse' | 'housing' | 'employment' | 'healthcare' | 'legal' | 'financial' | 'transportation';
type UrgencyLevel = 'low' | 'medium' | 'high';

interface FormData {
  // Step 1: Client Details
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | 'other' | '';
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  insurance: InsuranceType | '';
  pmiNumber: string;
  waiverType: string;
  historyOfViolence: boolean;
  
  // Step 2: Service Selection
  selectedServices: string[];
  
  // Step 3: Additional Considerations
  referralReason: string;
  genderPreference: 'male' | 'female' | 'no-preference' | '';
  culturalConsiderations: string;
  mobilityStatus: 'ambulatory' | 'wheelchair-bound' | 'bed-bound' | 'other' | '';
  primaryDiagnosis: string;
  livingSituation: 'alone' | 'with-family' | 'group-setting' | 'other' | '';
  
  // Step 4: Service Start Date
  requestedStartDate: Date | undefined;
  
  // Legacy compatibility
  email: string;
  preferredContactMethod: 'email' | 'phone' | 'both';
  service_type: ServiceType | '';
  selectedService: string;
  urgency: UrgencyLevel | '';
  counties: string[];
  additionalNotes: string;
  primaryLanguage: string;
  needsTranslator: boolean;
  insuranceProvider?: string;
  insuranceNumber?: string;
}

interface ReferralFormPanelProps {
  onComplete?: () => void;
  prefilledClient?: any;
  draftId?: string;
  draftData?: any;
}

export function ReferralFormPanel({ onComplete, prefilledClient, draftId, draftData }: ReferralFormPanelProps) {
  const [step, setStep] = useState(draftData?.currentStep || 1);
  const [services, setServices] = useState<{
    residential: string[];
    nonResidential: string[];
  }>({ residential: [], nonResidential: [] });
  const [servicesLoading, setServicesLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    // Step 1: Client Details - Pre-fill from draft, prefilledClient, or empty
    firstName: draftData?.formData?.firstName || prefilledClient?.firstName || '',
    lastName: draftData?.formData?.lastName || prefilledClient?.lastName || '',
    dateOfBirth: draftData?.formData?.dateOfBirth || prefilledClient?.dateOfBirth || '',
    sex: draftData?.formData?.sex || prefilledClient?.sex || '',
    phone: draftData?.formData?.phone || prefilledClient?.phone || prefilledClient?.phoneNumber || '',
    address: draftData?.formData?.address || prefilledClient?.address?.street || prefilledClient?.address || '',
    city: draftData?.formData?.city || prefilledClient?.address?.city || prefilledClient?.city || '',
    state: draftData?.formData?.state || prefilledClient?.address?.state || prefilledClient?.state || '',
    zipCode: draftData?.formData?.zipCode || prefilledClient?.address?.zipCode || prefilledClient?.zipCode || '',
    insurance: draftData?.formData?.insurance || prefilledClient?.insurance?.type || prefilledClient?.insurance || '',
    pmiNumber: draftData?.formData?.pmiNumber || prefilledClient?.pmiNumber || '',
    waiverType: draftData?.formData?.waiverType || prefilledClient?.waiverType || '',
    historyOfViolence: draftData?.formData?.historyOfViolence || prefilledClient?.historyOfViolence || false,
    
    // Step 2: Service Selection
    selectedServices: draftData?.formData?.selectedServices || [],
    
    // Step 3: Additional Considerations
    referralReason: draftData?.formData?.referralReason || '',
    genderPreference: draftData?.formData?.genderPreference || '',
    culturalConsiderations: draftData?.formData?.culturalConsiderations || '',
    mobilityStatus: draftData?.formData?.mobilityStatus || prefilledClient?.mobilityStatus || '',
    primaryDiagnosis: draftData?.formData?.primaryDiagnosis || '',
    livingSituation: draftData?.formData?.livingSituation || '',
    
    // Step 4: Service Start Date
    requestedStartDate: draftData?.formData?.requestedStartDate ? new Date(draftData.formData.requestedStartDate) : undefined,
    
    // Legacy compatibility
    email: draftData?.formData?.email || prefilledClient?.email || '',
    preferredContactMethod: draftData?.formData?.preferredContactMethod || 'both',
    service_type: draftData?.formData?.service_type || '',
    selectedService: draftData?.formData?.selectedService || '',
    urgency: draftData?.formData?.urgency || 'medium',
    counties: draftData?.formData?.counties || [],
    additionalNotes: draftData?.formData?.additionalNotes || '',
    primaryLanguage: draftData?.formData?.primaryLanguage || prefilledClient?.primaryLanguage || 'English',
    needsTranslator: draftData?.formData?.needsTranslator || prefilledClient?.needsTranslator || false,
    insuranceProvider: draftData?.formData?.insuranceProvider || prefilledClient?.insurance?.provider || '',
    insuranceNumber: draftData?.formData?.insuranceNumber || prefilledClient?.insurance?.number || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch services on component mount
  useEffect(() => {
    async function fetchServices() {
      try {
        const response = await fetch('/api/services');
        if (!response.ok) throw new Error('Failed to fetch services');
        const data = await response.json();
        setServices(data.services);
      } catch (err) {
        console.error('Error fetching services:', err);
        // Use fallback services if API fails
        setServices({
          residential: [
            'Assisted Living', 'Memory Care', 'Nursing Home', 'Independent Living',
            'Group Home', 'Adult Family Home', 'Residential Treatment', 'Hospice Care'
          ],
          nonResidential: [
            'Home Health Care', 'Personal Care Assistant', 'Medical Transportation',
            'Meal Delivery', 'Physical Therapy', 'Mental Health Counseling',
            'Substance Abuse Treatment', 'Case Management', 'Adult Day Care'
          ]
        });
      } finally {
        setServicesLoading(false);
      }
    }
    fetchServices();
  }, []);

  const totalSteps = 4;
  const isLastStep = step === totalSteps;

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Check for client ID in prefilledClient
      const clientIdFromPrefill = prefilledClient?._id;
      
      // Format data for API - matching the original form's structure
      const referralData = {
        clientInfo: {
          ...(clientIdFromPrefill ? { _id: clientIdFromPrefill } : {}),
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth,
          sex: formData.sex,
          email: formData.email,
          phone: formData.phone,
          address: {
            street: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode
          },
          preferredContactMethod: formData.preferredContactMethod,
          insurance: {
            type: formData.insurance,
            provider: formData.insuranceProvider || '',
            number: formData.insuranceNumber || ''
          },
          pmiNumber: formData.pmiNumber,
          waiverType: formData.waiverType,
          historyOfViolence: formData.historyOfViolence,
          primaryLanguage: formData.primaryLanguage,
          needsTranslator: formData.needsTranslator,
          culturalConsiderations: formData.culturalConsiderations,
          mobilityStatus: formData.mobilityStatus,
          primaryDiagnosis: formData.primaryDiagnosis,
          livingSituation: formData.livingSituation
        },
        serviceDetails: {
          type: formData.selectedService,
          urgency: formData.urgency,
          counties: formData.counties,
          additionalNotes: formData.additionalNotes,
          referralReason: formData.referralReason,
          requestedStartDate: formData.requestedStartDate
        },
        providerPreferences: {
          providerType: 'no-preference',
          genderPreference: formData.genderPreference,
          insuranceAccepted: [],
          languages: formData.primaryLanguage ? [formData.primaryLanguage] : [],
          availableTimes: [],
          emergencyServices: false,
          showAvailableOnly: false
        }
      };
      
      // console.log('🚀 SUBMITTING REFERRAL DATA:', JSON.stringify(referralData, null, 2));
      
      // Submit to API - same endpoint as original form
      const response = await fetch('/api/referrals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(referralData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to submit referral');
      }
      
      const result = await response.json();
      console.log('Referral submitted successfully:', result);
      
      // Success
      toast({
        title: "Referral Created Successfully",
        description: `Referral for ${formData.firstName} ${formData.lastName} has been submitted.`,
        duration: 5000,
      });

      onComplete?.();
      
    } catch (error) {
      console.error('Failed to create referral:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create referral. Please try again.';
      setSubmitError(errorMessage);
      toast({
        title: "Error Creating Referral",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepTitle = (stepNum: number) => {
    switch (stepNum) {
      case 1: return "Client Information";
      case 2: return "Service Selection";
      case 3: return "Additional Details";
      case 4: return "Start Date";
      default: return "Step";
    }
  };

  const getStepDescription = (stepNum: number) => {
    switch (stepNum) {
      case 1: return "Basic client details and contact information";
      case 2: return "Select the services needed for this client";
      case 3: return "Additional considerations and requirements";
      case 4: return "When would you like services to begin?";
      default: return "";
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Compact Header with Step Progress */}
      <div className="flex-shrink-0 px-5 py-3.5 border-b border-gray-200/60">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {getStepTitle(step)}
            </h2>
            <p className="text-sm text-gray-600">
              {getStepDescription(step)}
            </p>
          </div>
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {step}/{totalSteps}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-5"
            >
              {step === 1 && <Step1ClientInfo formData={formData} onChange={handleInputChange} />}
              {step === 2 && <Step2ServiceSelection formData={formData} onChange={handleInputChange} services={services} servicesLoading={servicesLoading} />}
              {step === 3 && <Step3AdditionalDetails formData={formData} onChange={handleInputChange} />}
              {step === 4 && <Step4StartDate formData={formData} onChange={handleInputChange} />}
            </motion.div>
          </AnimatePresence>

          {submitError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {submitError}
            </div>
          )}
        </div>
      </div>

      {/* Footer with Navigation */}
      <div className="flex-shrink-0 px-5 py-3.5 border-t border-gray-200/60 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={step === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isLastStep ? 'Creating...' : 'Processing...'}
              </>
            ) : (
              <>
                {isLastStep ? 'Create Referral' : 'Continue'}
                {!isLastStep && <ArrowRight className="w-4 h-4" />}
                {isLastStep && <Check className="w-4 h-4" />}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Step Components - Preserving your beautiful Airbnb-inspired design
function Step1ClientInfo({ formData, onChange }: { formData: FormData; onChange: (field: keyof FormData, value: any) => void }) {
  return (
    <div className="space-y-6">
      {/* Pre-filled Client Banner */}
      {formData.firstName && formData.lastName && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="inline-flex items-center px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-800 font-medium text-sm">
              Client information pre-filled for {formData.firstName} {formData.lastName}
            </span>
          </div>
        </motion.div>
      )}

      <div className="space-y-6">
        {/* Names - Side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-base font-medium text-gray-900">
              First Name
            </Label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                  <svg className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => onChange('firstName', e.target.value)}
                placeholder="First name"
                className="h-14 text-base pl-14 pr-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Client's legal first name
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-base font-medium text-gray-900">
              Last Name
            </Label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                  <svg className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => onChange('lastName', e.target.value)}
                placeholder="Last name"
                className="h-14 text-base pl-14 pr-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Client's legal last name
            </p>
          </div>
        </div>

        {/* Date of Birth - Full width for better calendar UX */}
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth" className="text-base font-medium text-gray-900">
            Date of Birth
          </Label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                <svg className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => onChange('dateOfBirth', e.target.value)}
              className="h-14 text-base pl-14 pr-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm"
              max={new Date().toISOString().split('T')[0]}
              min="1900-01-01"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">📅 Required for age verification</p>
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label htmlFor="sex" className="text-base font-medium text-gray-900">
            Gender Identity
          </Label>
          <Select 
            value={formData.sex}
            onValueChange={(value) => onChange('sex', value)}
          >
            <SelectTrigger className="group h-14 text-base bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm">
              <div className="flex items-center w-full">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 mr-3 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                  <svg className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <SelectValue placeholder="Select gender identity" />
                </div>
              </div>
            </SelectTrigger>
            <SelectContent className="z-50 max-h-96 overflow-y-auto bg-white/95 backdrop-blur-xl border-2 border-gray-200/50 rounded-2xl shadow-2xl ring-1 ring-black/5">
              <SelectItem value="male" className="h-12 text-base px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5 focus:bg-gradient-to-r focus:from-primary/10 focus:to-secondary/10 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Male</SelectItem>
              <SelectItem value="female" className="h-12 text-base px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5 focus:bg-gradient-to-r focus:from-primary/10 focus:to-secondary/10 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Female</SelectItem>
              <SelectItem value="non-binary" className="h-12 text-base px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5 focus:bg-gradient-to-r focus:from-primary/10 focus:to-secondary/10 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Non-binary</SelectItem>
              <SelectItem value="prefer-not-to-say" className="h-12 text-base px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5 focus:bg-gradient-to-r focus:from-primary/10 focus:to-secondary/10 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Prefer not to say</SelectItem>
              <SelectItem value="other" className="h-12 text-base px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5 focus:bg-gradient-to-r focus:from-primary/10 focus:to-secondary/10 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Other</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Optional, used for provider matching preferences
          </p>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-base font-medium text-gray-900">
            Email Address
          </Label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                <svg className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
            </div>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => onChange('email', e.target.value)}
              placeholder="client@example.com"
              className="h-14 text-base pl-14 pr-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
            Optional email for updates and communication
          </p>
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-base font-medium text-gray-900">
            Phone Number
          </Label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                <svg className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
            </div>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              placeholder="(XXX) XXX-XXXX"
              className="h-14 text-base pl-14 pr-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Primary contact number for scheduling
          </p>
        </div>

        {/* Address Section */}
        <div className="space-y-4">
          <Label className="text-base font-medium text-gray-900">
            Mailing Address
          </Label>
          <p className="text-xs text-gray-500">🏠 Where we can send important documents</p>
          
          <div className="space-y-3">
            {/* Street Address */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                  <svg className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              </div>
              <Input
                placeholder="Street Address"
                value={formData.address}
                onChange={(e) => onChange('address', e.target.value)}
                className="h-14 text-base pl-14 pr-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm"
                required
              />
            </div>
            
            {/* City, State, ZIP */}
            <div className="grid grid-cols-3 gap-3">
              <div className="relative group col-span-2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                    <svg className="w-3 h-3 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <Input
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => onChange('city', e.target.value)}
                  className="h-12 text-sm pl-11 pr-3 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm"
                  required
                />
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                    <svg className="w-3 h-3 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                  </div>
                </div>
                <Input
                  placeholder="ZIP"
                  value={formData.zipCode}
                  onChange={(e) => onChange('zipCode', e.target.value)}
                  className="h-12 text-sm pl-11 pr-3 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Insurance & PMI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="insurance" className="text-base font-medium text-gray-900">
              Primary Insurance
            </Label>
            <Select 
              value={formData.insurance}
              onValueChange={(value) => onChange('insurance', value)}
            >
              <SelectTrigger className="group h-14 text-base bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm">
                <div className="flex items-center w-full">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 mr-3 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                    <svg className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <SelectValue placeholder="Select insurance type" />
                  </div>
                </div>
              </SelectTrigger>
              <SelectContent className="z-50 max-h-96 overflow-y-auto bg-white/95 backdrop-blur-xl border-2 border-gray-200/50 rounded-2xl shadow-2xl ring-1 ring-black/5">
                <SelectItem value="medicaid" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Medicaid</SelectItem>
                <SelectItem value="medicare" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Medicare</SelectItem>
                <SelectItem value="private" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Private Insurance</SelectItem>
                <SelectItem value="none" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pmiNumber" className="text-base font-medium text-gray-900">
              PMI Number
            </Label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                  <svg className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <Input
                id="pmiNumber"
                value={formData.pmiNumber}
                onChange={(e) => onChange('pmiNumber', e.target.value)}
                placeholder="Enter PMI number"
                className="h-14 text-base pl-14 pr-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm"
              />
            </div>
          </div>
        </div>

        {/* Waiver Type */}
        <div className="space-y-2">
          <Label htmlFor="waiverType" className="text-base font-medium text-gray-900">
            Waiver Type
          </Label>
          <Select 
            value={formData.waiverType}
            onValueChange={(value) => onChange('waiverType', value)}
          >
            <SelectTrigger className="group h-14 text-base bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm">
              <div className="flex items-center w-full">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 mr-3 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                  <svg className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-base font-medium text-gray-900">
                    {formData.waiverType ? formatWaiverTypeShort(formData.waiverType) : "Select waiver type"}
                  </div>
                </div>
              </div>
            </SelectTrigger>
            <SelectContent className="z-50 max-h-96 overflow-y-auto bg-white/95 backdrop-blur-xl border-2 border-gray-200/50 rounded-2xl shadow-2xl ring-1 ring-black/5">
              {WAIVER_TYPE_OPTIONS.map(option => (
                <SelectItem 
                  key={option.value} 
                  value={option.value} 
                  className="h-12 text-base px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5 focus:bg-gradient-to-r focus:from-primary/10 focus:to-secondary/10 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">🏥 Medicaid waiver program information</p>
        </div>
      </div>
    </div>
  );
}

function Step2ServiceSelection({ formData, onChange, services, servicesLoading }: { 
  formData: FormData; 
  onChange: (field: keyof FormData, value: any) => void;
  services: { residential: string[]; nonResidential: string[] };
  servicesLoading: boolean;
}) {

  if (servicesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-gray-600">Loading services...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Non-Residential Services */}
      <div className="space-y-2">
        <Label className={`text-base font-medium ${
          formData.selectedServices.some(s => services?.residential?.includes(s)) 
            ? "text-gray-400" 
            : "text-gray-900"
        }`}>
          Non-Residential Services
        </Label>
        <Select
          value={formData.selectedServices.find(s => services?.nonResidential?.includes(s)) || ""}
          disabled={formData.selectedServices.some(s => services?.residential?.includes(s))}
          onValueChange={(value) => {
            if (value) {
              onChange('selectedServices', [value]);
              onChange('selectedService', value);
            } else {
              onChange('selectedServices', []);
              onChange('selectedService', '');
            }
          }}
        >
          <SelectTrigger className={`group h-14 text-base border-2 rounded-2xl transition-all duration-300 shadow-sm ${
            formData.selectedServices.some(s => services?.residential?.includes(s))
              ? "bg-gray-100 border-gray-200 cursor-not-allowed opacity-50"
              : "bg-gradient-to-r from-white to-gray-50 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 hover:shadow-lg focus:shadow-xl backdrop-blur-sm"
          }`}>
            <div className="flex items-center w-full">
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl mr-3 transition-all duration-300 ${
                formData.selectedServices.some(s => services?.residential?.includes(s))
                  ? "bg-gray-200"
                  : "bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20"
              }`}>
                <svg className={`w-4 h-4 transition-transform duration-300 ${
                  formData.selectedServices.some(s => services?.residential?.includes(s))
                    ? "text-gray-400"
                    : "text-primary group-hover:scale-110"
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <SelectValue placeholder="Select a non-residential service..." />
              </div>
            </div>
          </SelectTrigger>
          <SelectContent className="z-50 max-h-60 overflow-y-auto bg-white/95 backdrop-blur-xl border-2 border-gray-200/50 rounded-2xl shadow-2xl ring-1 ring-black/5">
            {services?.nonResidential?.map((service) => (
              <SelectItem key={service} value={service} className="text-base py-3 hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">
                {service}
              </SelectItem>
            )) || []}
          </SelectContent>
        </Select>
      </div>

      {/* Residential Services */}
      <div className="space-y-2">
        <Label className={`text-base font-medium ${
          formData.selectedServices.some(s => services?.nonResidential?.includes(s)) 
            ? "text-gray-400" 
            : "text-gray-900"
        }`}>
          Residential Services
        </Label>
        <Select
          value={formData.selectedServices.find(s => services?.residential?.includes(s)) || ""}
          disabled={formData.selectedServices.some(s => services?.nonResidential?.includes(s))}
          onValueChange={(value) => {
            if (value) {
              onChange('selectedServices', [value]);
              onChange('selectedService', value);
            } else {
              onChange('selectedServices', []);
              onChange('selectedService', '');
            }
          }}
        >
          <SelectTrigger className={`group h-14 text-base border-2 rounded-2xl transition-all duration-300 shadow-sm ${
            formData.selectedServices.some(s => services?.nonResidential?.includes(s))
              ? "bg-gray-100 border-gray-200 cursor-not-allowed opacity-50"
              : "bg-gradient-to-r from-white to-gray-50 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 hover:shadow-lg focus:shadow-xl backdrop-blur-sm"
          }`}>
            <div className="flex items-center w-full">
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl mr-3 transition-all duration-300 ${
                formData.selectedServices.some(s => services?.nonResidential?.includes(s))
                  ? "bg-gray-200"
                  : "bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20"
              }`}>
                <svg className={`w-4 h-4 transition-transform duration-300 ${
                  formData.selectedServices.some(s => services?.nonResidential?.includes(s))
                    ? "text-gray-400"
                    : "text-primary group-hover:scale-110"
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <SelectValue placeholder="Select a residential service..." />
              </div>
            </div>
          </SelectTrigger>
          <SelectContent className="z-50 max-h-60 overflow-y-auto bg-white/95 backdrop-blur-xl border-2 border-gray-200/50 rounded-2xl shadow-2xl ring-1 ring-black/5">
            {services?.residential?.map((service) => (
              <SelectItem key={service} value={service} className="text-base py-3 hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">
                {service}
              </SelectItem>
            )) || []}
          </SelectContent>
        </Select>
      </div>

      {/* Selected Services Display */}
      {formData.selectedServices.length > 0 && (
        <div className="space-y-2">
          <Label className="text-base font-medium text-gray-900">
            Selected Service
          </Label>
          <div className="flex flex-wrap gap-2">
            {formData.selectedServices.map((service) => (
              <div 
                key={service} 
                className="inline-flex items-center px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-full"
              >
                {service}
                <button
                  type="button"
                  onClick={() => {
                    onChange('selectedServices', formData.selectedServices.filter(s => s !== service));
                    onChange('selectedService', '');
                  }}
                  className="ml-2 text-primary-500 hover:text-primary-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Priority Level */}
      <div className="space-y-2">
        <Label htmlFor="urgency" className="text-base font-medium text-gray-900">
          Priority Level
        </Label>
        <Select value={formData.urgency} onValueChange={(value) => onChange('urgency', value)}>
          <SelectTrigger className="group h-14 text-base bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm">
            <div className="flex items-center w-full">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 mr-3 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                <svg className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <SelectValue placeholder="How urgent is this referral?" />
              </div>
            </div>
          </SelectTrigger>
          <SelectContent className="z-50 max-h-96 overflow-y-auto bg-white/95 backdrop-blur-xl border-2 border-gray-200/50 rounded-2xl shadow-2xl ring-1 ring-black/5">
            <SelectItem value="low" className="h-12 text-base px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-green/5 hover:to-green/5 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-green-400"></span>
                <span>Low Priority</span>
                <span className="text-xs text-gray-500">• Standard timeline</span>
              </div>
            </SelectItem>
            <SelectItem value="medium" className="h-12 text-base px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-yellow/5 hover:to-yellow/5 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                <span>Medium Priority</span>
                <span className="text-xs text-gray-500">• Within 1-2 weeks</span>
              </div>
            </SelectItem>
            <SelectItem value="high" className="h-12 text-base px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-red/5 hover:to-red/5 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-red-400"></span>
                <span>High Priority</span>
                <span className="text-xs text-gray-500">• Immediate attention</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">⏰ Helps providers prioritize response time</p>
      </div>

      {/* County */}
      <div className="space-y-2">
        <Label htmlFor="counties" className="text-base font-medium text-gray-900">
          Service County
        </Label>
        <Select value={formData.counties[0] || ''} onValueChange={(value) => onChange('counties', [value])}>
          <SelectTrigger className="group h-14 text-base bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm">
            <div className="flex items-center w-full">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 mr-3 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                <svg className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <SelectValue placeholder="Select service county" />
              </div>
            </div>
          </SelectTrigger>
          <SelectContent className="z-50 max-h-60 overflow-y-auto bg-white/95 backdrop-blur-xl border-2 border-gray-200/50 rounded-2xl shadow-2xl ring-1 ring-black/5">
            <SelectItem value="aitkin" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Aitkin County</SelectItem>
            <SelectItem value="anoka" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Anoka County</SelectItem>
            <SelectItem value="becker" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Becker County</SelectItem>
            <SelectItem value="beltrami" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Beltrami County</SelectItem>
            <SelectItem value="benton" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Benton County</SelectItem>
            <SelectItem value="big-stone" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Big Stone County</SelectItem>
            <SelectItem value="blue-earth" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Blue Earth County</SelectItem>
            <SelectItem value="brown" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Brown County</SelectItem>
            <SelectItem value="carlton" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Carlton County</SelectItem>
            <SelectItem value="carver" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Carver County</SelectItem>
            <SelectItem value="cass" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Cass County</SelectItem>
            <SelectItem value="chippewa" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Chippewa County</SelectItem>
            <SelectItem value="chisago" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Chisago County</SelectItem>
            <SelectItem value="clay" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Clay County</SelectItem>
            <SelectItem value="clearwater" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Clearwater County</SelectItem>
            <SelectItem value="cook" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Cook County</SelectItem>
            <SelectItem value="cottonwood" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Cottonwood County</SelectItem>
            <SelectItem value="crow-wing" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Crow Wing County</SelectItem>
            <SelectItem value="dakota" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Dakota County</SelectItem>
            <SelectItem value="dodge" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Dodge County</SelectItem>
            <SelectItem value="douglas" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Douglas County</SelectItem>
            <SelectItem value="faribault" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Faribault County</SelectItem>
            <SelectItem value="fillmore" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Fillmore County</SelectItem>
            <SelectItem value="freeborn" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Freeborn County</SelectItem>
            <SelectItem value="goodhue" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Goodhue County</SelectItem>
            <SelectItem value="grant" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Grant County</SelectItem>
            <SelectItem value="hennepin" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Hennepin County</SelectItem>
            <SelectItem value="houston" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Houston County</SelectItem>
            <SelectItem value="hubbard" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Hubbard County</SelectItem>
            <SelectItem value="isanti" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Isanti County</SelectItem>
            <SelectItem value="itasca" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Itasca County</SelectItem>
            <SelectItem value="jackson" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Jackson County</SelectItem>
            <SelectItem value="kanabec" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Kanabec County</SelectItem>
            <SelectItem value="kandiyohi" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Kandiyohi County</SelectItem>
            <SelectItem value="kittson" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Kittson County</SelectItem>
            <SelectItem value="koochiching" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Koochiching County</SelectItem>
            <SelectItem value="lac-qui-parle" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Lac qui Parle County</SelectItem>
            <SelectItem value="lake" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Lake County</SelectItem>
            <SelectItem value="lake-of-the-woods" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Lake of the Woods County</SelectItem>
            <SelectItem value="le-sueur" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Le Sueur County</SelectItem>
            <SelectItem value="lincoln" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Lincoln County</SelectItem>
            <SelectItem value="lyon" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Lyon County</SelectItem>
            <SelectItem value="mahnomen" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Mahnomen County</SelectItem>
            <SelectItem value="marshall" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Marshall County</SelectItem>
            <SelectItem value="martin" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Martin County</SelectItem>
            <SelectItem value="mcleod" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">McLeod County</SelectItem>
            <SelectItem value="meeker" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Meeker County</SelectItem>
            <SelectItem value="mille-lacs" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Mille Lacs County</SelectItem>
            <SelectItem value="morrison" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Morrison County</SelectItem>
            <SelectItem value="mower" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Mower County</SelectItem>
            <SelectItem value="murray" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Murray County</SelectItem>
            <SelectItem value="nicollet" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Nicollet County</SelectItem>
            <SelectItem value="nobles" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Nobles County</SelectItem>
            <SelectItem value="norman" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Norman County</SelectItem>
            <SelectItem value="olmsted" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Olmsted County</SelectItem>
            <SelectItem value="otter-tail" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Otter Tail County</SelectItem>
            <SelectItem value="pennington" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Pennington County</SelectItem>
            <SelectItem value="pine" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Pine County</SelectItem>
            <SelectItem value="pipestone" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Pipestone County</SelectItem>
            <SelectItem value="polk" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Polk County</SelectItem>
            <SelectItem value="pope" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Pope County</SelectItem>
            <SelectItem value="ramsey" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Ramsey County</SelectItem>
            <SelectItem value="red-lake" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Red Lake County</SelectItem>
            <SelectItem value="redwood" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Redwood County</SelectItem>
            <SelectItem value="renville" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Renville County</SelectItem>
            <SelectItem value="rice" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Rice County</SelectItem>
            <SelectItem value="rock" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Rock County</SelectItem>
            <SelectItem value="roseau" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Roseau County</SelectItem>
            <SelectItem value="scott" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Scott County</SelectItem>
            <SelectItem value="sherburne" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Sherburne County</SelectItem>
            <SelectItem value="sibley" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Sibley County</SelectItem>
            <SelectItem value="st-louis" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">St. Louis County</SelectItem>
            <SelectItem value="stearns" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Stearns County</SelectItem>
            <SelectItem value="steele" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Steele County</SelectItem>
            <SelectItem value="stevens" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Stevens County</SelectItem>
            <SelectItem value="swift" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Swift County</SelectItem>
            <SelectItem value="todd" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Todd County</SelectItem>
            <SelectItem value="traverse" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Traverse County</SelectItem>
            <SelectItem value="wabasha" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Wabasha County</SelectItem>
            <SelectItem value="wadena" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Wadena County</SelectItem>
            <SelectItem value="waseca" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Waseca County</SelectItem>
            <SelectItem value="washington" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Washington County</SelectItem>
            <SelectItem value="watonwan" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Watonwan County</SelectItem>
            <SelectItem value="wilkin" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Wilkin County</SelectItem>
            <SelectItem value="winona" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Winona County</SelectItem>
            <SelectItem value="wright" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Wright County</SelectItem>
            <SelectItem value="yellow-medicine" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Yellow Medicine County</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">📍 Where services will be provided</p>
      </div>
    </div>
  );
}

function Step3AdditionalDetails({ formData, onChange }: { formData: FormData; onChange: (field: keyof FormData, value: any) => void }) {
  return (
    <div className="space-y-6">
      {/* Referral Reason */}
      <div className="space-y-2">
        <Label htmlFor="referralReason" className="text-base font-medium text-gray-900">
          Referral Reason
        </Label>
        <div className="relative group">
          <Textarea
            id="referralReason"
            value={formData.referralReason}
            onChange={(e) => onChange('referralReason', e.target.value)}
            placeholder="Describe the reason for this referral and any specific needs..."
            className="min-h-[120px] text-base p-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm resize-none"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">📝 Help providers understand the client's situation</p>
      </div>

      {/* Preferences Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="genderPreference" className="text-base font-medium text-gray-900">
            Staff Gender Preference
          </Label>
          <Select value={formData.genderPreference} onValueChange={(value) => onChange('genderPreference', value)}>
            <SelectTrigger className="group h-14 text-base bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm">
              <div className="flex items-center w-full">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 mr-3 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                  <svg className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <SelectValue placeholder="Select preference" />
                </div>
              </div>
            </SelectTrigger>
            <SelectContent className="z-50 max-h-96 overflow-y-auto bg-white/95 backdrop-blur-xl border-2 border-gray-200/50 rounded-2xl shadow-2xl ring-1 ring-black/5">
              <SelectItem value="male" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Male Staff</SelectItem>
              <SelectItem value="female" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Female Staff</SelectItem>
              <SelectItem value="no-preference" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">No Preference</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="mobilityStatus" className="text-base font-medium text-gray-900">
            Mobility Status
          </Label>
          <Select value={formData.mobilityStatus} onValueChange={(value) => onChange('mobilityStatus', value)}>
            <SelectTrigger className="group h-14 text-base bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm">
              <div className="flex items-center w-full">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 mr-3 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                  <svg className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <SelectValue placeholder="Select mobility status" />
                </div>
              </div>
            </SelectTrigger>
            <SelectContent className="z-50 max-h-96 overflow-y-auto bg-white/95 backdrop-blur-xl border-2 border-gray-200/50 rounded-2xl shadow-2xl ring-1 ring-black/5">
              <SelectItem value="ambulatory" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Ambulatory</SelectItem>
              <SelectItem value="wheelchair-bound" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Wheelchair-bound</SelectItem>
              <SelectItem value="bed-bound" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Bed-bound</SelectItem>
              <SelectItem value="other" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Primary Diagnosis */}
      <div className="space-y-2">
        <Label htmlFor="primaryDiagnosis" className="text-base font-medium text-gray-900">
          Primary Diagnosis
        </Label>
        <div className="relative group">
          <Textarea
            id="primaryDiagnosis"
            value={formData.primaryDiagnosis}
            onChange={(e) => onChange('primaryDiagnosis', e.target.value)}
            placeholder="Primary diagnosis or condition requiring services..."
            className="min-h-[80px] text-base p-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm resize-none"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">🏥 Medical condition or diagnosis</p>
      </div>

      {/* Living Situation */}
      <div className="space-y-2">
        <Label htmlFor="livingSituation" className="text-base font-medium text-gray-900">
          Living Situation
        </Label>
        <Select value={formData.livingSituation} onValueChange={(value) => onChange('livingSituation', value)}>
          <SelectTrigger className="group h-14 text-base bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm">
            <div className="flex items-center w-full">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 mr-3 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                <svg className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <SelectValue placeholder="Select living situation" />
              </div>
            </div>
          </SelectTrigger>
          <SelectContent className="z-50 max-h-96 overflow-y-auto bg-white/95 backdrop-blur-xl border-2 border-gray-200/50 rounded-2xl shadow-2xl ring-1 ring-black/5">
            <SelectItem value="alone" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Lives Alone</SelectItem>
            <SelectItem value="with-family" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Lives with Family</SelectItem>
            <SelectItem value="group-setting" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Group Setting</SelectItem>
            <SelectItem value="other" className="h-12 text-base hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Language and Translation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="primaryLanguage" className="text-base font-medium text-gray-900">
            Primary Language
          </Label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                <svg className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
            </div>
            <Input
              id="primaryLanguage"
              value={formData.primaryLanguage}
              onChange={(e) => onChange('primaryLanguage', e.target.value)}
              placeholder="English"
              className="h-14 text-base pl-14 pr-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-base font-medium text-gray-900">
            Needs Translator
          </Label>
          <div className="flex items-center space-x-4 pt-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="needsTranslator"
                checked={formData.needsTranslator === true}
                onChange={() => onChange('needsTranslator', true)}
                className="w-4 h-4 text-primary border-gray-300 focus:ring-primary focus:ring-2"
              />
              <span className="text-sm font-medium text-gray-900">Yes</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="needsTranslator"
                checked={formData.needsTranslator === false}
                onChange={() => onChange('needsTranslator', false)}
                className="w-4 h-4 text-primary border-gray-300 focus:ring-primary focus:ring-2"
              />
              <span className="text-sm font-medium text-gray-900">No</span>
            </label>
          </div>
        </div>
      </div>

      {/* Cultural Considerations */}
      <div className="space-y-2">
        <Label htmlFor="culturalConsiderations" className="text-base font-medium text-gray-900">
          Cultural Considerations
        </Label>
        <div className="relative group">
          <Textarea
            id="culturalConsiderations"
            value={formData.culturalConsiderations}
            onChange={(e) => onChange('culturalConsiderations', e.target.value)}
            placeholder="Any cultural considerations, language preferences, or special requirements..."
            className="min-h-[100px] text-base p-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm resize-none"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">🌍 Help ensure culturally appropriate care</p>
      </div>
    </div>
  );
}

function Step4StartDate({ formData, onChange }: { formData: FormData; onChange: (field: keyof FormData, value: any) => void }) {
  const today = new Date().toISOString().split('T')[0];
  
  return (
    <div className="space-y-6">
      {/* Start Date */}
      <div className="space-y-2">
        <Label htmlFor="requestedStartDate" className="text-base font-medium text-gray-900">
          Requested Start Date
        </Label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
              <svg className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <Input
            id="requestedStartDate"
            type="date"
            min={today}
            value={formData.requestedStartDate ? formData.requestedStartDate.toISOString().split('T')[0] : ''}
            onChange={(e) => onChange('requestedStartDate', e.target.value ? new Date(e.target.value) : undefined)}
            className="h-14 text-base pl-14 pr-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">📅 When would you like services to begin?</p>
      </div>

      {/* Additional Notes */}
      <div className="space-y-2">
        <Label htmlFor="additionalNotes" className="text-base font-medium text-gray-900">
          Additional Notes
        </Label>
        <div className="relative group">
          <Textarea
            id="additionalNotes"
            value={formData.additionalNotes}
            onChange={(e) => onChange('additionalNotes', e.target.value)}
            placeholder="Any additional notes, special instructions, or important details for providers..."
            className="min-h-[120px] text-base p-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm resize-none"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">📋 Optional but helpful for provider matching</p>
      </div>

      {/* Review Summary - Enhanced with your design language */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-2 border-blue-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue/20 to-blue/30">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-blue-900">Review Before Submitting</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-blue-200/40">
              <span className="text-blue-700 font-medium">Client:</span>
              <span className="text-blue-900 font-semibold">{formData.firstName} {formData.lastName}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-blue-200/40">
              <span className="text-blue-700 font-medium">Service:</span>
              <span className="text-blue-900 font-semibold">{formData.selectedService || 'Not selected'}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-blue-200/40">
              <span className="text-blue-700 font-medium">Priority:</span>
              <span className={`font-semibold capitalize ${
                formData.urgency === 'high' ? 'text-red-600' :
                formData.urgency === 'medium' ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {formData.urgency || 'Not selected'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-blue-200/40">
              <span className="text-blue-700 font-medium">Start Date:</span>
              <span className="text-blue-900 font-semibold">
                {formData.requestedStartDate ? formData.requestedStartDate.toLocaleDateString() : 'Not set'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
