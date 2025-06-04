// ✅ Firebase Initialization
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDrdga_hOO52nicYN3AwqqDjSbcnre6iM4",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "mobile-debt-crusher.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "mobile-debt-crusher"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ✅ Utility Functions
function showLoader() {
  document.getElementById("loadingOverlay").style.display = "flex";
}
function hideLoader() {
  document.getElementById("loadingOverlay").style.display = "none";
}
function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark") ? "on" : "off");
}
function showTab(id) {
  document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  updateDashboardStats();
}
window.onload = () => {
  if (localStorage.getItem("darkMode") === "on") document.body.classList.add("dark");
  loadCustomersDropdown();
  updateDashboardStats();
};

// ✅ Customer Dropdown
function loadCustomersDropdown() {
  const ids = ["requestCustomer", "quoteCustomer", "invoiceCustomer"];
  ids.forEach(id => {
    const dropdown = document.getElementById(id);
    if (!dropdown) return;
    dropdown.innerHTML = '<option value="">Select Customer</option>';
    db.collection("customers").get().then(snapshot => {
      snapshot.forEach(doc => {
        const data = doc.data();
        const option = document.createElement("option");
        option.value = doc.id;
        option.text = data.name || data.email || "Unnamed Customer";
        dropdown.appendChild(option);
      });
    });
  });
}

// ✅ Submit Request
function submitRequest(e) {
  e.preventDefault();
  const customerUID = document.getElementById("requestCustomer").value;
  const description = document.getElementById("requestDescription").value;
  const ref = db.collection("customers").doc(customerUID);
  ref.get().then(doc => {
    const name = doc.data().name || "Customer";
    ref.collection("requests").add({ customer: name, description, status: "Pending", createdAt: new Date(), fromAdmin: true });
    db.collection("requests").add({ customer: name, description, status: "Pending", createdAt: new Date() });
    e.target.reset(); loadRequests();
  });
}

// ✅ Submit Quote
function submitQuote(e) {
  e.preventDefault();
  const customerUID = document.getElementById("quoteCustomer").value;
  const amount = parseFloat(document.getElementById("quoteAmount").value);
  const ref = db.collection("customers").doc(customerUID);
  ref.get().then(doc => {
    const name = doc.data().name || "Customer";
    ref.collection("quotes").add({ customer: name, amount, status: "Pending", createdAt: new Date() });
    db.collection("quotes").add({ customer: name, amount, status: "Pending", createdAt: new Date() });
    e.target.reset(); loadQuotes();
  });
}

// ✅ Smart Quote Calculator
function calculateQuote(e) {
  e.preventDefault();
  const job = document.getElementById("jobDesc").value;
  const material = parseFloat(document.getElementById("materialCost").value);
  const hours = parseFloat(document.getElementById("laborHours").value);
  const rate = parseFloat(document.getElementById("hourlyRate").value);
  const fuel = parseFloat(document.getElementById("fuelCost").value);
  const margin = parseFloat(document.getElementById("profitMargin").value);
  const labor = hours * rate;
  const baseCost = material + labor + fuel;
  const recommended = baseCost * (1 + margin / 100);
  document.getElementById("quoteResult").innerText = `Recommended Quote: $${recommended.toFixed(2)} (Base: $${baseCost.toFixed(2)}, Margin: ${margin}%)`;
  document.getElementById("quoteAmount").value = recommended.toFixed(2);
  db.collection("smartQuotes").add({ job, materialCost: material, laborCost: labor, fuelCost: fuel, baseCost, profitMargin: margin, recommendedQuote: recommended, createdAt: new Date() });
  loadRecentSmartQuotes();
}

function loadRecentSmartQuotes() {
  const tbody = document.querySelector("#recentSmartQuotes tbody");
  tbody.innerHTML = "";
  db.collection("smartQuotes").orderBy("createdAt", "desc").limit(5).get().then(snapshot => {
    snapshot.forEach(doc => {
      const d = doc.data();
      const margin = ((d.recommendedQuote - d.baseCost) / d.baseCost * 100).toFixed(1);
      const date = new Date(d.createdAt.toDate()).toLocaleDateString();
      tbody.innerHTML += `<tr><td>${d.job}</td><td>$${d.baseCost.toFixed(2)}</td><td>$${d.recommendedQuote.toFixed(2)}</td><td>${margin}%</td><td>${date}</td></tr>`;
    });
  });
}

// ✅ Submit Invoice
function submitInvoice(e) {
  e.preventDefault();
  const customerUID = document.getElementById("invoiceCustomer").value;
  const amount = parseFloat(document.getElementById("invoiceAmount").value);
  const dueDate = document.getElementById("invoiceDueDate").value;
  const ref = db.collection("customers").doc(customerUID);
  ref.get().then(doc => {
    const name = doc.data().name || "Customer";
    ref.collection("invoices").add({ customer: name, amount, dueDate, paid: false, createdAt: new Date() });
    db.collection("invoices").add({ customer: name, amount, dueDate, paid: false, createdAt: new Date() });
    e.target.reset(); loadInvoices();
  });
}

