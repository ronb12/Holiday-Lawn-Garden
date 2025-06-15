// Enhanced Dashboard Features
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxX",
  authDomain: "holliday-lawn-garden.firebaseapp.com",
  projectId: "holliday-lawn-garden",
  storageBucket: "holliday-lawn-garden.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:1234567890123456789012"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Enhanced Service Management
class ServiceManager {
  constructor() {
    this.currentUser = null;
    this.setupAuthListener();
  }

  setupAuthListener() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.currentUser = user;
        this.loadServices();
      }
    });
  }

  async loadServices() {
    try {
      const servicesRef = collection(db, 'services');
      const q = query(
        servicesRef,
        where('userId', '==', this.currentUser.uid),
        orderBy('scheduledDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const services = [];
      querySnapshot.forEach((doc) => {
        services.push({ id: doc.id, ...doc.data() });
      });
      
      this.displayServices(services);
    } catch (error) {
      console.error('Error loading services:', error);
      this.showNotification('Error loading services', 'error');
    }
  }

  async scheduleService(serviceData) {
    try {
      const servicesRef = collection(db, 'services');
      await addDoc(servicesRef, {
        ...serviceData,
        userId: this.currentUser.uid,
        status: 'scheduled',
        createdAt: serverTimestamp()
      });
      
      this.showNotification('Service scheduled successfully', 'success');
      this.loadServices();
    } catch (error) {
      console.error('Error scheduling service:', error);
      this.showNotification('Error scheduling service', 'error');
    }
  }

  displayServices(services) {
    const servicesContainer = document.getElementById('services-container');
    if (!servicesContainer) return;

    servicesContainer.innerHTML = services.length ? services.map(service => `
      <div class="service-item">
        <div class="service-header">
          <h4>${service.type}</h4>
          <span class="status ${service.status}">${service.status}</span>
        </div>
        <p>Date: ${new Date(service.scheduledDate.toDate()).toLocaleDateString()}</p>
        <p>Notes: ${service.notes || 'No notes'}</p>
        ${service.beforeImage ? `<img src="${service.beforeImage}" alt="Before" class="service-image">` : ''}
        ${service.afterImage ? `<img src="${service.afterImage}" alt="After" class="service-image">` : ''}
      </div>
    `).join('') : '<p class="empty">No services scheduled</p>';
  }
}

// Payment & Billing Management
class PaymentManager {
  constructor() {
    this.currentUser = null;
    this.setupAuthListener();
  }

  setupAuthListener() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.currentUser = user;
        this.loadPayments();
      }
    });
  }

  async loadPayments() {
    try {
      const paymentsRef = collection(db, 'payments');
      const q = query(
        paymentsRef,
        where('userId', '==', this.currentUser.uid),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const payments = [];
      querySnapshot.forEach((doc) => {
        payments.push({ id: doc.id, ...doc.data() });
      });
      
      this.displayPayments(payments);
    } catch (error) {
      console.error('Error loading payments:', error);
      this.showNotification('Error loading payments', 'error');
    }
  }

  async schedulePayment(paymentData) {
    try {
      const paymentsRef = collection(db, 'payments');
      await addDoc(paymentsRef, {
        ...paymentData,
        userId: this.currentUser.uid,
        status: 'scheduled',
        createdAt: serverTimestamp()
      });
      
      this.showNotification('Payment scheduled successfully', 'success');
      this.loadPayments();
    } catch (error) {
      console.error('Error scheduling payment:', error);
      this.showNotification('Error scheduling payment', 'error');
    }
  }

  displayPayments(payments) {
    const paymentsContainer = document.getElementById('payments-container');
    if (!paymentsContainer) return;

    paymentsContainer.innerHTML = payments.length ? payments.map(payment => `
      <div class="payment-item">
        <div class="payment-header">
          <h4>${payment.description}</h4>
          <span class="status ${payment.status}">${payment.status}</span>
        </div>
        <p>Amount: $${payment.amount.toFixed(2)}</p>
        <p>Date: ${new Date(payment.date.toDate()).toLocaleDateString()}</p>
        <p>Method: ${payment.method}</p>
      </div>
    `).join('') : '<p class="empty">No payment history</p>';
  }
  async handlePayPalSuccess(details) {
    if (!this.currentUser) return;
    await addDoc(collection(db, 'payments'), {
      userId: this.currentUser.uid,
      amount: details.purchase_units[0].amount.value,
      method: 'paypal',
      status: 'completed',
      transactionId: details.id,
      payer: details.payer,
      date: serverTimestamp()
    });
    this.loadPayments();
  }
}

// Communication System
class CommunicationSystem {
  constructor() {
    this.currentUser = null;
    this.setupAuthListener();
  }

