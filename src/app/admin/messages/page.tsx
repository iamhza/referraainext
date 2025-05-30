'use client';

import { MessagingLayout } from '@/components/messaging/MessagingLayout';
import { useConversations } from '@/hooks/use-conversations';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminMessagesPage() {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="h-[calc(100vh-4rem)]">
      <MessagingLayout 
        role="admin"
        userId={user.id || 'admin_user'}
        userName={user.user_metadata?.name || 'Administrator'}
        userAvatar={user.user_metadata?.avatar}
        useConversations={useConversations}
      />
    </div>
  );
} 