// ✅ Expense Tracking
function submitExpense(e) {
  e.preventDefault();
  const desc = document.getElementById("expenseDesc").value;
  const amount = parseFloat(document.getElementById("expenseAmount").value);
  const date = document.getElementById("expenseDate").value;
  db.collection("expenses").add({ description: desc, amount, date, createdAt: new Date() })
    .then(() => { e.target.reset(); loadExpenses(); updateDashboardStats(); });
}
function loadExpenses() {
  const tbody = document.querySelector("#expensesTable tbody");
  showLoader();
  db.collection("expenses").orderBy("date", "desc").get().then(snapshot => {
    tbody.innerHTML = "";
    snapshot.forEach(doc => {
      const d = doc.data();
      tbody.innerHTML += `<tr><td>${d.description}</td><td>$${d.amount.toFixed(2)}</td><td>${d.date}</td><td><button onclick="deleteExpense('${doc.id}')">❌</button></td></tr>`;
    });
    hideLoader();
  });
}
function deleteExpense(id) {
  db.collection("expenses").doc(id).delete().then(() => { loadExpenses(); updateDashboardStats(); });
}

// ✅ Dashboard Stats
function updateDashboardStats() {
  const now = new Date();
  const m = now.getMonth(), y = now.getFullYear();
  let mp = 0, yp = 0, td = 0, ti = 0, em = 0, ey = 0;
  db.collection("requests").get().then(snap => {
    document.getElementById("statRequests").innerText = `📝 Requests: ${snap.size}`;
  });
  db.collection("quotes").get().then(snap => {
    document.getElementById("statQuotes").innerText = `💬 Quotes: ${snap.size}`;
  });
  db.collection("invoices").get().then(snap => {
    snap.forEach(doc => {
      const d = doc.data();
      const dt = d.createdAt.toDate();
      ti++;
      if (!d.paid) td += d.amount;
      if (d.paid && dt.getFullYear() === y) {
        yp += d.amount;
        if (dt.getMonth() === m) mp += d.amount;
      }
    });
    document.getElementById("statInvoices").innerText = `💰 Invoices: ${ti}`;
    document.getElementById("statTotalDue").innerText = `📉 Total Due: $${td.toFixed(2)}`;
    db.collection("expenses").get().then(snap => {
      snap.forEach(doc => {
        const d = doc.data(), dt = new Date(d.date);
        if (dt.getFullYear() === y) {
          ey += d.amount;
          if (dt.getMonth() === m) em += d.amount;
        }
      });
      document.getElementById("statMonthlyProfit").innerText = `📆 This Month: $${mp.toFixed(2)} | Net: $${(mp - em).toFixed(2)}`;
      document.getElementById("statYearlyProfit").innerText = `📈 This Year: $${yp.toFixed(2)} | Net: $${(yp - ey).toFixed(2)}`;
    });
  });
}

