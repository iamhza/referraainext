"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { ArrowLeft, User, Calendar, Phone, Mail, MapPin, Shield, FileText, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

type InsuranceType = 'medicaid' | 'medicare' | 'private' | 'none';

interface ClientFormData {
  // Basic Information
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | 'other' | '';
  email: string;
  phone: string;
  preferredContactMethod: 'email' | 'phone' | 'both';
  
  // Address Information
  address: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Insurance Information
  insurance: InsuranceType | '';
  insuranceProvider: string;
  insuranceNumber: string;
  pmiNumber: string;
  waiverType: string;
  
  // Additional Information
  primaryLanguage: string;
  needsTranslator: boolean;
  historyOfViolence: boolean;
  mobilityStatus: 'ambulatory' | 'wheelchair-bound' | 'bed-bound' | 'other' | '';
  livingSituation: 'alone' | 'with-family' | 'group-setting' | 'other' | '';
  primaryDiagnosis: string;
  culturalConsiderations: string;
  additionalNotes: string;
}

export default function NewClientPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  const handleInputChange = (field: keyof ClientFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) {
        throw new Error('Failed to create client');
      }
      
      toast({
        title: "Client created successfully!",
        description: `${formData.firstName} ${formData.lastName} has been added to your client list.`,
      });
      
      router.push('/case-manager/clients');
    } catch (err) {
      console.error('Error creating client:', err);
      toast({
        title: "Error creating client",
        description: "Please try again or contact support if the problem persists.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-sm">
              <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                <Link href="/case-manager">
                  Dashboard
                </Link>
              </Button>
              <span className="text-gray-400">/</span>
              <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                <Link href="/case-manager/clients">
                  Clients
                </Link>
              </Button>
              <span className="text-gray-400">/</span>
              <span className="font-medium text-gray-900">Add New Client</span>
            </div>
            
            {/* Back Button */}
            <Button 
              variant="outline" 
              size="sm"
              asChild
              className="border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            >
              <Link href="/case-manager/clients">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Clients
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <div className="w-96 flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-24"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Add New Client</h3>
                <p className="text-sm text-gray-600">
                  Enter your client's information to add them to your client list
                </p>
              </div>

              {/* Progress Steps */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Basic Information</h4>
                    <p className="text-xs text-gray-500">Name, contact, and demographics</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Address & Insurance</h4>
                    <p className="text-xs text-gray-400">Location and coverage details</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Additional Details</h4>
                    <p className="text-xs text-gray-400">Special considerations and notes</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-gray-600">Progress</span>
                  <span className="text-xs font-semibold text-gray-900">33%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full w-1/3"></div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Main Form */}
          <div className="flex-1 min-w-0 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Client</h1>
                <p className="text-lg text-gray-600">Enter your client's information to get started</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information Section */}
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-500" />
                      Basic Information
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">Client's personal and contact details</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* First Name */}
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-base font-medium text-gray-900">
                        First Name
                      </Label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 group-hover:from-blue-500/20 group-hover:to-blue-600/20 transition-all duration-300">
                            <User className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
                          </div>
                        </div>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          placeholder="First name"
                          className="h-16 text-lg pl-20 pr-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl"
                          required
                        />
                      </div>
                    </div>

                    {/* Last Name */}
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-base font-medium text-gray-900">
                        Last Name
                      </Label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 group-hover:from-blue-500/20 group-hover:to-blue-600/20 transition-all duration-300">
                            <User className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
                          </div>
                        </div>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          placeholder="Last name"
                          className="h-16 text-lg pl-20 pr-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl"
                          required
                        />
                      </div>
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth" className="text-base font-medium text-gray-900">
                        Date of Birth
                      </Label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 group-hover:from-blue-500/20 group-hover:to-blue-600/20 transition-all duration-300">
                            <Calendar className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
                          </div>
                        </div>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                          className="h-16 text-lg pl-20 pr-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl"
                          max={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                    </div>

                    {/* Gender Identity */}
                    <div className="space-y-2">
                      <Label htmlFor="sex" className="text-base font-medium text-gray-900">
                        Gender Identity
                      </Label>
                      <Select 
                        value={formData.sex}
                        onValueChange={(value) => handleInputChange('sex', value)}
                      >
                        <SelectTrigger className="group h-16 text-lg bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl">
                          <div className="flex items-center w-full">
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 mr-3 group-hover:from-blue-500/20 group-hover:to-blue-600/20 transition-all duration-300">
                              <User className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <div className="flex-1 text-left">
                              <SelectValue placeholder="Select gender identity" />
                            </div>
                          </div>
                        </SelectTrigger>
                        <SelectContent className="z-50 max-h-96 overflow-y-auto bg-white/95 backdrop-blur-xl border-2 border-gray-200/50 rounded-2xl shadow-2xl">
                          <SelectItem value="male" className="h-14 text-lg px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-blue-600/5 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Male</SelectItem>
                          <SelectItem value="female" className="h-14 text-lg px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-blue-600/5 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Female</SelectItem>
                          <SelectItem value="non-binary" className="h-14 text-lg px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-blue-600/5 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Non-binary</SelectItem>
                          <SelectItem value="prefer-not-to-say" className="h-14 text-lg px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-blue-600/5 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Prefer not to say</SelectItem>
                          <SelectItem value="other" className="h-14 text-lg px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-blue-600/5 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-base font-medium text-gray-900">
                        Email Address
                      </Label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 group-hover:from-blue-500/20 group-hover:to-blue-600/20 transition-all duration-300">
                            <Mail className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
                          </div>
                        </div>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="Email address"
                          className="h-16 text-lg pl-20 pr-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl"
                          required
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-base font-medium text-gray-900">
                        Phone Number
                      </Label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 group-hover:from-blue-500/20 group-hover:to-blue-600/20 transition-all duration-300">
                            <Phone className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
                          </div>
                        </div>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="Phone number"
                          className="h-16 text-lg pl-20 pr-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl"
                          required
                        />
                      </div>
                    </div>

                    {/* Preferred Contact Method */}
                    <div className="space-y-2">
                      <Label htmlFor="preferredContactMethod" className="text-base font-medium text-gray-900">
                        Preferred Contact Method
                      </Label>
                      <Select 
                        value={formData.preferredContactMethod}
                        onValueChange={(value) => handleInputChange('preferredContactMethod', value)}
                      >
                        <SelectTrigger className="group h-16 text-lg bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl">
                          <div className="flex items-center w-full">
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 mr-3 group-hover:from-blue-500/20 group-hover:to-blue-600/20 transition-all duration-300">
                              <Phone className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <div className="flex-1 text-left">
                              <SelectValue placeholder="Select contact method" />
                            </div>
                          </div>
                        </SelectTrigger>
                        <SelectContent className="z-50 max-h-96 overflow-y-auto bg-white/95 backdrop-blur-xl border-2 border-gray-200/50 rounded-2xl shadow-2xl">
                          <SelectItem value="email" className="h-14 text-lg px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-blue-600/5 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Email</SelectItem>
                          <SelectItem value="phone" className="h-14 text-lg px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-blue-600/5 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Phone</SelectItem>
                          <SelectItem value="both" className="h-14 text-lg px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-blue-600/5 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="space-y-6">
                    <div className="border-b border-gray-200 pb-4">
                      <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-green-500" />
                        Address Information
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">Client's residential address</p>
                    </div>

                    {/* Street Address */}
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-base font-medium text-gray-900">
                        Street Address
                      </Label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/10 group-hover:from-green-500/20 group-hover:to-green-600/20 transition-all duration-300">
                            <MapPin className="w-5 h-5 text-green-500 group-hover:scale-110 transition-transform duration-300" />
                          </div>
                        </div>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="Street address"
                          className="h-16 text-lg pl-20 pr-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-green-400 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* City */}
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-base font-medium text-gray-900">
                          City
                        </Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="City"
                          className="h-16 text-lg px-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-green-400 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl"
                          required
                        />
                      </div>

                      {/* State */}
                      <div className="space-y-2">
                        <Label htmlFor="state" className="text-base font-medium text-gray-900">
                          State
                        </Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          placeholder="State"
                          className="h-16 text-lg px-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-green-400 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl"
                          required
                        />
                      </div>

                      {/* Zip Code */}
                      <div className="space-y-2">
                        <Label htmlFor="zipCode" className="text-base font-medium text-gray-900">
                          ZIP Code
                        </Label>
                        <Input
                          id="zipCode"
                          value={formData.zipCode}
                          onChange={(e) => handleInputChange('zipCode', e.target.value)}
                          placeholder="ZIP code"
                          className="h-16 text-lg px-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-green-400 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Insurance Section */}
                  <div className="space-y-6">
                    <div className="border-b border-gray-200 pb-4">
                      <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-purple-500" />
                        Insurance Information
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">Client's insurance coverage details</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Insurance Type */}
                      <div className="space-y-2">
                        <Label htmlFor="insurance" className="text-base font-medium text-gray-900">
                          Insurance Type
                        </Label>
                        <Select 
                          value={formData.insurance}
                          onValueChange={(value) => handleInputChange('insurance', value)}
                        >
                          <SelectTrigger className="group h-16 text-lg bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-purple-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl">
                            <div className="flex items-center w-full">
                              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 mr-3 group-hover:from-purple-500/20 group-hover:to-purple-600/20 transition-all duration-300">
                                <Shield className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
                              </div>
                              <div className="flex-1 text-left">
                                <SelectValue placeholder="Select insurance type" />
                              </div>
                            </div>
                          </SelectTrigger>
                          <SelectContent className="z-50 max-h-96 overflow-y-auto bg-white/95 backdrop-blur-xl border-2 border-gray-200/50 rounded-2xl shadow-2xl">
                            <SelectItem value="medicaid" className="h-14 text-lg px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-purple-500/5 hover:to-purple-600/5 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Medicaid</SelectItem>
                            <SelectItem value="medicare" className="h-14 text-lg px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-purple-500/5 hover:to-purple-600/5 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Medicare</SelectItem>
                            <SelectItem value="private" className="h-14 text-lg px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-purple-500/5 hover:to-purple-600/5 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Private Insurance</SelectItem>
                            <SelectItem value="none" className="h-14 text-lg px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-purple-500/5 hover:to-purple-600/5 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">No Insurance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Insurance Provider */}
                      <div className="space-y-2">
                        <Label htmlFor="insuranceProvider" className="text-base font-medium text-gray-900">
                          Insurance Provider
                        </Label>
                        <Input
                          id="insuranceProvider"
                          value={formData.insuranceProvider}
                          onChange={(e) => handleInputChange('insuranceProvider', e.target.value)}
                          placeholder="Insurance provider name"
                          className="h-16 text-lg px-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-purple-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl"
                        />
                      </div>

                      {/* Insurance Number */}
                      <div className="space-y-2">
                        <Label htmlFor="insuranceNumber" className="text-base font-medium text-gray-900">
                          Insurance Number
                        </Label>
                        <Input
                          id="insuranceNumber"
                          value={formData.insuranceNumber}
                          onChange={(e) => handleInputChange('insuranceNumber', e.target.value)}
                          placeholder="Policy number"
                          className="h-16 text-lg px-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-purple-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl"
                        />
                      </div>

                      {/* PMI Number */}
                      <div className="space-y-2">
                        <Label htmlFor="pmiNumber" className="text-base font-medium text-gray-900">
                          PMI Number
                        </Label>
                        <Input
                          id="pmiNumber"
                          value={formData.pmiNumber}
                          onChange={(e) => handleInputChange('pmiNumber', e.target.value)}
                          placeholder="PMI number"
                          className="h-16 text-lg px-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-purple-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Information Section */}
                  <div className="space-y-6">
                    <div className="border-b border-gray-200 pb-4">
                      <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-orange-500" />
                        Additional Information
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">Special considerations and notes</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Primary Language */}
                      <div className="space-y-2">
                        <Label htmlFor="primaryLanguage" className="text-base font-medium text-gray-900">
                          Primary Language
                        </Label>
                        <Input
                          id="primaryLanguage"
                          value={formData.primaryLanguage}
                          onChange={(e) => handleInputChange('primaryLanguage', e.target.value)}
                          placeholder="Primary language"
                          className="h-16 text-lg px-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-orange-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl"
                        />
                      </div>

                      {/* Needs Translator */}
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-gray-900">
                          Translation Services
                        </Label>
                        <div className="flex items-center space-x-2 h-16 px-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-orange-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 rounded-2xl transition-all duration-300">
                          <Checkbox
                            id="needsTranslator"
                            checked={formData.needsTranslator}
                            onCheckedChange={(checked) => handleInputChange('needsTranslator', checked)}
                          />
                          <label htmlFor="needsTranslator" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Client needs translation services
                          </label>
                        </div>
                      </div>

                      {/* Mobility Status */}
                      <div className="space-y-2">
                        <Label htmlFor="mobilityStatus" className="text-base font-medium text-gray-900">
                          Mobility Status
                        </Label>
                        <Select 
                          value={formData.mobilityStatus}
                          onValueChange={(value) => handleInputChange('mobilityStatus', value)}
                        >
                          <SelectTrigger className="group h-16 text-lg bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-orange-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl">
                            <SelectValue placeholder="Select mobility status" />
                          </SelectTrigger>
                          <SelectContent className="z-50 max-h-96 overflow-y-auto bg-white/95 backdrop-blur-xl border-2 border-gray-200/50 rounded-2xl shadow-2xl">
                            <SelectItem value="ambulatory" className="h-14 text-lg px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-orange-500/5 hover:to-orange-600/5 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Ambulatory</SelectItem>
                            <SelectItem value="wheelchair-bound" className="h-14 text-lg px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-orange-500/5 hover:to-orange-600/5 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Wheelchair-bound</SelectItem>
                            <SelectItem value="bed-bound" className="h-14 text-lg px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-orange-500/5 hover:to-orange-600/5 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Bed-bound</SelectItem>
                            <SelectItem value="other" className="h-14 text-lg px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-orange-500/5 hover:to-orange-600/5 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Living Situation */}
                      <div className="space-y-2">
                        <Label htmlFor="livingSituation" className="text-base font-medium text-gray-900">
                          Living Situation
                        </Label>
                        <Select 
                          value={formData.livingSituation}
                          onValueChange={(value) => handleInputChange('livingSituation', value)}
                        >
                          <SelectTrigger className="group h-16 text-lg bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-orange-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl">
                            <SelectValue placeholder="Select living situation" />
                          </SelectTrigger>
                          <SelectContent className="z-50 max-h-96 overflow-y-auto bg-white/95 backdrop-blur-xl border-2 border-gray-200/50 rounded-2xl shadow-2xl">
                            <SelectItem value="alone" className="h-14 text-lg px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-orange-500/5 hover:to-orange-600/5 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Lives alone</SelectItem>
                            <SelectItem value="with-family" className="h-14 text-lg px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-orange-500/5 hover:to-orange-600/5 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Lives with family</SelectItem>
                            <SelectItem value="group-setting" className="h-14 text-lg px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-orange-500/5 hover:to-orange-600/5 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Group setting</SelectItem>
                            <SelectItem value="other" className="h-14 text-lg px-4 py-3 font-medium text-gray-900 hover:bg-gradient-to-r hover:from-orange-500/5 hover:to-orange-600/5 cursor-pointer transition-all duration-200 rounded-xl mx-2 my-1">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Primary Diagnosis */}
                    <div className="space-y-2">
                      <Label htmlFor="primaryDiagnosis" className="text-base font-medium text-gray-900">
                        Primary Diagnosis
                      </Label>
                      <Textarea
                        id="primaryDiagnosis"
                        value={formData.primaryDiagnosis}
                        onChange={(e) => handleInputChange('primaryDiagnosis', e.target.value)}
                        placeholder="Enter primary diagnosis or condition"
                        className="min-h-[120px] text-lg px-4 py-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-orange-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl resize-none"
                      />
                    </div>

                    {/* Cultural Considerations */}
                    <div className="space-y-2">
                      <Label htmlFor="culturalConsiderations" className="text-base font-medium text-gray-900">
                        Cultural Considerations
                      </Label>
                      <Textarea
                        id="culturalConsiderations"
                        value={formData.culturalConsiderations}
                        onChange={(e) => handleInputChange('culturalConsiderations', e.target.value)}
                        placeholder="Any cultural or religious considerations"
                        className="min-h-[120px] text-lg px-4 py-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-orange-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl resize-none"
                      />
                    </div>

                    {/* Additional Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="additionalNotes" className="text-base font-medium text-gray-900">
                        Additional Notes
                      </Label>
                      <Textarea
                        id="additionalNotes"
                        value={formData.additionalNotes}
                        onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                        placeholder="Any additional information about the client"
                        className="min-h-[120px] text-lg px-4 py-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-orange-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg focus:shadow-xl resize-none"
                      />
                    </div>

                    {/* History of Violence */}
                    <div className="space-y-2">
                      <Label className="text-base font-medium text-gray-900">
                        Safety Considerations
                      </Label>
                      <div className="flex items-center space-x-2 h-16 px-4 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-orange-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 rounded-2xl transition-all duration-300">
                        <Checkbox
                          id="historyOfViolence"
                          checked={formData.historyOfViolence}
                          onCheckedChange={(checked) => handleInputChange('historyOfViolence', checked)}
                        />
                        <label htmlFor="historyOfViolence" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          History of violence or safety concerns
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-between pt-8 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/case-manager/clients')}
                    className="border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Creating Client...
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5 mr-2" />
                        Create Client
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
} 