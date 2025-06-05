// Test Customer Workflow
async function testCustomerWorkflow() {
  const results = {
    adminCheck: { status: 'pending', error: null },
    customerCreation: { status: 'pending', error: null },
    serviceRequest: { status: 'pending', error: null },
    quoteGeneration: { status: 'pending', error: null },
    invoiceCreation: { status: 'pending', error: null },
    paymentProcessing: { status: 'pending', error: null }
  };

  try {
    console.log('🔄 Starting Customer Workflow Test\n');

    // Step 1: Admin Authentication Check
    try {
      const currentUser = firebase.auth().currentUser;
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      const userDoc = await window.HollidayApp.db.collection('users').doc(currentUser.uid).get();
      if (!userDoc.exists || userDoc.data().role !== 'admin') {
        throw new Error('Current user is not an admin');
      }

      console.log('✅ PASS: Admin authentication verified');
      console.log('👤 Admin:', currentUser.email);
      results.adminCheck.status = 'pass';
    } catch (error) {
      results.adminCheck.status = 'fail';
      results.adminCheck.error = error.message;
      console.error('❌ FAIL: Admin check -', error.message);
      throw error;
    }

    // Step 2: Customer Creation
    try {
      const customerData = {
        email: "test.customer@example.com",
        displayName: "Test Customer",
        phone: "(555) 123-4567",
        address: {
          street: "123 Test St",
          city: "Orlando",
          state: "FL",
          zip: "32801"
        },
        propertyDetails: {
          sizeSqFt: 5000,
          type: "residential",
          hasPool: true,
          hasSprinklers: true
        }
      };

      console.log('\n📋 Creating test customer...');
      const customerId = await window.productionSetup.addRealCustomer(customerData);
      if (!customerId) throw new Error('Failed to create customer');
      
      console.log('✅ PASS: Customer created');
      console.log('🆔 Customer ID:', customerId);
      results.customerCreation.status = 'pass';
      results.customerId = customerId;
    } catch (error) {
      results.customerCreation.status = 'fail';
      results.customerCreation.error = error.message;
      console.error('❌ FAIL: Customer creation -', error.message);
      throw error;
    }

    // Step 3: Service Request
    try {
      const serviceRequest = {
        customerId: results.customerId,
        serviceType: "Lawn Mowing & Trimming",
        description: "Weekly lawn maintenance needed",
        propertySize: 5000,
        urgency: "normal",
        preferredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      console.log('\n📋 Creating service request...');
      const requestRef = await window.HollidayApp.db.collection('service_requests').add({
        ...serviceRequest,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      console.log('✅ PASS: Service request created');
      console.log('🆔 Request ID:', requestRef.id);
      results.serviceRequest.status = 'pass';
      results.requestId = requestRef.id;
    } catch (error) {
      results.serviceRequest.status = 'fail';
      results.serviceRequest.error = error.message;
      console.error('❌ FAIL: Service request -', error.message);
      throw error;
    }

    // Step 4: Quote Generation
    try {
      const quoteData = {
        customerId: results.customerId,
        services: [{
          type: "Lawn Mowing & Trimming",
          notes: "Weekly service including edging and cleanup"
        }],
        propertyDetails: {
          sizeSqFt: 5000,
          complexity: 1
        },
        urgent: false
      };

      console.log('\n📋 Generating quote...');
      const biddingSystem = new window.BiddingSystem();
      const bid = await biddingSystem.generateBid(quoteData);
      const quoteRef = await window.HollidayApp.db.collection('bids').add(bid);

      console.log('✅ PASS: Quote generated');
      console.log('🆔 Quote ID:', quoteRef.id);
      console.log('💰 Amount:', bid.estimatedTotal);
      results.quoteGeneration.status = 'pass';
      results.quoteId = quoteRef.id;
    } catch (error) {
      results.quoteGeneration.status = 'fail';
      results.quoteGeneration.error = error.message;
      console.error('❌ FAIL: Quote generation -', error.message);
      throw error;
    }

    // Step 5: Invoice Creation
    try {
      const invoiceData = {
        customerId: results.customerId,
        customerName: "Test Customer",
        customerEmail: "test.customer@example.com",
        items: [{
          description: "Lawn Mowing & Trimming Service",
          quantity: 1,
          rate: 50
        }],
        terms: "Net 30",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      console.log('\n📋 Creating invoice...');
      const invoiceService = new window.InvoiceService();
      const invoice = await invoiceService.createInvoice(invoiceData);

      console.log('✅ PASS: Invoice created');
      console.log('🆔 Invoice ID:', invoice.id);
      console.log('💰 Total:', invoice.total);
      results.invoiceCreation.status = 'pass';
      results.invoiceId = invoice.id;
    } catch (error) {
      results.invoiceCreation.status = 'fail';
      results.invoiceCreation.error = error.message;
      console.error('❌ FAIL: Invoice creation -', error.message);
      throw error;
    }

    // Step 6: Payment Processing
    try {
      console.log('\n📋 Processing payment...');
      const paymentData = {
        amount: 50, // Using fixed amount from invoice items
        method: 'credit_card',
        transactionId: 'test_tx_' + Date.now()
      };

      const invoiceService = new window.InvoiceService();
      await invoiceService.recordPayment(results.invoiceId, paymentData);

      console.log('✅ PASS: Payment processed');
      console.log('🆔 Transaction ID:', paymentData.transactionId);
      results.paymentProcessing.status = 'pass';
    } catch (error) {
      results.paymentProcessing.status = 'fail';
      results.paymentProcessing.error = error.message;
      console.error('❌ FAIL: Payment processing -', error.message);
      throw error;
    }

    // Final Results
    console.log('\n📊 Test Results Summary:');
    Object.entries(results).forEach(([step, result]) => {
      if (step === 'customerId' || step === 'requestId' || step === 'quoteId' || step === 'invoiceId') return;
      console.log(`${result.status === 'pass' ? '✅' : '❌'} ${step}: ${result.status.toUpperCase()}`);
      if (result.error) console.log(`   Error: ${result.error}`);
    });

    return results;
  } catch (error) {
    console.error('\n❌ Workflow test failed:', error);
    console.log('\n📊 Final Test Results:');
    Object.entries(results).forEach(([step, result]) => {
      if (step === 'customerId' || step === 'requestId' || step === 'quoteId' || step === 'invoiceId') return;
      console.log(`${result.status === 'pass' ? '✅' : '❌'} ${step}: ${result.status.toUpperCase()}`);
      if (result.error) console.log(`   Error: ${result.error}`);
    });
    throw error;
  }
}

// Auto-run function that executes tests and fixes errors
async function autoRunTests() {
  console.log('🚀 Starting Automated Test Suite\n');
  
  let results;
  try {
    // Initialize Firebase if not already initialized
    if (!window.HollidayApp || !window.HollidayApp.db) {
      console.log('⚙️ Initializing Firebase...');
      await initializeFirebase();
    }

    // Check if BiddingSystem and InvoiceService are available
    if (!window.BiddingSystem) {
      console.error('❌ BiddingSystem not found. Loading required script...');
      await loadScript('bidding-system.js');
    }
    if (!window.InvoiceService) {
      console.error('❌ InvoiceService not found. Loading required script...');
      await loadScript('invoice-service.js');
    }

    // Run the test workflow
    results = await testCustomerWorkflow();
    
    // If test completes successfully, clean up
    if (results) {
      console.log('\n🧹 Cleaning up test data...');
      await cleanupTestData(results);
    }
  } catch (error) {
    console.error('\n❌ Auto-run encountered an error:', error);
    
    // Attempt to fix common errors
    if (error.message.includes('not logged in')) {
      console.log('🔄 Attempting to log in as admin...');
      try {
        await window.productionSetup.loginAsAdmin();
        console.log('✅ Admin login successful, retrying test...');
        results = await testCustomerWorkflow();
      } catch (loginError) {
        console.error('❌ Admin login failed:', loginError);
      }
    }
    
    if (error.message.includes('permission-denied')) {
      console.log('🔄 Checking and updating security rules...');
      try {
        await window.productionSetup.updateSecurityRules();
        console.log('✅ Security rules updated, retrying test...');
        results = await testCustomerWorkflow();
      } catch (securityError) {
        console.error('❌ Security update failed:', securityError);
      }
    }
  }
}

// Helper function to load scripts dynamically
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Initialize Firebase helper function
async function initializeFirebase() {
  try {
    if (typeof firebase === 'undefined') {
      throw new Error('Firebase SDK not loaded');
    }
    
    // Initialize Firebase if not already initialized
    if (!firebase.apps.length) {
      firebase.initializeApp(window.firebaseConfig);
    }
    
    // Initialize Firestore
    window.HollidayApp = window.HollidayApp || {};
    window.HollidayApp.db = firebase.firestore();
    
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw error;
  }
}

// Auto-start when the page loads
window.addEventListener('load', () => {
  console.log('🔄 Page loaded, starting automated tests...');
  autoRunTests();
});

// Make functions available globally
window.autoRunTests = autoRunTests;
window.testCustomerWorkflow = testCustomerWorkflow;

// Add cleanup function at the beginning of the file
async function cleanupTestData(testResults) {
  if (!testResults) return;
  
  try {
    const db = window.HollidayApp.db;
    const batch = db.batch();
    
    // Clean up customer data
    if (testResults.customerId) {
      batch.delete(db.collection('users').doc(testResults.customerId));
    }
    
    // Clean up service request
    if (testResults.requestId) {
      batch.delete(db.collection('service_requests').doc(testResults.requestId));
    }
    
    // Clean up quote
    if (testResults.quoteId) {
      batch.delete(db.collection('bids').doc(testResults.quoteId));
    }
    
    // Clean up invoice
    if (testResults.invoiceId) {
      batch.delete(db.collection('invoices').doc(testResults.invoiceId));
    }
    
    await batch.commit();
    console.log('✅ Test data cleaned up successfully');
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
    throw error;
  }
}

// Make cleanup function available globally
window.cleanupTestData = cleanupTestData;