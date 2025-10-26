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
    if (!dateString) return 'Not provided';
    
    // Handle date-only strings (YYYY-MM-DD) without timezone conversion
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day); // Use local time
      return format(date, formatString);
    }
    
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
 * Converts date to local date input format (YYYY-MM-DD) without timezone shifts
 * 
 * @param dateString The date string to format
 * @returns A date string in YYYY-MM-DD format for HTML date inputs
 */
export function formatDateForInput(dateString: string | Date): string {
  try {
    if (!dateString) return '';
    
    // If it's already in YYYY-MM-DD format, return as-is
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Parse the date and ensure we get local date components
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid date provided to formatDateForInput:', dateString);
      return '';
    }
    
    // Use local date components to avoid timezone shifts
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Error formatting date for input:", error);
    return '';
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