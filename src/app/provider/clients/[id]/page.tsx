"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Copy, 
  Users, 
  Mail, 
  Phone, 
  Building,
  MapPin,
  Calendar,
  User,
  Edit,
  AlertCircle
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatSafeDate } from '@/lib/date-utils';
import Link from "next/link";

import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Client } from '@/types';

export default function ProviderClientDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showId, setShowId] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchClient() {
      setLoading(true);
      try {
        if (!id) throw new Error("Missing client ID");
        
        const res = await fetch(`/api/clients/${id}`);
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to fetch client");
        }
        
        const data = await res.json();
        if (!data.client) {
          throw new Error("Client not found");
        }
        
        setClient(data.client);
      } catch (err: any) {
        console.error("Error fetching client:", err);
        setError(err.message || "Failed to load client");
      } finally {
        setLoading(false);
      }
    }
    
    if (id) fetchClient();
  }, [id]);

  const handleCopyId = () => {
    if (client?._id) {
      navigator.clipboard.writeText(client._id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const clientName = client ? `${client.firstName || ''} ${client.lastName || ''}`.trim() : '';
  const clientInitials = client ? 
    `${client.firstName?.charAt(0) || ''}${client.lastName?.charAt(0) || ''}`.trim().toUpperCase() : 
    'CL';

  // Helper function to render truncated ID
  const renderTruncatedId = (id: string) => {
    if (!id) return null;
    return `${id.slice(0, 4)}...${id.slice(-4)}`;
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
        <AlertCircle className="h-16 w-16 text-red-500" />
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/provider/clients">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Clients
                </Button>
              </Link>
              
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl font-semibold bg-blue-500 text-white">
                    {clientInitials}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{clientName}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => setShowId(!showId)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      {showId ? 'Hide ID' : 'Show ID'}
                    </button>
                    {showId && (
                      <>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm font-mono text-gray-500">
                          {renderTruncatedId(client._id)}
                        </span>
                        <button
                          onClick={handleCopyId}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        {copied && <span className="text-sm text-green-600">Copied!</span>}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                asChild
                className="border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
              >
                <Link href={`/provider/clients/${id}/edit`}>
                  <Edit className="h-4 w-4 mr-2 text-gray-600" />
                  Edit Client
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Client Information Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">First Name</p>
                  <p className="text-sm text-gray-900">{client.firstName || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Name</p>
                  <p className="text-sm text-gray-900">{client.lastName || 'Not specified'}</p>
                </div>
              </div>
              
              {client.dateOfBirth && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                  <p className="text-sm text-gray-900">{formatSafeDate(client.dateOfBirth)}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <div className="mt-1">
                  <StatusBadge status={client.status || 'UNPLACED_NEW'} />
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Profile Completion</p>
                <div className="mt-1">
                  <Badge variant={client.profileComplete ? "default" : "secondary"}>
                    {client.profileComplete ? 'Complete' : 'Incomplete'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-sm text-gray-900">{client.email || 'Not specified'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="text-sm text-gray-900">{client.phone || 'Not specified'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Preferred Contact Method</p>
                <p className="text-sm text-gray-900 capitalize">{client.preferredContactMethod || 'Not specified'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Street Address</p>
                <p className="text-sm text-gray-900">
                  {typeof client.address === 'string' ? client.address : 'Not specified'}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">City</p>
                  <p className="text-sm text-gray-900">{client.city || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">State</p>
                  <p className="text-sm text-gray-900">{client.state || 'Not specified'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">ZIP Code</p>
                  <p className="text-sm text-gray-900">{client.zipCode || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">County</p>
                  <p className="text-sm text-gray-900">{client.county || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insurance Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Insurance Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Insurance Type</p>
                <p className="text-sm text-gray-900">{client.insurance?.type || 'Not specified'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Insurance Provider</p>
                <p className="text-sm text-gray-900">{client.insurance?.provider || 'Not specified'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Policy Number</p>
                <p className="text-sm text-gray-900">{client.insurance?.number || 'Not specified'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        {client.notes && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{client.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 