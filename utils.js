// Service Rates and Calculations
const serviceRates = {
  'Lawn Mowing & Trimming': {
    baseRate: 0.05,
    minSize: 1000,
    maxSize: 50000,
    fixedCosts: 25,
    variableCosts: 0.02,
    sizeMultiplier: 0.001,
    minProfitMargin: 0.2
  },
  'Landscape Design': {
    baseRate: 0.15,
    minSize: 500,
    maxSize: 25000,
    fixedCosts: 100,
    variableCosts: 0.05,
    sizeMultiplier: 0.002,
    minProfitMargin: 0.3
  },
  'Leaf Removal': {
    baseRate: 0.08,
    minSize: 1000,
    maxSize: 40000,
    fixedCosts: 35,
    variableCosts: 0.03,
    sizeMultiplier: 0.001,
    minProfitMargin: 0.25
  },
  'Fertilization & Seeding': {
    baseRate: 65,
    minSize: 1000,
    maxSize: 50000,
    sizeMultiplier: 0.00012,
    complexityMultipliers: {
      low: 1.0,
      medium: 1.3,
      high: 1.6
    },
    minProfitMargin: 0.35,
    fixedCosts: 30,
    variableCosts: 0.0001
  },
  'Seasonal Cleanup': {
    baseRate: 60,
    minSize: 1000,
    maxSize: 50000,
    sizeMultiplier: 0.00015,
    complexityMultipliers: {
      low: 1.0,
      medium: 1.25,
      high: 1.5
    },
    minProfitMargin: 0.30,
    fixedCosts: 25,
    variableCosts: 0.00009
  },
  'Mulching & Edging': {
    baseRate: 50,
    minSize: 1000,
    maxSize: 50000,
    sizeMultiplier: 0.0001,
    complexityMultipliers: {
      low: 1.0,
      medium: 1.2,
      high: 1.4
    },
    minProfitMargin: 0.30,
    fixedCosts: 20,
    variableCosts: 0.00007
  },
  'Commercial Lawn Care': {
    baseRate: 85,
    minSize: 5000,
    maxSize: 200000,
    sizeMultiplier: 0.00008,
    complexityMultipliers: {
      low: 1.0,
      medium: 1.3,
      high: 1.6
    },
    minProfitMargin: 0.25,
    fixedCosts: 35,
    variableCosts: 0.00006
  },
  'Pressure Washing': {
    baseRate: 70,
    minSize: 1000,
    maxSize: 100000,
    sizeMultiplier: 0.00015,
    complexityMultipliers: {
      low: 1.0,
      medium: 1.25,
      high: 1.5
    },
    minProfitMargin: 0.35,
    fixedCosts: 30,
    variableCosts: 0.0001
  }
};

// Package Definitions with enhanced pricing
const servicePackages = {
  basic: {
    name: 'Basic Care',
    services: ['Lawn Mowing & Trimming', 'Leaf Removal'],
    frequency: 'bi-weekly',
    discount: 0.15, // 15% off
    basePrice: 89.99,
    minSize: 1000,
    maxSize: 50000
  },
  premium: {
    name: 'Premium Care',
    services: ['Lawn Mowing & Trimming', 'Fertilization & Seeding', 'Seasonal Cleanup'],
    frequency: 'weekly',
    discount: 0.2, // 20% off
    basePrice: 159.99,
    minSize: 1000,
    maxSize: 50000
  },
  commercial: {
    name: 'Commercial',
    services: ['Commercial Lawn Care', 'Landscape Design', 'Seasonal Cleanup'],
    frequency: 'weekly',
    discount: 0.25, // 25% off
    basePrice: 299.99,
    minSize: 5000,
    maxSize: 200000
  }
};

// Enhanced Quote Calculator
class QuoteCalculator {
  static calculateBaseRate(service, propertySize) {
    const serviceConfig = serviceRates[service];
    if (!serviceConfig) return 50; // Default rate if service not found

    // Validate property size
    if (propertySize < serviceConfig.minSize) {
      throw new Error(`Property size must be at least ${serviceConfig.minSize} sq ft for ${service}`);
    }
    if (propertySize > serviceConfig.maxSize) {
      throw new Error(`Property size cannot exceed ${serviceConfig.maxSize} sq ft for ${service}`);
    }

    // Calculate total costs
    const fixedCosts = serviceConfig.fixedCosts;
    const variableCosts = propertySize * serviceConfig.variableCosts;
    const totalCosts = fixedCosts + variableCosts;

    // Calculate minimum price to maintain profit margin
    const minPrice = totalCosts / (1 - serviceConfig.minProfitMargin);

    // Calculate size-based rate
    const sizeBasedRate = serviceConfig.baseRate + (propertySize * serviceConfig.sizeMultiplier);

    // Use the higher of the two rates to ensure profitability
    const finalRate = Math.max(minPrice, sizeBasedRate);
    return Math.round(finalRate * 100) / 100; // Round to 2 decimal places
  }

  static calculateSizeFactor(propertySize) {
    if (propertySize < 1000) return 1;
    if (propertySize < 5000) return 1.5;
    if (propertySize < 10000) return 2;
    if (propertySize < 25000) return 2.5;
    if (propertySize < 50000) return 3;
    return 3.5;
  }

  static getSeasonalAdjustment() {
    const month = new Date().getMonth();
    const hour = new Date().getHours();
    const isWeekend = [0, 6].includes(new Date().getDay());
    
    // Base seasonal adjustments
    let seasonalFactor = 1;
    if (month >= 3 && month <= 8) { // Spring/Summer
      seasonalFactor = 1.2;
    } else if (month >= 9 && month <= 10) { // Fall
      seasonalFactor = 1.1;
    } else { // Winter
      seasonalFactor = 0.9;
    }

    // Time of day adjustment
    if (hour >= 17 || hour < 8) { // Evening/Night premium
      seasonalFactor *= 1.15;
    }

    // Weekend premium
    if (isWeekend) {
      seasonalFactor *= 1.1;
    }

    return seasonalFactor;
  }

