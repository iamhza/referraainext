#!/usr/bin/env node

/**
 * MongoDB Referrals Database Debug Script
 * 
 * This script helps you inspect and debug referral data in your MongoDB database.
 * It can show you the actual structure of stored referrals and help identify
 * why some fields might not be displaying in the UI.
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/referradb';
const DB_NAME = 'referradb'; // Using the same DB name as your app
const COLLECTION = 'referrals';

console.log(`🔗 Connecting to: ${MONGODB_URI}`);
console.log(`📁 Database: ${DB_NAME}`);

async function connectToDatabase() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return client.db(DB_NAME);
}

async function debugReferrals() {
  console.log('🔍 MongoDB Referrals Database Debug Script');
  console.log('==========================================\n');

  try {
    const db = await connectToDatabase();
    const collection = db.collection(COLLECTION);

    // Get total count
    const totalCount = await collection.countDocuments();
    console.log(`📊 Total referrals in database: ${totalCount}\n`);

    // Get the most recent referrals
    console.log('🕒 Most Recent Referrals (last 5):');
    console.log('==================================');
    
    const recentReferrals = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    recentReferrals.forEach((referral, index) => {
      console.log(`\n${index + 1}. Referral ID: ${referral._id}`);
      console.log(`   Status: ${referral.status}`);
      console.log(`   Service: ${referral.serviceType || referral.serviceDetails?.type || 'N/A'}`);
      console.log(`   Created: ${referral.createdAt ? new Date(referral.createdAt).toLocaleString() : 'N/A'}`);
      console.log(`   Client ID: ${referral.clientInfo?._id || referral.clientId || 'N/A'}`);
      
      // Show available top-level fields
      const topLevelFields = Object.keys(referral).filter(key => !key.startsWith('_'));
      console.log(`   Top-level fields: ${topLevelFields.join(', ')}`);
      
      // Check for nested structures
      if (referral.clientInfo) {
        const clientFields = Object.keys(referral.clientInfo);
        console.log(`   Client info fields: ${clientFields.join(', ')}`);
      }
      
      if (referral.serviceDetails) {
        const serviceFields = Object.keys(referral.serviceDetails);
        console.log(`   Service details fields: ${serviceFields.join(', ')}`);
      }
      
      if (referral.providerPreferences) {
        const providerFields = Object.keys(referral.providerPreferences);
        console.log(`   Provider preferences fields: ${providerFields.join(', ')}`);
      }
    });

    // Find the specific referral from your recent test
    console.log('\n\n🎯 Looking for your recent test referral...');
    console.log('==========================================');
    
    const testReferral = await collection.findOne({
      'clientInfo.firstName': 'Ubah',
      'clientInfo.lastName': 'Egeh',
      'serviceDetails.type': 'Semi-Independent Living Skills (SILS)'
    });

    if (testReferral) {
      console.log(`\n✅ Found your test referral: ${testReferral._id}`);
      console.log('\n📋 COMPLETE REFERRAL DATA:');
      console.log('==========================');
      console.log(JSON.stringify(testReferral, null, 2));
    } else {
      console.log('\n❌ Could not find your specific test referral');
      console.log('Searching for any referral with Ubah...');
      
      const ubahReferral = await collection.findOne({
        $or: [
          { 'clientInfo.firstName': { $regex: /ubah/i } },
          { 'clientInfo.firstName': { $regex: /Ubah/i } }
        ]
      });
      
      if (ubahReferral) {
        console.log(`\n✅ Found referral for Ubah: ${ubahReferral._id}`);
        console.log('\n📋 COMPLETE REFERRAL DATA:');
        console.log('==========================');
        console.log(JSON.stringify(ubahReferral, null, 2));
      }
    }

    // Check for data structure inconsistencies
    console.log('\n\n🔍 Data Structure Analysis:');
    console.log('===========================');
    
    const structureAnalysis = await collection.aggregate([
      {
        $project: {
          hasClientInfo: { $type: "$clientInfo" },
          hasServiceDetails: { $type: "$serviceDetails" },
          hasProviderPreferences: { $type: "$providerPreferences" },
          topLevelFields: { $objectToArray: "$$ROOT" },
          status: 1,
          createdAt: 1
        }
      },
      {
        $group: {
          _id: {
            hasClientInfo: "$hasClientInfo",
            hasServiceDetails: "$hasServiceDetails",
            hasProviderPreferences: "$hasProviderPreferences"
          },
          count: { $sum: 1 },
          examples: { $push: "$_id" }
        }
      }
    ]).toArray();

    structureAnalysis.forEach(group => {
      console.log(`\nStructure Pattern (${group.count} referrals):`);
      console.log(`  - clientInfo: ${group._id.hasClientInfo}`);
      console.log(`  - serviceDetails: ${group._id.hasServiceDetails}`);
      console.log(`  - providerPreferences: ${group._id.hasProviderPreferences}`);
      console.log(`  - Example IDs: ${group.examples.slice(0, 3).join(', ')}`);
    });

    // Check for missing fields in recent referrals
    console.log('\n\n🚨 Missing Fields Analysis:');
    console.log('============================');
    
    const fieldsToCheck = [
      'clientInfo.primaryLanguage',
      'clientInfo.waiverType', 
      'clientInfo.insurance',
      'clientInfo.mobilityStatus',
      'clientInfo.primaryDiagnosis',
      'clientInfo.culturalConsiderations',
      'providerPreferences.genderPreference'
    ];

    for (const field of fieldsToCheck) {
      const count = await collection.countDocuments({ [field]: { $exists: true, $ne: null, $ne: "" } });
      const percentage = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : 0;
      console.log(`  ${field}: ${count}/${totalCount} (${percentage}%)`);
    }

    console.log('\n✅ Database analysis complete!');
    
  } catch (error) {
    console.error('❌ Error connecting to database:', error);
  } finally {
    process.exit(0);
  }
}

// Command line options
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
MongoDB Referrals Debug Script

Usage: node debug-referrals-db.js [options]

Options:
  --help, -h     Show this help message
  --recent       Show only recent referrals
  --count        Show only counts
  --structure    Show only structure analysis

Examples:
  node debug-referrals-db.js
  node debug-referrals-db.js --recent
  node debug-referrals-db.js --structure
`);
  process.exit(0);
}

// Run the debug script
debugReferrals().catch(console.error);
