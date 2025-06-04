const loginErrorMessage = document.getElementById('loginErrorMessage');
const db = firebase.firestore(); // Make sure db is initialized (should be from firebase-init.js)

// Initialize Google Sign-In
window.onload = function () {
  if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
    // Use the Google Client ID from the configuration
    const clientId = window.googleClientId || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
    
    google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleSignInCallback 
    });
    // The button is already configured with data-callback, so explicit renderButton may not be needed
    // if it's not working, uncomment and ensure the div ID matches:
    // google.accounts.id.renderButton(
    //   document.getElementById("googleSignInButtonDiv"), // Ensure you have a div with this ID if using renderButton
    //   { theme: "outline", size: "large", text: "sign_in_with", shape: "rectangular", logo_alignment: "left" } 
    // );
  } else {
    console.error("Google Identity Services script not loaded yet or google object not available.");
    if(loginErrorMessage) loginErrorMessage.textContent = "Google Sign-In is currently unavailable. Please try again later.";
  }
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

// Google Sign-In Callback
async function handleGoogleSignInCallback(response) {
  if(loginErrorMessage) loginErrorMessage.textContent = ""; // Clear previous errors
  if (response.credential) {
    const googleCredential = firebase.auth.GoogleAuthProvider.credential(response.credential);
    firebase.auth().signInWithCredential(googleCredential)
      .then((result) => {
        // result.user contains the Firebase user
        // result.additionalUserInfo.isNewUser can be used if needed
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
  } else {
    console.error("Google Sign-In response did not contain credential.");
    if(loginErrorMessage) loginErrorMessage.textContent = "Google Sign-In failed: No credential received.";
  }
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
