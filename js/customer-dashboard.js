// Customer Dashboard Combined Logic

// Globally accessible Firebase instances (or consider passing them around)
const db = firebase.firestore();
const auth = firebase.auth();

// Global-like variables needed by various functions
let loyaltyProgram;
let biddingSystem;

let currentUser = null; // Primary user object
// let currentUserId = null; // Replaced by currentUser.uid where needed

// Specific state variables
let currentChatRequestId = null;
let selectedInvoiceId = null;
let selectedInvoiceAmount = null;

// Helper to escape HTML to prevent XSS
function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '\'': '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// --- Modal Toggle Functions ---
function toggleModal(modalId, overlayId = "modalOverlay", onOpen) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById(overlayId);
    if (!modal || !overlay) {
        console.error(`Modal or overlay not found for ${modalId}`);
        return;
    }
    const isVisible = modal.style.display === "block";
    modal.style.display = isVisible ? "none" : "block";
    overlay.style.display = isVisible ? "none" : "block";

    if (!isVisible && typeof onOpen === 'function') {
        onOpen();
    }
}

function toggleProfileModal() {
    toggleModal("profileModal");
}

function togglePaypalModal(closeOnly = false) {
    const modal = document.getElementById("paypalModal");
    const overlay = document.getElementById("modalOverlay");
    if (!modal || !overlay) return;

    if (closeOnly || modal.style.display === "block") {
        modal.style.display = "none";
        overlay.style.display = "none";
    } else {
        modal.style.display = "block";
        overlay.style.display = "block";
        if (selectedInvoiceId && selectedInvoiceAmount) {
            renderPaypalModal(selectedInvoiceId, selectedInvoiceAmount);
        }
    }
}

function toggleChatModal(closeOnly = false) {
     const modal = document.getElementById("chatModal");
    const overlay = document.getElementById("modalOverlay");
    if (!modal || !overlay) return;

    if (closeOnly || modal.style.display === "block") {
        modal.style.display = "none";
        overlay.style.display = "none";
        if (window.chatListenerUnsubscribe) { // Stop listening when chat modal is closed
            window.chatListenerUnsubscribe();
            window.chatListenerUnsubscribe = null;
        }
    } else {
        modal.style.display = "block";
        overlay.style.display = "block";
        // Chat messages are loaded via onRequestSelect
    }
}


