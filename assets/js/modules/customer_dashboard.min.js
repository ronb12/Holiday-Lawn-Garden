import { handleError, handleFirebaseError } from './error-handler.js';
import { auth, db, showError } from './firebase.js';
function initializeDashboard(e) {
  const t = document.getElementById('user-info');
  t && (t.textContent = `Welcome, ${e.displayName || e.email}`),
    loadUserData(e.uid),
    setupRealtimeListeners(e.uid),
    initializeEventListeners();
}
async function loadUserData(e) {
  try {
    const t = await db.collection('users').doc(e).get();
    if (t.exists) {
      updateDashboardUI(t.data());
    } else handleError(new Error('User data not found'), 'loadUserData');
  } catch (e) {
    handleFirebaseError(e);
  }
}
function setupRealtimeListeners(e) {
  db.collection('service-requests')
    .where('userId', '==', e)
    .onSnapshot(
      e => {
        e.docChanges().forEach(e => {
          'added' === e.type || 'modified' === e.type
            ? updateServiceRequestUI(e.doc.data(), e.doc.id)
            : 'removed' === e.type && removeServiceRequestUI(e.doc.id);
        });
      },
      e => {
        handleFirebaseError(e);
      }
    );
}
function updateDashboardUI(e) {
  const t = document.getElementById('profile-section');
  t &&
    (t.innerHTML = `\n      <h3>Profile Information</h3>\n      <p><strong>Name:</strong> ${e.displayName || 'Not set'}</p>\n      <p><strong>Email:</strong> ${e.email}</p>\n      <p><strong>Phone:</strong> ${e.phone || 'Not set'}</p>\n      <button onclick="editProfile()" class="btn btn-primary">Edit Profile</button>\n    `);
  const n = document.getElementById('service-history');
  n &&
    e.serviceHistory &&
    (n.innerHTML = e.serviceHistory
      .map(
        e =>
          `\n        <div class="service-item">\n          <h4>${e.type}</h4>\n          <p>Date: ${new Date(e.date).toLocaleDateString()}</p>\n          <p>Status: ${e.status}</p>\n        </div>\n      `
      )
      .join(''));
}
function updateServiceRequestUI(e, t) {
  const n = document.getElementById('service-requests');
  if (!n) return;
  const o = document.getElementById(`request-${t}`) || document.createElement('div');
  (o.id = `request-${t}`),
    (o.className = 'service-request-item'),
    (o.innerHTML = `\n    <h4>${e.serviceType}</h4>\n    <p>Date: ${new Date(e.requestDate).toLocaleDateString()}</p>\n    <p>Status: ${e.status}</p>\n    <p>Notes: ${e.notes || 'No notes'}</p>\n  `),
    document.getElementById(`request-${t}`) || n.appendChild(o);
}
function removeServiceRequestUI(e) {
  const t = document.getElementById(`request-${e}`);
  t && t.remove();
}
function initializeEventListeners() {
  const e = document.getElementById('logout-button');
  e && e.addEventListener('click', handleLogout);
  const t = document.getElementById('new-request-button');
  t &&
    t.addEventListener('click', () => {
      window.location.href = '/service-request.html';
    });
}
function handleLogout() {
  auth
    .signOut()
    .then(() => {
      sessionStorage.removeItem('user'), (window.location.href = '/login.html');
    })
    .catch(e => {
      handleFirebaseError(e);
    });
}
function editProfile() {
  window.location.href = '/profile.html';
}
document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged(e => {
    e ? initializeDashboard(e) : (window.location.href = '/login.html');
  });
}),
  (window.handleLogout = handleLogout),
  (window.editProfile = editProfile);
const initializeServices = () => {
  try {
    if (!window.HollidayApp || !window.HollidayApp.auth)
      throw new Error('Firebase not initialized');
  } catch (e) {
    showError('Failed to initialize services');
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