// ✅ Table Utils
function filterTable(tableId, query) {
  const table = document.getElementById(tableId);
  const rows = table.querySelectorAll("tbody tr");
  const f = query.toLowerCase();
  rows.forEach(row => row.style.display = row.innerText.toLowerCase().includes(f) ? "" : "none");
}
function sortTable(tableId, col) {
  const table = document.getElementById(tableId);
  const rows = Array.from(table.tBodies[0].rows);
  const dir = table.getAttribute(`data-sort-${col}`) === "asc" ? "desc" : "asc";
  rows.sort((a, b) => {
    const A = a.cells[col].innerText.trim(), B = b.cells[col].innerText.trim();
    const aVal = isNaN(A) ? A.toLowerCase() : parseFloat(A);
    const bVal = isNaN(B) ? B.toLowerCase() : parseFloat(B);
    return (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) * (dir === "asc" ? 1 : -1);
  });
  rows.forEach(r => table.tBodies[0].appendChild(r));
  table.setAttribute(`data-sort-${col}`, dir);
}
function exportTableToCSV(tableId, filename) {
  const rows = [...document.querySelectorAll(`#${tableId} tr`)];
  const csv = rows.map(row => [...row.cells].map(cell => `"${cell.innerText}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
function exportTableToPDF(tableId, title) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const rows = [...document.querySelectorAll(`#${tableId} tr`)];
  let y = 20;
  doc.setFontSize(16); doc.text(title, 14, y);
  y += 10;
  doc.setFontSize(10);
  rows.forEach(row => {
    let x = 14;
    [...row.cells].forEach(cell => {
      doc.text(cell.innerText, x, y);
      x += 40;
    });
    y += 10;
    if (y > 270) { doc.addPage(); y = 20; }
  });
  doc.save(`${title}.pdf`);
}

// ✅ Enhanced Quote Calculator Implementation
async function calculateEnhancedQuote(e) {
  e.preventDefault();
  const service = document.getElementById("serviceType").value;
  const propertySize = parseFloat(document.getElementById("propertySize").value);
  const complexity = parseFloat(document.getElementById("complexityFactor").value) || 1;
  const urgent = document.getElementById("urgentService").checked;
  
  const quote = QuoteCalculator.calculateQuote(service, propertySize, {
    complexity,
    urgent,
    discount: 0
  });

  // Update quote display
  document.getElementById("quoteBreakdown").innerHTML = `
    <div class="card">
      <h3>Quote Breakdown</h3>
      <p>Base Rate: $${quote.baseRate.toFixed(2)}</p>
      <p>Seasonal Adjustment: ${quote.seasonalAdjustment > 0 ? '+' : ''}${quote.seasonalAdjustment.toFixed(1)}%</p>
      <p>Complexity Adjustment: ${quote.complexityAdjustment > 0 ? '+' : ''}${quote.complexityAdjustment.toFixed(1)}%</p>
      ${quote.urgencyFee ? `<p>Urgency Fee: +$${quote.urgencyFee.toFixed(2)}</p>` : ''}
      <hr>
      <p><strong>Total: $${quote.total.toFixed(2)}</strong></p>
    </div>
  `;

  // Save quote to database
  await db.collection("quotes").add({
    ...quote,
    service,
    propertySize,
    createdAt: new Date(),
    status: "pending"
  });

  NotificationSystem.showNotification("Quote generated successfully!", "success");
}

// ✅ Package Builder Implementation
function buildCustomPackage(e) {
  e.preventDefault();
  const selectedServices = Array.from(document.querySelectorAll('input[name="package-services"]:checked'))
    .map(checkbox => checkbox.value);
  const propertySize = parseFloat(document.getElementById("packagePropertySize").value);

  const package = PackageBuilder.createCustomPackage(selectedServices, propertySize);

  document.getElementById("packageBreakdown").innerHTML = `
    <div class="card">
      <h3>Package Details</h3>
      <p>Selected Services: ${package.services.join(", ")}</p>
      <p>Base Price: $${package.basePrice.toFixed(2)}</p>
      <p>Discount: -$${package.discount.toFixed(2)}</p>
      <p>Frequency: ${package.frequency}</p>
      <hr>
      <p><strong>Total: $${package.total.toFixed(2)}</strong></p>
      <p class="text-success">You save: $${package.savings.toFixed(2)}!</p>
    </div>
  `;
}

// ✅ Enhanced Customer Management
async function loadCustomerDetails(customerId) {
  showLoader();
  try {
    const doc = await db.collection("customers").doc(customerId).get();
    const data = doc.data();
    
    // Load service history
    const history = await db.collection("services")
      .where("customerId", "==", customerId)
      .orderBy("date", "desc")
      .get();

    const serviceHistory = history.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate().toLocaleDateString()
    }));

    // Update customer details view
    document.getElementById("customerDetails").innerHTML = `
      <div class="card">
        <h3>${data.name}</h3>
        <p>Email: ${data.email}</p>
        <p>Phone: ${data.phone || 'N/A'}</p>
        <p>Address: ${data.address || 'N/A'}</p>
        
        <h4>Service History</h4>
        <table class="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Service</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${serviceHistory.map(service => `
              <tr>
                <td>${service.date}</td>
                <td>${service.type}</td>
                <td>$${service.amount.toFixed(2)}</td>
                <td><span class="status-badge status-${service.status.toLowerCase()}">${service.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error("Error loading customer details:", error);
    NotificationSystem.showNotification("Error loading customer details", "error");
  } finally {
    hideLoader();
  }
}

// ✅ Enhanced Invoice Management
async function createInvoice(e) {
  e.preventDefault();
  const formData = {
    customerId: document.getElementById("invoiceCustomer").value,
    amount: parseFloat(document.getElementById("invoiceAmount").value),
    dueDate: document.getElementById("invoiceDueDate").value,
    services: Array.from(document.querySelectorAll('input[name="invoice-services"]:checked'))
      .map(checkbox => checkbox.value)
  };

  const validation = FormValidator.validateForm(formData, {
    customerId: { required: true },
    amount: { required: true },
    dueDate: { required: true },
    services: { required: true }
  });

  if (!validation.isValid) {
    Object.entries(validation.errors).forEach(([field, error]) => {
      NotificationSystem.showNotification(error, "error");
    });
    return;
  }

  try {
    const invoiceRef = await db.collection("invoices").add({
      ...formData,
      status: "pending",
      createdAt: new Date(),
      paid: false
    });

    // Send notification to customer
    await NotificationSystem.sendNotification(
      formData.customerId,
      "invoice",
      `New invoice created for $${formData.amount.toFixed(2)}`
    );

    NotificationSystem.showNotification("Invoice created successfully!", "success");
    document.getElementById("createInvoiceForm").reset();
  } catch (error) {
    console.error("Error creating invoice:", error);
    NotificationSystem.showNotification("Error creating invoice", "error");
  }
}

// Instantiate new system managers
const equipmentManager = new EquipmentManager();
const materialTracker = new MaterialTracker();
const biddingSystem = new BiddingSystem();
const loyaltyProgram = new LoyaltyProgram();
const sustainabilityTracker = new SustainabilityTracker();
const quoteCalculator = new QuoteCalculator();

