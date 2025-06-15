// customer_dashboard.js
// Customer Dashboard JavaScript
import { handleError, handleFirebaseError } from './error-handler.js';
import { auth, db, showError } from './firebase.js';

// Inactivity logout logic
let inactivityTimeout;
const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes
const resetInactivityTimer = () => {
  clearTimeout(inactivityTimeout);
  inactivityTimeout = setTimeout(() => {
    if (auth.currentUser) {
      auth.signOut().then(() => {
        window.location.href = '/login.html';
      });
    }
  }, INACTIVITY_LIMIT);
};
['mousemove', 'keydown', 'mousedown', 'touchstart'].forEach(event => {
  window.addEventListener(event, resetInactivityTimer);
});
resetInactivityTimer();

document.addEventListener('DOMContentLoaded', () => {
  // Check authentication state
  auth.onAuthStateChanged(user => {
    if (!user) {
      // If not logged in, redirect to login page
      window.location.href = '/login.html';
      return;
    }

    // User is logged in, initialize dashboard
    initializeDashboard(user);
  });
});

function initializeDashboard(user) {
  // Update UI with user info
  const userInfo = document.getElementById('user-info');
  if (userInfo) {
    userInfo.textContent = `Welcome, ${user.displayName || user.email}`;
  }

  // Load user's data
  loadUserData(user.uid);

  // Set up real-time listeners
  setupRealtimeListeners(user.uid);

  // Initialize event listeners
  initializeEventListeners();
}

async function loadUserData(userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      updateDashboardUI(userData);
    } else {
      handleError(new Error('User data not found'), 'loadUserData');
    }
  } catch (error) {
    handleFirebaseError(error);
  }
}

function setupRealtimeListeners(userId) {
  // Listen for service requests
  db.collection('service-requests')
    .where('userId', '==', userId)
    .onSnapshot(
      snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added' || change.type === 'modified') {
            updateServiceRequestUI(change.doc.data(), change.doc.id);
          } else if (change.type === 'removed') {
            removeServiceRequestUI(change.doc.id);
          }
        });
      },
      error => {
        handleFirebaseError(error);
      }
    );
}

function updateDashboardUI(userData) {
  // Update profile information
  const profileSection = document.getElementById('profile-section');
  if (profileSection) {
    profileSection.innerHTML = `
      <h3>Profile Information</h3>
      <p><strong>Name:</strong> ${userData.displayName || 'Not set'}</p>
      <p><strong>Email:</strong> ${userData.email}</p>
      <p><strong>Phone:</strong> ${userData.phone || 'Not set'}</p>
      <button onclick="editProfile()" class="btn btn-primary">Edit Profile</button>
    `;
  }

  // Update service history
  const serviceHistory = document.getElementById('service-history');
  if (serviceHistory && userData.serviceHistory) {
    serviceHistory.innerHTML = userData.serviceHistory
      .map(
        service => `
        <div class="service-item">
          <h4>${service.type}</h4>
          <p>Date: ${new Date(service.date).toLocaleDateString()}</p>
          <p>Status: ${service.status}</p>
        </div>
      `
      )
      .join('');
  }
}

function updateServiceRequestUI(request, requestId) {
  const requestsContainer = document.getElementById('service-requests');
  if (!requestsContainer) return;

  const requestElement =
    document.getElementById(`request-${requestId}`) || document.createElement('div');
  requestElement.id = `request-${requestId}`;
  requestElement.className = 'service-request-item';
  requestElement.innerHTML = `
    <h4>${request.serviceType}</h4>
    <p>Date: ${new Date(request.requestDate).toLocaleDateString()}</p>
    <p>Status: ${request.status}</p>
    <p>Notes: ${request.notes || 'No notes'}</p>
  `;

  if (!document.getElementById(`request-${requestId}`)) {
    requestsContainer.appendChild(requestElement);
  }
}

function removeServiceRequestUI(requestId) {
  const requestElement = document.getElementById(`request-${requestId}`);
  if (requestElement) {
    requestElement.remove();
  }
}

function initializeEventListeners() {
  // Add event listeners for dashboard interactions
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
  }

  const newRequestButton = document.getElementById('new-request-button');
  if (newRequestButton) {
    newRequestButton.addEventListener('click', () => {
      window.location.href = '/service-request.html';
    });
  }
}

function handleLogout() {
  auth
    .signOut()
    .then(() => {
      sessionStorage.removeItem('user');
      window.location.href = '/login.html';
    })
    .catch(error => {
      handleFirebaseError(error);
    });
}

function editProfile() {
  window.location.href = '/profile.html';
}

// Export functions for use in other files
window.handleLogout = handleLogout;
window.editProfile = editProfile;

// Initialize Firebase services
const initializeServices = () => {
  try {
    if (!window.HollidayApp || !window.HollidayApp.auth) {
      throw new Error('Firebase not initialized');
    }
  } catch (error) {
    showError('Failed to initialize services');
    console.error(error);
  }
};

export {
  initializeDashboard,
  loadUserData,
  setupRealtimeListeners,
  updateDashboardUI,
  updateServiceRequestUI,
  removeServiceRequestUI,
  initializeEventListeners,
  handleLogout,
  editProfile,
};
