/**
 * NextAuth.js API Route Handler
 * Integrates with existing HIPAA and multi-tenant infrastructure
 */

import NextAuth from "next-auth";
import authOptions from "@/lib/auth/auth-minimal";



const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
