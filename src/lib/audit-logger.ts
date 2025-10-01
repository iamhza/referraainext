import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';

export interface AuditLogEntry {
  action: string;
  entityType: string;
  entityId: string;
  userId: string | null;
  userRole: string | null;
  details: Record<string, any>;
  timestamp: Date;
  complianceLevel: 'HIPAA' | 'GENERAL';
}

/**
 * Create HIPAA-compliant audit log entry
 * All document access, modifications, and security events are logged for compliance
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const mongoClient = await clientPromise;
    const db = mongoClient.db('referradb');
    
    const auditEntry = {
      ...entry,
      _id: new ObjectId(),
      createdAt: new Date(),
      // Add additional metadata for HIPAA compliance
      sessionId: entry.details?.sessionId || null,
      ipAddress: entry.details?.ip || null,
      userAgent: entry.details?.userAgent || null,
      // Ensure sensitive data is properly handled
      isHIPAAEvent: entry.complianceLevel === 'HIPAA',
      retentionDate: new Date(Date.now() + (7 * 365 * 24 * 60 * 60 * 1000)) // 7 years retention for HIPAA
    };

    await db.collection('audit_logs').insertOne(auditEntry);
    
    // For critical HIPAA events, also log to console for immediate monitoring
    if (entry.complianceLevel === 'HIPAA' && 
        (entry.action.includes('DENIED') || entry.action.includes('VIOLATION'))) {
      console.warn(`HIPAA Security Event: ${entry.action}`, {
        entityId: entry.entityId,
        userId: entry.userId,
        timestamp: entry.timestamp,
        details: entry.details
      });
    }
    
  } catch (error) {
    // Critical: Audit logging failure should be logged but not break the main operation
    console.error('Failed to create audit log entry:', error, entry);
    
    // In production, you might want to send this to a separate monitoring system
    // or write to a backup audit log location
  }
}

/**
 * Query audit logs for compliance reporting
 */
export async function getAuditLogs(filters: {
  entityId?: string;
  userId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  complianceLevel?: 'HIPAA' | 'GENERAL';
  limit?: number;
}): Promise<AuditLogEntry[]> {
  try {
    const mongoClient = await clientPromise;
    const db = mongoClient.db('referradb');
    
    const query: any = {};
    
    if (filters.entityId) query.entityId = filters.entityId;
    if (filters.userId) query.userId = filters.userId;
    if (filters.action) query.action = { $regex: filters.action, $options: 'i' };
    if (filters.complianceLevel) query.complianceLevel = filters.complianceLevel;
    
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = filters.startDate;
      if (filters.endDate) query.timestamp.$lte = filters.endDate;
    }
    
    const logs = await db.collection('audit_logs')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(filters.limit || 100)
      .toArray();
    
    return logs.map(log => ({
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      userId: log.userId,
      userRole: log.userRole,
      details: log.details,
      timestamp: log.timestamp,
      complianceLevel: log.complianceLevel
    }));
    
  } catch (error) {
    console.error('Failed to retrieve audit logs:', error);
    return [];
  }
}

/**
 * Specialized audit functions for common HIPAA events
 */

export async function auditDocumentAccess(
  documentId: string,
  clientId: string,
  userId: string,
  userRole: string,
  ip?: string,
  userAgent?: string
): Promise<void> {
  await createAuditLog({
    action: 'DOCUMENT_ACCESSED',
    entityType: 'CLIENT_DOCUMENT',
    entityId: documentId,
    userId,
    userRole,
    details: {
      clientId,
      ip,
      userAgent,
      accessType: 'VIEW'
    },
    timestamp: new Date(),
    complianceLevel: 'HIPAA'
  });
}

export async function auditDocumentUpload(
  documentId: string,
  clientId: string,
  userId: string,
  userRole: string,
  fileName: string,
  fileSize: number,
  ip?: string
): Promise<void> {
  await createAuditLog({
    action: 'DOCUMENT_UPLOADED',
    entityType: 'CLIENT_DOCUMENT',
    entityId: documentId,
    userId,
    userRole,
    details: {
      clientId,
      fileName,
      fileSize,
      ip,
      isEncrypted: true
    },
    timestamp: new Date(),
    complianceLevel: 'HIPAA'
  });
}

export async function auditUnauthorizedAccess(
  entityType: string,
  entityId: string,
  userId: string | null,
  reason: string,
  ip?: string
): Promise<void> {
  await createAuditLog({
    action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
    entityType,
    entityId,
    userId,
    userRole: null,
    details: {
      reason,
      ip,
      severity: 'HIGH'
    },
    timestamp: new Date(),
    complianceLevel: 'HIPAA'
  });
}
