import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId, GridFSBucket } from 'mongodb';
import crypto from 'crypto';
import { createAuditLog } from '@/lib/audit-logger';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';

/**
 * Secure Document Access Endpoint
 * HIPAA Compliant document serving with encryption, access control, and audit logging
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      await createAuditLog({
        action: 'DOCUMENT_ACCESS_DENIED',
        entityType: 'DOCUMENT',
        entityId: 'unknown',
        userId: null,
        userRole: null,
        details: { reason: 'No authentication', token: params.token, ip: request.ip || 'unknown' },
        timestamp: new Date(),
        complianceLevel: 'HIPAA'
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify and decode access token
    const tokenData = verifyAccessToken(params.token);
    if (!tokenData) {
      await createAuditLog({
        action: 'DOCUMENT_ACCESS_DENIED',
        entityType: 'DOCUMENT',
        entityId: 'unknown',
        userId: user.id,
        userRole: user.role,
        details: { reason: 'Invalid token', token: params.token, ip: request.ip || 'unknown' },
        timestamp: new Date(),
        complianceLevel: 'HIPAA'
      });
      return NextResponse.json({ error: 'Invalid or expired access token' }, { status: 403 });
    }

    // Verify user matches token
    if (tokenData.userId !== user.id) {
      
      // Instead of immediately denying, check if the current user has access to the client
      const mongoClient = await clientPromise;
      const db = mongoClient.db('referradb');
      
      const document = await db.collection('client_documents').findOne({
        _id: new ObjectId(tokenData.documentId)
      });
      
      if (document) {
        const hasAccess = await verifyClientAccess(user, document.clientId.toString(), db);
        if (!hasAccess) {
          await createAuditLog({
            action: 'DOCUMENT_ACCESS_DENIED',
            entityType: 'DOCUMENT',
            entityId: tokenData.documentId,
            userId: user.id,
            userRole: user.role,
            details: { reason: 'User mismatch and no client access', expectedUserId: tokenData.userId, ip: request.ip || 'unknown' },
            timestamp: new Date(),
            complianceLevel: 'HIPAA'
          });
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }
    }

    const mongoClient = await clientPromise;
    const db = mongoClient.db('referradb');

    // Fetch document metadata
    const document = await db.collection('client_documents').findOne({
      _id: new ObjectId(tokenData.documentId)
    });

    if (!document) {
      await createAuditLog({
        action: 'DOCUMENT_ACCESS_DENIED',
        entityType: 'DOCUMENT',
        entityId: tokenData.documentId,
        userId: user.id,
        userRole: user.role,
        details: { reason: 'Document not found', ip: request.ip || 'unknown' },
        timestamp: new Date(),
        complianceLevel: 'HIPAA'
      });
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Verify user has access to this client's documents
    const hasAccess = await verifyClientAccess(user, document.clientId.toString(), db);
    if (!hasAccess) {
      await createAuditLog({
        action: 'DOCUMENT_ACCESS_DENIED',
        entityType: 'DOCUMENT',
        entityId: tokenData.documentId,
        userId: user.id,
        userRole: user.role,
        details: { reason: 'Insufficient client access', clientId: document.clientId.toString(), ip: request.ip || 'unknown' },
        timestamp: new Date(),
        complianceLevel: 'HIPAA'
      });
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Read and decrypt file from MongoDB GridFS
    try {
      const bucket = new GridFSBucket(db, { bucketName: 'encrypted_documents' });
      
      // Download encrypted file from GridFS
      const downloadStream = bucket.openDownloadStream(document.gridFSFileId);
      const chunks: Buffer[] = [];
      
      const encryptedBuffer = await new Promise<Buffer>((resolve, reject) => {
        downloadStream.on('data', (chunk) => chunks.push(chunk));
        downloadStream.on('end', () => resolve(Buffer.concat(chunks)));
        downloadStream.on('error', reject);
      });
      
      // Decrypt file content
      const encryptionKey = Buffer.from(document.encryptionKey, 'base64');
      const iv = Buffer.from(document.iv, 'base64');
      const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
      const decryptedBuffer = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);

      // Verify file integrity
      const fileHash = crypto.createHash('sha256').update(decryptedBuffer).digest('hex');
      if (fileHash !== document.fileHash) {
        await createAuditLog({
          action: 'DOCUMENT_INTEGRITY_VIOLATION',
          entityType: 'DOCUMENT',
          entityId: tokenData.documentId,
          userId: user.id,
          userRole: user.role,
          details: { reason: 'File integrity check failed', expectedHash: document.fileHash, actualHash: fileHash, ip: request.ip || 'unknown' },
          timestamp: new Date(),
          complianceLevel: 'HIPAA'
        });
        return NextResponse.json({ error: 'Document integrity violation' }, { status: 500 });
      }

      // Log document access
      await db.collection('client_documents').updateOne(
        { _id: new ObjectId(tokenData.documentId) },
        {
          $push: {
            accessLog: {
              userId: new ObjectId(user.id),
              userName: user.name || user.email,
              accessedAt: new Date(),
              ip: request.ip || 'unknown',
              userAgent: request.headers.get('user-agent')
            }
          }
        }
      );

      // HIPAA Audit: Document accessed
      await createAuditLog({
        action: 'DOCUMENT_ACCESSED',
        entityType: 'DOCUMENT',
        entityId: tokenData.documentId,
        userId: user.id,
        userRole: user.role,
        details: {
          documentName: document.name,
          clientId: document.clientId.toString(),
          fileSize: document.size,
          ip: request.ip || 'unknown',
          userAgent: request.headers.get('user-agent')
        },
        timestamp: new Date(),
        complianceLevel: 'HIPAA'
      });

      // Determine content type
      const contentType = getContentType(document.originalName);

      // Return decrypted file
      return new NextResponse(decryptedBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${document.originalName}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          // HIPAA Security Headers
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
        }
      });

    } catch (fileError) {
      await createAuditLog({
        action: 'DOCUMENT_ACCESS_ERROR',
        entityType: 'DOCUMENT',
        entityId: tokenData.documentId,
        userId: user.id,
        userRole: user.role,
        details: { error: fileError.message, ip: request.ip || 'unknown' },
        timestamp: new Date(),
        complianceLevel: 'HIPAA'
      });
      return NextResponse.json({ error: 'Failed to access document' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in secure document access:', error);
    await createAuditLog({
      action: 'DOCUMENT_ACCESS_ERROR',
      entityType: 'DOCUMENT',
      entityId: 'unknown',
      userId: user?.id || null,
      userRole: user?.role || null,
      details: { error: error.message, token: params.token, ip: request.ip || 'unknown' },
      timestamp: new Date(),
      complianceLevel: 'HIPAA'
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper Functions


/**
 * Verify if user has access to client documents
 */
