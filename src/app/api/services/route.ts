import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { WithId, Document } from 'mongodb';

interface ServiceDocument extends WithId<Document> {
  service: string;
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Fetch all services from the services collection and sort by service name
    const services = await db.collection('services')
      .find({})
      .sort({ service: 1 }) // 1 for ascending order
      .toArray() as ServiceDocument[];

    // Map to just return the service names
    const serviceNames = services.map(doc => doc.service);

    return NextResponse.json({ services: serviceNames });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
} 