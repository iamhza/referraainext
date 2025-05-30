import mongoose, { Schema } from 'mongoose';

// Define participant sub-schema
const ParticipantSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  avatar: { type: String },
  status: { type: String, enum: ['online', 'offline', 'away', 'busy'], default: 'offline' },
  role: { type: String },
  lastActive: { type: Date },
  title: { type: String },
  hasRead: { type: Boolean, default: false }
});

// Define last message sub-schema
const LastMessageSchema = new Schema({
  content: { type: String },
  timestamp: { type: Date, default: Date.now },
  senderId: { type: Schema.Types.ObjectId, ref: 'User' }
});

// Main conversation schema
const ConversationSchema = new Schema({
  name: { type: String, required: true },
  avatar: { type: String },
  type: { type: String, enum: ['direct', 'group'], required: true },
  participants: [ParticipantSchema],
  lastMessage: { type: LastMessageSchema },
  lastActivity: { type: Date, default: Date.now },
  isPinned: { type: Boolean, default: false },
  isMuted: { type: Boolean, default: false },
  description: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Create indexes for better query performance
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ type: 1 });
ConversationSchema.index({ lastActivity: -1 });

// Helper method to get unread count for a user
ConversationSchema.methods.getUnreadCountForUser = function(userId) {
  const participant = this.participants.find(p => 
    p.userId.toString() === userId.toString()
  );
  return participant && !participant.hasRead ? 1 : 0;
};

// Create and export the model
const ConversationModel = mongoose.models.Conversation || 
  mongoose.model('Conversation', ConversationSchema);

export default ConversationModel; 