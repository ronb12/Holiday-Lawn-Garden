// Automated Bidding System
class BiddingSystem {
  constructor() {
    this.db = firebase.firestore();
    this.bidsCollection = "bids";
    this.proposalsCollection = "proposals";
    this.quoteCalculator = new QuoteCalculator(); // Assuming QuoteCalculator is globally available
  }

  // Generate a detailed bid/proposal based on service requirements
  async generateBid(bidRequest) {
    // bidRequest: { customerId, propertyDetails: { address, sizeSqFt, complexity (1-3) }, services: [{ type, notes }], urgent }
    try {
      const { customerId, propertyDetails, services, urgent } = bidRequest;

      if (!customerId || !propertyDetails || !services || services.length === 0) {
        throw new Error("Missing required information for bid generation.");
      }

      let totalEstimatedCost = 0;
      const serviceBreakdown = [];

      for (const service of services) {
        const quote = this.quoteCalculator.calculateQuote(service.type, propertyDetails.sizeSqFt, {
          complexity: propertyDetails.complexity,
          urgent: urgent || false,
          // No discount at individual service level for bids, package discount applied later if applicable
        });
        serviceBreakdown.push({
          serviceType: service.type,
          notes: service.notes || "",
          ...quote,
        });
        totalEstimatedCost += quote.total;
      }
      
      // Apply a package discount if multiple services are selected
      let packageDiscount = 0;
      if (services.length >= 3) packageDiscount = 0.15; // 15% for 3+ services
      else if (services.length === 2) packageDiscount = 0.1; // 10% for 2 services

      const finalTotal = totalEstimatedCost * (1 - packageDiscount);

      const bidData = {
        customerId,
        propertyDetails,
        services: serviceBreakdown,
        estimatedSubtotal: totalEstimatedCost,
        packageDiscountPercentage: packageDiscount * 100,
        packageDiscountAmount: totalEstimatedCost * packageDiscount,
        estimatedTotal: finalTotal,
        status: "draft", // draft, sent, accepted, rejected, archived
        createdAt: new Date(),
        urgent: urgent || false,
        bidNumber: `BID-${Date.now().toString().slice(-6)}${Math.random().toString(36).slice(-2).toUpperCase()}`
      };

      const docRef = await this.db.collection(this.bidsCollection).add(bidData);
      NotificationSystem.showNotification("Bid generated successfully!", "success");
      return { id: docRef.id, ...bidData };

    } catch (error) {
      console.error("Error generating bid:", error);
      NotificationSystem.showNotification(error.message || "Error generating bid.", "error");
      return null;
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