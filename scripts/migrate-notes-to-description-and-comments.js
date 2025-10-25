#!/usr/bin/env node
// Migration: Move legacy action.notes into description (if empty) or into comments
// Usage: node scripts/migrate-notes-to-description-and-comments.js

const { MongoClient, ObjectId } = require('mongodb');

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/referradb';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const dbNameEnv = process.env.MONGODB_DB;
    const dbNameFromUri = (uri.split('/').pop() || '').split('?')[0] || 'referradb';
    const dbName = dbNameEnv || dbNameFromUri || 'referradb';
    const db = client.db(dbName);
    const actions = db.collection('actions');

    const cursor = actions.find({ notes: { $exists: true, $ne: '' } });
    let updated = 0;

    while (await cursor.hasNext()) {
      const action = await cursor.next();
      const notes = (action.notes || '').trim();
      if (!notes) continue;

      const updates = { $unset: { notes: '' }, $set: { updatedAt: new Date().toISOString() } };

      if (!action.description || !String(action.description).trim()) {
        // Prefer placing notes into description if description is empty
        updates.$set.description = notes;
      } else {
        // Otherwise append a system comment to preserve the content
        const systemComment = {
          _id: new ObjectId(),
          content: notes,
          createdBy: action.createdBy || 'system',
          createdByName: action.createdByName || 'System',
          createdByRole: 'case_manager',
          createdAt: new Date().toISOString(),
        };
        updates.$push = { comments: systemComment };
      }

      await actions.updateOne({ _id: action._id }, updates);
      updated += 1;
    }

    console.log(`Migration complete. Updated ${updated} actions.`);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

run();


