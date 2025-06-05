class BiddingSystem {
  constructor() {
    if (!window.HollidayApp?.db) {
      throw new Error('Firebase must be initialized before creating BiddingSystem');
    }
    this.db = window.HollidayApp.db;
    this.quoteCalculator = new QuoteCalculator();
  }

  // Generate a complete bid
  async generateBid(quoteData) {
    try {
      const quotes = quoteData.services.map(service => {
        return this.quoteCalculator.calculateQuote(
          service.type,
          quoteData.propertyDetails.sizeSqFt,
          {
            complexity: quoteData.propertyDetails.complexity,
            urgent: quoteData.urgent,
            frequency: quoteData.frequency || 'once',
            loyaltyTier: quoteData.loyaltyTier || 0,
            distance: quoteData.distance || 0,
            specialEquipment: service.specialEquipment || false,
            requiresPermit: service.requiresPermit || false
          }
        );
      });

      // Calculate totals
      const baseTotal = quotes.reduce((sum, quote) => sum + quote.baseAmount, 0);
      const totalBeforeDiscount = quotes.reduce((sum, quote) => sum + quote.total, 0);
      
      // Apply package discount if multiple services
      let packageDiscount = 0;
      if (quotes.length >= 4) packageDiscount = 0.25;
      else if (quotes.length >= 3) packageDiscount = 0.2;
      else if (quotes.length >= 2) packageDiscount = 0.15;
      
      const finalTotal = Math.round(totalBeforeDiscount * (1 - packageDiscount));

      const bid = {
        customerId: quoteData.customerId,
        services: quoteData.services.map((service, index) => ({
          ...service,
          quote: quotes[index]
        })),
        propertyDetails: quoteData.propertyDetails,
        baseTotal,
        totalBeforeDiscount,
        packageDiscount: packageDiscount * 100,
        estimatedTotal: finalTotal,
        urgent: !!quoteData.urgent,
        frequency: quoteData.frequency || 'once',
        status: 'pending',
        createdAt: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      };

      return bid;
    } catch (error) {
      console.error('Error generating bid:', error);
      throw new Error('Failed to generate bid');
    }
  }

  // Save bid to database
  async saveBid(bid) {
    try {
      const bidRef = await this.db.collection('bids').add(bid);
      return bidRef.id;
    } catch (error) {
      console.error('Error saving bid:', error);
      throw new Error('Failed to save bid');
    }
  }

  // Get bid by ID
  async getBid(bidId) {
    try {
      const bidDoc = await this.db.collection('bids').doc(bidId).get();
      if (!bidDoc.exists) {
        throw new Error('Bid not found');
      }
      return bidDoc.data();
    } catch (error) {
      console.error('Error retrieving bid:', error);
      throw new Error('Failed to retrieve bid');
    }
  }

  // Update bid status
  async updateBidStatus(bidId, status) {
    try {
      await this.db.collection('bids').doc(bidId).update({
        status: status,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating bid status:', error);
      throw new Error('Failed to update bid status');
    }
  }
}

// Make BiddingSystem available globally
window.BiddingSystem = BiddingSystem; 