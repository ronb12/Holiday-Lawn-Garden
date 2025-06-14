// Error Handler Script
export class ErrorHandler {
  constructor() {
    this.init();
  }

  init() {
    // Set up error listeners
    window.addEventListener("error", this.handleError.bind(this));
    window.addEventListener(
      "unhandledrejection",
      this.handlePromiseError.bind(this),
    );

    // Set up network listeners
    window.addEventListener("online", () => this.handleOnline());
    window.addEventListener("offline", () => this.handleOffline());

    console.log("Error handler initialized");
  }

  handleError(error) {
    console.error("Error caught:", error);
    this.attemptFix(error);
  }

  handlePromiseError(event) {
    console.error("Promise error:", event.reason);
    this.attemptFix(event.reason);
  }

  handleOnline() {
    console.log("Back online - syncing data");
    this.syncData();
  }

  handleOffline() {
    console.log("Offline mode - enabling local features");
    this.enableOfflineMode();
  }

  attemptFix(error) {
    // Handle specific error types
    if (error.message.includes("loadServiceRequests")) {
      this.fixLoadServiceRequests();
    } else if (error.message.includes("CSP")) {
      this.fixCSPError();
    } else if (error.message.includes("Firebase")) {
      this.fixFirebaseError(error);
    }
  }

  fixLoadServiceRequests() {
    if (typeof window.loadServiceRequests !== "function") {
      window.loadServiceRequests = async function () {
        try {
          const db = firebase.firestore();
          const user = firebase.auth().currentUser;

          if (!user) {
            throw new Error("User not authenticated");
          }

          const requestsRef = collection(db, "serviceRequests");
          const q = query(
            requestsRef,
            where("customerId", "==", user.uid),
            orderBy("createdAt", "desc"),
          );

          const snapshot = await getDocs(q);
          const container = document.getElementById("service-requests");

          if (snapshot.empty) {
            container.innerHTML = `
              <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <p>No service requests found</p>
                <button onclick="showNewRequestForm()" class="btn-primary">
                  Create New Request
                </button>
              </div>
            `;
            return;
          }

          let html = "";
          snapshot.forEach((doc) => {
            const request = doc.data();
            html += `
              <div class="request-card ${request.status.toLowerCase()}">
                <div class="request-header">
                  <h3>${request.serviceType}</h3>
                  <span class="status-badge">${request.status}</span>
                </div>
                <p class="request-description">${request.description}</p>
                <div class="request-details">
                  <span><i class="fas fa-calendar"></i> ${new Date(request.requestedDate).toLocaleDateString()}</span>
                  <span><i class="fas fa-map-marker-alt"></i> ${request.address}</span>
                </div>
              </div>
            `;
          });

          container.innerHTML = html;
        } catch (error) {
          console.error("Error loading requests:", error);
          this.showError("Failed to load service requests");
        }
      };
    }
  }

  fixCSPError() {
    // Add missing domains to CSP
    const domains = {
      "google-analytics.com": "connect-src",
      "fonts.gstatic.com": "font-src",
      "googletagmanager.com": "script-src",
    };

    // Update CSP headers
    this.updateCSPHeaders(domains);
  }

  fixFirebaseError(error) {
    if (error.code === "app/no-app") {
      this.reinitializeFirebase();
    } else if (error.code === "permission-denied") {
      this.handlePermissionError();
    }
  }

  reinitializeFirebase() {
    if (
      typeof firebase !== "undefined" &&
      typeof firebaseConfig !== "undefined"
    ) {
      try {
        firebase.initializeApp(firebaseConfig);
        console.log("Firebase reinitialized");
      } catch (error) {
        console.error("Firebase reinit failed:", error);
      }
    }
  }

  handlePermissionError() {
    const user = firebase.auth().currentUser;
    if (!user) {
      window.location.href = "/login.html";
    }
  }

  updateCSPHeaders(domains) {
    // Log CSP updates
    console.log("Updating CSP with domains:", domains);
  }

  syncData() {
    // Implement data sync logic
    console.log("Syncing data...");
  }

  enableOfflineMode() {
    // Implement offline mode
    console.log("Enabling offline features...");
  }

  showError(message, isFatal = false) {
    const errorBanner = document.createElement('div');
    errorBanner.className = 'error-banner';
    errorBanner.innerHTML = `
      <div class="error-content">
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
        ${isFatal ? '<button onclick="location.reload()">Refresh Page</button>' : ''}
      </div>
    `;
    document.body.appendChild(errorBanner);

    if (!isFatal) {
      setTimeout(() => {
        errorBanner.remove();
      }, 5000);
    }
  }
}

// Error handling utilities
export function showError(message, duration = 5000) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), duration);
}

export function handleError(error, context = '') {
  console.error(`Error in ${context}:`, error);
  showError(`An error occurred${context ? ` in ${context}` : ''}. Please try again.`);
}

export function handleFirebaseError(error) {
  let message = 'An error occurred with Firebase. ';
  
  switch (error.code) {
    case 'auth/user-not-found':
      message += 'User not found.';
      break;
    case 'auth/wrong-password':
      message += 'Incorrect password.';
      break;
    case 'auth/email-already-in-use':
      message += 'Email already in use.';
      break;
    case 'auth/weak-password':
      message += 'Password is too weak.';
      break;
    case 'storage/unauthorized':
      message += 'Unauthorized access to storage.';
      break;
    case 'storage/retry-limit-exceeded':
      message += 'Upload failed. Please try again.';
      break;
    default:
      message += 'Please try again.';
  }
  
  showError(message);
}
