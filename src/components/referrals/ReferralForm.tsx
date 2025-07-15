'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { ArrowRight, ArrowLeft, CalendarIcon, Loader2, Sparkles, CheckCircle2, AlertCircle, Bot, ChevronRight, MessageSquare, Clock, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import confetti from 'canvas-confetti';
import { useRouter } from 'next/navigation';

type ServiceType = 'medical' | 'dental' | 'mental_health';
type UrgencyLevel = 'low' | 'medium' | 'high';
type InsuranceType = 'medicaid' | 'medicare' | 'private' | 'none';

interface ReferralFormData {
  clientInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    preferredContactMethod: 'email' | 'phone' | 'both';
    insurance: {
      type: 'medicaid' | 'medicare' | 'private' | 'none';
      provider?: string;
      number?: string;
    };
  };
  serviceDetails: {
    type: string;
    urgency: 'low' | 'medium' | 'high';
    counties: string[];
    additionalNotes: string;
  };
  providerPreferences: {
    providerType: 'no-preference' | 'small' | 'large' | 'nonprofit' | 'faith-based';
    insuranceAccepted: string[];
    languages: string[];
    availableTimes: string[];
    emergencyServices: boolean;
    showAvailableOnly: boolean;
  };
}

interface AISuggestion {
  type: 'service' | 'provider' | 'timing';
  suggestion: string;
  confidence: number;
}

interface FormState {
  isAnalyzing: boolean;
  suggestions: AISuggestion[];
  lastUpdated: Date;
}

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
  
  // Legacy fields for compatibility
  email: string;
  preferredContactMethod: 'email' | 'phone' | 'both';
  service_type: ServiceType | '';
  selectedService: string;
  urgency: UrgencyLevel | '';
  preferredStartDate: Date | undefined;
  counties: string[];
  insuranceProvider?: string;
  insuranceNumber?: string;
  primaryLanguage: string;
  needsTranslator: boolean;
  preferredGender: string;
  providerType: 'no-preference' | 'small' | 'large' | 'nonprofit' | 'faith-based';
  insuranceAccepted: string[];
  languages: string[];
  availableTimes: string[];
  emergencyServices: 'yes' | 'no';
  showAvailableOnly: boolean;
  specialRequirements: string;
  additionalNotes: string;
  managerName: string;
  organization: string;
  notifyEmail: boolean;
  notifySMS: boolean;
  providerNotes: string;
}

interface ReferralFormProps {
  onComplete?: () => void;
}

interface SubmissionState {
  isSubmitting: boolean;
  isSuccess: boolean;
  message: string;
}

