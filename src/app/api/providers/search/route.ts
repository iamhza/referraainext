import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const county = searchParams.get('county');
    const city = searchParams.get('city');
    const service = searchParams.get('service');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'referra');
    const collection = db.collection('provider_services');

    // Build filter
    const filter: any = {};

    // Text search
    if (query && query.length > 0) {
      filter.$text = { $search: query };
    }

    // County filter
    if (county) {
      filter['address.county'] = county;
    }

    // City filter
    if (city) {
      filter['address.city'] = city;
    }

    // Service filter (partial match)
    if (service) {
      filter.serviceName = { $regex: service, $options: 'i' };
    }

    // Execute search with pagination
    const projection = query 
      ? { score: { $meta: 'textScore' } } 
      : {};

    const sort: any = query 
      ? { score: { $meta: 'textScore' } }
      : { providerName: 1, serviceName: 1 };

    const [results, total] = await Promise.all([
      collection
        .find(filter, { projection })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter)
    ]);

    // Get filter options for the current search
    const [counties, cities, services] = await Promise.all([
      collection.distinct('address.county', filter),
      collection.distinct('address.city', filter),
      collection.distinct('serviceName', filter)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        results: results.map(r => ({
          _id: r._id.toString(),
          providerName: r.providerName,
          serviceName: r.serviceName,
          locationName: r.locationName,
          address: r.address,
          contact: r.contact,
          features: r.features,
          shortDescription: r.shortDescription,
          eligibility: r.eligibility,
          areasServed: r.areasServed,
          providerWebsite: r.providerWebsite
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + results.length < total
        },
        filters: {
          counties: counties.filter(Boolean).sort(),
          cities: cities.filter(Boolean).sort(),
          services: services.filter(Boolean).sort().slice(0, 50) // Top 50 services
        }
      }
    });

  } catch (error: any) {
    console.error('Provider search error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search providers' },
      { status: 500 }
    );
  }
}





