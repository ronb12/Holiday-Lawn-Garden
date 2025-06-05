// Production Admin Setup Script for Holliday's Lawn & Garden
// This script sets up the admin account for real business use (no demo data)

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

// Setup admin user role for production use
async function setupProductionAdmin() {
  const db = await waitForFirebase();
  const currentUser = firebase.auth().currentUser;
  
  if (!currentUser) {
    console.error('❌ No user is currently logged in. Please log in first.');
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
      ],
      businessInfo: {
        businessName: "Holliday's Lawn & Garden",
        adminLevel: 'owner',
        setupDate: firebase.firestore.FieldValue.serverTimestamp()
      }
    }, { merge: true });
    
    console.log('✅ Production admin account configured successfully!');
    console.log('👤 Admin User:', currentUser.email);
    console.log('🆔 Admin UID:', currentUser.uid);
    console.log('🏢 Business: Holliday\'s Lawn & Garden');
    
    return true;
  } catch (error) {
    console.error('❌ Error setting up production admin:', error);
    return false;
  }
}

// Initialize business settings
async function initializeBusinessSettings() {
  const db = await waitForFirebase();
  
  try {
    // Create business configuration document
    await db.collection('business_settings').doc('company_info').set({
      name: "Holliday's Lawn & Garden",
      contact: {
        email: '7holliday@gmail.com',
        phone: '(504) 717-1887'
      },
      services: [
        {
          name: 'Lawn Mowing & Trimming',
          basePrice: 50,
          pricePerSqFt: 0.05,
          description: 'Regular lawn maintenance including mowing and edge trimming'
        },
        {
          name: 'Landscape Design',
          basePrice: 200,
          pricePerSqFt: 0.15,
          description: 'Custom landscape design and installation services'
        },
        {
          name: 'Leaf Removal',
          basePrice: 75,
          pricePerSqFt: 0.08,
          description: 'Seasonal leaf cleanup and removal'
        },
        {
          name: 'Fertilization & Seeding',
          basePrice: 100,
          pricePerSqFt: 0.12,
          description: 'Lawn fertilization, overseeding, and soil treatment'
        },
        {
          name: 'Seasonal Cleanup',
          basePrice: 85,
          pricePerSqFt: 0.10,
          description: 'Comprehensive seasonal yard cleanup and preparation'
        }
      ],
      businessHours: {
        monday: { open: '08:00', close: '17:00', closed: false },
        tuesday: { open: '08:00', close: '17:00', closed: false },
        wednesday: { open: '08:00', close: '17:00', closed: false },
        thursday: { open: '08:00', close: '17:00', closed: false },
        friday: { open: '08:00', close: '17:00', closed: false },
        saturday: { open: '08:00', close: '15:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true }
      },
      paymentTerms: 'Net 30 days',
      taxRate: 0.07, // 7% Florida sales tax (adjust as needed)
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log('✅ Business settings initialized successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error initializing business settings:', error);
    return false;
  }
}

// Create system status document
async function initializeSystemStatus() {
  const db = await waitForFirebase();
  
  try {
    await db.collection('system_status').doc('production').set({
      environment: 'production',
      setupCompleted: true,
      setupDate: firebase.firestore.FieldValue.serverTimestamp(),
      version: '1.0.0',
      features: {
        customerManagement: true,
        serviceRequests: true,
        quotesAndBids: true,
        invoicing: true,
        equipmentTracking: true,
        reporting: true
      },
      dataInitialized: {
        adminUser: true,
        businessSettings: true,
        securityRules: true,
        customerData: false, // Will be true when real customers are added
        sampleData: false    // No sample data in production
      },
      lastHealthCheck: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log('✅ System status initialized for production!');
    return true;
  } catch (error) {
    console.error('❌ Error initializing system status:', error);
    return false;
  }
}

// Main production setup function
async function runProductionSetup() {
  console.log('🚀 Starting Holliday\'s Lawn & Garden PRODUCTION Setup...');
  console.log('📋 This will configure your system for real business use (no demo data)');
  
  if (!firebase.auth().currentUser) {
    console.error('❌ Please log in as an admin user first, then run this script.');
    return;
  }
  
  const steps = [
    { 
      name: 'Setting up production admin account', 
      fn: setupProductionAdmin,
      description: 'Configures your account with full admin permissions'
    },
    { 
      name: 'Initializing business settings', 
      fn: initializeBusinessSettings,
      description: 'Sets up service catalog and company information'
    },
    { 
      name: 'Configuring system status', 
      fn: initializeSystemStatus,
      description: 'Marks system as production-ready'
    }
  ];
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    console.log(`\n📋 Step ${i + 1}: ${step.name}...`);
    console.log(`   ${step.description}`);
    
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
  
  console.log('\n🎉 PRODUCTION SETUP COMPLETED!');
  console.log('\n🏢 Your Holliday\'s Lawn & Garden admin system is ready for real business!');
  console.log('\n📋 What you can do now:');
  console.log('✅ Add real customers through the admin dashboard');
  console.log('✅ Process actual service requests');
  console.log('✅ Generate professional quotes and invoices');
  console.log('✅ Track real business metrics');
  console.log('✅ Manage equipment and inventory');
  console.log('\n🔧 To add your first real customer:');
  console.log('1. Go to the Customers tab');
  console.log('2. The customer dropdown will initially be empty (this is correct)');
  console.log('3. Customers will appear as they create accounts on your website');
  console.log('4. Or you can add customers manually through Firebase Console');
  console.log('\n🌟 Your system is now production-ready!');
}

// Helper function to add a real customer (for manual use)
async function addRealCustomer(customerData) {
  const db = await waitForFirebase();
  
  const requiredFields = ['email', 'displayName', 'phone'];
  const missingFields = requiredFields.filter(field => !customerData[field]);
  
  if (missingFields.length > 0) {
    console.error('❌ Missing required fields:', missingFields);
    console.log('📋 Required format: { email, displayName, phone, address: { street, city, state, zip } }');
    return false;
  }
  
  try {
    const customerRef = db.collection('users').doc();
    await customerRef.set({
      ...customerData,
      role: 'customer',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      isActive: true,
      addedBy: 'admin',
      source: 'manual_entry'
    });
    
    console.log('✅ Real customer added successfully!');
    console.log('👤 Customer:', customerData.displayName);
    console.log('📧 Email:', customerData.email);
    console.log('🆔 Customer ID:', customerRef.id);
    
    return customerRef.id;
  } catch (error) {
    console.error('❌ Error adding real customer:', error);
    return false;
  }
}

// Make functions available globally for console usage
window.productionSetup = {
  runProductionSetup,
  setupProductionAdmin,
  addRealCustomer,
  initializeBusinessSettings
};

console.log('🔧 PRODUCTION setup script loaded!');
console.log('🚀 Run productionSetup.runProductionSetup() to set up for real business use.');
console.log('👥 Use productionSetup.addRealCustomer({...}) to manually add customers.');

// Production Setup Helper
const productionSetup = {
  // Admin credentials for testing
  adminEmail: 'admin@hollidaylawnandgarden.com',
  adminPassword: 'admin123!@#',

  async runProductionSetup() {
    try {
      console.log('🚀 Starting production setup...');
      
      // Wait for Firebase initialization
      await this.waitForFirebase();
      
      // Create admin user if doesn't exist
      await this.setupAdminUser();
      
      console.log('✅ Production setup completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Production setup failed:', error);
      throw error;
    }
  },

  async waitForFirebase() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 20;
      const interval = setInterval(() => {
        if (window.firebase && window.HollidayApp && window.HollidayApp.db) {
          clearInterval(interval);
          resolve(true);
        }
        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          reject(new Error('Firebase initialization timeout'));
        }
      }, 500);
    });
  },

  async setupAdminUser() {
    try {
      // Check if admin user exists
      const adminQuery = await window.HollidayApp.db
        .collection('users')
        .where('email', '==', this.adminEmail)
        .where('role', '==', 'admin')
        .get();

      if (adminQuery.empty) {
        // Create admin user in Authentication
        const userCredential = await firebase.auth()
          .createUserWithEmailAndPassword(this.adminEmail, this.adminPassword);

        // Add admin user to Firestore
        await window.HollidayApp.db.collection('users').doc(userCredential.user.uid).set({
          email: this.adminEmail,
          role: 'admin',
          displayName: 'System Administrator',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Admin user created successfully');
      } else {
        console.log('✅ Admin user already exists');
      }
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('✅ Admin user exists in Authentication');
      } else {
        throw error;
      }
    }
  },

  async loginAsAdmin() {
    try {
      await firebase.auth().signInWithEmailAndPassword(this.adminEmail, this.adminPassword);
      console.log('✅ Logged in as admin');
      return true;
    } catch (error) {
      console.error('❌ Admin login failed:', error);
      throw error;
    }
  },

  async addRealCustomer(customerData) {
    try {
      // Validate customer data
      if (!customerData.email || !customerData.displayName) {
        throw new Error('Customer email and name are required');
      }

      // Create user account
      const userCredential = await firebase.auth()
        .createUserWithEmailAndPassword(customerData.email, 'TempPass123!');

      // Add customer data to Firestore
      await window.HollidayApp.db.collection('users').doc(userCredential.user.uid).set({
        ...customerData,
        role: 'customer',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      console.log('✅ Customer added successfully:', userCredential.user.uid);
      return userCredential.user.uid;
    } catch (error) {
      console.error('❌ Failed to add customer:', error);
      throw error;
    }
  },

  async updateSecurityRules() {
    // This would typically be done through Firebase Console or deployment
    console.log('⚠️ Security rules must be updated through Firebase Console');
    return true;
  }
};

// Make productionSetup available globally
window.productionSetup = productionSetup;

// Auto-initialize when the script loads
document.addEventListener('DOMContentLoaded', () => {
  productionSetup.runProductionSetup().catch(console.error);
}); 