export function ReferralForm({ onComplete }: ReferralFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    // Step 1: Client Details
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    sex: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    insurance: '',
    pmiNumber: '',
    waiverType: '',
    historyOfViolence: false,
    
    // Step 2: Service Selection
    selectedServices: [],
    
    // Step 3: Additional Considerations
    referralReason: '',
    genderPreference: '',
    culturalConsiderations: '',
    mobilityStatus: '',
    primaryDiagnosis: '',
    livingSituation: '',
    
    // Step 4: Service Start Date
    requestedStartDate: undefined,
    
    // Legacy fields for compatibility
    email: '',
    preferredContactMethod: 'email',
    service_type: '',
    selectedService: '',
    urgency: 'medium',
    preferredStartDate: undefined,
    counties: [],
    insuranceProvider: '',
    insuranceNumber: '',
    primaryLanguage: '',
    needsTranslator: false,
    preferredGender: 'any',
    providerType: 'no-preference',
    insuranceAccepted: [],
    languages: ['English'],
    availableTimes: ['Flexible'],
    emergencyServices: 'no',
    showAvailableOnly: false,
    specialRequirements: '',
    additionalNotes: '',
    managerName: '',
    organization: '',
    notifyEmail: true,
    notifySMS: false,
    providerNotes: ''
  });
  
  const { toast } = useToast();
  const totalSteps = 4;
  const [services, setServices] = useState<{
    residential: string[];
    nonResidential: string[];
  }>({
    residential: [],
    nonResidential: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>({
    isAnalyzing: false,
    suggestions: [],
    lastUpdated: new Date()
  });
  const [isTyping, setIsTyping] = useState(false);
  const [showAIResponse, setShowAIResponse] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const { ref: formRef, inView } = useInView({ threshold: 0.1 });
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    isSubmitting: false,
    isSuccess: false,
    message: ''
  });
  const [clientPrefillLoading, setClientPrefillLoading] = useState(false);
  const [clientPrefillError, setClientPrefillError] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchServices() {
      try {
        const response = await fetch('/api/services');
        if (!response.ok) throw new Error('Failed to fetch services');
        const data = await response.json();
        setServices(data.services);
        setError(null);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Failed to load services. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, []);

  // Pre-fill form if clientId is present in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const clientIdFromUrl = urlParams.get('clientId');
    if (clientIdFromUrl && !formData.firstName && !formData.lastName && !formData.dateOfBirth) {
      setClientPrefillLoading(true);
      setClientPrefillError(null);
      fetch(`/api/clients/${clientIdFromUrl}`)
        .then(async (res) => {
          if (!res.ok) throw new Error('Failed to fetch client info');
          const data = await res.json();
          if (!data.client) throw new Error('Client not found');
          const c = data.client;
          setFormData((prev) => ({
            ...prev,
            firstName: c.firstName || '',
            lastName: c.lastName || '',
            dateOfBirth: c.dateOfBirth || '',
            email: c.email || '',
            phone: c.phone || '',
            address: c.address?.street || c.address || '',
            city: c.address?.city || c.city || '',
            state: c.address?.state || c.state || '',
            zipCode: c.address?.zipCode || c.zipCode || '',
            preferredContactMethod: c.preferredContactMethod || 'email',
            insurance: c.insurance?.type || '',
            insuranceProvider: c.insurance?.provider || '',
            insuranceNumber: c.insurance?.number || '',
          }));
        })
        .catch((err) => {
          setClientPrefillError(err.message || 'Failed to fetch client info');
        })
        .finally(() => setClientPrefillLoading(false));
    }
  }, []);

  // Simulate confetti effect
  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step < totalSteps) {
      setStep(step + 1);
      window.scrollTo(0, 0);
      return;
    }
    
    // Start submission animation
    setSubmissionState({
      isSubmitting: true,
      isSuccess: false,
      message: ''
    });

    try {
      // Check for client ID in URL query params
      const urlParams = new URLSearchParams(window.location.search);
      const clientIdFromUrl = urlParams.get('clientId');
      
      // Format data for API
      const referralData: ReferralFormData = {
        clientInfo: {
          ...(clientIdFromUrl ? { _id: clientIdFromUrl } : {}), // Include the client ID if available
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth,
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
            type: formData.insurance as 'medicaid' | 'medicare' | 'private' | 'none',
            provider: formData.insuranceProvider,
            number: formData.insuranceNumber
          }
        },
        serviceDetails: {
          type: formData.selectedService,
          urgency: formData.urgency as 'low' | 'medium' | 'high',
          counties: formData.counties,
          additionalNotes: formData.additionalNotes
        },
        providerPreferences: {
          providerType: formData.providerType,
          insuranceAccepted: formData.insuranceAccepted,
          languages: formData.languages,
          availableTimes: formData.availableTimes,
          emergencyServices: formData.emergencyServices === 'yes',
          showAvailableOnly: formData.showAvailableOnly
        }
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Submit to API
      const response = await fetch('/api/referrals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(referralData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit referral');
      }
      
      // Show success state
      setSubmissionState({
        isSubmitting: false,
        isSuccess: true,
        message: 'Your referral has been submitted successfully!'
      });
      
      // Trigger confetti
      triggerConfetti();
      
      // Call onComplete after a delay
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting referral:', error);
      setSubmissionState({
        isSubmitting: false,
        isSuccess: false,
        message: 'There was an error submitting your referral. Please try again.'
      });
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo(0, 0);
    }
  };

  // Simulate AI typing effect
  const simulateAITyping = async (message: string) => {
    setShowAIResponse(true);
    setAiMessage('');
    const words = message.split(' ');
    
    for (const word of words) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setAiMessage(prev => prev + ' ' + word);
    }
  };

  // Enhanced input handler with AI simulation
  const handleInputChange = async (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsTyping(true);
    
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    const timeout = setTimeout(async () => {
      setIsTyping(false);
      
      // Simulate AI response based on the field
      if (field === 'selectedService') {
        await simulateAITyping(`I see you're interested in ${value}. Based on our data, this service typically requires a medium to high urgency level. Would you like me to suggest some related services that might be helpful?`);
      } else if (field === 'urgency') {
        await simulateAITyping(`I understand this is a ${value} urgency request. I'll prioritize finding providers who can accommodate this timeline.`);
      }
    }, 1000);
    
    setTypingTimeout(timeout);
  };

  return (
    <motion.div 
      ref={formRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center"
    >
      {/* Abstract Background Shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-500/5 rounded-full"></div>
        <div className="absolute top-40 right-16 w-24 h-24 bg-secondary-500/5 rounded-full"></div>
        <div className="absolute bottom-32 left-20 w-40 h-40 bg-primary-500/3 rounded-full"></div>
        <div className="absolute bottom-20 right-32 w-16 h-16 bg-secondary-500/8 rounded-full"></div>
      </div>
      
      <div className="w-full max-w-5xl mx-auto px-6 py-8 relative z-10">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-100 p-8 md:p-12">
        {clientPrefillLoading && (
          <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center gap-2">
            <Loader2 className="animate-spin h-5 w-5" />
            Loading client info...
          </div>
        )}
        {clientPrefillError && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
            {clientPrefillError}
          </div>
        )}
        <AnimatePresence mode="wait">
          {!submissionState.isSubmitting && !submissionState.isSuccess ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex gap-8"
            >
              {/* Sidebar Step Indicators */}
              <motion.div 
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-80 flex-shrink-0"
              >
                <div className="sticky top-8">
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg border border-gray-100"
                  >
                    {/* Content */}
                    <div className="relative z-10">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mb-8"
                      >
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Create Referral</h3>
                        <p className="text-gray-500 text-sm font-normal">Complete all steps to submit your referral</p>
                      </motion.div>

                      <div className="space-y-6">
                        {/* Step 1 */}
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 }}
                          className="flex items-center gap-4 group"
                        >
                          <div className="relative">
                            <motion.div
                              animate={{ 
                                scale: step >= 1 ? 1.05 : 1,
                                backgroundColor: step >= 1 ? "#3b82f6" : "#f3f4f6"
                              }}
                              transition={{ duration: 0.3 }}
                              className={`w-16 h-16 rounded-full flex items-center justify-start pl-6 font-bold text-2xl shadow-sm ${
                                step >= 1 ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              {step > 1 ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                "1"
                              )}
                            </motion.div>
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-medium transition-colors ${
                              step >= 1 ? "text-gray-900" : "text-gray-400"
                            }`}>
                              Client Info
                            </h4>
                            <p className="text-xs text-gray-500 mt-1 font-normal">
                              Basic client information
                            </p>
                          </div>
                          {step === 1 && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="w-2 h-2 bg-blue-500 rounded-full"
                            />
                          )}
                        </motion.div>

                        {/* Connector */}
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: step >= 2 ? 1 : 0.3 }}
                          transition={{ duration: 0.3 }}
                          className={`w-0.5 h-6 ml-6 rounded-full ${
                            step >= 2 ? "bg-blue-500" : "bg-gray-200"
                          }`}
                        />

                        {/* Step 2 */}
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 }}
                          className="flex items-center gap-4 group"
                        >
                          <div className="relative">
                            <motion.div
                              animate={{ 
                                scale: step >= 2 ? 1.05 : 1,
                                backgroundColor: step >= 2 ? "#3b82f6" : "#f3f4f6"
                              }}
                              transition={{ duration: 0.3 }}
                              className={`w-16 h-16 rounded-full flex items-center justify-start pl-6 font-bold text-2xl shadow-sm ${
                                step >= 2 ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              {step > 2 ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                "2"
                              )}
                            </motion.div>
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-medium transition-colors ${
                              step >= 2 ? "text-gray-900" : "text-gray-400"
                            }`}>
                              Service Details
                            </h4>
                            <p className="text-xs text-gray-500 mt-1 font-normal">
                              Select required services
                            </p>
                          </div>
                          {step === 2 && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="w-2 h-2 bg-blue-500 rounded-full"
                            />
                          )}
                        </motion.div>

                        {/* Connector */}
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: step >= 3 ? 1 : 0.3 }}
                          transition={{ duration: 0.3 }}
                          className={`w-0.5 h-6 ml-6 rounded-full ${
                            step >= 3 ? "bg-blue-500" : "bg-gray-200"
                          }`}
                        />

                        {/* Step 3 */}
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 }}
                          className="flex items-center gap-4 group"
                        >
                          <div className="relative">
                            <motion.div
                              animate={{ 
                                scale: step >= 3 ? 1.05 : 1,
                                backgroundColor: step >= 3 ? "#3b82f6" : "#f3f4f6"
                              }}
                              transition={{ duration: 0.3 }}
                              className={`w-16 h-16 rounded-full flex items-center justify-start pl-6 font-bold text-2xl shadow-sm ${
                                step >= 3 ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              {step > 3 ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                "3"
                              )}
                            </motion.div>
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-medium transition-colors ${
                              step >= 3 ? "text-gray-900" : "text-gray-400"
                            }`}>
                              Considerations
                            </h4>
                            <p className="text-xs text-gray-500 mt-1 font-normal">
                              Additional requirements
                            </p>
                          </div>
                          {step === 3 && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="w-2 h-2 bg-blue-500 rounded-full"
                            />
                          )}
                        </motion.div>

                        {/* Connector */}
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: step >= 4 ? 1 : 0.3 }}
                          transition={{ duration: 0.3 }}
                          className={`w-0.5 h-6 ml-6 rounded-full ${
                            step >= 4 ? "bg-blue-500" : "bg-gray-200"
                          }`}
                        />

                        {/* Step 4 */}
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 }}
                          className="flex items-center gap-4 group"
                        >
                          <div className="relative">
                            <motion.div
                              animate={{ 
                                scale: step >= 4 ? 1.05 : 1,
                                backgroundColor: step >= 4 ? "#3b82f6" : "#f3f4f6"
                              }}
                              transition={{ duration: 0.3 }}
                              className={`w-16 h-16 rounded-full flex items-center justify-start pl-6 font-bold text-2xl shadow-sm ${
                                step >= 4 ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              {step > 4 ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                "4"
                              )}
                            </motion.div>
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-medium transition-colors ${
                              step >= 4 ? "text-gray-900" : "text-gray-400"
                            }`}>
                              Start Date
                            </h4>
                            <p className="text-xs text-gray-500 mt-1 font-normal">
                              When to begin services
                            </p>
                          </div>
                          {step === 4 && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="w-2 h-2 bg-blue-500 rounded-full"
                            />
                          )}
                        </motion.div>
                      </div>

                      {/* Progress Bar */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        className="mt-8 pt-6 border-t border-gray-200"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-medium text-gray-600">Progress</span>
                          <span className="text-sm font-semibold text-gray-900">{Math.round((step / 4) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(step / 4) * 100}%` }}
                            transition={{ duration: 0.5 }}
                            className="bg-blue-500 h-2 rounded-full"
                          />
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Form Content */}
              <div className="flex-1 min-w-0">
                <form onSubmit={handleSubmit} className="space-y-8">

                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-8"
                    >
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-center mb-8"
                      >
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Let's start with your client's information</h2>
                        <p className="text-lg text-gray-600">This helps us understand their basic details before matching them with a provider.</p>
                      </motion.div>
                        
                      <div className="max-w-2xl mx-auto space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName" className="text-base font-medium text-gray-900">
                              First Name
                            </Label>
                            <div className="relative group">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                                  <svg className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                              </div>
                              <Input
                                id="firstName"
                                value={formData.firstName}
                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                                placeholder="First name"
                                className="h-16 text-lg pl-6 pr-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="lastName" className="text-base font-medium text-gray-900">
                              Last Name
                            </Label>
                            <div className="relative group">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                                  <svg className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                              </div>
                              <Input
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                                placeholder="Last name"
                                className="h-16 text-lg pl-6 pr-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm"
                                required
                              />
                            </div>
                          </div>
                          </div>

                          <div className="space-y-2">
                          <Label htmlFor="dateOfBirth" className="text-base font-medium text-gray-900">
                            Date of Birth
                            </Label>
                            <div className="relative group">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                                  <svg className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              </div>
                              <Input
                                id="dateOfBirth"
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                className="h-16 text-lg pl-6 pr-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm"
                                max={new Date().toISOString().split('T')[0]}
                                min="1900-01-01"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                          <Label htmlFor="sex" className="text-base font-medium text-gray-900">
                            Gender Identity
                            </Label>
                          <Select 
                            value={formData.sex}
                            onValueChange={(value) => handleInputChange('sex', value)}
                          >
                            <SelectTrigger className="group h-16 text-lg bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm">
                              <div className="flex items-center w-full">
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 mr-0 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                                  <svg className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                                <div className="flex-1 text-left">
                                  <SelectValue placeholder="Select gender identity" />
                                </div>
                              </div>
                            </SelectTrigger>
                            <SelectContent className="z-50 max-h-96 overflow-y-auto bg-white/95 backdrop-blur-xl border-2 border-gray-200/50 rounded-2xl shadow-2xl ring-1 ring-black/5">
                              <SelectItem value="male" className="h-14 text-lg px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5 focus:bg-gradient-to-r focus:from-primary/10 focus:to-secondary/10 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Male</SelectItem>
                              <SelectItem value="female" className="h-14 text-lg px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5 focus:bg-gradient-to-r focus:from-primary/10 focus:to-secondary/10 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Female</SelectItem>
                              <SelectItem value="non-binary" className="h-14 text-lg px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5 focus:bg-gradient-to-r focus:from-primary/10 focus:to-secondary/10 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Non-binary</SelectItem>
                              <SelectItem value="prefer-not-to-say" className="h-14 text-lg px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5 focus:bg-gradient-to-r focus:from-primary/10 focus:to-secondary/10 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Prefer not to say</SelectItem>
                              <SelectItem value="other" className="h-14 text-lg px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5 focus:bg-gradient-to-r focus:from-primary/10 focus:to-secondary/10 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          </div>

                          <div className="space-y-2">
                          <Label htmlFor="phone" className="text-base font-medium text-gray-900">
                            Phone Number
                            </Label>
                            <div className="relative group">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                                  <svg className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                </div>
                              </div>
                              <Input
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                placeholder="(XXX) XXX-XXXX"
                                className="h-16 text-lg pl-6 pr-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm"
                                required
                              />
                            </div>
                          </div>

                        <div className="space-y-4">
                          <Label className="text-base font-medium text-gray-900">
                            Mailing Address
                          </Label>
                          
                          <div className="space-y-3">
                            <div className="relative group">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                                  <svg className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                  </svg>
                                </div>
                              </div>
                              <Input
                                placeholder="Street Address"
                                value={formData.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                className="h-16 text-lg pl-6 pr-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm"
                                required
                              />
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3">
                              <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                                    <svg className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                  </div>
                                </div>
                                <Input
                                  placeholder="City"
                                  value={formData.city}
                                  onChange={(e) => handleInputChange('city', e.target.value)}
                                  className="h-16 text-lg pl-6 pr-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm"
                                  required
                                />
                              </div>
                              <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                                    <svg className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                  </div>
                                </div>
                                <Input
                                  placeholder="State"
                                  value={formData.state}
                                  onChange={(e) => handleInputChange('state', e.target.value)}
                                  className="h-16 text-lg pl-6 pr-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm"
                                  required
                                />
                              </div>
                              <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                                    <svg className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                    </svg>
                                  </div>
                                </div>
                                <Input
                                  placeholder="ZIP Code"
                                  value={formData.zipCode}
                                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                                  className="h-16 text-lg pl-6 pr-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm"
                                  required
                                />
                              </div>
                        </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="county" className="text-base font-medium text-gray-900">
                            County
                          </Label>
                          <Select 
                            value={formData.counties.length > 0 ? formData.counties[0] : ''}
                            onValueChange={(value) => handleInputChange('counties', value ? [value] : [])}
                          >
                            <SelectTrigger className="group h-16 text-lg bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm">
                              <div className="flex items-center w-full">
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 mr-0 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                                  <svg className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                </div>
                                <div className="flex-1 text-left">
                                  <SelectValue placeholder="Select county" />
                                </div>
                              </div>
                            </SelectTrigger>
                            <SelectContent className="z-50 max-h-60 overflow-y-auto bg-white/95 backdrop-blur-xl border-2 border-gray-200/50 rounded-2xl shadow-2xl ring-1 ring-black/5">
                              <SelectItem value="aitkin" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Aitkin County</SelectItem>
                              <SelectItem value="anoka" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Anoka County</SelectItem>
                              <SelectItem value="becker" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Becker County</SelectItem>
                              <SelectItem value="beltrami" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Beltrami County</SelectItem>
                              <SelectItem value="benton" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Benton County</SelectItem>
                              <SelectItem value="big-stone" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Big Stone County</SelectItem>
                              <SelectItem value="blue-earth" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Blue Earth County</SelectItem>
                              <SelectItem value="brown" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Brown County</SelectItem>
                              <SelectItem value="carlton" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Carlton County</SelectItem>
                              <SelectItem value="carver" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Carver County</SelectItem>
                              <SelectItem value="cass" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Cass County</SelectItem>
                              <SelectItem value="chippewa" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Chippewa County</SelectItem>
                              <SelectItem value="chisago" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Chisago County</SelectItem>
                              <SelectItem value="clay" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Clay County</SelectItem>
                              <SelectItem value="clearwater" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Clearwater County</SelectItem>
                              <SelectItem value="cook" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Cook County</SelectItem>
                              <SelectItem value="cottonwood" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Cottonwood County</SelectItem>
                              <SelectItem value="crow-wing" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Crow Wing County</SelectItem>
                              <SelectItem value="dakota" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Dakota County</SelectItem>
                              <SelectItem value="dodge" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Dodge County</SelectItem>
                              <SelectItem value="douglas" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Douglas County</SelectItem>
                              <SelectItem value="faribault" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Faribault County</SelectItem>
                              <SelectItem value="fillmore" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Fillmore County</SelectItem>
                              <SelectItem value="freeborn" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Freeborn County</SelectItem>
                              <SelectItem value="goodhue" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Goodhue County</SelectItem>
                              <SelectItem value="grant" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Grant County</SelectItem>
                              <SelectItem value="hennepin" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Hennepin County</SelectItem>
                              <SelectItem value="houston" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Houston County</SelectItem>
                              <SelectItem value="hubbard" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Hubbard County</SelectItem>
                              <SelectItem value="isanti" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Isanti County</SelectItem>
                              <SelectItem value="itasca" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Itasca County</SelectItem>
                              <SelectItem value="jackson" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Jackson County</SelectItem>
                              <SelectItem value="kanabec" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Kanabec County</SelectItem>
                              <SelectItem value="kandiyohi" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Kandiyohi County</SelectItem>
                              <SelectItem value="kittson" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Kittson County</SelectItem>
                              <SelectItem value="koochiching" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Koochiching County</SelectItem>
                              <SelectItem value="lac-qui-parle" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Lac qui Parle County</SelectItem>
                              <SelectItem value="lake" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Lake County</SelectItem>
                              <SelectItem value="lake-of-the-woods" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Lake of the Woods County</SelectItem>
                              <SelectItem value="le-sueur" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Le Sueur County</SelectItem>
                              <SelectItem value="lincoln" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Lincoln County</SelectItem>
                              <SelectItem value="lyon" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Lyon County</SelectItem>
                              <SelectItem value="mahnomen" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Mahnomen County</SelectItem>
                              <SelectItem value="marshall" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Marshall County</SelectItem>
                              <SelectItem value="martin" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Martin County</SelectItem>
                              <SelectItem value="mcleod" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">McLeod County</SelectItem>
                              <SelectItem value="meeker" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Meeker County</SelectItem>
                              <SelectItem value="mille-lacs" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Mille Lacs County</SelectItem>
                              <SelectItem value="morrison" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Morrison County</SelectItem>
                              <SelectItem value="mower" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Mower County</SelectItem>
                              <SelectItem value="murray" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Murray County</SelectItem>
                              <SelectItem value="nicollet" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Nicollet County</SelectItem>
                              <SelectItem value="nobles" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Nobles County</SelectItem>
                              <SelectItem value="norman" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Norman County</SelectItem>
                              <SelectItem value="olmsted" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Olmsted County</SelectItem>
                              <SelectItem value="otter-tail" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Otter Tail County</SelectItem>
                              <SelectItem value="pennington" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Pennington County</SelectItem>
                              <SelectItem value="pine" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Pine County</SelectItem>
                              <SelectItem value="pipestone" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Pipestone County</SelectItem>
                              <SelectItem value="polk" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Polk County</SelectItem>
                              <SelectItem value="pope" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Pope County</SelectItem>
                              <SelectItem value="ramsey" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Ramsey County</SelectItem>
                              <SelectItem value="red-lake" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Red Lake County</SelectItem>
                              <SelectItem value="redwood" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Redwood County</SelectItem>
                              <SelectItem value="renville" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Renville County</SelectItem>
                              <SelectItem value="rice" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Rice County</SelectItem>
                              <SelectItem value="rock" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Rock County</SelectItem>
                              <SelectItem value="roseau" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Roseau County</SelectItem>
                              <SelectItem value="scott" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Scott County</SelectItem>
                              <SelectItem value="sherburne" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Sherburne County</SelectItem>
                              <SelectItem value="sibley" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Sibley County</SelectItem>
                              <SelectItem value="st-louis" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">St. Louis County</SelectItem>
                              <SelectItem value="stearns" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Stearns County</SelectItem>
                              <SelectItem value="steele" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Steele County</SelectItem>
                              <SelectItem value="stevens" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Stevens County</SelectItem>
                              <SelectItem value="swift" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Swift County</SelectItem>
                              <SelectItem value="todd" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Todd County</SelectItem>
                              <SelectItem value="traverse" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Traverse County</SelectItem>
                              <SelectItem value="wabasha" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Wabasha County</SelectItem>
                              <SelectItem value="wadena" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Wadena County</SelectItem>
                              <SelectItem value="waseca" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Waseca County</SelectItem>
                              <SelectItem value="washington" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Washington County</SelectItem>
                              <SelectItem value="watonwan" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Watonwan County</SelectItem>
                              <SelectItem value="wilkin" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Wilkin County</SelectItem>
                              <SelectItem value="winona" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Winona County</SelectItem>
                              <SelectItem value="wright" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Wright County</SelectItem>
                              <SelectItem value="yellow-medicine" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Yellow Medicine County</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="insurance" className="text-base font-medium text-gray-900">
                            Primary Insurance
                          </Label>
                          <Select 
                            value={formData.insurance}
                            onValueChange={(value) => handleInputChange('insurance', value)}
                          >
                            <SelectTrigger className="group h-16 text-lg bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm">
                              <div className="flex items-center w-full">
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 mr-0 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                                  <svg className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                  </svg>
                                </div>
                                <div className="flex-1 text-left">
                                  <SelectValue placeholder="Select insurance type" />
                                </div>
                              </div>
                            </SelectTrigger>
                            <SelectContent className="z-50 max-h-96 overflow-y-auto bg-white/95 backdrop-blur-xl border-2 border-gray-200/50 rounded-2xl shadow-2xl ring-1 ring-black/5">
                              <SelectItem value="medicaid" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Medicaid</SelectItem>
                              <SelectItem value="medicare" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Medicare</SelectItem>
                              <SelectItem value="private" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Private Insurance</SelectItem>
                              <SelectItem value="none" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">None</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="pmiNumber" className="text-base font-medium text-gray-900">
                            PMI Number
                          </Label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                                <svg className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                            </div>
                            <Input
                              id="pmiNumber"
                              value={formData.pmiNumber}
                              onChange={(e) => handleInputChange('pmiNumber', e.target.value)}
                              placeholder="Enter PMI number"
                              className="h-16 text-lg pl-6 pr-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="waiverType" className="text-base font-medium text-gray-900">
                            Waiver Type
                          </Label>
                          <Select 
                            value={formData.waiverType}
                            onValueChange={(value) => handleInputChange('waiverType', value)}
                          >
                            <SelectTrigger className="group h-16 text-lg bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm">
                              <div className="flex items-center w-full">
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 mr-0 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                                  <svg className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <div className="flex-1 text-left">
                                  <SelectValue placeholder="Select waiver type" />
                                </div>
                              </div>
                            </SelectTrigger>
                            <SelectContent className="z-50 max-h-96 overflow-y-auto bg-white/95 backdrop-blur-xl border-2 border-gray-200/50 rounded-2xl shadow-2xl ring-1 ring-black/5">
                              <SelectItem value="non-waiver" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Non Waiver</SelectItem>
                              <SelectItem value="pending-waiver" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Pending Waiver</SelectItem>
                              <SelectItem value="alternative-care" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Alternative Care</SelectItem>
                              <SelectItem value="bi" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Brain Injury (BI) Waiver</SelectItem>
                              <SelectItem value="cac" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Community Alternative Care (CAC) Waiver</SelectItem>
                              <SelectItem value="cadi" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Community Access for Disability Inclusion (CADI) Waiver</SelectItem>
                              <SelectItem value="dd" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Developmental Disabilities (DD) Waiver</SelectItem>
                              <SelectItem value="ew" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Elderly Waiver (EW)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="historyOfViolence" className="text-base font-medium text-gray-900">
                            History of Violence or Registered Sex Offender?
                          </Label>
                          <Select 
                            value={formData.historyOfViolence ? 'yes' : 'no'}
                            onValueChange={(value) => handleInputChange('historyOfViolence', value === 'yes')}
                          >
                            <SelectTrigger className="group h-16 text-lg bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl backdrop-blur-sm">
                              <div className="flex items-center w-full">
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 mr-0 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                                  <svg className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div className="flex-1 text-left">
                                  <SelectValue placeholder="Select answer" />
                                </div>
                              </div>
                            </SelectTrigger>
                            <SelectContent className="z-50 max-h-96 overflow-y-auto bg-white/95 backdrop-blur-xl border-2 border-gray-200/50 rounded-2xl shadow-2xl ring-1 ring-black/5">
                              <SelectItem value="no" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">No</SelectItem>
                              <SelectItem value="yes" className="h-12 text-lg hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">Yes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* AI Response */}
                      <AnimatePresence>
                        {showAIResponse && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-gray-50 rounded-2xl p-4 border border-gray-200"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1">
                                <p className="text-gray-700">{aiMessage}</p>
                                {isTyping && (
                                  <div className="flex gap-1 mt-2">
                                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100" />
                                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-8"
                    >
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-center mb-8"
                      >
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Which services are needed?</h2>
                        <p className="text-lg text-gray-600">Select all that apply for this client.</p>
                      </motion.div>
                        
                      <div className="max-w-2xl mx-auto space-y-6">
                        {loading ? (
                          <div className="space-y-6">
                          <div className="space-y-2">
                              <Skeleton className="h-5 w-40" />
                              <Skeleton className="h-14 w-full rounded-xl" />
                            </div>
                            <div className="space-y-2">
                              <Skeleton className="h-5 w-40" />
                              <Skeleton className="h-14 w-full rounded-xl" />
                            </div>
                          </div>
                        ) : error ? (
                          <div className="text-red-600 text-center py-4">
                            {error}
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {/* Non-Residential Services */}
                            <div className="space-y-2">
                              <Label className={`text-base font-medium ${
                                formData.selectedServices.some(s => services.residential.includes(s)) 
                                  ? "text-gray-400" 
                                  : "text-gray-900"
                              }`}>
                                Non-Residential Services
                            </Label>
                            <Select 
                                value={formData.selectedServices.find(s => services.nonResidential.includes(s)) || ""}
                                disabled={formData.selectedServices.some(s => services.residential.includes(s))}
                                onValueChange={(value) => {
                                  // Remove any existing services and add the new non-residential one
                                  if (value) {
                                    handleInputChange('selectedServices', [value]);
                                  } else {
                                    handleInputChange('selectedServices', []);
                                  }
                                }}
                              >
                                                                <SelectTrigger className={`group h-16 text-lg border-2 rounded-2xl transition-all duration-300 shadow-sm ${
                                  formData.selectedServices.some(s => services.residential.includes(s))
                                    ? "bg-gray-100 border-gray-200 cursor-not-allowed opacity-50"
                                    : "bg-gradient-to-r from-white to-gray-50 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 hover:shadow-lg focus:shadow-xl backdrop-blur-sm"
                                }`}>
                                                                      <div className="flex items-center w-full">
                                      <div className={`flex items-center justify-center w-12 h-12 rounded-xl mr-4 transition-all duration-300 ${
                                        formData.selectedServices.some(s => services.residential.includes(s))
                                          ? "bg-gray-200"
                                          : "bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20"
                                      }`}>
                                        <svg className={`w-5 h-5 transition-transform duration-300 ${
                                          formData.selectedServices.some(s => services.residential.includes(s))
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
                              {services.nonResidential.map((service) => (
                                <SelectItem key={service} value={service} className="text-base py-3 hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">
                                    {service}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                            {/* Residential Services */}
                          <div className="space-y-2">
                              <Label className={`text-base font-medium ${
                                formData.selectedServices.some(s => services.nonResidential.includes(s)) 
                                  ? "text-gray-400" 
                                  : "text-gray-900"
                              }`}>
                                Residential Services
                              </Label>
                            <Select
                                value={formData.selectedServices.find(s => services.residential.includes(s)) || ""}
                                disabled={formData.selectedServices.some(s => services.nonResidential.includes(s))}
                                onValueChange={(value) => {
                                  // Remove any existing services and add the new residential one
                                  if (value) {
                                    handleInputChange('selectedServices', [value]);
                                  } else {
                                    handleInputChange('selectedServices', []);
                                  }
                                }}
                              >
                                                                <SelectTrigger className={`group h-16 text-lg border-2 rounded-2xl transition-all duration-300 shadow-sm ${
                                  formData.selectedServices.some(s => services.nonResidential.includes(s))
                                    ? "bg-gray-100 border-gray-200 cursor-not-allowed opacity-50"
                                    : "bg-gradient-to-r from-white to-gray-50 border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 hover:shadow-lg focus:shadow-xl backdrop-blur-sm"
                                }`}>
                                                                      <div className="flex items-center w-full">
                                      <div className={`flex items-center justify-center w-12 h-12 rounded-xl mr-4 transition-all duration-300 ${
                                        formData.selectedServices.some(s => services.nonResidential.includes(s))
                                          ? "bg-gray-200"
                                          : "bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20"
                                      }`}>
                                        <svg className={`w-5 h-5 transition-transform duration-300 ${
                                          formData.selectedServices.some(s => services.nonResidential.includes(s))
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
                              {services.residential.map((service) => (
                                <SelectItem key={service} value={service} className="text-base py-3 hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">
                                  {service}
                                </SelectItem>
                              ))}
                              </SelectContent>
                            </Select>
                          </div>

                            {/* Selected Services Display */}
                            {formData.selectedServices.length > 0 && (
                          <div className="space-y-2">
                                <Label className="text-base font-medium text-gray-900">
                                  Selected Services
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                  {formData.selectedServices.map((service) => (
                                    <Badge 
                                      key={service} 
                                      variant="secondary" 
                                      className="px-3 py-1 text-sm bg-primary-100 text-primary-700 hover:bg-primary-200"
                                    >
                                      {service}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleInputChange('selectedServices', formData.selectedServices.filter(s => s !== service));
                                        }}
                                        className="ml-2 text-primary-500 hover:text-primary-700"
                                      >
                                        ×
                                      </button>
                                    </Badge>
                                  ))}
                          </div>
                        </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* AI Response */}
                      <AnimatePresence>
                        {showAIResponse && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-gray-50 rounded-2xl p-4 border border-gray-200"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1">
                                <p className="text-gray-700">{aiMessage}</p>
                                {isTyping && (
                                  <div className="flex gap-1 mt-2">
                                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100" />
                                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-8"
                    >
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-center mb-8"
                      >
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Provider Preferences</h2>
                        <p className="text-lg text-gray-600">Help us find the perfect provider match</p>
                      </motion.div>
                      
                      <div className="max-w-2xl mx-auto space-y-6">
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Preferred Provider Type</Label>
                            <RadioGroup 
                              value={formData.providerType}
                              onValueChange={(value: typeof formData.providerType) => 
                                setFormData({...formData, providerType: value})}
                              className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="no-preference" id="provider-no-preference" />
                                <Label htmlFor="provider-no-preference">No Preference</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="small" id="provider-small" />
                                <Label htmlFor="provider-small">Small Provider</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="large" id="provider-large" />
                                <Label htmlFor="provider-large">Large Provider</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="nonprofit" id="provider-nonprofit" />
                                <Label htmlFor="provider-nonprofit">Nonprofit</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="faith-based" id="provider-faith-based" />
                                <Label htmlFor="provider-faith-based">Faith-based</Label>
                              </div>
                            </RadioGroup>
                          </div>

                          <div className="space-y-2">
                            <Label>Insurance Accepted</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                              {['Medicaid', 'Medicare', 'Private Insurance', 'Self-Pay', 'Sliding Scale'].map((insurance) => (
                                <div key={insurance} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`insurance-${insurance.toLowerCase().replace(' ', '-')}`}
                                    checked={formData.insuranceAccepted.includes(insurance)}
                                    onCheckedChange={(checked) => {
                                      const newInsurance = checked
                                        ? [...formData.insuranceAccepted, insurance]
                                        : formData.insuranceAccepted.filter(i => i !== insurance);
                                      setFormData({...formData, insuranceAccepted: newInsurance});
                                    }}
                                  />
                                  <label
                                    htmlFor={`insurance-${insurance.toLowerCase().replace(' ', '-')}`}
                                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {insurance}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Languages Available</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                              {['English', 'Spanish', 'Somali', 'Hmong', 'Arabic'].map((language) => (
                                <div key={language} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`language-${language.toLowerCase()}`}
                                    checked={formData.languages.includes(language)}
                                    onCheckedChange={(checked) => {
                                      const newLanguages = checked
                                        ? [...formData.languages, language]
                                        : formData.languages.filter(l => l !== language);
                                      setFormData({...formData, languages: newLanguages});
                                    }}
                                  />
                                  <label
                                    htmlFor={`language-${language.toLowerCase()}`}
                                    className="text-sm leading-none"
                                  >
                                    {language}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Best Days/Times for Service</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                              {['Weekdays', 'Evenings', 'Weekends', 'Flexible'].map((time) => (
                                <div key={time} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`time-${time.toLowerCase()}`}
                                    checked={formData.availableTimes.includes(time)}
                                    onCheckedChange={(checked) => {
                                      const newTimes = checked
                                        ? [...formData.availableTimes, time]
                                        : formData.availableTimes.filter(t => t !== time);
                                      setFormData({...formData, availableTimes: newTimes});
                                    }}
                                  />
                                  <label
                                    htmlFor={`time-${time.toLowerCase()}`}
                                    className="text-sm leading-none"
                                  >
                                    {time}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Emergency or After-Hours Services Needed?</Label>
                            <RadioGroup 
                              value={formData.emergencyServices}
                              onValueChange={(value: 'yes' | 'no') => 
                                setFormData({...formData, emergencyServices: value})}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="yes" id="emergency-yes" />
                                <Label htmlFor="emergency-yes">Yes</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="no" id="emergency-no" />
                                <Label htmlFor="emergency-no">No</Label>
                              </div>
                            </RadioGroup>
                          </div>

                          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                            <div className="flex items-center mb-2">
                              <Checkbox
                                id="availability"
                                checked={formData.showAvailableOnly}
                                onCheckedChange={(checked) => 
                                  setFormData({...formData, showAvailableOnly: checked as boolean})}
                              />
                              <label
                                htmlFor="availability"
                                className="text-sm font-medium ml-2 text-gray-900"
                              >
                                Show providers with available capacity
                              </label>
                            </div>
                            <p className="text-xs text-gray-600 ml-6">
                              Only show providers that have confirmed available capacity to accept new referrals
                            </p>
                          </div>

                          <div className="p-4 rounded-lg bg-gray-50 border">
                            <h4 className="font-medium mb-2">Provider Availability</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                                  High
                                </Badge>
                                <span className="text-sm">14 providers</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                                  Medium
                                </Badge>
                                <span className="text-sm">8 providers</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-100">
                                  Low
                                </Badge>
                                <span className="text-sm">5 providers</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                                  Unknown
                                </Badge>
                                <span className="text-sm">3 providers</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* AI Response */}
                      <AnimatePresence>
                        {showAIResponse && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-gray-50 rounded-2xl p-4 border border-gray-200"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1">
                                <p className="text-gray-700">{aiMessage}</p>
                                {isTyping && (
                                  <div className="flex gap-1 mt-2">
                                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100" />
                                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200" />
                                  </div>
                                )}
                          </div>
                        </div>
                      </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {step === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-8"
                    >
                      <div className="text-center mb-8">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200, damping: 10 }}
                          className="w-16 h-16 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 flex items-center justify-center mx-auto mb-4"
                        >
                          <CalendarIcon className="w-8 h-8 text-primary" />
                        </motion.div>
                        <h2 className="text-2xl font-semibold mb-2">Service Start Date</h2>
                        <p className="text-gray-600">When would you like services to begin?</p>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-4">
                          <Label className="text-lg font-medium text-gray-900">
                            Requested Start Date
                          </Label>
                          
                          <div className="relative">
                            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full h-16 justify-start text-left font-normal text-lg bg-white border-2 border-gray-200 rounded-2xl hover:border-primary-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 shadow-sm hover:shadow-md",
                                    !formData.requestedStartDate && "text-gray-400"
                                  )}
                                >
                                  <div className="flex items-center w-full">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 mr-4">
                                      <CalendarIcon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-sm font-medium text-gray-500 mb-1">Service Start Date</div>
                                      <div className="text-lg font-semibold">
                                        {formData.requestedStartDate ? (
                                          format(formData.requestedStartDate, "EEEE, MMMM do, yyyy")
                                        ) : (
                                          <span className="text-gray-400 font-normal">Choose your preferred start date</span>
                                        )}
                                      </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-gray-400 ml-2" />
                                  </div>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent 
                                className="w-auto p-0 bg-white border-0 shadow-2xl rounded-3xl overflow-hidden" 
                                align="start"
                                side="bottom"
                                sideOffset={8}
                                avoidCollisions={true}
                                collisionPadding={20}
                              >
                                <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/5 p-6 border-b border-gray-100">
                                  <div className="flex items-center space-x-4">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm">
                                      <CalendarIcon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-gray-600">Select Your Date</div>
                                      <div className="text-xl font-bold text-gray-900">Service Start Date</div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="p-6">
                                  <Calendar
                                    mode="single"
                                    selected={formData.requestedStartDate}
                                    onSelect={(date: Date | undefined) => {
                                      handleInputChange('requestedStartDate', date);
                                      setIsDatePickerOpen(false);
                                    }}
                                    disabled={(date: Date) => {
                                      const today = new Date();
                                      today.setHours(0, 0, 0, 0);
                                      return date < today;
                                    }}
                                    initialFocus
                                    className="rounded-2xl border-0"
                                    classNames={{
                                      months: "flex flex-col sm:flex-row gap-6",
                                      month: "flex flex-col gap-6",
                                      caption: "flex justify-center pt-3 relative items-center w-full mb-4",
                                      caption_label: "text-xl font-bold text-gray-900",
                                      nav: "flex items-center gap-3",
                                      nav_button: "size-12 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-primary-500 rounded-2xl transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-lg",
                                      nav_button_previous: "absolute left-0",
                                      nav_button_next: "absolute right-0",
                                      table: "w-full border-collapse space-y-2",
                                      head_row: "flex mb-4",
                                      head_cell: "text-gray-600 rounded-xl w-14 font-bold text-sm uppercase tracking-wide",
                                      row: "flex w-full mt-2",
                                      cell: "relative p-0 text-center focus-within:relative focus-within:z-20",
                                      day: "size-14 p-0 font-semibold rounded-2xl transition-all duration-300 hover:bg-gray-100 focus:bg-gray-100 cursor-pointer",
                                      day_selected: "bg-gradient-to-br from-primary via-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 shadow-xl transform scale-110 z-10 border-2 border-white",
                                      day_today: "bg-gradient-to-br from-secondary/20 to-secondary/30 text-secondary-700 font-bold border-2 border-secondary/40 shadow-sm",
                                      day_outside: "text-gray-300 opacity-40",
                                      day_disabled: "text-gray-200 opacity-30 cursor-not-allowed hover:bg-transparent",
                                      day_hidden: "invisible",
                                    }}
                                  />
                                </div>
                                
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-t border-gray-100">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <Star className="h-4 w-4 text-primary" />
                                      <span className="text-sm font-semibold text-gray-700">Quick Select</span>
                                    </div>
                                    <div className="flex space-x-3">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const date = new Date();
                                          date.setDate(date.getDate() + 1);
                                          handleInputChange('requestedStartDate', date);
                                          setIsDatePickerOpen(false);
                                        }}
                                        className="text-sm px-4 py-2 h-9 bg-white hover:bg-primary/10 hover:text-primary border border-gray-200 hover:border-primary/30 rounded-xl transition-all duration-200 font-medium shadow-sm"
                                      >
                                        Tomorrow
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const date = new Date();
                                          date.setDate(date.getDate() + 7);
                                          handleInputChange('requestedStartDate', date);
                                          setIsDatePickerOpen(false);
                                        }}
                                        className="text-sm px-4 py-2 h-9 bg-white hover:bg-primary/10 hover:text-primary border border-gray-200 hover:border-primary/30 rounded-xl transition-all duration-200 font-medium shadow-sm"
                                      >
                                        Next Week
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const date = new Date();
                                          date.setDate(date.getDate() + 30);
                                          handleInputChange('requestedStartDate', date);
                                          setIsDatePickerOpen(false);
                                        }}
                                        className="text-sm px-4 py-2 h-9 bg-white hover:bg-primary/10 hover:text-primary border border-gray-200 hover:border-primary/30 rounded-xl transition-all duration-200 font-medium shadow-sm"
                                      >
                                        Next Month
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>

                        {/* Date Selection Info */}
                        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                          <div className="flex items-start space-x-4">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100">
                              <AlertCircle className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-blue-900 mb-2">Service Start Date Guidelines</h4>
                              <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Services typically begin within 1-2 weeks of approval</li>
                                <li>• Allow extra time for specialized services or equipment</li>
                                <li>• Emergency services may be expedited based on need</li>
                                <li>• Your case manager will coordinate the exact start date</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* AI Response */}
                      <AnimatePresence>
                        {showAIResponse && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-gray-50 rounded-2xl p-4 border border-gray-200"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1">
                                <p className="text-gray-700">{aiMessage}</p>
                                {isTyping && (
                                  <div className="flex gap-1 mt-2">
                                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100" />
                                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation */}
                <motion.div 
                  className="flex justify-between pt-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {step > 1 ? (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={prevStep}
                      className="group h-12 px-8 rounded-xl border border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-500 font-medium transition-all duration-200"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
                      Previous
                    </Button>
                  ) : (
                    <div></div>
                  )}
                  
                  <Button 
                    type="submit"
                    className="group h-12 px-8 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    {step === totalSteps ? (
                      <>
                        Submit Referral
                        <CheckCircle2 className="w-4 h-4 ml-2 transition-transform group-hover:scale-110" />
                      </>
                    ) : (
                      <>
                        Continue
                        <ChevronRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>
            </div>
          </motion.div>
          ) : submissionState.isSubmitting ? (
            <motion.div
              key="submitting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center min-h-[400px] text-center"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6"
              >
                <Bot className="w-10 h-10 text-primary" />
              </motion.div>
              
              <motion.h2 
                className="text-2xl font-semibold mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Submitting your referral...
              </motion.h2>
              
              <motion.p 
                className="text-gray-500 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Our AI is processing your information
              </motion.p>
              
              <div className="flex gap-2">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  className="w-3 h-3 rounded-full bg-primary"
                />
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  className="w-3 h-3 rounded-full bg-primary"
                />
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  className="w-3 h-3 rounded-full bg-primary"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center min-h-[400px] text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 200,
                  damping: 10
                }}
                className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6"
              >
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </motion.div>
              
              <motion.h2 
                className="text-2xl font-semibold mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Referral Submitted Successfully!
              </motion.h2>
              
              <motion.p 
                className="text-gray-500 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Your referral has been processed and is being reviewed by our team
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col gap-4 sm:flex-row sm:gap-6"
              >
                <Button
                  onClick={() => window.location.reload()}
                  className="h-12 px-8 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Create New Referral
                </Button>
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="h-12 px-8 rounded-xl border-2 border-gray-300 hover:border-primary-400 text-gray-700 hover:text-primary-600 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Go Back Home
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
} 