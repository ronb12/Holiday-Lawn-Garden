// Profile Management JavaScript
import { handleError, handleFirebaseError } from './error-handler.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { showError } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  // Check authentication state
  auth.onAuthStateChanged(user => {
    if (!user) {
      // If not logged in, redirect to login page
      window.location.href = '/login.html';
      return;
    }

    // User is logged in, initialize profile
    initializeProfile(user);
  });
});

function initializeProfile(user) {
  // Load user's data
  loadUserData(user.uid);

  // Initialize event listeners
  initializeEventListeners();
}

async function loadUserData(userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      updateProfileUI(userData);
    } else {
      handleError(new Error('User data not found'), 'loadUserData');
    }
  } catch (error) {
    handleFirebaseError(error);
  }
}

function updateProfileUI(userData) {
  // Update profile information
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    // Set form values
    document.getElementById('displayName').value = userData.displayName || '';
    document.getElementById('email').value = userData.email || '';
    document.getElementById('phone').value = userData.phone || '';
    document.getElementById('address').value = userData.address || '';
  }
}

function initializeEventListeners() {
  // Add event listeners for profile interactions
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', handleProfileUpdate);
  }

  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
  }
}

async function handleProfileUpdate(event) {
  event.preventDefault();

  const user = auth.currentUser;
  if (!user) {
    showError('You must be logged in to update your profile');
    return;
  }

  const formData = new FormData(event.target);
  const updates = {
    displayName: formData.get('displayName'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    updatedAt: new Date().toISOString()
  };

  try {
    // Update user profile in Firestore
    await db.collection('users').doc(user.uid).update(updates);

    // Update auth profile
    await user.updateProfile({
      displayName: updates.displayName
    });

    showSuccess('Profile updated successfully');
  } catch (error) {
    handleFirebaseError(error);
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

function showSuccess(message) {
  const successMessage = document.createElement('div');
  successMessage.className = 'success-message';
  successMessage.textContent = message;
  successMessage.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #2e7d32;
    color: white;
    padding: 1rem;
    border-radius: 4px;
    z-index: 1000;
  `;
  document.body.appendChild(successMessage);
  setTimeout(() => successMessage.remove(), 3000);
} 