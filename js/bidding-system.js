// Automated Bidding System
class BiddingSystem {
  constructor() {
    this.db = firebase.firestore();
    this.bidsCollection = "bids";
    this.proposalsCollection = "proposals";
    this.quoteCalculator = new QuoteCalculator(); // Assuming QuoteCalculator is globally available
    this.baseRates = {
      'Lawn Mowing & Trimming': 0.05,
      'Landscape Design': 0.15,
      'Leaf Removal': 0.08,
      'Fertilization & Seeding': 0.12,
      'Seasonal Cleanup': 0.10
    };
  }

  // Generate a detailed bid/proposal based on service requirements
  async generateBid(quoteData) {
    try {
      const { services, propertyDetails, customerId, urgent } = quoteData;
      
      // Calculate base cost
      let totalCost = 0;
      const lineItems = [];

      for (const service of services) {
        const baseRate = this.baseRates[service.type] || 0.07;
        const serviceCost = Math.round(propertyDetails.sizeSqFt * baseRate * propertyDetails.complexity);
        
        lineItems.push({
          service: service.type,
          notes: service.notes,
          cost: serviceCost
        });
        
        totalCost += serviceCost;
      }

      // Apply urgency multiplier
      if (urgent) {
        totalCost = Math.round(totalCost * 1.25);
      }

      // Create bid object
      const bid = {
        customerId,
        services: lineItems,
        propertyDetails,
        estimatedTotal: totalCost,
        urgent: !!urgent,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      };

      return bid;
    } catch (error) {
      console.error('Error generating bid:', error);
      throw error;
    }
  }

  calculateQuickQuote(serviceType, propertySize) {
    try {
      const baseRate = this.baseRates[serviceType] || 0.07;
      return Math.round(propertySize * baseRate);
    } catch (error) {
      console.error('Error calculating quick quote:', error);
      throw error;
    }
  }

  // Get a bid by its ID
  async getBidById(bidId) {
    try {
      const doc = await this.db.collection(this.bidsCollection).doc(bidId).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error("Error fetching bid:", error);
      return null;
    }
  }

  // Update bid status or details
  async updateBid(bidId, updateData) {
    try {
      await this.db.collection(this.bidsCollection).doc(bidId).update({
        ...updateData,
        updatedAt: new Date(),
      });
      NotificationSystem.showNotification("Bid updated successfully!", "success");
      return true;
    } catch (error) {
      console.error("Error updating bid:", error);
      NotificationSystem.showNotification("Error updating bid.", "error");
      return false;
    }
  }

  // List bids based on filters (e.g., customerId, status)
  async listBids(filters = {}) {
    try {
      let query = this.db.collection(this.bidsCollection);
      if (filters.customerId) {
        query = query.where("customerId", "==", filters.customerId);
      }
      if (filters.status) {
        query = query.where("status", "==", filters.status);
      }
      const snapshot = await query.orderBy("createdAt", "desc").get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error listing bids:", error);
      return [];
    }
  }
  
  // Generate a formal proposal document (e.g., text for PDF or email)
  generateProposalText(bidData) {
    let proposal = `Holliday's Lawn & Garden - Proposal\n`;
    proposal += `Bid Number: ${bidData.bidNumber}\n`;
    proposal += `Date: ${new Date(bidData.createdAt.seconds * 1000).toLocaleDateString()}\n\n`;
    // Add customer details here if available, e.g., from a customerId lookup
    proposal += `Property Address: ${bidData.propertyDetails.address}\n`;
    proposal += `Property Size: ${bidData.propertyDetails.sizeSqFt} sq ft\n`;
    proposal += `Complexity: ${bidData.propertyDetails.complexity}\n\n`;
    proposal += `Services Proposed:\n`;
    bidData.services.forEach(service => {
        proposal += `  - ${service.serviceType}: $${service.total.toFixed(2)}\n`;
        if (service.notes) proposal += `    Notes: ${service.notes}\n`;
    });
    proposal += `\nSubtotal: $${bidData.estimatedSubtotal.toFixed(2)}\n`;
    if (bidData.packageDiscountAmount > 0) {
        proposal += `Package Discount (${bidData.packageDiscountPercentage}%): -$${bidData.packageDiscountAmount.toFixed(2)}\n`;
    }
    proposal += `Estimated Total: $${bidData.estimatedTotal.toFixed(2)}\n\n`;
    proposal += `Thank you for considering Holliday's Lawn & Garden!\n`;
    // Add terms and conditions, validity period, etc.
    return proposal;
  }
  
  // Save a generated proposal
  async saveProposal(bidId, proposalText, version = 1) {
      try {
          const proposalData = {
              bidId,
              proposalText,
              version,
              createdAt: new Date()
          };
          const docRef = await this.db.collection(this.proposalsCollection).add(proposalData);
          await this.updateBid(bidId, { proposalId: docRef.id, status: 'proposal_generated' });
          NotificationSystem.showNotification("Proposal saved successfully!", "success");
          return { id: docRef.id, ...proposalData };
      } catch (error) {
          console.error("Error saving proposal:", error);
          NotificationSystem.showNotification("Error saving proposal.", "error");
          return null;
      }
  }
}

// Export BiddingSystem
window.BiddingSystem = BiddingSystem; 