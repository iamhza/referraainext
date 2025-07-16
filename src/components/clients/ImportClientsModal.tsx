import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PlusCircle, Upload, X, Users, CheckCircle2, Download, FileText, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ClientStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImportClient {
  firstName: string;
  lastName: string;
  status: ClientStatus;
  currentProvider?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  county?: string;
  notes?: string;
  providerName?: string; // Keep for backward compatibility
  placementDate?: string;
}

interface ImportClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (importedCount: number) => void;
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

export function ImportClientsModal({ isOpen, onClose, onComplete }: ImportClientsModalProps) {
  const [step, setStep] = useState<'intro' | 'manual' | 'bulk' | 'success'>('intro');
  const [manualClient, setManualClient] = useState<ImportClient>({
    firstName: '',
    lastName: '',
    status: 'UNPLACED_NEW'
  });
  const [clients, setClients] = useState<ImportClient[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const handleDownloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/client-import-template.csv';
    link.download = 'referra-client-import-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Template downloaded",
      description: "Fill out the CSV template with your client data and upload it back here"
    });
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

    setClients([...clients, { ...manualClient }]);
    setManualClient({
      firstName: '',
      lastName: '',
      status: 'UNPLACED_NEW'
    });
  };

  const handleRemoveClient = (index: number) => {
    setClients(clients.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (clients.length === 0) {
      toast({
        title: "No clients to import",
        description: "Please add at least one client",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Call the real API endpoint for client import
      const response = await fetch('/api/clients/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clients: clients.map(client => ({
            firstName: client.firstName,
            lastName: client.lastName,
            status: client.status,
            currentProvider: client.currentProvider || client.providerName, // Handle both field names
            phone: client.phone,
            email: client.email,
            address: client.address,
            county: client.county,
            notes: client.notes,
            placementDate: client.placementDate,
          }))
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import clients');
      }

      const data = await response.json();
      
      // Move to success step
      setStep('success');
      
      if (onComplete) {
        onComplete(data.imported || clients.length);
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "There was an error importing your clients",
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
        // Properly parse CSV line handling quoted fields
        const values = parseCSVLine(line);
        const rowNum = index + 2; // +2 because we start from line 1 and skip header
        
        // Find column indices
        const firstNameIdx = headers.findIndex(h => h.includes('first'));
        const lastNameIdx = headers.findIndex(h => h.includes('last'));
        const providerIdx = headers.findIndex(h => h.includes('provider'));
        const phoneIdx = headers.findIndex(h => h.includes('phone'));
        const emailIdx = headers.findIndex(h => h.includes('email'));
        const addressIdx = headers.findIndex(h => h.includes('address'));
        const countyIdx = headers.findIndex(h => h.includes('county'));
        const notesIdx = headers.findIndex(h => h.includes('notes'));
        
        const firstName = firstNameIdx >= 0 ? values[firstNameIdx] : '';
        const lastName = lastNameIdx >= 0 ? values[lastNameIdx] : '';
        const currentProvider = providerIdx >= 0 ? values[providerIdx] : '';
        const phone = phoneIdx >= 0 ? values[phoneIdx] : '';
        const email = emailIdx >= 0 ? values[emailIdx] : '';
        const address = addressIdx >= 0 ? values[addressIdx] : '';
        const county = countyIdx >= 0 ? values[countyIdx] : '';
        const notes = notesIdx >= 0 ? values[notesIdx] : '';
        
        // Parse address to extract city, state, zipCode
        let city = '', state = '', zipCode = '';
        if (address) {
          // Expected format: "123 Main St, Anytown, CA 90210"
          const addressParts = address.split(',').map(part => part.trim());
          if (addressParts.length >= 3) {
            // Last part should contain state and zip: "CA 90210"
            const lastPart = addressParts[addressParts.length - 1];
            const stateZipMatch = lastPart.match(/([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);
            if (stateZipMatch) {
              state = stateZipMatch[1];
              zipCode = stateZipMatch[2];
            }
            // Second to last part should be city
            if (addressParts.length >= 2) {
              city = addressParts[addressParts.length - 2];
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
        
        // Only add if we have minimum required fields
        if (firstName && lastName) {
          importedClients.push({
            firstName,
            lastName,
            status: currentProvider ? 'ACTIVE_STABLE' : 'UNPLACED_NEW', // Auto-assign status based on provider
            currentProvider: currentProvider || undefined,
            phone: phone || undefined,
            email: email || undefined,
            address: address || undefined,
            city: city || undefined,
            state: state || undefined,
            zipCode: zipCode || undefined,
            county: county || undefined,
            notes: notes || undefined
          });
        }
      });
      
      if (errors.length > 0) {
        setValidationErrors(errors);
        toast({
          title: "Validation errors found",
          description: `Found ${errors.length} errors. Please fix them and re-upload.`,
          variant: "destructive"
        });
        return;
      }
      
      if (importedClients.length === 0) {
        throw new Error('No valid clients found in the CSV file');
      }
      
      setClients([...clients, ...importedClients]);
      toast({
        title: "File uploaded successfully",
        description: `Added ${importedClients.length} clients from file. ${importedClients.filter(c => c.currentProvider).length} have existing providers.`
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "There was an error processing your file",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'intro':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Import Your Clients</DialogTitle>
              <DialogDescription className="text-base">
                Quickly get started by importing your existing clients to Referra
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-6">
              <Button 
                onClick={() => setStep('manual')} 
                variant="outline" 
                className="h-32 flex flex-col p-4 items-center justify-center border-dashed hover:border-blue-300 hover:bg-blue-50/50"
              >
                <PlusCircle className="h-8 w-8 mb-2 text-blue-500" />
                <span className="text-lg font-medium">Add Manually</span>
                <span className="text-sm text-gray-500">Enter client details one by one</span>
              </Button>
              <Button 
                onClick={() => setStep('bulk')} 
                variant="outline" 
                className="h-32 flex flex-col p-4 items-center justify-center border-dashed hover:border-blue-300 hover:bg-blue-50/50"
              >
                <Upload className="h-8 w-8 mb-2 text-blue-500" />
                <span className="text-lg font-medium">Bulk Import</span>
                <span className="text-sm text-gray-500">Upload a CSV or spreadsheet</span>
              </Button>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
            </DialogFooter>
          </>
        );

      case 'manual':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <PlusCircle className="h-5 w-5 mr-2 text-blue-500" />
                Add Clients Manually
              </DialogTitle>
              <DialogDescription>
                Enter your client details below
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={manualClient.firstName} 
                    onChange={(e) => setManualClient({...manualClient, firstName: e.target.value})} 
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={manualClient.lastName} 
                    onChange={(e) => setManualClient({...manualClient, lastName: e.target.value})} 
                    placeholder="Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Client Status</Label>
                  <Select 
                    value={manualClient.status} 
                    onValueChange={(value) => setManualClient({...manualClient, status: value as ClientStatus})}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE_STABLE">
                        <StatusBadge status="ACTIVE_STABLE" size="sm" />
                      </SelectItem>
                      <SelectItem value="ACTIVE_FRUSTRATED">
                        <StatusBadge status="ACTIVE_FRUSTRATED" size="sm" />
                      </SelectItem>
                      <SelectItem value="UNPLACED_NEW">
                        <StatusBadge status="UNPLACED_NEW" size="sm" />
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="provider">Current Provider (optional)</Label>
                  <Input 
                    id="provider" 
                    value={manualClient.providerName || ''} 
                    onChange={(e) => setManualClient({...manualClient, providerName: e.target.value})} 
                    placeholder="Provider name"
                    disabled={manualClient.status === 'UNPLACED_NEW'}
                  />
                </div>
              </div>
              <Button 
                onClick={handleAddClient} 
                type="button"
                variant="outline"
                className="w-full border-dashed border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Client
              </Button>
              
              {/* Preview Imported Clients */}
              {clients.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <h3 className="font-medium text-green-900">Ready to Import ({clients.length} clients)</h3>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {clients.map((client, index) => (
                      <div key={index} className="flex items-center justify-between bg-white rounded-md p-3 text-sm border border-green-100">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{client.firstName} {client.lastName}</span>
                            <StatusBadge status={client.status} size="sm" />
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                            {(client.currentProvider || client.providerName) && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Provider: {client.currentProvider || client.providerName}
                              </Badge>
                            )}
                            {client.phone && (
                              <span className="bg-gray-100 px-2 py-1 rounded">📞 {client.phone}</span>
                            )}
                            {client.email && (
                              <span className="bg-gray-100 px-2 py-1 rounded">✉️ {client.email}</span>
                            )}
                            {client.county && (
                              <span className="bg-gray-100 px-2 py-1 rounded">📍 {client.county}</span>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleRemoveClient(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-sm text-green-700">
                    <div className="flex items-center justify-between">
                      <span>✅ {clients.filter(c => c.currentProvider || c.providerName).length} with existing providers</span>
                      <span>🆕 {clients.filter(c => !c.currentProvider && !c.providerName).length} need provider assignment</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep('intro')}>Back</Button>
              <Button 
                onClick={handleSubmit} 
                disabled={clients.length === 0 || isSubmitting}
              >
                {isSubmitting ? "Importing..." : "Import Clients"}
              </Button>
            </DialogFooter>
          </>
        );

      case 'bulk':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2 text-blue-500" />
                Bulk Import Your Caseload
              </DialogTitle>
              <DialogDescription>
                Get your entire client caseload into Referra with minimal manual work
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-6">
              
              {/* Step 1: Download Template */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900 mb-2">Download CSV Template</h3>
                    <p className="text-sm text-blue-800 mb-3">
                      Get our pre-formatted template with the right columns: Client Name, Current Provider, Contact Info, etc.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDownloadTemplate}
                      className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Template
                    </Button>
                  </div>
                </div>
              </div>

              {/* Step 2: Fill & Upload */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-2">Fill Out & Upload</h3>
                    <div className="text-sm text-gray-700 mb-3 space-y-1">
                      <p><strong>Required:</strong> Client Name (First, Last), Current Provider</p>
                      <p><strong>Optional:</strong> Phone, Email, Address, County, Notes</p>
                      <p className="text-amber-700"><strong>Tip:</strong> Most case managers already have this in Excel or EHR exports!</p>
                    </div>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <h4 className="font-medium mb-1">Upload Your CSV</h4>
                      <p className="text-sm text-gray-500 mb-3">Drag and drop or click to select file</p>
                      <Input 
                        type="file" 
                        accept=".csv" 
                        onChange={handleBulkUpload}
                        className="hidden"
                        id="file-upload"
                        disabled={isSubmitting}
                      />
                      <Button asChild variant="outline" disabled={isSubmitting}>
                        <label htmlFor="file-upload" className="cursor-pointer">
                          {isSubmitting ? "Processing..." : "Select CSV File"}
                        </label>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <div className="font-medium mb-2">Please fix these errors in your CSV:</div>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {validationErrors.slice(0, 5).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                      {validationErrors.length > 5 && (
                        <li>...and {validationErrors.length - 5} more errors</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              {clients.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-sm text-gray-500 mb-2">Clients to Import ({clients.length})</h3>
                  <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-2">
                    {clients.map((client, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded-md p-2 text-sm">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={client.status} size="sm" />
                          <span className="font-medium">{client.firstName} {client.lastName}</span>
                          {client.providerName && (
                            <Badge variant="outline" className="ml-1 text-xs">
                              {client.providerName}
                            </Badge>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 rounded-full"
                          onClick={() => handleRemoveClient(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep('intro')}>Back</Button>
              <Button 
                onClick={handleSubmit} 
                disabled={clients.length === 0 || isSubmitting}
              >
                {isSubmitting ? "Importing..." : "Import Clients"}
              </Button>
            </DialogFooter>
          </>
        );

      case 'success':
        return (
          <>
            <div className="text-center py-10">
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Caseload Import Complete!</h2>
              <p className="text-gray-600 mb-6">
                Successfully imported {clients.length} clients to your Referra account.
              </p>
              
              {/* Import Statistics */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {clients.filter(c => c.currentProvider || c.providerName).length}
                    </div>
                    <div className="text-sm text-gray-600">With Providers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {clients.filter(c => c.phone && c.email).length}
                    </div>
                    <div className="text-sm text-gray-600">Complete Profiles</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-100 rounded-full"></div>
                    <span>{clients.filter(c => c.status === 'ACTIVE_STABLE').length} Active & Stable</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-100 rounded-full"></div>
                    <span>{clients.filter(c => c.status === 'ACTIVE_FRUSTRATED').length} Need Attention</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-100 rounded-full"></div>
                    <span>{clients.filter(c => c.status === 'UNPLACED_NEW').length} Unplaced/New</span>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 space-y-2">
                <p>🎯 <strong>Next Steps:</strong></p>
                <p>• Providers will automatically "light up" as we onboard them</p>
                <p>• Complete missing profile information for better matching</p>
                <p>• Start creating referrals for clients who need services</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={onClose}>View My Clients</Button>
            </DialogFooter>
          </>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
} 