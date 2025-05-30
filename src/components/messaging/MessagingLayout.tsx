'use client';

import { useState, useEffect } from 'react';
import { ConversationList } from './ConversationList';
import { MessageThread } from './MessageThread';
import { ConversationInfo } from './ConversationInfo';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import { Menu, X, Users, Info, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

// Define interface for messaging layout props
interface MessagingLayoutProps {
  role: 'case_manager' | 'provider' | 'admin';
  userId: string;
  userName: string;
  userAvatar?: string;
  useConversations: () => any; // Hook for conversations
  // Any other props needed
}

export function MessagingLayout({
  role,
  userId,
  userName,
  userAvatar,
  useConversations
}: MessagingLayoutProps) {
  // Get the conversations and methods from the hook
  const {
    conversations,
    selectedConversationId,
    setSelectedConversationId,
    getConversationById,
    sendMessage,
    markAsRead,
    createNewConversation,
    toggleReaction
  } = useConversations();
  
  // Mobile responsiveness
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  
  // UI state for mobile/tablet views
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [showInfo, setShowInfo] = useState(!isMobile && !isTablet);
  
  // Get the router
  const router = useRouter();
  
  // Toast for notifications
  const { toast } = useToast();
  
  // Selected conversation
  const selectedConversation = selectedConversationId 
    ? getConversationById(selectedConversationId)
    : null;
  
  // Handle window resize to adjust UI
  useEffect(() => {
    setShowSidebar(!isMobile);
    setShowInfo(!isMobile && !isTablet);
  }, [isMobile, isTablet]);
  
  // Handle sending messages
  const handleSendMessage = async (content: string, attachments?: File[], threadId?: string) => {
    if (!selectedConversationId) return;
    
    try {
      await sendMessage(selectedConversationId, content, attachments, threadId);
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Your message could not be sent. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle conversation selection
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    markAsRead(conversationId);
    
    // On mobile, hide the sidebar when a conversation is selected
    if (isMobile) {
      setShowSidebar(false);
    }
  };
  
  // Handle creating new conversation
  const handleCreateNewConversation = () => {
    // If we have a custom implementation, use it
    if (createNewConversation) {
      createNewConversation();
      return;
    }
    
    // Otherwise, show a toast that this feature is coming soon
    toast({
      title: "Coming Soon",
      description: "Creating new conversations will be available soon.",
    });
  };
  
  // Handle reaction toggle
  const handleToggleReaction = (messageId: string, emoji: string) => {
    if (toggleReaction && selectedConversationId) {
      toggleReaction(selectedConversationId, messageId, emoji);
    }
  };
  
  return (
    <div className="flex h-full bg-gray-100">
      {/* Mobile sidebar toggle */}
      {isMobile && !showSidebar && selectedConversation && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSidebar(true)}
          className="fixed top-4 left-4 z-50 bg-white shadow-md rounded-full h-10 w-10"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
      
      {/* Conversation sidebar */}
      <div
        className={cn(
          "h-full flex-shrink-0 border-r border-gray-200 transition-all duration-300",
          showSidebar 
            ? "flex flex-col w-full md:w-72 lg:w-80" 
            : "hidden md:flex md:flex-col md:w-72 lg:w-80",
          isMobile && showSidebar && "fixed inset-0 z-50 bg-white w-full"
        )}
      >
        {/* Close button for mobile */}
        {isMobile && showSidebar && (
          <div className="absolute top-3 right-3 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSidebar(false)}
              className="h-8 w-8 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        )}
        
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          currentUserId={userId}
          onSelectConversation={handleSelectConversation}
          onCreateNewConversation={handleCreateNewConversation}
        />
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Empty state when no conversation is selected */}
        {!selectedConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-blue-100 text-blue-600 rounded-full p-6 mb-4">
              <Users className="h-12 w-12" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your Messages</h2>
            <p className="text-gray-600 max-w-md mb-6">
              Select a conversation from the sidebar or start a new one to begin messaging.
            </p>
            <Button onClick={handleCreateNewConversation}>
              Start a New Conversation
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex h-full">
            {/* Message thread */}
            <div className="flex-1 flex flex-col h-full relative">
              {isMobile && (
                <div className="absolute top-3 left-3 z-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSidebar(true)}
                    className="h-8 w-8 rounded-full bg-white shadow-sm"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </div>
              )}
              
              <MessageThread
                messages={selectedConversation.messages || []}
                currentUserId={userId}
                currentUserRole={role}
                conversationName={selectedConversation.name}
                conversationAvatar={selectedConversation.avatar}
                onSendMessage={handleSendMessage}
                onToggleReaction={handleToggleReaction}
              />
            </div>
            
            {/* Info panel for conversation details */}
            {selectedConversation && (
              <>
                {/* Toggle button for tablet view */}
                {!isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowInfo(!showInfo)}
                    className={cn(
                      "fixed right-4 top-4 z-10 bg-white shadow-sm rounded-full h-9 w-9",
                      showInfo && "bg-gray-100"
                    )}
                  >
                    <Info className="h-5 w-5" />
                  </Button>
                )}
                
                <div
                  className={cn(
                    "border-l border-gray-200 bg-white h-full transition-all duration-300",
                    showInfo
                      ? "w-full md:w-72 lg:w-80 flex flex-col"
                      : "w-0 hidden"
                  )}
                >
                  {/* Mobile close button */}
                  {isMobile && showInfo && (
                    <div className="absolute top-3 right-3 z-10">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowInfo(false)}
                        className="h-8 w-8 rounded-full"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  )}
                  
                  <ConversationInfo
                    conversation={selectedConversation}
                    currentUserId={userId}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 