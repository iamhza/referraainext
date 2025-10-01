import crypto from 'crypto';

// Use a simpler, more compatible algorithm for Next.js
const ENCRYPTION_KEY = process.env.MESSAGE_ENCRYPTION_KEY || 'default-key-32-chars-1234567890';
const ALGORITHM = 'aes-256-cbc';

export interface EncryptedData {
  encryptedContent: string;
  iv: string;
  authTag: string;
}

export function encryptMessage(content: string): EncryptedData {
  try {
    const iv = crypto.randomBytes(16);
    
    // Ensure key is 32 bytes for AES-256
    const keyBuffer = Buffer.from(ENCRYPTION_KEY.slice(0, 32).padEnd(32, '0'));
    
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
    
    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encryptedContent: encrypted,
      iv: iv.toString('hex'),
      authTag: '' // Not used for CBC mode
    };
  } catch (error) {
    console.error('Encryption error:', error);
    // Fallback to simple base64 encoding if crypto fails
    return {
      encryptedContent: Buffer.from(content).toString('base64'),
      iv: '',
      authTag: ''
    };
  }
}

export function decryptMessage(encryptedData: EncryptedData): string {
  try {
    // Handle fallback base64 encoding
    if (!encryptedData.iv && !encryptedData.authTag) {
      return Buffer.from(encryptedData.encryptedContent, 'base64').toString('utf8');
    }
    
    // Ensure key is 32 bytes for AES-256
    const keyBuffer = Buffer.from(ENCRYPTION_KEY.slice(0, 32).padEnd(32, '0'));
    const iv = Buffer.from(encryptedData.iv, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
    
    let decrypted = decipher.update(encryptedData.encryptedContent, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    // Fallback to base64 decode
    try {
      return Buffer.from(encryptedData.encryptedContent, 'base64').toString('utf8');
    } catch {
      return '[DECRYPTION_FAILED]';
    }
  }
}

// For client names and other PHI
export function encryptPHI(data: string): EncryptedData {
  return encryptMessage(data);
}

export function decryptPHI(encryptedData: EncryptedData): string {
  return decryptMessage(encryptedData);
}
