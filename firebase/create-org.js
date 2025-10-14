/**
 * Create Organization Document
 * 
 * This script creates the organization document in Firestore.
 * 
 * Usage: node firebase/create-org.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'adopt-a-young-parent'
});

const db = admin.firestore();

async function createOrganization() {
  try {
    console.log('🏢 Creating organization document...');
    
    const orgData = {
      name: 'ADOPT A YOUNG PARENT',
      ein: '83-0297893',
      stateEntityId: '803297893',
      filingNumber: '224860800370',
      jurisdiction: 'Michigan',
      filingReceived: '2024-11-08',
      filingEffective: '2024-11-19',
      address: {
        street: '',
        city: '',
        state: 'MI',
        zip: ''
      },
      contact: {
        email: 'info@adoptayoungparent.org',
        phone: ''
      },
      branding: {
        primaryColor: '#667eea',
        secondaryColor: '#764ba2',
        logo: ''
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('orgs').doc('aayp-main').set(orgData);

    console.log('✅ Organization document created successfully!');
    console.log('\n📋 Organization Details:');
    console.log('   ID: aayp-main');
    console.log('   Name:', orgData.name);
    console.log('   EIN:', orgData.ein);
    console.log('   State ID:', orgData.stateEntityId);
    console.log('   Jurisdiction:', orgData.jurisdiction);
    console.log('\n✨ Organization is ready!');
    
  } catch (error) {
    console.error('❌ Error creating organization:', error.message);
    process.exit(1);
  }
}

// Run the script
createOrganization()
  .then(() => {
    console.log('\n🎉 Done! You can now close this window.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
