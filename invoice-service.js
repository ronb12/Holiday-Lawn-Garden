// Invoice Service Class
class InvoiceService {
  constructor() {
    this.db = window.HollidayApp.db;
    this.INVOICE_PREFIX = 'INV';
    this.TAX_RATE = 0.07; // 7% tax rate
  }

  // Generate unique invoice number
  async generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const counterRef = this.db.collection('counters').doc('invoices');
    
    try {
      const result = await this.db.runTransaction(async (transaction) => {
        const doc = await transaction.get(counterRef);
        const newCounter = (doc.exists ? doc.data().value : 0) + 1;
        transaction.set(counterRef, { value: newCounter });
        return newCounter.toString().padStart(5, '0');
      });
      
      return `${this.INVOICE_PREFIX}-${year}-${result}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      throw error;
    }
  }

  // Calculate invoice totals
  calculateTotals(items) {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const tax = subtotal * this.TAX_RATE;
    const total = subtotal + tax;
    
    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  }

  // Create new invoice
  async createInvoice(data) {
    try {
      const invoiceNumber = await this.generateInvoiceNumber();
      const totals = this.calculateTotals(data.items);
      
      const invoiceData = {
        invoiceNumber,
        customerId: data.customerId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        items: data.items,
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        dueDate: data.dueDate,
        notes: data.notes || '',
        terms: data.terms || 'Net 30',
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await this.db.collection('invoices').add(invoiceData);
      
      // Create invoice history entry
      await this.createHistoryEntry(docRef.id, 'created', 'Invoice created');
      
      return { id: docRef.id, ...invoiceData };
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  // Update invoice
  async updateInvoice(invoiceId, data) {
    try {
      const updateData = {
        ...data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (data.items) {
        const totals = this.calculateTotals(data.items);
        updateData.subtotal = totals.subtotal;
        updateData.tax = totals.tax;
        updateData.total = totals.total;
      }

      await this.db.collection('invoices').doc(invoiceId).update(updateData);
      
      // Create history entry
      await this.createHistoryEntry(invoiceId, 'updated', 'Invoice updated');
      
      return true;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  // Record payment
  async recordPayment(invoiceId, paymentData) {
    try {
      const invoice = await this.db.collection('invoices').doc(invoiceId).get();
      if (!invoice.exists) throw new Error('Invoice not found');
      
      const invoiceData = invoice.data();
      const remainingBalance = invoiceData.total - (invoiceData.paidAmount || 0);
      
      if (paymentData.amount > remainingBalance) {
        throw new Error('Payment amount exceeds remaining balance');
      }

      const batch = this.db.batch();
      
      // Update invoice
      const newPaidAmount = (invoiceData.paidAmount || 0) + paymentData.amount;
      const isFullyPaid = newPaidAmount >= invoiceData.total;
      
      const updateData = {
        paidAmount: newPaidAmount,
        status: isFullyPaid ? 'paid' : 'partial',
        lastPaymentDate: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        remainingBalance: invoiceData.total - newPaidAmount,
        paymentHistory: firebase.firestore.FieldValue.arrayUnion({
          amount: paymentData.amount,
          date: firebase.firestore.FieldValue.serverTimestamp(),
          method: paymentData.method,
          transactionId: paymentData.transactionId
        })
      };

      // If this is part of a payment plan
      if (paymentData.isPaymentPlan) {
        updateData.paymentPlan = {
          isActive: true,
          totalAmount: invoiceData.total,
          installmentAmount: paymentData.installmentAmount,
          frequency: paymentData.frequency, // weekly, biweekly, monthly
          nextDueDate: paymentData.nextDueDate,
          remainingInstallments: Math.ceil((invoiceData.total - newPaidAmount) / paymentData.installmentAmount)
        };
      }

      batch.update(invoice.ref, updateData);

      // Create payment record
      const paymentRef = this.db.collection('payments').doc();
      batch.set(paymentRef, {
        invoiceId,
        amount: paymentData.amount,
        method: paymentData.method,
        transactionId: paymentData.transactionId,
        date: firebase.firestore.FieldValue.serverTimestamp(),
        notes: paymentData.notes || '',
        isPartialPayment: !isFullyPaid,
        remainingBalance: invoiceData.total - newPaidAmount,
        isPaymentPlan: paymentData.isPaymentPlan || false,
        paymentPlanDetails: paymentData.isPaymentPlan ? {
          installmentNumber: paymentData.installmentNumber,
          totalInstallments: paymentData.totalInstallments,
          frequency: paymentData.frequency
        } : null
      });

      // Create history entry
      const historyRef = this.db.collection('invoices').doc(invoiceId)
        .collection('history').doc();
      batch.set(historyRef, {
        type: 'payment',
        description: `Payment received: $${paymentData.amount}${isFullyPaid ? ' (Fully Paid)' : ` (${paymentData.isPaymentPlan ? 'Payment Plan - ' : ''}Remaining: $${(invoiceData.total - newPaidAmount).toFixed(2)})`}`,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        paymentDetails: {
          amount: paymentData.amount,
          method: paymentData.method,
          isPartialPayment: !isFullyPaid,
          isPaymentPlan: paymentData.isPaymentPlan || false
        }
      });

      await batch.commit();

      // If payment plan, schedule next payment reminder
      if (paymentData.isPaymentPlan) {
        await this.scheduleNextPaymentReminder(invoiceId, paymentData.nextDueDate);
      }

      return {
        success: true,
        isFullyPaid,
        remainingBalance: invoiceData.total - newPaidAmount,
        paymentId: paymentRef.id
      };
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  }

  // Schedule next payment reminder
  async scheduleNextPaymentReminder(invoiceId, nextDueDate) {
    try {
      await this.db.collection('paymentReminders').add({
        invoiceId,
        dueDate: nextDueDate,
        status: 'scheduled',
        type: 'payment_plan_reminder',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error scheduling payment reminder:', error);
      // Don't throw error as this is a non-critical operation
    }
  }

  // Create invoice history entry
  async createHistoryEntry(invoiceId, type, description) {
    try {
      await this.db.collection('invoices').doc(invoiceId)
        .collection('history').add({
          type,
          description,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
      console.error('Error creating history entry:', error);
      // Don't throw error as this is a non-critical operation
    }
  }

  // Get invoice with history
  async getInvoiceWithHistory(invoiceId) {
    try {
      const invoice = await this.db.collection('invoices').doc(invoiceId).get();
      if (!invoice.exists) throw new Error('Invoice not found');

      const history = await this.db.collection('invoices').doc(invoiceId)
        .collection('history')
        .orderBy('timestamp', 'desc')
        .get();

      const historyItems = [];
      history.forEach(doc => historyItems.push(doc.data()));

      return {
        id: invoice.id,
        ...invoice.data(),
        history: historyItems
      };
    } catch (error) {
      console.error('Error getting invoice with history:', error);
      throw error;
    }
  }

  // Create recurring invoice
  async createRecurringInvoice(data) {
    try {
      const recurringData = {
        customerId: data.customerId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        items: data.items,
        frequency: data.frequency, // weekly, monthly, quarterly, yearly
        nextGenerationDate: data.startDate,
        isActive: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await this.db.collection('recurring_invoices').add(recurringData);
      return true;
    } catch (error) {
      console.error('Error creating recurring invoice:', error);
      throw error;
    }
  }

  // Send invoice reminder
  async sendReminder(invoiceId) {
    try {
      const invoice = await this.db.collection('invoices').doc(invoiceId).get();
      if (!invoice.exists) throw new Error('Invoice not found');

      const reminderData = {
        to: invoice.data().customerEmail,
        invoiceId,
        invoiceNumber: invoice.data().invoiceNumber,
        amount: invoice.data().total,
        dueDate: invoice.data().dueDate,
        type: 'invoice_reminder',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      };

      await this.db.collection('mail').add(reminderData);
      await this.createHistoryEntry(invoiceId, 'reminder', 'Payment reminder sent');
      
      return true;
    } catch (error) {
      console.error('Error sending reminder:', error);
      throw error;
    }
  }

  // Get overdue invoices
  async getOverdueInvoices() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const snapshot = await this.db.collection('invoices')
        .where('status', 'in', ['pending', 'partial'])
        .where('dueDate', '<', today)
        .orderBy('dueDate', 'asc')
        .get();

      const overdueInvoices = [];
      snapshot.forEach(doc => {
        overdueInvoices.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return overdueInvoices;
    } catch (error) {
      console.error('Error getting overdue invoices:', error);
      throw error;
    }
  }
} 