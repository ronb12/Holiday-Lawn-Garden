// Admin Setup Script for Holliday's Lawn & Garden
// Run this script in the browser console after logging into the admin account

// Wait for Firebase to be ready
function waitForFirebase() {
  return new Promise((resolve) => {
    const checkFirebase = () => {
      if (typeof firebase !== 'undefined' && firebase.apps.length > 0 && firebase.firestore) {
        resolve(firebase.firestore());
      } else {
        setTimeout(checkFirebase, 100);
      }
    };
    checkFirebase();
  });
}

// Setup admin user role
async function setupAdminUser(userEmail) {
  const db = await waitForFirebase();
  const currentUser = firebase.auth().currentUser;
  
  if (!currentUser) {
    console.error('No user is currently logged in. Please log in first.');
    return false;
  }
  
  try {
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

// Add sample customers to the database
async function addSampleCustomers() {
  const db = await waitForFirebase();
  
  const sampleCustomers = [
    {
      email: 'john.doe@email.com',
      displayName: 'John Doe',
      role: 'customer',
      phone: '(555) 123-4567',
      address: {
        street: '123 Oak Street',
        city: 'Springdale',
        state: 'FL',
        zip: '32789'
      },
      propertyDetails: {
        sizeSqFt: 7500,
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
      email: 'sarah.johnson@email.com',
      displayName: 'Sarah Johnson',
      role: 'customer',
      phone: '(555) 234-5678',
      address: {
        street: '456 Pine Avenue',
        city: 'Winter Park',
        state: 'FL',
        zip: '32792'
      },
      propertyDetails: {
        sizeSqFt: 12000,
        propertyType: 'residential',
        hasPool: true,
        hasSprinklers: false
      },
      preferences: {
        communicationMethod: 'phone',
        serviceFrequency: 'weekly'
      },
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      isActive: true
    },
    {
      email: 'mike.wilson@email.com',
      displayName: 'Mike Wilson',
      role: 'customer',
      phone: '(555) 345-6789',
      address: {
        street: '789 Maple Drive',
        city: 'Orlando',
        state: 'FL',
        zip: '32803'
      },
      propertyDetails: {
        sizeSqFt: 5000,
        propertyType: 'residential',
        hasPool: false,
        hasSprinklers: false
      },
      preferences: {
        communicationMethod: 'email',
        serviceFrequency: 'monthly'
      },
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      isActive: true
    },
    {
      email: 'lisa.brown@email.com',
      displayName: 'Lisa Brown',
      role: 'customer',
      phone: '(555) 456-7890',
      address: {
        street: '321 Cedar Lane',
        city: 'Altamonte Springs',
        state: 'FL',
        zip: '32714'
      },
      propertyDetails: {
        sizeSqFt: 9000,
        propertyType: 'residential',
        hasPool: true,
        hasSprinklers: true
      },
      preferences: {
        communicationMethod: 'text',
        serviceFrequency: 'bi-weekly'
      },
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      isActive: true
    },
    {
      email: 'david.miller@email.com',
      displayName: 'David Miller',
      role: 'customer',
      phone: '(555) 567-8901',
      address: {
        street: '654 Birch Boulevard',
        city: 'Kissimmee',
        state: 'FL',
        zip: '34741'
      },
      propertyDetails: {
        sizeSqFt: 15000,
        propertyType: 'commercial',
        hasPool: false,
        hasSprinklers: true
      },
      preferences: {
        communicationMethod: 'email',
        serviceFrequency: 'weekly'
      },
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      isActive: true
    }
  ];
  
  console.log('Adding sample customers...');
  
  try {
    const batch = db.batch();
    
    sampleCustomers.forEach(customer => {
      const customerRef = db.collection('users').doc(); // Auto-generate UID
      batch.set(customerRef, customer);
    });
    
    await batch.commit();
    console.log('✅ Sample customers added successfully!');
    console.log(`Added ${sampleCustomers.length} customers to the database.`);
    return true;
  } catch (error) {
    console.error('❌ Error adding sample customers:', error);
    return false;
  }
}

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
  
  if (!firebase.auth().currentUser) {
    console.error('❌ Please log in as an admin user first, then run this script.');
    return;
  }
  
  const steps = [
    { name: 'Setting up admin user role', fn: () => setupAdminUser() },
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
}

// Make functions available globally for console usage
window.adminSetup = {
  runCompleteSetup,
  setupAdminUser,
  addSampleCustomers,
  addSampleServiceRequests
};

console.log('🔧 Admin setup script loaded! Run adminSetup.runCompleteSetup() to begin setup.'); 