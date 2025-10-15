/**
 * POST /api/auth/signup
 * 
 * Creates a new user account.
 * Used by sandbox signup flow.
 */

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['case_manager', 'supervisor', 'org_admin', 'provider']),
});

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // ========================================================================
    // 1. VALIDATE REQUEST
    // ========================================================================
    
    const body = await request.json();
    const validation = signupSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }
    
    const { email, password, name, role } = validation.data;
    
    // ========================================================================
    // 2. CHECK IF USER EXISTS
    // ========================================================================
    
    const client = await clientPromise;
    const db = client.db('referradb');
    
    const existingUser = await db.collection('users').findOne({
      email: email.toLowerCase(),
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }
    
    // ========================================================================
    // 3. HASH PASSWORD
    // ========================================================================
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    // ========================================================================
    // 4. CREATE USER
    // ========================================================================
    
    const newUser = {
      email: email.toLowerCase(),
      name,
      role,
      password_hash: passwordHash,
      org_id: null, // Will be set when sandbox is created
      team_id: null,
      tourCompleted: false,
      lastTourStepCompleted: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    const result = await db.collection('users').insertOne(newUser);
    
    console.log(`✅ User created: ${email} (${role})`);
    
    // ========================================================================
    // 5. RETURN SUCCESS
    // ========================================================================
    
    return NextResponse.json({
      success: true,
      userId: result.insertedId.toString(),
      user: {
        id: result.insertedId.toString(),
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    }, { status: 201 });
    
  } catch (error) {
    console.error('❌ Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}

