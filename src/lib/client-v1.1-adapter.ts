/**
 * Client v1.1 Data Model Adapter
 * 
 * Handles reading/writing clients in the new nested structure:
 * - identity (firstName, lastName, dob, externalId)
 * - contact (address, phone, email)
 * - bands (language, accessibility)
 * - clinical (primaryDiagnosis, mentalHealthNeeds, physicalLimitations)
 * - insurance (type, provider, number)
 * 
 * Also provides backward compatibility for reading old flat structure.
 */

import { ObjectId } from 'mongodb';

// v1.1 Client Structure
export interface ClientV1_1 {
  _id: ObjectId;
  organizationId: string;
  caseManagerId: string;
  status: 'ACTIVE' | 'INACTIVE';
  
  // Nested PHI
  identity: {
    firstName: string;
    lastName: string;
    dob: Date;
    externalId?: string | null;
  };
  
  contact: {
    address: {
      line1: string;
      city: string;
      state: string;
      zip: string;
      county?: string | null;
    };
    phone?: string | null;
    email?: string | null;
  };
  
  bands: {
    language?: string | null;
    accessibility?: string[];
  };
  
  clinical: {
    primaryDiagnosis?: string | null;
    mentalHealthNeeds?: string | null;
    physicalLimitations?: string | null;
  };
  
