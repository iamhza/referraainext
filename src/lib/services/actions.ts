'use server';

import clientPromise from '../mongodb/client';
import { encryptMessage, decryptMessage, type EncryptedData } from '../shared/encryption';
import { createAuditLog } from '../audit/hipaa';
import { ObjectId } from 'mongodb';
import type { Action, ActionType, ActionStatus, ActionUrgency } from '@/types/actions';

// Fields that contain PHI and need encryption
const PHI_ACTION_FIELDS = [
  'notes',
  'description', 
  'data', // Dynamic form data - could contain anything
];

export interface SecureAction {
  _id?: ObjectId;
  clientId: string;
  
  // Context Information (non-PHI)
  contextType: 'referral' | 'connection' | 'general';
  contextId?: string;
  providerId?: string;
  serviceType?: string;
  
  // Action metadata (non-PHI)
  type: ActionType;
  title: string; // Keep unencrypted for filtering/searching
  status: ActionStatus;
  urgency: ActionUrgency;
  
  // Encrypted PHI fields
  encryptedPHI: {
    notes?: EncryptedData;
    description?: EncryptedData;
    data?: EncryptedData;
  };
  
  // Actor info (non-PHI)
  createdBy: string;
  createdByRole: string;
  createdByName: string;
  
  // Timestamps (non-PHI)
  createdAt: Date;
  updatedAt: Date;
  targetDate?: Date;
  scheduledDate?: Date;
  completedAt?: Date;
  
  // Attachments (handled separately - encrypted file storage)
  attachmentIds?: string[]; // References to secure file storage
  
  // ROI gating (non-PHI)
  requiresROI?: boolean;
  roiApproved?: boolean;
  
  // Routing Information (non-PHI)
  routing?: {
    primaryRecipient: 'case_manager' | 'provider' | 'both';
    recipientIds: string[];
  };
  
  // HIPAA compliance metadata
  retentionDate: Date; // 7 years for HIPAA compliance
  accessLog: Array<{
    userId: string;
    accessedAt: Date;
    ipAddress?: string;
    action: 'created' | 'viewed' | 'updated' | 'completed';
  }>;
}

/**
 * Create a secure, HIPAA-compliant action
 */
export async function createSecureAction(actionData: {
  clientId: string;
  contextType: 'referral' | 'connection' | 'general';
  contextId?: string;
  providerId?: string;
  serviceType?: string;
  type: ActionType;
  title: string;
  description?: string;
  notes?: string;
  urgency: ActionUrgency;
  targetDate?: string;
  scheduledDate?: string;
  data?: Record<string, any>;
  requiresROI?: boolean;
  authorId: string;
  authorName: string;
  authorRole: string;
}) {
  const client = await clientPromise;
  const db = client.db('referradb');
  
  // Calculate retention date (7 years for HIPAA compliance)
  const retentionDate = new Date();
  retentionDate.setFullYear(retentionDate.getFullYear() + 7);
  
  // Encrypt PHI fields
  const encryptedPHI: { [key: string]: EncryptedData } = {};
  
  if (actionData.notes && actionData.notes.trim()) {
    encryptedPHI.notes = encryptMessage(actionData.notes);
  }
  
  if (actionData.description && actionData.description.trim()) {
    encryptedPHI.description = encryptMessage(actionData.description);
  }
  
  if (actionData.data && Object.keys(actionData.data).length > 0) {
    // Encrypt the entire data object as JSON
    encryptedPHI.data = encryptMessage(JSON.stringify(actionData.data));
  }
  
  const secureAction: Omit<SecureAction, '_id'> = {
    clientId: actionData.clientId,
    contextType: actionData.contextType,
    contextId: actionData.contextId,
    providerId: actionData.providerId,
    serviceType: actionData.serviceType,
    type: actionData.type,
    title: actionData.title,
    status: 'pending',
    urgency: actionData.urgency,
    encryptedPHI,
    createdBy: actionData.authorId,
    createdByRole: actionData.authorRole,
    createdByName: actionData.authorName,
    createdAt: new Date(),
    updatedAt: new Date(),
    targetDate: actionData.targetDate ? new Date(actionData.targetDate) : undefined,
    scheduledDate: actionData.scheduledDate ? new Date(actionData.scheduledDate) : undefined,
    requiresROI: actionData.requiresROI,
    roiApproved: false,
    routing: {
      primaryRecipient: actionData.providerId ? 'provider' : 'case_manager',
      recipientIds: actionData.providerId ? [actionData.providerId, actionData.authorId] : [actionData.authorId]
    },
    retentionDate,
    accessLog: [{
      userId: actionData.authorId,
      accessedAt: new Date(),
      action: 'created'
    }]
  };
  
  const result = await db.collection('secure_actions').insertOne(secureAction);
  
  // Audit log the action creation
  await createAuditLog({
    userId: actionData.authorId,
    userRole: actionData.authorRole,
    action: 'secure_action_created',
    resourceType: 'action',
    resourceId: result.insertedId.toString(),
    success: true,
    details: {
      actionType: actionData.type,
      clientId: actionData.clientId,
      contextType: actionData.contextType,
      contextId: actionData.contextId,
      hasPHI: Object.keys(encryptedPHI).length > 0
    }
  });
  
  return {
    success: true,
    actionId: result.insertedId,
    message: 'Secure action created successfully'
  };
}

/**
 * Get decrypted actions for a client
 */