// --- PayPal ---
function renderPaypalModal(invoiceId, amount) {
    const container = document.getElementById("paypalButtonContainer");
    if (!container) return;
    container.innerHTML = ""; // Clear previous buttons

    if (typeof paypal === 'undefined' || !paypal.Buttons) {
        console.error("PayPal SDK or Buttons not loaded.");
        alert("PayPal is currently unavailable. Please try again later.");
        return;
    }

    paypal.Buttons({
        createOrder: (data, actions) => actions.order.create({
            purchase_units: [{
                description: `Invoice ${invoiceId} - Holliday's Lawn & Garden`,
                amount: { value: amount.toFixed(2), currency_code: 'USD' },
                custom_id: invoiceId
            }]
        }),
        onApprove: async (data, actions) => {
            try {
                const details = await actions.order.capture();
                await db.collection("invoices").doc(invoiceId).update({
                    paid: true,
                    paymentDate: firebase.firestore.FieldValue.serverTimestamp(),
                    paymentProvider: 'paypal',
                    transactionId: details.id,
                    status: 'paid'
                });
                await db.collection("payments").add({
                    invoiceId: invoiceId,
                    customerId: currentUser ? currentUser.uid : 'unknown',
                    amount: amount,
                    currency: 'USD',
                    provider: 'paypal',
                    transactionId: details.id,
                    status: 'completed',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert(`✅ Payment successful for ${details.payer.name.given_name}!`);
                togglePaypalModal(true); // Close modal
                if (typeof loadInvoices === "function") loadInvoices(); // Refresh invoices table
            } catch (error) {
                console.error("Error processing PayPal payment approval:", error);
                alert("⚠️ Payment was successful but there was an issue updating records. Please contact support.");
            }
        },
        onError: err => {
            console.error("PayPal Button Error:", err);
            alert("⚠️ PayPal payment error: " + err.message);
        }
    }).render(container).catch(err => {
        console.error("Error rendering PayPal buttons:", err);
        container.innerHTML = "<p>Error initializing PayPal. Please refresh.</p>";
    });
}

function openPaymentModal(id, amount) {
    selectedInvoiceId = id;
    selectedInvoiceAmount = amount;
    togglePaypalModal();
}

// --- Chat ---
function onRequestSelect(requestId) {
    if (window.chatListenerUnsubscribe) {
        window.chatListenerUnsubscribe(); // Stop previous listener
        window.chatListenerUnsubscribe = null;
    }
    const chatMessagesEl = document.getElementById("chatMessages");
    if (chatMessagesEl) chatMessagesEl.innerHTML = ""; // Clear previous messages

    if (!requestId) {
        currentChatRequestId = null;
        toggleChatModal(true); // Close if open and no request selected
        return;
    }
    currentChatRequestId = requestId;
    loadChatMessages(requestId);
    toggleChatModal(); // Open chat modal
}

function loadChatMessages(requestId) {
    const chatMessagesEl = document.getElementById("chatMessages");
    if (!chatMessagesEl || !currentUser) return;

    if (window.chatListenerUnsubscribe) window.chatListenerUnsubscribe(); // Clean up previous listener

    window.chatListenerUnsubscribe = db.collection("service_requests").doc(requestId).collection("messages")
        .orderBy("timestamp")
        .onSnapshot(snapshot => {
            chatMessagesEl.innerHTML = "";
            snapshot.forEach(doc => {
                const msg = doc.data();
                const div = document.createElement("div");
                div.className = "chat-bubble " + (msg.senderType === "admin" ? "admin" : "customer"); // Use senderType
                const dateTime = msg.timestamp && msg.timestamp.toDate ? msg.timestamp.toDate().toLocaleString() : "sending...";
                div.innerHTML = `<div>${escapeHTML(msg.text)}</div><small style="font-size:0.7em; color:gray;">${dateTime}</small>`;
                chatMessagesEl.appendChild(div);
            });
            chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
        }, error => {
            console.error("Error loading chat messages:", error);
            chatMessagesEl.innerHTML = "<p>Error loading messages.</p>";
        });
}

function sendChatMessage() {
    const chatInputEl = document.getElementById("chatInput");
    if (!chatInputEl) return;
    const text = chatInputEl.value.trim();

    if (!text || !currentChatRequestId || !currentUser) return;

    db.collection("service_requests").doc(currentChatRequestId).collection("messages").add({
        text,
        sender: currentUser.uid, // UID of the sender
        senderType: "customer",    // Role of the sender
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        return db.collection("service_requests").doc(currentChatRequestId).update({
            lastMessageFrom: "customer",
            lastMessageTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
            hasUnreadAdminMessages: true, // Message FOR admin
            hasUnreadCustomerMessages: false // Message FROM customer (so not unread for customer)
        });
    }).catch(error => {
        console.error("Error sending chat message:", error);
        alert("Could not send message. Please try again.");
    });
    chatInputEl.value = "";
}

// --- Profile Management ---
async function loadProfile() {
    if (!currentUser) return;
    try {
        const profileDocRef = db.collection("users").doc(currentUser.uid);
        const doc = await profileDocRef.get();
        const data = doc.exists ? doc.data() : {};
        const address = data.address || {};

        const el = (id, value) => { const e = document.getElementById(id); if (e) e.innerText = escapeHTML(value) || "-"; };
        el("displayName", data.displayName || currentUser.displayName);
        el("displayEmail", data.email || currentUser.email);
        el("displayPhone", data.phone);
        el("displayStreet", address.street);
        el("displayCity", address.city);
        el("displayState", address.state);
        el("displayZip", address.zip);

        const setInput = (id, value) => { const e = document.getElementById(id); if (e) e.value = value || ""; };
        setInput("editName", data.displayName || currentUser.displayName);
        setInput("editEmail", data.email || currentUser.email); // Usually not editable or needs verification
        setInput("editPhone", data.phone);
        setInput("editStreet", address.street);
        setInput("editCity", address.city);
        setInput("editState", address.state);
        setInput("editZip", address.zip);

        // Active Services Count
        const activeServicesSnapshot = await db.collection("service_requests")
            .where("userId", "==", currentUser.uid)
            .where("status", "in", ["scheduled", "in-progress", "pending_approval", "pending"])
            .get();
        const activeServicesCountEl = document.getElementById("activeServicesCount");
        if (activeServicesCountEl) activeServicesCountEl.textContent = activeServicesSnapshot.size;

        // Upcoming Appointments Display
        const upcomingAppointmentsEl = document.getElementById("upcomingAppointmentsCount"); // This is a div for details
        if (upcomingAppointmentsEl) {
            const nextServiceSnapshot = await db.collection("service_requests")
                .where("userId", "==", currentUser.uid)
                .where("status", "in", ["scheduled", "pending_approval"])
                .orderBy("scheduledDate") // Ensure scheduledDate is valid for ordering
                .limit(1)
                .get();

            if (!nextServiceSnapshot.empty) {
                const service = nextServiceSnapshot.docs[0].data();
                const serviceDocId = nextServiceSnapshot.docs[0].id;
                upcomingAppointmentsEl.innerHTML = `
                    <h4>Next: ${escapeHTML(service.serviceType)}</h4>
                    <p>Date: ${service.scheduledDate ? new Date(service.scheduledDate).toLocaleDateString() : "Not set"}</p>
                    <p>Time: ${escapeHTML(service.scheduledTime || "TBD")}</p>
                    ${service.status === 'pending_approval' ? '<p>Status: Pending Your Approval</p>' : ''}
                    <button class="btn-modern btn-small" onclick="viewServiceDetail('${serviceDocId}')">View Details</button>
                    ${service.status === 'scheduled' ? `<button class="btn-modern btn-small" onclick="rescheduleService('${serviceDocId}')">Reschedule</button>` : ''}
                `;
            } else {
                upcomingAppointmentsEl.innerHTML = "<p>No upcoming services.</p>";
            }
        }

    } catch (error) {
        console.error("Error loading profile data:", error);
    }
}

// Placeholder for viewServiceDetail - expand to show details in a modal
function viewServiceDetail(serviceId) {
    alert(`Viewing details for service ID: ${serviceId}. Implement modal display here.`);
    // Example: Fetch service details from 'service_requests' and show in a dedicated modal.
}

// --- Service Requests Dropdown (for chat) ---
function loadServiceRequests() {
    const dropdown = document.getElementById("requestSelector");
    if (!dropdown || !currentUser) return;
    dropdown.innerHTML = '<option value="">-- Select a Service Request to Chat --</option>';
    db.collection("service_requests")
        .where("userId", "==", currentUser.uid)
        .orderBy("createdAt", "desc") // Or lastMessageTimestamp
        .limit(25)
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const r = doc.data();
                const date = r.createdAt && r.createdAt.toDate ? r.createdAt.toDate().toLocaleDateString() : "No date";
                const option = document.createElement("option");
                option.value = doc.id;
                option.textContent = `${date} - ${escapeHTML(r.serviceType || r.description?.substring(0,20) || "Service Request")}`;
                dropdown.appendChild(option);
            });
        }).catch(error => console.error("Error loading service requests for chat:", error));
}

