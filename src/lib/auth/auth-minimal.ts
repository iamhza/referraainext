/**
 * Working NextAuth configuration with real user login and redirects
 */

import { NextAuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "../mongodb/client";
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

// v1.1 Data Model - Updated for org_members junction table
declare module "next-auth" {
  interface User {
    id: string;
    role: 'PLATFORM_ADMIN' | 'ORG_ADMIN' | 'SUPERVISOR' | 'CASE_MANAGER' | 'PROVIDER_USER';
    organizationId?: string | null;
    teamId?: string | null;
    providerId?: string | null;
    permissions?: string[];
    organization?: {
      id: string;
      name: string;
      plan: string;
      settings: any;
    } | null;
    team?: {
      id: string;
      name: string;
    } | null;
  }
  
  interface Session {
    user: User & {
      id: string;
      role: string;
      organizationId?: string | null;
      teamId?: string | null;
      providerId?: string | null;
      permissions?: string[];
      organization?: any;
      team?: any;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    organizationId?: string | null;
    teamId?: string | null;
    providerId?: string | null;
    permissions?: string[];
    organization?: any;
    team?: any;
  }
}

const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        org_domain: { label: "Organization Domain", type: "text" },
        login_type: { label: "Login Type", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const client = await clientPromise;
          const db = client.db("referradb");
          
          let user;

          // Multi-tenant login logic (v1.1: org membership in org_members, not on user)
          if (credentials.org_domain) {
            console.log('Looking for organization with domain/slug:', credentials.org_domain);
            // Organization-specific login
            const organization = await db.collection("organizations").findOne({
              $or: [
                { domain: credentials.org_domain },
                { slug: credentials.org_domain }
              ]
            });
            
            if (organization) {
              console.log('Found organization:', organization.name, 'ID:', organization._id);
              
              // v1.1: Find user by email only (org_id removed from users)
              user = await db.collection("users").findOne({
                email: credentials.email.toLowerCase()
              });
              
              if (user) {
                // v1.1: Verify user belongs to this organization via org_members
                const orgMember = await db.collection("org_members").findOne({
                  userId: user._id.toString(),
                  organizationId: organization._id.toString()
                });
                
                if (!orgMember) {
                  console.log('User not member of organization:', organization.name);
                  return null;
                }
                console.log('User lookup result: Found, verified org membership');
              } else {
                console.log('User lookup result: Not found');
              }
            } else {
              console.log('Organization not found for domain:', credentials.org_domain);
            }
          } else if (credentials.login_type === 'provider') {
            // v1.1: Provider login (role is in org_members now)
            console.log('Provider login attempt for:', credentials.email);
            user = await db.collection("users").findOne({
              email: credentials.email.toLowerCase()
            });
            console.log('Provider lookup result:', user ? 'Found' : 'Not found');
          } else {
            // v1.1: Just find user by email (role is in org_members)
            console.log('General login attempt for:', credentials.email);
            user = await db.collection("users").findOne({
              email: credentials.email.toLowerCase()
            });
            console.log('User lookup result:', user ? 'Found' : 'Not found');
          }

          if (!user) {
            console.log('User not found:', credentials.email);
            return null;
          }

          // Verify password (check both possible field names)
          const passwordToCheck = user.password || user.password_hash;
          if (!passwordToCheck) {
            console.log('No password set for:', credentials.email);
            return null;
          }
          
          const isPasswordValid = await bcrypt.compare(credentials.password, passwordToCheck);
          if (!isPasswordValid) {
            console.log('Invalid password for:', credentials.email);
            return null;
          }

          // v1.1: Get org membership from org_members junction table
          const orgMember = await db.collection("org_members").findOne({
            userId: user._id.toString()
          });

          if (!orgMember) {
            console.log('No org_member record found for user:', user.email);
            return null;
          }

          console.log('Found org_member:', orgMember.role, 'for org:', orgMember.organizationId);

          // Get organization data (organizationId is a UUID string, not ObjectId)
          let organizationData = null;
          try {
            organizationData = await db.collection("organizations").findOne({
              _id: orgMember.organizationId
            });
            console.log('Found organization:', organizationData?.name);
          } catch (error) {
            console.log('Error fetching organization:', error);
          }

          // Get team data if user has teamId (teamId is also a UUID string)
          let teamData = null;
          if (orgMember.teamId) {
            try {
              teamData = await db.collection("teams").findOne({
                _id: orgMember.teamId
              });
              console.log('Found team:', teamData?.name);
            } catch (error) {
              console.log('Error fetching team:', error);
            }
          }

          console.log('Login successful for:', credentials.email, 'Role:', orgMember.role);

          return {
            id: user._id.toString(),
            name: user.name || user.email,
            email: user.email,
            role: orgMember.role,
            organizationId: orgMember.organizationId,
            teamId: orgMember.teamId || null,
            providerId: orgMember.providerId || null,
            permissions: [],
            organization: organizationData ? {
              id: organizationData._id.toString(),
              name: organizationData.name,
              domain: organizationData.domain,
              plan: organizationData.subscription_plan || 'starter',
              settings: organizationData.settings || {}
            } : null,
            team: teamData ? {
              id: teamData._id.toString(),
              name: teamData.name
            } : null
          };

        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // v1.1: Store all user data in JWT for multi-tenant support
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.teamId = user.teamId;
        token.providerId = user.providerId;
        token.permissions = user.permissions;
        token.organization = user.organization;
        token.team = user.team;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        // v1.1: Pass all data to session for client use
        session.user.id = token.id as string;
        session.user.role = token.role as 'PLATFORM_ADMIN' | 'ORG_ADMIN' | 'SUPERVISOR' | 'CASE_MANAGER' | 'PROVIDER_USER';
        session.user.organizationId = token.organizationId as string;
        session.user.teamId = token.teamId as string;
        session.user.providerId = token.providerId as string;
        session.user.permissions = token.permissions as string[];
        session.user.organization = token.organization;
        session.user.team = token.team;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log('NextAuth redirect called with:', { url, baseUrl });
      
      // Allow relative callback URLs
      if (url.startsWith("/")) {
        return baseUrl + url;
      }
      
      // Allow same origin URLs
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      
      // Default redirect to home - let client-side handle role-based routing
      return baseUrl;
    },
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout", 
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export { authOptions };
export default authOptions;