async function verifyClientAccess(user: any, clientId: string, db: any): Promise<boolean> {
  try {
    // Case managers can access their assigned clients
    if (user.role === 'case_manager') {
      const client = await db.collection('clients').findOne({
        _id: new ObjectId(clientId)
      });
      
      if (client && client.caseManagerId) {
        // Handle different possible formats for caseManagerId
        return client.caseManagerId === user.id || 
               client.caseManagerId.toString() === user.id ||
               (typeof client.caseManagerId === 'object' && client.caseManagerId.equals && client.caseManagerId.equals(new ObjectId(user.id)));
      }
      return false;
    }

    // Providers can access clients they have connections with
    if (user.role === 'provider') {
      const connection = await db.collection('service_relationships').findOne({
        clientId: new ObjectId(clientId),
        providerId: new ObjectId(user.id),
        status: { $in: ['active', 'pending'] }
      });
      return !!connection;
    }

    // Admins have full access (with audit logging)
    if (user.role === 'admin' || user.role === 'platform_admin') {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error verifying client access:', error);
    return false;
  }
}

/**
 * Verify and decode secure access token
 */
function verifyAccessToken(token: string): { documentId: string; userId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    const { documentId, userId, timestamp, expires, token: providedToken } = decoded;
    
    if (Date.now() > expires) {
      return null;
    }
    
    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret';
    const expectedToken = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify({ documentId, userId, timestamp, expires }))
      .digest('hex');
    
    if (providedToken !== expectedToken) {
      return null;
    }
    
    return { documentId, userId };
  } catch (error) {
    return null;
  }
}

/**
 * Get appropriate content type for file
 */
function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'doc': return 'application/msword';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'txt': return 'text/plain';
    default: return 'application/octet-stream';
  }
}
