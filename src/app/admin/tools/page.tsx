'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Workflow, Database, Users, RefreshCw, Link as LinkIcon, AlertTriangle, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function AdminToolsPage() {

  const { toast } = useToast();
  const [migratingClients, setMigratingClients] = useState(false);
  const [migratingReferrals, setMigratingReferrals] = useState(false);
  const [standardizingUrgency, setStandardizingUrgency] = useState(false);
  const [standardizingStatus, setStandardizingStatus] = useState(false);
  const [addingTestProviders, setAddingTestProviders] = useState(false);
  
  const handleMigrateClients = async () => {
    setMigratingClients(true);
    try {
      toast({
        title: "Starting client migration...",
        description: "This may take a moment. Please wait.",
      });
      
      const response = await fetch('/api/admin/migrate-clients', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to migrate clients');
      }
      
      const data = await response.json();
      
      toast({
        title: "Migration complete",
        description: data.message || `Migrated ${data.updated || 0} clients successfully.`,
      });
    } catch (error) {
      console.error('Error migrating clients:', error);
      toast({
        title: "Migration failed",
        description: "There was an error during the migration process.",
        variant: "destructive",
      });
    } finally {
      setMigratingClients(false);
    }
  };
  
  const handleMigrateReferrals = async () => {
    setMigratingReferrals(true);
    try {
      toast({
        title: "Starting referrals migration...",
        description: "This may take a moment. Please wait.",
      });
      
      const response = await fetch('/api/admin/migrate-referrals', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to migrate referrals');
      }
      
      const data = await response.json();
      
      toast({
        title: "Referrals migration complete",
        description: data.message || `Processed ${data.processed} referrals, updated ${data.updated}.`,
      });
    } catch (error) {
      console.error('Error migrating referrals:', error);
      toast({
        title: "Migration failed",
        description: "There was an error during the referrals migration process.",
        variant: "destructive",
      });
    } finally {
      setMigratingReferrals(false);
    }
  };

  const handleStandardizeUrgency = async () => {
    setStandardizingUrgency(true);
    try {
      toast({
        title: "Starting urgency standardization...",
        description: "This may take a moment. Please wait.",
      });
      
      const response = await fetch('/api/admin/standardize-urgency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'standardize' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to standardize urgency values');
      }
      
      const data = await response.json();
      
      toast({
        title: "Urgency standardization complete",
        description: data.message || `Updated ${data.updatedCount || 0} referrals successfully.`,
      });
    } catch (error) {
      console.error('Error standardizing urgency:', error);
      toast({
        title: "Standardization failed",
        description: "There was an error during the urgency standardization process.",
        variant: "destructive",
      });
    } finally {
      setStandardizingUrgency(false);
    }
  };

  const handleStandardizeStatus = async () => {
    setStandardizingStatus(true);
    try {
      toast({
        title: "Starting status standardization...",
        description: "This may take a moment. Please wait.",
      });
      
      const response = await fetch('/api/admin/standardize-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'standardize' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to standardize status values');
      }
      
      const data = await response.json();
      
      toast({
        title: "Status standardization complete",
        description: data.message || `Updated ${data.updatedCount || 0} referrals successfully.`,
      });
    } catch (error) {
      console.error('Error standardizing status:', error);
      toast({
        title: "Standardization failed",
        description: "There was an error during the status standardization process.",
        variant: "destructive",
      });
    } finally {
      setStandardizingStatus(false);
    }
  };

  const handleAddTestProviders = async () => {
    setAddingTestProviders(true);
    try {
      const response = await fetch('/api/admin/add-test-providers', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to add test providers');
      }
      
      const result = await response.json();
      toast({
        title: 'Success',
        description: `Test providers added successfully. ${result.providers?.length || 0} providers created.`,
      });
    } catch (error) {
      console.error('Error adding test providers:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add test providers',
        variant: 'destructive',
      });
    } finally {
      setAddingTestProviders(false);
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Tools</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Client Migration Tool */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Client Migration
            </CardTitle>
            <CardDescription>
              Ensure all clients have proper relationship fields
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              This tool will update all clients in the database to ensure they have proper 
              relationship fields and connections to referrals.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleMigrateClients} 
              disabled={migratingClients}
              className="w-full"
            >
              {migratingClients ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Migrating...
                </>
              ) : (
                "Migrate Clients"
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Referrals Migration Tool */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-blue-500" />
              Referrals Migration
            </CardTitle>
            <CardDescription>
              Fix client-referral relationships
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              This tool will update all referrals to ensure they have proper client IDs and
              consistent structure for client-referral relationships.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleMigrateReferrals} 
              disabled={migratingReferrals}
              className="w-full"
            >
              {migratingReferrals ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Migrating...
                </>
              ) : (
                "Migrate Referrals"
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Urgency Standardization Tool */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Urgency Standardization
            </CardTitle>
            <CardDescription>
              Fix inconsistent urgency values
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              This tool will standardize all urgency values in referrals to use consistent 
              'high', 'medium', 'low' values, fixing case variations and synonyms.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleStandardizeUrgency} 
              disabled={standardizingUrgency}
              className="w-full"
            >
              {standardizingUrgency ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Standardizing...
                </>
              ) : (
                "Standardize Urgency"
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Status Standardization Tool */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Status Standardization
            </CardTitle>
            <CardDescription>
              Fix inconsistent referral status values
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              This tool will standardize all referral status values to use consistent 
              status names across case manager, admin, and provider views.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleStandardizeStatus} 
              disabled={standardizingStatus}
              className="w-full"
            >
              {standardizingStatus ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Standardizing...
                </>
              ) : (
                "Standardize Status"
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Test Providers Tool */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-green-500" />
              Add Test Providers
            </CardTitle>
            <CardDescription>
              Add sample providers for testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              This tool will add 3 test providers to the provider_profiles table so you can 
              test the provider assignment functionality in the admin table.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleAddTestProviders} 
              disabled={addingTestProviders}
              className="w-full"
            >
              {addingTestProviders ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Test Providers"
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Database Tool */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              Database Tools
            </CardTitle>
            <CardDescription>
              Manage database operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Access advanced database tools and operations.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Database Console
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 