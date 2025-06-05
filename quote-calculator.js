// Quote Calculator for generating service quotes
class QuoteCalculator {
  constructor() {
    this.baseRates = {
      'Lawn Mowing & Trimming': 0.05,
      'Landscape Design': 0.15,
      'Leaf Removal': 0.08,
      'Fertilization & Seeding': 0.12,
      'Seasonal Cleanup': 0.10
    };
    
    this.complexityFactors = {
      1: 1.0,  // Standard complexity
      2: 1.3,  // Moderate complexity
      3: 1.6   // High complexity
    };
  }

  calculateQuote(serviceType, propertySize, options = {}) {
    try {
      const {
        complexity = 1,
        urgent = false,
        discount = 0
      } = options;

      // Get base rate for service type
      const baseRate = this.baseRates[serviceType] || 0.07;
      
      // Calculate base cost
      let cost = propertySize * baseRate;
      
      // Apply complexity factor
      const complexityFactor = this.complexityFactors[complexity] || 1.0;
      cost *= complexityFactor;
      
      // Apply urgency surcharge (25% for urgent requests)
      if (urgent) {
        cost *= 1.25;
      }
      
      // Apply any discount
      const discountAmount = cost * (discount / 100);
      cost -= discountAmount;
      
      // Round to nearest dollar
      cost = Math.round(cost);
      
      return {
        baseAmount: cost,
        complexityFactor,
        urgentSurcharge: urgent ? 25 : 0,
        discountPercentage: discount,
        discountAmount: Math.round(discountAmount),
        total: cost
      };
    } catch (error) {
      console.error('Error calculating quote:', error);
      throw error;
    }
  }

  getBaseRate(serviceType) {
    return this.baseRates[serviceType] || 0.07;
  }

  getComplexityFactor(level) {
    return this.complexityFactors[level] || 1.0;
  }
}

// Make QuoteCalculator available globally
window.QuoteCalculator = QuoteCalculator; 