// ----- Equipment Management Functions -----
async function loadEquipmentTable() {
  const equipmentList = await equipmentManager.getAllEquipment();
  const tableBody = document.querySelector("#equipmentTable tbody");
  if (!tableBody) return;
  tableBody.innerHTML = ""; // Clear existing rows

  if (equipmentList.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6">No equipment found.</td></tr>';
    return;
  }

  equipmentList.forEach(eq => {
    const row = tableBody.insertRow();
    row.innerHTML = `
      <td>${eq.name}</td>
      <td>${eq.type}</td>
      <td><span class="status-badge status-${eq.status}">${eq.status}</span></td>
      <td>${eq.usageHours ? eq.usageHours.toFixed(1) : 0}</td>
      <td>${eq.nextMaintenanceDate ? new Date(eq.nextMaintenanceDate.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
      <td>
        <button class="btn-modern btn-small" onclick="openLogMaintenanceModal('${eq.id}')">Log Maintenance</button>
        <button class="btn-modern btn-small" onclick="openTrackUsageModal('${eq.id}')">Track Usage</button>
        <select onchange="updateEquipmentStatus('${eq.id}', this.value)" style="padding: 5px; margin-left: 5px;">
          <option value="available" ${eq.status === 'available' ? 'selected' : ''}>Available</option>
          <option value="in-use" ${eq.status === 'in-use' ? 'selected' : ''}>In Use</option>
          <option value="maintenance" ${eq.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
          <option value="retired" ${eq.status === 'retired' ? 'selected' : ''}>Retired</option>
        </select>
      </td>
    `;
  });
}

document.getElementById('addEquipmentForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = {
    name: document.getElementById('equipmentName').value,
    type: document.getElementById('equipmentType').value,
    purchaseDate: document.getElementById('equipmentPurchaseDate').value,
    cost: parseFloat(document.getElementById('equipmentCost').value),
    serialNumber: document.getElementById('equipmentSerial').value || null,
  };
  const newEquipment = await equipmentManager.addEquipment(formData);
  if (newEquipment) {
    loadEquipmentTable(); // Refresh table
    e.target.reset();
  }
});

async function updateEquipmentStatus(equipmentId, status) {
  await equipmentManager.setEquipmentStatus(equipmentId, status);
  loadEquipmentTable(); // Refresh table
}

// Placeholder for modals - will implement these in HTML later or use prompts
function openLogMaintenanceModal(equipmentId) {
  const date = prompt("Enter maintenance date (YYYY-MM-DD):");
  const notes = prompt("Enter maintenance notes:");
  const cost = parseFloat(prompt("Enter maintenance cost ($):") || "0");
  if (date && notes) {
    equipmentManager.logMaintenance(equipmentId, { date, notes, cost }).then(() => loadEquipmentTable());
  }
}

function openTrackUsageModal(equipmentId) {
  const hours = parseFloat(prompt("Enter usage hours:"));
  if (!isNaN(hours) && hours > 0) {
    equipmentManager.trackUsage(equipmentId, hours).then(() => loadEquipmentTable());
  }
}

// ----- Materials & Chemical Inventory Functions -----
async function loadMaterialsTable() {
  const materialsList = await materialTracker.getAllMaterials();
  const tableBody = document.querySelector("#materialsTable tbody");
  if (!tableBody) return;
  tableBody.innerHTML = ""; // Clear existing rows

  if (materialsList.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6">No materials found.</td></tr>';
    return;
  }

  materialsList.forEach(mat => {
    const row = tableBody.insertRow();
    row.innerHTML = `
      <td>${mat.name}</td>
      <td>${mat.type}</td>
      <td>${mat.stockLevel.toFixed(2)}</td>
      <td>${mat.unit}</td>
      <td>${mat.reorderPoint.toFixed(2)}</td>
      <td>
        <button class="btn-modern btn-small" onclick="openUpdateStockModal('${mat.id}', '${mat.name}')">Update Stock</button>
        <button class="btn-modern btn-small" onclick="openLogMaterialUsageModal('${mat.id}', '${mat.name}')">Log Usage</button>
      </td>
    `;
  });
}

document.getElementById('addMaterialForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = {
    name: document.getElementById('materialName').value,
    type: document.getElementById('materialType').value,
    unit: document.getElementById('materialUnit').value,
    stockLevel: parseFloat(document.getElementById('materialStockLevel').value),
    reorderPoint: parseFloat(document.getElementById('materialReorderPoint').value),
    supplierInfo: document.getElementById('materialSupplier').value || null,
  };
  const newMaterial = await materialTracker.addMaterial(formData);
  if (newMaterial) {
    loadMaterialsTable(); // Refresh table
    e.target.reset();
  }
});

function openUpdateStockModal(materialId, materialName) {
  const change = parseFloat(prompt(`Enter stock change for ${materialName} (e.g., 10 to add, -5 to subtract):`));
  const reason = prompt("Reason for stock change (e.g., Received new shipment, Manual correction):");
  if (!isNaN(change) && reason) {
    materialTracker.updateStock(materialId, change, reason).then(() => loadMaterialsTable());
  }
}

function openLogMaterialUsageModal(materialId, materialName) {
  const quantityUsed = parseFloat(prompt(`Enter quantity of ${materialName} used:`));
  const jobId = prompt("Enter Job ID (optional):") || null;
  if (!isNaN(quantityUsed) && quantityUsed > 0) {
    materialTracker.logUsage(jobId, materialId, quantityUsed).then(() => loadMaterialsTable());
  }
}

