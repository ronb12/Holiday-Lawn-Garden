import { auth, showError } from './firebase.js';

// Test script for authentication methods
console.log("Starting authentication tests...");

// Create test results container
function createTestResultsContainer() {
  const container = document.createElement("div");
  container.id = "test-results";
  container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        max-width: 400px;
        font-family: Arial, sans-serif;
    `;
  document.body.appendChild(container);
  return container;
}

// Add test result to container
function addTestResult(container, testName, passed, message) {
  const result = document.createElement("div");
  result.style.cssText = `
        margin: 10px 0;
        padding: 10px;
        border-radius: 4px;
        background: ${passed ? "#e6ffe6" : "#ffe6e6"};
        border: 1px solid ${passed ? "#00cc00" : "#cc0000"};
    `;
  result.innerHTML = `
        <strong>${testName}:</strong> 
        <span style="color: ${passed ? "green" : "red"}">${passed ? "✅ PASSED" : "❌ FAILED"}</span>
        <br>
        <small>${message}</small>
    `;
  container.appendChild(result);
}

// Test Google Sign-In
async function testGoogleSignIn() {
  console.log("Testing Google Sign-In...");
  try {
    const provider = new auth.GoogleAuthProvider();
    provider.addScope("profile");
    provider.addScope("email");

    const result = await auth.signInWithPopup(provider);
    console.log("✅ Google Sign-In successful:", result.user.uid);
    return {
      passed: true,
      message: `Successfully signed in as ${result.user.email}`,
    };
  } catch (error) {
    console.error("❌ Google Sign-In failed:", error.code, error.message);
    return {
      passed: false,
      message: `Error: ${error.code} - ${error.message}`,
    };
  }
}

// Test Email/Password Sign-In
async function testEmailSignIn(email, password) {
  console.log("Testing Email/Password Sign-In...");
  try {
    const result = await auth
      .signInWithEmailAndPassword(email, password);
    console.log("✅ Email/Password Sign-In successful:", result.user.uid);
    return {
      passed: true,
      message: `Successfully signed in as ${result.user.email}`,
    };
  } catch (error) {
    console.error(
      "❌ Email/Password Sign-In failed:",
      error.code,
      error.message,
    );
    return {
      passed: false,
      message: `Error: ${error.code} - ${error.message}`,
    };
  }
}

// Test Password Reset
async function testPasswordReset(email) {
  console.log("Testing Password Reset...");
  try {
    await auth.sendPasswordResetEmail(email);
    console.log("✅ Password Reset email sent successfully");
    return { passed: true, message: "Password reset email sent successfully" };
  } catch (error) {
    console.error("❌ Password Reset failed:", error.code, error.message);
    return {
      passed: false,
      message: `Error: ${error.code} - ${error.message}`,
    };
  }
}

// Test Sign Out
async function testSignOut() {
  console.log("Testing Sign Out...");
  try {
    await auth.signOut();
    console.log("✅ Sign Out successful");
    return { passed: true, message: "Successfully signed out" };
  } catch (error) {
    console.error("❌ Sign Out failed:", error.code, error.message);
    return {
      passed: false,
      message: `Error: ${error.code} - ${error.message}`,
    };
  }
}

// Run all tests
async function runAuthTests() {
  console.log("=== Starting Authentication Tests ===");

  // Create test results container
  const container = createTestResultsContainer();
  container.innerHTML = "<h3>Authentication Tests</h3>";

  // Test Google Sign-In
  const googleResult = await testGoogleSignIn();
  addTestResult(
    container,
    "Google Sign-In",
    googleResult.passed,
    googleResult.message,
  );

  // Test Email/Password Sign-In
  const emailResult = await testEmailSignIn("test@example.com", "password123");
  addTestResult(
    container,
    "Email/Password Sign-In",
    emailResult.passed,
    emailResult.message,
  );

  // Test Password Reset
  const resetResult = await testPasswordReset("test@example.com");
  addTestResult(
    container,
    "Password Reset",
    resetResult.passed,
    resetResult.message,
  );

  // Test Sign Out
  const signOutResult = await testSignOut();
  addTestResult(
    container,
    "Sign Out",
    signOutResult.passed,
    signOutResult.message,
  );

  console.log("=== Authentication Tests Complete ===");
}

// Add test button to page
function addTestButton() {
  const button = document.createElement("button");
  button.textContent = "Run Auth Tests";
  button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px 20px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        z-index: 1000;
    `;
  button.onclick = runAuthTests;
  document.body.appendChild(button);
}

// Initialize when the page loads
window.addEventListener("load", () => {
  // Wait for Firebase to initialize
  if (auth.apps.length) {
    addTestButton();
  } else {
    console.error("Firebase not initialized");
  }
});
