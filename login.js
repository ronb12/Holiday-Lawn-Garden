// Authentication functions
async function emailPasswordLogin() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('loginErrorMessage');

  try {
    const userCredential = await window.HollidayApp.auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Check if user is admin
    const db = window.HollidayApp.db;
    const adminDoc = await db.collection('admins').doc(user.uid).get();
    
    if (adminDoc.exists) {
      window.location.href = '/admin.html';
    } else {
      window.location.href = '/customer-dashboard.html';
    }
  } catch (error) {
    console.error('Login error:', error);
    errorDiv.textContent = getErrorMessage(error.code);
    errorDiv.style.display = 'block';
  }
}

async function googleSignIn() {
  const provider = new firebase.auth.GoogleAuthProvider();
  const errorDiv = document.getElementById('loginErrorMessage');

  try {
    const result = await window.HollidayApp.auth.signInWithPopup(provider);
    const user = result.user;
    
    // Check if user is admin
    const db = window.HollidayApp.db;
    const adminDoc = await db.collection('admins').doc(user.uid).get();
    
    if (adminDoc.exists) {
      window.location.href = '/admin.html';
    } else {
      window.location.href = '/customer-dashboard.html';
    }
  } catch (error) {
    console.error('Google sign-in error:', error);
    errorDiv.textContent = getErrorMessage(error.code);
    errorDiv.style.display = 'block';
  }
}

function getErrorMessage(errorCode) {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email. Please create an account.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed. Please try again.';
    default:
      return 'An error occurred. Please try again.';
  }
}

// Check authentication state
window.HollidayApp.auth.onAuthStateChanged((user) => {
  if (user) {
    // User is signed in, redirect to appropriate dashboard
    const db = window.HollidayApp.db;
    db.collection('admins').doc(user.uid).get()
      .then((doc) => {
        if (doc.exists) {
          window.location.href = '/admin.html';
        } else {
          window.location.href = '/customer-dashboard.html';
        }
      })
      .catch((error) => {
        console.error('Error checking admin status:', error);
      });
  }
}); 