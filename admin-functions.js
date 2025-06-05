// Admin Functions Module - Clean Error Handling Version
// Handles core administrative functionality for Holliday's Lawn & Garden

// Firebase configuration and initialization
let db;
let auth;

// Initialize Firebase DB reference
async function initializeFirebaseDB() {
  try {
    if (typeof firebase === 'undefined') {
      console.error('Firebase SDK not loaded');
      showNotification('Firebase SDK not loaded. Please refresh the page.', 'error');
      return false;
    }

    if (firebase.apps.length === 0) {
      if (!window.firebaseConfig) {
        console.error('Firebase configuration not found');
        showNotification('Firebase configuration missing. Please check setup.', 'error');
        return false;
      }
      firebase.initializeApp(window.firebaseConfig);
    }

    db = firebase.firestore();
    auth = firebase.auth();

    // Test database connection
    try {
      await db.collection('users').limit(1).get();
      console.log('✅ Firebase DB initialized and connected successfully');
      return true;
    } catch (dbError) {
      console.error('Database connection test failed:', dbError);
      showNotification('Could not connect to database. Please check your connection.', 'error');
      return false;
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
    showNotification('Failed to initialize Firebase. Please refresh the page.', 'error');
    return false;
  }
}

// Ensure Firebase is ready before executing admin functions
async function ensureFirebaseReady(callback) {
  try {
    const isInitialized = await initializeFirebaseDB();
    if (isInitialized) {
      callback();
    } else {
      showNotification('Firebase is not ready. Please refresh the page.', 'error');
    }
  } catch (error) {
    console.error('Firebase ready check failed:', error);
    showNotification('Failed to connect to Firebase. Please refresh the page.', 'error');
  }
}

// Authentication state management
function getCurrentUser() {
  return window.HollidayApp.currentUser;
}

function isUserAuthenticated() {
  return window.HollidayApp.currentUser !== null;
}

// Utility Functions
function showLoader() {
  const loader = document.getElementById("loadingOverlay");
  if (loader) loader.style.display = "flex";
}

function hideLoader() {
  const loader = document.getElementById("loadingOverlay");
  if (loader) loader.style.display = "none";
}

function showNotification(message, type = 'info') {
  console.log(`${type.toUpperCase()}: ${message}`);
  // Could implement toast notifications here
}

function toggleDarkMode() {
  try {
    document.body.classList.toggle("dark");
    localStorage.setItem("darkMode", document.body.classList.contains("dark") ? "on" : "off");
  } catch (error) {
    console.warn('Dark mode toggle failed:', error);
  }
}

// Tab Management
function showTab(id) {
  try {
    document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
    const targetTab = document.getElementById(id + '-tab');
    if (targetTab) targetTab.classList.add("active");
    
    document.querySelectorAll(".tab-item").forEach(item => item.classList.remove("active"));
    if (event && event.target) event.target.classList.add("active");
    
    // Load data based on tab
    if (id === 'overview') {
      updateDashboardStats();
      loadRecentActivity();
    }
  } catch (error) {
    console.warn('Tab switching error:', error);
  }
}

// Customer Management
async function loadCustomersList() {
  const customersList = document.querySelector('.customers-list');
  if (!customersList) {
    console.warn('Customers list container not found');
    return;
  }

  try {
    showLoader();
    
    // Use the proper Firebase reference
    const db = window.HollidayApp.db;
    if (!db) {
      throw new Error('Database not available or not initialized');
    }

    console.log('Loading customers from database...');
    
    // Only get real customers from the database
    const snapshot = await db.collection("users")
      .where("role", "==", "customer")
      .where("isActive", "==", true)  // Only get active customers
      .orderBy("createdAt", "desc")   // Show newest customers first
      .get();
    
    console.log(`Found ${snapshot.size} customers in database`);
    
    if (snapshot.empty) {
      customersList.innerHTML = `
        <div style="text-align: center; padding: 2rem; background: #f8fafc; border-radius: 8px;">
          <h3 style="color: #64748b; margin-bottom: 1rem;">No Customers Found</h3>
          <p style="color: #94a3b8;">Add your first customer using the "Add New Customer" button above.</p>
        </div>`;
      return;
    }

    const customersHTML = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('Customer data:', { id: doc.id, ...data });
      
      const address = [
        data.address?.street,
        data.address?.city,
        data.address?.state,
        data.address?.zip
      ].filter(Boolean).join(', ');
      
      customersHTML.push(`
        <div class="customer-card">
          <div class="customer-info">
            <h3>${data.displayName || 'Unnamed Customer'}</h3>
            <p>
              <strong>Contact:</strong> ${data.email || 'No email'} | ${data.phone || 'No phone'}
            </p>
            <p>
              <strong>Address:</strong> ${address || 'No address provided'}
            </p>
            <p>
              <strong>Property:</strong> ${data.propertyDetails?.sizeSqFt || 'N/A'} sq ft | 
              ${data.propertyDetails?.propertyType || 'N/A'} |
              Service: ${data.preferences?.serviceFrequency || 'Not specified'}
            </p>
          </div>
          <div class="customer-actions">
            <button onclick="loadCustomerForEdit('${doc.id}')" class="btn btn-secondary">Edit</button>
            <button onclick="deleteCustomer('${doc.id}')" class="btn btn-danger">Delete</button>
          </div>
        </div>
      `);
    });

    customersList.innerHTML = customersHTML.join('');
    console.log('✅ Customers list updated successfully');
  } catch (error) {
    console.error('Load customers error:', error);
    customersList.innerHTML = `
      <div style="color: #ef4444; padding: 1rem; background: #fef2f2; border-radius: 8px;">
        <strong>Error Loading Customers</strong>
        <p>There was a problem loading the customer list. Please try again later.</p>
        <p class="error-details" style="font-size: 0.875rem; margin-top: 0.5rem;">${error.message}</p>
      </div>`;
  } finally {
    hideLoader();
  }
}

