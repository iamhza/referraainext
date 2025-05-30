import mongoose, { Schema } from 'mongoose';

// Define reaction sub-schema
const ReactionSchema = new Schema({
  emoji: { type: String, required: true },
  count: { type: Number, default: 1 },
  userIds: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

// Define attachment sub-schema
const AttachmentSchema = new Schema({
  type: { type: String, enum: ['image', 'document', 'link'], required: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  previewUrl: { type: String },
  size: { type: String },
  mimeType: { type: String }
});

// Main message schema
const MessageSchema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  threadId: { type: Schema.Types.ObjectId, ref: 'Message' }, // For threaded messages
  content: { type: String },
  timestamp: { type: Date, default: Date.now },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  senderAvatar: { type: String },
  senderRole: { type: String },
  status: { 
    type: String, 
    enum: ['sending', 'sent', 'delivered', 'read', 'error'],
    default: 'sent'
  },
  reactions: [ReactionSchema],
  formattedContent: { type: Boolean, default: false },
  attachments: [AttachmentSchema],
  // Track who has read this message
  readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  // For threads
  threadCount: { type: Number, default: 0 },
  hasThread: { type: Boolean, default: false },
  // For editing and deletion
  isEdited: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  editHistory: [{
    content: { type: String },
    editedAt: { type: Date }
  }]
}, { timestamps: true });

// Create indexes for better query performance
MessageSchema.index({ conversationId: 1, timestamp: 1 });
MessageSchema.index({ threadId: 1 });
MessageSchema.index({ senderId: 1 });

// Create and export the model
const MessageModel = mongoose.models.Message || 
  mongoose.model('Message', MessageSchema);

export default MessageModel; 