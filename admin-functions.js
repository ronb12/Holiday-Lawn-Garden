// Admin Functions Module
// Handles core administrative functionality for Holliday's Lawn & Garden

// Firebase configuration should be loaded from environment variables
// Do not hardcode credentials here

// Initialize Firebase DB reference after ensuring Firebase is initialized
let db;

// Wait for Firebase to be ready
function initializeFirebaseDB() {
  if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
    db = firebase.firestore();
    return true;
  }
  return false;
}

// Ensure Firebase is ready before executing admin functions
function ensureFirebaseReady(callback) {
  if (initializeFirebaseDB()) {
    callback();
  } else {
    // Wait a bit and try again
    setTimeout(() => {
      if (initializeFirebaseDB()) {
        callback();
      } else {
        console.error('Firebase not ready after timeout');
      }
    }, 1000);
  }
}

// ✅ Utility Functions
function showLoader() {
  const loader = document.getElementById("loadingOverlay");
  if (loader) loader.style.display = "flex";
}

function hideLoader() {
  const loader = document.getElementById("loadingOverlay");
  if (loader) loader.style.display = "none";
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark") ? "on" : "off");
}

// Updated for new tab system
function showTab(id) {
  document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
  const targetTab = document.getElementById(id + '-tab');
  if (targetTab) targetTab.classList.add("active");
  
  // Update tab navigation
  document.querySelectorAll(".tab-item").forEach(item => item.classList.remove("active"));
  event.target.classList.add("active");
  
  // Load data based on tab
  if (id === 'overview') {
    updateDashboardStats();
  }
}

// Initialize when DOM and Firebase are ready
window.addEventListener('load', () => {
  ensureFirebaseReady(() => {
    if (localStorage.getItem("darkMode") === "on") document.body.classList.add("dark");
    loadCustomersDropdown();
    updateDashboardStats();
  });
});

// ✅ Customer Dropdown
function loadCustomersDropdown() {
  if (!db) {
    console.error('Database not initialized');
    return;
  }
  
  // Updated dropdown IDs for new design
  const ids = ["requestCustomer", "quoteCustomer", "invoiceCustomer", "customerSelect", "bidCustomerId"];
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
    }).catch(error => {
      console.error('Error loading customers:', error);
    });
  });
}

// ✅ Submit Request
function submitRequest(e) {
  e.preventDefault();
  if (!db) return;
  
  const customerUID = document.getElementById("requestCustomer").value;
  const description = document.getElementById("requestDescription").value;
  const ref = db.collection("customers").doc(customerUID);
  ref.get().then(doc => {
    const name = doc.data().name || "Customer";
    ref.collection("requests").add({ customer: name, description, status: "Pending", createdAt: new Date(), fromAdmin: true });
    db.collection("service_requests").add({ customerId: customerUID, customerName: name, description, status: "Pending", createdAt: new Date(), submittedBy: 'admin', email: doc.data().email, serviceType: 'Admin Created', hasUnreadFromCustomer: false, hasUnreadFromAdmin: false });
    e.target.reset();
    updateDashboardStats();
  });
}

