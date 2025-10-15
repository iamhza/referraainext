/**
 * Working NextAuth configuration with real user login and redirects
 */

import { NextAuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "./mongodb";
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

// Extend NextAuth types for multi-tenant organization system
declare module "next-auth" {
  interface User {
    id: string;
    role: 'platform_admin' | 'org_admin' | 'supervisor' | 'case_manager' | 'provider';
    org_id?: string | null;
    team_id?: string | null;
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
      specializations: string[];
    } | null;
  }
  
  interface Session {
    user: User & {
      id: string;
      role: string;
      org_id?: string | null;
      team_id?: string | null;
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
    org_id?: string | null;
    team_id?: string | null;
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

          // Multi-tenant login logic
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
              user = await db.collection("users").findOne({
                email: credentials.email.toLowerCase(),
                org_id: organization._id.toString()
              });
              console.log('User lookup result:', user ? 'Found' : 'Not found');
            } else {
              console.log('Organization not found for domain:', credentials.org_domain);
            }
          } else if (credentials.login_type === 'provider') {
            // Provider login (no org restriction)
            console.log('Provider login attempt for:', credentials.email);
            user = await db.collection("users").findOne({
              email: credentials.email.toLowerCase(),
              role: "provider"
            });
            console.log('Provider lookup result:', user ? 'Found' : 'Not found');
          } else {
            // Try platform admin first
            user = await db.collection("users").findOne({
              email: credentials.email.toLowerCase(),
              $or: [
                { role: "platform_admin" },
                { role: "admin" } // Support existing admin role
              ]
            });
            
            // Map legacy admin role to platform_admin
            if (user && user.role === "admin") {
              user.role = "platform_admin";
            }
            
            // If not admin, try to find ANY user with this email (sandbox users, users without org yet)
            if (!user) {
              console.log('Not a platform admin, checking for sandbox/org-less user');
              user = await db.collection("users").findOne({
                email: credentials.email.toLowerCase()
              });
              console.log('Sandbox/general user lookup:', user ? `Found (${user.role})` : 'Not found');
            }
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

          // Get organization data if user has org_id
          let organizationData = null;
          if (user.org_id) {
            try {
              // Try string ID first since our org IDs are stored as strings
              organizationData = await db.collection("organizations").findOne({
                _id: user.org_id
              });
              
              // If not found, try ObjectId conversion
              if (!organizationData && typeof user.org_id === 'string') {
                try {
                  const orgObjectId = new ObjectId(user.org_id);
                  organizationData = await db.collection("organizations").findOne({
                    _id: orgObjectId
                  });
                } catch (objIdError) {
                  console.log('ObjectId conversion failed:', objIdError);
                }
              }
              
              console.log('Found organization for user:', organizationData?.name);
            } catch (error) {
              console.log('Error fetching organization:', error);
            }
          }

          // Get team data if user has team_id
          let teamData = null;
          if (user.team_id) {
            try {
              // Try string ID first since our team IDs are stored as strings
              teamData = await db.collection("teams").findOne({
                _id: user.team_id
              });
              
              // If not found, try ObjectId conversion
              if (!teamData && typeof user.team_id === 'string') {
                try {
                  const teamObjectId = new ObjectId(user.team_id);
                  teamData = await db.collection("teams").findOne({
                    _id: teamObjectId
                  });
                } catch (objIdError) {
                  console.log('Team ObjectId conversion failed:', objIdError);
                }
              }
              
              console.log('Found team for user:', teamData?.name);
            } catch (error) {
              console.log('Error fetching team:', error);
            }
          }

          console.log('Login successful for:', credentials.email, 'Role:', user.role);

          return {
            id: user._id.toString(),
            name: user.full_name || user.name || user.email,
            email: user.email,
            role: user.role,
            org_id: user.org_id,
            team_id: user.team_id,
            permissions: user.permissions || [],
            organization: organizationData ? {
              id: organizationData._id.toString(),
              name: organizationData.name,
              domain: organizationData.domain,
              plan: organizationData.subscription_plan || 'starter',
              settings: organizationData.settings || {}
            } : null,
            team: teamData ? {
              id: teamData._id.toString(),
              name: teamData.name,
              specializations: teamData.specializations || []
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
        // Store all user data in JWT for multi-tenant support
        token.id = user.id;
        token.role = user.role;
        token.org_id = user.org_id;
        token.team_id = user.team_id;
        token.permissions = user.permissions;
        token.organization = user.organization;
        token.team = user.team;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        // Pass all data to session for client use
        session.user.id = token.id as string;
        session.user.role = token.role as 'platform_admin' | 'org_admin' | 'supervisor' | 'case_manager' | 'provider';
        session.user.org_id = token.org_id as string;
        session.user.team_id = token.team_id as string;
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
