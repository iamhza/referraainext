"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import type { Client } from '@/types';

export default function EditClientPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { toast } = useToast();
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    county: "",
    preferredContactMethod: "email",
    insurance: {
      type: "",
      provider: "",
      number: ""
    }
  });

  // Fetch client data
  useEffect(() => {
    async function fetchClient() {
      if (!id) return;
      
      try {
        setLoading(true);
        const res = await fetch(`/api/clients/${id}`);
        
        if (!res.ok) {
          throw new Error("Failed to fetch client");
        }
        
        const data = await res.json();
        if (!data.client) {
          throw new Error("Client not found");
        }
        
        setClient(data.client);
        
        // Set form data from client
        setFormData({
          firstName: data.client.firstName || "",
          lastName: data.client.lastName || "",
          dateOfBirth: data.client.dateOfBirth ? new Date(data.client.dateOfBirth).toISOString().split('T')[0] : "",
          email: data.client.email || "",
          phone: data.client.phone || "",
          address: typeof data.client.address === 'string' ? data.client.address : (data.client.address?.street || ""),
          city: data.client.city || "",
          state: data.client.state || "",
          zipCode: data.client.zipCode || "",
          county: data.client.county || "",
          preferredContactMethod: data.client.preferredContactMethod || "email",
          insurance: {
            type: data.client.insurance?.type || "",
            provider: data.client.insurance?.provider || "",
            number: data.client.insurance?.number || ""
          }
        });
      } catch (err: any) {
        console.error("Error fetching client:", err);
        setError(err.message || "Failed to load client");
      } finally {
        setLoading(false);
      }
    }
    
    fetchClient();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) {
      toast({
        title: "Error",
        description: "Missing client ID",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSaving(true);
      
      // Format the data correctly for the API
      const clientData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth || null,
        email: formData.email || "",
        phone: formData.phone || "",
        address: formData.address || "",
        city: formData.city || "",
        state: formData.state || "",
        zipCode: formData.zipCode || "",
        county: formData.county || "",
        preferredContactMethod: formData.preferredContactMethod || "email",
        insurance: {
          type: formData.insurance?.type || "",
          provider: formData.insurance?.provider || "",
          number: formData.insurance?.number || ""
        }
      };
      
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      });
      
      let responseData;
      try {
        responseData = await res.json();
      } catch (parseError) {
        console.error("Error parsing API response:", parseError);
        throw new Error("Invalid response from server");
      }
      
      if (!res.ok) {
        console.error("API error response:", responseData);
        throw new Error(responseData.error || responseData.details || "Failed to update client");
      }
      
      toast({
        title: "Success",
        description: "Client information updated successfully",
      });
      
      // Navigate back to client profile
      router.push(`/provider/clients/${id}`);
    } catch (err: any) {
      console.error("Error updating client:", err);
      toast({
        title: "Error",
        description: err.message || "An error occurred while updating the client",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name.startsWith('insurance.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        insurance: {
          ...prev.insurance,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-500"></div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center gap-4">
        <h3 className="text-xl font-semibold text-gray-900">Error Loading Client</h3>
        <p className="text-gray-600">{error || 'Client not found.'}</p>
        <Button asChild>
          <Link href="/provider/clients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href={`/provider/clients/${id}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Client
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Edit Client Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="Enter client's first name"
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Enter client's last name"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="client@example.com"
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Street address"
                rows={3}
              />
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder="12345"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="county">County</Label>
              <Input
                id="county"
                name="county"
                value={formData.county}
                onChange={handleChange}
                placeholder="County"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="preferredContactMethod">Preferred Contact Method</Label>
              <Select value={formData.preferredContactMethod} onValueChange={(value) => handleSelectChange('preferredContactMethod', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contact method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="text">Text Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4">
              <Label className="text-base font-semibold">Insurance Information</Label>
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="insurance.type">Insurance Type</Label>
                  <Input
                    id="insurance.type"
                    name="insurance.type"
                    value={formData.insurance.type}
                    onChange={handleChange}
                    placeholder="e.g. Medicaid, Medicare, Private, None"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="insurance.provider">Insurance Provider</Label>
                  <Input
                    id="insurance.provider"
                    name="insurance.provider"
                    value={formData.insurance.provider}
                    onChange={handleChange}
                    placeholder="Provider name"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="insurance.number">Policy Number</Label>
                  <Input
                    id="insurance.number"
                    name="insurance.number"
                    value={formData.insurance.number}
                    onChange={handleChange}
                    placeholder="Policy number"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/provider/clients/${id}`)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 