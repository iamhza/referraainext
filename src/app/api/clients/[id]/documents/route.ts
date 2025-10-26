import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb/client';
import { ObjectId, GridFSBucket } from 'mongodb';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import crypto from 'crypto';
import { createAuditLog } from '@/lib/audit/logger';
import { Readable } from 'stream';

// GET - Fetch all documents for a client (HIPAA Compliant)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      // HIPAA Audit: Unauthorized access attempt
      await createAuditLog({
        action: 'DOCUMENT_ACCESS_DENIED',
        entityType: 'CLIENT_DOCUMENTS',
        entityId: params.id,
        userId: null,
        userRole: null,
        details: { reason: 'No authentication', ip: request.ip || 'unknown' },
        timestamp: new Date(),
        complianceLevel: 'HIPAA'
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mongoClient = await clientPromise;
    const db = mongoClient.db('referradb');
    const clientId = params.id;

    // HIPAA Security: Verify user has access to this client
    const clientRecord = await db.collection('clients').findOne({
      _id: new ObjectId(clientId)
    });

    if (!clientRecord) {
      await createAuditLog({
        action: 'DOCUMENT_ACCESS_DENIED',
        entityType: 'CLIENT_DOCUMENTS',
        entityId: clientId,
        userId: user.id,
        userRole: user.role,
        details: { reason: 'Client not found', ip: request.ip || 'unknown' },
        timestamp: new Date(),
        complianceLevel: 'HIPAA'
      });
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // HIPAA Access Control: Check user authorization for this client
    const hasAccess = await verifyClientAccess(user, clientId, db);
    if (!hasAccess) {
      await createAuditLog({
        action: 'DOCUMENT_ACCESS_DENIED',
        entityType: 'CLIENT_DOCUMENTS',
        entityId: clientId,
        userId: user.id,
        userRole: user.role,
        details: { reason: 'Insufficient permissions', ip: request.ip || 'unknown' },
        timestamp: new Date(),
        complianceLevel: 'HIPAA'
      });
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch documents for this client from MongoDB
    const documents = await db.collection('client_documents').find({
      clientId: new ObjectId(clientId)
    }).sort({ uploadedAt: -1 }).toArray();

    // HIPAA Audit: Document access logged
    await createAuditLog({
      action: 'DOCUMENTS_ACCESSED',
      entityType: 'CLIENT_DOCUMENTS',
      entityId: clientId,
      userId: user.id,
      userRole: user.role,
      details: { 
        documentCount: documents.length,
        ip: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent')
      },
      timestamp: new Date(),
      complianceLevel: 'HIPAA'
    });

    // Return sanitized document data (no direct file paths)
    return NextResponse.json({
      documents: documents.map(doc => ({
        _id: doc._id.toString(),
        name: doc.name,
        type: doc.type,
        description: doc.description,
        // HIPAA Security: Use secure document access endpoint instead of direct URL
        accessToken: generateSecureAccessToken(doc._id.toString(), user.id),
        size: doc.size,
        uploadedBy: doc.uploadedBy,
        uploadedAt: doc.uploadedAt,
        contextType: doc.contextType,
        contextId: doc.contextId,
        clientId: doc.clientId.toString(),
        isEncrypted: doc.isEncrypted || false
      }))
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    await createAuditLog({
      action: 'DOCUMENT_ACCESS_ERROR',
      entityType: 'CLIENT_DOCUMENTS',
      entityId: params.id,
      userId: user?.id || null,
      userRole: user?.role || null,
      details: { error: error.message, ip: request.ip || 'unknown' },
      timestamp: new Date(),
      complianceLevel: 'HIPAA'
    });
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST - Upload a new document (HIPAA Compliant)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      await createAuditLog({
        action: 'DOCUMENT_UPLOAD_DENIED',
        entityType: 'CLIENT_DOCUMENTS',
        entityId: params.id,
        userId: null,
        userRole: null,
        details: { reason: 'No authentication', ip: request.ip || 'unknown' },
        timestamp: new Date(),
        complianceLevel: 'HIPAA'
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mongoClient = await clientPromise;
    const db = mongoClient.db('referradb');
    const clientId = params.id;

    // HIPAA Access Control: Verify user can upload documents for this client
    const hasAccess = await verifyClientAccess(user, clientId, db);
    
    if (!hasAccess) {
      await createAuditLog({
        action: 'DOCUMENT_UPLOAD_DENIED',
        entityType: 'CLIENT_DOCUMENTS',
        entityId: clientId,
        userId: user.id,
        userRole: user.role,
        details: { reason: 'Insufficient permissions', ip: request.ip || 'unknown' },
        timestamp: new Date(),
        complianceLevel: 'HIPAA'
      });
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'other';
    const description = formData.get('description') as string || '';
    const contextType = formData.get('contextType') as string || 'general';
    const contextId = formData.get('contextId') as string || null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // HIPAA Security: Enhanced file validation
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      await createAuditLog({
        action: 'DOCUMENT_UPLOAD_REJECTED',
        entityType: 'CLIENT_DOCUMENTS',
        entityId: clientId,
        userId: user.id,
        userRole: user.role,
        details: { reason: 'Invalid file type', fileType: file.type, ip: request.ip || 'unknown' },
        timestamp: new Date(),
        complianceLevel: 'HIPAA'
      });
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    // Validate file size (10MB limit - MongoDB GridFS can handle larger files efficiently)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    // HIPAA Security: Encrypt file content before storage in MongoDB
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate encryption key and IV
    const encryptionKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    
    // Encrypt the file content
    const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
    const encryptedBuffer = Buffer.concat([cipher.update(buffer), cipher.final()]);
    
    // Calculate file hash for integrity verification
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
    
    // Store encrypted file in MongoDB GridFS
    const bucket = new GridFSBucket(db, { bucketName: 'encrypted_documents' });
    const uploadStream = bucket.openUploadStream(file.name, {
      metadata: {
        clientId: new ObjectId(clientId),
        originalName: file.name,
        contentType: file.type,
        isEncrypted: true,
        uploadedBy: user.name || user.email,
        uploadedById: new ObjectId(user.id),
        contextType,
        contextId: contextId ? new ObjectId(contextId) : null
      }
    });

    // Create readable stream from encrypted buffer
    const readableStream = new Readable();
    readableStream.push(encryptedBuffer);
    readableStream.push(null);

    // Upload to GridFS
    const gridFSFileId = await new Promise<ObjectId>((resolve, reject) => {
      readableStream.pipe(uploadStream)
        .on('error', reject)
        .on('finish', () => resolve(uploadStream.id as ObjectId));
    });

    // Save document metadata to collection
    const document = {
      clientId: new ObjectId(clientId),
      gridFSFileId,
      name: file.name,
      originalName: file.name,
      type,
      description,
      size: file.size,
      uploadedBy: user.name || user.email,
      uploadedById: new ObjectId(user.id),
      uploadedAt: new Date(),
      contextType,
      contextId: contextId ? new ObjectId(contextId) : null,
      // HIPAA Security: Store encryption metadata
      isEncrypted: true,
      encryptionKey: encryptionKey.toString('base64'), // Store securely - in production, use key management service
      iv: iv.toString('base64'),
      fileHash, // Original file hash for integrity
      accessLog: []
    };

    const result = await db.collection('client_documents').insertOne(document);

    // HIPAA Audit: Document upload logged
    await createAuditLog({
      action: 'DOCUMENT_UPLOADED',
      entityType: 'CLIENT_DOCUMENTS',
      entityId: clientId,
      userId: user.id,
      userRole: user.role,
      details: {
        documentId: result.insertedId.toString(),
        documentName: file.name,
        documentType: type,
        fileSize: file.size,
        isEncrypted: true,
        contextType,
        ip: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent')
      },
      timestamp: new Date(),
      complianceLevel: 'HIPAA'
    });

    // Create document upload event in Service Feed
    await db.collection('events').insertOne({
      clientId: new ObjectId(clientId),
      type: 'document_upload',
      action: 'document_uploaded',
      description: `Document uploaded: ${file.name}`,
      metadata: {
        documentId: result.insertedId,
        documentName: file.name,
        documentType: type,
        uploadedBy: user.name || user.email,
        contextType,
        contextId,
        isEncrypted: true
      },
      createdBy: new ObjectId(user.id),
      createdAt: new Date()
    });

    return NextResponse.json({
      _id: result.insertedId.toString(),
      name: file.name,
      type,
      description,
      accessToken: generateSecureAccessToken(result.insertedId.toString(), user.id),
      size: file.size,
      uploadedBy: user.name || user.email,
      uploadedAt: new Date(),
      contextType,
      contextId,
      clientId,
      isEncrypted: true
    });

  } catch (error) {
    console.error('Error uploading document:', error);
    await createAuditLog({
      action: 'DOCUMENT_UPLOAD_ERROR',
      entityType: 'CLIENT_DOCUMENTS',
      entityId: params.id,
      userId: user?.id || null,
      userRole: user?.role || null,
      details: { error: error.message, ip: request.ip || 'unknown' },
      timestamp: new Date(),
      complianceLevel: 'HIPAA'
    });
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      // HIPAA Audit: Unauthorized deletion attempt
      await createAuditLog({
        action: 'DOCUMENT_DELETE_DENIED',
        entityType: 'CLIENT_DOCUMENTS',
        entityId: params.id,
        userId: null,
        userRole: null,
        details: { reason: 'No authentication', ip: request.ip || 'unknown' },
        timestamp: new Date(),
        complianceLevel: 'HIPAA'
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mongoClient = await clientPromise;
    const db = mongoClient.db('referradb');
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    // Find the document first
    const document = await db.collection('client_documents').findOne({
      _id: new ObjectId(documentId)
    });

    if (!document) {
      await createAuditLog({
        action: 'DOCUMENT_DELETE_DENIED',
        entityType: 'CLIENT_DOCUMENTS',
        entityId: params.id,
        userId: user.id,
        userRole: user.role,
        details: { 
          reason: 'Document not found', 
          documentId,
          ip: request.ip || 'unknown' 
        },
        timestamp: new Date(),
        complianceLevel: 'HIPAA'
      });
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // HIPAA Access Control: Verify user can delete this document
    const hasAccess = await verifyClientAccess(user, document.clientId.toString(), db);
    if (!hasAccess) {
      await createAuditLog({
        action: 'DOCUMENT_DELETE_DENIED',
        entityType: 'CLIENT_DOCUMENTS',
        entityId: document.clientId.toString(),
        userId: user.id,
        userRole: user.role,
        details: { 
          reason: 'Insufficient permissions', 
          documentId,
          documentName: document.name,
          ip: request.ip || 'unknown' 
        },
        timestamp: new Date(),
        complianceLevel: 'HIPAA'
      });
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete from GridFS
    const bucket = new GridFSBucket(db, { bucketName: 'encrypted_documents' });
    try {
      await bucket.delete(document.gridFSFileId);
    } catch (gridFSError) {
      console.warn('GridFS file may not exist:', gridFSError);
      // Continue with metadata deletion even if GridFS file is missing
    }

    // Delete metadata from collection
    await db.collection('client_documents').deleteOne({
      _id: new ObjectId(documentId)
    });

    // HIPAA Audit: Document deletion logged
    await createAuditLog({
      action: 'DOCUMENT_DELETED',
      entityType: 'CLIENT_DOCUMENTS',
      entityId: document.clientId.toString(),
      userId: user.id,
      userRole: user.role,
      details: {
        documentId,
        documentName: document.name,
        documentType: document.type,
        originalSize: document.size,
        wasEncrypted: true,
        contextType: document.contextType,
        ip: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent')
      },
      timestamp: new Date(),
      complianceLevel: 'HIPAA'
    });

    // Create document deletion event in Service Feed and Timeline
    await db.collection('events').insertOne({
      clientId: document.clientId,
      type: 'document_delete',
      action: 'document_deleted',
      description: `Document deleted: ${document.name}`,
      metadata: {
        documentId,
        documentName: document.name,
        documentType: document.type,
        deletedBy: user.name || user.email,
        contextType: document.contextType,
        wasEncrypted: true
      },
      createdBy: new ObjectId(user.id),
      createdAt: new Date()
    });

    return NextResponse.json({ 
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    
    // HIPAA Audit: System error during deletion
    try {
      await createAuditLog({
        action: 'DOCUMENT_DELETE_ERROR',
        entityType: 'CLIENT_DOCUMENTS',
        entityId: params.id,
        userId: user?.id || null,
        userRole: user?.role || null,
        details: { 
          error: error.message,
          ip: request.ip || 'unknown' 
        },
        timestamp: new Date(),
        complianceLevel: 'HIPAA'
      });
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError);
    }
    
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}

// HIPAA Security Helper Functions

/**
 * Verify if user has access to client documents
 * Implements role-based access control for HIPAA compliance
 */
async function verifyClientAccess(user: any, clientId: string, db: any): Promise<boolean> {
  try {
    // Case managers can access their assigned clients
    if (user.role === 'case_manager') {
      const client = await db.collection('clients').findOne({
        _id: new ObjectId(clientId)
      });
      
      console.log('verifyClientAccess Debug - Client found:', !!client);
      console.log('verifyClientAccess Debug - Client caseManagerId:', client?.caseManagerId);
      console.log('verifyClientAccess Debug - User ID:', user.id);
      
      if (client && client.caseManagerId) {
        // Handle different possible formats for caseManagerId
        const hasAccess = client.caseManagerId === user.id || 
               client.caseManagerId.toString() === user.id ||
               (typeof client.caseManagerId === 'object' && client.caseManagerId.equals && client.caseManagerId.equals(new ObjectId(user.id)));
        
        console.log('verifyClientAccess Debug - Case Manager Access:', hasAccess);
        return hasAccess;
      }
      console.log('verifyClientAccess Debug - No client or caseManagerId found');
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
 * Generate secure access token for document viewing
 * Tokens expire after 1 hour for security
 */
function generateSecureAccessToken(documentId: string, userId: string): string {
  const payload = {
    documentId,
    userId,
    timestamp: Date.now(),
    expires: Date.now() + (60 * 60 * 1000) // 1 hour
  };
  
  const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret';
  const token = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return Buffer.from(JSON.stringify({ ...payload, token })).toString('base64');
}

/**
 * Verify and decode secure access token
 */
function verifyAccessToken(token: string): { documentId: string; userId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    const { documentId, userId, timestamp, expires, token: providedToken } = decoded;
    
    // Check if token is expired
    if (Date.now() > expires) {
      return null;
    }
    
    // Verify token signature
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

// PATCH - Update document context and metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mongoClient = await clientPromise;
    const db = mongoClient.db('referradb');
    const clientId = params.id;

    // Parse request body
    const body = await request.json();
    const { documentId, contextType, contextId, type, description } = body;

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Verify user has access to this client
    console.log('PATCH Debug - User:', { id: user.id, role: user.role, name: user.name });
    console.log('PATCH Debug - ClientId:', clientId);
    
    const hasAccess = await verifyClientAccess(user, clientId, db);
    console.log('PATCH Debug - Has Access:', hasAccess);
    
    if (!hasAccess) {
      console.log('PATCH Debug - Access denied for user:', user.id, 'to client:', clientId);
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Find the document
    const document = await db.collection('documents').findOne({
      _id: new ObjectId(documentId),
      clientId: new ObjectId(clientId)
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Prepare update object
    const updateData: any = {
      updatedAt: new Date(),
      updatedBy: user.name || user.email
    };

    if (contextType !== undefined) {
      updateData.contextType = contextType;
    }
    if (contextId !== undefined) {
      updateData.contextId = contextId ? new ObjectId(contextId) : null;
    }
    if (type !== undefined) {
      updateData.type = type;
    }
    if (description !== undefined) {
      updateData.description = description;
    }

    // Update the document
    const result = await db.collection('documents').updateOne(
      { _id: new ObjectId(documentId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Fetch the updated document
    const updatedDocument = await db.collection('documents').findOne({
      _id: new ObjectId(documentId)
    });

    // HIPAA Audit Log
    await createAuditLog({
      action: 'DOCUMENT_UPDATED',
      entityType: 'DOCUMENT',
      entityId: documentId,
      userId: user.id,
      userRole: user.role,
      details: {
        clientId,
        documentName: document.name,
        changes: updateData,
        ip: request.ip || 'unknown'
      },
      timestamp: new Date(),
      complianceLevel: 'HIPAA'
    });

    // Generate new access token for the updated document
    const accessToken = generateSecureAccessToken(documentId, user.id);

    return NextResponse.json({
      ...updatedDocument,
      _id: updatedDocument!._id.toString(),
      clientId: updatedDocument!.clientId.toString(),
      contextId: updatedDocument!.contextId?.toString() || null,
      accessToken
    });

  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}