// ----- Bids & Proposals Management Functions -----
async function loadBidsTable() {
  const tableBody = document.querySelector("#bidsTable tbody");
  if (!tableBody) {
    console.log("Bids table body not found"); return;
  }
  tableBody.innerHTML = ""; // Clear existing rows
  try {
    const bidsList = await biddingSystem.listBids();
    if (bidsList.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5">No bids found.</td></tr>';
      return;
    }
    bidsList.forEach(bid => {
      const row = tableBody.insertRow();
      row.innerHTML = `
        <td>${bid.bidNumber}</td>
        <td>${bid.customerId}</td> 
        <td>$${bid.estimatedTotal.toFixed(2)}</td>
        <td><span class="status-badge status-${bid.status.replace('_', '-')}">${bid.status}</span></td>
        <td>
          <button class="btn-modern btn-small" onclick="viewBidDetails('${bid.id}')">View/Propose</button>
          <select onchange="updateBidStatus('${bid.id}', this.value)" class="form-control-small" style="padding: 5px; margin-left: 5px;">
            <option value="draft" ${bid.status === 'draft' ? 'selected' : ''}>Draft</option>
            <option value="proposal_generated" ${bid.status === 'proposal_generated' ? 'selected' : ''}>Proposal Generated</option>
            <option value="sent" ${bid.status === 'sent' ? 'selected' : ''}>Sent</option>
            <option value="accepted" ${bid.status === 'accepted' ? 'selected' : ''}>Accepted</option>
            <option value="rejected" ${bid.status === 'rejected' ? 'selected' : ''}>Rejected</option>
            <option value="archived" ${bid.status === 'archived' ? 'selected' : ''}>Archived</option>
          </select>
        </td>
      `;
    });
  } catch (error) {
    console.error("Error loading bids table:", error);
    tableBody.innerHTML = '<tr><td colspan="5">Error loading bids.</td></tr>';
  }
}

async function viewBidDetails(bidId) {
  const bid = await biddingSystem.getBidById(bidId);
  const proposalView = document.getElementById('proposalTextView');
  const proposalContent = document.getElementById('proposalTextContent');
  
  if (bid && proposalView && proposalContent) {
    const proposalText = biddingSystem.generateProposalText(bid);
    proposalContent.textContent = proposalText;
    proposalView.style.display = 'block';

    const existingSaveBtn = proposalView.querySelector('.btn-save-proposal');
    if(existingSaveBtn) existingSaveBtn.remove();

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save This Proposal Text';
    saveButton.className = 'btn-modern btn-small btn-save-proposal';
    saveButton.style.marginTop = '10px';
    saveButton.onclick = async () => {
        const savedProposal = await biddingSystem.saveProposal(bid.id, proposalText);
        if (savedProposal) {
            NotificationSystem.showNotification("Proposal text saved! Bid status updated.", "success");
            loadBidsTable(); // Refresh table to show new status
            saveButton.textContent = 'Proposal Saved';
            saveButton.disabled = true;
        } else {
            NotificationSystem.showNotification("Failed to save proposal text.", "error");
        }
    };
    proposalView.appendChild(saveButton);
    // You might want to show more details in a structured way, not just an alert
    // For example, populate a modal with bid details.
    console.log("Viewing bid:", bid);

  } else {
      if(proposalView) proposalView.style.display = 'none';
      NotificationSystem.showNotification("Could not load bid details.", "error");
  }
}

async function updateBidStatus(bidId, status) {
  const success = await biddingSystem.updateBid(bidId, { status });
  if (success) {
    NotificationSystem.showNotification(`Bid status updated to ${status}.`, "success");
    loadBidsTable();
    if (status !== 'proposal_generated' && status !== 'draft') { // Hide if not in a state where proposal text is relevant
        document.getElementById('proposalTextView').style.display = 'none'; 
    }
  } else {
    NotificationSystem.showNotification("Failed to update bid status.", "error");
  }
}

function populateServiceCheckboxesForBids() {
    const container = document.getElementById('bidServicesCheckboxes');
    if(!container) return;
    container.innerHTML = ''; // Clear existing
    if (typeof serviceRates !== 'undefined') {
        for (const serviceName in serviceRates) {
            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = 'checkbox-item';
            checkboxDiv.innerHTML = `
                <label>
                    <input type="checkbox" name="bidServices" value="${serviceName}">
                    ${serviceName}
                </label>
            `;
            container.appendChild(checkboxDiv);
        }
    } else {
        console.warn("serviceRates not defined. Cannot populate service checkboxes for bids.")
    }
}

async function populateCustomerDropdownsForBids() {
    const bidCustomerSelect = document.getElementById('bidCustomerId');
    if (!bidCustomerSelect) return;
    
    try {
        const customersSnapshot = await db.collection("users").where("role", "==", "customer").get();
        const currentValue = bidCustomerSelect.value;
        bidCustomerSelect.innerHTML = '<option value="">Select Customer</option>'; 
        customersSnapshot.forEach(doc => {
            const customer = { id: doc.id, ...doc.data() };
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = `${customer.displayName || customer.email} (ID: ${customer.id})`;
            bidCustomerSelect.appendChild(option);
        });
        bidCustomerSelect.value = currentValue; 
    } catch (error) {
        console.error("Error populating customer dropdown for bids:", error);
    }
}

