const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { MongoClient } = require('mongodb');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'referra';

async function importProviderDirectory() {
  console.log('🚀 Starting Provider Directory Import...\n');
  
  // Read and parse CSV
  console.log('📄 Reading CSV file...');
  const csvContent = fs.readFileSync('New Merged Combined - Sheetgo_Master (2).csv', 'utf8');
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
    skip_records_with_error: true
  });
  
  console.log(`✓ Parsed ${records.length.toLocaleString()} records\n`);
  
  // Transform to clean MongoDB documents
  console.log('🔄 Transforming data...');
  const providers = [];
  let skipped = 0;
  
  records.forEach((row, idx) => {
    // Skip if missing critical fields
    if (!row.ServiceId || !row.ServiceName || !row.LocationId) {
      skipped++;
      return;
    }
    
    // Parse features into array (comma-separated)
    const features = row.Features 
      ? row.Features.split(',').map(f => f.trim()).filter(f => f)
      : [];
    
    // Parse areas served into array
    const areasServed = row.AreaServed
      ? row.AreaServed.split(',').map(a => a.trim()).filter(a => a)
      : [];
    
    // Create clean document (excluding ProviderId and Source)
    const provider = {
      // Service info
      serviceId: row.ServiceId?.trim(),
      serviceName: row.ServiceName?.trim(),
      
      // Provider info (excluding old ProviderId)
      providerName: row.ProviderName?.trim() || 'Unknown Provider',
      providerWebsite: row.ProviderWebSite?.trim() || null,
      providerType: row.ProviderType?.trim() || null,
      
      // Location info
      locationId: row.LocationId?.trim(),
      locationName: row.LocationName?.trim() || row.ProviderName?.trim(),
      
      address: {
        street: row.AddressLine1?.trim() || null,
        street2: row.AddressLine2?.trim() || null,
        city: row.City?.trim() || null,
        state: row.State?.trim() || 'MN',
        zipCode: row.ZipCode?.trim() || null,
        county: row.County?.trim() || null
      },
      
      mailAddress: {
        street: row.MailAddressLine1?.trim() || null,
        city: row.MailCity?.trim() || null,
        state: row.MailState?.trim() || null,
        zipCode: row.MailZipCode?.trim() || null
      },
      
      // Contact info
      contact: {
        email: row.EmailAddress?.trim() || null,
        phone: row.PhoneNumber?.trim() || null,
        phoneExt: row.PhoneNumberExt?.trim() || null
      },
      
      // Service details
      features: features,
      fullDescription: row.FullDescription?.trim() || null,
      shortDescription: row.ShortDescription?.trim() || null,
      providerServiceDescription: row.ProviderServiceDescription?.trim() || null,
      
      // Eligibility & Application
      eligibility: row.Eligibility?.trim() || null,
      application: row.Application?.trim() || null,
      fee: row.Fee?.trim() || null,
      areasServed: areasServed,
      
      // Metadata (excluding Source field)
      createDate: row.CreateDate || null,
      modifyDate: row.ModifyDate || null,
      
      // Search optimization - combined text for better search
      searchText: [
        row.ProviderName,
        row.ServiceName,
        row.LocationName,
        row.ShortDescription,
        ...(features || []),
        row.City,
        row.County
      ].filter(Boolean).join(' ').toLowerCase(),
      
      // Timestamps
      importedAt: new Date()
    };
    
    providers.push(provider);
  });
  
  console.log(`✓ Transformed ${providers.length.toLocaleString()} documents`);
  console.log(`  Skipped ${skipped.toLocaleString()} incomplete records\n`);
  
  // Connect to MongoDB
  console.log('🔌 Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');
    
    const db = client.db(DB_NAME);
    const collection = db.collection('provider_services');
    
    // Drop existing collection if exists
    console.log('🗑️  Dropping existing provider_services collection...');
    try {
      await collection.drop();
      console.log('✓ Dropped existing collection\n');
    } catch (err) {
      if (err.code !== 26) { // 26 = NamespaceNotFound
        throw err;
      }
      console.log('  (No existing collection to drop)\n');
    }
    
    // Insert documents
    console.log('💾 Inserting documents...');
    const result = await collection.insertMany(providers, { ordered: false });
    console.log(`✓ Inserted ${result.insertedCount.toLocaleString()} documents\n`);
    
    // Create indexes
    console.log('📇 Creating indexes...');
    
    // Text search index
    await collection.createIndex(
      { 
        providerName: 'text', 
        serviceName: 'text', 
        'address.city': 'text',
        'address.county': 'text',
        features: 'text',
        shortDescription: 'text'
      },
      { 
        name: 'provider_search_text',
        weights: {
          serviceName: 10,
          providerName: 8,
          'address.city': 5,
          features: 3,
          shortDescription: 2
        }
      }
    );
    console.log('  ✓ Text search index created');
    
    // Filter indexes
    await collection.createIndex({ 'address.county': 1 }, { name: 'county_idx' });
    await collection.createIndex({ 'address.city': 1 }, { name: 'city_idx' });
    await collection.createIndex({ serviceId: 1 }, { name: 'service_id_idx' });
    await collection.createIndex({ serviceName: 1 }, { name: 'service_name_idx' });
    await collection.createIndex({ locationId: 1 }, { name: 'location_id_idx' });
    console.log('  ✓ Filter indexes created\n');
    
    // Stats
    const totalCount = await collection.countDocuments();
    const uniqueProviders = await collection.distinct('providerName');
    const uniqueServices = await collection.distinct('serviceName');
    const uniqueCounties = await collection.distinct('address.county');
    const uniqueCities = await collection.distinct('address.city');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('           IMPORT COMPLETE');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📊 Statistics:');
    console.log(`  Total documents: ${totalCount.toLocaleString()}`);
    console.log(`  Unique providers: ${uniqueProviders.length.toLocaleString()}`);
    console.log(`  Unique services: ${uniqueServices.length.toLocaleString()}`);
    console.log(`  Unique counties: ${uniqueCounties.length}`);
    console.log(`  Unique cities: ${uniqueCities.length.toLocaleString()}`);
    
    console.log('\n✅ Provider directory is ready for search!\n');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run import
importProviderDirectory().catch(console.error);

