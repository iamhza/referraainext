import { CheckCircle, Clock, FileText, XCircle, AlertCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Authorization status configuration
export const AUTH_STATUS_CONFIG = {
  APPROVED: {
    label: 'Approved',
    icon: CheckCircle,
    textColor: 'text-[#4CB782]',
    hexColor: '#4CB782',
    bgColor: '#F0FDF4',
    borderColor: '#4CB782',
  },
  SUBMITTED: {
    label: 'Pending',
    icon: Clock,
    textColor: 'text-[#4EA7FC]',
    hexColor: '#4EA7FC',
    bgColor: '#EFF6FF',
    borderColor: '#4EA7FC',
  },
  DRAFT: {
    label: 'Draft',
    icon: FileText,
    textColor: 'text-slate-500',
    hexColor: '#64748B',
    bgColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  DENIED: {
    label: 'Denied',
    icon: XCircle,
    textColor: 'text-[#FA6563]',
    hexColor: '#FA6563',
    bgColor: '#FEF2F2',
    borderColor: '#FA6563',
  },
  EXPIRED: {
    label: 'Expired',
    icon: XCircle,
    textColor: 'text-[#991B1B]',
    hexColor: '#991B1B',
    bgColor: '#FEE2E2',
    borderColor: '#991B1B',
  },
  EXPIRING_SOON: {
    label: 'Approved',
    icon: AlertCircle,
    textColor: 'text-orange-600',
    hexColor: '#EA580C',
    bgColor: '#FFF7ED',
    borderColor: '#EA580C',
  },
} as const;

// Service status colors
export const STATUS_COLORS = {
  ACTIVE: {
    label: 'Active',
    dotColor: 'bg-[#4CB782]',
    hexColor: '#4CB782',
    textColor: 'text-[#4CB782]',
  },
  PENDING_START: {
    label: 'Pending Start',
    dotColor: 'bg-[#F2C94C]',
    hexColor: '#F2C94C',
    textColor: 'text-[#F2C94C]',
  },
  PAUSED: {
    label: 'Paused',
    dotColor: 'bg-[#BB87FC]',
    hexColor: '#BB87FC',
    textColor: 'text-[#BB87FC]',
  },
  CLOSED: {
    label: 'Closed',
    dotColor: 'bg-[#95A2B3]',
    hexColor: '#95A2B3',
    textColor: 'text-[#95A2B3]',
  },
} as const;

// Issue/Alert colors
export const ISSUE_COLORS = {
  warning: {
    hex: '#D97706',
    text: 'text-[#D97706]',
    bg: '#FFF5E6',
    border: '#D97706',
  },
  neutral: {
    hex: '#95A2B3',
    text: 'text-[#95A2B3]',
    bg: '#F8F9FA',
    border: '#95A2B3',
  },
} as const;

// Client badge colors
export const CLIENT_BADGE_COLORS = {
  gradient: 'linear-gradient(135deg, #0040FF 0%, #4EA7FC 100%)',
  color: 'white',
  borderColor: '#0040FF',
} as const;

// Get authorization status configuration
export function getAuthStatusConfig(
  status: 'APPROVED' | 'SUBMITTED' | 'DRAFT' | 'DENIED' | 'EXPIRED',
  daysUntilExpiration?: number
) {
  const isExpired = daysUntilExpiration !== undefined && daysUntilExpiration <= 0;
  const isExpiringSoon = daysUntilExpiration !== undefined && daysUntilExpiration < 30 && daysUntilExpiration > 0;

  if (isExpired) {
    return AUTH_STATUS_CONFIG.EXPIRED;
  } else if (isExpiringSoon) {
    return AUTH_STATUS_CONFIG.EXPIRING_SOON;
  }

  return AUTH_STATUS_CONFIG[status] || AUTH_STATUS_CONFIG.DRAFT;
}

