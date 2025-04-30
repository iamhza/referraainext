'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import AdminLayout from '@/components/layout/AdminLayout';

export default function ReferralMatching({ params }: { params: { referralId: string } }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [filterDistance, setFilterDistance] = useState(true);
  const [filterInsurance, setFilterInsurance] = useState(true);
  const [filterAvailability, setFilterAvailability] = useState(true);

  // Mock referral data
  const referral = {
    id: params.referralId,
    service: "Adult rehabilitative mental health services (ARMHS)",
    urgency: "high",
    dateCreated: "Apr 9, 2025",
    status: "pending",
    caseManager: {
      name: "Sarah Johnson",
      organization: "Hennepin County Human Services",
      phone: "612-555-1234",
      email: "sarah.j@healthcare.org"
    },
    client: {
      referenceId: "CLIENT-2329",
      county: "Hennepin",
      zipCode: "55403",
      preferredLanguages: ["English", "Spanish"],
      accessibility: ["Wheelchair Access"],
      insurances: ["Medical Assistance", "UCare"]
    },
    notes: "Client is looking for services to help maintain independence in the community. Has previously had ARMHS services but provider left the field. Prefers female provider if possible."
  };

  // Mock provider data
  const providers = [
    {
      id: 'provider1',
      name: 'Minnesota Care Center',
      description: 'Comprehensive mental health clinic with specialized services for adults and adolescents',
      matchScore: 96,
      availability: 'high',
      waitTime: '1-2 days',
      address: '123 Healthcare Ave, Minneapolis, MN 55401',
      distance: '3.2 miles',
      phone: '(612) 555-1234',
      email: 'intake@mncare.example.com',
      website: 'www.mncare.example.com',
      certifications: ['JCAHO Accredited', 'State Certified', 'Insurance Approved'],
      services: ['Individual Therapy', 'Group Therapy', 'Medication Management', 'Crisis Services'],
      acceptedInsurance: ['Medicaid', 'Medicare', 'Blue Cross', 'UnitedHealthcare', 'Cigna'],
      languages: ['English', 'Spanish', 'Hmong', 'Somali'],
      accessibility: ['Wheelchair Accessible', 'Public Transit Access', 'Interpreter Services'],
      rating: 4.8,
      reviews: 124
    }
  ];

  // Filter providers based on search
  const filteredProviders = providers.filter(provider => 
    searchTerm === '' || 
    provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleProviderSelection = (providerId: string) => {
    setSelectedProviders(prev => 
      prev.includes(providerId)
        ? prev.filter(id => id !== providerId)
        : [...prev, providerId]
    );
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-4 md:p-6">
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link href="/admin/referrals" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to referrals
          </Link>
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Referral Matching</h1>
            <p className="text-gray-500">Match providers with referral #{referral.id}</p>
          </div>
        </div>

        {/* Referral Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Referral Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium">Service</h3>
                <p>{referral.service}</p>
              </div>
              <div>
                <h3 className="font-medium">Urgency</h3>
                <Badge className="bg-red-100 text-red-800">High</Badge>
              </div>
              <div>
                <h3 className="font-medium">Case Manager</h3>
                <p>{referral.caseManager.name}</p>
                <p className="text-sm text-muted-foreground">{referral.caseManager.organization}</p>
              </div>
              <div>
                <h3 className="font-medium">Client</h3>
                <p>Reference ID: {referral.client.referenceId}</p>
                <p className="text-sm text-muted-foreground">{referral.client.county} County</p>
              </div>
              <div className="md:col-span-2">
                <h3 className="font-medium">Notes</h3>
                <p className="text-sm text-muted-foreground">{referral.notes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Provider Matching */}
        <Card>
          <CardHeader>
            <CardTitle>Provider Matching</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <Input
                  placeholder="Search providers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="md:w-1/3"
                />
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="filter-distance"
                      checked={filterDistance}
                      onCheckedChange={() => setFilterDistance(!filterDistance)}
                    />
                    <label htmlFor="filter-distance" className="text-sm">Distance</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="filter-insurance"
                      checked={filterInsurance}
                      onCheckedChange={() => setFilterInsurance(!filterInsurance)}
                    />
                    <label htmlFor="filter-insurance" className="text-sm">Insurance</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="filter-availability"
                      checked={filterAvailability}
                      onCheckedChange={() => setFilterAvailability(!filterAvailability)}
                    />
                    <label htmlFor="filter-availability" className="text-sm">Availability</label>
                  </div>
                </div>
              </div>

              {/* Provider List */}
              {filteredProviders.map((provider) => (
                <div key={provider.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-lg">{provider.name}</h3>
                        <Badge className="bg-green-100 text-green-800">
                          {provider.matchScore}% Match
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{provider.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline">
                          {provider.distance}
                        </Badge>
                        <Badge variant="outline">
                          Wait time: {provider.waitTime}
                        </Badge>
                        <Badge variant="outline">
                          {provider.availability} availability
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={selectedProviders.includes(provider.id) ? "default" : "outline"}
                        onClick={() => toggleProviderSelection(provider.id)}
                      >
                        {selectedProviders.includes(provider.id) ? "Selected" : "Select"}
                      </Button>
                      <Button variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Action Buttons */}
              {selectedProviders.length > 0 && (
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setSelectedProviders([])}>
                    Clear Selection
                  </Button>
                  <Button>
                    Send Match Request ({selectedProviders.length})
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
} 