// Production Setup Script for Holliday's Lawn & Garden
// This script sets up the production environment with real business data

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait for Firebase initialization
  window.addEventListener('firebaseInitialized', async () => {
    try {
      // Check if user is authenticated and is admin
      if (!window.HollidayApp.isAuthenticated()) {
        console.warn('No user authenticated');
        return;
      }

      const isAdmin = await window.HollidayApp.isAdmin();
      if (!isAdmin) {
        console.warn('User is not an admin');
        return;
      }

      console.log('🔧 PRODUCTION setup script loaded!');
      console.log('🚀 Run productionSetup.runProductionSetup() to set up for real business use.');
      console.log('👥 Use productionSetup.addRealCustomer({...}) to manually add customers.');
    } catch (error) {
      console.error('❌ Production setup initialization error:', error);
    }
  });
});

// Production setup functions
const productionSetup = {
  async runProductionSetup() {
    try {
      console.log('🚀 Starting production setup...');
      
      // Check Firebase initialization
      if (!window.HollidayApp?.db) {
        throw new Error('Firebase not initialized');
      }

      // Check admin privileges
      const isAdmin = await window.HollidayApp.isAdmin();
      if (!isAdmin) {
        throw new Error('User is not an admin');
      }

      // Initialize business settings
      await this.initializeBusinessSettings();
      
      console.log('✅ Production setup completed successfully');
    } catch (error) {
      console.error('❌ Production setup failed:', error);
      throw error;
    }
  },

  async initializeBusinessSettings() {
    try {
      const businessSettings = {
        name: "Holliday's Lawn & Garden",
        address: "123 Main St, Anytown, USA",
        phone: "(555) 123-4567",
        email: "contact@hollidaylawnandgarden.com",
        website: "https://hollidaylawnandgarden.com",
        businessHours: {
          monday: "8:00 AM - 5:00 PM",
          tuesday: "8:00 AM - 5:00 PM",
          wednesday: "8:00 AM - 5:00 PM",
          thursday: "8:00 AM - 5:00 PM",
          friday: "8:00 AM - 5:00 PM",
          saturday: "9:00 AM - 2:00 PM",
          sunday: "Closed"
        },
        services: [
          {
            name: "Lawn Mowing & Trimming",
            baseRate: 0.05,
            minSize: 1000,
            maxSize: 50000
          },
          {
            name: "Landscape Design",
            baseRate: 0.15,
            minSize: 500,
            maxSize: 25000
          },
          {
            name: "Tree Service",
            baseRate: 0.14,
            minSize: 1,
            maxSize: 100
          }
        ]
      };

      await window.HollidayApp.db
        .collection('settings')
        .doc('business')
        .set(businessSettings, { merge: true });

      console.log('✅ Business settings initialized');
    } catch (error) {
      console.error('❌ Failed to initialize business settings:', error);
      throw error;
    }
  },

  async addRealCustomer(customerData) {
    try {
      if (!customerData?.email) {
        throw new Error('Customer email is required');
      }

      // Create user account
      const userCredential = await window.HollidayApp.auth
        .createUserWithEmailAndPassword(customerData.email, 'TempPass123!');

      // Add customer data
      await window.HollidayApp.db
        .collection('users')
        .doc(userCredential.user.uid)
        .set({
          ...customerData,
          role: 'customer',
          createdAt: new Date(),
          createdBy: window.HollidayApp.auth.currentUser.uid
        });

      console.log('✅ Customer added successfully:', customerData.email);
      return userCredential.user.uid;
    } catch (error) {
      console.error('❌ Failed to add customer:', error);
      throw error;
    }
  }
};

// Make functions available globally
window.productionSetup = productionSetup; 