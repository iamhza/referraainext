// Shared types for ReferralForm components

export type ServiceType = 'medical' | 'dental' | 'mental_health';
export type UrgencyLevel = 'low' | 'medium' | 'high';
export type InsuranceType = 'medicaid' | 'medicare' | 'private' | 'none';

export interface ReferralFormData {
  clientInfo: {
    _id?: string;
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

export interface AISuggestion {
  type: 'service' | 'provider' | 'timing';
  suggestion: string;
  confidence: number;
}

export interface FormState {
  isAnalyzing: boolean;
  suggestions: AISuggestion[];
  lastUpdated: Date;
}

export interface FormData {
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

export interface ReferralFormProps {
  onComplete?: () => void;
  prefilledClient?: any;
  draftId?: string;
  draftData?: any;
}

export interface SubmissionState {
  isSubmitting: boolean;
  isSuccess: boolean;
  message: string;
}

// Props for individual step components
export interface StepComponentProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onNext: () => void;
  onBack: () => void;
  isLastStep?: boolean;
}

