'use server';

import clientPromise from '../mongodb/client';
import { headers } from 'next/headers';

export interface AuditLogEntry {
  userId: string;
  userRole: string;
  action: 'message_read' | 'message_sent' | 'client_accessed' | 'phi_viewed' | 'conversation_opened' | 'pmi_search' | 'pmi_search_error' | 'serviceconnection_initiated' | 'client_created' | 'client_updated' | 'clients_listed' | 'bulk_client_access' | 'client_deleted' | 'login_success' | 'login_failed' | 'login_error' | 'logout' | 'unauthorized_access_attempt' | 'cross_org_access_attempt' | 'permission_denied' | 'api_error';
  resourceType: 'message' | 'client' | 'conversation' | 'phi_record' | 'client_search' | 'pending_connection' | 'client_list' | 'auth' | 'api' | 'organization' | 'permission';
  resourceId: string;
  clientId?: string; // For tracking which client's PHI was accessed
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  details?: any;
}

export async function createAuditLog(entry: Omit<AuditLogEntry, 'timestamp' | 'ipAddress' | 'userAgent'>) {
  try {
    const headersList = headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';
    
    const client = await clientPromise;
    const db = client.db('referradb');
    
    const auditEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date(),
      ipAddress,
      userAgent
    };
    
    await db.collection('hipaa_audit_logs').insertOne(auditEntry);
    
    // Also log to console for immediate monitoring
    console.log(`[HIPAA AUDIT] ${entry.action} by ${entry.userId} on ${entry.resourceType}:${entry.resourceId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // CRITICAL: Don't fail the main operation if audit logging fails
    // But we should alert/monitor this
    return { success: false, error };
  }
}

// Convenience functions for common audit actions
export async function auditMessageRead(userId: string, userRole: string, messageId: string, clientId: string) {
  return createAuditLog({
    userId,
    userRole,
    action: 'message_read',
    resourceType: 'message',
    resourceId: messageId,
    clientId,
    success: true
  });
}

export async function auditMessageSent(userId: string, userRole: string, messageId: string, clientId: string) {
  return createAuditLog({
    userId,
    userRole,
    action: 'message_sent',
    resourceType: 'message',
    resourceId: messageId,
    clientId,
    success: true
  });
}

export async function auditConversationAccess(userId: string, userRole: string, conversationId: string, clientId: string) {
  return createAuditLog({
    userId,
    userRole,
    action: 'conversation_opened',
    resourceType: 'conversation',
    resourceId: conversationId,
    clientId,
    success: true
  });
}

// Query audit logs for compliance reporting
export async function getAuditLogs(filters: {
  userId?: string;
  clientId?: string;
  startDate?: Date;
  endDate?: Date;
  action?: string;
  limit?: number;
}) {
  const client = await clientPromise;
  const db = client.db('referradb');
  
  const query: any = {};
  
  if (filters.userId) query.userId = filters.userId;
  if (filters.clientId) query.clientId = filters.clientId;
  if (filters.action) query.action = filters.action;
  if (filters.startDate || filters.endDate) {
    query.timestamp = {};
    if (filters.startDate) query.timestamp.$gte = filters.startDate;
    if (filters.endDate) query.timestamp.$lte = filters.endDate;
  }
  
  return db.collection('hipaa_audit_logs')
    .find(query)
    .sort({ timestamp: -1 })
    .limit(filters.limit || 100)
    .toArray();
}
