// Admin Functions Module - Clean Error Handling Version
// Handles core administrative functionality for Holliday's Lawn & Garden

// Firebase configuration and initialization
let db;
let auth;

// Initialize Firebase DB reference
function initializeFirebaseDB() {
  try {
    if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
      db = firebase.firestore();
      auth = firebase.auth();
      return true;
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
  return false;
}

// Ensure Firebase is ready before executing admin functions
function ensureFirebaseReady(callback) {
  if (initializeFirebaseDB()) {
    callback();
  } else {
    setTimeout(() => {
      if (initializeFirebaseDB()) {
        callback();
      } else {
        console.warn('Firebase not ready - running in offline mode');
        callback(); // Allow app to continue functioning
      }
    }, 1000);
  }
}

// Authentication state management
function getCurrentUser() {
  return auth ? auth.currentUser : null;
}

function isUserAuthenticated() {
  return getCurrentUser() !== null;
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
    }
  } catch (error) {
    console.warn('Tab switching error:', error);
  }
}

// Customer Management
function loadCustomersDropdown() {
  if (!db) {
    console.warn('Database not available for customer dropdown');
    return;
  }
  
  const dropdownIds = ["requestCustomer", "quoteCustomer", "invoiceCustomer", "customerSelect", "bidCustomerId"];
  
  dropdownIds.forEach(id => {
    const dropdown = document.getElementById(id);
    if (!dropdown) return;
    
    dropdown.innerHTML = '<option value="">Select Customer</option>';
    
    db.collection("users").where("role", "==", "customer").get()
      .then(snapshot => {
        if (snapshot.empty) {
          dropdown.innerHTML += '<option value="" disabled>No customers found</option>';
          return;
        }
        
        snapshot.forEach(doc => {
          const data = doc.data();
          const option = document.createElement("option");
          option.value = doc.id;
          option.text = data.displayName || data.email || "Customer";
          dropdown.appendChild(option);
        });
      })
      .catch(error => {
        console.warn(`Customer dropdown error for ${id}:`, error.message);
        dropdown.innerHTML += '<option value="" disabled>Error loading customers</option>';
      });
  });
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
    const customerUID = document.getElementById("quoteCustomer")?.value;
    const amount = parseFloat(document.getElementById("quoteAmount")?.value);
    
    if (!customerUID || isNaN(amount)) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }
    
    if (!db) {
      showNotification('Database not available', 'error');
      return;
    }
    
    showLoader();
    
    const quoteData = {
      customerId: customerUID,
      amount: amount,
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
function updateDashboardStats() {
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
  
  // Count customers
  db.collection("users").where("role", "==", "customer").get()
    .then(snapshot => {
      stats.totalCustomers = snapshot.size;
      updateStatDisplay('totalCustomers', stats.totalCustomers);
    })
    .catch(error => console.warn('Error counting customers:', error));
  
  // Count active requests
  db.collection("service_requests").where("status", "==", "Pending").get()
    .then(snapshot => {
      stats.activeRequests = snapshot.size;
      updateStatDisplay('activeRequests', stats.activeRequests);
    })
    .catch(error => console.warn('Error counting requests:', error));
  
  // Count pending quotes
  db.collection("quotes").where("status", "==", "Pending").get()
    .then(snapshot => {
      stats.pendingQuotes = snapshot.size;
      updateStatDisplay('pendingQuotes', stats.pendingQuotes);
    })
    .catch(error => console.warn('Error counting quotes:', error));
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
window.addEventListener('load', () => {
  ensureFirebaseReady(() => {
    try {
      // Apply saved theme
      if (localStorage.getItem("darkMode") === "on") {
        document.body.classList.add("dark");
      }
      
      // Load initial data
      loadCustomersDropdown();
      updateDashboardStats();
      
      console.log('Admin dashboard initialized successfully');
    } catch (error) {
      console.error('Dashboard initialization error:', error);
    }
  });
});

// Export functions for global access
window.showTab = showTab;
window.toggleDarkMode = toggleDarkMode;
window.submitRequest = submitRequest;
window.submitQuote = submitQuote;
window.loadCustomersDropdown = loadCustomersDropdown;
window.updateDashboardStats = updateDashboardStats;
