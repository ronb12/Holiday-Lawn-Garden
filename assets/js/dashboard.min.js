import { auth, db, storage, showError } from './firebase.js';
let isInitializing = !1;
async function initializeDashboard() {
  if (!isInitializing) {
    isInitializing = !0;
    try {
      showLoading('Initializing dashboard...'),
        (window.HollidayApp && window.HollidayApp.auth) || showError('Firebase not initialized');
      const e = await Promise.race([
        checkAuth(),
        new Promise((e, t) => setTimeout(() => t(new Error('Auth timeout')), 15e3)),
      ]);
      if (!e) return void (window.location.href = 'login.html');
      await loadUserData(e),
        await Promise.all([
          loadServiceRequests(),
          loadUpcomingServices(),
          loadRecentPayments(),
          updateDashboardStats(),
        ]).catch(e => {}),
        initializeChat(),
        initializeNotifications(),
        hideLoading();
    } catch (e) {
      showError('Failed to initialize dashboard. Please try refreshing the page.'),
        hideLoading(),
        e.message.includes('auth') && (window.location.href = 'login.html');
    } finally {
      isInitializing = !1;
    }
  }
}
async function checkAuth() {
  return new Promise((e, t) => {
    const n = firebase.auth().onAuthStateChanged(
      a => {
        n(), a ? e(a) : t(new Error('No authenticated user'));
      },
      e => {
        n(), t(e);
      }
    );
  });
}
async function loadUserData(e) {
  try {
    const t = await db.collection('users').doc(e.uid).get();
    if (t.exists) {
      const n = t.data(),
        a = document.getElementById('userName');
      a && (a.textContent = n.displayName || e.email);
    }
  } catch (e) {
    throw e;
  }
}
async function loadServiceRequests() {
  try {
    const e = auth.currentUser,
      t = db.collection('serviceRequests'),
      n = t
        .where('customerId', '==', e.uid)
        .orderBy('createdAt', 'desc')
        .onSnapshot(
          e => {
            const t = document.getElementById('serviceRequests');
            if (e.empty)
              return void (t.innerHTML =
                '\n                    <div class="empty-state">\n                        <i class="fas fa-clipboard-list"></i>\n                        <p>No service requests found</p>\n                        <button onclick="showNewRequestForm()" class="btn-primary">\n                            Create New Request\n                        </button>\n                    </div>\n                ');
            let n = '';
            e.forEach(e => {
              const t = e.data();
              n += `\n                    <div class="request-card ${t.status.toLowerCase()}" data-id="${e.id}">\n                        <div class="request-header">\n                            <h3>${t.serviceType}</h3>\n                            <span class="status-badge ${t.status.toLowerCase()}">${t.status}</span>\n                        </div>\n                        <p class="request-description">${t.description}</p>\n                        <div class="request-details">\n                            <span><i class="fas fa-calendar"></i> ${new Date(t.requestedDate).toLocaleDateString()}</span>\n                            <span><i class="fas fa-map-marker-alt"></i> ${t.address}</span>\n                        </div>\n                        ${t.adminNotes ? `\n                            <div class="admin-notes">\n                                <i class="fas fa-comment"></i> ${t.adminNotes}\n                            </div>\n                        ` : ''}\n                    </div>\n                `;
            }),
              (t.innerHTML = n);
          },
          e => {
            showError('Failed to load service requests');
          }
        );
    window.serviceRequestsUnsubscribe = n;
  } catch (e) {
    throw e;
  }
}
async function loadUpcomingServices() {
  try {
    const e = auth.currentUser,
      t = db
        .collection('scheduledServices')
        .where('customerId', '==', e.uid)
        .where('date', '>=', new Date())
        .orderBy('date', 'asc')
        .limit(5),
      n = await t.get(),
      a = document.getElementById('upcomingServicesCount');
    if (n.empty) return void (a.textContent = '0');
    a.textContent = n.size.toString();
  } catch (e) {
    container.textContent = 'Error';
  }
}
async function loadRecentPayments() {
  try {
    const e = auth.currentUser,
      t = db
        .collection('payments')
        .where('customerId', '==', e.uid)
        .orderBy('date', 'desc')
        .limit(5),
      n = await t.get(),
      a = document.getElementById('recent-payments');
    if (n.empty)
      return void (a.innerHTML =
        '\n                <div class="empty-state">\n                    <i class="fas fa-credit-card"></i>\n                    <p>No recent payments found</p>\n                </div>\n            ');
    let i = '';
    n.forEach(e => {
      const t = e.data();
      i += `\n                <div class="payment-item">\n                    <div class="payment-info">\n                        <h4>${t.description}</h4>\n                        <span class="payment-date">\n                            <i class="fas fa-calendar"></i> ${new Date(t.date).toLocaleDateString()}\n                        </span>\n                    </div>\n                    <div class="payment-amount ${t.status.toLowerCase()}">\n                        $${t.amount.toFixed(2)}\n                    </div>\n                </div>\n            `;
    }),
      (a.innerHTML = i);
  } catch (e) {
    throw e;
  }
}
async function updateDashboardStats() {
  try {
    const e = auth.currentUser,
      t = db.collection('payments').where('customerId', '==', e.uid),
      n = await t.get();
    let a = 0;
    n.forEach(e => {
      const t = e.data();
      a += t.amount || 0;
    }),
      (document.getElementById('totalSpent').textContent = `$${a.toFixed(2)}`);
    const i = db.collection('services').where('customerId', '==', e.uid),
      s = await i.get();
    let o = 0,
      c = 0;
    s.forEach(e => {
      const t = e.data();
      t.rating && ((o += t.rating), c++);
    });
    const r = c > 0 ? (o / c).toFixed(1) : 'N/A';
    document.getElementById('serviceRating').textContent = r;
    const d = db
        .collection('scheduledServices')
        .where('customerId', '==', e.uid)
        .where('date', '>=', new Date())
        .orderBy('date', 'asc')
        .limit(1),
      l = await d.get();
    if (l.empty) document.getElementById('nextServiceDate').textContent = 'No upcoming services';
    else {
      const e = l.docs[0].data();
      document.getElementById('nextServiceDate').textContent = new Date(
        e.date
      ).toLocaleDateString();
    }
  } catch (e) {
    showError('Failed to update dashboard statistics');
  }
}
function showNewRequestForm() {
  document.getElementById('new-request-modal').classList.add('active');
}
function closeModal(e) {
  document.getElementById(e).classList.remove('active');
}
async function submitServiceRequest(e) {
  e.preventDefault();
  try {
    showLoading();
    const e = auth.currentUser,
      t =
        (storage.ref(),
        {
          customerId: e.uid,
          serviceType: document.getElementById('service-type').value,
          requestedDate: document.getElementById('service-date').value,
          description: document.getElementById('service-description').value,
          status: 'pending',
          createdAt: db.FieldValue.serverTimestamp(),
        });
    await db.collection('serviceRequests').add(t),
      closeModal('new-request-modal'),
      await loadServiceRequests(),
      await updateDashboardStats(),
      showSuccess('Service request submitted successfully');
  } catch (e) {
    showError('Failed to submit service request');
  } finally {
    hideLoading();
  }
}
function showPaymentForm() {}
function syncWithGoogleCalendar() {}
function logout() {
  firebase
    .auth()
    .signOut()
    .then(() => {
      window.location.href = 'login.html';
    })
    .catch(e => {
      showError('Failed to sign out');
    });
}
function showLoading(e = 'Loading...') {
  const t = document.getElementById('loading-overlay'),
    n = t.querySelector('p');
  t && n && ((n.textContent = e), (t.style.display = 'flex'));
}
function hideLoading() {
  const e = document.getElementById('loading-overlay');
  e && (e.style.display = 'none');
}
function showError(e) {
  const t = document.getElementById('error-container');
  if (t) {
    const n = document.createElement('div');
    (n.className = 'error-message'),
      (n.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${e}`),
      (t.innerHTML = ''),
      t.appendChild(n),
      setTimeout(() => {
        n.remove();
      }, 5e3);
  }
}
function showSuccess(e) {
  const t = document.getElementById('error-container');
  if (t) {
    const n = document.createElement('div');
    (n.className = 'success-message'),
      (n.innerHTML = `<i class="fas fa-check-circle"></i> ${e}`),
      (t.innerHTML = ''),
      t.appendChild(n),
      setTimeout(() => {
        n.remove();
      }, 3e3);
  }
}
document.addEventListener('DOMContentLoaded', () => {
  initializeDashboard();
});
let chatUnsubscribe = null,
  typingTimeout = null,
  isTyping = !1;
function initializeChat() {
  const e = auth.currentUser;
  document.getElementById('chatMessages').innerHTML =
    '\n        <div class="chat-loading">\n            <div class="spinner"></div>\n            <p>Loading chat history...</p>\n        </div>\n    ';
  const t = db
    .collection('chats')
    .where('participants', 'array-contains', e.uid)
    .orderBy('timestamp', 'desc')
    .limit(50);
  chatUnsubscribe = t.onSnapshot(
    t => {
      const n = document.getElementById('chatMessages');
      let a = '';
      t.forEach(t => {
        const n = t.data(),
          i = n.senderId === e.uid;
        a =
          `\n                <div class="chat-message ${i ? 'sent' : 'received'}" data-message-id="${t.id}">\n                    <div class="message-content">\n                        ${n.attachmentUrl ? `\n                            <div class="message-attachment">\n                                <a href="${n.attachmentUrl}" target="_blank" class="attachment-link">\n                                    <i class="fas fa-paperclip"></i> ${n.attachmentName}\n                                </a>\n                            </div>\n                        ` : ''}\n                        <p>${n.text}</p>\n                        <div class="message-meta">\n                            <span class="message-time">${new Date(n.timestamp.toDate()).toLocaleTimeString()}</span>\n                            ${i ? `\n                                <span class="message-status ${n.read ? 'read' : 'sent'}">\n                                    <i class="fas fa-${n.read ? 'check-double' : 'check'}"></i>\n                                </span>\n                            ` : ''}\n                        </div>\n                    </div>\n                    ${i ? `\n                        <div class="message-actions">\n                            <button onclick="editMessage('${t.id}')" class="btn-icon">\n                                <i class="fas fa-edit"></i>\n                            </button>\n                            <button onclick="deleteMessage('${t.id}')" class="btn-icon">\n                                <i class="fas fa-trash"></i>\n                            </button>\n                        </div>\n                    ` : ''}\n                </div>\n            ` +
          a;
      }),
        (n.innerHTML = a),
        (n.scrollTop = n.scrollHeight),
        markMessagesAsRead(t);
    },
    e => {
      showError('Failed to load chat messages'), handleChatError(e);
    }
  );
  db.collection('typing')
    .where('chatId', '==', 'admin-customer')
    .where('userId', '!=', e.uid)
    .onSnapshot(e => {
      const t = document.getElementById('typingIndicator');
      e.empty ? (t.style.display = 'none') : (t.style.display = 'block');
    });
}
async function sendMessage() {
  const e = document.getElementById('messageInput'),
    t = e.value.trim(),
    n = document.getElementById('chatFileInput'),
    a = n.files[0];
  if (t || a)
    try {
      const i = auth.currentUser;
      let s = null,
        o = null;
      if (a) {
        const e = storage.ref().child(`chat-attachments/${i.uid}/${Date.now()}-${a.name}`);
        await e.put(a), (s = await e.getDownloadURL()), (o = a.name);
      }
      await db
        .collection('chats')
        .add({
          text: t,
          senderId: i.uid,
          senderName: i.displayName || i.email,
          timestamp: db.FieldValue.serverTimestamp(),
          participants: [i.uid, 'admin'],
          read: !1,
          attachmentUrl: s,
          attachmentName: o,
          edited: !1,
        }),
        (e.value = ''),
        n && (n.value = ''),
        clearTypingIndicator();
    } catch (e) {
      showError('Failed to send message'), handleChatError(e);
    }
}
function handleTyping() {
  const e = firebase.firestore(),
    t = firebase.auth().currentUser;
  isTyping ||
    ((isTyping = !0),
    e
      .collection('typing')
      .add({ userId: t.uid, chatId: 'admin-customer', timestamp: e.FieldValue.serverTimestamp() })),
    clearTimeout(typingTimeout),
    (typingTimeout = setTimeout(() => {
      isTyping = !1;
      e.collection('typing')
        .where('userId', '==', t.uid)
        .where('chatId', '==', 'admin-customer')
        .get()
        .then(e => {
          e.forEach(e => {
            e.ref.delete();
          });
        });
    }, 3e3));
}
async function editMessage(e) {
  const t = firebase.firestore(),
    n = t.collection('chats').doc(e),
    a = await n.get();
  if (a.exists()) {
    const e = a.data(),
      i = prompt('Edit your message:', e.text);
    i &&
      i !== e.text &&
      (await n.update({ text: i, edited: !0, editedAt: t.FieldValue.serverTimestamp() }));
  }
}
async function deleteMessage(e) {
  if (confirm('Are you sure you want to delete this message?'))
    try {
      const t = firebase.firestore();
      await t.collection('chats').doc(e).delete();
    } catch (e) {
      showError('Failed to delete message');
    }
}
async function markMessagesAsRead(e) {
  const t = firebase.firestore(),
    n = firebase.auth().currentUser,
    a = t.batch();
  e.forEach(e => {
    const t = e.data();
    t.senderId === n.uid || t.read || a.update(e.ref, { read: !0 });
  });
  try {
    await a.commit();
  } catch (e) {}
}
function handleChatError(e) {
  new ErrorHandler().handleError(e),
    'permission-denied' === e.code
      ? showError('You do not have permission to access the chat')
      : 'unavailable' === e.code
        ? showError('Chat is currently unavailable. Please try again later.')
        : showError('An error occurred with the chat. Please try again.');
}
document.addEventListener('DOMContentLoaded', () => {
  const e = document.getElementById('messageInput');
  e &&
    (e.addEventListener('input', handleTyping),
    e.addEventListener('keypress', e => {
      'Enter' !== e.key || e.shiftKey || (e.preventDefault(), sendMessage());
    }));
});
let notificationsUnsubscribe = null;
function initializeNotifications() {
  const e = auth.currentUser,
    t = db
      .collection('notifications')
      .where('userId', '==', e.uid)
      .where('read', '==', !1)
      .orderBy('timestamp', 'desc');
  notificationsUnsubscribe = t.onSnapshot(
    e => {
      const t = document.getElementById('notificationsList'),
        n = document.getElementById('notificationCount');
      if (e.empty)
        return (
          (t.innerHTML =
            '\n                <div class="empty-state">\n                    <i class="fas fa-bell-slash"></i>\n                    <p>No new notifications</p>\n                </div>\n            '),
          void (n.textContent = '0')
        );
      let a = '',
        i = 0;
      e.forEach(e => {
        const t = e.data();
        i++,
          (a += `\n                <div class="notification-item ${t.type}" data-id="${e.id}">\n                    <div class="notification-icon">\n                        <i class="fas ${getNotificationIcon(t.type)}"></i>\n                    </div>\n                    <div class="notification-content">\n                        <p>${t.message}</p>\n                        <span class="notification-time">${formatTimestamp(t.timestamp)}</span>\n                    </div>\n                    <button onclick="markNotificationAsRead('${e.id}')" class="mark-read-btn">\n                        <i class="fas fa-check"></i>\n                    </button>\n                </div>\n            `);
      }),
        (t.innerHTML = a),
        (n.textContent = i.toString());
    },
    e => {
      showError('Failed to load notifications');
    }
  );
}
function getNotificationIcon(e) {
  switch (e) {
    case 'service':
      return 'fa-clipboard-list';
    case 'payment':
      return 'fa-credit-card';
    case 'message':
      return 'fa-comment';
    case 'system':
      return 'fa-cog';
    default:
      return 'fa-bell';
  }
}
function formatTimestamp(e) {
  if (!e) return '';
  const t = e.toDate(),
    n = new Date() - t;
  return n < 864e5 ? t.toLocaleTimeString() : t.toLocaleDateString();
}
async function markNotificationAsRead(e) {
  try {
    const t = firebase.firestore();
    await t.collection('notifications').doc(e).update({ read: !0 });
  } catch (e) {
    showError('Failed to mark notification as read');
  }
}
async function markAllAsRead() {
  try {
    const e = firebase.firestore(),
      t = firebase.auth().currentUser,
      n = e.collection('notifications').where('userId', '==', t.uid).where('read', '==', !1),
      a = await n.get(),
      i = e.batch();
    a.forEach(e => {
      i.update(e.ref, { read: !0 });
    }),
      await i.commit();
  } catch (e) {
    showError('Failed to mark all notifications as read');
  }
}
function toggleNotifications() {
  document.getElementById('notificationsDropdown').classList.toggle('active');
}
window.addEventListener('beforeunload', () => {
  notificationsUnsubscribe && notificationsUnsubscribe();
});
let selectedFile = null;
function handleFileSelect(e) {
  const t = e.target.files[0];
  if (!t) return;
  if (t.size > 5242880) return void showError('File size must be less than 5MB');
  const n = '.' + t.name.split('.').pop().toLowerCase();
  if (!['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'].includes(n))
    return void showError('Invalid file type. Allowed types: PDF, DOC, DOCX, JPG, PNG');
  selectedFile = t;
  const a = document.getElementById('filePreview');
  (document.getElementById('fileName').textContent = t.name), (a.style.display = 'flex');
}
function removeFile() {
  selectedFile = null;
  const e = document.getElementById('chatFileInput'),
    t = document.getElementById('filePreview');
  (e.value = ''), (t.style.display = 'none');
}
document.addEventListener('DOMContentLoaded', () => {
  const e = document.getElementById('chatFileInput');
  e && e.addEventListener('change', handleFileSelect);
});
