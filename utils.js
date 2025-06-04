// Service Rates and Calculations
const serviceRates = {
  'Mowing & Trimming': 45,
  'Landscape Design': 75,
  'Leaf Removal': 55,
  'Fertilization & Seeding': 65,
  'Seasonal Cleanup': 60,
  'Mulching & Edging': 50,
  'Commercial Lawn Care': 85,
  'Pressure Washing': 70
};

// Package Definitions
const servicePackages = {
  basic: {
    name: 'Basic Care',
    services: ['Mowing & Trimming', 'Leaf Removal'],
    frequency: 'bi-weekly',
    discount: 0.1, // 10% off
    basePrice: 89.99
  },
  premium: {
    name: 'Premium Care',
    services: ['Mowing & Trimming', 'Fertilization & Seeding', 'Seasonal Cleanup'],
    frequency: 'weekly',
    discount: 0.15, // 15% off
    basePrice: 159.99
  },
  commercial: {
    name: 'Commercial',
    services: ['Commercial Lawn Care', 'Landscape Design', 'Seasonal Cleanup'],
    frequency: 'weekly',
    discount: 0.2, // 20% off
    basePrice: 299.99
  }
};

// Enhanced Quote Calculator
class QuoteCalculator {
  static calculateBaseRate(service, propertySize) {
    const baseRate = serviceRates[service] || 50;
    const sizeFactor = this.calculateSizeFactor(propertySize);
    return baseRate * sizeFactor;
  }

  static calculateSizeFactor(propertySize) {
    if (propertySize < 1000) return 1;
    if (propertySize < 5000) return 1.5;
    if (propertySize < 10000) return 2;
    return 2.5;
  }

  static getSeasonalAdjustment() {
    const month = new Date().getMonth();
    // Peak season (spring/summer) adjustment
    if (month >= 3 && month <= 8) return 1.2;
    // Fall adjustment
    if (month >= 9 && month <= 10) return 1.1;
    // Winter adjustment
    return 0.9;
  }

  static calculateQuote(service, propertySize, options = {}) {
    const baseRate = this.calculateBaseRate(service, propertySize);
    const seasonalFactor = this.getSeasonalAdjustment();
    const complexityFactor = options.complexity || 1;
    const urgencyFactor = options.urgent ? 1.25 : 1;

    const subtotal = baseRate * seasonalFactor * complexityFactor * urgencyFactor;
    const discount = options.discount || 0;

    return {
      baseRate,
      seasonalAdjustment: (seasonalFactor - 1) * 100,
      complexityAdjustment: (complexityFactor - 1) * 100,
      urgencyFee: options.urgent ? 25 : 0,
      subtotal,
      discount: subtotal * discount,
      total: subtotal * (1 - discount)
    };
  }
}

// Package Builder
class PackageBuilder {
  static createCustomPackage(selectedServices, propertySize) {
    const baseTotal = selectedServices.reduce((total, service) => 
      total + QuoteCalculator.calculateBaseRate(service, propertySize), 0);
    
    const discount = selectedServices.length >= 3 ? 0.15 : 
                    selectedServices.length >= 2 ? 0.1 : 0;

    return {
      services: selectedServices,
      basePrice: baseTotal,
      discount: baseTotal * discount,
      total: baseTotal * (1 - discount),
      frequency: selectedServices.length >= 3 ? 'weekly' : 'bi-weekly',
      savings: baseTotal * discount
    };
  }
}

// Form Validation
class FormValidator {
  static validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static validatePhone(phone) {
    return /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(phone);
  }

  static validateRequired(value) {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  }

  static validateForm(data, rules) {
    const errors = {};
    
    for (const [field, rule] of Object.entries(rules)) {
      if (rule.required && !this.validateRequired(data[field])) {
        errors[field] = `${field} is required`;
      } else if (data[field]) {
        if (rule.email && !this.validateEmail(data[field])) {
          errors[field] = 'Invalid email format';
        }
        if (rule.phone && !this.validatePhone(data[field])) {
          errors[field] = 'Invalid phone format';
        }
        if (rule.minLength && data[field].length < rule.minLength) {
          errors[field] = `Must be at least ${rule.minLength} characters`;
        }
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

// Notification System
const NotificationSystem = {
  showNotification: function(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notification-container');
    if (!container) {
      console.warn('Notification container not found. Please add <div id="notification-container"></div> to your HTML.');
      alert(`${type.toUpperCase()}: ${message}`); // Fallback to alert
      return;
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    container.appendChild(notification);

    // Trigger reflow for animation
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-20px)';
      setTimeout(() => {
        if (container.contains(notification)) {
            container.removeChild(notification);
        }
      }, 500); // Match animation duration
    }, duration);
  },

  // Method to send (store) a notification in Firestore
  sendNotification: async function(userId, type, message, details = {}) {
    if (!userId || !type || !message) {
      console.error("sendNotification: Missing userId, type, or message");
      return { success: false, error: "Missing required fields." };
    }
    try {
      const db = firebase.firestore(); // Assuming firebase is globally available
      await db.collection("users").doc(userId).collection("notifications").add({
        type: type, // e.g., 'invoice_due', 'service_completed', 'quote_accepted', 'low_stock', 'new_message'
        message: message,
        details: details, // Optional: e.g., { invoiceId: 'xyz', serviceId: 'abc' }
        isRead: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Notification sent to user ${userId}: ${message}`);
      // Optionally, also show a UI notification to the sender if it's an admin action
      // this.showNotification(`Notification sent to user ${userId}.`, 'success');
      return { success: true };
    } catch (error) {
      console.error("Error sending notification to Firestore:", error);
      // this.showNotification("Failed to send notification. See console.", "error");
      return { success: false, error: error.message };
    }
  }
};

// Dark Mode Toggle Utility
const darkModeUtils = {
  // ... existing code ...
};

// Make utilities available if modules are not strictly used (e.g. loaded via <script> tags)
if (typeof window !== 'undefined') {
  window.QuoteCalculator = QuoteCalculator;
  window.PackageBuilder = PackageBuilder;
  window.FormValidator = FormValidator;
  window.NotificationSystem = NotificationSystem;
  window.darkModeUtils = darkModeUtils;
  window.serviceRates = serviceRates;
  window.servicePackages = servicePackages;
} 