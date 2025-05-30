'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function ToastTestPage() {
  const { toast } = useToast();
  
  const showDefaultToast = () => {
    toast({
      title: 'Default Toast',
      description: 'This is a default toast message',
    });
  };
  
  const showSuccessToast = () => {
    toast({
      title: 'Success!',
      description: 'Operation completed successfully',
      variant: 'success',
    });
  };
  
  const showErrorToast = () => {
    toast({
      title: 'Error',
      description: 'Something went wrong',
      variant: 'destructive',
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Toast Tester</h2>
        <p className="text-sm text-gray-500 mb-6">
          Click the buttons below to test toast notifications.
          Currently, they will only show in the console, but can be enhanced with a proper toast UI component.
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={showDefaultToast} className="w-full">Show Default Toast</Button>
          <Button onClick={showSuccessToast} className="w-full bg-green-600 hover:bg-green-700">Show Success Toast</Button>
          <Button onClick={showErrorToast} variant="destructive" className="w-full">Show Error Toast</Button>
        </div>
      </div>
    </div>
  );
} 