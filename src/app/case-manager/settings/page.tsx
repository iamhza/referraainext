'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Container } from '@/components/ui/container';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Save } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.user_metadata?.name || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Name cannot be empty",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile({ name: name.trim() });
      toast({
        title: "Success",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      <PageHeader 
        title="Settings"
        description="Manage your account settings and profile information">
      </PageHeader>
      
      <div className="mt-8 space-y-8">
        
        {/* Profile Settings Card */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
              <User className="mr-2 h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full max-w-md"
                />
                <p className="text-xs text-gray-500">
                  This name will be displayed in your dashboard and profile.
                </p>
              </div>

              {/* Email Field (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full max-w-md bg-gray-50 text-gray-500"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Email address cannot be changed.
                </p>
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={isLoading || !name.trim() || name === user?.user_metadata?.name}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Account Information Card */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-700">Account Type</span>
                <span className="text-sm text-gray-900 bg-blue-100 px-2 py-1 rounded">
                  Case Manager
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-700">User ID</span>
                <span className="text-sm text-gray-500 font-mono">
                  {user?.id?.slice(0, 8)}...
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
} 