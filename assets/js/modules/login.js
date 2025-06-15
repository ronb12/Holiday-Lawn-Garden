// login.js
// login.js

import { setPersistence, browserLocalPersistence, signInWithEmailAndPassword, signInWithPopup } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { auth, googleProvider, initializeFirebase } from './firebase.js';

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

// Wait until DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize Firebase
    await initializeFirebase();
    await setPersistence(auth, browserLocalPersistence);
    console.log('Firebase initialized successfully');

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginForm = document.getElementById('login-form');
    const googleSignInBtn = document.getElementById('googleSignIn');
    const loadingOverlay = document.getElementById('loading-overlay');
    const errorContainer = document.getElementById('error-container');

    // Helper: Show/hide loading
    const showLoading = (message = 'Loading...') => {
      if (loadingOverlay) {
        const loadingText = document.getElementById('loading-message');
        if (loadingText) {
          loadingText.textContent = message;
        }
        loadingOverlay.style.display = 'flex';
      }
    };

    const hideLoading = () => {
      if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
      }
    };

    // Helper: Display error
    const displayError = message => {
      if (errorContainer) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        errorContainer.innerHTML = '';
        errorContainer.appendChild(errorDiv);

        // Auto-hide after 5 seconds
        setTimeout(() => {
          errorDiv.remove();
        }, 5000);
      }
    };

    // Helper: Display success
    const displaySuccess = message => {
      if (errorContainer) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        errorContainer.innerHTML = '';
        errorContainer.appendChild(successDiv);
      }
    };

    // Email/Password login
    if (loginForm) {
      loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        showLoading('Signing in...');
        displayError('');

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
          displayError('Please enter both email and password');
          hideLoading();
          return;
        }

        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          displaySuccess('Login successful! Redirecting...');

          // Store user data in localStorage
          localStorage.setItem(
            'user',
            JSON.stringify({
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              displayName: userCredential.user.displayName,
            })
          );

          // Redirect to dashboard after a short delay
          setTimeout(() => {
            window.location.href = '/customer-dashboard.html';
          }, 1000);
        } catch (error) {
          console.error('Email login failed:', error);
          let errorMessage = 'Failed to sign in. ';

          switch (error.code) {
            case 'auth/user-not-found':
              errorMessage += 'No account found with this email.';
              break;
            case 'auth/wrong-password':
              errorMessage += 'Incorrect password.';
              break;
            case 'auth/invalid-email':
              errorMessage += 'Invalid email format.';
              break;
            case 'auth/user-disabled':
              errorMessage += 'This account has been disabled.';
              break;
            case 'auth/too-many-requests':
              errorMessage += 'Too many failed attempts. Please try again later';
              break;
            default:
              errorMessage += error.message;
          }

          displayError(errorMessage);
        } finally {
          hideLoading();
        }
      });
    }

    // Google Sign-In
    if (googleSignInBtn) {
      googleSignInBtn.addEventListener('click', async () => {
        showLoading('Signing in with Google...');
        displayError('');

        try {
          const result = await signInWithPopup(auth, googleProvider);
          displaySuccess('Login successful! Redirecting...');

          // Store user data in localStorage
          localStorage.setItem(
            'user',
            JSON.stringify({
              uid: result.user.uid,
              email: result.user.email,
              displayName: result.user.displayName,
              photoURL: result.user.photoURL,
            })
          );

          // Redirect to dashboard after a short delay
          setTimeout(() => {
            window.location.href = '/customer-dashboard.html';
          }, 1000);
        } catch (error) {
          console.error('Google login failed:', error);
          let errorMessage = 'Failed to sign in with Google. ';

          switch (error.code) {
            case 'auth/popup-blocked':
              errorMessage += 'Please allow popups for this site.';
              break;
            case 'auth/popup-closed-by-user':
              errorMessage += 'Sign-in was cancelled.';
              break;
            case 'auth/cancelled-popup-request':
              errorMessage += 'Please try again.';
              break;
            case 'auth/account-exists-with-different-credential':
              errorMessage +=
                'An account already exists with the same email address but different sign-in credentials.';
              break;
            case 'auth/network-request-failed':
              errorMessage += 'Network error. Please check your internet connection.';
              break;
            default:
              errorMessage += error.message;
          }

          displayError(errorMessage);
        } finally {
          hideLoading();
        }
      });
    }

    // Password visibility toggle
    const togglePasswordBtn = document.querySelector('.toggle-password');
    if (togglePasswordBtn) {
      togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        const icon = togglePasswordBtn.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
      });
    }
  } catch (error) {
    console.error('Login initialization failed:', error);
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
      errorContainer.innerHTML =
        '<div class="error-message"><i class="fas fa-exclamation-circle"></i> Failed to initialize the application. Please refresh the page.</div>';
    }
  }
});

export {};
