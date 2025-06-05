// Payment Handler Class
class PaymentHandler {
  constructor() {
    // PayPal Client ID: This should be your actual PayPal Client ID.
    // For production, ensure this is your live client ID. For testing, you can use a sandbox ID.
    // If using a build process, consider loading this from an environment variable.
    this.paypalClientId = "YOUR_PAYPAL_CLIENT_ID"; // Replace with your actual PayPal Client ID

    // Stripe Public Key: This is intended to be public.
    // Ensure this is your actual Stripe Public Key (e.g., pk_live_... or pk_test_...).
    this.stripePublicKey = "YOUR_STRIPE_PUBLIC_KEY"; // Replace with your actual Stripe Public Key

    // IMPORTANT for Stripe: The Stripe Secret Key MUST be kept on a backend server.
    // This class assumes a backend endpoint (e.g., /api/create-stripe-session) handles operations requiring the Secret Key.
  }

  // Initialize payment providers
  async initializePaymentProviders() {
    try {
      // PayPal initialization
      await this.initializePayPal();
      
      // Stripe initialization
      await this.initializeStripe();
      
      return true;
    } catch (error) {
      console.error('Payment provider initialization failed:', error);
      NotificationSystem.showNotification('Payment system initialization failed', 'error');
      return false;
    }
  }

  // Initialize PayPal
  async initializePayPal() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${this.paypalClientId}&currency=USD`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('PayPal SDK failed to load'));
      document.body.appendChild(script);
    });
  }

  // Initialize Stripe
  async initializeStripe() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => {
        this.stripe = Stripe(this.stripePublicKey);
        resolve();
      };
      script.onerror = () => reject(new Error('Stripe SDK failed to load'));
      document.body.appendChild(script);
    });
  }

  // Process PayPal payment
  async processPayPalPayment(amount, invoiceId) {
    try {
      NotificationSystem.showNotification('Processing payment...', 'info');
      
      const paypalButtons = await paypal.Buttons({
        createOrder: (data, actions) => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: amount.toFixed(2),
                currency_code: 'USD'
              },
              custom_id: invoiceId,
              description: `Invoice #${invoiceId} - Holliday's Lawn & Garden`
            }]
          });
        },
        onApprove: async (data, actions) => {
          try {
            NotificationSystem.showNotification('Finalizing payment...', 'info');
            const order = await actions.order.capture();
            
            // Update invoice and create payment record
            await this.handleSuccessfulPayment(invoiceId, 'paypal', order.id);
            
            // Generate and send receipt
            const receiptData = await this.generateReceipt(order.id);
            await this.emailReceipt(receiptData);
            
            NotificationSystem.showNotification('Payment successful! Receipt sent to your email.', 'success');
            return order;
          } catch (error) {
            console.error('PayPal payment processing error:', error);
            NotificationSystem.showNotification('Payment processed but there was an error updating records. Please contact support.', 'error');
            throw error;
          }
        },
        onError: (err) => {
          console.error('PayPal payment error:', err);
          NotificationSystem.showNotification('Payment failed. Please try again or use a different payment method.', 'error');
          throw err;
        },
        onCancel: () => {
          NotificationSystem.showNotification('Payment cancelled. Please try again when ready.', 'info');
        }
      });

      return paypalButtons;
    } catch (error) {
      console.error('PayPal payment processing error:', error);
      NotificationSystem.showNotification('Unable to process payment. Please try again later.', 'error');
      throw error;
    }
  }

  // Process Stripe payment
  async processStripePayment(amount, invoiceId) {
    try {
      const session = await this.createStripeSession(amount, invoiceId);
      const result = await this.stripe.redirectToCheckout({
        sessionId: session.id
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return session;
    } catch (error) {
      console.error('Stripe payment processing error:', error);
      throw new Error('Stripe payment processing failed');
    }
  }

  // Create Stripe session
  async createStripeSession(amount, invoiceId) {
    try {
      // This function calls your backend. Your backend securely uses your Stripe SECRET Key.
      const response = await fetch('/api/create-stripe-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Stripe uses cents
          invoiceId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create Stripe session');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating Stripe session:', error);
      throw error;
    }
  }

  // Handle successful payment
  async handleSuccessfulPayment(invoiceId, provider, transactionId) {
    try {
      // Update invoice status
      await db.collection('invoices').doc(invoiceId).update({
        paid: true,
        paymentDate: new Date(),
        paymentProvider: provider,
        transactionId: transactionId
      });

      // Create payment record
      await db.collection('payments').add({
        invoiceId,
        provider,
        transactionId,
        timestamp: new Date(),
        status: 'completed'
      });

      // Send confirmation notification
      const invoice = await db.collection('invoices').doc(invoiceId).get();
      const invoiceData = invoice.data();

      await NotificationSystem.sendNotification(
        invoiceData.customerId,
        'payment',
        `Payment received for invoice #${invoiceData.invoiceNumber}`
      );

      NotificationSystem.showNotification('Payment processed successfully!', 'success');
    } catch (error) {
      console.error('Error handling successful payment:', error);
      NotificationSystem.showNotification('Error updating payment records', 'error');
    }
  }

  // Handle failed payment
  async handleFailedPayment(invoiceId, provider, error) {
    try {
      // Log payment failure
      await db.collection('paymentFailures').add({
        invoiceId,
        provider,
        error: error.message,
        timestamp: new Date()
      });

      // Update invoice status
      await db.collection('invoices').doc(invoiceId).update({
        lastPaymentAttempt: new Date(),
        lastPaymentError: error.message
      });

      // Send notification
      const invoice = await db.collection('invoices').doc(invoiceId).get();
      const invoiceData = invoice.data();

      await NotificationSystem.sendNotification(
        invoiceData.customerId,
        'payment_failed',
        `Payment failed for invoice #${invoiceData.invoiceNumber}. Please try again.`
      );
    } catch (error) {
      console.error('Error handling failed payment:', error);
    }
  }

  // Generate payment receipt
  async generateReceipt(paymentId) {
    try {
      const payment = await db.collection('payments').doc(paymentId).get();
      const paymentData = payment.data();
      
      const invoice = await db.collection('invoices').doc(paymentData.invoiceId).get();
      const invoiceData = invoice.data();

      const receiptData = {
        receiptNumber: `RCP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        date: new Date(),
        invoiceNumber: invoiceData.invoiceNumber,
        amount: invoiceData.amount,
        paymentMethod: paymentData.provider,
        transactionId: paymentData.transactionId,
        customer: {
          name: invoiceData.customerName,
          email: invoiceData.customerEmail
        }
      };

      await db.collection('receipts').add(receiptData);

      // Send receipt email
      await this.emailReceipt(receiptData);

      return receiptData;
    } catch (error) {
      console.error('Error generating receipt:', error);
      throw new Error('Failed to generate receipt');
    }
  }

  // Email receipt
  async emailReceipt(receiptData) {
    try {
      await db.collection('mail').add({
        to: receiptData.customer.email,
        template: {
          name: 'payment-receipt',
          data: receiptData
        }
      });
    } catch (error) {
      console.error('Error sending receipt email:', error);
      NotificationSystem.showNotification('Error sending receipt email', 'error');
    }
  }
}

// Export payment handler
window.PaymentHandler = PaymentHandler; 