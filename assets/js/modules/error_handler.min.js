export class ErrorHandler {
  constructor() {
    this.init();
  }
  init() {
    window.addEventListener('error', this.handleError.bind(this)),
      window.addEventListener('unhandledrejection', this.handlePromiseError.bind(this)),
      window.addEventListener('online', () => this.handleOnline()),
      window.addEventListener('offline', () => this.handleOffline());
  }
  handleError(e) {
    this.attemptFix(e);
  }
  handlePromiseError(e) {
    this.attemptFix(e.reason);
  }
  handleOnline() {
    this.syncData();
  }
  handleOffline() {
    this.enableOfflineMode();
  }
  attemptFix(e) {
    e.message.includes('loadServiceRequests')
      ? this.fixLoadServiceRequests()
      : e.message.includes('CSP')
        ? this.fixCSPError()
        : e.message.includes('Firebase') && this.fixFirebaseError(e);
  }
  fixLoadServiceRequests() {
    'function' != typeof window.loadServiceRequests &&
      (window.loadServiceRequests = async function () {
        try {
          const e = firebase.firestore(),
            r = firebase.auth().currentUser;
          if (!r) throw new Error('User not authenticated');
          const s = collection(e, 'serviceRequests'),
            a = query(s, where('customerId', '==', r.uid), orderBy('createdAt', 'desc')),
            t = await getDocs(a),
            n = document.getElementById('service-requests');
          if (t.empty)
            return void (n.innerHTML =
              '\n              <div class="empty-state">\n                <i class="fas fa-clipboard-list"></i>\n                <p>No service requests found</p>\n                <button onclick="showNewRequestForm()" class="btn-primary">\n                  Create New Request\n                </button>\n              </div>\n            ');
          let i = '';
          t.forEach(e => {
            const r = e.data();
            i += `\n              <div class="request-card ${r.status.toLowerCase()}">\n                <div class="request-header">\n                  <h3>${r.serviceType}</h3>\n                  <span class="status-badge">${r.status}</span>\n                </div>\n                <p class="request-description">${r.description}</p>\n                <div class="request-details">\n                  <span><i class="fas fa-calendar"></i> ${new Date(r.requestedDate).toLocaleDateString()}</span>\n                  <span><i class="fas fa-map-marker-alt"></i> ${r.address}</span>\n                </div>\n              </div>\n            `;
          }),
            (n.innerHTML = i);
        } catch (e) {
          this.showError('Failed to load service requests');
        }
      });
  }
  fixCSPError() {
    this.updateCSPHeaders({
      'google-analytics.com': 'connect-src',
      'fonts.gstatic.com': 'font-src',
      'googletagmanager.com': 'script-src',
    });
  }
  fixFirebaseError(e) {
    'app/no-app' === e.code
      ? this.reinitializeFirebase()
      : 'permission-denied' === e.code && this.handlePermissionError();
  }
  reinitializeFirebase() {
    if ('undefined' != typeof firebase && 'undefined' != typeof firebaseConfig)
      try {
        firebase.initializeApp(firebaseConfig);
      } catch (e) {}
  }
  handlePermissionError() {
    firebase.auth().currentUser || (window.location.href = '/login.html');
  }
  updateCSPHeaders(e) {}
  syncData() {}
  enableOfflineMode() {}
  showError(e, r = !1) {
    const s = document.createElement('div');
    (s.className = 'error-banner'),
      (s.innerHTML = `\n      <div class="error-content">\n        <i class="fas fa-exclamation-circle"></i>\n        <span>${e}</span>\n        ${r ? '<button onclick="location.reload()">Refresh Page</button>' : ''}\n      </div>\n    `),
      document.body.appendChild(s),
      r ||
        setTimeout(() => {
          s.remove();
        }, 5e3);
  }
}
export function showError(e, r = 5e3) {
  const s = document.createElement('div');
  (s.className = 'error-message'),
    (s.textContent = e),
    document.body.appendChild(s),
    setTimeout(() => s.remove(), r);
}
export function handleError(e, r = '') {
  showError(`An error occurred${r ? ` in ${r}` : ''}. Please try again.`);
}
export function handleFirebaseError(e) {
  let r = 'An error occurred with Firebase. ';
  switch (e.code) {
    case 'auth/user-not-found':
      r += 'User not found.';
      break;
    case 'auth/wrong-password':
      r += 'Incorrect password.';
      break;
    case 'auth/email-already-in-use':
      r += 'Email already in use.';
      break;
    case 'auth/weak-password':
      r += 'Password is too weak.';
      break;
    case 'storage/unauthorized':
      r += 'Unauthorized access to storage.';
      break;
    case 'storage/retry-limit-exceeded':
      r += 'Upload failed. Please try again.';
      break;
    default:
      r += 'Please try again.';
  }
  showError(r);
}
export { showError, handleError, handleFirebaseError, ErrorHandler };
