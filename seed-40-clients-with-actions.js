require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI not found in environment');
  process.exit(1);
}
const client = new MongoClient(uri);

// Sample first and last names for variety
const firstNames = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'William', 
                    'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia', 'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander',
                    'Abigail', 'Sebastian', 'Emily', 'Jack', 'Elizabeth', 'Owen', 'Sofia', 'Theodore', 'Avery', 'Aiden',
                    'Ella', 'Jackson', 'Scarlett', 'Samuel', 'Grace', 'David', 'Chloe', 'Joseph', 'Victoria', 'Carter'];

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                   'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
                   'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
                   'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'];

const serviceTypes = [
  'ARMHS (Adult Rehab Mental Health Services)',
  'Housing Stabilization Services',
  'Mental Health Counseling',
  'Home Delivered Meals',
  'Adult Day Services',
  'Case Management',
  'Supported Employment',
  'Independent Living Skills'
];

const actionScenarios = [
  { type: 'flag_concern', category: 'Safety', urgency: 'issue', description: 'Client reported safety concern at current residence' },
  { type: 'flag_concern', category: 'No-show', urgency: 'issue', description: 'Multiple no-shows for scheduled appointments' },
  { type: 'urgent_alert', urgency: 'urgent', description: 'Emergency housing needed - eviction notice received' },
  { type: 'request_documentation', doc_type: 'Progress Notes', urgency: 'normal', description: 'Need quarterly progress notes from provider' },
  { type: 'request_documentation', doc_type: 'Support Plan', urgency: 'normal', description: 'Updated support plan required for authorization' },
  { type: 'request_intake_date', urgency: 'normal', description: 'Need to schedule initial intake appointment' },
  { type: 'request_status_update', urgency: 'normal', description: 'Checking on service implementation progress' },
  { type: 'authorization_submitted', urgency: 'normal', description: 'Authorization packet submitted to county' },
  { type: 'switch_transfer_request', reason: 'Service Quality', urgency: 'normal', description: 'Client requesting different provider due to quality concerns' },
  { type: 'follow_up_reminder', urgency: 'normal', description: 'Follow up on housing application status' },
  { type: 'general_message', urgency: 'normal', description: 'Clarification needed on service schedule' },
  { type: 'roi_request', urgency: 'normal', description: 'Provider requesting ROI to coordinate care' }
];