document.getElementById('generateBidForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const customerId = document.getElementById('bidCustomerId').value;
  const propertyAddress = document.getElementById('bidPropertyAddress').value;
  const propertySizeSqFt = parseFloat(document.getElementById('bidPropertySize').value);
  const complexity = parseFloat(document.getElementById('bidPropertyComplexity').value);
  const urgent = document.getElementById('bidUrgent').checked;

  const selectedServices = [];
  document.querySelectorAll('#bidServicesCheckboxes input[name="bidServices"]:checked').forEach(cb => {
    selectedServices.push({ type: cb.value, notes: "" }); 
  });

  if (!customerId) {
    NotificationSystem.showNotification("Please select a customer for the bid.", "warning");
    return;
  }
  if (selectedServices.length === 0) {
    NotificationSystem.showNotification("Please select at least one service for the bid.", "warning");
    return;
  }
  if (isNaN(propertySizeSqFt) || propertySizeSqFt <=0) {
    NotificationSystem.showNotification("Please enter a valid property size.", "warning");
    return;
  }

  const bidRequest = {
    customerId,
    propertyDetails: { address: propertyAddress, sizeSqFt: propertySizeSqFt, complexity },
    services: selectedServices,
    urgent
  };
  showLoader();
  const newBid = await biddingSystem.generateBid(bidRequest);
  hideLoader();
  if (newBid) {
    loadBidsTable();
    e.target.reset();
    document.querySelectorAll('#bidServicesCheckboxes input[name="bidServices"]:checked').forEach(cb => cb.checked = false);
    document.getElementById('proposalTextView').style.display = 'none';
    NotificationSystem.showNotification("New bid generated successfully!", "success");
  } else {
    NotificationSystem.showNotification("Failed to generate bid. Check console for errors.", "error");
  }
});

// ----- Customer Loyalty Program Functions -----
async function loadLoyaltyAccountsTable() {
  const tableBody = document.querySelector("#loyaltyAccountsTable tbody");
  if (!tableBody) {
    console.log("Loyalty accounts table body not found"); return;
  }
  tableBody.innerHTML = ""; 

  try {
    // This is a simplified approach. In a real app with many users, 
    // you'd paginate or fetch loyalty data more directly if possible.
    const customersSnapshot = await db.collection('users').where('role', '==', 'customer').get();
    if (customersSnapshot.empty) {
        tableBody.innerHTML = '<tr><td colspan="4">No customer accounts found to display loyalty for.</td></tr>';
        return;
    }

    let accountsDisplayed = 0;
    for (const custDoc of customersSnapshot.docs) {
      const customerId = custDoc.id;
      const customerData = custDoc.data();
      const account = await loyaltyProgram.getLoyaltyAccount(customerId);
      if (account) {
        accountsDisplayed++;
        const row = tableBody.insertRow();
        row.innerHTML = `
          <td>${customerData.displayName || customerData.email} (ID: ${customerId})</td>
          <td>${account.points}</td>
          <td><span class="tier-badge tier-${account.tier}">${account.tier}</span></td>
          <td>${account.lastUpdated ? new Date(account.lastUpdated.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
        `;
      }
    }
    if (accountsDisplayed === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">No loyalty accounts found.</td></tr>';
    }
  } catch (error) {
    console.error("Error loading loyalty accounts table:", error);
    tableBody.innerHTML = '<tr><td colspan="4">Error loading loyalty accounts.</td></tr>';
  }
}

async function loadReferralsTable() {
  const tableBody = document.querySelector("#referralsTable tbody");
  if (!tableBody) {
    console.log("Referrals table body not found"); return;
  }
  tableBody.innerHTML = "";

  try {
    const referralsSnapshot = await loyaltyProgram.db.collection(loyaltyProgram.referralsCollection).orderBy('createdAt', 'desc').get();
    if (referralsSnapshot.empty) {
        tableBody.innerHTML = '<tr><td colspan="5">No referrals found.</td></tr>';
        return;
    }

    referralsSnapshot.docs.forEach(doc => {
      const ref = { id: doc.id, ...doc.data() };
      const row = tableBody.insertRow();
      row.innerHTML = `
        <td>${ref.referrerCustomerId}</td>
        <td>${ref.referredCustomerEmail}</td>
        <td><span class="status-badge status-${ref.status}">${ref.status}</span></td>
        <td>${ref.createdAt ? new Date(ref.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
        <td>
          ${ref.status === 'pending' ? `<button class="btn-modern btn-small" onclick="completeReferralAdmin('${ref.id}')">Mark Complete</button>` : (ref.status === 'completed' ? `Completed (${ref.referredCustomerId || 'N/A'})` : '-')}
        </td>
      `;
    });
  } catch (error) {
    console.error("Error loading referrals table:", error);
    tableBody.innerHTML = '<tr><td colspan="5">Error loading referrals.</td></tr>';
  }
}

async function completeReferralAdmin(referralId) {
    const referredNewCustomerId = prompt("Enter the Customer ID of the newly registered referred user (must be an existing user ID in the system):");
    if (referredNewCustomerId) {
        showLoader();
        const result = await loyaltyProgram.completeReferral(referralId, referredNewCustomerId);
        hideLoader();
        if (result.success) {
            NotificationSystem.showNotification("Referral marked complete and points awarded!", "success");
            loadLoyaltyAccountsTable(); // Refresh points in accounts table
            loadReferralsTable(); // Refresh status in referrals table
        } else {
            NotificationSystem.showNotification(result.error || "Failed to complete referral.", "error");
        }
    } else {
        NotificationSystem.showNotification("Referred Customer ID is required to complete referral.", "warning");
    }
}