// --- OLD Quotes Table Logic (to be deprecated/removed along with #quotesTable HTML) ---
function loadQuotes() { /* Deprecated - uses #quotesTable */
    const tbody = document.querySelector("#quotesTable tbody");
    if (!tbody || !currentUser) {
      if(tbody) tbody.innerHTML = "<tr><td colspan='4'>User not loaded.</td></tr>";
      return;
    }
    tbody.innerHTML = "<tr><td colspan='4'>Loading old quotes...</td></tr>";
    db.collection("quotes").where("email", "==", currentUser.email).onSnapshot(snapshot => {
        tbody.innerHTML = "";
        if (snapshot.empty) {
            tbody.innerHTML = "<tr><td colspan='4'>No (old system) quotes found.</td></tr>";
            return;
        }
        snapshot.forEach(doc => { /* ... rendering logic ... */ });
    }, error => tbody.innerHTML = "<tr><td colspan='4'>Error loading old quotes.</td></tr>");
}
function approveQuote(quoteId, amount, service) { /* Deprecated */ console.warn("approveQuote is deprecated"); }
function rejectQuote(quoteId) { /* Deprecated */ console.warn("rejectQuote is deprecated"); }

// --- Invoices Table ---
function loadInvoices() {
    const tbody = document.querySelector("#invoicesTable tbody");
    if (!tbody || !currentUser) {
      if(tbody) tbody.innerHTML = "<tr><td colspan='4'>User not loaded.</td></tr>";
      return;
    }
    tbody.innerHTML = "<tr><td colspan='4'>Loading invoices...</td></tr>";
    db.collection("invoices")
        .where("customerId", "==", currentUser.uid)
        .orderBy("createdAt", "desc")
        .onSnapshot(snapshot => {
            tbody.innerHTML = "";
            if (snapshot.empty) {
                tbody.innerHTML = "<tr><td colspan='4'>No invoices found.</td></tr>";
                return;
            }
            snapshot.forEach(doc => {
                const i = doc.data();
                const id = doc.id;
                const row = document.createElement("tr");
                const serviceDesc = i.service || (i.items && i.items.length > 0 ? i.items.map(item => item.name || item.description).join(', ') : "General Invoice");
                row.innerHTML = `
                    <td>${escapeHTML(serviceDesc)}</td>
                    <td>$${i.amount ? i.amount.toFixed(2) : '0.00'}</td>
                    <td><span class="status-badge status-${i.paid ? 'paid' : 'unpaid'}">${i.paid ? "✅ Paid" : "❌ Unpaid"}</span></td>
                    <td>${i.paid ? "Paid" : `<button class="btn-modern btn-small" onclick="openPaymentModal('${id}', ${i.amount})">Pay Now</button>`}</td>`;
                tbody.appendChild(row);
            });
        }, error => {
            console.error("Error loading invoices:", error);
            tbody.innerHTML = "<tr><td colspan='4'>Error loading invoices.</td></tr>";
        });
}