async function seedClientsAndActions() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('referradb');
    
    // Get case manager
    const caseManager = await db.collection('users').findOne({ email: 'miknabil@yahoo.com' });
    if (!caseManager) {
      console.error('❌ Case manager not found');
      return;
    }
    
    console.log('✅ Found case manager:', caseManager.email);
    console.log('📋 Organization ID:', caseManager.organizationId);
    
    const createdClients = [];
    const createdActions = [];
    
    // Create 40 clients with various scenarios
    for (let i = 0; i < 40; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[Math.floor(i / firstNames.length)];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`;
      
      // Varied statuses
      const statuses = ['UNPLACED', 'REFERRAL_SENT', 'IN_PROCESS', 'ACTIVE_STABLE', 'ACTIVE_NEEDS_ATTENTION'];
      const status = statuses[i % statuses.length];
      
      // Create client
      const client = {
        firstName,
        lastName,
        email,
        phone: `555-${String(1000 + i).padStart(4, '0')}`,
        dateOfBirth: new Date(1960 + (i % 40), i % 12, (i % 28) + 1).toISOString(),
        address: `${100 + i} Main St`,
        city: 'Minneapolis',
        state: 'MN',
        zipCode: '55401',
        status,
        priority: ['high', 'medium', 'low'][i % 3],
        assignedTo: caseManager._id.toString(),
        organizationId: caseManager.organizationId,
        createdAt: new Date(Date.now() - (40 - i) * 24 * 60 * 60 * 1000), // Stagger creation dates
        updatedAt: new Date(Date.now() - (i % 7) * 24 * 60 * 60 * 1000), // Varied update times
        notes: `Client ${i + 1} - Various service needs`,
        tags: ['active', 'priority'],
        metadata: {}
      };
      
      const insertedClient = await db.collection('clients').insertOne(client);
      createdClients.push({ ...client, _id: insertedClient.insertedId });
      
      console.log(`✅ Created client ${i + 1}/40: ${firstName} ${lastName} (${status})`);
      
      // Create 1-3 actions per client with different scenarios
      const numActions = 1 + (i % 3); // 1, 2, or 3 actions per client
      
      for (let j = 0; j < numActions; j++) {
        const scenarioIndex = (i * 3 + j) % actionScenarios.length;
        const scenario = actionScenarios[scenarioIndex];
        
        // Determine if action is overdue (30% chance)
        const isOverdue = i % 10 < 3;
        const targetDate = isOverdue 
          ? new Date(Date.now() - (1 + (i % 5)) * 24 * 60 * 60 * 1000) // 1-5 days ago
          : new Date(Date.now() + (1 + (i % 7)) * 24 * 60 * 60 * 1000); // 1-7 days from now
        
        // Create action
        const action = {
          clientId: insertedClient.insertedId.toString(),
          contextType: 'general',
          type: scenario.type,
          title: getActionTitle(scenario.type),
          description: scenario.description,
          status: 'pending',
          urgency: scenario.urgency,
          createdBy: caseManager._id.toString(),
          createdByRole: 'case_manager',
          createdByName: caseManager.name || caseManager.email,
          createdAt: new Date(Date.now() - (i % 10) * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - (i % 10) * 24 * 60 * 60 * 1000),
          targetDate: targetDate.toISOString(),
          data: getActionData(scenario),
          routing: {
            primaryRecipient: 'case_manager',
            recipientIds: [caseManager._id.toString()]
          }
        };
        
        // Add service context for some actions
        if (i % 3 === 0) {
          action.serviceType = serviceTypes[i % serviceTypes.length];
        }
        
        const insertedAction = await db.collection('actions').insertOne(action);
        createdActions.push({ ...action, _id: insertedAction.insertedId });
      }
    }
    
    console.log('\n✅ Successfully created:');
    console.log(`   📊 ${createdClients.length} clients`);
    console.log(`   ⚡ ${createdActions.length} pending actions`);
    
    // Show action breakdown
    const actionTypes = {};
    createdActions.forEach(a => {
      actionTypes[a.type] = (actionTypes[a.type] || 0) + 1;
    });
    
    console.log('\n📋 Action Breakdown:');
    Object.entries(actionTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
    
    // Show urgency breakdown
    const urgentCount = createdActions.filter(a => a.urgency === 'urgent').length;
    const issueCount = createdActions.filter(a => a.urgency === 'issue').length;
    const overdueCount = createdActions.filter(a => new Date(a.targetDate) < new Date()).length;
    
    console.log('\n🚨 Priority Breakdown:');
    console.log(`   Issues: ${issueCount}`);
    console.log(`   Urgent: ${urgentCount}`);
    console.log(`   Overdue: ${overdueCount}`);
    
    console.log('\n✅ Done! Open Priority Hub to see all actions grouped by type.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

function getActionTitle(type) {
  const titles = {
    'flag_concern': 'Flag Concern / Issue',
    'urgent_alert': 'Urgent Alert',
    'request_documentation': 'Request Documentation',
    'request_intake_date': 'Request Intake Date',
    'request_status_update': 'Request Status Update',
    'authorization_submitted': 'Authorization Submitted',
    'switch_transfer_request': 'Switch/Transfer Request',
    'follow_up_reminder': 'Follow-Up Reminder',
    'general_message': 'General Message',
    'roi_request': 'Request ROI'
  };
  return titles[type] || type;
}

function getActionData(scenario) {
  const data = {};
  
  if (scenario.category) {
    data.category = scenario.category;
  }
  
  if (scenario.doc_type) {
    data.doc_type = scenario.doc_type;
  }
  
  if (scenario.reason) {
    data.reason = scenario.reason;
  }
  
  data.notes = scenario.description;
  
  return data;
}

// Run the seeding
seedClientsAndActions();

