# Referra Messaging System

This document provides detailed information about the messaging system in Referra, which allows case managers, providers, and administrators to communicate with each other.

## Features

- **Real-time Messaging**: Send and receive messages between users
- **Message Threading**: Create threaded conversations for specific topics
- **Reactions**: React to messages with emojis
- **Rich Text**: Format text with bold, italic, and code formatting
- **Attachments**: Share files and images in conversations
- **User Status**: Show online/offline status
- **Conversation Management**: Pin, mute, or leave conversations

## Architecture

The messaging system uses MongoDB for data storage and Supabase for authentication. Here's the high-level architecture:

- **Database Collections**:
  - `conversations`: Stores conversation metadata and participant information
  - `messages`: Stores the actual messages, including threads

- **API Endpoints**:
  - `/api/conversations`: CRUD operations for conversations
  - `/api/messages`: CRUD operations for messages
  - `/api/messages/reactions`: Add/remove reactions to messages

## Setup & Initialization

### Automatic Database Initialization

The collections are automatically initialized when the app starts up via the `InitDatabase` component in `app/init-db.tsx`.

### Generating Sample Data

To populate the database with sample conversations and messages, an admin can access:

```
GET /api/admin/init-conversations
```

This endpoint requires admin privileges and will create:
1. A direct message conversation between the first two users
2. A group conversation with the first three users (if available)

## Usage Guide

### Using the Messaging Components

The messaging system consists of three main components:

1. **MessagingLayout**: The overall layout container that manages conversation selection and display.
2. **ConversationList**: The sidebar that displays conversations and allows selection.
3. **MessageThread**: Displays messages for the selected conversation.

Example usage:

```tsx
import { MessagingLayout } from '@/components/messaging/MessagingLayout';
import { useConversations } from '@/hooks/use-conversations';

export default function MessagesPage() {
  const {
    conversations,
    selectedConversationId,
    setSelectedConversationId,
    getConversationById,
    sendMessage,
    markAsRead,
    toggleReaction,
    createNewConversation,
  } = useConversations();
  
  return (
    <MessagingLayout
      conversations={conversations}
      selectedConversationId={selectedConversationId}
      onSelectConversation={(id) => {
        setSelectedConversationId(id);
        markAsRead(id);
      }}
      onCreateNewConversation={createNewConversation}
      onSendMessage={sendMessage}
      onToggleReaction={toggleReaction}
      currentUserId="current_user_id"
      currentUserRole="case_manager"
    />
  );
}
```

### Hooks

The primary hook for working with the messaging system is `useConversations`, which provides:

- `conversations`: List of conversations for the current user
- `selectedConversationId`: Currently selected conversation
- `setSelectedConversationId`: Function to change the selected conversation
- `getConversationById`: Function to get a conversation by ID
- `sendMessage`: Function to send a message
- `markAsRead`: Function to mark a conversation as read
- `toggleReaction`: Function to add/remove a reaction
- `createNewConversation`: Function to create a new conversation
- `getMessages`: Function to fetch messages for a conversation

## Extending the System

### Adding File Uploads

The system is designed to support file uploads, but actual file upload functionality needs to be implemented. To add file uploads:

1. Modify the `sendMessage` function in `use-conversations.ts` to handle file uploads
2. Update the `processAttachments` function in `src/app/api/messages/route.ts` to store files in your preferred storage service

### Real-time Updates

To add real-time updates:

1. Implement a WebSocket or Server-Sent Events solution
2. Update the messaging components to subscribe to updates
3. Add real-time status updates for user presence

## Data Models

### Conversation Schema

```typescript
type Conversation = {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: {
    content: string;
    timestamp: string;
    senderId: string;
  };
  unreadCount: number;
  type: 'direct' | 'group';
  participants: Participant[];
  lastActivity: string;
  isPinned?: boolean;
  isMuted?: boolean;
  description?: string;
  createdAt?: string;
  messages?: Message[];
};
```

### Message Schema

```typescript
type Message = {
  id: string;
  content: string;
  timestamp: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  reactions?: Reaction[];
  formattedContent?: boolean;
  attachments?: Attachment[];
  hasThread?: boolean;
  threadCount?: number;
  isOwn?: boolean;
};
```

## Troubleshooting

**Messages Not Loading**
- Check MongoDB connection
- Verify user has permission to view the conversation
- Check network requests for API errors

**New Messages Not Showing**
- Check if the conversation refresh is working
- Verify the message was successfully saved to the database

## Future Improvements

- **Read Receipts**: Show when messages are read by other participants
- **Message Editing**: Allow users to edit their messages
- **Message Deletion**: Allow users to delete messages
- **Typing Indicators**: Show when users are typing
- **Message Search**: Allow searching for messages within conversations
- **Conversation Archiving**: Allow archiving old conversations 