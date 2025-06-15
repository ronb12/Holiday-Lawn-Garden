import { auth, showError } from './firebase.js';
function createTestResultsContainer() {
  const e = document.createElement('div');
  return (
    (e.id = 'test-results'),
    (e.style.cssText =
      '\n        position: fixed;\n        top: 20px;\n        right: 20px;\n        background: white;\n        padding: 20px;\n        border-radius: 8px;\n        box-shadow: 0 2px 10px rgba(0,0,0,0.1);\n        z-index: 1000;\n        max-width: 400px;\n        font-family: Arial, sans-serif;\n    '),
    document.body.appendChild(e),
    e
  );
}
function addTestResult(e, s, t, n) {
  const a = document.createElement('div');
  (a.style.cssText = `\n        margin: 10px 0;\n        padding: 10px;\n        border-radius: 4px;\n        background: ${t ? '#e6ffe6' : '#ffe6e6'};\n        border: 1px solid ${t ? '#00cc00' : '#cc0000'};\n    `),
    (a.innerHTML = `\n        <strong>${s}:</strong> \n        <span style="color: ${t ? 'green' : 'red'}">${t ? '✅ PASSED' : '❌ FAILED'}</span>\n        <br>\n        <small>${n}</small>\n    `),
    e.appendChild(a);
}
async function testGoogleSignIn() {
  try {
    const e = new auth.GoogleAuthProvider();
    e.addScope('profile'), e.addScope('email');
    return {
      passed: !0,
      message: `Successfully signed in as ${(await auth.signInWithPopup(e)).user.email}`,
    };
  } catch (e) {
    return { passed: !1, message: `Error: ${e.code} - ${e.message}` };
  }
}
async function testEmailSignIn(e, s) {
  try {
    return {
      passed: !0,
      message: `Successfully signed in as ${(await auth.signInWithEmailAndPassword(e, s)).user.email}`,
    };
  } catch (e) {
    return { passed: !1, message: `Error: ${e.code} - ${e.message}` };
  }
}
async function testPasswordReset(e) {
  try {
    return (
      await auth.sendPasswordResetEmail(e),
      { passed: !0, message: 'Password reset email sent successfully' }
    );
  } catch (e) {
    return { passed: !1, message: `Error: ${e.code} - ${e.message}` };
  }
}
async function testSignOut() {
  try {
    return await auth.signOut(), { passed: !0, message: 'Successfully signed out' };
  } catch (e) {
    return { passed: !1, message: `Error: ${e.code} - ${e.message}` };
  }
}
async function runAuthTests() {
  const e = createTestResultsContainer();
  e.innerHTML = '<h3>Authentication Tests</h3>';
  const s = await testGoogleSignIn();
  addTestResult(e, 'Google Sign-In', s.passed, s.message);
  const t = await testEmailSignIn('test@example.com', 'password123');
  addTestResult(e, 'Email/Password Sign-In', t.passed, t.message);
  const n = await testPasswordReset('test@example.com');
  addTestResult(e, 'Password Reset', n.passed, n.message);
  const a = await testSignOut();
  addTestResult(e, 'Sign Out', a.passed, a.message);
}
function addTestButton() {
  const e = document.createElement('button');
  (e.textContent = 'Run Auth Tests'),
    (e.style.cssText =
      '\n        position: fixed;\n        bottom: 20px;\n        right: 20px;\n        padding: 10px 20px;\n        background: #4CAF50;\n        color: white;\n        border: none;\n        border-radius: 4px;\n        cursor: pointer;\n        z-index: 1000;\n    '),
    (e.onclick = runAuthTests),
    document.body.appendChild(e);
}
window.addEventListener('load', () => {
  auth.apps.length && addTestButton();
});
export {
  createTestResultsContainer,
  addTestResult,
  testGoogleSignIn,
  testEmailSignIn,
  testPasswordReset,
  testSignOut,
  runAuthTests,
  addTestButton,
};
