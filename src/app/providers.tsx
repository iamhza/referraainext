/**
 * App Providers - NextAuth.js Session Provider + Backward Compatible AuthContext
 * Integrates with existing app structure while maintaining compatibility
 */

'use client';

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/contexts/AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </SessionProvider>
  );
}
