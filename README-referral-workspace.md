# Referra Collaborative Workspace Documentation

## Overview
The Referra Collaborative Workspace is a real-time collaboration tool built for case managers, providers, and admins to work together on client referrals. It provides a unified interface for managing referral activities, tracking progress, and facilitating communication between all stakeholders.

## Key Features

### Activity Timeline
- **Real-time Updates**: See all activities and updates on a referral in chronological order
- **User Attribution**: All actions are attributed to the specific user who performed them
- **Comment Threading**: Reply to specific comments to create threaded conversations
- **File Attachments**: Attach files to comments and activities for documentation
- **Emoji Reactions**: React to comments with emoji reactions (👍, ❤️, 😂, etc.)
- **@Mentions**: Mention other users in comments to notify them
- **Activity Tagging**: Tag activities for better organization and filtering

### Participant Management
- **Participant List**: See who is involved in the referral
- **Online Status**: See who is currently viewing the referral
- **Assignment**: Assign tasks and responsibilities to specific users
- **View Tracking**: See who has viewed the referral and when

### Task Management
- **Task Creation**: Create tasks for case managers or providers
- **Task Assignment**: Assign tasks to specific users
- **Due Dates**: Set deadlines for task completion
- **Status Tracking**: Track task progress (not started, in progress, completed)

### Document Management
- **File Upload**: Upload relevant documents to the referral
- **Version Control**: Track document versions and changes
- **Shared Access**: All participants can access uploaded documents

### Notifications
- **Subscription Controls**: Subscribe or unsubscribe to referral updates
- **Email Notifications**: Receive email notifications for important updates
- **In-app Notifications**: Get real-time notifications within the application

## Technical Implementation

### Components
- `EnhancedCollaborativeWorkspace.tsx`: Main container component
- `EnhancedActivityTimeline.tsx`: Activity feed and commenting system
- `use-referral-timeline.ts`: Hook for managing timeline data

### APIs
The workspace uses the following API endpoints:

- `/api/referrals/:id/timeline` - Get all timeline events
- `/api/referrals/:id/comments` - Create/get comments
- `/api/referrals/:id/reactions` - Add emoji reactions
- `/api/referrals/:id/tags` - Add tags to events
- `/api/referrals/:id/attachments` - Upload file attachments
- `/api/referrals/:id/participants` - Get participant list
- `/api/referrals/:id/views` - Record and retrieve view events
- `/api/referrals/:id/subscribe` - Subscribe/unsubscribe to notifications
- `/api/referrals/:id/assign` - Assign users to the referral

### Data Models

#### Timeline Event
```typescript
interface TimelineEvent {
  id: string;
  type: string;  // referral_created, status_changed, comment_added, etc.
  title: string;
  description?: string;
  timestamp: string;
  actor?: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  metadata?: Record<string, any>;
  comments?: Comment[];
  tags?: string[];
  attachments?: Attachment[];
}
```

#### Comment
```typescript
interface Comment {
  id: string;
  content: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  timestamp: string;
  reactions?: Reaction[];
  replies?: Comment[];
  mentions?: string[];
  attachments?: Attachment[];
}
```

## Usage
To incorporate the collaborative workspace into a referral page:

```tsx
import { EnhancedCollaborativeWorkspace } from '@/components/referrals/EnhancedCollaborativeWorkspace';
import { useReferralTimeline } from '@/hooks/use-referral-timeline';
import (Use

// In your component:
const {
  events,
  participants,
  recentlyViewed,
  loading,
  error,
  isSubscribed,
  addComment,
  addReaction,
  addTag,
  addAttachment,
  toggleSubscription
} = useReferralTimeline(referralId);

// Then use the component:
<EnhancedCollaborativeWorkspace
  referralId={referralId}
  referral={referral}
  userRole="case_manager"
  currentUser={currentUser}
  onStatusUpdate={handleStatusUpdate}
  onNewTask={handleNewTask}
  onTaskComplete={handleTaskComplete}
  onNewComment={addComment}
  onAddReaction={addReaction}
  onAddAttachment={addAttachment}
  onTagEvent={addTag}
  onViewEvent={handleViewEvent}
  onAssignUser={handleAssignUser}
/>
```

## Future Enhancements
- Real-time updates using WebSockets
- Collaborative document editing
- Video conferencing integration
- Advanced filtering and searching of timeline events
- Analytics for referral collaboration 