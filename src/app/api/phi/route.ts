import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const phiData = await request.json();
    const client = await clientPromise;
    const db = client.db("referradb");

    const result = await db.collection("phi").insertOne({
      ...phiData,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      mongoPhiId: result.insertedId,
      message: 'PHI data stored successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error creating PHI record' },
      { status: 500 }
    );
  }
} 