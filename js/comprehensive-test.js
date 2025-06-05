// Comprehensive Test Suite
// Add test results UI to the page
function addTestResultsUI() {
  const adminContainer = document.querySelector('.admin-container');
  if (!adminContainer) return;

  const testSection = document.createElement('div');
  testSection.className = 'test-section';
  testSection.innerHTML = `
    <div class="tab-content-header">
      <h2>Automated Tests</h2>
      <p>Comprehensive system test results</p>
    </div>
    <div class="tab-content-body">
      <div id="testProgress" style="margin-bottom: 20px;">
        <div style="font-weight: bold;">Test Progress:</div>
        <div id="testStatus">Initializing tests...</div>
      </div>
      <div id="testResults" style="background: #f8fafc; padding: 20px; border-radius: 8px;">
        <div style="font-weight: bold;">Test Results:</div>
        <pre id="testOutput" style="margin-top: 10px; white-space: pre-wrap;"></pre>
      </div>
    </div>
  `;
  
  adminContainer.insertBefore(testSection, adminContainer.firstChild);
}

// Update the UI with test progress
function updateTestStatus(message) {
  const statusElement = document.getElementById('testStatus');
  if (statusElement) {
    statusElement.textContent = message;
  }
}

// Update the UI with test output
function updateTestOutput(message) {
  const outputElement = document.getElementById('testOutput');
  if (outputElement) {
    outputElement.textContent += message + '\n';
  }
}

// Original test suite with UI updates
async function runComprehensiveTests() {
  addTestResultsUI();
  
  const testResults = {
    authentication: { status: 'pending', error: null },
    customerManagement: { status: 'pending', error: null },
    serviceRequests: { status: 'pending', error: null },
    quoteGeneration: { status: 'pending', error: null },
    invoicing: { status: 'pending', error: null },
    equipmentManagement: { status: 'pending', error: null },
    reporting: { status: 'pending', error: null }
  };

  updateTestStatus('🚀 Starting Comprehensive Test Suite');
  updateTestOutput('🚀 Starting Comprehensive Test Suite\n');

  try {
    // 1. Authentication Tests
    try {
      updateTestStatus('📋 Testing Authentication...');
      updateTestOutput('\n📋 Testing Authentication...');
      await testAuthentication();
      testResults.authentication.status = 'pass';
      updateTestOutput('✅ PASS: Authentication tests');
    } catch (error) {
      testResults.authentication.status = 'fail';
      testResults.authentication.error = error.message;
      updateTestOutput(`❌ FAIL: Authentication - ${error.message}`);
    }

    // 2. Customer Management Tests
    try {
      updateTestStatus('📋 Testing Customer Management...');
      updateTestOutput('\n📋 Testing Customer Management...');
      const customerId = await testCustomerManagement();
      testResults.customerManagement.status = 'pass';
      testResults.customerId = customerId;
      updateTestOutput('✅ PASS: Customer management tests');
    } catch (error) {
      testResults.customerManagement.status = 'fail';
      testResults.customerManagement.error = error.message;
      updateTestOutput(`❌ FAIL: Customer management - ${error.message}`);
    }

    // 3. Service Request Tests
    try {
      updateTestStatus('📋 Testing Service Requests...');
      updateTestOutput('\n📋 Testing Service Requests...');
      const requestId = await testServiceRequests(testResults.customerId);
      testResults.serviceRequests.status = 'pass';
      testResults.requestId = requestId;
      updateTestOutput('✅ PASS: Service request tests');
    } catch (error) {
      testResults.serviceRequests.status = 'fail';
      testResults.serviceRequests.error = error.message;
      updateTestOutput(`❌ FAIL: Service requests - ${error.message}`);
    }

    // 4. Quote Generation Tests
    try {
      updateTestStatus('📋 Testing Quote Generation...');
      updateTestOutput('\n📋 Testing Quote Generation...');
      const quoteId = await testQuoteGeneration(testResults.customerId);
      testResults.quoteGeneration.status = 'pass';
      testResults.quoteId = quoteId;
      updateTestOutput('✅ PASS: Quote generation tests');
    } catch (error) {
      testResults.quoteGeneration.status = 'fail';
      testResults.quoteGeneration.error = error.message;
      updateTestOutput(`❌ FAIL: Quote generation - ${error.message}`);
    }

    // 5. Invoicing Tests
    try {
      updateTestStatus('📋 Testing Invoicing...');
      updateTestOutput('\n📋 Testing Invoicing...');
      const invoiceId = await testInvoicing(testResults.customerId);
      testResults.invoicing.status = 'pass';
      testResults.invoiceId = invoiceId;
      updateTestOutput('✅ PASS: Invoicing tests');
    } catch (error) {
      testResults.invoicing.status = 'fail';
      testResults.invoicing.error = error.message;
      updateTestOutput(`❌ FAIL: Invoicing - ${error.message}`);
    }

    // 6. Equipment Management Tests
    try {
      updateTestStatus('📋 Testing Equipment Management...');
      updateTestOutput('\n📋 Testing Equipment Management...');
      await testEquipmentManagement();
      testResults.equipmentManagement.status = 'pass';
      updateTestOutput('✅ PASS: Equipment management tests');
    } catch (error) {
      testResults.equipmentManagement.status = 'fail';
      testResults.equipmentManagement.error = error.message;
      updateTestOutput(`❌ FAIL: Equipment management - ${error.message}`);
    }

    // 7. Reporting Tests
    try {
      updateTestStatus('📋 Testing Reporting...');
      updateTestOutput('\n📋 Testing Reporting...');
      await testReporting();
      testResults.reporting.status = 'pass';
      updateTestOutput('✅ PASS: Reporting tests');
    } catch (error) {
      testResults.reporting.status = 'fail';
      testResults.reporting.error = error.message;
      updateTestOutput(`❌ FAIL: Reporting - ${error.message}`);
    }

  } catch (error) {
    updateTestOutput(`\n❌ Test suite encountered an error: ${error}`);
  } finally {
    // Print Final Results
    updateTestStatus('📊 Generating Final Test Results');
    updateTestOutput('\n📊 Final Test Results:');
    Object.entries(testResults).forEach(([feature, result]) => {
      if (feature === 'customerId' || feature === 'requestId' || feature === 'quoteId' || feature === 'invoiceId') return;
      updateTestOutput(`${result.status === 'pass' ? '✅' : '❌'} ${feature}: ${result.status.toUpperCase()}`);
      if (result.error) updateTestOutput(`   Error: ${result.error}`);
    });

    // Clean up test data
    try {
      updateTestStatus('🧹 Cleaning up test data...');
      updateTestOutput('\n🧹 Cleaning up test data...');
      await cleanupTestData(testResults);
      updateTestOutput('✅ Test data cleaned up successfully');
      updateTestStatus('✅ Tests completed');
    } catch (error) {
      updateTestOutput(`❌ Error cleaning up test data: ${error}`);
      updateTestStatus('❌ Tests completed with cleanup errors');
    }
  }
}

