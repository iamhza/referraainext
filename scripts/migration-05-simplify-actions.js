/**
 * Migration 05: Simplify Actions to v1.1 Model
 * 
 * Simplifies actions from 18 rich types to 4 simple types:
 * - REQUEST_INTAKE
 * - REQUEST_UPDATE
 * - REQUEST_DOCUMENT
 * - GENERAL_MESSAGE
 * 
 * Maps existing actions to new simplified structure.
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'referradb';
  const client = new MongoClient(uri);

  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(dbName);

    console.log('\n📋 Migration 05: Simplify actions to v1.1 model');
    console.log('='.repeat(60));

    // Action type mapping
    const typeMap = {
      // Intake related
      'request_intake_date': 'REQUEST_INTAKE',
      'confirm_intake_scheduled': 'REQUEST_INTAKE',
      
      // Status/Progress updates
      'request_status_update': 'REQUEST_UPDATE',
      'request_progress_update': 'REQUEST_UPDATE',
      'service_update': 'REQUEST_UPDATE',
      'confirm_service_started': 'REQUEST_UPDATE',
      'services_paused': 'REQUEST_UPDATE',
      'services_resumed': 'REQUEST_UPDATE',
      'services_ended': 'REQUEST_UPDATE',
      
      // Documentation
      'request_documentation': 'REQUEST_DOCUMENT',
      'submit_documentation': 'REQUEST_DOCUMENT',
      'request_auth_update': 'REQUEST_DOCUMENT',
      
      // Everything else
      'flag_concern': 'GENERAL_MESSAGE',
      'report_incident': 'GENERAL_MESSAGE',
      'authorization_submitted': 'GENERAL_MESSAGE',
      'authorization_approved': 'GENERAL_MESSAGE',
      'switch_transfer_request': 'GENERAL_MESSAGE',
      'urgent_alert': 'GENERAL_MESSAGE',
      'general_message': 'GENERAL_MESSAGE',
      'follow_up_reminder': 'GENERAL_MESSAGE',
      'roi_request': 'GENERAL_MESSAGE',
      'roi_approved': 'GENERAL_MESSAGE',
    };

    // Status mapping
    const statusMap = {
      'pending': 'OPEN',
      'completed': 'COMPLETED',
      'cancelled': 'CANCELLED',
    };

    // Priority mapping
    const priorityMap = {
      'low': 'NORMAL',
      'medium': 'NORMAL',
      'normal': 'NORMAL',
      'high': 'HIGH',
      'critical': 'CRITICAL',
      'urgent': 'CRITICAL',
    };

    // Get all actions
    const actions = await db.collection('actions').find({}).toArray();
    console.log(`\n✅ Found ${actions.length} actions to migrate`);

    for (const action of actions) {
      // Map to new simplified structure
      const newType = typeMap[action.type] || 'GENERAL_MESSAGE';
      const newStatus = statusMap[action.status] || 'OPEN';
      const newPriority = priorityMap[action.urgency] || 'NORMAL';

      // Build request payload (consolidate notes and data)
      const requestPayload = {
        notes: action.description || action.notes || '',
        docType: action.data?.doc_type || action.data?.document_type || null,
        ...action.data,  // Include other custom fields
      };

      // Build response payload from comments
      let responsePayload = null;
      if (action.comments && action.comments.length > 0) {
        const lastComment = action.comments[action.comments.length - 1];
        responsePayload = {
          notes: lastComment.content,
          documentId: null,
        };
      }

      const updates = {
        $set: {
          // Simplified type
          type: newType,
          
          // Link to subject (service relationship)
          subjectType: 'SERVICE_RELATIONSHIP',
          subjectId: action.contextId || null,
          
          // Simplified status and priority
          status: newStatus,
          priority: newPriority,
          
          // Payloads
          requestPayload: requestPayload,
          responsePayload: responsePayload,
          
          // Rename fields
          createdByMemberId: action.createdBy,
          completedByMemberId: action.completedAt ? action.createdBy : null,
          dueAt: action.targetDate || null,
          
          updatedAt: new Date(),
        },
        $unset: {
          // Remove old fields
          contextType: '',
          contextId: '',
          title: '',
          description: '',
          urgency: '',
          targetDate: '',
          scheduledDate: '',
          data: '',
          comments: '',
          routing: '',
          serviceType: '',
          providerId: '',
        }
      };

      await db.collection('actions').updateOne(
        { _id: action._id },
        updates
      );
    }

    console.log(`✅ Simplified ${actions.length} actions`);

    // Create indexes
    await db.collection('actions').createIndex({ organizationId: 1, subjectId: 1 });
    await db.collection('actions').createIndex({ subjectType: 1, subjectId: 1 });
    await db.collection('actions').createIndex({ status: 1 });
    await db.collection('actions').createIndex({ priority: 1 });
    await db.collection('actions').createIndex({ createdByMemberId: 1 });
    console.log('✅ Created indexes on actions');

    console.log('\n✨ Migration 05 complete!');
    console.log('   Actions simplified from 18 types to 4 types:');
    console.log('   - REQUEST_INTAKE');
    console.log('   - REQUEST_UPDATE');
    console.log('   - REQUEST_DOCUMENT');
    console.log('   - GENERAL_MESSAGE');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed\n');
  }
}

run();

