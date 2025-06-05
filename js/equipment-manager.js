// Equipment Management System
class EquipmentManager {
  constructor() {
    this.db = firebase.firestore();
    this.collectionName = "equipment";
  }

  // Add new equipment
  async addEquipment(equipmentData) {
    try {
      const equipment = {
        ...equipmentData,
        purchaseDate: new Date(equipmentData.purchaseDate),
        lastMaintenanceDate: null,
        nextMaintenanceDate: null,
        usageHours: 0,
        status: "available", // available, in-use, maintenance, retired
        createdAt: new Date(),
      };
      const docRef = await this.db.collection(this.collectionName).add(equipment);
      NotificationSystem.showNotification("Equipment added successfully!", "success");
      return { id: docRef.id, ...equipment };
    } catch (error) {
      console.error("Error adding equipment:", error);
      NotificationSystem.showNotification("Error adding equipment.", "error");
      return null;
    }
  }

  // Get all equipment
  async getAllEquipment() {
    try {
      const snapshot = await this.db.collection(this.collectionName).orderBy("name").get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching equipment:", error);
      NotificationSystem.showNotification("Error fetching equipment.", "error");
      return [];
    }
  }

  // Get a specific piece of equipment by ID
  async getEquipmentById(equipmentId) {
    try {
      const doc = await this.db.collection(this.collectionName).doc(equipmentId).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
      NotificationSystem.showNotification("Equipment not found.", "error");
      return null;
    } catch (error) {
      console.error("Error fetching equipment by ID:", error);
      return null;
    }
  }

  // Update equipment details
  async updateEquipment(equipmentId, updateData) {
    try {
      await this.db.collection(this.collectionName).doc(equipmentId).update({
        ...updateData,
        updatedAt: new Date(),
      });
      NotificationSystem.showNotification("Equipment updated successfully!", "success");
      return true;
    } catch (error) {
      console.error("Error updating equipment:", error);
      NotificationSystem.showNotification("Error updating equipment.", "error");
      return false;
    }
  }

  // Log maintenance for equipment
  async logMaintenance(equipmentId, maintenanceDetails) {
    try {
      const nextMaintenanceDate = new Date();
      nextMaintenanceDate.setMonth(nextMaintenanceDate.getMonth() + (maintenanceDetails.scheduleMonths || 6)); // Default 6 months

      await this.db.collection(this.collectionName).doc(equipmentId).update({
        lastMaintenanceDate: new Date(maintenanceDetails.date),
        nextMaintenanceDate: nextMaintenanceDate,
        maintenanceNotes: firebase.firestore.FieldValue.arrayUnion({
          date: new Date(maintenanceDetails.date),
          notes: maintenanceDetails.notes,
          cost: maintenanceDetails.cost || 0,
        }),
        status: "available", // Assuming maintenance completion
        updatedAt: new Date(),
      });
      NotificationSystem.showNotification("Maintenance logged successfully!", "success");
      return true;
    } catch (error) {
      console.error("Error logging maintenance:", error);
      NotificationSystem.showNotification("Error logging maintenance.", "error");
      return false;
    }
  }

  // Track equipment usage
  async trackUsage(equipmentId, usageHours, jobId = null) {
    try {
      const equipmentRef = this.db.collection(this.collectionName).doc(equipmentId);
      await this.db.runTransaction(async (transaction) => {
        const doc = await transaction.get(equipmentRef);
        if (!doc.exists) {
          throw "Equipment not found!";
        }
        const currentUsage = doc.data().usageHours || 0;
        transaction.update(equipmentRef, {
          usageHours: currentUsage + usageHours,
          usageLog: firebase.firestore.FieldValue.arrayUnion({
            jobId: jobId,
            hours: usageHours,
            date: new Date(),
          }),
          updatedAt: new Date(),
        });
      });
      NotificationSystem.showNotification("Usage tracked successfully!", "success");
      return true;
    } catch (error) {
      console.error("Error tracking usage:", error);
      NotificationSystem.showNotification("Error tracking usage.", "error");
      return false;
    }
  }

  // Set equipment status
  async setEquipmentStatus(equipmentId, status) {
    // Valid statuses: available, in-use, maintenance, retired
    if (!["available", "in-use", "maintenance", "retired"].includes(status)) {
      NotificationSystem.showNotification("Invalid equipment status.", "error");
      return false;
    }
    try {
      await this.db.collection(this.collectionName).doc(equipmentId).update({
        status: status,
        updatedAt: new Date(),
      });
      NotificationSystem.showNotification(`Equipment status set to ${status}.`, "success");
      return true;
    } catch (error) {
      console.error("Error setting equipment status:", error);
      NotificationSystem.showNotification("Error setting status.", "error");
      return false;
    }
  }
}

// Export EquipmentManager
window.EquipmentManager = EquipmentManager; 