
// dashboard.js
// Dashboard JavaScript
import { auth, db, storage, showError } from './firebase.js';

let isInitializing = false;

document.addEventListener("DOMContentLoaded", () => {
  initializeDashboard();
});

async function initializeDashboard() {
  if (isInitializing) return;
  isInitializing = true;

  try {
    showLoading("Initializing dashboard...");

    // Check if Firebase is initialized
    if (!window.HollidayApp || !window.HollidayApp.auth) {
      showError('Firebase not initialized');
    }

    // Check authentication with increased timeout
    const user = await Promise.race([
      checkAuth(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Auth timeout")), 15000),
      ),
    ]);

    if (!user) {
      window.location.href = "login.html";
      return;
    }

    // Load critical data first
    await loadUserData(user);

    // Load non-critical data in parallel
    await Promise.all([
      loadServiceRequests(),
      loadUpcomingServices(),
      loadRecentPayments(),
      updateDashboardStats(),
    ]).catch((error) => {
      console.warn("Non-critical data load failed:", error);
    });

    // Initialize features that don't block the UI
    initializeChat();
    initializeNotifications();

    hideLoading();
  } catch (error) {
    console.error("Dashboard initialization error:", error);
    showError(
      "Failed to initialize dashboard. Please try refreshing the page.",
    );
    hideLoading();

    // If there's an authentication error, redirect to login
    if (error.message.includes("auth")) {
      window.location.href = "login.html";
    }
  } finally {
    isInitializing = false;
  }
}

async function checkAuth() {
  return new Promise((resolve, reject) => {
    const auth = firebase.auth();
    const unsubscribe = auth.onAuthStateChanged(
      (user) => {
        unsubscribe();
        if (user) {
          resolve(user);
        } else {
          reject(new Error("No authenticated user"));
        }
      },
      (error) => {
        unsubscribe();
        reject(error);
      },
    );
  });
}

async function loadUserData(user) {
  try {
    const userDoc = await db.collection("users").doc(user.uid).get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      const userNameElement = document.getElementById("userName");
      if (userNameElement) {
        userNameElement.textContent = userData.displayName || user.email;
      }
    }
  } catch (error) {
    console.error("Error loading user data:", error);
    throw error;
  }
}

