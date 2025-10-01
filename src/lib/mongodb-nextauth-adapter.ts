/**
 * Custom MongoDB Adapter for NextAuth.js
 * Compatible with MongoDB v6+ and our existing infrastructure
 */

import { MongoClient, ObjectId } from "mongodb";
import type { Adapter, AdapterUser, AdapterAccount, AdapterSession, VerificationToken } from "next-auth/adapters";

export interface MongoDBAdapterOptions {
  databaseName?: string;
  collections?: {
    Users?: string;
    Accounts?: string;
    Sessions?: string;
    VerificationTokens?: string;
  };
}

export function MongoDBAdapter(
  clientPromise: Promise<MongoClient>,
  options: MongoDBAdapterOptions = {}
): Adapter {
  const {
    databaseName = "referradb",
    collections = {},
  } = options;

  const {
    Users = "users",
    Accounts = "accounts", 
    Sessions = "sessions",
    VerificationTokens = "verification_tokens",
  } = collections;

  return {
    async createUser(user) {
      const client = await clientPromise;
      const db = client.db(databaseName);
      
      const doc = {
        ...user,
        _id: new ObjectId(),
        emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
      };
      
      await db.collection(Users).insertOne(doc);
      return { ...doc, id: doc._id.toString() };
    },

    async getUser(id) {
      const client = await clientPromise;
      const db = client.db(databaseName);
      
      const user = await db.collection(Users).findOne({ _id: new ObjectId(id) });
      if (!user) return null;
      
      return {
        ...user,
        id: user._id.toString(),
        emailVerified: user.emailVerified?.toISOString() ?? null,
      };
    },

    async getUserByEmail(email) {
      const client = await clientPromise;
      const db = client.db(databaseName);
      
      const user = await db.collection(Users).findOne({ email });
      if (!user) return null;
      
      return {
        ...user,
        id: user._id.toString(),
        emailVerified: user.emailVerified?.toISOString() ?? null,
      };
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const client = await clientPromise;
      const db = client.db(databaseName);
      
      const account = await db.collection(Accounts).findOne({
        providerAccountId,
        provider,
      });
      
      if (!account) return null;
      
      const user = await db.collection(Users).findOne({ _id: new ObjectId(account.userId) });
      if (!user) return null;
      
      return {
        ...user,
        id: user._id.toString(),
        emailVerified: user.emailVerified?.toISOString() ?? null,
      };
    },

    async updateUser(user) {
      const client = await clientPromise;
      const db = client.db(databaseName);
      
      const { id, ...updateData } = user;
      
      if (updateData.emailVerified) {
        updateData.emailVerified = new Date(updateData.emailVerified);
      }
      
      const result = await db.collection(Users).findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: "after" }
      );
      
      if (!result.value) throw new Error("User not found");
      
      return {
        ...result.value,
        id: result.value._id.toString(),
        emailVerified: result.value.emailVerified?.toISOString() ?? null,
      };
    },

    async deleteUser(userId) {
      const client = await clientPromise;
      const db = client.db(databaseName);
      
      const id = new ObjectId(userId);
      
      // Delete user and related data
      await Promise.all([
        db.collection(Users).deleteOne({ _id: id }),
        db.collection(Accounts).deleteMany({ userId }),
        db.collection(Sessions).deleteMany({ userId }),
      ]);
      
      return;
    },

    async linkAccount(account) {
      const client = await clientPromise;
      const db = client.db(databaseName);
      
      const doc = {
        ...account,
        _id: new ObjectId(),
      };
      
      await db.collection(Accounts).insertOne(doc);
      return { ...doc, id: doc._id.toString() };
    },

    async unlinkAccount({ providerAccountId, provider }) {
      const client = await clientPromise;
      const db = client.db(databaseName);
      
      const result = await db.collection(Accounts).findOneAndDelete({
        providerAccountId,
        provider,
      });
      
      return result.value ? { ...result.value, id: result.value._id.toString() } : undefined;
    },

    async createSession(session) {
      const client = await clientPromise;
      const db = client.db(databaseName);
      
      const doc = {
        ...session,
        _id: new ObjectId(),
        expires: new Date(session.expires),
      };
      
      await db.collection(Sessions).insertOne(doc);
      return { ...doc, id: doc._id.toString() };
    },

    async getSessionAndUser(sessionToken) {
      const client = await clientPromise;
      const db = client.db(databaseName);
      
      const session = await db.collection(Sessions).findOne({ sessionToken });
      if (!session) return null;
      
      const user = await db.collection(Users).findOne({ _id: new ObjectId(session.userId) });
      if (!user) return null;
      
      return {
        session: {
          ...session,
          id: session._id.toString(),
          expires: session.expires.toISOString(),
        },
        user: {
          ...user,
          id: user._id.toString(),
          emailVerified: user.emailVerified?.toISOString() ?? null,
        },
      };
    },

    async updateSession(session) {
      const client = await clientPromise;
      const db = client.db(databaseName);
      
      const { sessionToken, ...updateData } = session;
      
      if (updateData.expires) {
        updateData.expires = new Date(updateData.expires);
      }
      
      const result = await db.collection(Sessions).findOneAndUpdate(
        { sessionToken },
        { $set: updateData },
        { returnDocument: "after" }
      );
      
      if (!result.value) return null;
      
      return {
        ...result.value,
        id: result.value._id.toString(),
        expires: result.value.expires.toISOString(),
      };
    },

    async deleteSession(sessionToken) {
      const client = await clientPromise;
      const db = client.db(databaseName);
      
      const result = await db.collection(Sessions).findOneAndDelete({ sessionToken });
      return result.value ? { ...result.value, id: result.value._id.toString() } : null;
    },

    async createVerificationToken(token) {
      const client = await clientPromise;
      const db = client.db(databaseName);
      
      const doc = {
        ...token,
        _id: new ObjectId(),
        expires: new Date(token.expires),
      };
      
      await db.collection(VerificationTokens).insertOne(doc);
      return { ...doc, id: doc._id.toString() };
    },

    async useVerificationToken({ identifier, token }) {
      const client = await clientPromise;
      const db = client.db(databaseName);
      
      const result = await db.collection(VerificationTokens).findOneAndDelete({
        identifier,
        token,
      });
      
      if (!result.value) return null;
      
      return {
        ...result.value,
        id: result.value._id.toString(),
        expires: result.value.expires.toISOString(),
      };
    },
  };
}
