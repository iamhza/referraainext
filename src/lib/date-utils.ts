import { format } from 'date-fns';

/**
 * Formats a date string safely.
 * 
 * @param dateString The date string to format
 * @param formatString The date-fns format string to use (defaults to 'MMM d, yyyy')
 * @returns A formatted date string
 */
export function formatSafeDate(dateString: string | Date, formatString: string = 'MMM d, yyyy'): string {
  try {
    // If it's already a Date object, use it directly
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    
    // Check if date is invalid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return format(date, formatString);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Unknown date";
  }
}

/**
 * Ensures a timestamp is valid.
 * Returns the corrected date as a string.
 * 
 * @param dateString The date string to validate
 * @returns A valid date string in ISO format
 */
export function validateTimestamp(dateString: string | Date): string {
  try {
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    
    // If date is invalid, use current date
    if (isNaN(date.getTime())) {
      return new Date().toISOString();
    }
    
    return date.toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
} 