// --- PDF Export Functions ---
async function exportQuotesPDF() {
    if (!currentUser || typeof jsPDF === 'undefined') {
        alert("Cannot generate PDF. User not logged in or PDF library not loaded.");
        return;
    }

    try {
        const pdfService = new PDFService();
        const quotesSnapshot = await db.collection("bids")
            .where("customerId", "==", currentUser.uid)
            .orderBy("createdAt", "desc")
            .get();

        if (quotesSnapshot.empty) {
            alert("No quotes found to export.");
            return;
        }

        const quotes = [];
        quotesSnapshot.forEach(doc => {
            quotes.push({
                ...doc.data(),
                id: doc.id
            });
        });

        const doc = await pdfService.generateQuotePDF(quotes[0]); // Generate first quote
        
        // Add remaining quotes as new pages
        for (let i = 1; i < quotes.length; i++) {
            doc.addPage();
            await pdfService.generateQuotePDF(quotes[i], doc);
        }

        doc.save("customer_quotes.pdf");
    } catch (error) {
        console.error("Error generating quotes PDF:", error);
        alert("Error generating PDF. Please try again.");
    }
}

async function exportInvoicesPDF() {
    if (!currentUser || typeof jsPDF === 'undefined') {
        alert("Cannot generate PDF. User not logged in or PDF library not loaded.");
        return;
    }

    try {
        const pdfService = new PDFService();
        const invoicesSnapshot = await db.collection("invoices")
            .where("customerId", "==", currentUser.uid)
            .orderBy("createdAt", "desc")
            .get();

        if (invoicesSnapshot.empty) {
            alert("No invoices found to export.");
            return;
        }

        const invoices = [];
        invoicesSnapshot.forEach(doc => {
            invoices.push({
                ...doc.data(),
                id: doc.id
            });
        });

        const doc = await pdfService.generateInvoicePDF(invoices[0]); // Generate first invoice
        
        // Add remaining invoices as new pages
        for (let i = 1; i < invoices.length; i++) {
            doc.addPage();
            await pdfService.generateInvoicePDF(invoices[i], doc);
        }

        doc.save("customer_invoices.pdf");
    } catch (error) {
        console.error("Error generating invoices PDF:", error);
        alert("Error generating PDF. Please try again.");
    }
}


