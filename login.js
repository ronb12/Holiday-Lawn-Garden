const loginErrorMessage = document.getElementById('loginErrorMessage');
let db; // Initialize later when Firebase is ready

// Wait for Firebase to be ready
function initializeFirebaseLogin() {
  try {
    if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
      db = firebase.firestore();
      console.log("Firebase initialized for login");
    } else {
      console.error("Firebase not initialized");
      if(loginErrorMessage) loginErrorMessage.textContent = "Authentication service not available. Please refresh the page.";
    }
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    if(loginErrorMessage) loginErrorMessage.textContent = "Authentication service error. Please refresh the page.";
  }
}

// Initialize Google Sign-In
window.onload = function () {
  // Initialize Firebase first
  initializeFirebaseLogin();
  
  console.log("Page loaded - Firebase authentication ready");
};

async function handleUserLogin(firebaseUser) {
  if (!firebaseUser) {
    if(loginErrorMessage) loginErrorMessage.textContent = "User authentication failed.";
    return;
  }
  
  try {
    const userDocRef = db.collection("users").doc(firebaseUser.uid);
    const userDoc = await userDocRef.get();

    if (userDoc.exists && userDoc.data().role === "admin") {
      window.location.href = "admin.html";
    } else {
      if (!userDoc.exists) {
        // If user doc doesn't exist (e.g., first Google Sign-In), create it with customer role
        await userDocRef.set({
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          uid: firebaseUser.uid,
          role: "customer",
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("New user document created for:", firebaseUser.email);
      }
      window.location.href = "customer-dashboard.html";
    }
  } catch (error) {
    console.error("Error during role check or user doc creation: ", error);
    if(loginErrorMessage) loginErrorMessage.textContent = "Login error: Could not verify user role. " + error.message;
  }
}

// Email/Password Login with role-based redirect
function emailPasswordLogin() {
  if(loginErrorMessage) loginErrorMessage.textContent = ""; // Clear previous errors
  
  // Check if Firebase is ready
  if (!db || typeof firebase === 'undefined') {
    if(loginErrorMessage) loginErrorMessage.textContent = "Authentication service not ready. Please refresh the page.";
    return;
  }
  
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  
  if (!emailInput || !passwordInput) {
      console.error("Email or password input field not found.");
      if(loginErrorMessage) loginErrorMessage.textContent = "Login fields are missing. Please contact support.";
      return;
  }

  const email = emailInput.value;
  const password = passwordInput.value;

  if (!email || !password) {
    if(loginErrorMessage) loginErrorMessage.textContent = "Please enter both email and password.";
    return;
  }

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      handleUserLogin(userCredential.user);
    })
    .catch((error) => {
      if(loginErrorMessage) loginErrorMessage.textContent = "Login failed: " + error.message;
    });
}

// Simple Firebase Google Sign-In
function googleSignIn() {
  if(loginErrorMessage) loginErrorMessage.textContent = ""; // Clear previous errors
  
  // Check if Firebase is ready
  if (!db || typeof firebase === 'undefined') {
    if(loginErrorMessage) loginErrorMessage.textContent = "Authentication service not ready. Please refresh the page.";
    return;
  }

  const provider = new firebase.auth.GoogleAuthProvider();
  
  firebase.auth().signInWithPopup(provider)
    .then((result) => {
      console.log("Google Sign-In successful for Firebase user:", result.user.email);
      handleUserLogin(result.user);
    })
    .catch((error) => {
      console.error("Firebase Google Sign-In error:", error);
      if(loginErrorMessage) loginErrorMessage.textContent = "Google Sign-In failed: " + error.message;
      if (error.code === 'auth/account-exists-with-different-credential') {
        if(loginErrorMessage) loginErrorMessage.textContent += " Try logging in with the original method you used for this email.";
      }
    });
}

// Fade-in animation for sections with class 'fade-in'
document.addEventListener('DOMContentLoaded', () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Optional: stop observing after animation
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in').forEach(section => {
    observer.observe(section);
  });

  // Add null checks for loginErrorMessage if it might not exist on all pages this script could be loaded
  // However, for login.js, it's expected to be on login.html where loginErrorMessage should exist.
});
