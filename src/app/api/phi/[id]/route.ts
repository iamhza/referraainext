import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db("referradb");
    
    const phiData = await db.collection("phi").findOne({
      _id: new ObjectId(params.id)
    });

    if (!phiData) {
      return NextResponse.json(
        { error: 'PHI data not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: phiData });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching PHI data' },
      { status: 500 }
    );
  }
} 