// ✅ Submit Quote
function submitQuote(e) {
  // DATA MODEL REFACTORING NOTE (Quotes/Proposals):
  // This function (and others like the basic `calculateQuote`) appears to be part of an older quoting system
  // interacting with `customers/{uid}/quotes` and a general `quotes` collection.
  // The more current system seems to be the `BiddingSystem` class (in bidding-system.js) which uses the `bids` collection.
  // Consider standardizing all quote/proposal functionality on the `BiddingSystem` and the `bids` collection.
  // This would involve updating `updateDashboardStats` and phasing out older quote-related collections and functions.
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
  // DATA MODEL REFACTORING NOTE (Dashboard Stats Accuracy - Quotes):
  // This function currently fetches quote counts from the "quotes" collection.
  // For accuracy, if the `BiddingSystem` and `bids` collection become the standard for quotes/proposals,
  // this section should be updated to count documents in the `bids` collection (e.g., with status 'sent' or 'accepted').
  // UPDATE: This section has been updated to use biddingSystem.listBids().
  const now = new Date();
  const m = now.getMonth(), y = now.getFullYear();
  let mp = 0, yp = 0, td = 0, ti = 0, em = 0, ey = 0;
  db.collection("service_requests").get().then(snap => {
    document.getElementById("statRequests").innerText = `📝 Requests: ${snap.size}`;
  });
  // db.collection("quotes").get().then(snap => { // Old method
  //   document.getElementById("statQuotes").innerText = `💬 Quotes: ${snap.size}`;
  // });
  if (typeof biddingSystem !== 'undefined' && biddingSystem.listBids) {
    biddingSystem.listBids().then(bidsList => {
      const statQuotesElement = document.getElementById("statQuotes");
      if (statQuotesElement) {
        statQuotesElement.innerText = `💬 Quotes: ${bidsList.length}`;
      }
    }).catch(error => {
      console.error("Error fetching bids for dashboard stats:", error);
      const statQuotesElement = document.getElementById("statQuotes");
      if (statQuotesElement) {
        statQuotesElement.innerText = `💬 Quotes: Error`;
      }
    });
  } else {
    console.warn("biddingSystem not available for dashboard stats.");
    const statQuotesElement = document.getElementById("statQuotes");
    if (statQuotesElement) {
      statQuotesElement.innerText = `💬 Quotes: N/A`;
    }
  }

  db.collection("invoices").orderBy("createdAt", "desc").get().then(snapshot => {
    snapshot.forEach(doc => {
      const d = doc.data();
      const date = new Date(d.createdAt.toDate()).toLocaleDateString();
      ti += d.paid ? 0 : d.amount;
      const row = `<tr><td>${d.customer}</td><td>$${d.amount.toFixed(2)}</td><td>${date}</td><td>${d.paid ? '✅' : '❌'}</td><td><button onclick="toggleInvoicePaid('${doc.id}', ${!d.paid})">${d.paid ? 'Mark Unpaid' : 'Mark Paid'}</button></td></tr>`;
      if (d.paid) document.querySelector("#paidInvoices tbody").innerHTML += row;
      else document.querySelector("#unpaidInvoices tbody").innerHTML += row;
    });
    // Update elements that exist in new design
    const totalDueElement = document.getElementById("statInvoicesValue") || document.getElementById("statTotalDue");
    if (totalDueElement) {
      totalDueElement.textContent = `$${ti.toFixed(2)}`;
    }
    
    // Legacy support for old IDs if they exist
    const legacyTotalDue = document.getElementById("statTotalDue");
    if (legacyTotalDue) {
      legacyTotalDue.innerText = `💰 Total Due: $${ti.toFixed(2)}`;
    }
    
    const legacyInvoices = document.getElementById("statInvoices");
    if (legacyInvoices) {
      legacyInvoices.innerText = `💰 Invoices: ${snapshot.size}`;
    }
  });

  db.collection("invoices").where("paid", "==", true).get().then(snapshot => {
    snapshot.forEach(doc => {
      const d = doc.data();
      const date = d.createdAt ? new Date(d.createdAt.toDate()) : new Date();
      if (date.getMonth() === m && date.getFullYear() === y) mp += d.amount;
      if (date.getFullYear() === y) yp += d.amount;
    });
    
    // Update elements that exist in new design
    const monthlyElement = document.getElementById("statRevenueValue") || document.getElementById("statMonthlyProfit");
    if (monthlyElement) {
      monthlyElement.textContent = `$${mp.toFixed(0)}`;
    }
    
    // Legacy support
    const legacyMonthly = document.getElementById("statMonthlyProfit");
    if (legacyMonthly) {
      legacyMonthly.innerText = `📆 This Month: $${mp.toFixed(2)}`;
    }
    
    const legacyYearly = document.getElementById("statYearlyProfit");
    if (legacyYearly) {
      legacyYearly.innerText = `📈 This Year: $${yp.toFixed(2)}`;
    }
  });

  db.collection("expenses").get().then(snapshot => {
    snapshot.forEach(doc => {
      const d = doc.data();
      const date = new Date(d.date);
      if (date.getMonth() === m && date.getFullYear() === y) em += d.amount;
      if (date.getFullYear() === y) ey += d.amount;
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
      "invoice_created", // Changed type to be more specific
      `New invoice #${invoiceRef.id.substring(0,8).toUpperCase()} for $${formData.amount.toFixed(2)} has been created.`
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
          <button class="btn-modern btn-small btn-secondary" onclick="generateAdminQuotePDF('${bid.id}')">📄 PDF</button>
          ${bid.status === 'accepted' ? `<button class="btn-modern btn-small btn-success" onclick="openScheduleServiceModal('${bid.id}')">Schedule Service</button>` : ''}
          <select onchange="updateBidStatus('${bid.id}', this.value)" class="form-control-small" style="padding: 5px; margin-left: 5px;">
            <option value="draft" ${bid.status === 'draft' ? 'selected' : ''}>Draft</option>
            <option value="proposal_generated" ${bid.status === 'proposal_generated' ? 'selected' : ''}>Proposal Generated</option>
            <option value="sent" ${bid.status === 'sent' ? 'selected' : ''}>Sent</option>
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

// ----- Incoming Service Requests View -----
async function loadIncomingServiceRequests() {
  const tableBody = document.getElementById("incomingRequestsTableBody");
  if (!tableBody) {
    console.log("Incoming service requests table body not found"); 
    return;
  }
  tableBody.innerHTML = '<tr><td colspan="6">Loading requests...</td></tr>';
  showLoader();

  try {
    const snapshot = await db.collection("service_requests")
                            .orderBy("createdAt", "desc")
                            .limit(50) // Add limit for performance, consider pagination for more
                            .get();
    
    if (snapshot.empty) {
      tableBody.innerHTML = '<tr><td colspan="6">No incoming service requests found.</td></tr>';
      hideLoader();
      return;
    }

    let rowsHtml = "";
    snapshot.forEach(doc => {
      const request = { id: doc.id, ...doc.data() };
      const requestDate = request.createdAt && request.createdAt.toDate ? request.createdAt.toDate().toLocaleDateString() : 'N/A';
      const customerName = request.customerName || request.fullName || request.email; // Fallback for name
      rowsHtml += `
        <tr>
          <td>${requestDate}</td>
          <td>${customerName}</td>
          <td>${request.email || 'N/A'}</td>
          <td>${request.serviceType || request.description?.substring(0,30) || 'N/A'}</td>
          <td><span class="status-badge status-${request.status?.toLowerCase() || 'unknown'}">${request.status || 'Unknown'}</span></td>
          <td>
            <button class="btn-modern btn-small" onclick="openServiceRequestChatModal('${request.id}')">
              ${request.hasUnreadFromCustomer ? '<span class="notification-dot">●</span> ' : ''}Chat / View
            </button>
            <!-- Add other actions like 'Create Quote' later -->
          </td>
        </tr>
      `;
    });
    tableBody.innerHTML = rowsHtml;

  } catch (error) {
    console.error("Error loading incoming service requests:", error);
    tableBody.innerHTML = '<tr><td colspan="6">Error loading requests. See console.</td></tr>';
  } finally {
    hideLoader();
  }
}

function filterServiceRequestsTable() {
  const input = document.getElementById("serviceRequestSearch");
  const filter = input.value.toLowerCase();
  const tableBody = document.getElementById("incomingRequestsTableBody");
  const rows = tableBody.getElementsByTagName("tr");

  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].getElementsByTagName("td");
    let found = false;
    if (cells.length > 0) { // Ensure row has cells
        // Search in relevant cells (e.g., Customer, Email, Service Type)
        const customerText = cells[1]?.textContent || cells[1]?.innerText || "";
        const emailText = cells[2]?.textContent || cells[2]?.innerText || "";
        const serviceText = cells[3]?.textContent || cells[3]?.innerText || "";
        if (customerText.toLowerCase().includes(filter) || 
            emailText.toLowerCase().includes(filter) || 
            serviceText.toLowerCase().includes(filter)) {
            found = true;
        }
    }
    rows[i].style.display = found ? "" : "none";
  }
}

// ----- Admin Chat Modal Functions -----
let currentServiceRequestIdForAdminChat = null;
let adminChatMessagesUnsubscribe = null; // To stop listening to message updates when modal closes

async function openServiceRequestChatModal(requestId) {
  currentServiceRequestIdForAdminChat = requestId;
  const modal = document.getElementById("adminChatModal");
  const chatTitle = document.getElementById("adminChatModalTitle");
  const messagesContainer = document.getElementById("adminChatMessagesContainer");
  
  if (!modal || !chatTitle || !messagesContainer) {
    console.error("Admin chat modal elements not found.");
    return;
  }

  // Fetch request details to display customer name/info in title
  try {
    const requestDoc = await db.collection("service_requests").doc(requestId).get();
    if (requestDoc.exists) {
      const requestData = requestDoc.data();
      chatTitle.textContent = `Chat with ${requestData.customerName || requestData.email || 'Customer'} (ID: ${requestId.substring(0,6)}...)`;
      // Mark as read by admin
      if (requestData.hasUnreadFromCustomer) {
        await db.collection("service_requests").doc(requestId).update({ hasUnreadFromCustomer: false });
        // Optimistically update the UI button if an observer isn't set up for the request table
        loadIncomingServiceRequests(); // This will refresh the table and clear the dot
      }
    }
  } catch (error) {
    console.error("Error fetching service request for chat title:", error);
    chatTitle.textContent = `Service Request Chat (ID: ${requestId.substring(0,6)}...)`;
  }

  messagesContainer.innerHTML = "<p>Loading messages...</p>";
  modal.style.display = "block";
  loadAdminChatMessages(requestId);
}

function loadAdminChatMessages(requestId) {
  const messagesContainer = document.getElementById("adminChatMessagesContainer");
  if (!messagesContainer) return;

  // Unsubscribe from previous listener if any
  if (adminChatMessagesUnsubscribe) {
    adminChatMessagesUnsubscribe();
  }

  adminChatMessagesUnsubscribe = db.collection("service_requests").doc(requestId).collection("messages")
    .orderBy("timestamp", "asc")
    .onSnapshot(snapshot => {
      if (snapshot.empty) {
        messagesContainer.innerHTML = "<p>No messages yet. Start the conversation!</p>";
        return;
      }
      let messagesHtml = "";
      snapshot.forEach(doc => {
        const msg = doc.data();
        const senderClass = msg.sender === 'admin' ? 'chat-bubble-admin' : 'chat-bubble-customer';
        const time = msg.timestamp && msg.timestamp.toDate ? msg.timestamp.toDate().toLocaleTimeString() : '';
        messagesHtml += `<div class="chat-bubble ${senderClass}"><strong>${msg.sender === 'admin' ? 'Admin' : (msg.customerName || 'Customer')}:</strong> ${msg.text}<div class="chat-timestamp">${time}</div></div>`;
      });
      messagesContainer.innerHTML = messagesHtml;
      messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to bottom
    }, error => {
      console.error("Error listening to chat messages:", error);
      messagesContainer.innerHTML = "<p>Error loading messages. Please try again.</p>";
    });
}

async function sendAdminChatMessage() {
  const input = document.getElementById("adminChatMessageInput");
  const messageText = input.value.trim();

  if (!messageText || !currentServiceRequestIdForAdminChat) {
    NotificationSystem.showNotification("Cannot send empty message or no request selected.", "warning");
    return;
  }

  const messageData = {
    text: messageText,
    sender: "admin",
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
  };

  try {
    await db.collection("service_requests").doc(currentServiceRequestIdForAdminChat).collection("messages").add(messageData);
    // Optionally, set a flag on the service request to notify customer
    await db.collection("service_requests").doc(currentServiceRequestIdForAdminChat).update({ 
      hasUnreadFromAdmin: true,
      lastMessageSnippetAdmin: messageText.substring(0, 50) // Store a snippet of the last admin message
    }); 
    input.value = ""; // Clear input field
    // Messages will update automatically due to the onSnapshot listener in loadAdminChatMessages
  } catch (error) {
    console.error("Error sending admin chat message:", error);
    NotificationSystem.showNotification("Error sending message.", "error");
  }
}

function closeAdminChatModal() {
  const modal = document.getElementById("adminChatModal");
  if (modal) {
    modal.style.display = "none";
  }
  // Stop listening to message updates
  if (adminChatMessagesUnsubscribe) {
    adminChatMessagesUnsubscribe();
    adminChatMessagesUnsubscribe = null;
  }
  currentServiceRequestIdForAdminChat = null;
  document.getElementById("adminChatMessageInput").value = ""; // Clear input
  document.getElementById("adminChatMessagesContainer").innerHTML = ""; // Clear messages
}

// ----- Generic Modal Helper -----
function closeGenericAdminModal() {
  const modal = document.getElementById("genericAdminModal");
  if (modal) {
    modal.style.display = "none";
  }
  // Clear previous content if necessary
  document.getElementById("genericAdminModalTitle").innerHTML = "Modal Title";
  document.getElementById("genericAdminModalBody").innerHTML = "";
  document.getElementById("genericAdminModalFooter").innerHTML = '<button class="btn-modern btn-grey" onclick="closeGenericAdminModal()">Close</button>';
}

// ----- Quote to Schedule Workflow -----
async function openScheduleServiceModal(bidId) {
  if (!bidId) {
    NotificationSystem.showNotification("Bid ID is missing.", "error");
    return;
  }

  showLoader();
  try {
    const bidDoc = await biddingSystem.getBidById(bidId);
    if (!bidDoc) {
      NotificationSystem.showNotification("Bid details not found.", "error");
      hideLoader();
      return;
    }

    // Attempt to get customer details for better context
    let customerName = bidDoc.customerId;
    try {
        const userDoc = await db.collection("users").doc(bidDoc.customerId).get();
        if(userDoc.exists) customerName = userDoc.data().displayName || userDoc.data().email;
    } catch (e) { console.warn("Could not fetch customer name for schedule modal", e); }

    const services = bidDoc.services.map(s => s.serviceType).join(', ');

    document.getElementById("genericAdminModalTitle").textContent = `Schedule Service for Bid: ${bidDoc.bidNumber}`;
    const modalBody = document.getElementById("genericAdminModalBody");
    modalBody.innerHTML = `
      <p><strong>Customer:</strong> ${customerName}</p>
      <p><strong>Services:</strong> ${services}</p>
      <p><strong>Quoted Amount:</strong> $${bidDoc.estimatedTotal.toFixed(2)}</p>
      <form id="scheduleServiceForm" class="form-modern" style="padding:0;">
        <input type="hidden" id="scheduleBidId" value="${bidId}">
        <div class="form-group">
          <label for="scheduleDate">Scheduled Date</label>
          <input type="date" id="scheduleDate" class="form-control-modern" required>
        </div>
        <div class="form-group">
          <label for="scheduleTime">Scheduled Time (e.g., 10:00 AM)</label>
          <input type="time" id="scheduleTime" class="form-control-modern" required>
        </div>
        <div class="form-group">
          <label for="scheduleAdminNotes">Admin Notes (Optional)</label>
          <textarea id="scheduleAdminNotes" class="form-control-modern" rows="3"></textarea>
        </div>
      </form>
    `;

    const modalFooter = document.getElementById("genericAdminModalFooter");
    modalFooter.innerHTML = `
      <button class="btn-modern btn-success" onclick="submitScheduleServiceForm('${bidId}')">Confirm Schedule</button>
      <button class="btn-modern btn-grey" onclick="closeGenericAdminModal()">Cancel</button>
    `;

    document.getElementById("genericAdminModal").style.display = "block";
  } catch (error) {
    console.error("Error opening schedule service modal:", error);
    NotificationSystem.showNotification("Error preparing schedule form: " + error.message, "error");
  } finally {
    hideLoader();
  }
}

async function submitScheduleServiceForm(bidId) {
  if (!bidId) {
    NotificationSystem.showNotification("Bid ID is missing for scheduling.", "error");
    return;
  }

  const scheduledDate = document.getElementById("scheduleDate").value;
  const scheduledTime = document.getElementById("scheduleTime").value;
  const adminNotes = document.getElementById("scheduleAdminNotes").value;

  if (!scheduledDate || !scheduledTime) {
    NotificationSystem.showNotification("Please select a date and time for the service.", "warning");
    return;
  }

  showLoader();
  try {
    const bid = await biddingSystem.getBidById(bidId);
    if (!bid) {
      NotificationSystem.showNotification("Original bid not found. Cannot schedule.", "error");
      hideLoader();
      return;
    }

    // Fetch customer email (assuming bid.customerId is the Firebase UID)
    let customerEmail = bid.customerEmail; // If already on bid
    let customerDisplayName = bid.customerName; // If already on bid

    if (!customerEmail || !customerDisplayName) {
        const userDoc = await db.collection("users").doc(bid.customerId).get();
        if (userDoc.exists) {
            customerEmail = userDoc.data().email;
            customerDisplayName = userDoc.data().displayName || userDoc.data().email.split('@')[0];
        } else {
            throw new Error("Customer user document not found.");
        }
    }

    const serviceTypeDescription = bid.services.map(s => s.serviceType).join(', ');

    const serviceRequestData = {
      originalBidId: bidId,
      bidNumber: bid.bidNumber,
      customerId: bid.customerId,
      customerName: customerDisplayName,
      email: customerEmail,
      serviceType: serviceTypeDescription,
      description: `Service scheduled from accepted bid ${bid.bidNumber}. Services: ${serviceTypeDescription}`,
      status: "scheduled",
      scheduledDate: scheduledDate,
      scheduledTime: scheduledTime,
      notes: adminNotes,
      price: bid.estimatedTotal,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      submittedBy: 'system_accepted_bid',
      hasUnreadFromAdmin: false, // Or true if you want to notify customer of scheduling
      hasUnreadFromCustomer: false,
    };

    await db.collection("service_requests").add(serviceRequestData);
    await biddingSystem.updateBid(bidId, { status: "service_scheduled", scheduledServiceDate: scheduledDate });

    NotificationSystem.showNotification("Service scheduled successfully!", "success");
    closeGenericAdminModal();
    loadBidsTable(); // Refresh bids table to show new status
    loadIncomingServiceRequests(); // Refresh service requests to show newly scheduled one

  } catch (error) {
    console.error("Error scheduling service from bid:", error);
    NotificationSystem.showNotification("Error scheduling service: " + error.message, "error");
  } finally {
    hideLoader();
  }
}

// ----- Admin Invoices Management -----
async function loadAdminInvoicesTable() {
  const tableBody = document.getElementById("adminInvoicesTableBody");
  if (!tableBody) {
    console.log("Admin invoices table body not found"); 
    return;
  }
  tableBody.innerHTML = '<tr><td colspan="7">Loading invoices...</td></tr>';
  showLoader();

  try {
    const snapshot = await db.collection("invoices")
                            .orderBy("createdAt", "desc")
                            .limit(100) // Add limit for performance
                            .get();
    
    if (snapshot.empty) {
      tableBody.innerHTML = '<tr><td colspan="7">No invoices found.</td></tr>';
      hideLoader();
      return;
    }

    let rowsHtml = "";
    snapshot.forEach(doc => {
      const invoice = { id: doc.id, ...doc.data() };
      const invoiceNumber = invoice.invoiceNumber || doc.id.substring(0,8).toUpperCase();
      const customerName = invoice.customerName || invoice.customer || "N/A";
      const customerEmail = invoice.customerEmail || "N/A";
      const amount = invoice.amount || invoice.grandTotal || 0;
      const dueDate = invoice.dueDate ? (invoice.dueDate.toDate ? invoice.dueDate.toDate().toLocaleDateString() : new Date(invoice.dueDate).toLocaleDateString()) : 'N/A';
      const status = invoice.paid ? "Paid" : (invoice.status || "Unpaid");
      const statusClass = invoice.paid ? "paid" : "unpaid";

      rowsHtml += `
        <tr>
          <td>${invoiceNumber}</td>
          <td>${customerName}</td>
          <td>${customerEmail}</td>
          <td>$${amount.toFixed(2)}</td>
          <td>${dueDate}</td>
          <td><span class="status-badge status-${statusClass}">${status}</span></td>
          <td>
            <button class="btn-modern btn-small" onclick="viewInvoiceDetails('${invoice.id}')">View Details</button>
            <button class="btn-modern btn-small btn-secondary" onclick="generateAdminInvoicePDF('${invoice.id}')">📄 PDF</button>
            ${!invoice.paid ? `<button class="btn-modern btn-small btn-success" onclick="markInvoiceAsPaid('${invoice.id}')">Mark Paid</button>` : ''}
          </td>
        </tr>
      `;
    });
    tableBody.innerHTML = rowsHtml;

  } catch (error) {
    console.error("Error loading admin invoices table:", error);
    tableBody.innerHTML = '<tr><td colspan="7">Error loading invoices. See console.</td></tr>';
  } finally {
    hideLoader();
  }
}

function filterInvoicesTable() {
  const input = document.getElementById("invoiceSearch");
  const filter = input.value.toLowerCase();
  const tableBody = document.getElementById("adminInvoicesTableBody");
  const rows = tableBody.getElementsByTagName("tr");

  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].getElementsByTagName("td");
    let found = false;
    if (cells.length > 0) { // Ensure row has cells
        // Search in relevant cells (Invoice #, Customer, Email)
        const invoiceNumberText = cells[0]?.textContent || cells[0]?.innerText || "";
        const customerText = cells[1]?.textContent || cells[1]?.innerText || "";
        const emailText = cells[2]?.textContent || cells[2]?.innerText || "";
        if (invoiceNumberText.toLowerCase().includes(filter) || 
            customerText.toLowerCase().includes(filter) || 
            emailText.toLowerCase().includes(filter)) {
            found = true;
        }
    }
    rows[i].style.display = found ? "" : "none";
  }
}

async function viewInvoiceDetails(invoiceId) {
  try {
    const invoiceDoc = await db.collection("invoices").doc(invoiceId).get();
    if (!invoiceDoc.exists) {
      NotificationSystem.showNotification("Invoice not found.", "error");
      return;
    }
    const invoice = invoiceDoc.data();

    document.getElementById("genericAdminModalTitle").textContent = `Invoice Details: ${invoice.invoiceNumber || invoiceId.substring(0,8).toUpperCase()}`;
    const modalBody = document.getElementById("genericAdminModalBody");
    
    let itemsHtml = "";
    if (invoice.items && invoice.items.length > 0) {
      itemsHtml = `
        <h4>Items/Services:</h4>
        <table class="table" style="margin-top: 10px;">
          <thead><tr><th>Item</th><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${item.name || 'N/A'}</td>
                <td>${item.description || 'N/A'}</td>
                <td>${item.quantity || 1}</td>
                <td>$${(item.unitPrice || 0).toFixed(2)}</td>
                <td>$${(item.total || (item.quantity || 1) * (item.unitPrice || 0)).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (invoice.service || invoice.description) {
      itemsHtml = `
        <h4>Service:</h4>
        <p>${invoice.service || invoice.description}</p>
      `;
    }

    modalBody.innerHTML = `
      <p><strong>Customer:</strong> ${invoice.customerName || invoice.customer || 'N/A'}</p>
      <p><strong>Email:</strong> ${invoice.customerEmail || 'N/A'}</p>
      <p><strong>Amount:</strong> $${(invoice.amount || invoice.grandTotal || 0).toFixed(2)}</p>
      <p><strong>Due Date:</strong> ${invoice.dueDate ? (invoice.dueDate.toDate ? invoice.dueDate.toDate().toLocaleDateString() : new Date(invoice.dueDate).toLocaleDateString()) : 'N/A'}</p>
      <p><strong>Status:</strong> ${invoice.paid ? "✅ Paid" : "❌ Unpaid"}</p>
      <p><strong>Created:</strong> ${invoice.createdAt ? invoice.createdAt.toDate().toLocaleDateString() : 'N/A'}</p>
      ${itemsHtml}
      ${invoice.notes ? `<p><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
    `;

    const modalFooter = document.getElementById("genericAdminModalFooter");
    modalFooter.innerHTML = `
      <button class="btn-modern btn-secondary" onclick="generateAdminInvoicePDF('${invoiceId}')">📄 Download PDF</button>
      ${!invoice.paid ? `<button class="btn-modern btn-success" onclick="markInvoiceAsPaid('${invoiceId}'); closeGenericAdminModal();">Mark as Paid</button>` : ''}
      <button class="btn-modern btn-grey" onclick="closeGenericAdminModal()">Close</button>
    `;

    document.getElementById("genericAdminModal").style.display = "block";

  } catch (error) {
    console.error("Error viewing invoice details:", error);
    NotificationSystem.showNotification("Error loading invoice details: " + error.message, "error");
  }
}

async function markInvoiceAsPaid(invoiceId) {
  try {
    await db.collection("invoices").doc(invoiceId).update({ 
      paid: true, 
      paidDate: firebase.firestore.FieldValue.serverTimestamp() 
    });
    NotificationSystem.showNotification("Invoice marked as paid!", "success");
    loadAdminInvoicesTable(); // Refresh the table
    updateDashboardStats(); // Update stats
  } catch (error) {
    console.error("Error marking invoice as paid:", error);
    NotificationSystem.showNotification("Error updating invoice status: " + error.message, "error");
  }
}

// ----- New Professional PDF Generation for Admin -----
async function generateAdminQuotePDF(bidId) {
  showLoader();
  try {
    const bidDoc = await db.collection("bids").doc(bidId).get();
    if (!bidDoc.exists) {
      NotificationSystem.showNotification("Quote/Bid not found.", "error");
      hideLoader();
      return;
    }
    const quoteData = bidDoc.data();

    let customerData = {};
    if (quoteData.customerId) {
      const customerDoc = await db.collection("users").doc(quoteData.customerId).get(); // Assuming customer details are in 'users' collection by UID
      if (customerDoc.exists) {
        customerData = customerDoc.data();
      } else {
        const profileDoc = await db.collection("profiles").doc(quoteData.customerId).get(); // Fallback to profiles
        if (profileDoc.exists) customerData = profileDoc.data();
      }
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const companyName = "Holliday's Lawn & Garden";
    const companyAddress = "123 Green St, Meadowville, FL 12345";
    const companyContact = "contact@hollidaylawn.com | (555) 123-4567";
    // const logoPath = 'path/to/your/logo.png'; // Placeholder for your logo

    let yPos = 20;
    const lineSpacing = 7;
    const sectionSpacing = 10;
    const leftMargin = 15;
    const rightMargin = 195; 

    // --- Company Header ---
    // doc.addImage(logoPath, 'PNG', leftMargin, yPos - 5, 30, 10); // Example logo placement
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, leftMargin, yPos);
    yPos += lineSpacing;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(companyAddress, leftMargin, yPos);
    yPos += lineSpacing - 2;
    doc.text(companyContact, leftMargin, yPos);
    yPos += sectionSpacing;

    // --- Document Title & Info ---
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text("QUOTE", rightMargin, yPos - sectionSpacing + 2, { align: 'right' });
    yPos += lineSpacing;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Quote #: ${quoteData.bidNumber || bidId}`, rightMargin, yPos, { align: 'right' });
    yPos += lineSpacing - 2;
    const quoteDate = quoteData.createdAt && quoteData.createdAt.toDate ? quoteData.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString();
    doc.text(`Date: ${quoteDate}`, rightMargin, yPos, { align: 'right' });
    yPos += lineSpacing -2;
    if(quoteData.validUntil) {
        const validDate = quoteData.validUntil.toDate ? quoteData.validUntil.toDate().toLocaleDateString() : new Date(quoteData.validUntil).toLocaleDateString();
        doc.text(`Valid Until: ${validDate}`, rightMargin, yPos, { align: 'right' });
    }
    yPos += sectionSpacing;

    // --- Customer Information ---
    const billToX = leftMargin;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("Prepared for:", billToX, yPos);
    yPos += lineSpacing - 1;
    doc.setFont('helvetica', 'normal');
    doc.text(customerData.name || quoteData.customerName || "Valued Customer", billToX, yPos);
    yPos += lineSpacing - 2;
    if (customerData.email || quoteData.customerEmail) {
      doc.text(customerData.email || quoteData.customerEmail, billToX, yPos);
      yPos += lineSpacing - 2;
    }
    if (customerData.address) {
        doc.text(`${customerData.address.street || ''}`, billToX, yPos);
        yPos += lineSpacing - 2;
        doc.text(`${customerData.address.city || ''}, ${customerData.address.state || ''} ${customerData.address.zip || ''}`, billToX, yPos);
    } else if (quoteData.propertyAddress) {
        doc.text(quoteData.propertyAddress, billToX, yPos);
    }
    yPos += sectionSpacing + 5;

    // --- Services/Items Table ---
    doc.setFont('helvetica', 'bold');
    const tableHeaders = ["Item/Service", "Description", "Qty", "Unit Price", "Total"];
    const colWidths = [50, 70, 15, 25, 25]; // Total 185, fits within margins
    let currentX = leftMargin;

    doc.setFillColor(230, 230, 230);
    doc.rect(leftMargin, yPos, rightMargin - leftMargin, lineSpacing + 1, 'F');
    tableHeaders.forEach((header, i) => {
      doc.text(header, currentX + 1, yPos + lineSpacing - 1);
      currentX += colWidths[i];
    });
    yPos += lineSpacing + 1;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const services = quoteData.services || [];
    if (services.length === 0 && quoteData.serviceType) { // Handle single service from older structure
        services.push({ 
            name: quoteData.serviceType, 
            description: quoteData.description || 'N/A', 
            quantity: 1, 
            unitPrice: quoteData.estimatedTotal || 0,
            total: quoteData.estimatedTotal || 0
        });
    }

    services.forEach(item => {
      if (yPos > 260) { // Page break check
        doc.addPage();
        yPos = 20;
        // Redraw headers if needed, though for a single quote, it might not span pages often
      }
      currentX = leftMargin;
      const nameLines = doc.splitTextToSize(item.name || 'N/A', colWidths[0] - 2);
      const descLines = doc.splitTextToSize(item.description || 'N/A', colWidths[1] - 2);
      const maxLines = Math.max(nameLines.length, descLines.length);
      const rowHeight = (lineSpacing - 2) * maxLines + 2;

      doc.text(nameLines, currentX + 1, yPos + lineSpacing - 3);
      currentX += colWidths[0];
      doc.text(descLines, currentX + 1, yPos + lineSpacing - 3);
      currentX += colWidths[1];
      doc.text((item.quantity || 1).toString(), currentX + (colWidths[2]/2), yPos + lineSpacing - 3, {align: 'center'});
      currentX += colWidths[2];
      doc.text((item.unitPrice || 0).toFixed(2), currentX + colWidths[3] -2 , yPos + lineSpacing - 3, {align: 'right'});
      currentX += colWidths[3];
      doc.text((item.total || (item.quantity || 1) * (item.unitPrice || 0)).toFixed(2), currentX + colWidths[4] - 2, yPos + lineSpacing - 3, {align: 'right'});
      
      yPos += rowHeight;
      doc.setDrawColor(200, 200, 200);
      doc.line(leftMargin, yPos, rightMargin, yPos); // Line after each item
      yPos += 1; // Small space after line
    });

    // --- Totals Section ---
    yPos += sectionSpacing -5;
    const totalsX = rightMargin - colWidths[3] - colWidths[4]; 
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("Subtotal:", totalsX - 10, yPos, {align: 'right'});
    doc.setFont('helvetica', 'normal');
    doc.text(`$${(quoteData.subtotal || quoteData.estimatedTotal || 0).toFixed(2)}`, rightMargin -2, yPos, {align: 'right'});
    yPos += lineSpacing;

    // Example for Discount and Tax - adapt if your data model supports this
    if (typeof quoteData.discountAmount === 'number' && quoteData.discountAmount > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text("Discount:", totalsX - 10, yPos, {align: 'right'});
        doc.setFont('helvetica', 'normal');
        doc.text(`-$${quoteData.discountAmount.toFixed(2)}`, rightMargin -2, yPos, {align: 'right'});
        yPos += lineSpacing;
    }
    if (typeof quoteData.taxAmount === 'number' && quoteData.taxAmount > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text("Tax:", totalsX - 10, yPos, {align: 'right'});
        doc.setFont('helvetica', 'normal');
        doc.text(`$${quoteData.taxAmount.toFixed(2)}`, rightMargin -2, yPos, {align: 'right'});
        yPos += lineSpacing;
    }

    doc.setDrawColor(0,0,0);
    doc.line(totalsX -15, yPos, rightMargin, yPos); // Line above Grand Total
    yPos += 2;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("TOTAL:", totalsX - 10, yPos + lineSpacing -2 , {align: 'right'});
    doc.text(`$${(quoteData.grandTotal || quoteData.estimatedTotal || 0).toFixed(2)}`, rightMargin -2, yPos + lineSpacing -2, {align: 'right'});
    yPos += lineSpacing + sectionSpacing;

    // --- Notes / Terms ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (quoteData.notes) {
      doc.setFont('helvetica', 'bold');
      doc.text("Notes:", leftMargin, yPos);
      yPos += lineSpacing -3;
      doc.setFont('helvetica', 'normal');
      const notesLines = doc.splitTextToSize(quoteData.notes, rightMargin - leftMargin);
      doc.text(notesLines, leftMargin, yPos);
      yPos += (lineSpacing - 3) * notesLines.length + (sectionSpacing / 2);
    }
    
    doc.text("Quote prepared by Holliday's Lawn & Garden. All prices are estimates and subject to change based on final assessment.",
             doc.internal.pageSize.getWidth() / 2, 280, { align: 'center' });

    doc.save(`Quote_${quoteData.bidNumber || bidId}.pdf`);

  } catch (error) {
    console.error("Error generating admin quote PDF:", error);
    NotificationSystem.showNotification("Failed to generate quote PDF. " + error.message, "error");
  } finally {
    hideLoader();
  }
}

// Placeholder for generateAdminInvoicePDF - will be similar structure
async function generateAdminInvoicePDF(invoiceId) {
  showLoader();
  try {
    const invoiceDoc = await db.collection("invoices").doc(invoiceId).get();
    if (!invoiceDoc.exists) {
      NotificationSystem.showNotification("Invoice not found.", "error");
      hideLoader();
      return;
    }
    const invoiceData = invoiceDoc.data();

    let customerData = {};
    if (invoiceData.customerId) { 
      const userDoc = await db.collection("users").doc(invoiceData.customerId).get();
      if (userDoc.exists) customerData = userDoc.data();
      else {
        const profileDoc = await db.collection("profiles").doc(invoiceData.customerId).get();
        if (profileDoc.exists) customerData = profileDoc.data();
      }
    } else if (invoiceData.customerEmail) { 
        const usersQuery = await db.collection("users").where("email", "==", invoiceData.customerEmail).limit(1).get();
        if (!usersQuery.empty) customerData = usersQuery.docs[0].data();
        else {
            const profilesQuery = await db.collection("profiles").where("email", "==", invoiceData.customerEmail).limit(1).get();
            if(!profilesQuery.empty) customerData = profilesQuery.docs[0].data();
        }
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const companyName = "Holliday's Lawn & Garden";
    const companyAddress = "123 Green St, Meadowville, FL 12345";
    const companyContact = "contact@hollidaylawn.com | (555) 123-4567";
    // const logoPath = 'path/to/your/logo.png'; 

    let yPos = 20;
    const lineSpacing = 7;
    const sectionSpacing = 10;
    const leftMargin = 15;
    const rightMargin = 195;

    // --- Company Header ---
    // doc.addImage(logoPath, 'PNG', leftMargin, yPos - 5, 30, 10);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, leftMargin, yPos);
    yPos += lineSpacing;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(companyAddress, leftMargin, yPos);
    yPos += lineSpacing - 2;
    doc.text(companyContact, leftMargin, yPos);
    yPos += sectionSpacing;

    // --- Document Title & Info ---
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text("INVOICE", rightMargin, yPos - sectionSpacing + 2, { align: 'right' });
    yPos += lineSpacing;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${invoiceData.invoiceNumber || invoiceId}`, rightMargin, yPos, { align: 'right' });
    yPos += lineSpacing - 2;
    const issueDate = invoiceData.createdAt && invoiceData.createdAt.toDate ? invoiceData.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString();
    doc.text(`Date Issued: ${issueDate}`, rightMargin, yPos, { align: 'right' });
    yPos += lineSpacing - 2;
    if (invoiceData.dueDate) {
        const dueDateStr = invoiceData.dueDate.toDate ? invoiceData.dueDate.toDate().toLocaleDateString() : new Date(invoiceData.dueDate).toLocaleDateString();
        doc.text(`Due Date: ${dueDateStr}`, rightMargin, yPos, { align: 'right' });
    }
    yPos += sectionSpacing;

    // --- Customer Information ---
    const billToX = leftMargin;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("Bill To:", billToX, yPos);
    yPos += lineSpacing - 1;
    doc.setFont('helvetica', 'normal');
    doc.text(customerData.name || invoiceData.customerName || "Valued Customer", billToX, yPos);
    yPos += lineSpacing - 2;
    if (customerData.email || invoiceData.customerEmail) {
      doc.text(customerData.email || invoiceData.customerEmail, billToX, yPos);
      yPos += lineSpacing - 2;
    }
    if (customerData.address) {
        doc.text(`${customerData.address.street || ''}`, billToX, yPos);
        yPos += lineSpacing - 2;
        doc.text(`${customerData.address.city || ''}, ${customerData.address.state || ''} ${customerData.address.zip || ''}`, billToX, yPos);
    } 
    yPos += sectionSpacing + 5;

    // --- Services/Items Table ---
    doc.setFont('helvetica', 'bold');
    const tableHeaders = ["Item/Service", "Description", "Qty", "Unit Price", "Total"];
    const colWidths = [50, 70, 15, 25, 25];
    let currentX = leftMargin;

    doc.setFillColor(230, 230, 230);
    doc.rect(leftMargin, yPos, rightMargin - leftMargin, lineSpacing + 1, 'F');
    tableHeaders.forEach((header, i) => {
      doc.text(header, currentX + 1, yPos + lineSpacing - 1);
      currentX += colWidths[i];
    });
    yPos += lineSpacing + 1;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const items = invoiceData.items || []; 
    if (items.length === 0 && invoiceData.serviceType) { 
        items.push({
            name: invoiceData.serviceType,
            description: invoiceData.description || 'N/A',
            quantity: 1,
            unitPrice: invoiceData.amount || 0,
            total: invoiceData.amount || 0
        });
    }
     if (items.length === 0 && !invoiceData.serviceType && invoiceData.description) { 
        items.push({
            name: invoiceData.description, 
            description: 'See details',
            quantity: 1,
            unitPrice: invoiceData.amount || 0,
            total: invoiceData.amount || 0
        });
    }

    items.forEach(item => {
      if (yPos > 260) { doc.addPage(); yPos = 20; 
        doc.setFillColor(230, 230, 230);
        doc.rect(leftMargin, yPos, rightMargin - leftMargin, lineSpacing + 1, 'F');
        let headerX = leftMargin;
        tableHeaders.forEach((header, i) => {
            doc.text(header, headerX + 1, yPos + lineSpacing - 1);
            headerX += colWidths[i];
        });
        yPos += lineSpacing + 1;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
      }
      currentX = leftMargin;
      const nameLines = doc.splitTextToSize(item.name || 'Service', colWidths[0] - 2);
      const descLines = doc.splitTextToSize(item.description || '-', colWidths[1] - 2);
      const maxLines = Math.max(nameLines.length, descLines.length);
      const rowHeight = (lineSpacing - 2) * maxLines + 2;

      doc.text(nameLines, currentX + 1, yPos + lineSpacing - 3);
      currentX += colWidths[0];
      doc.text(descLines, currentX + 1, yPos + lineSpacing - 3);
      currentX += colWidths[1];
      doc.text((item.quantity || 1).toString(), currentX + (colWidths[2]/2), yPos + lineSpacing - 3, {align: 'center'});
      currentX += colWidths[2];
      doc.text((item.unitPrice || 0).toFixed(2), currentX + colWidths[3] - 2, yPos + lineSpacing - 3, {align: 'right'});
      currentX += colWidths[3];
      doc.text((item.total || (item.quantity || 1) * (item.unitPrice || 0)).toFixed(2), currentX + colWidths[4] - 2, yPos + lineSpacing - 3, {align: 'right'});
      
      yPos += rowHeight;
      doc.setDrawColor(200, 200, 200);
      doc.line(leftMargin, yPos, rightMargin, yPos);
      yPos += 1;
    });

    // --- Totals Section ---
    yPos += sectionSpacing -5;
    const totalsX = rightMargin - colWidths[3] - colWidths[4];
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("Subtotal:", totalsX - 10, yPos, {align: 'right'});
    doc.setFont('helvetica', 'normal');
    doc.text(`$${(invoiceData.subtotal || invoiceData.amount || 0).toFixed(2)}`, rightMargin - 2, yPos, {align: 'right'});
    yPos += lineSpacing;

    if (typeof invoiceData.discountAmount === 'number' && invoiceData.discountAmount > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text("Discount:", totalsX - 10, yPos, {align: 'right'});
        doc.setFont('helvetica', 'normal');
        doc.text(`-$${invoiceData.discountAmount.toFixed(2)}`, rightMargin -2, yPos, {align: 'right'});
        yPos += lineSpacing;
    }
    if (typeof invoiceData.taxAmount === 'number' && invoiceData.taxAmount > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text("Tax:", totalsX - 10, yPos, {align: 'right'});
        doc.setFont('helvetica', 'normal');
        doc.text(`$${invoiceData.taxAmount.toFixed(2)}`, rightMargin -2, yPos, {align: 'right'});
        yPos += lineSpacing;
    }

    doc.setDrawColor(0,0,0);
    doc.line(totalsX -15, yPos, rightMargin, yPos);
    yPos += 2;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("TOTAL DUE:", totalsX - 10, yPos + lineSpacing -2 , {align: 'right'});
    doc.text(`$${(invoiceData.grandTotal || invoiceData.amount || 0).toFixed(2)}`, rightMargin - 2, yPos + lineSpacing -2, {align: 'right'});
    yPos += lineSpacing;

    if(invoiceData.paid) {
        doc.setFontSize(14);
        doc.setTextColor(0, 100, 0); // Dark Green
        doc.text("PAID", totalsX - 10, yPos + lineSpacing, {align: 'right'});
        doc.setTextColor(0,0,0); // Reset color
    }
    yPos += sectionSpacing + lineSpacing;

    // --- Payment Terms / Notes ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (invoiceData.paymentTerms) {
      doc.setFont('helvetica', 'bold');
      doc.text("Payment Terms:", leftMargin, yPos);
      yPos += lineSpacing -3;
      doc.setFont('helvetica', 'normal');
      const termsLines = doc.splitTextToSize(invoiceData.paymentTerms, rightMargin - leftMargin);
      doc.text(termsLines, leftMargin, yPos);
      yPos += (lineSpacing - 3) * termsLines.length + (sectionSpacing / 2);
    }
    if (invoiceData.notes) {
      doc.setFont('helvetica', 'bold');
      doc.text("Notes:", leftMargin, yPos);
      yPos += lineSpacing -3;
      doc.setFont('helvetica', 'normal');
      const notesLines = doc.splitTextToSize(invoiceData.notes, rightMargin - leftMargin);
      doc.text(notesLines, leftMargin, yPos);
    }

    doc.text("Thank you for your business! Please make payments to Holliday's Lawn & Garden.",
             doc.internal.pageSize.getWidth() / 2, 280, { align: 'center' });

    doc.save(`Invoice_${invoiceData.invoiceNumber || invoiceId}.pdf`);

  } catch (error) {
    console.error("Error generating admin invoice PDF:", error);
    NotificationSystem.showNotification("Failed to generate invoice PDF. " + error.message, "error");
  } finally {
    hideLoader();
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

    loadIncomingServiceRequests(); // Add this line
    loadAdminInvoicesTable(); // Load invoices table
    
    console.log("Admin Dashboard Fully Initialized.");
}

window.onload = initializeAdminDashboard;
