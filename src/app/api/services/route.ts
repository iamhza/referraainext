import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb/client';
import { WithId, Document } from 'mongodb';

interface ServiceDocument extends WithId<Document> {
  name: string;           // Changed from 'service'
  category?: string;      // Keep for backward compatibility
  residential: boolean;   // Changed from 'category' - this is the actual field
  id?: string;           // Optional ID field
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Fetch all services from the services collection and sort by name
    const services = await db.collection('services')
      .find({})
      .sort({ name: 1 }) // Sort by 'name' field
      .toArray() as ServiceDocument[];

    console.log('🔍 Raw services from DB:', services); // Debug log

    // Categorize services based on the residential boolean field
    const residentialServices = services
      .filter(doc => doc.residential === true)
      .map(doc => doc.name);

    const nonResidentialServices = services
      .filter(doc => doc.residential === false)
      .map(doc => doc.name);

    console.log('🏠 Residential services:', residentialServices); // Debug log
    console.log('🏢 Non-residential services:', nonResidentialServices); // Debug log

    const categorizedServices = {
      residential: residentialServices,
      nonResidential: nonResidentialServices
    };

    return NextResponse.json({ services: categorizedServices });
  } catch (error) {
    console.error('Error fetching services:', error);
    
    // Return default services even if database fails
    const defaultServices = {
      residential: [
        'Assisted Living',
        'Memory Care',
        'Nursing Home',
        'Independent Living',
        'Group Home',
        'Adult Family Home',
        'Residential Treatment',
        'Hospice Care',
        'Skilled Nursing',
        'Rehabilitation Center'
      ],
      nonResidential: [
        'Home Health Care',
        'Personal Care Assistant',
        'Medical Transportation',
        'Meal Delivery',
        'Housekeeping',
        'Medication Management',
        'Physical Therapy',
        'Occupational Therapy',
        'Speech Therapy',
        'Mental Health Counseling',
        'Substance Abuse Treatment',
        'Medical Equipment',
        'Pharmacy Services',
        'Laboratory Services',
        'Imaging Services',
        'Specialist Consultation',
        'Primary Care',
        'Dental Care',
        'Vision Care',
        'Podiatry',
        'Social Work Services',
        'Case Management',
        'Support Groups',
        'Respite Care',
        'Adult Day Care',
        'Emergency Services',
        'Urgent Care',
        'Specialized Medical Care'
      ]
    };

    return NextResponse.json({ services: defaultServices });
  }
} 