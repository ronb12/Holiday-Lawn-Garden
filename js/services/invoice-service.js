class InvoiceService {
  constructor() {
    if (!window.HollidayApp?.db) {
      throw new Error('Firebase must be initialized before creating InvoiceService');
    }
    this.db = window.HollidayApp.db;
  }

  // Calculate invoice total
  calculateTotal(items) {
    return items.reduce((total, item) => {
      return total + (item.quantity * item.rate);
    }, 0);
  }

  // Generate invoice number
  async generateInvoiceNumber() {
    const counterRef = this.db.collection('counters').doc('invoices');
    
    try {
      const result = await this.db.runTransaction(async (transaction) => {
        const doc = await transaction.get(counterRef);
        const newNumber = (doc.exists ? doc.data().current : 0) + 1;
        transaction.set(counterRef, { current: newNumber });
        return `INV-${String(newNumber).padStart(6, '0')}`;
      });
      
      return result;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      throw new Error('Failed to generate invoice number');
    }
  }

  // Create a new invoice
  async createInvoice(invoiceData) {
    try {
      const total = this.calculateTotal(invoiceData.items);
      const invoiceNumber = await this.generateInvoiceNumber();
      
      const invoice = {
        invoiceNumber,
        customerId: invoiceData.customerId,
        customerName: invoiceData.customerName,
        customerEmail: invoiceData.customerEmail,
        items: invoiceData.items,
        total,
        status: 'pending',
        terms: invoiceData.terms,
        dueDate: invoiceData.dueDate,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await this.db.collection('invoices').add(invoice);
      return { id: docRef.id, ...invoice };
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw new Error('Failed to create invoice');
    }
  }

  // Record payment for an invoice
  async recordPayment(invoiceId, paymentData) {
    try {
      const invoiceRef = this.db.collection('invoices').doc(invoiceId);
      const paymentRef = this.db.collection('payments').doc();
      
      await this.db.runTransaction(async (transaction) => {
        const invoiceDoc = await transaction.get(invoiceRef);
        if (!invoiceDoc.exists) {
          throw new Error('Invoice not found');
        }

        const payment = {
          invoiceId,
          amount: paymentData.amount,
          method: paymentData.method,
          transactionId: paymentData.transactionId,
          timestamp: new Date()
        };

        transaction.set(paymentRef, payment);
        transaction.update(invoiceRef, {
          status: 'paid',
          updatedAt: new Date(),
          lastPayment: payment
        });
      });

      return true;
    } catch (error) {
      console.error('Error recording payment:', error);
      throw new Error('Failed to record payment');
    }
  }
}

// Make InvoiceService available globally
window.InvoiceService = InvoiceService; 