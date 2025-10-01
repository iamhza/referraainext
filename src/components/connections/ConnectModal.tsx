'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Users, CheckCircle, AlertTriangle, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Client {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  pmi?: string;
  serviceType?: string;
}

interface PotentialMatch {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  pmi: string;
  serviceType: string;
  caseManagerName?: string;
  caseManagerEmail?: string;
  providerName?: string;
  matchConfidence: 'high' | 'medium' | 'low';
  matchReason: string;
}

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  userRole: 'case_manager' | 'provider';
  onConnectionRequested: () => void;
}

export function ConnectModal({ 
  isOpen, 
  onClose, 
  client,
  userRole,
  onConnectionRequested 
}: ConnectModalProps) {
  const [pmi, setPmi] = useState(client.pmi || '');
  const [serviceType, setServiceType] = useState(client.serviceType || '');
  const [isSearching, setIsSearching] = useState(false);
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isRequestingConnection, setIsRequestingConnection] = useState(false);
  const { toast } = useToast();

  const serviceTypes = [
    'ARMHS',
    'Day Program',
    'Residential',
    'Supported Living',
    'Employment Services',
    'Transportation',
    'Other'
  ];

  const handleSearch = async () => {
    if (!pmi || !/^\d{9}$/.test(pmi)) {
      toast({
        title: "Invalid PMI",
        description: "PMI must be exactly 9 digits",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    setHasSearched(false);
    
    try {
      const response = await fetch(`/api/clients/match-pmi?pmi=${pmi}&serviceType=${encodeURIComponent(serviceType || '')}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search for matches');
      }
      
      const { matches, total } = await response.json();
      setPotentialMatches(matches || []);
      setHasSearched(true);
      
      if (matches && matches.length > 0) {
        toast({
          title: "Potential Matches Found!",
          description: `Found ${total} potential connection(s) with matching PMI`,
        });
      } else {
        toast({
          title: "No Matches Found",
          description: "No clients found with this PMI and service type combination",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleRequestConnection = async (match: PotentialMatch) => {
    setIsRequestingConnection(true);
    
    try {
      // Build client match key for connection request
      const clientMatchKey = `${client.firstName}|${client.lastName}|${client.dateOfBirth}`;
      
      const response = await fetch('/api/connections/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientMatchKey,
          caseManagerId: match.caseManagerId, // From the match
          providerId: match.providerId, // From the match  
          pmi,
          serviceType
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to request connection');
      }
      
      toast({
        title: "Connection Request Sent!",
        description: `Connection request sent to ${match.caseManagerName || match.providerName}`,
      });
      
      onConnectionRequested();
      onClose();
      
    } catch (error) {
      console.error('Connection request error:', error);
      toast({
        title: "Request Failed",
        description: error instanceof Error ? error.message : 'Failed to send connection request',
        variant: "destructive"
      });
    } finally {
      setIsRequestingConnection(false);
    }
  };

  const handleClose = () => {
    setPotentialMatches([]);
    setHasSearched(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {userRole === 'case_manager' ? 'Connect to Provider' : 'Connect to Case Manager'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {client.firstName} {client.lastName}
                </div>
                <div>
                  <span className="font-medium">DOB:</span> {client.dateOfBirth || 'Not provided'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pmi">PMI Number *</Label>
                <Input
                  id="pmi"
                  value={pmi}
                  onChange={(e) => setPmi(e.target.value)}
                  placeholder="123456789"
                  maxLength={9}
                />
              </div>
              <div>
                <Label htmlFor="serviceType">Service Type</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleSearch} 
              disabled={isSearching || !pmi}
              className="w-full"
            >
              {isSearching ? (
                <>Searching...</>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  {userRole === 'case_manager' 
                    ? 'Find Matching Providers' 
                    : 'Find Matching Case Managers'
                  }
                </>
              )}
            </Button>
          </div>

          {/* Search Results */}
          {hasSearched && (
            <div className="space-y-4">
              <h3 className="font-medium text-sm">
                {potentialMatches.length > 0 
                  ? `Found ${potentialMatches.length} Potential Match(es)`
                  : 'No Matches Found'
                }
              </h3>

              {potentialMatches.length > 0 ? (
                <div className="space-y-3">
                  {potentialMatches.map((match, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {match.firstName} {match.lastName}
                              </span>
                              <Badge variant={
                                match.matchConfidence === 'high' ? 'default' : 
                                match.matchConfidence === 'medium' ? 'secondary' : 'outline'
                              }>
                                {match.matchConfidence} confidence
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>PMI: {match.pmi}</div>
                              <div>Service: {match.serviceType}</div>
                              <div>
                                {match.caseManagerName && `Case Manager: ${match.caseManagerName}`}
                                {match.providerName && `Provider: ${match.providerName}`}
                              </div>
                              <div className="text-xs text-gray-500">
                                Match Reason: {match.matchReason}
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleRequestConnection(match)}
                            disabled={isRequestingConnection}
                            size="sm"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Send Request
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No matching clients found with PMI {pmi}
                    {serviceType && ` and service type ${serviceType}`}.
                    This client may not have an existing provider relationship.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
