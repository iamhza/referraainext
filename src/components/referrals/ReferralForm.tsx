'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, ArrowLeft, CalendarIcon, Loader2, Sparkles, CheckCircle2, AlertCircle, Bot, ChevronRight, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import confetti from 'canvas-confetti';

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
  // Personal Information
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  preferredContactMethod: 'email' | 'phone' | 'both';
  
  // Service Details
  service_type: ServiceType | '';
  selectedService: string;
  urgency: UrgencyLevel | '';
  preferredStartDate: Date | undefined;
  counties: string[];
  
  // Insurance Information
  insurance: InsuranceType | '';
  insuranceProvider?: string;
  insuranceNumber?: string;
  
  // Provider Preferences
  primaryLanguage: string;
  needsTranslator: boolean;
  preferredGender: string;
  providerType: 'no-preference' | 'small' | 'large' | 'nonprofit' | 'faith-based';
  insuranceAccepted: string[];
  languages: string[];
  availableTimes: string[];
  emergencyServices: 'yes' | 'no';
  showAvailableOnly: boolean;
  
  // Notes
  specialRequirements: string;
  additionalNotes: string;
  
  // Contact Information
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
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    preferredContactMethod: 'email',
    service_type: '',
    selectedService: '',
    urgency: 'medium',
    preferredStartDate: undefined,
    counties: [],
    insurance: '',
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
  const totalSteps = 3;
  const [services, setServices] = useState<string[]>([]);
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
      className="min-h-screen bg-gradient-to-b from-gray-50 to-white"
    >
      <div className="max-w-3xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!submissionState.isSubmitting && !submissionState.isSuccess ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              {/* Existing form content */}
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-3 mb-8"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold">AI Referral Assistant</h1>
                  <p className="text-gray-500">Let me help you create a referral</p>
                </div>
              </motion.div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Progress Indicator */}
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(step / totalSteps) * 100}%` }}
                  className="h-1 bg-primary rounded-full"
                />

                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                      >
                        <h2 className="text-xl font-semibold mb-4">Let's start with the basics</h2>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                              What's the client's first name?
                            </Label>
                            <Input
                              id="firstName"
                              value={formData.firstName}
                              onChange={(e) => handleInputChange('firstName', e.target.value)}
                              placeholder="Type here..."
                              className="h-12 text-lg border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all duration-200"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                              And their last name?
                            </Label>
                            <Input
                              id="lastName"
                              value={formData.lastName}
                              onChange={(e) => handleInputChange('lastName', e.target.value)}
                              placeholder="Type here..."
                              className="h-12 text-lg border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all duration-200"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">
                              When were they born?
                            </Label>
                            <Input
                              id="dateOfBirth"
                              type="date"
                              value={formData.dateOfBirth}
                              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                              className="h-12 text-lg border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all duration-200"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                              What's their email address?
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              placeholder="Type here..."
                              className="h-12 text-lg border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all duration-200"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                              And their phone number?
                            </Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                              placeholder="(XXX) XXX-XXXX"
                              className="h-12 text-lg border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all duration-200"
                              required
                            />
                          </div>
                        </div>
                      </motion.div>

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
                      className="space-y-6"
                    >
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                      >
                        <h2 className="text-xl font-semibold mb-4">Tell me about the service needed</h2>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="service" className="text-sm font-medium text-gray-700">
                              What type of service are you looking for?
                            </Label>
                            <Select 
                              value={formData.selectedService}
                              onValueChange={(value) => handleInputChange('selectedService', value)}
                            >
                              <SelectTrigger 
                                id="service" 
                                className="h-12 text-lg border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all duration-200"
                              >
                                <SelectValue placeholder="Select a service..." />
                              </SelectTrigger>
                              <SelectContent 
                                className="max-h-[300px] w-[var(--radix-select-trigger-width)] overflow-y-auto bg-white/95 backdrop-blur-md border border-gray-100 rounded-xl shadow-xl"
                              >
                                {services.map((service) => (
                                  <SelectItem 
                                    key={service} 
                                    value={service}
                                    className="py-3 px-4 text-base cursor-pointer rounded-lg text-gray-700 outline-none transition-colors data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary data-[selected]:bg-primary/5 data-[selected]:text-primary data-[selected]:font-medium"
                                  >
                                    {service}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Urgency of the request?</Label>
                            <RadioGroup
                              value={formData.urgency}
                              onValueChange={(value: UrgencyLevel) => setFormData({...formData, urgency: value})}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="low" id="low" />
                                <Label htmlFor="low">Low</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="medium" id="medium" />
                                <Label htmlFor="medium">Medium</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="high" id="high" />
                                <Label htmlFor="high">High</Label>
                              </div>
                            </RadioGroup>
                          </div>

                          <div className="space-y-2">
                            <Label>Preferred Start Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !formData.preferredStartDate && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {formData.preferredStartDate ? format(formData.preferredStartDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={formData.preferredStartDate}
                                  onSelect={(date: Date | undefined) => setFormData({...formData, preferredStartDate: date})}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="counties">Counties to be served</Label>
                            <Select
                              value={formData.counties[0]}
                              onValueChange={(value) => setFormData({...formData, counties: [value]})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select county" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hennepin">Hennepin</SelectItem>
                                <SelectItem value="ramsey">Ramsey</SelectItem>
                                <SelectItem value="dakota">Dakota</SelectItem>
                                <SelectItem value="anoka">Anoka</SelectItem>
                                <SelectItem value="washington">Washington</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="notes">Additional Notes</Label>
                            <Textarea 
                              id="notes"
                              value={formData.additionalNotes}
                              onChange={(e) => setFormData({...formData, additionalNotes: e.target.value})}
                              placeholder="Any additional details about the service request..."
                              className="min-h-[100px]"
                            />
                          </div>
                        </div>
                      </motion.div>

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
                      className="space-y-6"
                    >
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                      >
                        <h2 className="text-xl font-semibold mb-4">Provider Matching Preferences</h2>
                        
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
                      </motion.div>

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
                      className="group h-12 px-6 rounded-xl"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
                      Previous
                    </Button>
                  ) : (
                    <div></div>
                  )}
                  
                  <Button 
                    type="submit"
                    className="group h-12 px-6 rounded-xl bg-primary hover:bg-primary/90"
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
              >
                <Button
                  onClick={() => window.location.reload()}
                  className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90"
                >
                  Create New Referral
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
} 