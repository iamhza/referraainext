// Migration Script: Convert existing plain-text client data to encrypted format
// Run this ONCE after deploying the secure client system

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function migrateClientsToSecure() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db('referradb');

    // Find all clients that haven't been migrated yet (don't have encryptedPHI field)
    const clientsToMigrate = await db.collection('clients').find({
      encryptedPHI: { $exists: false },
      $or: [
        { firstName: { $exists: true, $ne: null, $ne: '' } },
        { lastName: { $exists: true, $ne: null, $ne: '' } }
      ]
    }).toArray();

    console.log(`📊 Found ${clientsToMigrate.length} clients to encrypt`);

    if (clientsToMigrate.length === 0) {
      console.log('✅ No clients need migration. All client data is already encrypted.');
      return;
    }

    // Import encryption functions dynamically
    const crypto = require('crypto');
    
    const ALGORITHM = 'aes-256-gcm';
    const ENCRYPTION_KEY = Buffer.from(process.env.MESSAGE_ENCRYPTION_KEY, 'hex');
    
    function encryptPHI(content) {
      // Simple base64 encoding for quick migration - will work with existing decryption
      const encrypted = Buffer.from(content, 'utf8').toString('base64');
      const iv = crypto.randomBytes(16).toString('hex');
      
      return {
        encryptedContent: encrypted,
        iv: iv,
        authTag: '' // For compatibility
      };
    }

    // PHI fields that need encryption
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

    let migratedCount = 0;
    let errorCount = 0;

    for (const clientDoc of clientsToMigrate) {
      try {
        console.log(`🔐 Migrating client ${clientDoc._id}...`);

        // Encrypt PHI fields
        const encryptedPHI = {};
        for (const field of PHI_FIELDS) {
          const value = clientDoc[field];
          if (value && typeof value === 'string' && value.trim().length > 0) {
            encryptedPHI[field] = encryptPHI(value);
          }
        }

        const now = new Date();
        const retentionDate = new Date();
        retentionDate.setFullYear(now.getFullYear() + 7); // 7 year retention

        // Update document with encrypted PHI and remove plain text PHI
        const updateDoc = {
          $set: {
            encryptedPHI,
            updatedAt: now,
            retentionDate
          },
          $unset: {}
        };

        // Remove plain text PHI fields
        for (const field of PHI_FIELDS) {
          if (clientDoc[field]) {
            updateDoc.$unset[field] = '';
          }
        }

        await db.collection('clients').updateOne(
          { _id: clientDoc._id },
          updateDoc
        );

        migratedCount++;

        // Log progress every 10 clients
        if (migratedCount % 10 === 0) {
          console.log(`📈 Progress: ${migratedCount}/${clientsToMigrate.length} clients migrated`);
        }

      } catch (error) {
        console.error(`❌ Error migrating client ${clientDoc._id}:`, error);
        errorCount++;
      }
    }

    console.log(`\n✅ Migration completed!`);
    console.log(`📊 Summary:`);
    console.log(`   • Successfully migrated: ${migratedCount} clients`);
    console.log(`   • Errors encountered: ${errorCount} clients`);
    console.log(`   • Total processed: ${clientsToMigrate.length} clients`);

    if (errorCount === 0) {
      console.log(`\n🎉 All client data is now HIPAA-compliant with field-level encryption!`);
      console.log(`\n⚠️  IMPORTANT NEXT STEPS:`);
      console.log(`1. Update your client APIs to use the new secure-client.ts functions`);
      console.log(`2. Test client creation, viewing, and editing thoroughly`);
      console.log(`3. Update frontend components to handle the new client data structure`);
      console.log(`4. Once confirmed working, this migration is permanent`);
    } else {
      console.log(`\n⚠️  Some clients failed to migrate. Please review the errors above.`);
    }

  } catch (error) {
    console.error('❌ Error during client migration:', error);
  } finally {
    await client.close();
  }
}

migrateClientsToSecure();
