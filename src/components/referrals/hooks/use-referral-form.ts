import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';
import type { FormData, FormState, SubmissionState, ReferralFormData, ReferralFormProps } from '../ReferralFormTypes';

export function useReferralForm({
  onComplete,
  prefilledClient,
  draftId,
  draftData
}: ReferralFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const totalSteps = 4;

  // Form state
  const [step, setStep] = useState(draftData?.currentStep || 1);
  const [formData, setFormData] = useState<FormData>({
    // Step 1: Client Details
    firstName: draftData?.formData?.firstName || prefilledClient?.firstName || '',
    lastName: draftData?.formData?.lastName || prefilledClient?.lastName || '',
    dateOfBirth: draftData?.formData?.dateOfBirth || prefilledClient?.dateOfBirth || '',
    sex: draftData?.formData?.sex || prefilledClient?.sex || '',
    phone: draftData?.formData?.phone || prefilledClient?.phone || '',
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
    culturalConsiderations: draftData?.formData?.culturalConsiderations || prefilledClient?.culturalConsiderations || '',
    mobilityStatus: draftData?.formData?.mobilityStatus || prefilledClient?.mobilityStatus || '',
    primaryDiagnosis: draftData?.formData?.primaryDiagnosis || prefilledClient?.primaryDiagnosis || '',
    livingSituation: draftData?.formData?.livingSituation || prefilledClient?.livingSituation || '',
    
    // Step 4: Service Start Date
    requestedStartDate: draftData?.formData?.requestedStartDate ? new Date(draftData.formData.requestedStartDate) : undefined,
    
    // Legacy fields
    email: draftData?.formData?.email || prefilledClient?.email || '',
    preferredContactMethod: draftData?.formData?.preferredContactMethod || prefilledClient?.preferredContactMethod || 'email',
    service_type: draftData?.formData?.service_type || '',
    selectedService: draftData?.formData?.selectedService || '',
    urgency: draftData?.formData?.urgency || 'medium',
    preferredStartDate: undefined,
    counties: draftData?.formData?.counties || [],
    insuranceProvider: draftData?.formData?.insuranceProvider || prefilledClient?.insurance?.provider || prefilledClient?.insuranceProvider || '',
    insuranceNumber: draftData?.formData?.insuranceNumber || prefilledClient?.insurance?.number || prefilledClient?.insuranceId || '',
    primaryLanguage: draftData?.formData?.primaryLanguage || prefilledClient?.primaryLanguage || '',
    needsTranslator: draftData?.formData?.needsTranslator || prefilledClient?.needsTranslator || false,
    preferredGender: draftData?.formData?.preferredGender || 'any',
    providerType: draftData?.formData?.providerType || 'no-preference',
    insuranceAccepted: draftData?.formData?.insuranceAccepted || [],
    languages: draftData?.formData?.languages || ['English'],
    availableTimes: draftData?.formData?.availableTimes || ['Flexible'],
    emergencyServices: draftData?.formData?.emergencyServices || 'no',
    showAvailableOnly: draftData?.formData?.showAvailableOnly || false,
    specialRequirements: draftData?.formData?.specialRequirements || '',
    additionalNotes: draftData?.formData?.additionalNotes || '',
    managerName: draftData?.formData?.managerName || '',
    organization: draftData?.formData?.organization || '',
    notifyEmail: draftData?.formData?.notifyEmail ?? true,
    notifySMS: draftData?.formData?.notifySMS || false,
    providerNotes: draftData?.formData?.providerNotes || ''
  });

  // Services state
  const [services, setServices] = useState<{
    residential: string[];
    nonResidential: string[];
  }>({
    residential: [],
    nonResidential: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI and UI state
  const [formState, setFormState] = useState<FormState>({
    isAnalyzing: false,
    suggestions: [],
    lastUpdated: new Date()
  });
  const [isTyping, setIsTyping] = useState(false);
  const [showAIResponse, setShowAIResponse] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Submission state
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    isSubmitting: false,
    isSuccess: false,
    message: ''
  });

  // Draft management
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId || null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

  // Date picker state
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Client prefill
  const [clientPrefillLoading, setClientPrefillLoading] = useState(false);
  const [clientPrefillError, setClientPrefillError] = useState<string | null>(null);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleInputChange = useCallback(async (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Trigger AI analysis with debounce
    if (typingTimeout) clearTimeout(typingTimeout);
    const timeout = setTimeout(async () => {
      setIsTyping(true);
      // AI analysis logic here (simplified for now)
      setIsTyping(false);
    }, 1000);
    setTypingTimeout(timeout);
  }, [typingTimeout]);

  const nextStep = useCallback(() => {
    if (step < totalSteps) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  }, [step, totalSteps]);

  const prevStep = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo(0, 0);
    }
  }, [step]);

  const triggerConfetti = useCallback(() => {
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
  }, []);

  const autoSaveDraft = useCallback(async () => {
    if (isDraftSaving || autoSaveStatus === 'saving') return;
    
    const hasContent = formData.firstName || formData.lastName || formData.selectedServices.length > 0 || formData.referralReason;
    if (!hasContent) return;
    
    setAutoSaveStatus('saving');
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const clientIdFromUrl = urlParams.get('clientId');
      
      if (currentDraftId) {
        const response = await fetch(`/api/referrals/drafts/${currentDraftId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formData, step }),
        });
        
        if (!response.ok) throw new Error('Failed to auto-save draft');
      } else {
        const response = await fetch('/api/referrals/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formData,
            clientId: clientIdFromUrl,
            step,
          }),
        });
        
        if (!response.ok) throw new Error('Failed to auto-save draft');
        
        const data = await response.json();
        setCurrentDraftId(data.draftId);
      }
      
      setAutoSaveStatus('saved');
      setLastAutoSave(new Date());
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Auto-save error:', error);
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 5000);
    }
  }, [formData, step, currentDraftId, isDraftSaving, autoSaveStatus]);

  const saveDraft = useCallback(async () => {
    if (isDraftSaving) return;
    
    setIsDraftSaving(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const clientIdFromUrl = urlParams.get('clientId');
      
      if (currentDraftId) {
        const response = await fetch(`/api/referrals/drafts/${currentDraftId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formData, step }),
        });
        
        if (!response.ok) throw new Error('Failed to update draft');
        
        toast({
          title: "Draft Updated",
          description: "Your referral draft has been updated successfully.",
        });
      } else {
        const response = await fetch('/api/referrals/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formData,
            clientId: clientIdFromUrl,
            step,
          }),
        });
        
        if (!response.ok) throw new Error('Failed to save draft');
        
        const data = await response.json();
        setCurrentDraftId(data.draftId);
        
        toast({
          title: "Draft Saved",
          description: "Your referral has been saved as a draft.",
        });
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDraftSaving(false);
    }
  }, [formData, step, currentDraftId, isDraftSaving, toast]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step < totalSteps) {
      nextStep();
      return;
    }
    
    setSubmissionState({
      isSubmitting: true,
      isSuccess: false,
      message: ''
    });

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const clientIdFromUrl = urlParams.get('clientId');
      
      const referralData: ReferralFormData = {
        clientInfo: {
          ...(clientIdFromUrl ? { _id: clientIdFromUrl } : {}),
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
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(referralData),
      });
      
      if (!response.ok) throw new Error('Failed to submit referral');
      
      setSubmissionState({
        isSubmitting: false,
        isSuccess: true,
        message: 'Your referral has been submitted successfully!'
      });
      
      triggerConfetti();
      
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting referral:', error);
      setSubmissionState({
        isSubmitting: false,
        isSuccess: false,
        message: 'There was an error submitting your referral. Please try again.'
      });
    }
  }, [step, formData, nextStep, triggerConfetti, onComplete, totalSteps]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Fetch services
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

  // Client prefill from URL
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
            sex: c.sex || '',
            email: c.email || '',
            phone: c.phone || '',
            address: c.address?.street || c.address || '',
            city: c.address?.city || c.city || '',
            state: c.address?.state || c.state || '',
            zipCode: c.address?.zipCode || c.zipCode || '',
            preferredContactMethod: c.preferredContactMethod || 'email',
            insurance: c.insurance?.type || c.insurance || '',
            insuranceProvider: c.insurance?.provider || c.insuranceProvider || '',
            insuranceNumber: c.insurance?.number || c.insuranceId || '',
            pmiNumber: c.pmiNumber || '',
            waiverType: c.waiverType || '',
            historyOfViolence: c.historyOfViolence || false,
            mobilityStatus: c.mobilityStatus || '',
            primaryDiagnosis: c.primaryDiagnosis || '',
            livingSituation: c.livingSituation || '',
            primaryLanguage: c.primaryLanguage || '',
            needsTranslator: c.needsTranslator || false,
            culturalConsiderations: c.culturalConsiderations || '',
          }));
        })
        .catch((err) => {
          setClientPrefillError(err.message || 'Failed to fetch client info');
        })
        .finally(() => setClientPrefillLoading(false));
    }
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      autoSaveDraft();
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [autoSaveDraft]);

  return {
    // State
    step,
    formData,
    services,
    loading,
    error,
    formState,
    isTyping,
    showAIResponse,
    aiMessage,
    submissionState,
    isDraftSaving,
    currentDraftId,
    autoSaveStatus,
    lastAutoSave,
    isDatePickerOpen,
    clientPrefillLoading,
    clientPrefillError,
    totalSteps,
    
    // Setters
    setFormData,
    setIsDatePickerOpen,
    setShowAIResponse,
    setAiMessage,
    
    // Handlers
    handleInputChange,
    handleSubmit,
    nextStep,
    prevStep,
    saveDraft,
  };
}