// ----- Sustainability & Environmental Impact Log Functions -----
const sustainabilityLogFieldsConfig = {
    water_usage: [
        { label: 'Amount (Liters)', id: 'susLogAmount', type: 'number', required: true, step: '0.1' },
        { label: 'Source (e.g., municipal, rain harvest)', id: 'susLogSource', type: 'text', value: 'municipal' },
        { label: 'Notes', id: 'susLogNotesWater', type: 'textarea' }
    ],
    chemical_application: [
        { label: 'Material/Chemical Used', id: 'susLogMaterialId', type: 'select', required: true, options: [] }, // Will be populated from MaterialTracker
        { label: 'Quantity Used', id: 'susLogQuantityUsed', type: 'number', required: true, step: '0.01' },
        { label: 'Application Area (sq ft, optional)', id: 'susLogAppArea', type: 'number', step: '1' }
    ],
    green_waste_management: [
        { label: 'Amount (kg)', id: 'susLogAmountKg', type: 'number', required: true, step: '0.1' },
        { label: 'Management Type', id: 'susLogWasteType', type: 'select', required: true, options: [{value: 'composted', text: 'Composted'}, {value: 'recycled', text: 'Recycled'}] }
    ]
};

async function populateCustomerDropdownsForSustainability() {
    const susCustomerSelect = document.getElementById('susLogCustomerId');
    if (!susCustomerSelect) {
        console.log("Sustainability customer dropdown not found"); return;
    }
    
    try {
        const customersSnapshot = await db.collection("users").where("role", "==", "customer").get();
        const currentValue = susCustomerSelect.value; // Preserve selection if any
        susCustomerSelect.innerHTML = '<option value="">Select Customer</option>'; 
        customersSnapshot.forEach(doc => {
            const customer = { id: doc.id, ...doc.data() };
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = `${customer.displayName || customer.email} (ID: ${customer.id})`;
            susCustomerSelect.appendChild(option);
        });
        susCustomerSelect.value = currentValue; 
    } catch (error) {
        console.error("Error populating customer dropdown for sustainability:", error);
    }
}

async function populateSustainabilityLogFormFields() {
    const logType = document.getElementById('susLogType')?.value;
    const fieldsContainer = document.getElementById('sustainabilityLogFields');
    if (!logType || !fieldsContainer) {
        console.log("Sustainability log type or fields container not found");
        if(fieldsContainer) fieldsContainer.innerHTML = ''; // Clear if container exists but no type
        return;
    }
    fieldsContainer.innerHTML = ''; // Clear previous fields

    const fields = sustainabilityLogFieldsConfig[logType];
    if (fields) {
        for (const field of fields) {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            let inputHtml = `<label for="${field.id}">${field.label}</label>`;
            if (field.type === 'select') {
                let optionsHtml = '';
                if (field.id === 'susLogMaterialId') { 
                    try {
                        const materials = await materialTracker.getAllMaterials();
                        materials.forEach(mat => optionsHtml += `<option value="${mat.id}">${mat.name} (${mat.unit || 'N/A'})</option>`);
                    } catch (e) { console.error("Failed to load materials for dropdown", e);}
                } else {
                    field.options.forEach(opt => optionsHtml += `<option value="${opt.value}">${opt.text}</option>`);
                }
                inputHtml += `<select id="${field.id}" class="form-control-modern" ${field.required ? 'required' : ''}>${optionsHtml}</select>`;
            } else if (field.type === 'textarea') {
                inputHtml += `<textarea id="${field.id}" class="form-control-modern" ${field.required ? 'required' : ''}></textarea>`;
            } else {
                inputHtml += `<input type="${field.type}" id="${field.id}" class="form-control-modern" ${field.required ? 'required' : ''} ${field.step ? `step="${field.step}"` : ''} ${field.value ? `value="${field.value}"` : ''}>`;
            }
            formGroup.innerHTML = inputHtml;
            fieldsContainer.appendChild(formGroup);
        }
    }
}

document.getElementById('susLogType')?.addEventListener('change', populateSustainabilityLogFormFields);

document.getElementById('logSustainabilityDataForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const jobId = document.getElementById('susLogJobId')?.value || null;
    const customerId = document.getElementById('susLogCustomerId')?.value;
    const logType = document.getElementById('susLogType')?.value;
    let success = false;

    if (!customerId) {
        NotificationSystem.showNotification("Please select a customer.", "warning");
        return;
    }
    showLoader();
    try {
        if (logType === 'water_usage') {
            const amountLiters = parseFloat(document.getElementById('susLogAmount').value);
            const source = document.getElementById('susLogSource').value;
            const notes = document.getElementById('susLogNotesWater').value;
            success = await sustainabilityTracker.logWaterUsage(jobId, customerId, amountLiters, source, notes);
        } else if (logType === 'chemical_application') {
            const materialId = document.getElementById('susLogMaterialId').value;
            const quantityUsed = parseFloat(document.getElementById('susLogQuantityUsed').value);
            const applicationAreaSqFt = document.getElementById('susLogAppArea')?.value ? parseFloat(document.getElementById('susLogAppArea').value) : null;
            success = await sustainabilityTracker.logChemicalUsage(jobId, customerId, materialId, quantityUsed, applicationAreaSqFt);
        } else if (logType === 'green_waste_management') {
            const amountKg = parseFloat(document.getElementById('susLogAmountKg').value);
            const wasteType = document.getElementById('susLogWasteType').value;
            success = await sustainabilityTracker.logGreenWaste(jobId, customerId, amountKg, wasteType);
        }

        if (success) {
            NotificationSystem.showNotification("Sustainability data logged successfully!", "success");
            loadSustainabilityLogTable();
            e.target.reset(); // Reset the form
            populateSustainabilityLogFormFields(); // Repopulate dynamic fields for current selection (or clear them)
        } else if (!success && logType) { // Check if success is explicitly false and not just an unhandled type
             NotificationSystem.showNotification("Failed to log sustainability data. Please check inputs.", "error");
        }
    } catch (error) {
        console.error("Error in logSustainabilityDataForm submission:", error);
        NotificationSystem.showNotification("Error logging sustainability data: " + error.message, "error");
    } finally {
        hideLoader();
    }
});