  static getComplexityFactor(complexity) {
    const complexityLevels = {
      low: 1.0,
      medium: 1.25,
      high: 1.5
    };
    return complexityLevels[complexity] || 1.0;
  }

  static calculateQuote(service, propertySize, options = {}) {
    try {
      const baseRate = this.calculateBaseRate(service, propertySize);
      const serviceConfig = serviceRates[service];
      
      // Calculate costs
      const fixedCosts = serviceConfig.fixedCosts;
      const variableCosts = propertySize * serviceConfig.variableCosts;
      const totalCosts = fixedCosts + variableCosts;

      const seasonalFactor = this.getSeasonalAdjustment();
      const complexityFactor = this.getComplexityFactor(options.complexity || 'low');
      const urgencyFactor = options.urgent ? 1.25 : 1;
      const frequencyFactor = options.frequency === 'weekly' ? 0.9 : 1;
      const loyaltyFactor = options.loyaltyTier ? (1 - (options.loyaltyTier * 0.05)) : 1;

      const subtotal = baseRate * seasonalFactor * complexityFactor * urgencyFactor * frequencyFactor * loyaltyFactor;
      
      // Ensure minimum profit margin after all adjustments
      const minPrice = totalCosts / (1 - serviceConfig.minProfitMargin);
      const adjustedSubtotal = Math.max(subtotal, minPrice);
      
      const discount = Math.min(options.discount || 0, 0.2); // Cap discount at 20% to maintain profitability

      // Calculate additional fees
      const travelFee = options.distance > 10 ? Math.min(50, options.distance * 2) : 0;
      const equipmentFee = options.specialEquipment ? 25 : 0;
      const permitFee = options.requiresPermit ? 50 : 0;

      const total = (adjustedSubtotal * (1 - discount)) + travelFee + equipmentFee + permitFee;

      // Calculate actual profit margin
      const actualProfitMargin = (total - totalCosts) / total;

      return {
        baseRate,
        costs: {
          fixed: fixedCosts,
          variable: variableCosts,
          total: totalCosts
        },
        seasonalAdjustment: (seasonalFactor - 1) * 100,
        complexityAdjustment: (complexityFactor - 1) * 100,
        urgencyFee: options.urgent ? 25 : 0,
        travelFee,
        equipmentFee,
        permitFee,
        subtotal: adjustedSubtotal,
        discount: adjustedSubtotal * discount,
        total: Math.round(total * 100) / 100,
        profitMargin: Math.round(actualProfitMargin * 100) / 100
      };
    } catch (error) {
      console.error('Quote calculation error:', error);
      throw error;
    }
  }
}

// Package Builder with enhanced pricing
class PackageBuilder {
  static createCustomPackage(selectedServices, propertySize, options = {}) {
    try {
      // Validate property size against service requirements
      const minSize = Math.max(...selectedServices.map(service => serviceRates[service]?.minSize || 1000));
      const maxSize = Math.min(...selectedServices.map(service => serviceRates[service]?.maxSize || 50000));
      
      if (propertySize < minSize) {
        throw new Error(`Property size must be at least ${minSize} sq ft for selected services`);
      }
      if (propertySize > maxSize) {
        throw new Error(`Property size cannot exceed ${maxSize} sq ft for selected services`);
      }

      // Calculate base total with individual service rates
      const baseTotal = selectedServices.reduce((total, service) => {
        const serviceConfig = serviceRates[service];
        if (!serviceConfig) return total;
        return total + QuoteCalculator.calculateBaseRate(service, propertySize);
      }, 0);

      // Calculate total costs
      const totalCosts = selectedServices.reduce((total, service) => {
        const serviceConfig = serviceRates[service];
        if (!serviceConfig) return total;
        return total + serviceConfig.fixedCosts + (propertySize * serviceConfig.variableCosts);
      }, 0);

      // Enhanced package discounts with profitability checks
      let discount = 0;
      if (selectedServices.length >= 4) discount = 0.25;
      else if (selectedServices.length >= 3) discount = 0.2;
      else if (selectedServices.length >= 2) discount = 0.15;

      // Additional discounts with profitability checks
      const frequencyDiscount = options.frequency === 'weekly' ? 0.1 : 0;
      const loyaltyDiscount = options.loyaltyTier ? (options.loyaltyTier * 0.05) : 0;
      const referralDiscount = options.referralCode ? 0.1 : 0;

      // Calculate total discount (capped at 30% to maintain profitability)
      const totalDiscount = Math.min(0.3, discount + frequencyDiscount + loyaltyDiscount + referralDiscount);

      // Calculate final price
      const finalPrice = baseTotal * (1 - totalDiscount);

      // Ensure minimum profit margin
      const minPrice = totalCosts / (1 - 0.2); // Minimum 20% profit margin
      const adjustedPrice = Math.max(finalPrice, minPrice);

      return {
        services: selectedServices,
        baseTotal,
        totalCosts,
        packageDiscount: discount * 100,
        frequencyDiscount: frequencyDiscount * 100,
        loyaltyDiscount: loyaltyDiscount * 100,
        referralDiscount: referralDiscount * 100,
        totalDiscount: totalDiscount * 100,
        total: Math.round(adjustedPrice * 100) / 100
      };
    } catch (error) {
      console.error('Error creating package:', error);
      throw error;
    }
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