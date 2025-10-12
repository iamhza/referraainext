'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EnhancedLabel as Label } from '@/components/ui/enhanced-label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useClientMutations } from '@/hooks/use-client-refresh';
import { 
  User, 
  MapPin, 
  FileText, 
  ChevronRight, 
  ChevronLeft, 
  Check,
  X,
  Loader2,
  Heart
} from 'lucide-react';

interface ClientFormData {
  // Basic Information
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: string;
  email: string;
  phone: string;
  preferredContactMethod: string;
  
  // Address Information
  address: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Insurance Information
  insurance: string;
  insuranceProvider: string;
  insuranceNumber: string;
  pmiNumber: string;
  waiverType: string;
  
  // Service Types
  serviceTypes: string[];
  
  // Additional Information
  primaryLanguage: string;
  needsTranslator: boolean;
  historyOfViolence: boolean;
  mobilityStatus: string;
  livingSituation: string;
  primaryDiagnosis: string;
  culturalConsiderations: string;
  additionalNotes: string;
}

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientAdded?: () => void;
}

export function AddClientModal({ isOpen, onClose, onClientAdded }: AddClientModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { onClientAdded: mutateClientAdded } = useClientMutations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Ensure proper cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Use setTimeout to ensure cleanup happens after animations
      const cleanup = setTimeout(() => {
        // Reset form state when modal closes
        setCurrentStep(1);
        setIsSubmitting(false);
        
        // Force body scroll unlock (in case it gets stuck)
        document.body.style.overflow = '';
        document.body.style.pointerEvents = '';
        document.body.classList.remove('overflow-hidden');
        
        // Remove any lingering overlays and portals
        const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
        overlays.forEach(overlay => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        });
        
        // Remove any lingering portals
        const portals = document.querySelectorAll('[data-radix-portal]');
        portals.forEach(portal => {
          if (portal.parentNode && portal.children.length === 0) {
            portal.parentNode.removeChild(portal);
          }
        });
        
        // Force remove any elements with high z-index that might be blocking
        const highZElements = document.querySelectorAll('[style*="z-index: 9999"], [style*="z-index: 9998"]');
        highZElements.forEach(element => {
          if (element.getAttribute('data-radix-dialog-overlay') !== null || 
              element.getAttribute('data-radix-dialog-content') !== null) {
            if (element.parentNode) {
              element.parentNode.removeChild(element);
            }
          }
        });
      }, 300); // Wait for animations to complete
      
      return () => clearTimeout(cleanup);
    }
  }, [isOpen]);
  
  const [formData, setFormData] = useState<ClientFormData>({
    // Basic Information
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    sex: '',
    email: '',
    phone: '',
    preferredContactMethod: 'email',
    
    // Address Information
    address: '',
    city: '',
    state: '',
    zipCode: '',
    
    // Insurance Information
    insurance: '',
    insuranceProvider: '',
    insuranceNumber: '',
    pmiNumber: '',
    waiverType: '',
    
    // Service Types
    serviceTypes: [],
    
    // Additional Information
    primaryLanguage: 'English',
    needsTranslator: false,
    historyOfViolence: false,
    mobilityStatus: '',
    livingSituation: '',
    primaryDiagnosis: '',
    culturalConsiderations: '',
    additionalNotes: '',
  });

  const [services, setServices] = useState<{ residential: string[]; nonResidential: string[] }>({
    residential: [],
    nonResidential: []
  });
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);

  // Fetch services on mount
  useEffect(() => {
    async function fetchServices() {
      try {
        const response = await fetch('/api/services');
        if (!response.ok) throw new Error('Failed to fetch services');
        const data = await response.json();
        setServices(data.services);
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setServicesLoading(false);
      }
    }
    fetchServices();
  }, []);

  const handleInputChange = (field: keyof ClientFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleService = (service: string) => {
    if (formData.serviceTypes.includes(service)) {
      setFormData(prev => ({
        ...prev,
        serviceTypes: prev.serviceTypes.filter(s => s !== service)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        serviceTypes: [...prev.serviceTypes, service]
      }));
    }
  };

  const removeService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      serviceTypes: prev.serviceTypes.filter(s => s !== service)
    }));
  };

  const nextStep = (e?: React.MouseEvent) => {
    console.log('nextStep called, current step:', currentStep);
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (currentStep < totalSteps) {
      console.log('Moving to step:', currentStep + 1);
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.firstName && formData.lastName && formData.dateOfBirth && formData.phone;
      case 2:
        return formData.address && formData.city && formData.state && formData.zipCode;
      case 3:
        return true; // Additional details are optional
      default:
        return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted on step:', currentStep, 'Total steps:', totalSteps);
    
    if (!isStepValid(currentStep)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before continuing.",
        variant: "destructive"
      });
      return;
    }

    // If not on the final step, just go to next step
    if (currentStep < totalSteps) {
      console.log('Not on final step, going to next step');
      nextStep();
      return;
    }

    // Only submit when on the final step
    console.log('On final step, creating client');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          source: 'case_manager_form'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create client');
      }

      const result = await response.json();
      
      toast({
        title: "Success!",
        description: `${formData.firstName} ${formData.lastName} has been added successfully.`,
      });

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        sex: '',
        email: '',
        phone: '',
        preferredContactMethod: 'email',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        insurance: '',
        insuranceProvider: '',
        insuranceNumber: '',
        pmiNumber: '',
        waiverType: '',
        primaryLanguage: 'English',
        needsTranslator: false,
        historyOfViolence: false,
        mobilityStatus: '',
        livingSituation: '',
        primaryDiagnosis: '',
        culturalConsiderations: '',
        additionalNotes: '',
      });
      
      setCurrentStep(1);
      
      // Notify parent components
      if (mutateClientAdded) {
        mutateClientAdded();
      }
      if (onClientAdded) {
        onClientAdded();
      }
      
      // Close modal
      onClose();

    } catch (error: any) {
      console.error('Error creating client:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create client. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Immediate cleanup
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
      document.body.classList.remove('overflow-hidden');
      
      // Reset form state
      setCurrentStep(1);
      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        sex: '',
        email: '',
        phone: '',
        preferredContactMethod: 'email',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        insurance: '',
        insuranceProvider: '',
        insuranceNumber: '',
        pmiNumber: '',
        waiverType: '',
        primaryLanguage: 'English',
        needsTranslator: false,
        historyOfViolence: false,
        mobilityStatus: '',
        livingSituation: '',
        primaryDiagnosis: '',
        culturalConsiderations: '',
        additionalNotes: '',
      });
      
      // Close the modal
      onClose();
      
      // Additional cleanup after a short delay
      setTimeout(() => {
        // Force remove any lingering modal elements
        const modalElements = document.querySelectorAll('[data-state="closed"][data-radix-dialog-overlay], [data-state="closed"][data-radix-dialog-content]');
        modalElements.forEach(element => {
          if (element.parentNode) {
            element.parentNode.removeChild(element);
          }
        });
      }, 100);
    }
  };

  const steps = [
    { number: 1, title: 'Basic Info', icon: User },
    { number: 2, title: 'Address', icon: MapPin },
    { number: 3, title: 'Additional', icon: FileText }
  ];

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose} modal={true}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-hidden bg-white border-0 shadow-2xl rounded-2xl p-0 [&>button]:hidden"
        onPointerDownOutside={(e) => {
          if (!isSubmitting) {
            handleClose();
          } else {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (!isSubmitting) {
            handleClose();
          } else {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          if (isSubmitting) {
            e.preventDefault();
          }
        }}
        forceMount={isOpen ? undefined : false}
      >
        <div className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-2xl overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-grid-slate-100 opacity-30" />
          
          {/* Header Section */}
          <div className="relative px-8 pt-8 pb-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-white mb-2">Add New Client</DialogTitle>
                <p className="text-blue-100 text-sm">Create a comprehensive client profile with our guided wizard</p>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 group"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-200" />
              </button>
            </div>
          </div>

          {/* Content Container */}
          <div className="relative bg-white/80 backdrop-blur-sm">
            <div className="px-8 py-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">

              {/* Progress Steps */}
              <div className="relative mb-8">
                <div className="flex items-center justify-between px-4">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.number;
                    const isCompleted = currentStep > step.number;
                    const isValid = isStepValid(step.number);

                    return (
                      <div key={step.number} className="flex items-center relative z-10">
                        <div className="flex flex-col items-center">
                          <motion.div 
                            className={`
                              w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-500 shadow-lg
                              ${isCompleted 
                                ? 'bg-gradient-to-br from-green-400 to-green-600 border-green-500 text-white shadow-green-200' 
                                : isActive 
                                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-500 text-white shadow-blue-200 ring-4 ring-blue-100' 
                                  : isValid
                                    ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-blue-600 shadow-blue-100'
                                    : 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300 text-gray-400 shadow-gray-100'
                              }
                            `}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {isCompleted ? (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              >
                                <Check className="w-6 h-6" />
                              </motion.div>
                            ) : (
                              <Icon className="w-6 h-6" />
                            )}
                          </motion.div>
                          <span className={`
                            text-sm font-semibold mt-3 transition-all duration-300 text-center
                            ${isActive ? 'text-blue-600 scale-105' : isCompleted ? 'text-green-600' : 'text-gray-500'}
                          `}>
                            {step.title}
                          </span>
                        </div>
                        {index < steps.length - 1 && (
                          <div className="absolute top-7 left-14 w-full h-0.5 -z-10">
                            <div className="w-full h-full bg-gray-200 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                                initial={{ width: "0%" }}
                                animate={{ 
                                  width: currentStep > step.number ? "100%" : "0%" 
                                }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-8">
                <AnimatePresence mode="wait">
                  {/* Step 1: Basic Information */}
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="space-y-8"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-xl" />
                        <div className="relative bg-white/70 backdrop-blur-sm rounded-xl border border-blue-100 p-6 shadow-sm">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                              <User className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">Basic Information</h3>
                              <p className="text-sm text-gray-600">Client's personal and contact details</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">First Name *</Label>
                              <Input
                                id="firstName"
                                value={formData.firstName}
                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                                placeholder="Enter first name"
                                required
                                className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-200 bg-white/50 backdrop-blur-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">Last Name *</Label>
                              <Input
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                                placeholder="Enter last name"
                                required
                                className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-200 bg-white/50 backdrop-blur-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="dateOfBirth" className="text-sm font-semibold text-gray-700">Date of Birth *</Label>
                              <Input
                                id="dateOfBirth"
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                required
                                className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-200 bg-white/50 backdrop-blur-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="sex" className="text-sm font-semibold text-gray-700">Gender</Label>
                              <Select value={formData.sex} onValueChange={(value) => handleInputChange('sex', value)}>
                                <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-200 bg-white/50 backdrop-blur-sm">
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                  <SelectItem value="non-binary">Non-binary</SelectItem>
                                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">Phone Number *</Label>
                              <Input
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                placeholder="(555) 123-4567"
                                required
                                className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-200 bg-white/50 backdrop-blur-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
                              <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                placeholder="client@example.com"
                                className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-200 bg-white/50 backdrop-blur-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Address Information */}
                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="space-y-8"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-xl" />
                        <div className="relative bg-white/70 backdrop-blur-sm rounded-xl border border-green-100 p-6 shadow-sm">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg">
                              <MapPin className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">Address Information</h3>
                              <p className="text-sm text-gray-600">Client's residential address</p>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div className="space-y-2">
                              <Label htmlFor="address" className="text-sm font-semibold text-gray-700">Street Address *</Label>
                              <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                placeholder="123 Main Street"
                                required
                                className="h-11 border-gray-200 focus:border-green-500 focus:ring-green-500/20 rounded-lg transition-all duration-200 bg-white/50 backdrop-blur-sm"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="city" className="text-sm font-semibold text-gray-700">City *</Label>
                                <Input
                                  id="city"
                                  value={formData.city}
                                  onChange={(e) => handleInputChange('city', e.target.value)}
                                  placeholder="Minneapolis"
                                  required
                                  className="h-11 border-gray-200 focus:border-green-500 focus:ring-green-500/20 rounded-lg transition-all duration-200 bg-white/50 backdrop-blur-sm"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="state" className="text-sm font-semibold text-gray-700">State *</Label>
                                <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                                  <SelectTrigger className="h-11 border-gray-200 focus:border-green-500 focus:ring-green-500/20 rounded-lg transition-all duration-200 bg-white/50 backdrop-blur-sm">
                                    <SelectValue placeholder="Select state" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="MN">Minnesota</SelectItem>
                                    <SelectItem value="WI">Wisconsin</SelectItem>
                                    <SelectItem value="IA">Iowa</SelectItem>
                                    <SelectItem value="ND">North Dakota</SelectItem>
                                    <SelectItem value="SD">South Dakota</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="zipCode" className="text-sm font-semibold text-gray-700">ZIP Code *</Label>
                                <Input
                                  id="zipCode"
                                  value={formData.zipCode}
                                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                                  placeholder="55401"
                                  required
                                  className="h-11 border-gray-200 focus:border-green-500 focus:ring-green-500/20 rounded-lg transition-all duration-200 bg-white/50 backdrop-blur-sm"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Additional Information */}
                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="space-y-8"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 rounded-xl" />
                        <div className="relative bg-white/70 backdrop-blur-sm rounded-xl border border-purple-100 p-6 shadow-sm">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-lg">
                              <FileText className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">Additional Information</h3>
                              <p className="text-sm text-gray-600">Insurance and service details</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="pmiNumber" className="text-sm font-semibold text-gray-700">PMI Number</Label>
                              <Input
                                id="pmiNumber"
                                value={formData.pmiNumber}
                                onChange={(e) => handleInputChange('pmiNumber', e.target.value)}
                                placeholder="123456789"
                                className="h-11 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-lg transition-all duration-200 bg-white/50 backdrop-blur-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="waiverType" className="text-sm font-semibold text-gray-700">Waiver Type</Label>
                              <Select value={formData.waiverType} onValueChange={(value) => handleInputChange('waiverType', value)}>
                                <SelectTrigger className="h-11 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-lg transition-all duration-200 bg-white/50 backdrop-blur-sm">
                                  <SelectValue placeholder="Select waiver type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="DD Waiver">DD Waiver</SelectItem>
                                  <SelectItem value="BI Waiver">BI Waiver</SelectItem>
                                  <SelectItem value="CADI Waiver">CADI Waiver</SelectItem>
                                  <SelectItem value="CAC Waiver">CAC Waiver</SelectItem>
                                  <SelectItem value="EW Waiver">EW Waiver</SelectItem>
                                  <SelectItem value="AC Waiver">AC Waiver</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                              <div className="flex items-center gap-2 mb-2">
                                <Heart className="w-4 h-4 text-purple-600" />
                                <Label className="text-sm font-semibold text-gray-700">Service Types</Label>
                              </div>
                              
                              {/* Selected services as badges */}
                              {formData.serviceTypes.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {formData.serviceTypes.map(service => (
                                    <Badge 
                                      key={service} 
                                      variant="secondary" 
                                      className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs"
                                    >
                                      {service}
                                      <button
                                        type="button"
                                        onClick={() => removeService(service)}
                                        className="ml-1 hover:text-emerald-900"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              {/* Dropdown */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
                                  className="w-full px-4 py-3 text-left border border-gray-200 rounded-lg bg-white/50 backdrop-blur-sm hover:bg-gray-50 text-sm transition-all duration-200"
                                >
                                  {servicesLoading ? 'Loading services...' : 'Select services...'}
                                </button>
                                
                                {servicesDropdownOpen && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-40"
                                      onClick={() => setServicesDropdownOpen(false)}
                                    />
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-auto">
                                      {/* Residential Services */}
                                      <div className="p-2">
                                        <div className="text-xs font-semibold text-gray-500 uppercase mb-2 px-2">
                                          Residential Services
                                        </div>
                                        {services.residential.map(service => (
                                          <label
                                            key={service}
                                            className="flex items-center px-2 py-2 hover:bg-gray-50 cursor-pointer rounded"
                                          >
                                            <Checkbox
                                              checked={formData.serviceTypes.includes(service)}
                                              onCheckedChange={() => toggleService(service)}
                                              className="mr-2"
                                            />
                                            <span className="text-sm">{service}</span>
                                          </label>
                                        ))}
                                      </div>

                                      {/* Non-Residential Services */}
                                      <div className="p-2 border-t">
                                        <div className="text-xs font-semibold text-gray-500 uppercase mb-2 px-2">
                                          Non-Residential Services
                                        </div>
                                        {services.nonResidential.map(service => (
                                          <label
                                            key={service}
                                            className="flex items-center px-2 py-2 hover:bg-gray-50 cursor-pointer rounded"
                                          >
                                            <Checkbox
                                              checked={formData.serviceTypes.includes(service)}
                                              onCheckedChange={() => toggleService(service)}
                                              className="mr-2"
                                            />
                                            <span className="text-sm">{service}</span>
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="insuranceProvider" className="text-sm font-semibold text-gray-700">Insurance Provider</Label>
                              <Input
                                id="insuranceProvider"
                                value={formData.insuranceProvider}
                                onChange={(e) => handleInputChange('insuranceProvider', e.target.value)}
                                placeholder="Blue Cross Blue Shield"
                                className="h-11 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-lg transition-all duration-200 bg-white/50 backdrop-blur-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="primaryLanguage" className="text-sm font-semibold text-gray-700">Primary Language</Label>
                              <Select value={formData.primaryLanguage} onValueChange={(value) => handleInputChange('primaryLanguage', value)}>
                                <SelectTrigger className="h-11 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-lg transition-all duration-200 bg-white/50 backdrop-blur-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="English">English</SelectItem>
                                  <SelectItem value="Spanish">Spanish</SelectItem>
                                  <SelectItem value="Somali">Somali</SelectItem>
                                  <SelectItem value="Hmong">Hmong</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                              <Label htmlFor="additionalNotes" className="text-sm font-semibold text-gray-700">Additional Notes</Label>
                              <Textarea
                                id="additionalNotes"
                                value={formData.additionalNotes}
                                onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                                placeholder="Any additional information about the client..."
                                rows={3}
                                className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-lg transition-all duration-200 bg-white/50 backdrop-blur-sm resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-white/80 backdrop-blur-sm border-t border-gray-100 pt-6 mt-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {currentStep > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={prevStep}
                          disabled={isSubmitting}
                          className="flex items-center gap-2 h-11 px-6 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="h-11 px-6 border-gray-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                      >
                        Cancel
                      </Button>

                      {currentStep < totalSteps ? (
                        <Button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            nextStep(e);
                          }}
                          disabled={!isStepValid(currentStep) || isSubmitting}
                          className="flex items-center gap-2 h-11 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSubmit(e as any);
                          }}
                          disabled={!isStepValid(currentStep) || isSubmitting}
                          className="flex items-center gap-2 h-11 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Create Client
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}