  insurance: {
    type: 'private' | 'medicaid' | 'medicare' | 'none';
    provider?: string | null;
    number?: string | null;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Input type for creating/updating clients
export interface ClientInput {
  // Identity
  firstName: string;
  lastName: string;
  dateOfBirth: string; // Will be converted to Date
  pmiNumber?: string; // externalId
  
  // Contact
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  county?: string;
  phone?: string;
  email?: string;
  
  // Bands
  primaryLanguage?: string;
  mobilityStatus?: string;
  
  // Clinical
  primaryDiagnosis?: string;
  
  // Insurance
  insuranceProvider?: string;
  insuranceNumber?: string;
  
  // Org context
  organizationId?: string;
  caseManagerId?: string;
}

/**
 * Convert flat input to v1.1 nested structure
 */
export function flatToNested(input: ClientInput, organizationId: string, caseManagerId: string): Partial<ClientV1_1> {
  return {
    organizationId,
    caseManagerId,
    status: 'ACTIVE',
    
    identity: {
      firstName: input.firstName,
      lastName: input.lastName,
      dob: new Date(input.dateOfBirth),
      externalId: input.pmiNumber || null,
    },
    
    contact: {
      address: {
        line1: input.address || '',
        city: input.city || '',
        state: input.state || '',
        zip: input.zipCode || '',
        county: input.county || null,
      },
      phone: input.phone || null,
      email: input.email || null,
    },
    
    bands: {
      language: input.primaryLanguage || null,
      accessibility: input.mobilityStatus ? [input.mobilityStatus] : [],
    },
    
    clinical: {
      primaryDiagnosis: input.primaryDiagnosis || null,
      mentalHealthNeeds: null,
      physicalLimitations: null,
    },
    
    insurance: {
      type: input.insuranceProvider ? 'private' : 'none',
      provider: input.insuranceProvider || null,
      number: input.insuranceNumber || null,
    },
    
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Convert v1.1 nested structure to flat format (for backward compatibility with existing UI)
 */
export function nestedToFlat(client: ClientV1_1): any {
  return {
    _id: client._id.toString(),
    organizationId: client.organizationId,
    caseManagerId: client.caseManagerId,
    status: client.status,
    
    // Identity (flattened)
    firstName: client.identity?.firstName || '',
    lastName: client.identity?.lastName || '',
    dateOfBirth: client.identity?.dob ? client.identity.dob.toISOString() : null,
    pmiNumber: client.identity?.externalId || null,
    
    // Contact (flattened)
    address: client.contact?.address?.line1 || '',
    city: client.contact?.address?.city || '',
    state: client.contact?.address?.state || '',
    zipCode: client.contact?.address?.zip || '',
    county: client.contact?.address?.county || null,
    phone: client.contact?.phone || null,
    email: client.contact?.email || null,
    
    // Bands (flattened)
    primaryLanguage: client.bands?.language || null,
    mobilityStatus: client.bands?.accessibility?.[0] || null,
    
    // Clinical (flattened)
    primaryDiagnosis: client.clinical?.primaryDiagnosis || null,
    
    // Insurance (flattened)
    insuranceProvider: client.insurance?.provider || null,
    insuranceNumber: client.insurance?.number || null,
    
    // Metadata
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
  };
}

/**
 * Check if a client document is in v1.1 format
 */
export function isV1_1Format(client: any): boolean {
  return !!(client.identity && client.contact && client.bands);
}

/**
 * Auto-convert client to flat format regardless of database format
 * (Handles both old flat structure and new v1.1 nested structure)
 */
export function clientToFlat(client: any): any {
  if (isV1_1Format(client)) {
    // New v1.1 nested format - convert to flat
    return nestedToFlat(client);
  } else {
    // Old flat format - return as is with ID conversion
    return {
      ...client,
      _id: client._id.toString ? client._id.toString() : client._id,
    };
  }
}

/**
 * Merge partial updates into existing nested structure
 */
export function mergeNestedUpdate(existing: ClientV1_1, flatUpdates: Partial<ClientInput>): Partial<ClientV1_1> {
  const update: Partial<ClientV1_1> = {
    updatedAt: new Date(),
  };
  
  // Identity updates
  if (flatUpdates.firstName || flatUpdates.lastName || flatUpdates.dateOfBirth || flatUpdates.pmiNumber !== undefined) {
    update.identity = {
      ...existing.identity,
      ...(flatUpdates.firstName && { firstName: flatUpdates.firstName }),
      ...(flatUpdates.lastName && { lastName: flatUpdates.lastName }),
      ...(flatUpdates.dateOfBirth && { dob: new Date(flatUpdates.dateOfBirth) }),
      ...(flatUpdates.pmiNumber !== undefined && { externalId: flatUpdates.pmiNumber }),
    };
  }
  
  // Contact updates
  if (flatUpdates.address || flatUpdates.city || flatUpdates.state || flatUpdates.zipCode || flatUpdates.county !== undefined || flatUpdates.phone !== undefined || flatUpdates.email !== undefined) {
    update.contact = {
      ...existing.contact,
      address: {
        ...existing.contact.address,
        ...(flatUpdates.address && { line1: flatUpdates.address }),
        ...(flatUpdates.city && { city: flatUpdates.city }),
        ...(flatUpdates.state && { state: flatUpdates.state }),
        ...(flatUpdates.zipCode && { zip: flatUpdates.zipCode }),
        ...(flatUpdates.county !== undefined && { county: flatUpdates.county }),
      },
      ...(flatUpdates.phone !== undefined && { phone: flatUpdates.phone }),
      ...(flatUpdates.email !== undefined && { email: flatUpdates.email }),
    };
  }
  
  // Bands updates
  if (flatUpdates.primaryLanguage !== undefined || flatUpdates.mobilityStatus !== undefined) {
    update.bands = {
      ...existing.bands,
      ...(flatUpdates.primaryLanguage !== undefined && { language: flatUpdates.primaryLanguage }),
      ...(flatUpdates.mobilityStatus !== undefined && { accessibility: [flatUpdates.mobilityStatus] }),
    };
  }
  
  // Clinical updates
  if (flatUpdates.primaryDiagnosis !== undefined) {
    update.clinical = {
      ...existing.clinical,
      primaryDiagnosis: flatUpdates.primaryDiagnosis,
    };
  }
  
  // Insurance updates
  if (flatUpdates.insuranceProvider !== undefined || flatUpdates.insuranceNumber !== undefined) {
    update.insurance = {
      ...existing.insurance,
      ...(flatUpdates.insuranceProvider !== undefined && {
        provider: flatUpdates.insuranceProvider,
        type: flatUpdates.insuranceProvider ? 'private' : 'none',
      }),
      ...(flatUpdates.insuranceNumber !== undefined && { number: flatUpdates.insuranceNumber }),
    };
  }
  
  return update;
}

