import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  UserPlus, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Search, 
  RefreshCw,
  Users,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ClientStatus } from '@/types';

interface ImportClient {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  county?: string;
  sex?: string;
  preferredContactMethod?: 'email' | 'phone' | 'both';
  insuranceProvider?: string;
  insuranceNumber?: string;
  pmiNumber?: string;
  waiverType?: string;
  primaryLanguage?: string;
  notes?: string;
  status: ClientStatus;
  // Legacy fields
  placementDate?: string;
  // NEW: ServiceConnection fields
  pmi?: string;
  serviceType?: string;
  serviceType1?: string;
  // Connection fields
  caseManagerName?: string;
  caseManagerEmail?: string;
  currentProvider?: string;
  providerContactEmail?: string;
  providerName?: string;
  providerOrgName?: string;
  // Pending connection tracking
  hasPendingConnection?: boolean;
  pendingConnectionId?: string;
}

interface ImportClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (importedCount: number) => void;
  role: 'case_manager' | 'provider';
}

// Helper function to properly parse CSV lines with quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  return result;
}

export function ImportClientsModal({ isOpen, onClose, onComplete, role }: ImportClientsModalProps) {
  const [step, setStep] = useState<'intro' | 'manual' | 'bulk' | 'success'>('intro');
  const [manualClient, setManualClient] = useState<ImportClient>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    county: '',
    sex: '',
    preferredContactMethod: 'email',
    insuranceProvider: '',
    insuranceNumber: '',
    pmiNumber: '',
    waiverType: '',
    primaryLanguage: '',
    notes: '',
    status: 'UNPLACED_NEW',
    // Legacy fields
    placementDate: '',
    // NEW: ServiceConnection fields
    pmi: '',
    serviceType: '',
    serviceType1: '',
    // Connection fields
    caseManagerName: '',
    caseManagerEmail: '',
    currentProvider: '',
    providerContactEmail: '',
    providerName: '',
    providerOrgName: ''
  });
  const [clients, setClients] = useState<ImportClient[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [checkingConnection, setCheckingConnection] = useState(false);
  const [connectionMatch, setConnectionMatch] = useState<any>(null);
  const [connectionRequested, setConnectionRequested] = useState(false);
  const [connectionRequestId, setConnectionRequestId] = useState<string | null>(null);
  const [suggestedConnections, setSuggestedConnections] = useState<any[]>([]);
  const [availableServices, setAvailableServices] = useState<{residential: string[], nonResidential: string[]}>({residential: [], nonResidential: []});
  const { toast } = useToast();

  // Fetch available services on component mount
  useEffect(() => {
    const fetchServices = async () => {
      console.log('🔄 Fetching services...');
      try {
        const response = await fetch('/api/services');
        console.log('📡 Services API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 Services API data:', data);
          setAvailableServices(data.services);
        } else {
          console.error('❌ Services API error:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('❌ Failed to fetch services:', error);
      }
    };

    if (isOpen) {
      console.log('🚪 Modal opened, fetching services...');
      fetchServices();
    }
  }, [isOpen]);

  const getTemplateFileName = () => {
    return role === 'case_manager' 
      ? '/case-manager-client-import-template.csv'
      : '/provider-client-import-template.csv';
  };

  const getTemplateDownloadName = () => {
    return role === 'case_manager' 
      ? 'case-manager-clients-template.csv'
      : 'provider-clients-template.csv';
  };

  const handleDownloadTemplate = () => {
    const link = document.createElement('a');
    link.href = getTemplateFileName();
    link.download = getTemplateDownloadName();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Template downloaded",
      description: `Fill out the ${role === 'case_manager' ? 'case manager' : 'provider'} CSV template with your client data and upload it back here`
    });
  };

  // Helper function to check if provider has this specific client
  const checkProviderHasClient = async (providerOrg?: string, providerEmail?: string, clientKey?: string, tempClient?: any) => {
    try {
      console.log('🔍 Checking if provider has client:', { providerOrg, providerEmail, clientKey });
      
      // Look up specific provider by email or organization (targeted search)
      const lookupResponse = await fetch('/api/providers/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: providerEmail,
          organization: providerOrg
        })
      });
      
      if (!lookupResponse.ok) {
        throw new Error('Failed to lookup provider');
      }
      
      const { provider: foundProvider } = await lookupResponse.json();
      
      if (!foundProvider) {
        toast({
          title: "Provider not found",
          description: "No provider found with that email or organization name. Check the details or invite them to join the platform.",
          variant: "default"
        });
        return;
      }
      
      console.log('✅ Found provider:', foundProvider);
      
      // Now check if this provider actually has this client
      const [firstName, lastName, dateOfBirth] = clientKey!.split('|');
      const checkResponse = await fetch(`/api/providers/${foundProvider.id}/clients/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, dateOfBirth })
      });
      
      if (!checkResponse.ok) {
        // Provider exists but we can't check their clients
        toast({
          title: "Provider found",
          description: `Found provider "${foundProvider.displayName}" in the system. Unable to verify if they have this client. Contact them directly.`,
          variant: "default"
        });
        return;
      }
      
      const { hasClient } = await checkResponse.json();
      console.log('🎯 Provider has client:', hasClient);
      
      if (hasClient) {
        // Provider actually has this client - show connection request option
        setConnectionMatch({
          clientName: `${firstName} ${lastName}`,
          matchKey: clientKey,
          caseManagerId: tempClient?.caseManagerId, // From the temp client data
          providerId: foundProvider.id,
          clientId: null // No client created yet for case managers
        });
        
        toast({
          title: "Connection found!",
          description: `Provider "${foundProvider.displayName}" has this client! You can request a connection to collaborate.`,
        });
      } else {
        toast({
          title: "Provider found, but no shared client",
          description: `Found provider "${foundProvider.displayName}" but they don't have this client yet. You may need to contact them directly.`,
          variant: "default"
        });
      }
      
    } catch (error) {
      console.error('Error checking provider client:', error);
      toast({
        title: "Provider check failed",
        description: "Unable to verify provider information. Try again or contact them directly.",
        variant: "destructive"
      });
    }
  };

  // Helper function to check if case manager exists in system  
  const checkCaseManagerExists = async (cmName?: string, cmEmail?: string) => {
    // For now, just show a generic message since we don't have a case manager lookup API
    toast({
      title: "No shared client found",
      description: "No matching case manager found with this client. They may not have this client in their system yet.",
      variant: "default"
    });
  };

  const checkForConnection = async () => {
    // NEW: PMI validation for ServiceConnection
    if (!manualClient.pmi) {
      toast({
        title: "PMI Required",
        description: "Please enter PMI to check for connections. PMI is required for HIPAA compliance.",
        variant: "destructive"
      });
      return;
    }

    // NEW: Service type validation for ServiceConnection
    if (role === 'provider' && !manualClient.serviceType) {
      toast({
        title: "Service Type Required",
        description: "Please specify what service you provide for this client.",
        variant: "destructive"
      });
      return;
    }

    if (role === 'case_manager' && !manualClient.serviceType1) {
      toast({
        title: "Service Type Required",
        description: "Please specify what service the provider offers for this client.",
        variant: "destructive"
      });
      return;
    }

    if (!manualClient.firstName || !manualClient.lastName || !manualClient.dateOfBirth) {
      toast({
        title: "Missing information",
        description: "Please provide client name and date of birth to check for connections",
        variant: "destructive"
      });
      return;
    }

    // Validate PMI format (9 digits)
    if (!/^\d{9}$/.test(manualClient.pmi)) {
      toast({
        title: "Invalid PMI Format",
        description: "PMI must be exactly 9 digits (e.g., 123456789)",
        variant: "destructive"
      });
      return;
    }

    setCheckingConnection(true);
    try {
      console.log('🔍 Checking for connections using PMI-based matching...');
      
      // NEW: Use PMI-based matching endpoint
      const serviceType = role === 'provider' ? manualClient.serviceType : manualClient.serviceType1;
      const response = await fetch(`/api/clients/match-pmi?pmi=${manualClient.pmi}&serviceType=${encodeURIComponent(serviceType || '')}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check for connections');
      }
      
      const { matches, total, message } = await response.json();
      console.log('🔍 PMI matching result:', { matches, total, message });
      
      if (matches && matches.length > 0) {
        // Found potential connections!
        setSuggestedConnections(matches);
        
        toast({
          title: "Potential Connections Found!",
          description: `${total} client(s) found with matching PMI. Review the suggested connections below.`,
        });
      } else {
        // No matches found
        toast({
          title: "No Matches Found",
          description: "This client doesn't appear to be in our system yet. You can still create the client.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Connection check error:', error);
      
      // Provide more specific error information
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Connection check failed",
        description: `Unable to check for connections: ${errorMessage}. Client was still created.`,
        variant: "destructive"
      });
    } finally {
      setCheckingConnection(false);
    }
  };

  const initiateConnection = async () => {
    if (!connectionMatch) return;

    try {
              const response = await fetch('/api/connections/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientMatchKey: connectionMatch.matchKey,
            caseManagerId: connectionMatch.caseManagerId,
            providerId: connectionMatch.providerId,
            // NEW: Required fields for ServiceConnection
            serviceType: role === 'provider' ? manualClient.serviceType : manualClient.serviceType1,
            pmi: manualClient.pmi
          })
        });

      if (response.ok) {
        const result = await response.json();
        const counterpart = role === 'provider' ? 'case manager' : 'provider';
        toast({
          title: "Connection request sent!",
          description: `The ${counterpart} will be notified and can accept the connection to start collaborating.`,
        });
        // Set connection as requested so user can now create the client
        setConnectionRequested(true);
        setConnectionRequestId(connectionMatch.matchKey);
        
        // Don't clear connection match yet - keep it visible
        // Don't refresh page - let user create client first
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate connection');
      }
    } catch (error: any) {
      toast({
        title: "Connection request failed",
        description: error.message || "Unable to send connection request. Please try again later.",
        variant: "destructive"
      });
    }
  };

  const handleAddClient = () => {
    if (!manualClient.firstName || !manualClient.lastName) {
      toast({
        title: "Missing information",
        description: "Please provide at least a first and last name",
        variant: "destructive"
      });
      return;
    }

    // Check if this client has a pending connection request
    const clientToAdd = { 
      ...manualClient,
      // Mark as having pending connection if connection was requested
      hasPendingConnection: connectionRequested && connectionRequestId ? true : false,
      pendingConnectionId: connectionRequestId || undefined
    };

    // Check for duplicates before adding (by name + DOB + PMI)
    const isDuplicate = clients.some(existingClient => 
      existingClient.firstName?.toLowerCase() === clientToAdd.firstName?.toLowerCase() &&
      existingClient.lastName?.toLowerCase() === clientToAdd.lastName?.toLowerCase() &&
      existingClient.dateOfBirth === clientToAdd.dateOfBirth &&
      existingClient.pmi === clientToAdd.pmi
    );

    if (isDuplicate) {
      toast({
        title: "Duplicate client",
        description: "This client is already in your list",
        variant: "destructive"
      });
      return;
    }

    console.log('🔄 Adding client with pending connection data:', {
      name: `${clientToAdd.firstName} ${clientToAdd.lastName}`,
      hasPendingConnection: clientToAdd.hasPendingConnection,
      pendingConnectionId: clientToAdd.pendingConnectionId,
      connectionRequested,
      connectionRequestId
    });

    setClients([...clients, clientToAdd]);
    setManualClient({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      county: '',
      sex: '',
      preferredContactMethod: 'email',
      insuranceProvider: '',
      insuranceNumber: '',
      pmiNumber: '',
      waiverType: '',
      primaryLanguage: '',
      notes: '',
      status: 'UNPLACED_NEW',
      // Legacy fields
      placementDate: '',
      // NEW: ServiceConnection fields
      pmi: '',
      serviceType: '',
      serviceType1: '',
      // Connection fields
      caseManagerName: '',
      caseManagerEmail: '',
      currentProvider: '',
      providerContactEmail: '',
      providerName: '',
      providerOrgName: ''
    });
    setConnectionMatch(null);
    
    // Don't call onComplete here - wait until Submit saves to database
  };

  // REMOVED: Function to request connection - using existing flow instead
  const handleRequestConnection = async () => {
    if (!manualClient.firstName || !manualClient.lastName || !manualClient.dateOfBirth) {
      toast({
        title: "Missing information",
        description: "Please provide first name, last name, and date of birth",
        variant: "destructive"
      });
      return;
    }

    setCheckingConnection(true);
    
    try {
      // First check if connection exists
      const connectionResponse = await fetch('/api/connections');
      const connectionData = await connectionResponse.json();
      
      if (!connectionResponse.ok) {
        throw new Error('Failed to check connections');
      }

      // Look for matching connection
      const clientKey = `${manualClient.firstName.toLowerCase()}|${manualClient.lastName.toLowerCase()}|${manualClient.dateOfBirth}`;
      const matchingConnection = connectionData.connections.find((conn: any) => 
        conn.matchKey === clientKey
      );

      if (matchingConnection) {
        // Request connection
        const requestResponse = await fetch('/api/connections/initiate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientMatchKey: matchingConnection.matchKey,
            caseManagerId: matchingConnection.caseManagerId,
            providerId: matchingConnection.providerId
          }),
        });

        if (requestResponse.ok) {
          setConnectionRequested(true);
          setConnectionRequestId(matchingConnection.matchKey);
          toast({
            title: "Connection requested!",
            description: "Connection request sent successfully. Now create the client to complete the process.",
          });
        } else {
          const errorData = await requestResponse.json();
          throw new Error(errorData.error || 'Failed to request connection');
        }
      } else {
        toast({
          title: "No connection found",
          description: "No matching client found in the system. You can still create this client.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Connection request failed",
        description: error.message || 'Failed to request connection',
        variant: "destructive"
      });
    } finally {
      setCheckingConnection(false);
    }
  };

  // New function for individual client creation
  const handleCreateIndividualClient = async () => {
    if (!manualClient.firstName || !manualClient.lastName || !manualClient.dateOfBirth) {
      toast({
        title: "Missing information",
        description: "Please provide first name, last name, and date of birth",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...manualClient,
          source: 'manual_create'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Client creation failed');
      }

      toast({
        title: "Client created successfully!",
        description: `${manualClient.firstName} ${manualClient.lastName} has been added to your client list.`,
      });

      // Reset form
      setManualClient({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        county: '',
        sex: '',
        preferredContactMethod: 'email',
        insuranceProvider: '',
        insuranceNumber: '',
        pmiNumber: '',
        waiverType: '',
        primaryLanguage: '',
        notes: '',
        status: 'UNPLACED_NEW',
        // Legacy fields
        placementDate: '',
        // NEW: ServiceConnection fields
        pmi: '',
        serviceType: '',
        serviceType1: '',
        // Connection fields
        caseManagerName: '',
        caseManagerEmail: '',
        currentProvider: '',
        providerContactEmail: '',
        providerName: '',
        providerOrgName: ''
      });

      // Reset connection state
      setConnectionRequested(false);
      setConnectionRequestId(null);
      setConnectionMatch(null);

      // Trigger refresh
      onComplete?.(1);
      
      // Don't close modal - let user continue adding clients
    } catch (error: any) {
      toast({
        title: "Client creation failed",
        description: error.message || 'Failed to create client',
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveClient = (index: number) => {
    setClients(clients.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (clients.length === 0) {
      toast({
        title: "No clients to import",
        description: "Please add at least one client before submitting",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('📤 Submitting clients with connection data:', 
        clients.map(c => ({
          name: `${c.firstName} ${c.lastName}`,
          hasPendingConnection: c.hasPendingConnection,
          pendingConnectionId: c.pendingConnectionId,
          pmi: c.pmi
        }))
      );

      const response = await fetch('/api/clients/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clients }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      toast({
        title: "Import successful!",
        description: `${data.imported} client${data.imported !== 1 ? 's' : ''} imported successfully`,
      });

      setStep('success');
      onComplete?.(data.imported);
      
      // Close modal after a brief delay to show success
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message || 'Failed to import clients',
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSubmitting(true);
    setValidationErrors([]);
    
    try {
      const text = await file.text();
      const lines = text.split('\n');
      
      if (lines.length < 2) {
        throw new Error('CSV file must contain at least a header row and one data row');
      }
      
      // Parse header to understand column positions
      const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
      const dataLines = lines.slice(1).filter(line => line.trim());
      
      const errors: string[] = [];
      const importedClients: ImportClient[] = [];
      
      dataLines.forEach((line, index) => {
        // Skip empty lines or lines with only commas/whitespace
        if (!line.trim() || line.trim().replace(/,/g, '').trim() === '') return;
        
        // Properly parse CSV line handling quoted fields
        const values = parseCSVLine(line);
        const rowNum = index + 2; // +2 because we start from line 1 and skip header
        
        // Skip rows where all values are empty or just whitespace
        if (values.every(val => !val || val.trim() === '')) return;
        
        // Find column indices - flexible matching
        const firstNameIdx = headers.findIndex(h => h.includes('first'));
        const lastNameIdx = headers.findIndex(h => h.includes('last'));
        const dateOfBirthIdx = headers.findIndex(h => h.includes('birth') || h.includes('dob'));
        const phoneIdx = headers.findIndex(h => h.includes('phone'));
        const emailIdx = headers.findIndex(h => h.includes('email'));
        const addressIdx = headers.findIndex(h => h.includes('address'));
        const countyIdx = headers.findIndex(h => h.includes('county'));
        const notesIdx = headers.findIndex(h => h.includes('notes'));
        
        // Role-specific field mappings
        let currentProviderIdx = -1;
        let caseManagerNameIdx = -1;
        let caseManagerEmailIdx = -1;
        let providerNameIdx = -1;
        let providerContactEmailIdx = -1;
        let providerOrgNameIdx = -1;
        
        if (role === 'case_manager') {
          currentProviderIdx = headers.findIndex(h => h.includes('current provider name') || h.includes('provider name'));
          providerContactEmailIdx = headers.findIndex(h => h.includes('provider contact email') || h.includes('provider email'));
          providerOrgNameIdx = headers.findIndex(h => h.includes('provider org name') || h.includes('provider organization'));
        } else {
          caseManagerNameIdx = headers.findIndex(h => h.includes('case manager name'));
          caseManagerEmailIdx = headers.findIndex(h => h.includes('case manager email'));
        }
        
        // Extract values
        const firstName = firstNameIdx >= 0 ? values[firstNameIdx]?.trim() : '';
        const lastName = lastNameIdx >= 0 ? values[lastNameIdx]?.trim() : '';
        const dateOfBirth = dateOfBirthIdx >= 0 ? values[dateOfBirthIdx]?.trim() : '';
        const phone = phoneIdx >= 0 ? values[phoneIdx]?.trim() : '';
        const email = emailIdx >= 0 ? values[emailIdx]?.trim() : '';
        const address = addressIdx >= 0 ? values[addressIdx]?.trim() : '';
        const county = countyIdx >= 0 ? values[countyIdx]?.trim() : '';
        const notes = notesIdx >= 0 ? values[notesIdx]?.trim() : '';
        
        // Role-specific fields
        const currentProvider = currentProviderIdx >= 0 ? values[currentProviderIdx]?.trim() : '';
        const providerContactEmail = providerContactEmailIdx >= 0 ? values[providerContactEmailIdx]?.trim() : '';
        const caseManagerName = caseManagerNameIdx >= 0 ? values[caseManagerNameIdx]?.trim() : '';
        const caseManagerEmail = caseManagerEmailIdx >= 0 ? values[caseManagerEmailIdx]?.trim() : '';
        
        // NEW: ServiceConnection fields
        const pmiIdx = headers.findIndex(h => h.includes('pmi'));
        const serviceTypeIdx = headers.findIndex(h => h.includes('service type'));
        const serviceType1Idx = headers.findIndex(h => h.includes('service type 1'));
        
        const pmi = pmiIdx >= 0 ? values[pmiIdx]?.trim() : '';
        const serviceType = serviceTypeIdx >= 0 ? values[serviceTypeIdx]?.trim() : '';
        const serviceType1 = serviceType1Idx >= 0 ? values[serviceType1Idx]?.trim() : '';
        
        // Provider name and org name
        const providerName = providerNameIdx >= 0 ? values[providerNameIdx]?.trim() : '';
        const providerOrgName = providerOrgNameIdx >= 0 ? values[providerOrgNameIdx]?.trim() : '';
        
        // Parse address to extract city, state, zipCode
        let city = '', state = '', zipCode = '';
        if (address) {
          // Expected format: "123 Main St, Anytown, CA 90210"
          const addressParts = address.split(',').map(part => part.trim());
          if (addressParts.length >= 3) {
            city = addressParts[addressParts.length - 2] || '';
            const lastPart = addressParts[addressParts.length - 1] || '';
            // Extract state and zip from last part (e.g., "CA 90210")
            const stateZipMatch = lastPart.match(/^([A-Z]{2})\s*(\d{5}(-\d{4})?)?\s*$/);
            if (stateZipMatch) {
              state = stateZipMatch[1];
              zipCode = stateZipMatch[2] || '';
            }
          }
        }
        
        // Validation
        if (!firstName) {
          errors.push(`Row ${rowNum}: First Name is required`);
        }
        if (!lastName) {
          errors.push(`Row ${rowNum}: Last Name is required`);
        }
        
        // NEW: PMI validation for ServiceConnection
        if (!pmi) {
          errors.push(`Row ${rowNum}: PMI is required for HIPAA compliance`);
        } else if (!/^\d{9}$/.test(pmi)) {
          errors.push(`Row ${rowNum}: PMI must be exactly 9 digits (e.g., 123456789)`);
        }
        
        // NEW: Service type validation
        if (role === 'provider' && !serviceType) {
          errors.push(`Row ${rowNum}: Service Type is required for providers`);
        }
        if (role === 'case_manager' && !serviceType1) {
          errors.push(`Row ${rowNum}: Primary Service Type is required for case managers`);
        }
        
        // Only add if we have minimum required fields
        if (firstName && lastName) {
                  const clientData: ImportClient = {
          firstName,
          lastName,
          dateOfBirth: dateOfBirth || undefined,
          phone: phone || '',
          email: email || '',
          address: address || '',
          city: city || '',
          state: state || '',
          zipCode: zipCode || '',
          county: county || '',
          notes: notes || '',
          status: 'UNPLACED_NEW', // Default status for bulk import
          // NEW: ServiceConnection fields
          pmi: pmi || '',
          serviceType: serviceType || '',
          serviceType1: serviceType1 || '',
          // Connection fields
          caseManagerName: caseManagerName || '',
          caseManagerEmail: caseManagerEmail || '',
          currentProvider: currentProvider || '',
          providerContactEmail: providerContactEmail || '',
          providerName: providerName || '',
          providerOrgName: providerOrgName || ''
        };
          
          // Add role-specific connection fields
          if (role === 'case_manager') {
            clientData.currentProvider = currentProvider || undefined;
            clientData.providerContactEmail = providerContactEmail || undefined;
          } else {
            clientData.caseManagerName = caseManagerName || undefined;
            clientData.caseManagerEmail = caseManagerEmail || undefined;
          }
          
          importedClients.push(clientData);
        }
      });
      
      if (errors.length > 0) {
        setValidationErrors(errors);
        toast({
          title: "Validation errors found",
          description: `${errors.length} error${errors.length !== 1 ? 's' : ''} found in your CSV file`,
          variant: "destructive"
        });
        return;
      }
      
      if (importedClients.length === 0) {
        toast({
          title: "No valid clients found",
          description: "Please check your CSV file format and ensure it contains valid client data",
          variant: "destructive"
        });
        return;
      }
      
      setClients(importedClients);
      setStep('bulk');
      
      toast({
        title: "CSV parsed successfully",
        description: `Found ${importedClients.length} valid client${importedClients.length !== 1 ? 's' : ''} to import`
      });
      
    } catch (error: any) {
      toast({
        title: "Failed to parse CSV",
        description: error.message || 'Please check your CSV file format',
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    setStep('intro');
    setClients([]);
    setManualClient({ firstName: '', lastName: '', dateOfBirth: '', phone: '', email: '', address: '', city: '', state: '', zipCode: '', county: '', sex: '', preferredContactMethod: 'email', insuranceProvider: '', insuranceNumber: '', pmiNumber: '', waiverType: '', primaryLanguage: '', notes: '', status: 'UNPLACED_NEW', placementDate: '', pmi: '', serviceType: '', serviceType1: '', caseManagerName: '', caseManagerEmail: '', currentProvider: '', providerContactEmail: '', providerName: '', providerOrgName: '' });
    setValidationErrors([]);
    setConnectionRequested(false);
    setConnectionRequestId(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const renderIntroStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Users className="h-12 w-12 text-blue-500 mx-auto" />
        <h3 className="text-lg font-semibold">Import {role === 'case_manager' ? 'Case Manager' : 'Provider'} Clients</h3>
        <p className="text-sm text-gray-600">
          Choose how you'd like to add clients to your system
        </p>
      </div>
      
      <div className="grid gap-4">
        <Button 
          variant="outline" 
          className="h-auto p-4 flex flex-col items-center space-y-2"
          onClick={() => setStep('manual')}
        >
          <UserPlus className="h-6 w-6 text-blue-500" />
          <div className="text-center">
            <div className="font-medium">Add Manually</div>
            <div className="text-xs text-gray-500">Enter client details one by one</div>
          </div>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-auto p-4 flex flex-col items-center space-y-2"
          onClick={handleDownloadTemplate}
        >
          <Download className="h-6 w-6 text-green-500" />
          <div className="text-center">
            <div className="font-medium">Download Template</div>
            <div className="text-xs text-gray-500">Get the CSV template for bulk import</div>
          </div>
        </Button>
        
        {/* NEW: Service Types Reference */}
        <Button
          variant="outline" 
          className="h-auto p-4 flex flex-col items-center space-y-2"
          onClick={() => {
            const csvContent = 'Service Type,Category,Description\nPhysical Therapy,Non-Residential,Physical therapy services\nOccupational Therapy,Non-Residential,Occupational therapy services\nSpeech Therapy,Non-Residential,Speech and language therapy\nMental Health,Non-Residential,Mental health counseling\nSubstance Abuse,Non-Residential,Substance abuse treatment\nResidential Care,Residential,24/7 residential support\nGroup Home,Residential,Group home living support\nSupported Living,Residential,Supported independent living';
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'service-types-reference.csv';
            a.click();
            window.URL.revokeObjectURL(url);
            
            toast({
              title: "Service Types Reference Downloaded",
              description: "Use this reference when filling out your CSV template"
            });
          }}
        >
          <FileText className="h-6 w-6 text-blue-500" />
          <div className="text-center">
            <div className="font-medium">Service Types</div>
            <div className="text-xs text-gray-500">Reference for service types</div>
          </div>
        </Button>
        
        <div className="relative">
          <Button 
            variant="outline" 
            className="w-full h-auto p-4 flex flex-col items-center space-y-2"
            disabled={isSubmitting}
          >
            <Upload className="h-6 w-6 text-purple-500" />
            <div className="text-center">
              <div className="font-medium">Upload CSV</div>
              <div className="text-xs text-gray-500">Bulk import from CSV file</div>
            </div>
          </Button>
          <input
            type="file"
            accept=".csv"
            onChange={handleBulkUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isSubmitting}
          />
        </div>
      </div>
      
      {validationErrors.length > 0 && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium text-red-800">Validation Errors:</div>
              {validationErrors.slice(0, 5).map((error, index) => (
                <div key={index} className="text-sm text-red-700">• {error}</div>
              ))}
              {validationErrors.length > 5 && (
                <div className="text-sm text-red-700">... and {validationErrors.length - 5} more errors</div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderManualStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Add Clients Manually</h3>
        <p className="text-sm text-gray-600">Enter client information below</p>
      </div>

      {/* Step Indicator */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center space-x-2 ${!connectionMatch ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              !connectionMatch ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              1
            </div>
            <span className="text-sm font-medium">Enter Client Info</span>
          </div>
          
          <div className="w-8 h-0.5 bg-gray-300"></div>
          
          <div className={`flex items-center space-x-2 ${connectionMatch && !connectionRequested ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              connectionMatch && !connectionRequested ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              2
            </div>
            <span className="text-sm font-medium">Check Connection</span>
          </div>
          
          <div className="w-8 h-0.5 bg-gray-300"></div>
          
          <div className={`flex items-center space-x-2 ${connectionRequested ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              connectionRequested ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              3
            </div>
            <span className="text-sm font-medium">Add Client</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={manualClient.firstName}
            onChange={(e) => setManualClient({...manualClient, firstName: e.target.value})}
            placeholder="Enter first name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={manualClient.lastName}
            onChange={(e) => setManualClient({...manualClient, lastName: e.target.value})}
            placeholder="Enter last name"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">Date of Birth</Label>
        <Input
          id="dateOfBirth"
          type="date"
          value={manualClient.dateOfBirth || ''}
          onChange={(e) => setManualClient({...manualClient, dateOfBirth: e.target.value})}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={manualClient.status} onValueChange={(value: ClientStatus) => setManualClient({...manualClient, status: value})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="UNPLACED_NEW">Unplaced & New</SelectItem>
            <SelectItem value="ACTIVE_STABLE">Active & Stable</SelectItem>
            <SelectItem value="ACTIVE_FRUSTRATED">Active & Frustrated</SelectItem>
            <SelectItem value="ACTIVE_CRISIS">Active & Crisis</SelectItem>
            <SelectItem value="INACTIVE_STABILIZED">Inactive & Stabilized</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* NEW: PMI and Service Type Fields - Required for ServiceConnection */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pmi">PMI (Personal Medical Identifier) *</Label>
          <Input
            id="pmi"
            value={manualClient.pmi || ''}
            onChange={(e) => setManualClient({...manualClient, pmi: e.target.value})}
            placeholder="123456789"
            maxLength={9}
            pattern="[0-9]{9}"
          />
          <p className="text-xs text-gray-500">9-digit Personal Medical Identifier - Required for HIPAA compliance</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="serviceType">
            {role === 'provider' ? 'Service Type *' : 'Primary Service Type *'}
          </Label>
          {availableServices.nonResidential.length === 0 && availableServices.residential.length === 0 ? (
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
              <span className="text-sm text-gray-500">Loading service types...</span>
            </div>
          ) : (
            <Select
              value={role === 'provider' ? (manualClient.serviceType || '') : (manualClient.serviceType1 || '')}
              onValueChange={(value: string) => {
                if (role === 'provider') {
                  setManualClient({...manualClient, serviceType: value});
                } else {
                  setManualClient({...manualClient, serviceType1: value});
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a service type" />
              </SelectTrigger>
              <SelectContent className="max-h-60 bg-white border border-gray-200 shadow-lg">
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-700 mb-2 px-2 bg-gray-50 py-1 rounded">Non-Residential Services</div>
                  {availableServices.nonResidential.map(service => (
                    <SelectItem key={service} value={service} className="text-sm hover:bg-gray-100 cursor-pointer">
                      {service}
                    </SelectItem>
                  ))}
                  <div className="text-xs font-medium text-gray-700 mb-2 px-2 mt-4 bg-gray-50 py-1 rounded">Residential Services</div>
                  {availableServices.residential.map(service => (
                    <SelectItem key={service} value={service} className="text-sm hover:bg-gray-100 cursor-pointer">
                      {service}
                    </SelectItem>
                  ))}
                </div>
              </SelectContent>
            </Select>
          )}
          <p className="text-xs text-gray-500">
            {role === 'provider' 
              ? 'What service do you provide for this client?'
              : 'What service does the provider offer for this client?'
            }
          </p>
          {availableServices.nonResidential.length > 0 && (
            <p className="text-xs text-blue-600">
              💡 {availableServices.nonResidential.length + availableServices.residential.length} service types available from our platform
            </p>
          )}
          {(manualClient.serviceType || manualClient.serviceType1) && (
            <div className="flex items-center space-x-2 p-2 bg-green-50 border border-green-200 rounded-md">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800">
                Selected: <strong>{role === 'provider' ? manualClient.serviceType : manualClient.serviceType1}</strong>
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Connection Discovery Section - For Both Roles */}
      {(role === 'provider' || role === 'case_manager') && (
        <div className="border-t pt-4 mt-4 space-y-4">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium text-gray-900">Connection Discovery (Optional)</h4>
          </div>
          <p className="text-sm text-gray-600">
            {role === 'provider' 
              ? "Know the case manager for this client? Enter their details below to check for an existing connection."
              : "Know the provider for this client? Enter their contact details below to check for an existing connection."
            }
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {role === 'provider' 
              ? "This will search for case managers who already have this client."
              : "This will search for providers who already have this client. Use the provider's registered email or organization name."
            }
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            {role === 'provider' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="caseManagerName">Case Manager Name</Label>
                  <Input
                    id="caseManagerName"
                    value={manualClient.caseManagerName || ''}
                    onChange={(e) => setManualClient({...manualClient, caseManagerName: e.target.value})}
                    placeholder="e.g., Sarah Johnson"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="caseManagerEmail">Case Manager Email</Label>
                  <Input
                    id="caseManagerEmail"
                    type="email"
                    value={manualClient.caseManagerEmail || ''}
                    onChange={(e) => setManualClient({...manualClient, caseManagerEmail: e.target.value})}
                    placeholder="e.g., sarah@agency.org"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="providerName">Provider Organization</Label>
                  <Input
                    id="providerName"
                    value={manualClient.currentProvider || ''}
                    onChange={(e) => setManualClient({...manualClient, currentProvider: e.target.value})}
                    placeholder="e.g., ABC Services"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="providerEmail">Provider Email</Label>
                  <Input
                    id="providerEmail"
                    type="email"
                    value={manualClient.providerContactEmail || ''}
                    onChange={(e) => setManualClient({...manualClient, providerContactEmail: e.target.value})}
                    placeholder="e.g., john@abcservices.com"
                  />
                  <p className="text-xs text-gray-500">Enter the provider's registered email address</p>
                </div>
              </>
            )}
          </div>
          
          {manualClient.pmi && 
           ((role === 'provider' && manualClient.serviceType) || (role === 'case_manager' && manualClient.serviceType1)) &&
           manualClient.firstName && manualClient.lastName && manualClient.dateOfBirth && (
            <div className="space-y-3">
              <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium mb-1">Ready to Check for Connections</p>
                <p className="text-xs text-blue-600">Click below to search for existing case managers or providers who already have this client</p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={checkForConnection}
                  disabled={checkingConnection}
                  className="flex items-center space-x-2"
                >
                  {checkingConnection ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span>{checkingConnection ? 'Checking...' : '🔍 Check for Connection'}</span>
                </Button>
              </div>
            </div>
          )}
          
          {/* NEW: Suggested Connections from PMI Matching */}
          {suggestedConnections.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h5 className="font-medium text-blue-800">Suggested Connections Found!</h5>
              </div>
              <div className="text-sm text-blue-700">
                <p>Found {suggestedConnections.length} client(s) with matching PMI. Review and select a connection:</p>
                <div className="mt-3 space-y-2">
                  {suggestedConnections.map((connection, index) => (
                    <div key={index} className="p-3 bg-white border border-blue-100 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{connection.firstName} {connection.lastName}</p>
                          <p className="text-xs text-gray-600">
                            PMI: {connection.pmi} • DOB: {connection.dateOfBirth}
                          </p>
                          {connection.caseManagerId && (
                            <p className="text-xs text-gray-600">Case Manager ID: {connection.caseManagerId}</p>
                          )}
                          {connection.currentProvider && (
                            <p className="text-xs text-gray-600">Provider ID: {connection.currentProvider}</p>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          onClick={async () => {
                            // Get current user ID for proper connection setup
                            try {
                              const userResponse = await fetch('/api/auth/user');
                              const userData = await userResponse.json();
                              const currentUserId = userData.user?.id;
                              
                              // Set connection match based on role
                              if (role === 'provider') {
                                setConnectionMatch({
                                  matchKey: `${connection.firstName}|${connection.lastName}|${connection.dateOfBirth}`,
                                  caseManagerId: connection.caseManagerId || '',
                                  providerId: currentUserId, // Current provider's ID
                                  clientName: `${connection.firstName} ${connection.lastName}`,
                                  county: 'Unknown'
                                });
                              } else {
                                // Case manager initiating connection
                                setConnectionMatch({
                                  matchKey: `${connection.firstName}|${connection.lastName}|${connection.dateOfBirth}`,
                                  caseManagerId: currentUserId, // Current case manager's ID
                                  providerId: connection.providerId || connection.currentProvider || '',
                                  clientName: `${connection.firstName} ${connection.lastName}`,
                                  county: 'Unknown'
                                });
                              }
                              setSuggestedConnections([]); // Clear suggestions
                            } catch (error) {
                              console.error('Error getting user ID:', error);
                              toast({
                                title: "Error",
                                description: "Unable to get user information. Please try again.",
                                variant: "destructive"
                              });
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Select This Connection
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Connection Match Result */}
          {connectionMatch && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h5 className="font-medium text-green-800">Connection Found!</h5>
              </div>
              <div className="text-sm text-green-700">
                <p>Found a matching case manager for this client:</p>
                <div className="mt-2 space-y-1">
                  <p><strong>Client:</strong> {connectionMatch.clientName}</p>
                  <p><strong>Case Manager ID:</strong> {connectionMatch.caseManagerId}</p>
                  <p><strong>County:</strong> {connectionMatch.county || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                {!connectionRequested ? (
                  <>
                    <Button 
                      size="sm" 
                      onClick={initiateConnection}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      🤝 Request Connection
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setConnectionMatch(null);
                        setSuggestedConnections([]);
                      }}
                    >
                      Cancel Connection
                    </Button>
                  </>
                ) : (
                  <div className="text-sm text-green-700">
                    ✅ Connection request sent! Now add the client below.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Connection Status Display */}
      {connectionRequested && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center gap-2 text-green-800 mb-2">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">🎉 Connection Request Sent!</span>
          </div>
          <p className="text-sm text-green-700 mb-2">
            Your connection request has been sent to the case manager. 
          </p>
          <div className="text-xs text-green-600 bg-green-100 p-2 rounded">
            <strong>Next step:</strong> Click "Add Client & Complete Connection" below to create your client record. 
            It will show as "Pending" until the case manager accepts the connection.
          </div>
        </div>
      )}

      {/* Clear State Warning */}
      {connectionMatch && !connectionRequested && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-center gap-2 text-amber-800 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm font-medium">⚠️ Connection Pending</span>
          </div>
          <p className="text-sm text-amber-700">
            You found a connection but haven't requested it yet. Either request the connection or cancel to add the client without a connection.
          </p>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => {
          setStep('intro');
          setConnectionRequested(false);
          setConnectionRequestId(null);
          setConnectionMatch(null);
          setSuggestedConnections([]);
        }}>
          Back
        </Button>
        <div className="flex gap-2">
          {connectionRequested ? (
            <Button 
              onClick={handleAddClient}
              className="bg-green-600 hover:bg-green-700 text-white px-6"
              size="lg"
            >
              ✅ Add Client & Complete Connection
            </Button>
          ) : (
            <Button 
              onClick={handleAddClient}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              size="lg"
              disabled={!manualClient.firstName || !manualClient.lastName || !manualClient.dateOfBirth}
            >
              ➕ Add Client
            </Button>
          )}
        </div>
      </div>
      
      {clients.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Added Clients ({clients.length})</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {clients.map((client, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{client.firstName} {client.lastName}</span>
                  <StatusBadge status={client.status} />
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleRemoveClient(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderBulkStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
        <h3 className="text-lg font-semibold">Review Import</h3>
        <p className="text-sm text-gray-600">
          {clients.length} client{clients.length !== 1 ? 's' : ''} ready to import
        </p>
      </div>
      
      <div className="max-h-60 overflow-y-auto space-y-2">
        {clients.map((client, index) => (
          <div key={index} className="flex items-center justify-between p-3 border rounded">
            <div>
              <div className="font-medium">{client.firstName} {client.lastName}</div>
              <div className="text-sm text-gray-600 space-x-2">
                {client.dateOfBirth && <span>DOB: {client.dateOfBirth}</span>}
                {client.phone && <span>• {client.phone}</span>}
                {role === 'case_manager' && client.currentProvider && (
                  <span>• Provider: {client.currentProvider}</span>
                )}
                {role === 'provider' && client.caseManagerName && (
                  <span>• CM: {client.caseManagerName}</span>
                )}
              </div>
            </div>
            <StatusBadge status={client.status} />
          </div>
        ))}
      </div>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep('intro')}>
          Back to Options
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Importing...' : `Import ${clients.length} Client${clients.length !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center space-y-4">
      <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
      <div>
        <h3 className="text-lg font-semibold text-green-800">Import Successful!</h3>
        <p className="text-sm text-gray-600">
          Your clients have been imported and are ready to use
        </p>
      </div>
      <Button onClick={handleClose} className="w-full">
        Done
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Import {role === 'case_manager' ? 'Case Manager' : 'Provider'} Clients
          </DialogTitle>
          <DialogDescription>
            {step === 'intro' && 'Add clients to your system'}
            {step === 'manual' && 'Enter client details manually'}
            {step === 'bulk' && 'Review and confirm your import'}
            {step === 'success' && 'Import completed successfully'}
          </DialogDescription>
        </DialogHeader>
        
        {step === 'intro' && renderIntroStep()}
        {step === 'manual' && renderManualStep()}
        {step === 'bulk' && renderBulkStep()}
        {step === 'success' && renderSuccessStep()}
        
        {(step === 'manual' && clients.length > 0) && (
          <DialogFooter>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Importing...' : `Import ${clients.length} Client${clients.length !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