// Customer Management
async function loadCustomersDropdown() {
  try {
    await initializeFirebaseDB();
    if (!db) {
      console.warn('Database not available for customer dropdown');
      return;
    }

    const dropdownIds = ["requestCustomer", "quoteCustomer", "invoiceCustomer", "customerSelect", "bidCustomerId"];
    
    for (const id of dropdownIds) {
      const dropdown = document.getElementById(id);
      if (!dropdown) continue;
      
      dropdown.innerHTML = '<option value="">Select Customer</option>';
      
      const snapshot = await db.collection("users")
        .where("role", "==", "customer")
        .where("isActive", "==", true)
        .orderBy("displayName")
        .get();
      
      if (snapshot.empty) {
        dropdown.innerHTML += '<option value="" disabled>No customers found</option>';
        continue;
      }

      snapshot.forEach(doc => {
        const data = doc.data();
        const option = document.createElement("option");
        option.value = doc.id;
        option.text = `${data.displayName || 'Unnamed'} (${data.email || 'No email'})`;
        dropdown.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Customer dropdown error:', error);
    showNotification('Failed to load customer list', 'error');
  }
}

// Service Request Management
function submitRequest(e) {
  e.preventDefault();
  
  if (!isUserAuthenticated()) {
    showNotification('Please log in to submit requests', 'error');
    return;
  }
  
  try {
    const customerUID = document.getElementById("requestCustomer")?.value;
    const description = document.getElementById("requestDescription")?.value;
    
    if (!customerUID || !description) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }
    
    if (!db) {
      showNotification('Database not available', 'error');
      return;
    }
    
    showLoader();
    
    const requestData = {
      customerId: customerUID,
      description: description,
      status: "Pending",
      createdAt: new Date(),
      submittedBy: 'admin'
    };
    
    db.collection("service_requests").add(requestData)
      .then(() => {
        showNotification('Request submitted successfully', 'success');
        e.target.reset();
        updateDashboardStats();
      })
      .catch(error => {
        console.error('Request submission error:', error);
        showNotification('Failed to submit request', 'error');
      })
      .finally(() => {
        hideLoader();
      });
      
  } catch (error) {
    console.error('Submit request error:', error);
    showNotification('An error occurred', 'error');
    hideLoader();
  }
}

// Quote Management
function submitQuote(e) {
  e.preventDefault();
  
  if (!isUserAuthenticated()) {
    showNotification('Please log in to submit quotes', 'error');
    return;
  }
  
  try {
    const customerUID = document.getElementById("bidCustomerId")?.value;
    const propertySize = parseFloat(document.getElementById("bidPropertySize")?.value);
    const amount = parseFloat(document.getElementById("quoteAmount")?.value);
    // Get selected services
    const serviceCheckboxes = document.querySelectorAll('#bidServicesCheckboxes input[type=checkbox]:checked');
    const selectedServices = Array.from(serviceCheckboxes).map(cb => cb.value);

    if (!customerUID || isNaN(amount) || isNaN(propertySize) || selectedServices.length === 0) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    // Calculate minimum profitable price using PackageBuilder
    let minPrice = 0;
    try {
      const packageQuote = window.PackageBuilder.createCustomPackage(selectedServices, propertySize);
      minPrice = packageQuote.total;
    } catch (err) {
      showNotification('Error calculating minimum price: ' + err.message, 'error');
      return;
    }

    // Show warning if below minimum
    const minWarning = document.getElementById('minQuoteWarning');
    if (amount < minPrice) {
      if (minWarning) {
        minWarning.textContent = `Entered amount ($${amount.toFixed(2)}) is below the minimum profitable price ($${minPrice.toFixed(2)}). Please increase the quote amount.`;
        minWarning.style.display = 'block';
      }
      showNotification(`Quote amount must be at least $${minPrice.toFixed(2)} to ensure profitability.`, 'error');
      return;
    } else if (minWarning) {
      minWarning.textContent = '';
      minWarning.style.display = 'none';
    }

    if (!db) {
      showNotification('Database not available', 'error');
      return;
    }
    
    showLoader();
    
    const quoteData = {
      customerId: customerUID,
      amount: amount,
      propertySize: propertySize,
      services: selectedServices,
      status: "Pending",
      createdAt: new Date(),
      submittedBy: 'admin'
    };
    
    db.collection("quotes").add(quoteData)
      .then(() => {
        showNotification('Quote submitted successfully', 'success');
        e.target.reset();
        updateDashboardStats();
      })
      .catch(error => {
        console.error('Quote submission error:', error);
        showNotification('Failed to submit quote', 'error');
      })
      .finally(() => {
        hideLoader();
      });
      
  } catch (error) {
    console.error('Submit quote error:', error);
    showNotification('An error occurred', 'error');
    hideLoader();
  }
}

// Dashboard Statistics
async function updateDashboardStats() {
  try {
    await initializeFirebaseDB();
    if (!db) {
      console.warn('Database not available for dashboard stats');
      return;
    }
    
    const stats = {
      totalCustomers: 0,
      activeRequests: 0,
      pendingQuotes: 0,
      monthlyRevenue: 0
    };
    
    // Get all stats in parallel
    const [customers, requests, quotes] = await Promise.all([
      db.collection("users").where("role", "==", "customer").get(),
      db.collection("service_requests").where("status", "==", "Pending").get(),
      db.collection("quotes").where("status", "==", "Pending").get()
    ]);
    
    stats.totalCustomers = customers.size;
    stats.activeRequests = requests.size;
    stats.pendingQuotes = quotes.size;
    
    // Update UI
    updateStatDisplay('totalCustomers', stats.totalCustomers);
    updateStatDisplay('activeRequests', stats.activeRequests);
    updateStatDisplay('pendingQuotes', stats.pendingQuotes);
  } catch (error) {
    console.error('Error updating dashboard stats:', error);
    showNotification('Failed to update dashboard statistics', 'error');
  }
}

function updateStatDisplay(statId, value) {
  const element = document.getElementById(statId);
  if (element) {
    element.textContent = value.toLocaleString();
  }
}

// Graceful error handling for missing functions
function handleMissingFunction(functionName) {
  console.warn(`Function ${functionName} not implemented yet`);
  showNotification(`${functionName} feature coming soon`, 'info');
}

// Placeholder functions to prevent errors
const placeholderFunctions = [
  'loadQuotes', 'loadExpenses', 'deleteExpense', 'filterTable', 'sortTable',
  'exportTableToCSV', 'exportTableToPDF', 'calculateEnhancedQuote',
  'buildCustomPackage', 'loadCustomerDetails', 'createInvoice',
  'loadEquipmentTable', 'updateEquipmentStatus', 'loadMaterialsTable',
  'loadBidsTable', 'viewBidDetails', 'updateBidStatus'
];

placeholderFunctions.forEach(funcName => {
  window[funcName] = function() {
    handleMissingFunction(funcName);
  };
});

// Initialize when DOM is ready
window.addEventListener('load', async () => {
  try {
    // Wait for Firebase to initialize
    const dbInitialized = await window.firebaseReadyPromise;
    if (!dbInitialized) {
      throw new Error('Failed to initialize database');
    }
    
    // Check if user is authenticated
    const user = window.HollidayApp.currentUser;
    if (!user) {
      console.warn('No user authenticated, redirecting to login...');
      window.location.href = 'login.html';
      return;
    }

    // Check if user is admin
    const userDoc = await window.HollidayApp.db.collection('users').doc(user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      console.warn('User is not an admin, redirecting...');
      window.location.href = 'login.html';
      return;
    }
    
    // Load initial data
    await Promise.all([
      loadCustomersList(),
      loadCustomersDropdown(),
      updateDashboardStats(),
      loadRecentActivity()
    ]);
    
    console.log('✅ Admin dashboard initialized successfully');
  } catch (error) {
    console.error('Dashboard initialization error:', error);
    showNotification('Failed to initialize dashboard. Please refresh the page.', 'error');
  }
});

// Recent Activity Management
async function loadRecentActivity() {
  try {
    await initializeFirebaseDB();
    if (!db) {
      console.warn('Database not available for recent activity');
      return;
    }

    const activityContainer = document.getElementById('recentActivityList');
    if (!activityContainer) {
      console.warn('Recent activity container not found');
      return;
    }

    // Show loading state
    activityContainer.innerHTML = `
      <div style="color: #64748b; padding: 1rem; background: #f8fafc; border-radius: 8px; border-left: 4px solid #64748b;">
        <strong>Recent Activity:</strong> Loading...
        <div style="margin-top: 0.5rem; font-size: 0.875rem;">
          Checking for recent business activity...
        </div>
      </div>
    `;

    showLoader();

    // Get last 10 items from each collection in parallel
    const [requests, quotes, customers] = await Promise.all([
      db.collection('service_requests').orderBy('createdAt', 'desc').limit(10).get(),
      db.collection('quotes').orderBy('createdAt', 'desc').limit(10).get(),
      db.collection('users').where('role', '==', 'customer').orderBy('createdAt', 'desc').limit(10).get()
    ]);

    const activities = [];

    // Process all activities
    requests.forEach(doc => {
      const data = doc.data();
      activities.push({
        type: 'request',
        description: `New service request: ${data.description?.substring(0, 50) || 'No description'}...`,
        timestamp: data.createdAt?.toDate() || new Date(),
        icon: '🔧'
      });
    });

    quotes.forEach(doc => {
      const data = doc.data();
      activities.push({
        type: 'quote',
        description: `New quote created for $${data.amount?.toFixed(2) || '0.00'}`,
        timestamp: data.createdAt?.toDate() || new Date(),
        icon: '💰'
      });
    });

    customers.forEach(doc => {
      const data = doc.data();
      activities.push({
        type: 'customer',
        description: `New customer: ${data.displayName || data.email || 'Anonymous'}`,
        timestamp: data.createdAt?.toDate() || new Date(),
        icon: '👤'
      });
    });

    // Sort by timestamp
    activities.sort((a, b) => b.timestamp - a.timestamp);

    // Update UI
    if (activities.length === 0) {
      activityContainer.innerHTML = `
        <div style="color: #64748b; padding: 1rem; background: #f8fafc; border-radius: 8px; border-left: 4px solid #64748b;">
          <strong>Recent Activity:</strong> No recent activity
          <div style="margin-top: 0.5rem; font-size: 0.875rem;">
            The system is ready to track new business activities.
          </div>
        </div>
      `;
    } else {
      activityContainer.innerHTML = activities.slice(0, 10).map(activity => `
        <div style="color: #1e293b; padding: 1rem; background: #f8fafc; border-radius: 8px; border-left: 4px solid #2563eb; margin-bottom: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.25rem;">${activity.icon}</span>
            <strong>${activity.description}</strong>
          </div>
          <div style="margin-top: 0.5rem; font-size: 0.875rem; color: #64748b;">
            ${activity.timestamp.toLocaleDateString()} at ${activity.timestamp.toLocaleTimeString()}
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading recent activity:', error);
    const activityContainer = document.getElementById('recentActivityList');
    if (activityContainer) {
      activityContainer.innerHTML = `
        <div style="color: #ef4444; padding: 1rem; background: #fef2f2; border-radius: 8px; border-left: 4px solid #ef4444;">
          <strong>Error Loading Activity</strong>
          <div style="margin-top: 0.5rem; font-size: 0.875rem;">
            There was a problem loading recent activities. Please try again later.
          </div>
        </div>
      `;
    }
  } finally {
    hideLoader();
  }
}

// Customer Management Functions
async function addCustomer(e) {
  e.preventDefault();
  
  if (!isUserAuthenticated()) {
    showNotification('Please log in to manage customers', 'error');
    return;
  }

  try {
    const customerData = {
      email: document.getElementById("customerEmail").value,
      displayName: document.getElementById("customerName").value,
      phone: document.getElementById("customerPhone").value,
      address: {
        street: document.getElementById("customerStreet").value,
        city: document.getElementById("customerCity").value,
        state: document.getElementById("customerState").value,
        zip: document.getElementById("customerZip").value
      },
      propertyDetails: {
        sizeSqFt: parseFloat(document.getElementById("propertySizeSqFt").value),
        propertyType: document.getElementById("propertyType").value,
        hasPool: document.getElementById("hasPool").checked,
        hasSprinklers: document.getElementById("hasSprinklers").checked
      },
      preferences: {
        communicationMethod: document.getElementById("communicationMethod").value,
        serviceFrequency: document.getElementById("serviceFrequency").value
      },
      role: 'customer',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      isActive: true
    };

    // Validate required fields
    if (!customerData.email || !customerData.displayName || !customerData.phone) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    showLoader();
    
    // Create user in Firebase Auth if email is provided
    let userCredential;
    try {
      userCredential = await firebase.auth().createUserWithEmailAndPassword(customerData.email, generateTempPassword());
      // Send password reset email to customer
      await firebase.auth().sendPasswordResetEmail(customerData.email);
    } catch (authError) {
      console.error('Auth error:', authError);
      showNotification('Error creating customer account: ' + authError.message, 'error');
      hideLoader();
      return;
    }

    // Add customer data to Firestore
    await db.collection("users").doc(userCredential.user.uid).set(customerData);
    
    showNotification('Customer added successfully', 'success');
    document.getElementById("addCustomerForm").reset();
    loadCustomersDropdown(); // Refresh customer list
    updateDashboardStats();
  } catch (error) {
    console.error('Add customer error:', error);
    showNotification('Failed to add customer: ' + error.message, 'error');
  } finally {
    hideLoader();
  }
}

async function editCustomer(e) {
  e.preventDefault();
  
  if (!isUserAuthenticated()) {
    showNotification('Please log in to manage customers', 'error');
    return;
  }

  try {
    const customerId = document.getElementById("editCustomerId").value;
    const customerData = {
      email: document.getElementById("editCustomerEmail").value,
      displayName: document.getElementById("editCustomerName").value,
      phone: document.getElementById("editCustomerPhone").value,
      address: {
        street: document.getElementById("editCustomerStreet").value,
        city: document.getElementById("editCustomerCity").value,
        state: document.getElementById("editCustomerState").value,
        zip: document.getElementById("editCustomerZip").value
      },
      propertyDetails: {
        sizeSqFt: parseFloat(document.getElementById("editPropertySizeSqFt").value),
        propertyType: document.getElementById("editPropertyType").value,
        hasPool: document.getElementById("editHasPool").checked,
        hasSprinklers: document.getElementById("editHasSprinklers").checked
      },
      preferences: {
        communicationMethod: document.getElementById("editCommunicationMethod").value,
        serviceFrequency: document.getElementById("editServiceFrequency").value
      }
    };

    if (!customerId || !customerData.email || !customerData.displayName) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    showLoader();
    
    await db.collection("users").doc(customerId).update(customerData);
    
    showNotification('Customer updated successfully', 'success');
    document.getElementById("editCustomerForm").reset();
    document.getElementById("editCustomerModal").style.display = "none";
    loadCustomersDropdown(); // Refresh customer list
  } catch (error) {
    console.error('Edit customer error:', error);
    showNotification('Failed to update customer: ' + error.message, 'error');
  } finally {
    hideLoader();
  }
}

async function deleteCustomer(customerId) {
  if (!isUserAuthenticated()) {
    showNotification('Please log in to manage customers', 'error');
    return;
  }

  if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
    return;
  }

  try {
    showLoader();
    
    // Get customer data to check if they have active services
    const customerDoc = await db.collection("users").doc(customerId).get();
    if (!customerDoc.exists) {
      showNotification('Customer not found', 'error');
      return;
    }

    // Check for active service requests
    const activeRequests = await db.collection("service_requests")
      .where("customerId", "==", customerId)
      .where("status", "in", ["Pending", "In Progress"])
      .get();

    if (!activeRequests.empty) {
      showNotification('Cannot delete customer with active service requests', 'error');
      return;
    }

    // Delete customer auth account
    const customerData = customerDoc.data();
    if (customerData.email) {
      try {
        // Get user by email and delete
        const userRecord = await firebase.auth().getUserByEmail(customerData.email);
        await firebase.auth().deleteUser(userRecord.uid);
      } catch (authError) {
        console.warn('Auth deletion error:', authError);
        // Continue with Firestore deletion even if auth deletion fails
      }
    }

    // Delete customer document
    await db.collection("users").doc(customerId).delete();
    
    showNotification('Customer deleted successfully', 'success');
    loadCustomersDropdown(); // Refresh customer list
    updateDashboardStats();
  } catch (error) {
    console.error('Delete customer error:', error);
    showNotification('Failed to delete customer: ' + error.message, 'error');
  } finally {
    hideLoader();
  }
}

// Utility function for new customer creation
function generateTempPassword() {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Load customer details for editing
async function loadCustomerForEdit(customerId) {
  try {
    showLoader();
    
    const customerDoc = await db.collection("users").doc(customerId).get();
    if (!customerDoc.exists) {
      showNotification('Customer not found', 'error');
      return;
    }

    const data = customerDoc.data();
    
    // Populate edit form
    document.getElementById("editCustomerId").value = customerId;
    document.getElementById("editCustomerEmail").value = data.email || '';
    document.getElementById("editCustomerName").value = data.displayName || '';
    document.getElementById("editCustomerPhone").value = data.phone || '';
    document.getElementById("editCustomerStreet").value = data.address?.street || '';
    document.getElementById("editCustomerCity").value = data.address?.city || '';
    document.getElementById("editCustomerState").value = data.address?.state || '';
    document.getElementById("editCustomerZip").value = data.address?.zip || '';
    document.getElementById("editPropertySizeSqFt").value = data.propertyDetails?.sizeSqFt || '';
    document.getElementById("editPropertyType").value = data.propertyDetails?.propertyType || 'residential';
    document.getElementById("editHasPool").checked = data.propertyDetails?.hasPool || false;
    document.getElementById("editHasSprinklers").checked = data.propertyDetails?.hasSprinklers || false;
    document.getElementById("editCommunicationMethod").value = data.preferences?.communicationMethod || 'email';
    document.getElementById("editServiceFrequency").value = data.preferences?.serviceFrequency || 'bi-weekly';
    
    // Show edit modal
    document.getElementById("editCustomerModal").style.display = "block";
  } catch (error) {
    console.error('Load customer error:', error);
    showNotification('Failed to load customer details: ' + error.message, 'error');
  } finally {
    hideLoader();
  }
}

// Export functions for global access
window.showTab = showTab;
window.toggleDarkMode = toggleDarkMode;
window.submitRequest = submitRequest;
window.submitQuote = submitQuote;
window.loadCustomersDropdown = loadCustomersDropdown;
window.updateDashboardStats = updateDashboardStats;
window.loadRecentActivity = loadRecentActivity;
window.addCustomer = addCustomer;
window.editCustomer = editCustomer;
window.deleteCustomer = deleteCustomer;
window.loadCustomerForEdit = loadCustomerForEdit;
