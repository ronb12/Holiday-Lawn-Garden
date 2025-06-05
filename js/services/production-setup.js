class ProductionSetup {
  constructor() {
    if (!window.HollidayApp?.db) {
      throw new Error('Firebase must be initialized before creating ProductionSetup');
    }
    this.db = window.HollidayApp.db;
    this.auth = window.HollidayApp.auth;
  }

  // Login as admin
  async loginAsAdmin() {
    try {
      const adminEmail = 'admin@hollidaylawnandgarden.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'defaultAdminPass123!';
      
      const userCredential = await this.auth.signInWithEmailAndPassword(adminEmail, adminPassword);
      const user = userCredential.user;
      
      // Verify admin role
      const userDoc = await this.db.collection('users').doc(user.uid).get();
      if (!userDoc.exists || userDoc.data().role !== 'admin') {
        throw new Error('User is not an admin');
      }
      
      return user;
    } catch (error) {
      console.error('Admin login error:', error);
      throw new Error('Failed to login as admin');
    }
  }

  // Add a new customer
  async addRealCustomer(customerData) {
    try {
      // Validate customer data
      if (!customerData.email || !customerData.displayName) {
        throw new Error('Invalid customer data');
      }

      // Create customer document
      const customerRef = this.db.collection('users').doc();
      await customerRef.set({
        ...customerData,
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return customerRef.id;
    } catch (error) {
      console.error('Error adding customer:', error);
      throw new Error('Failed to add customer');
    }
  }

  // Update security rules
  async updateSecurityRules() {
    try {
      // Note: This is a placeholder. In production, security rules should be updated
      // through the Firebase Console or deployment process
      console.log('Security rules should be updated through Firebase Console');
      return true;
    } catch (error) {
      console.error('Error updating security rules:', error);
      throw new Error('Failed to update security rules');
    }
  }

  // Initialize database with required collections
  async initializeDatabase() {
    try {
      const collections = ['users', 'invoices', 'payments', 'service_requests', 'bids', 'equipment'];
      
      for (const collection of collections) {
        const doc = await this.db.collection(collection).doc('_config').get();
        if (!doc.exists) {
          await this.db.collection(collection).doc('_config').set({
            createdAt: new Date(),
            initialized: true
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Error initializing database:', error);
      throw new Error('Failed to initialize database');
    }
  }
}

// Make ProductionSetup available globally
window.ProductionSetup = ProductionSetup; 