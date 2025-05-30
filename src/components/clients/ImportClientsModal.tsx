import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PlusCircle, Upload, X, Users, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ClientStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface ImportClient {
  firstName: string;
  lastName: string;
  status: ClientStatus;
  providerName?: string;
  placementDate?: string;
  notes?: string;
}

interface ImportClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (importedCount: number) => void;
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
  const { toast } = useToast();

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
            providerName: client.providerName,
            placementDate: client.placementDate,
            notes: client.notes,
            // Add any additional fields as needed
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

    // Simple CSV parsing logic
    setIsSubmitting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n');
      
      // Skip header row and filter out empty lines
      const dataLines = lines.slice(1).filter(line => line.trim());
      
      // Parse CSV format: firstName,lastName,status,providerName
      const importedClients = dataLines.map(line => {
        const [firstName, lastName, status, providerName] = line.split(',').map(item => item.trim());
        
        // Validate status or use default
        let clientStatus: ClientStatus = 'UNPLACED_NEW';
        if (status === 'ACTIVE_STABLE' || status === 'ACTIVE_FRUSTRATED') {
          clientStatus = status;
        }
        
        return {
          firstName,
          lastName,
          status: clientStatus,
          providerName: providerName || undefined
        } as ImportClient;
      }).filter(client => client.firstName && client.lastName); // Filter out incomplete entries
      
      if (importedClients.length === 0) {
        throw new Error('No valid clients found in the CSV file');
      }
      
      setClients([...clients, ...importedClients]);
      toast({
        title: "File uploaded",
        description: `Added ${importedClients.length} clients from file`
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

      case 'bulk':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2 text-blue-500" />
                Bulk Import Clients
              </DialogTitle>
              <DialogDescription>
                Upload a CSV or Excel file with your client data
              </DialogDescription>
            </DialogHeader>
            <div className="py-6">
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-10 text-center">
                <Upload className="h-10 w-10 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-1">Upload Client File</h3>
                <p className="text-sm text-gray-500 mb-4">Drag and drop or click to select file</p>
                <Input 
                  type="file" 
                  accept=".csv,.xlsx,.xls" 
                  onChange={handleBulkUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Button asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">Select File</label>
                </Button>
              </div>
              
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
              <h2 className="text-2xl font-bold mb-2">Import Complete!</h2>
              <p className="text-gray-600 mb-6">
                Successfully imported {clients.length} clients to your Referra account.
              </p>
              <div className="flex items-center justify-center gap-4 text-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {clients.filter(c => c.status === 'ACTIVE_STABLE').length}
                  </div>
                  <div className="text-sm text-gray-600">Stable</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600">
                    {clients.filter(c => c.status === 'ACTIVE_FRUSTRATED').length}
                  </div>
                  <div className="text-sm text-gray-600">Frustrated</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600">
                    {clients.filter(c => c.status === 'UNPLACED_NEW').length}
                  </div>
                  <div className="text-sm text-gray-600">Unplaced</div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={onClose}>View My Ecosystem</Button>
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