'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, ArrowLeft, CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// List of all available services
const AVAILABLE_SERVICES = [
  "24-hour emergency assistance (waiver)",
  "Adult companion services",
  "Adult day services (ADS)",
  "Adult rehabilitative mental health services (ARMHS)",
  "Assisted living facility with dementia care",
  "Basic home care license",
  "Behavioral health home (BHH) services",
  "Case management (waiver)",
  "Certified community behavioral health clinic (CCBHC)",
  "Chore services (waiver)",
  "Community behavioral health hospital (CBHH)",
  "Comprehensive home care license",
  "Consumer-directed community supports (CDCS) support planner",
  "Crisis respite",
  "Customized living services",
  "Day support services",
  "Dental clinic",
  "Employment services (waiver)",
  "Environmental accessibility adaptations (EAA) home assessment",
  "Environmental accessibility adaptations (EAA) home modification",
  "Environmental accessibility adaptations (EAA) vehicle modification",
  "Family residential services",
  "Family training",
  "Home-delivered meals",
  "Homemaker services",
  "Home safety",
  "Housing stabilization services (HSS)",
  "Independent living skills therapy (waiver)",
  "Individual community living supports (ICLS)",
  "Individualized home supports (IHS) with family training",
  "Individualized home supports (IHS) without training",
  "Individualized home supports (IHS) with training",
  "Integrated community supports (ICS)",
  "Job training",
  "Medical equipment and supplies",
  "Night supervision",
  "Nursing home",
  "Nursing home out of state",
  "Nutrition services (waiver)",
  "Opioid treatment – non-residential",
  "Personal care assistant (PCA)",
  "Personal emergency response system (PERS)",
  "Positive support services",
  "Prevocational services",
  "Respite",
  "Specialist services",
  "Specialized equipment and supplies",
  "Supervised living facility",
  "Supportive housing",
  "Transitional services",
  "Transportation (waiver)",
  "Vocational rehabilitation (VR) community partner"
];

type ServiceType = 'medical' | 'dental' | 'mental_health';
type UrgencyLevel = 'low' | 'medium' | 'high';
type InsuranceType = 'medicaid' | 'medicare' | 'private' | 'none';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step < totalSteps) {
      setStep(step + 1);
      window.scrollTo(0, 0);
      return;
    }
    
    try {
      // TODO: Implement your form submission logic here
      
      toast({
        title: "Referral Submitted Successfully",
        description: "Your referral has been submitted and is being processed.",
      });
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error submitting your referral. Please try again.",
        variant: "destructive",
      });
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardContent className="p-6">
          {/* Progress Bar */}
          <div className="border-b pb-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">Create New Referral</h2>
              <div className="text-sm text-gray-500">Step {step} of {totalSteps}</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Service Request Basics */}
            {step === 1 && (
              <div className="animate-fade-in space-y-6">
                <div className="mb-8">
                  <div className="bg-primary/10 text-primary inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-2">
                    Step 1
                  </div>
                  <h3 className="text-lg font-semibold">Service Request Basics</h3>
                  <p className="text-gray-500 mt-1">Tell us what service you're looking for</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="service">What service is needed?</Label>
                    <Select 
                      value={formData.selectedService}
                      onValueChange={(value) => setFormData({...formData, selectedService: value})}
                    >
                      <SelectTrigger id="service">
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {AVAILABLE_SERVICES.map((service) => (
                          <SelectItem key={service} value={service}>
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
              </div>
            )}

            {/* Step 2: Provider Matching Preferences */}
            {step === 2 && (
              <div className="animate-fade-in space-y-6">
                <div className="mb-8">
                  <div className="bg-primary/10 text-primary inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-2">
                    Step 2
                  </div>
                  <h3 className="text-lg font-semibold">Provider Matching Preferences</h3>
                  <p className="text-gray-500 mt-1">Help us find the right providers</p>
                </div>

                <div className="space-y-6">
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
            )}

            {/* Step 3: Contact & Follow-Up */}
            {step === 3 && (
              <div className="animate-fade-in space-y-6">
                <div className="mb-8">
                  <div className="bg-primary/10 text-primary inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-2">
                    Step 3
                  </div>
                  <h3 className="text-lg font-semibold">Contact & Follow-Up</h3>
                  <p className="text-gray-500 mt-1">Your information for provider communications</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="managerName">Case Manager Name</Label>
                      <Input
                        id="managerName"
                        value={formData.managerName}
                        onChange={(e) => setFormData({...formData, managerName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="organization">Organization Name</Label>
                      <Input
                        id="organization"
                        value={formData.organization}
                        onChange={(e) => setFormData({...formData, organization: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notification Preferences</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="notify-email"
                          checked={formData.notifyEmail}
                          onCheckedChange={(checked) => 
                            setFormData({...formData, notifyEmail: checked as boolean})}
                        />
                        <label
                          htmlFor="notify-email"
                          className="text-sm leading-none"
                        >
                          Email notifications
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="notify-sms"
                          checked={formData.notifySMS}
                          onCheckedChange={(checked) => 
                            setFormData({...formData, notifySMS: checked as boolean})}
                        />
                        <label
                          htmlFor="notify-sms"
                          className="text-sm leading-none"
                        >
                          SMS notifications
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="providerNotes">Additional Notes for Providers</Label>
                    <Textarea 
                      id="providerNotes"
                      value={formData.providerNotes}
                      onChange={(e) => setFormData({...formData, providerNotes: e.target.value})}
                      placeholder="Any specific details you want providers to know about this referral..."
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> After submitting this referral, matched providers will be notified. You'll be able to communicate directly with providers who accept the referral.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={step === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button type="submit">
                {step === totalSteps ? 'Submit Referral' : 'Next'}
                {step !== totalSteps && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 