async function loadSustainabilityLogTable() {
  const tableBody = document.querySelector("#sustainabilityLogTable tbody");
  if (!tableBody) { console.log("Sustainability log table body not found"); return; }
  tableBody.innerHTML = "";

  try {
    const report = await sustainabilityTracker.generateSustainabilityReport();
    const logs = report ? report.logs : [];

    if (logs.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4">No sustainability logs found.</td></tr>';
      return;
    }
    logs.forEach(log => {
      const row = tableBody.insertRow();
      let details = '';
      if (log.type === 'water_usage') details = `${log.amount} ${log.unit} from ${log.source || 'N/A'}`;
      else if (log.type === 'chemical_application') details = `${log.materialName || 'N/A'}: ${log.quantity} ${log.unit || 'N/A'}`;
      else if (log.type === 'green_waste_management') details = `${log.managementType || 'N/A'}: ${log.amount} ${log.unit || 'N/A'}`;
      else details = JSON.stringify(log.details) || 'No details'; // Fallback
      
      row.innerHTML = `
        <td>${log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'N/A'}</td>
        <td>${log.type ? log.type.replace(/_/g, ' ') : 'N/A'}</td>
        <td>${details}</td>
        <td>${log.jobId ? `Job: ${log.jobId}<br>` : ''}Cust: ${log.customerId || 'N/A'}</td>
      `;
    });
  } catch (error) {
      console.error("Error loading sustainability log table:", error);
      tableBody.innerHTML = '<tr><td colspan="4">Error loading sustainability log.</td></tr>';
  }
}

async function generateSustainabilityReportAdmin() {
    showLoader();
    const report = await sustainabilityTracker.generateSustainabilityReport();
    hideLoader();
    const reportView = document.getElementById('sustainabilityReportView');
    const reportContent = document.getElementById('sustainabilityReportContent');

    if (report && reportView && reportContent) {
        let reportText = `Sustainability Summary Report:\nGenerated: ${new Date().toLocaleString()}\n\n`;
        reportText += `Total Green Waste Managed: ${report.totalGreenWasteManagedKg.toFixed(2)} kg\n`;
        // Add more summary points as calculated in SustainabilityTracker (totalWaterSavedEstimate, totalChemicalsReducedEstimate)
        reportText += `Total Water Usage Logged (Sum of amounts, unit specific): Some calculation here...\n`; // Placeholder
        reportText += `\n--- Detailed Logs (${report.logs.length} entries) ---\n`;
        report.logs.forEach(log => {
            let detail = '';
            if(log.type === 'water_usage') detail = `Water: ${log.amount} ${log.unit} (Source: ${log.source})`;
            else if(log.type === 'chemical_application') detail = `Chemical: ${log.materialName} - ${log.quantity} ${log.unit}`;
            else if(log.type === 'green_waste_management') detail = `Green Waste: ${log.amount} ${log.unit} (${log.managementType})`;
            reportText += `${new Date(log.timestamp.seconds * 1000).toLocaleDateString()} - ${log.type.replace('_',' ')} - ${detail} (Cust: ${log.customerId}, Job: ${log.jobId || 'N/A'})\n`;
        });
        reportContent.textContent = reportText;
        reportView.style.display = 'block';
        NotificationSystem.showNotification("Sustainability report generated.", "info");
    } else {
        NotificationSystem.showNotification("Could not generate or display sustainability report.", "error");
        if(reportView) reportView.style.display = 'none';
    }
}

// Centralized Admin Dashboard Initialization function
function initializeAdminDashboard() {
    console.log("Initializing Admin Dashboard...");
    if (localStorage.getItem("darkMode") === "on") {
        document.body.classList.add("dark");
    }
    loadCustomersDropdown(); 
    updateDashboardStats();
    loadExpenses(); 
    loadRecentSmartQuotes(); 
    
    loadEquipmentTable();
    loadMaterialsTable();
    
    populateServiceCheckboxesForBids();
    populateCustomerDropdownsForBids();
    loadBidsTable();

    loadLoyaltyAccountsTable();
    loadReferralsTable();

    // Sustainability Tracker Initializations
    populateCustomerDropdownsForSustainability(); 
    populateSustainabilityLogFormFields(); // Initial call to set up fields for default log type
    loadSustainabilityLogTable();
    
    console.log("Admin Dashboard Fully Initialized.");
}

window.onload = initializeAdminDashboard;
