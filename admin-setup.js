// Admin Setup Script for Holliday's Lawn & Garden
// Run this script in the browser console after logging into the admin account

// Wait for Firebase to be ready
async function waitForFirebase() {
  try {
    const initialized = await window.firebaseReadyPromise;
    if (!initialized) {
      throw new Error('Firebase failed to initialize');
    }
    return window.HollidayApp.db;
  } catch (error) {
    console.error('Error waiting for Firebase:', error);
    throw error;
  }
}

// Setup admin user role
async function setupAdminUser() {
  try {
    const db = await waitForFirebase();
    const currentUser = window.HollidayApp.currentUser;
    
    if (!currentUser) {
      throw new Error('No user is currently logged in. Please log in first.');
    }
    
    await db.collection('users').doc(currentUser.uid).set({
      email: currentUser.email,
      displayName: currentUser.displayName || 'Administrator',
      role: 'admin',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      isActive: true,
      permissions: [
        'read_all_data',
        'write_all_data',
        'manage_users',
        'view_reports',
        'manage_billing',
        'system_admin'
      ]
    }, { merge: true });
    
    console.log('✅ Admin user role configured successfully!');
    console.log('User:', currentUser.email);
    console.log('UID:', currentUser.uid);
    return true;
  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
    return false;
  }
}

// Add sample customers for testing
async function addSampleCustomers() {
  try {
    const db = await waitForFirebase();
    
    const sampleCustomers = [
      {
        email: 'john.doe@example.com',
        displayName: 'John Doe',
        role: 'customer',
        phone: '(504) 555-0123',
        address: {
          street: '123 Oak Street',
          city: 'New Orleans',
          state: 'LA',
          zip: '70112'
        },
        propertyDetails: {
          sizeSqFt: 5000,
          propertyType: 'residential',
          hasPool: false,
          hasSprinklers: true
        },
        preferences: {
          communicationMethod: 'email',
          serviceFrequency: 'bi-weekly'
        },
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        isActive: true
      },
      {
        email: 'jane.smith@example.com',
        displayName: 'Jane Smith',
        role: 'customer',
        phone: '(504) 555-0456',
        address: {
          street: '456 Maple Ave',
          city: 'Metairie',
          state: 'LA',
          zip: '70001'
        },
        propertyDetails: {
          sizeSqFt: 7500,
          propertyType: 'residential',
          hasPool: true,
          hasSprinklers: true
        },
        preferences: {
          communicationMethod: 'text',
          serviceFrequency: 'weekly'
        },
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        isActive: true
      }
    ];

    console.log('Adding sample customers...');
    
    const batch = db.batch();
    
    for (const customer of sampleCustomers) {
      // Create auth user first
      try {
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(
          customer.email, 
          'TempPass123!'  // Temporary password
        );
        
        // Add customer data to Firestore
        const customerRef = db.collection('users').doc(userCredential.user.uid);
        batch.set(customerRef, customer);
        
        // Send password reset email
        await firebase.auth().sendPasswordResetEmail(customer.email);
        
        console.log(`✅ Created customer: ${customer.displayName}`);
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`Customer ${customer.email} already exists, skipping...`);
          
          // Try to get the existing user's UID
          try {
            const userRecord = await firebase.auth().getUserByEmail(customer.email);
            const customerRef = db.collection('users').doc(userRecord.uid);
            batch.set(customerRef, customer, { merge: true });
            console.log(`Updated existing customer: ${customer.displayName}`);
          } catch (e) {
            console.error(`Error updating existing customer ${customer.email}:`, e);
          }
        } else {
          console.error(`Error creating customer ${customer.email}:`, error);
        }
      }
    }
    
    await batch.commit();
    console.log('✅ Sample customers added successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error adding sample customers:', error);
    return false;
  }
}

// Add a button to the admin interface to add sample customers
document.addEventListener('DOMContentLoaded', () => {
  const adminHeader = document.querySelector('.section-header');
  if (adminHeader) {
    const addSampleBtn = document.createElement('button');
    addSampleBtn.className = 'btn btn-secondary';
    addSampleBtn.textContent = 'Add Sample Customers';
    addSampleBtn.onclick = addSampleCustomers;
    adminHeader.appendChild(addSampleBtn);
  }
});