export async function getSecureActionsForClient(clientId: string, userId: string, userRole: string) {
  const client = await clientPromise;
  const db = client.db('referradb');
  
  // Get encrypted actions
  const encryptedActions = await db.collection('secure_actions')
    .find({ clientId })
    .sort({ createdAt: -1 })
    .toArray();
  
  // Decrypt actions and track access
  const decryptedActions = await Promise.all(
    encryptedActions.map(async (action) => {
      try {
        // Log access
        await logActionAccess(action._id.toString(), userId, userRole, 'viewed');
        
        // Decrypt PHI fields
        const decryptedAction: any = {
          ...action,
          _id: action._id.toString()
        };
        
        // Decrypt each PHI field
        if (action.encryptedPHI) {
          if (action.encryptedPHI.notes) {
            decryptedAction.notes = decryptMessage(action.encryptedPHI.notes);
          }
          if (action.encryptedPHI.description) {
            decryptedAction.description = decryptMessage(action.encryptedPHI.description);
          }
          if (action.encryptedPHI.data) {
            try {
              decryptedAction.data = JSON.parse(decryptMessage(action.encryptedPHI.data));
            } catch {
              decryptedAction.data = {};
            }
          }
        }
        
        // Remove encrypted PHI from response
        delete decryptedAction.encryptedPHI;
        
        return decryptedAction;
      } catch (error) {
        console.error(`Failed to decrypt action ${action._id}:`, error);
        return {
          ...action,
          _id: action._id.toString(),
          notes: '[Encrypted data unreadable]',
          description: '[Encrypted data unreadable]',
          data: {}
        };
      }
    })
  );
  
  return decryptedActions;
}

/**
 * Update action status securely
 */
export async function updateSecureActionStatus(
  actionId: string, 
  status: ActionStatus, 
  userId: string, 
  userRole: string,
  completionNotes?: string
) {
  const client = await clientPromise;
  const db = client.db('referradb');
  
  const updateData: any = {
    status,
    updatedAt: new Date(),
    $push: {
      accessLog: {
        userId,
        accessedAt: new Date(),
        action: status === 'completed' ? 'completed' : 'updated'
      }
    }
  };
  
  if (status === 'completed') {
    updateData.completedAt = new Date();
    
    // If completion notes provided, encrypt them
    if (completionNotes && completionNotes.trim()) {
      updateData['encryptedPHI.completionNotes'] = encryptMessage(completionNotes);
    }
  }
  
  const result = await db.collection('secure_actions').updateOne(
    { _id: new ObjectId(actionId) },
    updateData
  );
  
  // Audit log the update
  await createAuditLog({
    userId,
    userRole,
    action: 'secure_action_updated',
    resourceType: 'action',
    resourceId: actionId,
    success: result.matchedCount > 0,
    details: {
      newStatus: status,
      hasCompletionNotes: !!completionNotes
    }
  });
  
  return result.matchedCount > 0;
}

/**
 * Log action access for HIPAA compliance
 */
async function logActionAccess(actionId: string, userId: string, userRole: string, action: 'viewed' | 'updated' | 'completed') {
  const client = await clientPromise;
  const db = client.db('referradb');
  
  // Add to action's access log
  await db.collection('secure_actions').updateOne(
    { _id: new ObjectId(actionId) },
    {
      $push: {
        accessLog: {
          userId,
          accessedAt: new Date(),
          action
        }
      }
    }
  );
  
  // Create audit log entry
  await createAuditLog({
    userId,
    userRole,
    action: `secure_action_${action}`,
    resourceType: 'action',
    resourceId: actionId,
    success: true,
    details: { accessType: action }
  });
}

/**
 * HIPAA compliance: Delete actions past retention date
 */
export async function cleanupExpiredActions() {
  const client = await clientPromise;
  const db = client.db('referradb');
  
  const result = await db.collection('secure_actions').deleteMany({
    retentionDate: { $lt: new Date() }
  });
  
  console.log(`[HIPAA CLEANUP] Deleted ${result.deletedCount} expired actions`);
  return result;
}

/**
 * Migration helper: Move existing actions to secure storage
 */
export async function migrateActionsToSecure() {
  const client = await clientPromise;
  const db = client.db('referradb');
  
  console.log('🔐 Starting migration of actions to secure storage...');
  
  const existingActions = await db.collection('actions').find({}).toArray();
  console.log(`📊 Found ${existingActions.length} actions to migrate`);
  
  let migratedCount = 0;
  let errorCount = 0;
  
  for (const action of existingActions) {
    try {
      // Create secure action
      await createSecureAction({
        clientId: action.clientId,
        contextType: action.contextType || 'general',
        contextId: action.contextId,
        providerId: action.providerId,
        serviceType: action.serviceType,
        type: action.type,
        title: action.title,
        description: action.description,
        notes: action.notes,
        urgency: action.urgency || 'normal',
        targetDate: action.targetDate,
        scheduledDate: action.scheduledDate,
        data: action.data,
        requiresROI: action.requiresROI,
        authorId: action.createdBy,
        authorName: action.createdByName,
        authorRole: action.createdByRole
      });
      
      migratedCount++;
      console.log(`  ✅ Migrated action: ${action.title}`);
      
    } catch (error) {
      console.error(`  ❌ Failed to migrate action ${action._id}:`, error);
      errorCount++;
    }
  }
  
  console.log(`\n🎉 Migration Summary:`);
  console.log(`  ✅ Successfully migrated: ${migratedCount} actions`);
  console.log(`  ❌ Failed migrations: ${errorCount} actions`);
  
  // Create indexes for performance
  await db.collection('secure_actions').createIndex({ clientId: 1 });
  await db.collection('secure_actions').createIndex({ contextType: 1, contextId: 1 });
  await db.collection('secure_actions').createIndex({ retentionDate: 1 });
  await db.collection('secure_actions').createIndex({ 'accessLog.userId': 1 });
  
  console.log(`\n📈 Created indexes for secure_actions collection`);
  
  return { migratedCount, errorCount };
}




