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

// Waiver type formatting and options
export const WAIVER_TYPE_OPTIONS = [
  { value: 'non-waiver', label: 'Non Waiver', shortLabel: 'Non Waiver' },
  { value: 'pending-waiver', label: 'Pending Waiver', shortLabel: 'Pending Waiver' },
  { value: 'alternative-care', label: 'Alternative Care', shortLabel: 'Alternative Care' },
  { value: 'bi', label: 'Brain Injury (BI) Waiver', shortLabel: 'BI Waiver' },
  { value: 'cac', label: 'Community Alternative Care (CAC) Waiver', shortLabel: 'CAC Waiver' },
  { value: 'cadi', label: 'Community Access for Disability Inclusion (CADI) Waiver', shortLabel: 'CADI Waiver' },
  { value: 'dd', label: 'Developmental Disabilities (DD) Waiver', shortLabel: 'DD Waiver' },
  { value: 'ew', label: 'Elderly Waiver (EW)', shortLabel: 'EW Waiver' }
];

/**
 * Formats a waiver type for clean, consistent display (full label)
 */
export const formatWaiverType = (waiverType: string | undefined | null): string => {
  if (!waiverType) return 'Not specified';
  
  const option = WAIVER_TYPE_OPTIONS.find(opt => opt.value === waiverType);
  if (option) return option.label;
  
  // Fallback formatting for any custom values
  return waiverType
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Formats a waiver type for compact display (short label)
 */
export const formatWaiverTypeShort = (waiverType: string | undefined | null): string => {
  if (!waiverType) return 'Select waiver type';
  
  const option = WAIVER_TYPE_OPTIONS.find(opt => opt.value === waiverType);
  if (option) return option.shortLabel;
  
  // Fallback formatting for any custom values
  return waiverType
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}; 