// Add sample service requests
async function addSampleServiceRequests() {
  const db = await waitForFirebase();
  
  // First get customer IDs
  const customersSnapshot = await db.collection('users').where('role', '==', 'customer').limit(3).get();
  
  if (customersSnapshot.empty) {
    console.log('No customers found. Please add customers first.');
    return false;
  }
  
  const customerIds = [];
  const customerData = {};
  customersSnapshot.forEach(doc => {
    customerIds.push(doc.id);
    customerData[doc.id] = doc.data();
  });
  
  const sampleRequests = [
    {
      customerId: customerIds[0],
      customerName: customerData[customerIds[0]].displayName,
      email: customerData[customerIds[0]].email,
      serviceType: 'Lawn Mowing & Trimming',
      description: 'Regular weekly lawn maintenance needed. Property has front and back yard with some landscaping.',
      status: 'pending',
      priority: 'normal',
      estimatedCost: 75,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      submittedBy: 'customer',
      hasUnreadFromCustomer: false,
      hasUnreadFromAdmin: true
    },
    {
      customerId: customerIds[1],
      customerName: customerData[customerIds[1]].displayName,
      email: customerData[customerIds[1]].email,
      serviceType: 'Landscape Design',
      description: 'Looking to redesign front yard landscaping. Interested in low-maintenance plants and modern design.',
      status: 'in-progress',
      priority: 'high',
      estimatedCost: 1200,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      submittedBy: 'customer',
      hasUnreadFromCustomer: true,
      hasUnreadFromAdmin: false
    }
  ];
  
  if (customerIds.length > 2) {
    sampleRequests.push({
      customerId: customerIds[2],
      customerName: customerData[customerIds[2]].displayName,
      email: customerData[customerIds[2]].email,
      serviceType: 'Seasonal Cleanup',
      description: 'Fall cleanup needed - leaf removal, pruning, and general yard preparation for winter.',
      status: 'completed',
      priority: 'normal',
      estimatedCost: 150,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      submittedBy: 'customer',
      hasUnreadFromCustomer: false,
      hasUnreadFromAdmin: false
    });
  }
  
  try {
    const batch = db.batch();
    
    sampleRequests.forEach(request => {
      const requestRef = db.collection('service_requests').doc();
      batch.set(requestRef, request);
    });
    
    await batch.commit();
    console.log('✅ Sample service requests added successfully!');
    console.log(`Added ${sampleRequests.length} service requests to the database.`);
    return true;
  } catch (error) {
    console.error('❌ Error adding sample service requests:', error);
    return false;
  }
}

// Main setup function
async function runCompleteSetup() {
  console.log('🚀 Starting Holliday\'s Lawn & Garden Admin Setup...');
  
  try {
    const db = await waitForFirebase();
    const currentUser = window.HollidayApp.currentUser;
    
    if (!currentUser) {
      console.error('❌ Please log in as an admin user first, then run this script.');
      return;
    }
    
    const steps = [
      { name: 'Setting up admin user role', fn: setupAdminUser },
      { name: 'Adding sample customers', fn: addSampleCustomers },
      { name: 'Adding sample service requests', fn: addSampleServiceRequests }
    ];
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      console.log(`\n📋 Step ${i + 1}: ${step.name}...`);
      
      try {
        const success = await step.fn();
        if (success) {
          console.log(`✅ Step ${i + 1} completed successfully!`);
        } else {
          console.log(`⚠️ Step ${i + 1} had issues - check the logs above.`);
        }
      } catch (error) {
        console.error(`❌ Step ${i + 1} failed:`, error);
      }
    }
    
    console.log('\n🎉 Admin setup completed! Your Holliday\'s Lawn & Garden admin dashboard is ready to use.');
    console.log('\n📋 Next steps:');
    console.log('1. Deploy your Firestore rules using: firebase deploy --only firestore:rules');
    console.log('2. Refresh your admin dashboard to see the new data');
    console.log('3. Test the admin functionality with the sample data');
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Make functions available globally for console usage
window.adminSetup = {
  runCompleteSetup,
  setupAdminUser,
  addSampleCustomers,
  addSampleServiceRequests
};

// Initialize when page loads
window.addEventListener('load', async () => {
  try {
    await waitForFirebase();
    console.log('🔧 Admin setup script loaded! Run adminSetup.runCompleteSetup() to begin setup.');
  } catch (error) {
    console.error('❌ Failed to initialize admin setup:', error);
  }
}); 