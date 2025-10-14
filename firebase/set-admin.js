/**
 * Set Admin Claims Script
 * 
 * This script gives a user full admin access to the platform.
 * 
 * Usage:
 * 1. Replace YOUR_USER_UID with your actual Firebase Auth UID
 * 2. Run: node firebase/set-admin.js
 * 3. Log out and log back in to the web app
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin with project ID
admin.initializeApp({
  projectId: 'adopt-a-young-parent'
});

async function setAdminClaims(uid) {
  try {
    console.log('🔧 Setting admin claims for user:', uid);
    
    // Set custom claims with full admin access
    await admin.auth().setCustomUserClaims(uid, {
      orgId: 'aayp-main',
      role: 'admin',
      scopes: [
        // Admin scopes
        'admin.read',
        'admin.write',
        
        // Finance scopes
        'finance.read',
        'finance.write',
        
        // HR scopes
        'hr.read',
        'hr.write',
        
        // Campaign scopes
        'campaign.read',
        'campaign.write',
        
        // Donor scopes
        'donor.read',
        'donor.write',
      ]
    });

    console.log('✅ Admin claims set successfully!\n');
    
    // Verify claims
    const user = await admin.auth().getUser(uid);
    console.log('📋 User Details:');
    console.log('   Email:', user.email);
    console.log('   UID:', user.uid);
    console.log('   Role:', user.customClaims?.role);
    console.log('   Organization:', user.customClaims?.orgId);
    console.log('   Scopes:', user.customClaims?.scopes?.length || 0);
    console.log('\n✨ User now has full admin access!');
    console.log('⚠️  Remember to log out and log back in to apply changes.\n');
    
  } catch (error) {
    console.error('❌ Error setting claims:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure you have Firebase Admin SDK credentials');
    console.error('2. Check that the UID is correct');
    console.error('3. Verify you have permission to modify users');
    process.exit(1);
  }
}

// ⚠️ REPLACE THIS WITH YOUR USER UID FROM FIREBASE CONSOLE
// Get it from: https://console.firebase.google.com/project/adopt-a-young-parent/authentication/users
const YOUR_USER_UID = 'PEifeIQuhHbAE34XoFOfZFrSJHt1';

// Validate UID
if (YOUR_USER_UID === 'PASTE_YOUR_UID_HERE') {
  console.error('❌ Error: You must replace YOUR_USER_UID with your actual Firebase Auth UID');
  console.error('\nSteps:');
  console.error('1. Go to: https://console.firebase.google.com/project/adopt-a-young-parent/authentication/users');
  console.error('2. Find your user in the list');
  console.error('3. Copy the UID (long string like: abc123xyz456...)');
  console.error('4. Replace "PASTE_YOUR_UID_HERE" in this file with your UID');
  console.error('5. Run this script again\n');
  process.exit(1);
}

// Run the script
setAdminClaims(YOUR_USER_UID)
  .then(() => {
    console.log('🎉 Done! You can now close this window.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
