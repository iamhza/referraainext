import { ObjectId } from 'mongodb';

// Input sanitization utilities
export function sanitizeString(input: any): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  // Remove potential XSS and injection attempts while preserving normal punctuation
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/\$\w+/g, '') // Remove MongoDB operators
    .slice(0, 1000); // Limit length
}

export function sanitizeEmail(email: any): string {
  if (typeof email !== 'string') {
    throw new Error('Email must be a string');
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = email.trim().toLowerCase().slice(0, 100);
  
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  
  return sanitized;
}

export function sanitizePhone(phone: any): string {
  if (typeof phone !== 'string') {
    throw new Error('Phone must be a string');
  }
  
  // Remove all non-numeric characters except + and -
  const sanitized = phone.replace(/[^0-9+\-\s\(\)]/g, '').slice(0, 20);
  
  if (sanitized.length < 10) {
    throw new Error('Phone number too short');
  }
  
  return sanitized;
}

export function validateObjectId(id: any): ObjectId {
  if (!id) {
    throw new Error('ID is required');
  }
  
  if (typeof id !== 'string') {
    throw new Error('ID must be a string');
  }
  
  if (id.length !== 24) {
    throw new Error('Invalid ID format');
  }
  
  try {
    return new ObjectId(id);
  } catch (error) {
    throw new Error('Invalid ObjectId format');
  }
}

export function validateRequiredFields(data: any, requiredFields: string[]): void {
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      throw new Error(`${field} is required`);
    }
  }
}

export function validateEnum(value: any, validValues: string[], fieldName: string): string {
  if (!validValues.includes(value)) {
    throw new Error(`Invalid ${fieldName}. Must be one of: ${validValues.join(', ')}`);
  }
  return value;
}

export function validateDateString(dateStr: any): string {
  if (typeof dateStr !== 'string') {
    throw new Error('Date must be a string');
  }
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format');
  }
  
  return dateStr;
}

// Client-specific validation
export function validateClientData(data: any): any {
  const sanitized = {
    firstName: sanitizeString(data.firstName),
    lastName: sanitizeString(data.lastName),
    dateOfBirth: data.dateOfBirth ? validateDateString(data.dateOfBirth) : undefined,
    sex: data.sex ? validateEnum(data.sex, ['male', 'female', 'non-binary', 'prefer-not-to-say', 'other'], 'sex') : undefined,
    email: data.email ? sanitizeEmail(data.email) : undefined,
    phone: data.phone ? sanitizePhone(data.phone) : undefined,
    preferredContactMethod: data.preferredContactMethod ? 
      validateEnum(data.preferredContactMethod, ['email', 'phone', 'both'], 'preferredContactMethod') : undefined,
    address: data.address ? sanitizeString(data.address) : undefined,
    city: data.city ? sanitizeString(data.city) : undefined,
    state: data.state ? sanitizeString(data.state) : undefined,
    zipCode: data.zipCode ? sanitizeString(data.zipCode) : undefined,
    county: data.county ? sanitizeString(data.county) : undefined,
    insuranceProvider: data.insuranceProvider ? sanitizeString(data.insuranceProvider) : undefined,
    insuranceNumber: data.insuranceNumber ? sanitizeString(data.insuranceNumber) : undefined,
    pmiNumber: data.pmiNumber ? sanitizeString(data.pmiNumber) : undefined,
    waiverType: data.waiverType ? sanitizeString(data.waiverType) : undefined,
    primaryLanguage: data.primaryLanguage ? sanitizeString(data.primaryLanguage) : undefined,
    needsTranslator: typeof data.needsTranslator === 'boolean' ? data.needsTranslator : undefined,
    historyOfViolence: typeof data.historyOfViolence === 'boolean' ? data.historyOfViolence : undefined,
    mobilityStatus: data.mobilityStatus ? 
      validateEnum(data.mobilityStatus, ['ambulatory', 'wheelchair-bound', 'bed-bound', 'other'], 'mobilityStatus') : undefined,
    livingSituation: data.livingSituation ? 
      validateEnum(data.livingSituation, ['alone', 'with-family', 'group-setting', 'other'], 'livingSituation') : undefined,
    primaryDiagnosis: data.primaryDiagnosis ? sanitizeString(data.primaryDiagnosis) : undefined,
    culturalConsiderations: data.culturalConsiderations ? sanitizeString(data.culturalConsiderations) : undefined,
    additionalNotes: data.additionalNotes ? sanitizeString(data.additionalNotes) : undefined,
    insurance: data.insurance ? sanitizeString(data.insurance) : undefined,
  };
  
  // Remove undefined values
  return Object.fromEntries(Object.entries(sanitized).filter(([_, v]) => v !== undefined));
}

