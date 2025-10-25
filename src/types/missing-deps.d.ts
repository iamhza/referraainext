// Temporary declarations for missing UI dependencies
declare module 'recharts' {
  export * from 'react';
}

declare module 'cmdk' {
  export const Command: any;
}

declare module 'input-otp' {
  export const OTPInput: any;
  export const OTPInputContext: any;
}

declare module 'react-resizable-panels' {
  export * from 'react';
}

declare module '@/hooks/use-mobile' {
  export const useIsMobile: () => boolean;
}

// sonner is properly installed with types, no need for declaration

declare module '@next-auth/mongodb-adapter' {
  export const MongoDBAdapter: any;
} 