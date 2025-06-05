// Admin Functions Module - Clean Error Handling Version
// Handles core administrative functionality for Holliday's Lawn & Garden

// Initialize when DOM is ready
window.addEventListener('load', async () => {
  try {
    // Wait for Firebase initialization event
    window.addEventListener('firebaseInitialized', async () => {
      // Check if user is authenticated
      if (!window.HollidayApp.isAuthenticated()) {
        console.warn('No user authenticated, redirecting to login...');
        window.location.href = 'login.html';
        return;
      }

      // Check if user is admin
      const isAdmin = await window.HollidayApp.isAdmin();
      if (!isAdmin) {
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
    });
  } catch (error) {
    console.error('Dashboard initialization error:', error);
    showNotification('Failed to initialize dashboard. Please refresh the page.', 'error');
  }
});

// Customer Management
async function loadCustomersList() {
  try {
    const snapshot = await window.HollidayApp.db
      .collection("users")
      .where("role", "==", "customer")
      .get();

    const customersList = document.getElementById("customersList");
    if (!customersList) return;

    if (snapshot.empty) {
      customersList.innerHTML = '<tr><td colspan="4">No customers found</td></tr>';
      return;
    }

    customersList.innerHTML = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      customersList.innerHTML += `
        <tr>
          <td>${data.displayName || 'N/A'}</td>
          <td>${data.email}</td>
          <td>${data.phone || 'N/A'}</td>
          <td>
            <button onclick="editCustomer('${doc.id}')" class="btn-edit">Edit</button>
            <button onclick="deleteCustomer('${doc.id}')" class="btn-delete">Delete</button>
          </td>
        </tr>
      `;
    });
  } catch (error) {
    console.error('Error loading customers:', error);
    showNotification('Failed to load customers list', 'error');
  }
}

// Service Request Management
async function submitRequest(e) {
  e.preventDefault();
  
  if (!window.HollidayApp.isAuthenticated()) {
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
    
    showLoader();
    
    const requestData = {
      customerId: customerUID,
      description: description,
      status: "Pending",
      createdAt: new Date(),
      submittedBy: window.HollidayApp.auth.currentUser.uid
    };
    
    await window.HollidayApp.db.collection("service_requests").add(requestData);
    showNotification('Request submitted successfully', 'success');
    e.target.reset();
    await updateDashboardStats();
  } catch (error) {
    console.error('Submit request error:', error);
    showNotification('Failed to submit request', 'error');
  } finally {
    hideLoader();
  }
}

// Dashboard Stats
async function updateDashboardStats() {
  try {
    const stats = {
      totalCustomers: 0,
      activeRequests: 0,
      pendingQuotes: 0,
      monthlyRevenue: 0
    };
    
    // Get stats in parallel
    const [customers, requests, quotes] = await Promise.all([
      window.HollidayApp.db.collection("users").where("role", "==", "customer").get(),
      window.HollidayApp.db.collection("service_requests").where("status", "==", "Pending").get(),
      window.HollidayApp.db.collection("quotes").where("status", "==", "Pending").get()
    ]);
    
    stats.totalCustomers = customers.size;
    stats.activeRequests = requests.size;
    stats.pendingQuotes = quotes.size;
    
    // Update UI
    Object.entries(stats).forEach(([key, value]) => {
      const element = document.getElementById(key);
      if (element) {
        element.textContent = value.toLocaleString();
      }
    });
  } catch (error) {
    console.error('Error updating dashboard stats:', error);
    showNotification('Failed to update dashboard stats', 'error');
  }
}

// Utility Functions
function showLoader() {
  const loader = document.getElementById("loadingIndicator");
  if (loader) loader.style.display = "flex";
}

function hideLoader() {
  const loader = document.getElementById("loadingIndicator");
  if (loader) loader.style.display = "none";
}

function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification');
  if (notification) {
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    setTimeout(() => {
      notification.style.display = 'none';
    }, 3000);
  }
  console.log(`${type.toUpperCase()}: ${message}`);
}

// Export functions for global access
window.showLoader = showLoader;
window.hideLoader = hideLoader;
window.showNotification = showNotification;
window.submitRequest = submitRequest;
window.loadCustomersList = loadCustomersList;
window.updateDashboardStats = updateDashboardStats; 