// Auto-start tests when Firebase is ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait for Firebase to be initialized
  const checkFirebase = setInterval(() => {
    if (window.firebase && window.HollidayApp && window.HollidayApp.db) {
      clearInterval(checkFirebase);
      console.log('Firebase ready, starting tests...');
      runComprehensiveTests();
    }
  }, 1000);

  // Timeout after 30 seconds
  setTimeout(() => {
    clearInterval(checkFirebase);
    console.error('Timeout waiting for Firebase initialization');
  }, 30000);
});

// Individual test functions
async function testAuthentication() {
  // Test admin login
  const adminEmail = 'admin@example.com';
  const adminPassword = 'testpassword';
  
  try {
    await firebase.auth().signInWithEmailAndPassword(adminEmail, adminPassword);
    const user = firebase.auth().currentUser;
    if (!user) throw new Error('No user logged in after authentication');
    
    // Verify admin role
    const userDoc = await window.HollidayApp.db.collection('users').doc(user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      throw new Error('User is not an admin');
    }
    
    return true;
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

async function testCustomerManagement() {
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

  try {
    // Add customer
    const customerId = await window.productionSetup.addRealCustomer(customerData);
    if (!customerId) throw new Error('Failed to create customer');

    // Verify customer was created
    const customerDoc = await window.HollidayApp.db.collection('users').doc(customerId).get();
    if (!customerDoc.exists) throw new Error('Customer document not found');

    return customerId;
  } catch (error) {
    throw new Error(`Customer management failed: ${error.message}`);
  }
}

async function testServiceRequests(customerId) {
  try {
    const serviceRequest = {
      customerId: customerId,
      serviceType: "Lawn Mowing & Trimming",
      description: "Weekly lawn maintenance needed",
      propertySize: 5000,
      urgency: "normal",
      preferredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };

    const requestRef = await window.HollidayApp.db.collection('service_requests').add({
      ...serviceRequest,
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    return requestRef.id;
  } catch (error) {
    throw new Error(`Service request failed: ${error.message}`);
  }
}

async function testQuoteGeneration(customerId) {
  try {
    const quoteData = {
      customerId: customerId,
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

    const biddingSystem = new window.BiddingSystem();
    const bid = await biddingSystem.generateBid(quoteData);
    const quoteRef = await window.HollidayApp.db.collection('bids').add(bid);

    return quoteRef.id;
  } catch (error) {
    throw new Error(`Quote generation failed: ${error.message}`);
  }
}

async function testInvoicing(customerId) {
  try {
    const invoiceData = {
      customerId: customerId,
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

    const invoiceService = new window.InvoiceService();
    const invoice = await invoiceService.createInvoice(invoiceData);

    return invoice.id;
  } catch (error) {
    throw new Error(`Invoicing failed: ${error.message}`);
  }
}

async function testEquipmentManagement() {
  try {
    const equipmentData = {
      name: "Test Mower",
      type: "Lawn Mower",
      purchaseDate: new Date().toISOString().split('T')[0],
      cost: 1000
    };

    const equipmentRef = await window.HollidayApp.db.collection('equipment').add({
      ...equipmentData,
      status: 'available',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    return equipmentRef.id;
  } catch (error) {
    throw new Error(`Equipment management failed: ${error.message}`);
  }
}

async function testReporting() {
  try {
    // Test revenue calculation
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    
    const revenueQuery = await window.HollidayApp.db.collection('invoices')
      .where('createdAt', '>=', startDate)
      .get();

    // Test sustainability reporting
    const sustainabilityLog = await window.HollidayApp.db.collection('sustainability_log')
      .orderBy('date', 'desc')
      .limit(10)
      .get();

    return true;
  } catch (error) {
    throw new Error(`Reporting failed: ${error.message}`);
  }
}

// Make test function available globally
window.runComprehensiveTests = runComprehensiveTests; 
window.runComprehensiveTests = runComprehensiveTests; 