async function loadServiceRequests() {
  try {
    const user = auth.currentUser;

    const requestsRef = db.collection("serviceRequests");
    const q = requestsRef
      .where("customerId", "==", user.uid)
      .orderBy("createdAt", "desc");

    // Set up real-time listener
    const unsubscribe = q.onSnapshot(
      (snapshot) => {
        const container = document.getElementById("serviceRequests");

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
                    <div class="request-card ${request.status.toLowerCase()}" data-id="${doc.id}">
                        <div class="request-header">
                            <h3>${request.serviceType}</h3>
                            <span class="status-badge ${request.status.toLowerCase()}">${request.status}</span>
                        </div>
                        <p class="request-description">${request.description}</p>
                        <div class="request-details">
                            <span><i class="fas fa-calendar"></i> ${new Date(request.requestedDate).toLocaleDateString()}</span>
                            <span><i class="fas fa-map-marker-alt"></i> ${request.address}</span>
                        </div>
                        ${
                          request.adminNotes
                            ? `
                            <div class="admin-notes">
                                <i class="fas fa-comment"></i> ${request.adminNotes}
                            </div>
                        `
                            : ""
                        }
                    </div>
                `;
        });

        container.innerHTML = html;
      },
      (error) => {
        console.error("Error in service requests listener:", error);
        showError("Failed to load service requests");
      },
    );

    // Store unsubscribe function for cleanup
    window.serviceRequestsUnsubscribe = unsubscribe;
  } catch (error) {
    console.error("Error loading service requests:", error);
    throw error;
  }
}

async function loadUpcomingServices() {
  try {
    const user = auth.currentUser;

    const servicesRef = db.collection("scheduledServices");
    const q = servicesRef
      .where("customerId", "==", user.uid)
      .where("date", ">=", new Date())
      .orderBy("date", "asc")
      .limit(5);

    const snapshot = await q.get();
    const container = document.getElementById("upcomingServicesCount");

    if (snapshot.empty) {
      container.textContent = "0";
      return;
    }

    container.textContent = snapshot.size.toString();
  } catch (error) {
    console.error("Error loading upcoming services:", error);
    container.textContent = "Error";
  }
}

async function loadRecentPayments() {
  try {
    const user = auth.currentUser;

    const paymentsRef = db.collection("payments");
    const q = paymentsRef
      .where("customerId", "==", user.uid)
      .orderBy("date", "desc")
      .limit(5);

    const snapshot = await q.get();
    const container = document.getElementById("recent-payments");

    if (snapshot.empty) {
      container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-credit-card"></i>
                    <p>No recent payments found</p>
                </div>
            `;
      return;
    }

    let html = "";
    snapshot.forEach((doc) => {
      const payment = doc.data();
      html += `
                <div class="payment-item">
                    <div class="payment-info">
                        <h4>${payment.description}</h4>
                        <span class="payment-date">
                            <i class="fas fa-calendar"></i> ${new Date(payment.date).toLocaleDateString()}
                        </span>
                    </div>
                    <div class="payment-amount ${payment.status.toLowerCase()}">
                        $${payment.amount.toFixed(2)}
                    </div>
                </div>
            `;
    });

    container.innerHTML = html;
  } catch (error) {
    console.error("Error loading recent payments:", error);
    throw error;
  }
}

async function updateDashboardStats() {
  try {
    const user = auth.currentUser;

    // Get total spent
    const paymentsRef = db.collection("payments");
    const paymentsQuery = paymentsRef.where("customerId", "==", user.uid);
    const paymentsSnapshot = await paymentsQuery.get();

    let totalSpent = 0;
    paymentsSnapshot.forEach((doc) => {
      const payment = doc.data();
      totalSpent += payment.amount || 0;
    });

    document.getElementById("totalSpent").textContent =
      `$${totalSpent.toFixed(2)}`;

    // Get service rating
    const servicesRef = db.collection("services");
    const servicesQuery = servicesRef.where("customerId", "==", user.uid);
    const servicesSnapshot = await servicesQuery.get();

    let totalRating = 0;
    let ratingCount = 0;

    servicesSnapshot.forEach((doc) => {
      const service = doc.data();
      if (service.rating) {
        totalRating += service.rating;
        ratingCount++;
      }
    });

    const averageRating =
      ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : "N/A";
    document.getElementById("serviceRating").textContent = averageRating;

    // Get next service date
    const nextServiceQuery = db
      .collection("scheduledServices")
      .where("customerId", "==", user.uid)
      .where("date", ">=", new Date())
      .orderBy("date", "asc")
      .limit(1);

    const nextServiceSnapshot = await nextServiceQuery.get();

    if (nextServiceSnapshot.empty) {
      document.getElementById("nextServiceDate").textContent =
        "No upcoming services";
    } else {
      const nextService = nextServiceSnapshot.docs[0].data();
      document.getElementById("nextServiceDate").textContent = new Date(
        nextService.date,
      ).toLocaleDateString();
    }
  } catch (error) {
    console.error("Error updating dashboard stats:", error);
    showError("Failed to update dashboard statistics");
  }
}

function showNewRequestForm() {
  const modal = document.getElementById("new-request-modal");
  modal.classList.add("active");
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.remove("active");
}

async function submitServiceRequest(event) {
  event.preventDefault();

  try {
    showLoading();

    const user = auth.currentUser;
    const storageRef = storage.ref();

    const requestData = {
      customerId: user.uid,
      serviceType: document.getElementById("service-type").value,
      requestedDate: document.getElementById("service-date").value,
      description: document.getElementById("service-description").value,
      status: "pending",
      createdAt: db.FieldValue.serverTimestamp(),
    };

    await db.collection("serviceRequests").add(requestData);

    closeModal("new-request-modal");
    await loadServiceRequests();
    await updateDashboardStats();

    showSuccess("Service request submitted successfully");
  } catch (error) {
    console.error("Error submitting service request:", error);
    showError("Failed to submit service request");
  } finally {
    hideLoading();
  }
}

function showPaymentForm() {
  // Implement payment form logic
  console.log("Show payment form");
}

function syncWithGoogleCalendar() {
  // Implement Google Calendar sync logic
  console.log("Sync with Google Calendar");
}

function logout() {
  const auth = firebase.auth();
  auth
    .signOut()
    .then(() => {
      window.location.href = "login.html";
    })
    .catch((error) => {
      console.error("Error signing out:", error);
      showError("Failed to sign out");
    });
}

// Loading state functions
function showLoading(message = "Loading...") {
  const loadingOverlay = document.getElementById("loading-overlay");
  const loadingText = loadingOverlay.querySelector("p");
  if (loadingOverlay && loadingText) {
    loadingText.textContent = message;
    loadingOverlay.style.display = "flex";
  }
}

function hideLoading() {
  const loadingOverlay = document.getElementById("loading-overlay");
  if (loadingOverlay) {
    loadingOverlay.style.display = "none";
  }
}

function showError(message) {
  const errorContainer = document.getElementById("error-container");
  if (errorContainer) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    errorContainer.innerHTML = "";
    errorContainer.appendChild(errorDiv);

    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }
}