  setupAuthListener() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.currentUser = user;
        this.loadMessages();
      }
    });
  }

  async loadMessages() {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('userId', '==', this.currentUser.uid),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const messages = [];
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      
      this.displayMessages(messages);
    } catch (error) {
      console.error('Error loading messages:', error);
      this.showNotification('Error loading messages', 'error');
    }
  }

  async sendMessage(messageData) {
    try {
      const messagesRef = collection(db, 'messages');
      await addDoc(messagesRef, {
        ...messageData,
        userId: this.currentUser.uid,
        timestamp: serverTimestamp(),
        status: 'unread'
      });
      
      this.showNotification('Message sent successfully', 'success');
      this.loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      this.showNotification('Error sending message', 'error');
    }
  }

  displayMessages(messages) {
    const messagesContainer = document.getElementById('messages-container');
    if (!messagesContainer) return;

    messagesContainer.innerHTML = messages.length ? messages.map(message => `
      <div class="message-item ${message.status}">
        <div class="message-header">
          <h4>${message.subject}</h4>
          <span class="timestamp">${new Date(message.timestamp.toDate()).toLocaleString()}</span>
        </div>
        <p>${message.content}</p>
        <div class="message-actions">
          <button onclick="communicationSystem.replyToMessage('${message.id}')">Reply</button>
          <button onclick="communicationSystem.markAsRead('${message.id}')">Mark as Read</button>
        </div>
      </div>
    `).join('') : '<p class="empty">No messages</p>';
  }
  async sendEmergencyRequest() {
    if (!this.currentUser) return;
    await addDoc(collection(db, 'emergency_requests'), {
      userId: this.currentUser.uid,
      timestamp: serverTimestamp(),
      status: 'pending'
    });
  }
  async submitFeedback({ feedback, rating }) {
    if (!this.currentUser) return;
    await addDoc(collection(db, 'feedback'), {
      userId: this.currentUser.uid,
      feedback,
      rating: parseInt(rating),
      timestamp: serverTimestamp()
    });
  }
}

// Document Management System
class DocumentManager {
  constructor() {
    this.currentUser = null;
    this.setupAuthListener();
  }

  setupAuthListener() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.currentUser = user;
        this.loadDocuments();
      }
    });
  }

  async loadDocuments() {
    try {
      const documentsRef = collection(db, 'documents');
      const q = query(
        documentsRef,
        where('userId', '==', this.currentUser.uid),
        orderBy('uploadedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const documents = [];
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      
      this.displayDocuments(documents);
    } catch (error) {
      console.error('Error loading documents:', error);
      this.showNotification('Error loading documents', 'error');
    }
  }

  async uploadDocument(file, metadata) {
    try {
      const storageRef = ref(storage, `documents/${this.currentUser.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const documentsRef = collection(db, 'documents');
      await addDoc(documentsRef, {
        ...metadata,
        userId: this.currentUser.uid,
        fileName: file.name,
        fileUrl: downloadURL,
        uploadedAt: serverTimestamp()
      });
      
      this.showNotification('Document uploaded successfully', 'success');
      this.loadDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      this.showNotification('Error uploading document', 'error');
    }
  }

  displayDocuments(documents) {
    const documentsContainer = document.getElementById('documents-container');
    if (!documentsContainer) return;

    documentsContainer.innerHTML = documents.length ? documents.map(doc => `
      <div class="document-item">
        <div class="document-header">
          <h4>${doc.name}</h4>
          <span class="type">${doc.type}</span>
        </div>
        <p>Uploaded: ${new Date(doc.uploadedAt.toDate()).toLocaleDateString()}</p>
        <div class="document-actions">
          <a href="${doc.fileUrl}" target="_blank" class="btn">View</a>
          <button onclick="documentManager.downloadDocument('${doc.id}')">Download</button>
          <button onclick="documentManager.deleteDocument('${doc.id}')">Delete</button>
        </div>
      </div>
    `).join('') : '<p class="empty">No documents uploaded</p>';
  }
}

// Initialize all managers
const serviceManager = new ServiceManager();
const paymentManager = new PaymentManager();
const communicationSystem = new CommunicationSystem();
const documentManager = new DocumentManager();

// Utility function for notifications
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Export managers for use in other files
window.serviceManager = serviceManager;
window.paymentManager = paymentManager;
window.communicationSystem = communicationSystem;
window.documentManager = documentManager;
window.showNotification = showNotification;

// Unpaid Invoices Loader
export async function loadUnpaidInvoices(userId) {
  const q = query(
    collection(db, "invoices"),
    where("userId", "==", userId),
    where("status", "==", "unpaid")
  );
  const snap = await getDocs(q);
  const container = document.querySelector("#unpaidInvoices ul");
  if (!container) return;
  if (snap.empty) {
    container.innerHTML = '<li class="empty">No unpaid invoices</li>';
    return;
  }
  container.innerHTML = "";
  snap.forEach(doc => {
    const invoice = doc.data();
    container.innerHTML += `
      <li>
        <span class="invoice-number">${invoice.invoiceNumber}</span>
        <span class="amount">$${invoice.amount?.toFixed(2) ?? '0.00'}</span>
        <span class="status">${invoice.status}</span>
      </li>
    `;
  });
}

// After user login, call loadUnpaidInvoices(currentUser.uid)
onAuthStateChanged(auth, (user) => {
  if (user) {
    // ... existing code ...
    loadUnpaidInvoices(user.uid);
  }
});