// Comment validation
export function validateCommentData(data: any): any {
  validateRequiredFields(data, ['content']);
  
  const validCategories = [
    'status_update', 'document_request', 'service_coordination', 
    'follow_up_required', 'incident', 'general', 'status', 
    'request', 'progress', 'issue', 'admin'
  ];
  
  return {
    content: sanitizeString(data.content),
    category: data.category ? 
      validateEnum(data.category, validCategories, 'category') : 'general',
    priority: data.priority ? 
      validateEnum(data.priority, ['normal', 'important', 'urgent'], 'priority') : 'normal',
    metadata: data.metadata && typeof data.metadata === 'object' ? data.metadata : {},
    parentId: data.parentId ? validateObjectId(data.parentId).toString() : null,
    isInternal: typeof data.isInternal === 'boolean' ? data.isInternal : false,
  };
}

// Referral validation
export function validateReferralData(data: any): any {
  validateRequiredFields(data, ['clientInfo', 'serviceDetails']);
  
  if (!data.clientInfo || typeof data.clientInfo !== 'object') {
    throw new Error('clientInfo must be an object');
  }
  
  if (!data.serviceDetails || typeof data.serviceDetails !== 'object') {
    throw new Error('serviceDetails must be an object');
  }
  
  return {
    clientInfo: validateClientData(data.clientInfo),
    serviceDetails: {
      type: sanitizeString(data.serviceDetails.type),
      description: data.serviceDetails.description ? sanitizeString(data.serviceDetails.description) : undefined,
      urgency: data.serviceDetails.urgency ? 
        validateEnum(data.serviceDetails.urgency, ['low', 'medium', 'high'], 'urgency') : 'medium',
    },
    notes: data.notes ? sanitizeString(data.notes) : undefined,
  };
}

// Rate limiting helper
export function createRateLimitKey(ip: string, endpoint: string): string {
  return `rate_limit:${ip}:${endpoint}`;
}

export function validateRequestSize(contentLength: number, maxSize: number = 1024 * 1024): void {
  if (contentLength > maxSize) {
    throw new Error(`Request too large. Maximum size is ${maxSize} bytes`);
  }
}

// NoSQL injection prevention
export function sanitizeMongoQuery(query: any): any {
  if (typeof query !== 'object' || query === null) {
    return query;
  }

  if (Array.isArray(query)) {
    return query.map(sanitizeMongoQuery);
  }

  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(query)) {
    // Remove MongoDB operators that could be used for injection
    if (key.startsWith('$') && !ALLOWED_MONGO_OPERATORS.includes(key)) {
      continue; // Skip potentially dangerous operators
    }
    
    // Recursively sanitize nested objects
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeMongoQuery(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// Whitelist of allowed MongoDB operators
const ALLOWED_MONGO_OPERATORS = [
  '$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin',
  '$exists', '$type', '$regex', '$options',
  '$and', '$or', '$not', '$nor',
  '$set', '$unset', '$inc', '$push', '$pull', '$addToSet',
  '$sort', '$limit', '$skip', '$project'
];

// Validate and sanitize search parameters
export function sanitizeSearchParams(params: URLSearchParams): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  for (const [key, value] of params.entries()) {
    // Only allow alphanumeric keys and common search parameters
    if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
      continue;
    }
    
    // Sanitize the value
    sanitized[key] = sanitizeString(value);
  }
  
  return sanitized;
}

// Validate pagination parameters
export function validatePagination(searchParams: URLSearchParams): { limit: number; skip: number } {
  const limitParam = searchParams.get('limit');
  const skipParam = searchParams.get('skip');
  const pageParam = searchParams.get('page');
  
  let limit = 20; // Default limit
  let skip = 0;   // Default skip
  
  if (limitParam) {
    const parsedLimit = parseInt(limitParam, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100) {
      limit = parsedLimit;
    }
  }
  
  if (skipParam) {
    const parsedSkip = parseInt(skipParam, 10);
    if (!isNaN(parsedSkip) && parsedSkip >= 0) {
      skip = parsedSkip;
    }
  } else if (pageParam) {
    const parsedPage = parseInt(pageParam, 10);
    if (!isNaN(parsedPage) && parsedPage > 0) {
      skip = (parsedPage - 1) * limit;
    }
  }
  
  return { limit, skip };
} 