/**
 * Referra Brand Color System
 * Use these colors for all decorations, alerts, and status indicators
 */

export const BRAND_COLORS = {
  // Primary
  primary: '#0040FF',           // Deep blue - primary actions, links
  
  // Status Colors
  critical: '#991B1B',          // Dark red - critical issues, expired (darker for emphasis)
  danger: '#FA6563',            // Coral red - danger states, denied
  warning: '#D97706',           // Dark orange - warnings, active issues (bold attention-grabbing)
  caution: '#978200',           // Olive - caution states (reserved)
  alert: '#F2C94C',             // Yellow - alerts, needs attention
  success: '#4CB782',           // Green - success, approved, active
  
  // Info & Special
  info: '#4EA7FC',              // Light blue - info, pending states
  special: '#BB87FC',           // Purple - special items, featured
  
  // Neutral
  neutral: '#95A2B3',           // Gray - neutral, inactive, secondary text
} as const;

/**
 * Pre-defined status configurations using brand colors
 */
export const STATUS_COLORS = {
  // Service Status
  service: {
    ACTIVE: {
      bg: 'bg-[#4CB782]/10',
      text: 'text-[#4CB782]',
      border: 'border-[#4CB782]/30',
      dot: 'bg-[#4CB782]',
    },
    PENDING_START: {
      bg: 'bg-[#F2C94C]/10',
      text: 'text-[#978200]',
      border: 'border-[#F2C94C]/30',
      dot: 'bg-[#F2C94C]',
    },
    PAUSED: {
      bg: 'bg-[#BB87FC]/10',
      text: 'text-[#BB87FC]',
      border: 'border-[#BB87FC]/30',
      dot: 'bg-[#BB87FC]',
    },
    CLOSED: {
      bg: 'bg-[#95A2B3]/10',
      text: 'text-[#95A2B3]',
      border: 'border-[#95A2B3]/30',
      dot: 'bg-[#95A2B3]',
    },
  },
  
  // Authorization Status
  authorization: {
    APPROVED: {
      bg: 'bg-[#4CB782]/10',
      text: 'text-[#4CB782]',
      border: 'border-[#4CB782]/30',
      icon: '#4CB782',
    },
    EXPIRING: {
      bg: 'bg-[#F2994A]/10',
      text: 'text-[#F2994A]',
      border: 'border-[#F2994A]/30',
      icon: '#F2994A',
    },
    EXPIRED: {
      bg: 'bg-[#991B1B]/10',
      text: 'text-[#991B1B]',
      border: 'border-[#991B1B]/30',
      icon: '#991B1B',
    },
    PENDING: {
      bg: 'bg-[#4EA7FC]/10',
      text: 'text-[#4EA7FC]',
      border: 'border-[#4EA7FC]/30',
      icon: '#4EA7FC',
    },
    DENIED: {
      bg: 'bg-[#FA6563]/10',
      text: 'text-[#FA6563]',
      border: 'border-[#FA6563]/30',
      icon: '#FA6563',
    },
  },
  
  // Issues
  issues: {
    HAS_ISSUES: {
      bg: 'bg-[#D97706]/10',
      text: 'text-[#D97706]',
      border: 'border-[#D97706]/30',
      icon: '#D97706',
    },
    NO_ISSUES: {
      bg: 'bg-[#95A2B3]/10',
      text: 'text-[#95A2B3]',
      border: 'border-[#95A2B3]/30',
      icon: '#95A2B3',
    },
  },
} as const;

