/**
 * Capitalizes the first letter of each word in a name.
 * e.g., "john doe" -> "John Doe"
 */
export const capitalizeName = (name: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Formats a status string for display.
 * e.g., "under_review" -> "Under Review"
 */
export const formatStatus = (status: string): string => {
  if (!status) return '';
  return status
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Formats a service type string for display.
 * e.g., "personal_care_assistance" -> "Personal Care Assistance"
 */
export const formatServiceType = (serviceType: string): string => {
  if (!serviceType) return '';
  return serviceType
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}; 