import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "./mongodb";
import { User } from "next-auth";
import { JWT } from "next-auth/jwt";

// Add custom fields to the User and JWT types
declare module "next-auth" {
  interface User {
    id: string;
    role: string;
  }
  
  interface Session {
    user: User & {
      id: string;
      role: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
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
      },
      async authorize(credentials) {
        // Add your authentication logic here
        // This is a placeholder - in a real app, you would validate credentials against your database
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Example of getting user from MongoDB - replace with your actual user retrieval logic
        const client = await clientPromise;
        const usersCollection = client.db("referradb").collection("users");
        const user = await usersCollection.findOne({ email: credentials.email });

        if (!user) {
          return null;
        }

        // In a real app, you'd verify the password with bcrypt or similar
        // This is a simplified example
        const isPasswordValid = user.password === credentials.password; // NEVER do this in production
        
        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role || "user",
          image: user.image || null,
        };
      },
    }),
    // Add other providers as needed
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
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