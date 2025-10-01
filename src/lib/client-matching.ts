/**
 * Production-ready client matching system
 * Handles fuzzy matching, name variations, and date format differences
 */

// Common nickname mappings
const NICKNAME_MAP: Record<string, string> = {
  'mike': 'michael',
  'bob': 'robert', 
  'bill': 'william',
  'jim': 'james',
  'tom': 'thomas',
  'joe': 'joseph',
  'dave': 'david',
  'steve': 'steven',
  'chris': 'christopher',
  'matt': 'matthew',
  'dan': 'daniel',
  'rick': 'richard',
  'tony': 'anthony',
  'nick': 'nicholas'
};

/**
 * Normalize a person's name for matching
 */
function normalizePersonName(name: string): string {
  if (!name) return '';
  
  let normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/^(mr|mrs|ms|dr|prof)\.?\s+/, '') // Remove titles
    .trim();
  
  // Handle nicknames
  const nickname = NICKNAME_MAP[normalized];
  if (nickname) {
    normalized = nickname;
  }
  
  return normalized;
}

/**
 * Standardize date format for consistent matching
 */
function standardizeDateFormat(dateStr: string): string {
  if (!dateStr) return '';
  
  // Try to parse various formats
  const cleaned = dateStr.replace(/[^\d-\/]/g, '');
  
  // Handle common formats: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
  const patterns = [
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // MM-DD-YYYY
  ];
  
  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      if (pattern.source.startsWith('^(\\d{4})')) {
        // YYYY-MM-DD format
        const [, year, month, day] = match;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else {
        // MM/DD/YYYY or MM-DD-YYYY format
        const [, month, day, year] = match;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
  }
  
  return cleaned; // Return as-is if no pattern matches
}

/**
 * Create a normalized matching key for client identification
 */
export function createClientMatchingKey(
  firstName: string, 
  lastName: string, 
  dateOfBirth: string
): string {
  const normalizedFirst = normalizePersonName(firstName);
  const normalizedLast = normalizePersonName(lastName);
  const standardizedDate = standardizeDateFormat(dateOfBirth);
  
  return [normalizedFirst, normalizedLast, standardizedDate]
    .filter(Boolean)
    .join('|');
}

/**
 * Calculate similarity score between two clients (0-1)
 */
export function calculateClientSimilarity(
  client1: { firstName: string; lastName: string; dateOfBirth: string },
  client2: { firstName: string; lastName: string; dateOfBirth: string }
): number {
  const key1 = createClientMatchingKey(client1.firstName, client1.lastName, client1.dateOfBirth);
  const key2 = createClientMatchingKey(client2.firstName, client2.lastName, client2.dateOfBirth);
  
  if (key1 === key2) return 1.0; // Exact match
  
  // Partial matching logic
  const parts1 = key1.split('|');
  const parts2 = key2.split('|');
  
  let score = 0;
  const weights = [0.4, 0.4, 0.2]; // firstName, lastName, dateOfBirth weights
  
  for (let i = 0; i < Math.min(parts1.length, parts2.length); i++) {
    if (parts1[i] === parts2[i]) {
      score += weights[i] || 0;
    } else if (parts1[i] && parts2[i]) {
      // Use Levenshtein distance for fuzzy matching
      const similarity = 1 - (levenshteinDistance(parts1[i], parts2[i]) / Math.max(parts1[i].length, parts2[i].length));
      if (similarity > 0.8) { // 80% similarity threshold
        score += (weights[i] || 0) * similarity;
      }
    }
  }
  
  return score;
}

/**
 * Simple Levenshtein distance implementation
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Find potential client matches with confidence scores
 */
export function findClientMatches(
  targetClient: { firstName: string; lastName: string; dateOfBirth: string },
  candidateClients: Array<{ firstName: string; lastName: string; dateOfBirth: string; [key: string]: any }>,
  threshold: number = 0.85
): Array<{ client: any; confidence: number }> {
  return candidateClients
    .map(candidate => ({
      client: candidate,
      confidence: calculateClientSimilarity(targetClient, candidate)
    }))
    .filter(match => match.confidence >= threshold)
    .sort((a, b) => b.confidence - a.confidence);
}
