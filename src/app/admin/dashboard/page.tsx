"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Users, FileText, ArrowRight, Database, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [migrationResults, setMigrationResults] = useState<any>(null);

  const handleMigrateClients = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      const response = await fetch('/api/admin/migrate-clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to migrate clients');
      }
      
      const data = await response.json();
      setMigrationResults(data.results);
      
      toast({
        title: 'Migration Complete',
        description: `Created ${data.results.created} clients from ${data.results.processed} referrals`,
      });
    } catch (error: any) {
      console.error('Migration error:', error);
      toast({
        title: 'Migration Failed',
        description: error.message || 'An error occurred during migration',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>Manage platform users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <span className="text-2xl font-bold">12</span>
                  </div>
                  <Button variant="outline" size="sm">View All</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Referrals</CardTitle>
                <CardDescription>Active referrals in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <span className="text-2xl font-bold">25</span>
                  </div>
                  <Button variant="outline" size="sm">View All</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="data" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Migration Tools</CardTitle>
              <CardDescription>Tools to manage and migrate data in the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-medium mb-2">Referral Client Migration</h3>
                <p className="text-gray-500 mb-4">
                  This tool will scan all referrals in the database and create client records for any clients
                  that don&apos;t already exist in the clients collection.
                </p>
                
                <Button 
                  onClick={handleMigrateClients} 
                  disabled={isProcessing}
                  className="mb-4"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Migrate Clients from Referrals
                    </>
                  )}
                </Button>
                
                {migrationResults && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle>Migration Results</AlertTitle>
                    <AlertDescription>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>Total referrals: {migrationResults.total}</li>
                        <li>Processed: {migrationResults.processed}</li>
                        <li>New clients created: {migrationResults.created}</li>
                        <li>Skipped (already exist): {migrationResults.skipped}</li>
                        <li>Errors: {migrationResults.errors}</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <p>User management content here</p>
        </TabsContent>
        
        <TabsContent value="settings">
          <p>Settings content here</p>
        </TabsContent>
      </Tabs>
    </div>
  );
} 