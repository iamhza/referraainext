import clientPromise from './mongodb';
import { AuditLog, AuditLogAction } from '@/types';
import { getRequestIp } from './server-utils'; // We will create this helper next

const COLLECTION = 'audit_logs';

interface LogEntryOptions {
  userId: string;
  userRole: 'admin' | 'case_manager' | 'provider';
  userName?: string;
  action: AuditLogAction;
  target?: {
    type: 'user' | 'provider' | 'referral' | 'client';
    id: string;
    name?: string;
  };
  details?: Record<string, any>;
}

/**
 * Records an action in the audit log.
 * @param options - The details of the action to log.
 */
export async function recordAuditLog(options: LogEntryOptions): Promise<void> {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    const now = new Date();
    
    const ipAddress = getRequestIp();

    const logEntry: Omit<AuditLog, '_id'> = {
      ...options,
      timestamp: now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      ipAddress: ipAddress || undefined,
    };

    await db.collection(COLLECTION).insertOne(logEntry);
    console.log(`[Audit Log] Recorded action: ${options.action}`);
  } catch (error) {
    console.error('Failed to record audit log:', error);
    // In production, you might want to send this to a dedicated error tracker
  }
} 