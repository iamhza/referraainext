import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "./mongodb-nextauth-adapter";
import clientPromise from "./mongodb";
import { User } from "next-auth";
import { JWT } from "next-auth/jwt";
import { createAuditLog } from "./hipaa-audit";
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

// Note: Type declarations are in auth-minimal.ts to avoid conflicts



const authOptions: NextAuthOptions = {
  // Using JWT strategy without adapter for now (more reliable)
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        org_domain: { label: "Organization Domain", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const client = await clientPromise;
        const db = client.db("referradb");
        
        try {
          let user;
          let organization = null;
          let team = null;

          // Multi-tenant login logic
          if (credentials.org_domain) {
            // Organization-specific login
            organization = await db.collection("organizations").findOne({
              $or: [
                { domain: credentials.org_domain },
                { slug: credentials.org_domain }
              ]
            });
            
            if (organization) {
              user = await db.collection("users").findOne({
                email: credentials.email.toLowerCase(),
                org_id: organization._id.toString()
              });
            }
          } else {
            // Platform admin login (no org restriction)
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
          }

          if (!user) {
            console.log('User not found:', credentials.email);
            return null;
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash);
          if (!isPasswordValid) {
            console.log('Invalid password for:', credentials.email);
            return null;
          }

          // Get team data if user has team_id
          if (user.team_id) {
            team = await db.collection("teams").findOne({
              _id: new ObjectId(user.team_id)
            });
          }

          // Get organization data if not already fetched
          if (!organization && user.org_id) {
            organization = await db.collection("organizations").findOne({
              _id: new ObjectId(user.org_id)
            });
          }

          console.log('Login successful for:', credentials.email, 'Role:', user.role);

          return {
            id: user._id.toString(),
            name: user.full_name || user.name,
            email: user.email,
            role: user.role,
            org_id: user.org_id,
            team_id: user.team_id,
            permissions: user.permissions || [],
            organization: organization ? {
              id: organization._id.toString(),
              name: organization.name,
              plan: organization.subscription_plan || 'starter',
              settings: organization.settings || {}
            } : null,
            team: team ? {
              id: team._id.toString(),
              name: team.name,
              specializations: team.specializations || []
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
  },
  events: {
    async signOut({ session, token }) {
      // Create HIPAA audit log for logout
      if (token?.id) {
        await createAuditLog({
          userId: token.id as string,
          userRole: token.role as string,
          action: 'logout',
          resourceType: 'auth',
          resourceId: token.id as string,
          success: true,
          details: { 
            org_id: token.org_id,
            team_id: token.team_id
          }
        });
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default authOptions; 