function showSuccess(message) {
  const errorContainer = document.getElementById("error-container");
  if (errorContainer) {
    const successDiv = document.createElement("div");
    successDiv.className = "success-message";
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    errorContainer.innerHTML = "";
    errorContainer.appendChild(successDiv);

    setTimeout(() => {
      successDiv.remove();
    }, 3000);
  }
}

// Chat functionality
let chatUnsubscribe = null;
let typingTimeout = null;
let isTyping = false;

function initializeChat() {
  const user = auth.currentUser;

  // Initialize chat container
  const chatContainer = document.getElementById("chatMessages");
  chatContainer.innerHTML = `
        <div class="chat-loading">
            <div class="spinner"></div>
            <p>Loading chat history...</p>
        </div>
    `;

  // Set up real-time chat listener with pagination
  const chatRef = db.collection("chats");
  const q = chatRef
    .where("participants", "array-contains", user.uid)
    .orderBy("timestamp", "desc")
    .limit(50);

  chatUnsubscribe = q.onSnapshot(
    (snapshot) => {
      const chatContainer = document.getElementById("chatMessages");
      let html = "";

      snapshot.forEach((doc) => {
        const message = doc.data();
        const isCurrentUser = message.senderId === user.uid;

        html =
          `
                <div class="chat-message ${isCurrentUser ? "sent" : "received"}" data-message-id="${doc.id}">
                    <div class="message-content">
                        ${
                          message.attachmentUrl
                            ? `
                            <div class="message-attachment">
                                <a href="${message.attachmentUrl}" target="_blank" class="attachment-link">
                                    <i class="fas fa-paperclip"></i> ${message.attachmentName}
                                </a>
                            </div>
                        `
                            : ""
                        }
                        <p>${message.text}</p>
                        <div class="message-meta">
                            <span class="message-time">${new Date(message.timestamp.toDate()).toLocaleTimeString()}</span>
                            ${
                              isCurrentUser
                                ? `
                                <span class="message-status ${message.read ? "read" : "sent"}">
                                    <i class="fas fa-${message.read ? "check-double" : "check"}"></i>
                                </span>
                            `
                                : ""
                            }
                        </div>
                    </div>
                    ${
                      isCurrentUser
                        ? `
                        <div class="message-actions">
                            <button onclick="editMessage('${doc.id}')" class="btn-icon">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteMessage('${doc.id}')" class="btn-icon">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `
                        : ""
                    }
                </div>
            ` + html;
      });

      chatContainer.innerHTML = html;
      chatContainer.scrollTop = chatContainer.scrollHeight;

      // Mark messages as read
      markMessagesAsRead(snapshot);
    },
    (error) => {
      console.error("Chat listener error:", error);
      showError("Failed to load chat messages");
      handleChatError(error);
    },
  );

  // Set up typing indicator listener
  const typingRef = db.collection("typing");
  const typingQuery = typingRef
    .where("chatId", "==", "admin-customer")
    .where("userId", "!=", user.uid);

  typingQuery.onSnapshot((snapshot) => {
    const typingIndicator = document.getElementById("typingIndicator");
    if (!snapshot.empty) {
      typingIndicator.style.display = "block";
    } else {
      typingIndicator.style.display = "none";
    }
  });
}

async function sendMessage() {
  const messageInput = document.getElementById("messageInput");
  const message = messageInput.value.trim();
  const fileInput = document.getElementById("chatFileInput");
  const file = fileInput.files[0];

  if (!message && !file) return;

  try {
    const user = auth.currentUser;
    let attachmentUrl = null;
    let attachmentName = null;

    // Handle file upload if present
    if (file) {
      const storageRef = storage.ref();
      const fileRef = storageRef.child(
        `chat-attachments/${user.uid}/${Date.now()}-${file.name}`,
      );
      await fileRef.put(file);
      attachmentUrl = await fileRef.getDownloadURL();
      attachmentName = file.name;
    }

    await db.collection("chats").add({
      text: message,
      senderId: user.uid,
      senderName: user.displayName || user.email,
      timestamp: db.FieldValue.serverTimestamp(),
      participants: [user.uid, "admin"],
      read: false,
      attachmentUrl,
      attachmentName,
      edited: false,
    });

    messageInput.value = "";
    if (fileInput) {
      fileInput.value = "";
    }

    // Clear typing indicator
    clearTypingIndicator();
  } catch (error) {
    console.error("Error sending message:", error);
    showError("Failed to send message");
    handleChatError(error);
  }
}

function handleTyping() {
  const db = firebase.firestore();
  const user = firebase.auth().currentUser;

  if (!isTyping) {
    isTyping = true;
    db.collection("typing").add({
      userId: user.uid,
      chatId: "admin-customer",
      timestamp: db.FieldValue.serverTimestamp(),
    });
  }

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    isTyping = false;
    const typingRef = db.collection("typing");
    const q = typingRef
      .where("userId", "==", user.uid)
      .where("chatId", "==", "admin-customer");

    q.get().then((snapshot) => {
      snapshot.forEach((doc) => {
        doc.ref.delete();
      });
    });
  }, 3000);
}

async function editMessage(messageId) {
  const db = firebase.firestore();
  const messageRef = db.collection("chats").doc(messageId);
  const messageDoc = await messageRef.get();

  if (messageDoc.exists()) {
    const message = messageDoc.data();
    const newText = prompt("Edit your message:", message.text);

    if (newText && newText !== message.text) {
      await messageRef.update({
        text: newText,
        edited: true,
        editedAt: db.FieldValue.serverTimestamp(),
      });
    }
  }
}

async function deleteMessage(messageId) {
  if (confirm("Are you sure you want to delete this message?")) {
    try {
      const db = firebase.firestore();
      await db.collection("chats").doc(messageId).delete();
    } catch (error) {
      console.error("Error deleting message:", error);
      showError("Failed to delete message");
    }
  }
}

async function markMessagesAsRead(snapshot) {
  const db = firebase.firestore();
  const user = firebase.auth().currentUser;
  const batch = db.batch();

  snapshot.forEach((doc) => {
    const message = doc.data();
    if (message.senderId !== user.uid && !message.read) {
      batch.update(doc.ref, { read: true });
    }
  });

  try {
    await batch.commit();
  } catch (error) {
    console.error("Error marking messages as read:", error);
  }
}

function handleChatError(error) {
  const errorHandler = new ErrorHandler();
  errorHandler.handleError(error);

  if (error.code === "permission-denied") {
    showError("You do not have permission to access the chat");
  } else if (error.code === "unavailable") {
    showError("Chat is currently unavailable. Please try again later.");
  } else {
    showError("An error occurred with the chat. Please try again.");
  }
}

// Add event listeners for chat input
document.addEventListener("DOMContentLoaded", () => {
  const messageInput = document.getElementById("messageInput");
  if (messageInput) {
    messageInput.addEventListener("input", handleTyping);
    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
});

// Notification functionality
let notificationsUnsubscribe = null;

function initializeNotifications() {
  const user = auth.currentUser;

  const notificationsRef = db.collection("notifications");
  const q = notificationsRef
    .where("userId", "==", user.uid)
    .where("read", "==", false)
    .orderBy("timestamp", "desc");

  notificationsUnsubscribe = q.onSnapshot(
    (snapshot) => {
      const notificationsList = document.getElementById("notificationsList");
      const notificationCount = document.getElementById("notificationCount");

      if (snapshot.empty) {
        notificationsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell-slash"></i>
                    <p>No new notifications</p>
                </div>
            `;
        notificationCount.textContent = "0";
        return;
      }

      let html = "";
      let count = 0;

      snapshot.forEach((doc) => {
        const notification = doc.data();
        count++;

        html += `
                <div class="notification-item ${notification.type}" data-id="${doc.id}">
                    <div class="notification-icon">
                        <i class="fas ${getNotificationIcon(notification.type)}"></i>
                    </div>
                    <div class="notification-content">
                        <p>${notification.message}</p>
                        <span class="notification-time">${formatTimestamp(notification.timestamp)}</span>
                    </div>
                    <button onclick="markNotificationAsRead('${doc.id}')" class="mark-read-btn">
                        <i class="fas fa-check"></i>
                    </button>
                </div>
            `;
      });

      notificationsList.innerHTML = html;
      notificationCount.textContent = count.toString();
    },
    (error) => {
      console.error("Notifications listener error:", error);
      showError("Failed to load notifications");
    },
  );
}

