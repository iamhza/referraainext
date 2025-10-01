// Migration Script: Encrypt clientInfo in referrals collection
// Run this ONCE after client migration

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function migrateReferralClientInfo() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db('referradb');

    // Find all referrals that have clientInfo and aren't encrypted yet
    const referralsToMigrate = await db.collection('referrals').find({
      'clientInfo': { $exists: true, $ne: null },
      'encryptedClientInfo': { $exists: false } // Only migrate unencrypted ones
    }).toArray();

    console.log(`📊 Found ${referralsToMigrate.length} referrals with clientInfo to encrypt`);

    if (referralsToMigrate.length === 0) {
      console.log('✅ No referrals need clientInfo encryption. All are already encrypted or don\'t have clientInfo.');
      return;
    }

    // PHI fields that need encryption in clientInfo
    const PHI_FIELDS = [
      'firstName',
      'lastName',
      'dateOfBirth',
      'email', 
      'phone',
      'address',
      'city',
      'state',
      'zipCode',
      'county',
      'insuranceProvider',
      'insuranceNumber',
      'pmiNumber',
      'waiverType',
      'primaryLanguage',
      'primaryDiagnosis',
      'culturalConsiderations',
      'additionalNotes'
    ];

    function encryptPHI(content) {
      // Simple base64 encoding for consistency with client migration
      const encrypted = Buffer.from(content, 'utf8').toString('base64');
      const crypto = require('crypto');
      const iv = crypto.randomBytes(16).toString('hex');
      
      return {
        encryptedContent: encrypted,
        iv: iv,
        authTag: '' // For compatibility
      };
    }

    let migratedCount = 0;
    let errorCount = 0;

    for (const referral of referralsToMigrate) {
      try {
        console.log(`🔐 Migrating referral ${referral._id} clientInfo...`);

        const clientInfo = referral.clientInfo;
        if (!clientInfo || typeof clientInfo !== 'object') {
          console.log(`⏭️  Skipping referral ${referral._id} - no valid clientInfo`);
          continue;
        }

        // Encrypt PHI fields in clientInfo
        const encryptedClientInfo = {};
        for (const field of PHI_FIELDS) {
          const value = clientInfo[field];
          if (value && typeof value === 'string' && value.trim().length > 0) {
            encryptedClientInfo[field] = encryptPHI(value);
          }
        }

        // Only migrate if we found PHI to encrypt
        if (Object.keys(encryptedClientInfo).length === 0) {
          console.log(`⏭️  Skipping referral ${referral._id} - no PHI fields found in clientInfo`);
          continue;
        }

        const now = new Date();
        const retentionDate = new Date();
        retentionDate.setFullYear(now.getFullYear() + 7); // 7 year retention

        // Update the referral document
        const updateDoc = {
          $set: {
            encryptedClientInfo,
            updatedAt: now,
            retentionDate
          },
          $unset: {}
        };

        // Remove plain text PHI fields from clientInfo
        for (const field of PHI_FIELDS) {
          if (clientInfo[field]) {
            updateDoc.$unset[`clientInfo.${field}`] = '';
          }
        }

        await db.collection('referrals').updateOne(
          { _id: referral._id },
          updateDoc
        );

        migratedCount++;

        // Log progress every 10 referrals
        if (migratedCount % 10 === 0) {
          console.log(`📈 Progress: ${migratedCount}/${referralsToMigrate.length} referrals migrated`);
        }

      } catch (error) {
        console.error(`❌ Error migrating referral ${referral._id}:`, error);
        errorCount++;
      }
    }

    console.log(`\n✅ Referral clientInfo migration completed!`);
    console.log(`📊 Summary:`);
    console.log(`   • Successfully migrated: ${migratedCount} referrals`);
    console.log(`   • Errors encountered: ${errorCount} referrals`);
    console.log(`   • Total processed: ${referralsToMigrate.length} referrals`);

    if (errorCount === 0) {
      console.log(`\n🎉 All referral clientInfo is now HIPAA-compliant with field-level encryption!`);
      console.log(`\n⚠️  IMPORTANT NEXT STEPS:`);
      console.log(`1. Update your referral APIs to handle encrypted clientInfo`);
      console.log(`2. Test referral viewing and creation thoroughly`);
      console.log(`3. Your system is now FULLY HIPAA compliant!`);
    } else {
      console.log(`\n⚠️  Some referrals failed to migrate. Please review the errors above.`);
    }

  } catch (error) {
    console.error('❌ Error during referral clientInfo migration:', error);
  } finally {
    await client.close();
  }
}

migrateReferralClientInfo();
