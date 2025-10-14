/**
 * Seed Data Script for ADOPT A YOUNG PARENT
 * 
 * This script creates initial data for development and testing
 * 
 * SETUP REQUIRED:
 * 1. Download service account key from Firebase Console:
 *    - Go to Project Settings > Service Accounts
 *    - Click "Generate new private key"
 *    - Save as: firebase/serviceAccountKey.json
 * 2. Run: npx ts-node firebase/seed-data.ts
 * 
 * NOTE: serviceAccountKey.json is gitignored for security
 */

import * as admin from 'firebase-admin';

// Import service account key (download from Firebase Console first)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const db = admin.firestore();

async function seedData() {
  console.log('🌱 Starting data seeding...\n');

  try {
    // 1. Create Organization
    console.log('📋 Creating organization...');
    const orgRef = db.collection('orgs').doc('aayp-main');
    await orgRef.set({
      name: 'ADOPT A YOUNG PARENT',
      ein: '83-0297893',
      stateEntityId: '803297893',
      state: 'MI',
      city: 'Detroit',
      zip: '48201',
      address: '123 Main St',
      mission: 'Supporting young parents in achieving their educational and career goals',
      programs: [
        'Educational Support',
        'Career Development',
        'Childcare Assistance',
        'Mental Health Services',
      ],
      createdAt: admin.firestore.Timestamp.now(),
    });
    console.log('✅ Organization created\n');

    // 2. Create Roles
    console.log('👥 Creating roles...');
    const roles = [
      {
        id: 'super_admin',
        name: 'Super Admin',
        scopes: ['admin.read', 'admin.write', 'finance.read', 'finance.write', 'campaign.read', 'campaign.write', 'donor.read', 'donor.write', 'hr.read', 'hr.write'],
      },
      {
        id: 'finance_admin',
        name: 'Finance Admin',
        scopes: ['finance.read', 'finance.write', 'donor.read'],
      },
      {
        id: 'fundraising_manager',
        name: 'Fundraising Manager',
        scopes: ['campaign.read', 'campaign.write', 'donor.read', 'donor.write'],
      },
      {
        id: 'fundraiser',
        name: 'Fundraiser',
        scopes: ['campaign.read', 'donor.read', 'donor.write'],
      },
      {
        id: 'hr_manager',
        name: 'HR Manager',
        scopes: ['hr.read', 'hr.write'],
      },
    ];

    for (const role of roles) {
      await orgRef.collection('roles').doc(role.id).set({
        ...role,
        createdAt: admin.firestore.Timestamp.now(),
      });
    }
    console.log(`✅ Created ${roles.length} roles\n`);

    // 3. Create Sample Campaigns
    console.log('🎯 Creating campaigns...');
    const campaigns = [
      {
        id: 'spring-2024',
        name: 'Spring 2024 Campaign',
        description: 'Annual spring fundraising campaign',
        goal: 50000,
        raised: 32500,
        status: 'active',
        startDate: admin.firestore.Timestamp.fromDate(new Date('2024-03-01')),
        endDate: admin.firestore.Timestamp.fromDate(new Date('2024-05-31')),
        orgId: 'aayp-main',
      },
      {
        id: 'year-end-2024',
        name: 'Year-End Giving 2024',
        description: 'Year-end fundraising campaign',
        goal: 100000,
        raised: 15000,
        status: 'active',
        startDate: admin.firestore.Timestamp.fromDate(new Date('2024-11-01')),
        endDate: admin.firestore.Timestamp.fromDate(new Date('2024-12-31')),
        orgId: 'aayp-main',
      },
    ];

    for (const campaign of campaigns) {
      await db.collection('campaigns').doc(campaign.id).set({
        ...campaign,
        createdAt: admin.firestore.Timestamp.now(),
      });
    }
    console.log(`✅ Created ${campaigns.length} campaigns\n`);

    // 4. Create Sample Donors
    console.log('💝 Creating donors...');
    const donors = [
      {
        id: 'donor-001',
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '555-0101',
        lifetime: 5000,
        lastDonation: admin.firestore.Timestamp.fromDate(new Date('2024-03-15')),
        consent: { fcm: true, email: true, sms: false },
        orgId: 'aayp-main',
      },
      {
        id: 'donor-002',
        name: 'Sarah Johnson',
        email: 'sarah.j@example.com',
        phone: '555-0102',
        lifetime: 10000,
        lastDonation: admin.firestore.Timestamp.fromDate(new Date('2024-04-20')),
        consent: { fcm: true, email: true, sms: true },
        orgId: 'aayp-main',
      },
      {
        id: 'donor-003',
        name: 'Michael Brown',
        email: 'mbrown@example.com',
        phone: '555-0103',
        lifetime: 2500,
        lastDonation: admin.firestore.Timestamp.fromDate(new Date('2024-02-10')),
        consent: { fcm: false, email: true, sms: false },
        orgId: 'aayp-main',
      },
    ];

    for (const donor of donors) {
      await db.collection('donors').doc(donor.id).set({
        ...donor,
        createdAt: admin.firestore.Timestamp.now(),
      });
    }
    console.log(`✅ Created ${donors.length} donors\n`);

    // 5. Create Sample Donations
    console.log('💰 Creating donations...');
    const donations = [
      {
        donorId: 'donor-001',
        amount: 1000,
        source: 'zeffy',
        campaignId: 'spring-2024',
        orgId: 'aayp-main',
        createdAt: admin.firestore.Timestamp.fromDate(new Date('2024-03-15')),
      },
      {
        donorId: 'donor-002',
        amount: 5000,
        source: 'zeffy',
        campaignId: 'spring-2024',
        orgId: 'aayp-main',
        createdAt: admin.firestore.Timestamp.fromDate(new Date('2024-04-20')),
      },
      {
        donorId: 'donor-003',
        amount: 500,
        source: 'stripe',
        campaignId: 'spring-2024',
        orgId: 'aayp-main',
        createdAt: admin.firestore.Timestamp.fromDate(new Date('2024-02-10')),
      },
    ];

    for (const donation of donations) {
      await db.collection('donations').add(donation);
    }
    console.log(`✅ Created ${donations.length} donations\n`);

    // 6. Create airSlate Workflows
    console.log('📄 Creating airSlate workflows...');
    const workflows = [
      {
        id: 'workflow-form990',
        orgId: 'aayp-main',
        workflowId: 'your-airslate-form990-workflow-id', // Replace with actual ID
        workflowName: 'form_990',
        templateId: 'your-template-id',
        status: 'active',
        createdAt: admin.firestore.Timestamp.now(),
      },
      {
        id: 'workflow-financials',
        orgId: 'aayp-main',
        workflowId: 'your-airslate-financials-workflow-id', // Replace with actual ID
        workflowName: 'financial_statements',
        templateId: 'your-template-id',
        status: 'active',
        createdAt: admin.firestore.Timestamp.now(),
      },
      {
        id: 'workflow-boardpack',
        orgId: 'aayp-main',
        workflowId: 'your-airslate-boardpack-workflow-id', // Replace with actual ID
        workflowName: 'board_pack',
        templateId: 'your-template-id',
        status: 'active',
        createdAt: admin.firestore.Timestamp.now(),
      },
    ];

    for (const workflow of workflows) {
      await db.collection('airslate_workflows').doc(workflow.id).set(workflow);
    }
    console.log(`✅ Created ${workflows.length} airSlate workflows\n`);

    // 7. Create Sample Tasks
    console.log('✅ Creating tasks...');
    const tasks = [
      {
        orgId: 'aayp-main',
        title: 'Follow up with John Smith',
        description: 'Thank donor for recent contribution',
        assignedTo: 'fundraiser-uid', // Replace with actual user ID
        donorId: 'donor-001',
        status: 'pending',
        dueAt: admin.firestore.Timestamp.fromDate(new Date('2024-12-20')),
        createdAt: admin.firestore.Timestamp.now(),
      },
      {
        orgId: 'aayp-main',
        title: 'Prepare year-end appeal',
        description: 'Draft year-end giving campaign materials',
        assignedTo: 'manager-uid', // Replace with actual user ID
        campaignId: 'year-end-2024',
        status: 'in_progress',
        dueAt: admin.firestore.Timestamp.fromDate(new Date('2024-12-15')),
        createdAt: admin.firestore.Timestamp.now(),
      },
    ];

    for (const task of tasks) {
      await db.collection('tasks').add(task);
    }
    console.log(`✅ Created ${tasks.length} tasks\n`);

    console.log('🎉 Data seeding completed successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Update airSlate workflow IDs in the workflows collection');
    console.log('   2. Create users via Firebase Authentication');
    console.log('   3. Assign custom claims to users');
    console.log('   4. Configure airSlate API credentials');
    console.log('   5. Deploy Firestore rules and indexes\n');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    // Cleanup
    await admin.app().delete();
  }
}

// Run the seed script
seedData()
  .then(() => {
    console.log('✅ Seed script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
