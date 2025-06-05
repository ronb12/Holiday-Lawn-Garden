class BiddingSystem {
  constructor() {
    if (!window.HollidayApp?.db) {
      throw new Error('Firebase must be initialized before creating BiddingSystem');
    }
    this.db = window.HollidayApp.db;
  }

  // Calculate base price based on property size and service type
  calculateBasePrice(propertySize, serviceType) {
    const rates = {
      'Lawn Mowing & Trimming': 0.02,
      'Landscaping': 0.03,
      'Tree Service': 0.04,
      'Irrigation': 0.025
    };
    
    const rate = rates[serviceType] || 0.02;
    return propertySize * rate;
  }

  // Apply adjustments based on property complexity and urgency
  applyAdjustments(basePrice, complexity, urgent) {
    let adjustedPrice = basePrice;
    
    // Complexity multiplier (1.0 to 1.5)
    adjustedPrice *= (1 + (complexity * 0.1));
    
    // Urgency multiplier (1.0 or 1.2)
    if (urgent) {
      adjustedPrice *= 1.2;
    }
    
    return Math.round(adjustedPrice * 100) / 100;
  }

  // Generate a complete bid
  async generateBid(quoteData) {
    try {
      const basePrice = this.calculateBasePrice(
        quoteData.propertyDetails.sizeSqFt,
        quoteData.services[0].type
      );

      const totalPrice = this.applyAdjustments(
        basePrice,
        quoteData.propertyDetails.complexity,
        quoteData.urgent
      );

      const bid = {
        customerId: quoteData.customerId,
        services: quoteData.services,
        propertyDetails: quoteData.propertyDetails,
        basePrice: basePrice,
        estimatedTotal: totalPrice,
        status: 'pending',
        createdAt: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Valid for 7 days
      };

      return bid;
    } catch (error) {
      console.error('Error generating bid:', error);
      throw new Error('Failed to generate bid');
    }
  }
}

// Make BiddingSystem available globally
window.BiddingSystem = BiddingSystem; 