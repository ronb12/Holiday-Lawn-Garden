// Enhanced Quote Calculator for Holliday's Lawn & Garden
class QuoteCalculator {
  constructor() {
    // Base rates for different services
    this.baseRates = {
      'Lawn Mowing & Trimming': 0.05,
      'Landscape Design': 0.15,
      'Leaf Removal': 0.08,
      'Fertilization & Seeding': 0.12,
      'Seasonal Cleanup': 0.10,
      'Tree Service': 0.14,
      'Irrigation': 0.09
    };
    
    // Complexity factors
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
        discount = 0,
        frequency = 'once',
        loyaltyTier = 0,
        distance = 0,
        specialEquipment = false,
        requiresPermit = false
      } = options;

      // Get base rate for service type
      const baseRate = this.baseRates[serviceType] || 0.07;
      
      // Calculate base cost
      let cost = propertySize * baseRate;
      
      // Apply complexity factor
      const complexityFactor = this.complexityFactors[complexity] || 1.0;
      cost *= complexityFactor;
      
      // Apply seasonal adjustment
      const seasonalFactor = this.getSeasonalAdjustment();
      cost *= seasonalFactor;
      
      // Apply frequency discount
      const frequencyFactor = frequency === 'weekly' ? 0.9 : 1.0;
      cost *= frequencyFactor;
      
      // Apply loyalty discount
      const loyaltyFactor = 1 - (loyaltyTier * 0.05);
      cost *= loyaltyFactor;
      
      // Apply urgency surcharge (25% for urgent requests)
      if (urgent) {
        cost *= 1.25;
      }
      
      // Calculate additional fees
      const travelFee = distance > 10 ? Math.min(50, distance * 2) : 0;
      const equipmentFee = specialEquipment ? 25 : 0;
      const permitFee = requiresPermit ? 50 : 0;
      
      // Apply any discount
      const discountAmount = cost * (discount / 100);
      cost -= discountAmount;
      
      // Add fees
      cost += travelFee + equipmentFee + permitFee;
      
      // Round to nearest dollar
      cost = Math.round(cost);
      
      return {
        baseAmount: Math.round(propertySize * baseRate),
        complexityFactor,
        seasonalAdjustment: (seasonalFactor - 1) * 100,
        frequencyDiscount: frequency === 'weekly' ? 10 : 0,
        loyaltyDiscount: loyaltyTier * 5,
        urgentSurcharge: urgent ? 25 : 0,
        travelFee,
        equipmentFee,
        permitFee,
        discountPercentage: discount,
        discountAmount: Math.round(discountAmount),
        total: cost
      };
    } catch (error) {
      console.error('Error calculating quote:', error);
      throw error;
    }
  }

  getSeasonalAdjustment() {
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

  getBaseRate(serviceType) {
    return this.baseRates[serviceType] || 0.07;
  }

  getComplexityFactor(level) {
    return this.complexityFactors[level] || 1.0;
  }
}

// Make QuoteCalculator available globally
if (typeof window !== 'undefined') {
  window.QuoteCalculator = QuoteCalculator;
} 