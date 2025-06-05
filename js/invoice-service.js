// Invoice Service for invoice management
class InvoiceService {
  constructor() {
    this.db = window.HollidayApp.db;
  }

  async createInvoice(invoiceData) {
    try {
      const { customerId, customerName, customerEmail, items, terms, dueDate } = invoiceData;

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
      const taxRate = 0.07; // 7% tax rate
      const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
      const total = subtotal + taxAmount;

      // Create invoice object
      const invoice = {
        customerId,
        customerName,
        customerEmail,
        items,
        subtotal,
        taxRate,
        taxAmount,
        total,
        terms,
        dueDate,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}${Math.random().toString(36).slice(-2).toUpperCase()}`
      };

      // Save to database
      const docRef = await this.db.collection('invoices').add(invoice);
      return { id: docRef.id, ...invoice };
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  async recordPayment(invoiceId, paymentData) {
    try {
      const { amount, method, transactionId } = paymentData;

      const payment = {
        amount,
        method,
        transactionId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      };

      // Update invoice with payment
      await this.db.collection('invoices').doc(invoiceId).update({
        status: 'paid',
        paymentDetails: payment,
        paidAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  }

  async getInvoice(invoiceId) {
    try {
      const doc = await this.db.collection('invoices').doc(invoiceId).get();
      if (!doc.exists) throw new Error('Invoice not found');
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error getting invoice:', error);
      throw error;
    }
  }

  async listInvoices(customerId = null, status = null) {
    try {
      let query = this.db.collection('invoices');
      
      if (customerId) {
        query = query.where('customerId', '==', customerId);
      }
      if (status) {
        query = query.where('status', '==', status);
      }

      const snapshot = await query.orderBy('createdAt', 'desc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error listing invoices:', error);
      throw error;
    }
  }
}

// Make InvoiceService available globally
window.InvoiceService = InvoiceService; 