import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, updateDoc, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = 'admin-login.html';
  } else {
    loadAdminOverview();
    loadUsers();
    loadServices();
    loadPayments();
    loadMessages();
    loadDocuments();
  }
});

window.logout = function() {
  signOut(auth).then(() => {
    window.location.href = 'admin-login.html';
  });
};

async function loadAdminOverview() {
  // Example: Count users, services, payments
  const usersSnap = await getDocs(collection(db, 'users'));
  const servicesSnap = await getDocs(collection(db, 'services'));
  const paymentsSnap = await getDocs(collection(db, 'payments'));
  document.getElementById('admin-overview').innerHTML = `
    <p><b>Total Users:</b> ${usersSnap.size}</p>
    <p><b>Total Services:</b> ${servicesSnap.size}</p>
    <p><b>Total Payments:</b> ${paymentsSnap.size}</p>
  `;
}

async function loadUsers() {
  const usersSnap = await getDocs(collection(db, 'users'));
  const users = [];
  usersSnap.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
  document.getElementById('users-container').innerHTML = users.map(user => `
    <div class="user-item">
      <b>${user.displayName || user.email}</b> (${user.email})
      <button onclick="deleteUser('${user.id}')">Delete</button>
    </div>
  `).join('');
}

window.deleteUser = async function(userId) {
  await deleteDoc(doc(db, 'users', userId));
  loadUsers();
};

async function loadServices() {
  const snap = await getDocs(collection(db, 'services'));
  const services = [];
  snap.forEach(doc => services.push({ id: doc.id, ...doc.data() }));
  document.getElementById('admin-services-container').innerHTML = services.map(service => `
    <div class="service-item">
      <b>${service.type}</b> for ${service.userId} on ${service.scheduledDate?.toDate?.().toLocaleDateString?.() || ''}
      <span class="status">${service.status}</span>
    </div>
  `).join('');
}

async function loadPayments() {
  const snap = await getDocs(collection(db, 'payments'));
  const payments = [];
  snap.forEach(doc => payments.push({ id: doc.id, ...doc.data() }));
  document.getElementById('admin-payments-container').innerHTML = payments.map(payment => `
    <div class="payment-item">
      <b>$${payment.amount}</b> by ${payment.userId} (${payment.method})
      <span class="status">${payment.status}</span>
    </div>
  `).join('');
}

async function loadMessages() {
  const snap = await getDocs(collection(db, 'messages'));
  const messages = [];
  snap.forEach(doc => messages.push({ id: doc.id, ...doc.data() }));
  document.getElementById('admin-messages-container').innerHTML = messages.map(msg => `
    <div class="message-item">
      <b>${msg.subject}</b> from ${msg.userId}
      <p>${msg.content}</p>
    </div>
  `).join('');
}

async function loadDocuments() {
  const snap = await getDocs(collection(db, 'documents'));
  const docs = [];
  snap.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
  document.getElementById('admin-documents-container').innerHTML = docs.map(docu => `
    <div class="document-item">
      <b>${docu.name}</b> (${docu.type})
      <a href="${docu.fileUrl}" target="_blank">View</a>
    </div>
  `).join('');
} 