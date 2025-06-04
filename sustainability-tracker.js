// Sustainability Features Tracker
class SustainabilityTracker {
  constructor() {
    this.db = firebase.firestore();
    this.logCollection = "sustainabilityLog";
    // Assuming MaterialTracker is available for chemical details
    this.materialTracker = new MaterialTracker(); 
  }

  // Log water usage for a job
  async logWaterUsage(jobId, customerId, amountLiters, source = "municipal", notes = "") {
    try {
      const logEntry = {
        jobId,
        customerId,
        type: "water_usage",
        amount: parseFloat(amountLiters),
        unit: "liters",
        source,
        notes,
        timestamp: new Date(),
      };
      await this.db.collection(this.logCollection).add(logEntry);
      NotificationSystem.showNotification("Water usage logged successfully.", "success");
      return true;
    } catch (error) {
      console.error("Error logging water usage:", error);
      NotificationSystem.showNotification("Error logging water usage.", "error");
      return false;
    }
  }

  // Log chemical usage for a job (links with MaterialTracker)
  async logChemicalUsage(jobId, customerId, materialId, quantityUsed, applicationAreaSqFt = null) {
    try {
      // First, ensure the usage is logged in MaterialTracker to update inventory
      const materialUsageLogged = await this.materialTracker.logUsage(jobId, materialId, quantityUsed);
      if (!materialUsageLogged) {
        // materialTracker.logUsage already shows a notification on failure
        throw new Error("Failed to log material usage in inventory. Sustainability log aborted.");
      }

      // Fetch material details for the log
      const materialDetails = await this.materialTracker.getAllMaterials().then(materials => materials.find(m => m.id === materialId));

      const logEntry = {
        jobId,
        customerId,
        type: "chemical_application",
        materialId,
        materialName: materialDetails ? materialDetails.name : "Unknown Material",
        materialType: materialDetails ? materialDetails.type : "Unknown",
        quantity: parseFloat(quantityUsed),
        unit: materialDetails ? materialDetails.unit : "units",
        applicationAreaSqFt: applicationAreaSqFt ? parseFloat(applicationAreaSqFt) : null,
        timestamp: new Date(),
      };
      await this.db.collection(this.logCollection).add(logEntry);
      NotificationSystem.showNotification("Chemical application logged for sustainability.", "success");
      return true;
    } catch (error) {
      console.error("Error logging chemical usage for sustainability:", error);
      NotificationSystem.showNotification(error.message || "Error logging chemical usage.", "error");
      return false;
    }
  }
  
  // Log green waste composted or recycled
  async logGreenWaste(jobId, customerId, amountKg, type = "composted") { // type: composted, recycled
    try {
      const logEntry = {
        jobId,
        customerId,
        type: "green_waste_management",
        managementType: type,
        amount: parseFloat(amountKg),
        unit: "kg",
        timestamp: new Date(),
      };
      await this.db.collection(this.logCollection).add(logEntry);
      NotificationSystem.showNotification(`Green waste (${type}) logged successfully.`, "success");
      return true;
    } catch (error) {
      console.error("Error logging green waste:", error);
      NotificationSystem.showNotification("Error logging green waste.", "error");
      return false;
    }
  }

  // Generate a sustainability report for a customer or overall
  async generateSustainabilityReport(filters = {}) { // { customerId, dateRange: { start, end } }
    try {
      let query = this.db.collection(this.logCollection);
      if (filters.customerId) {
        query = query.where("customerId", "==", filters.customerId);
      }
      if (filters.dateRange && filters.dateRange.start) {
        query = query.where("timestamp", ">=", new Date(filters.dateRange.start));
      }
      if (filters.dateRange && filters.dateRange.end) {
        query = query.where("timestamp", "<=", new Date(filters.dateRange.end));
      }

      const snapshot = await query.orderBy("timestamp", "desc").get();
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Basic aggregation for report
      const report = {
        totalWaterSavedEstimate: 0, // Placeholder for more complex calculation
        totalChemicalsReducedEstimate: 0, // Placeholder
        totalGreenWasteManagedKg: logs.filter(l => l.type === "green_waste_management").reduce((sum, l) => sum + l.amount, 0),
        logs: logs,
      };
      // More detailed aggregation can be added here
      return report;
    } catch (error) {
      console.error("Error generating sustainability report:", error);
      return null;
    }
  }
  
  // Offer eco-friendly service suggestions (conceptual)
  suggestEcoFriendlyOptions(serviceRequest) {
    const suggestions = [];
    if (serviceRequest.serviceType === 'Fertilization & Seeding') {
      suggestions.push("Consider organic fertilizer options.");
      suggestions.push("Native plant seeding for lower water usage.");
    }
    if (serviceRequest.serviceType === 'Mowing & Trimming') {
      suggestions.push("Mulching mower blades to return nutrients to the soil.");
      suggestions.push("Less frequent mowing to promote deeper roots and drought resistance.");
    }
    return suggestions;
  }
}

// Export SustainabilityTracker
window.SustainabilityTracker = SustainabilityTracker; 