// --- Reschedule Service ---
async function rescheduleService(serviceId) {
    const modalContainerId = `rescheduleModalContainer-${serviceId}`;
    const existingModal = document.getElementById(modalContainerId);
    if (existingModal) existingModal.remove();

    const modalContainer = document.createElement("div");
    modalContainer.id = modalContainerId;
    modalContainer.style.cssText = `position:fixed; left:0; top:0; width:100%; height:100%; background-color:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1070;`;

    modalContainer.innerHTML = `
        <div style="background:white; padding:25px; border-radius:8px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); width: auto; max-width: 400px;">
            <h3>Request Reschedule</h3>
            <form id="rescheduleForm-${serviceId}">
                <div class="form-group" style="margin-bottom:15px;">
                    <label for="newDate-${serviceId}" style="display:block; margin-bottom:5px;">New Preferred Date:</label>
                    <input type="date" id="newDate-${serviceId}" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; box-sizing: border-box;">
                </div>
                <div class="form-group" style="margin-bottom:20px;">
                    <label for="rescheduleReason-${serviceId}" style="display:block; margin-bottom:5px;">Reason (Optional):</label>
                    <textarea id="rescheduleReason-${serviceId}" rows="3" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; box-sizing: border-box;"></textarea>
                </div>
                <div style="text-align:right;">
                    <button type="button" class="btn-modern btn-secondary" style="margin-right:10px;" onclick="document.getElementById('${modalContainerId}').remove()">Cancel</button>
                    <button type="submit" class="btn-modern">Submit Request</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modalContainer);

    document.getElementById(`rescheduleForm-${serviceId}`).onsubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) { alert("Not logged in."); return; }
        const newDate = document.getElementById(`newDate-${serviceId}`).value;
        const reason = document.getElementById(`rescheduleReason-${serviceId}`).value;
        if (!newDate) { alert("Please select a new date."); return; }

        try {
            await db.collection("service_requests").doc(serviceId).update({
                status: "reschedule_requested",
                statusNotes: `Customer requested reschedule to ${newDate}. Reason: ${reason || 'Not provided'}. Original request: ${new Date().toLocaleString()}`,
                requestedNewDate: newDate,
                rescheduleReason: reason,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                rescheduledByUser: true
            });
            modalContainer.remove();
            if (typeof loadProfile === "function") loadProfile();
            alert("Reschedule request submitted! We will contact you to confirm.");
        } catch (error) {
            console.error("Error requesting reschedule:", error);
            alert("Failed to submit reschedule request. " + error.message);
        }
    };
}

// --- Logout ---
function logout() {
    auth.signOut().then(() => {
        console.log("User signed out. Redirecting via onAuthStateChanged.");
    }).catch(error => {
        console.error("Logout Error:", error);
        window.location.href = "login.html"; // Fallback redirect
    });
}


// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    loyaltyProgram = new window.LoyaltyProgram();
    biddingSystem = new window.BiddingSystem();

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            console.log("User authenticated for customer dashboard:", currentUser.uid);

            const serviceRequestEmailEl = document.getElementById('email');
            const serviceRequestNameEl = document.getElementById('fullName');
            if (serviceRequestEmailEl) serviceRequestEmailEl.value = currentUser.email || "";
            if (serviceRequestNameEl) serviceRequestNameEl.value = currentUser.displayName || "";

            await loadProfile();
            loadServiceRequests();
            loadInvoices();

            if (currentUser && currentUser.uid) {
                await loadLoyaltyData(currentUser.uid);
                await loadReferralHistory(currentUser.uid);
                await loadCustomerQuotesProposals(currentUser.uid);
                setupReferralForm(currentUser.uid);
            }
        } else {
            currentUser = null;
            console.log("User not authenticated. Redirecting...");
            window.location.href = "login.html";
        }
    });

    const editProfileFormEl = document.getElementById('editProfileForm');
    if (editProfileFormEl) {
        editProfileFormEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentUser) { alert("You must be logged in."); return; }
            const profileData = {
                displayName: document.getElementById('editName').value,
                phone: document.getElementById('editPhone').value,
                address: {
                    street: document.getElementById('editStreet').value,
                    city: document.getElementById('editCity').value,
                    state: document.getElementById('editState').value,
                    zip: document.getElementById('editZip').value,
                },
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            try {
                await db.collection("users").doc(currentUser.uid).set(profileData, { merge: true });
                alert("Profile updated successfully!");
                toggleProfileModal();
                if (typeof loadProfile === "function") loadProfile();
            } catch (error) {
                console.error("Error updating profile:", error);
                alert("Failed to update profile. " + error.message);
            }
        });
    }
    
    const requestFormEl = document.getElementById('requestForm');
    if (requestFormEl) {
        requestFormEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentUser) { alert("Please log in to submit a request."); return; }
            const serviceData = {
                userId: currentUser.uid,
                email: document.getElementById('email').value,
                fullName: document.getElementById('fullName').value,
                serviceType: document.getElementById('serviceType').value,
                message: document.getElementById('message').value,
                status: "pending",
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessageTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
                hasUnreadAdminMessages: true,
                hasUnreadCustomerMessages: false,
            };
            try {
                await db.collection("service_requests").add(serviceData);
                alert("Service request submitted successfully!");
                requestFormEl.reset();
                loadServiceRequests();
                if (typeof NotificationSystem !== 'undefined' && NotificationSystem.showNotification) {
                    NotificationSystem.showNotification("Service request sent!", "success");
                }
            } catch (error) {
                console.error("Error submitting service request:", error);
                alert("Failed to submit. " + error.message);
            }
        });
    }

    async function loadLoyaltyData(userId) {
        if (!loyaltyProgram) { console.error("LoyaltyProgram missing."); return; }
        const pointsEl = document.getElementById('customerLoyaltyPoints');
        const tierEl = document.getElementById('customerLoyaltyTier');
        try {
            const account = await loyaltyProgram.getLoyaltyAccount(userId);
            if (pointsEl) pointsEl.textContent = account ? (account.points || 0) : '0';
            if (tierEl) tierEl.textContent = account ? (account.tier || 'bronze') : 'bronze';
        } catch (error) {
            console.error("Error loading loyalty data:", error);
            if (pointsEl) pointsEl.textContent = 'Error';
            if (tierEl) tierEl.textContent = 'Error';
        }
    }

    function setupReferralForm(userId) {
        const referralForm = document.getElementById('referralForm');
        if (!referralForm) return;
        referralForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!loyaltyProgram) { alert("Referral system unavailable."); return; }
            const referredEmailInput = document.getElementById('referredEmail');
            const referredEmail = referredEmailInput ? referredEmailInput.value : null;
            if (!referredEmail) { alert("Please enter friend's email."); return; }
            const submitButton = referralForm.querySelector('button[type="submit"]');
            if(submitButton) { submitButton.disabled = true; submitButton.textContent = 'Sending...';}
            try {
                const result = await loyaltyProgram.addReferral(userId, referredEmail);
                if (result.success) {
                    alert("Referral sent!");
                    if(referredEmailInput) referredEmailInput.value = '';
                    if (typeof loadReferralHistory === "function") loadReferralHistory(userId);
                } else { alert(result.error || "Failed to send referral."); }
            } catch (error) { console.error("Error submitting referral:", error); alert("Error submitting referral.");
            } finally { if(submitButton) { submitButton.disabled = false; submitButton.textContent = 'Send Referral';} }
        });
    }

    async function loadReferralHistory(userId) {
        const referralHistoryBody = document.getElementById('referralHistoryBody');
        if (!referralHistoryBody || !loyaltyProgram) return;
        referralHistoryBody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
        try {
            const referrals = await loyaltyProgram.getCustomerReferrals(userId);
            if (referrals && referrals.length > 0) {
                referralHistoryBody.innerHTML = referrals.map(ref => {
                    const date = ref.createdAt.toDate ? ref.createdAt.toDate().toLocaleDateString() : 'N/A';
                    return `<tr><td>${escapeHTML(ref.referredCustomerEmail)}</td><td>${escapeHTML(ref.status)}</td><td>${date}</td><td>${escapeHTML(ref.referralCode)}</td></tr>`;
                }).join('');
            } else { referralHistoryBody.innerHTML = '<tr><td colspan="4">No referrals yet.</td></tr>'; }
        } catch (error) {
            console.error("Error loading referral history:", error);
            referralHistoryBody.innerHTML = '<tr><td colspan="4">Error.</td></tr>';
        }
    }

    async function loadCustomerQuotesProposals(userId) {
        const quotesBody = document.getElementById('myQuotesBody');
        if (!quotesBody || !biddingSystem) {
             if(quotesBody) quotesBody.innerHTML = '<tr><td colspan="5">Quote system unavailable.</td></tr>';
            return;
        }
        quotesBody.innerHTML = '<tr><td colspan="5">Loading quotes...</td></tr>';
        try {
            const bids = await biddingSystem.listBids({ customerId: userId });
            const relevantBids = bids.filter(bid => ['sent', 'accepted', 'proposal_generated', 'draft', 'rejected'].includes(bid.status));
            if (relevantBids.length > 0) {
                quotesBody.innerHTML = relevantBids.map(bid => {
                    const date = bid.createdAt.toDate ? bid.createdAt.toDate().toLocaleDateString() : 'N/A';
                    let actionsHtml = `<button class="btn-modern btn-small" onclick="viewQuoteDetailClient('${bid.id}')">Details</button>`;
                    if (['sent', 'proposal_generated', 'draft'].includes(bid.status)) {
                        actionsHtml += ` <button class="btn-modern btn-small btn-accept" data-bid-id="${bid.id}">Accept</button>`;
                        actionsHtml += ` <button class="btn-modern btn-small btn-reject" data-bid-id="${bid.id}">Reject</button>`;
                    }
                    return `<tr><td>${date}</td><td>${escapeHTML(bid.bidNumber)}</td><td>$${bid.estimatedTotal?.toFixed(2)}</td><td><span class="status-badge status-${escapeHTML(bid.status)}">${escapeHTML(bid.status)}</span></td><td>${actionsHtml}</td></tr>`;
                }).join('');
                document.querySelectorAll('#myQuotesBody .btn-accept').forEach(b => b.addEventListener('click', (e) => handleQuoteAction(e.target.dataset.bidId, 'accepted')));
                document.querySelectorAll('#myQuotesBody .btn-reject').forEach(b => b.addEventListener('click', (e) => handleQuoteAction(e.target.dataset.bidId, 'rejected')));
            } else { quotesBody.innerHTML = '<tr><td colspan="5">No quotes or proposals.</td></tr>'; }
        } catch (error) {
            console.error("Error loading customer quotes:", error);
            quotesBody.innerHTML = '<tr><td colspan="5">Error.</td></tr>';
        }
    }

    window.viewQuoteDetailClient = async function(bidId) {
        if (!biddingSystem || !db) return;
        try {
            const bid = await biddingSystem.getBidById(bidId);
            if (bid) {
                let details = `Proposal #: ${escapeHTML(bid.bidNumber)}\nDate: ${new Date(bid.createdAt.toDate()).toLocaleDateString()}\nTotal: $${bid.estimatedTotal.toFixed(2)}\nStatus: ${escapeHTML(bid.status)}\n\nServices:\n`;
                bid.services.forEach(s => { details += `- ${escapeHTML(s.serviceType)}: $${s.total.toFixed(2)}\n`; if (s.notes) details += `  Notes: ${escapeHTML(s.notes)}\n`; });
                if (bid.proposalId) {
                    const proposalDoc = await db.collection('proposals').doc(bid.proposalId).get();
                    if (proposalDoc.exists) details += "\n--- Proposal Details ---\n" + escapeHTML(proposalDoc.data().proposalText);
                }
                alert(details); // Replace with a modal
            } else { alert("Could not fetch details."); }
        } catch (e) { console.error("Error in viewQuoteDetailClient", e); alert("Error fetching details."); }
    };

    window.handleQuoteAction = async function(bidId, newStatus) {
        if (!biddingSystem || !currentUser) { alert("System error or not logged in."); return;}
        const text = newStatus === 'accepted' ? "Accept this quote?" : "Reject this quote?";
        if (confirm(text)) {
            try {
                const success = await biddingSystem.updateBid(bidId, { status: newStatus, customerActionAt: firebase.firestore.FieldValue.serverTimestamp() });
                if (success) { alert(`Quote ${newStatus}.`); if (typeof loadCustomerQuotesProposals === "function") loadCustomerQuotesProposals(currentUser.uid); }
                else { alert(`Failed to ${newStatus} quote.`); }
            } catch (e) { console.error("Error in handleQuoteAction", e); alert(`Error ${newStatus} quote.`); }
        }
    };

    window.logout = logout;
    window.toggleProfileModal = toggleProfileModal;
    window.togglePaypalModal = togglePaypalModal;
    window.toggleChatModal = toggleChatModal;
    window.onRequestSelect = onRequestSelect;
    window.sendChatMessage = sendChatMessage;
    window.openPaymentModal = openPaymentModal;
    window.exportQuotesPDF = exportQuotesPDF;
    window.exportInvoicesPDF = exportInvoicesPDF;
    window.rescheduleService = rescheduleService;
    window.viewServiceDetail = viewServiceDetail;
}); 