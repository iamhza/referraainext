import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { WithId, Document } from 'mongodb';

interface ServiceDocument extends WithId<Document> {
  service: string;
  category?: 'residential' | 'nonResidential';
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

    // Categorize services based on the category field
    const residentialServices = services
      .filter(doc => doc.category === 'residential')
      .map(doc => doc.service);

    const nonResidentialServices = services
      .filter(doc => doc.category === 'nonResidential')
      .map(doc => doc.service);

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