function getNotificationIcon(type) {
  switch (type) {
    case "service":
      return "fa-clipboard-list";
    case "payment":
      return "fa-credit-card";
    case "message":
      return "fa-comment";
    case "system":
      return "fa-cog";
    default:
      return "fa-bell";
  }
}

function formatTimestamp(timestamp) {
  if (!timestamp) return "";

  const date = timestamp.toDate();
  const now = new Date();
  const diff = now - date;

  // Less than 24 hours
  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString();
  }
  // Less than 7 days
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString();
  }
  // More than 7 days
  return date.toLocaleDateString();
}

async function markNotificationAsRead(notificationId) {
  try {
    const db = firebase.firestore();
    await db.collection("notifications").doc(notificationId).update({
      read: true,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    showError("Failed to mark notification as read");
  }
}

async function markAllAsRead() {
  try {
    const db = firebase.firestore();
    const user = firebase.auth().currentUser;

    const notificationsRef = db.collection("notifications");
    const q = notificationsRef
      .where("userId", "==", user.uid)
      .where("read", "==", false);

    const snapshot = await q.get();
    const batch = db.batch();

    snapshot.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    showError("Failed to mark all notifications as read");
  }
}

function toggleNotifications() {
  const dropdown = document.getElementById("notificationsDropdown");
  dropdown.classList.toggle("active");
}

// Cleanup notification listener on page unload
window.addEventListener("beforeunload", () => {
  if (notificationsUnsubscribe) {
    notificationsUnsubscribe();
  }
});

// File upload handling
let selectedFile = null;

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showError("File size must be less than 5MB");
    return;
  }

  // Check file type
  const allowedTypes = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
  const fileExtension = "." + file.name.split(".").pop().toLowerCase();
  if (!allowedTypes.includes(fileExtension)) {
    showError("Invalid file type. Allowed types: PDF, DOC, DOCX, JPG, PNG");
    return;
  }

  selectedFile = file;
  const filePreview = document.getElementById("filePreview");
  const fileName = document.getElementById("fileName");

  fileName.textContent = file.name;
  filePreview.style.display = "flex";
}

function removeFile() {
  selectedFile = null;
  const fileInput = document.getElementById("chatFileInput");
  const filePreview = document.getElementById("filePreview");

  fileInput.value = "";
  filePreview.style.display = "none";
}

// Add event listener for file input
document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("chatFileInput");
  if (fileInput) {
    fileInput.addEventListener("change", handleFileSelect);
  }
});


export {
  initializeDashboard,
  checkAuth,
  loadUserData,
  loadServiceRequests,
  for,
  loadUpcomingServices,
  loadRecentPayments,
  updateDashboardStats,
  showNewRequestForm,
  closeModal,
  submitServiceRequest,
  showPaymentForm,
  syncWithGoogleCalendar,
  logout,
  showLoading,
  hideLoading,
  showError,
  showSuccess,
  initializeChat,
  sendMessage,
  handleTyping,
  editMessage,
  deleteMessage,
  markMessagesAsRead,
  handleChatError,
  initializeNotifications,
  getNotificationIcon,
  formatTimestamp,
  markNotificationAsRead,
  markAllAsRead,
  toggleNotifications,
  handleFileSelect,
  removeFile
};
