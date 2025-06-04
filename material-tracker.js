// Chemical and Material Tracking System
class MaterialTracker {
  constructor() {
    this.db = firebase.firestore();
    this.inventoryCollection = "materialsInventory";
    this.usageLogCollection = "materialUsageLog";
  }

  // Add a new material to inventory
  async addMaterial(materialData) {
    try {
      const material = {
        ...materialData, // name, type (e.g., fertilizer, pesticide, fuel), unit (e.g., kg, L, item)
        stockLevel: parseFloat(materialData.stockLevel) || 0,
        reorderPoint: parseFloat(materialData.reorderPoint) || 0,
        supplierInfo: materialData.supplierInfo || "",
        lastStockUpdate: new Date(),
        createdAt: new Date(),
      };
      const docRef = await this.db.collection(this.inventoryCollection).add(material);
      NotificationSystem.showNotification("Material added to inventory successfully!", "success");
      return { id: docRef.id, ...material };
    } catch (error) {
      console.error("Error adding material:", error);
      NotificationSystem.showNotification("Error adding material.", "error");
      return null;
    }
  }

  // Get all materials from inventory
  async getAllMaterials() {
    try {
      const snapshot = await this.db.collection(this.inventoryCollection).orderBy("name").get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching materials:", error);
      return [];
    }
  }

  // Update stock level for a material
  async updateStock(materialId, changeInStock, reason = "Stock Update") {
    // changeInStock can be positive (added) or negative (used/removed)
    try {
      const materialRef = this.db.collection(this.inventoryCollection).doc(materialId);
      await this.db.runTransaction(async (transaction) => {
        const doc = await transaction.get(materialRef);
        if (!doc.exists) throw "Material not found!";
        
        const currentStock = doc.data().stockLevel || 0;
        const newStockLevel = currentStock + parseFloat(changeInStock);

        transaction.update(materialRef, {
          stockLevel: newStockLevel,
          lastStockUpdate: new Date(),
          stockHistory: firebase.firestore.FieldValue.arrayUnion({
            date: new Date(),
            change: parseFloat(changeInStock),
            newStockLevel: newStockLevel,
            reason: reason,
          })
        });
      });
      NotificationSystem.showNotification("Stock updated successfully!", "success");
      // Check for low stock after update
      this.checkLowStock(materialId);
      return true;
    } catch (error) {
      console.error("Error updating stock:", error);
      NotificationSystem.showNotification("Error updating stock.", "error");
      return false;
    }
  }

  // Log material usage for a specific job
  async logUsage(jobId, materialId, quantityUsed, usedByEmployeeId = null) {
    try {
      if (quantityUsed <= 0) throw new Error("Quantity used must be positive.");

      const usageData = {
        jobId,
        materialId,
        quantityUsed: parseFloat(quantityUsed),
        usedByEmployeeId, // Optional: link to employee who used it
        usageDate: new Date(),
      };
      await this.db.collection(this.usageLogCollection).add(usageData);
      
      // Update stock level
      await this.updateStock(materialId, -parseFloat(quantityUsed), `Used for Job ID: ${jobId}`);
      
      NotificationSystem.showNotification("Material usage logged successfully!", "success");
      return true;
    } catch (error) {
      console.error("Error logging material usage:", error);
      NotificationSystem.showNotification(error.message || "Error logging usage.", "error");
      return false;
    }
  }

  // Get usage log for a material or job
  async getUsageLog(filters = {}) { // filters can be { materialId: '...' } or { jobId: '...' }
    try {
      let query = this.db.collection(this.usageLogCollection);
      if (filters.materialId) {
        query = query.where("materialId", "==", filters.materialId);
      }
      if (filters.jobId) {
        query = query.where("jobId", "==", filters.jobId);
      }
      const snapshot = await query.orderBy("usageDate", "desc").get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching usage log:", error);
      return [];
    }
  }

  // Check for low stock and send notification if needed
  async checkLowStock(materialId) {
    try {
      const materialDoc = await this.db.collection(this.inventoryCollection).doc(materialId).get();
      if (materialDoc.exists) {
        const material = materialDoc.data();
        if (material.stockLevel <= material.reorderPoint) {
          NotificationSystem.showNotification(
            `Low stock alert: ${material.name} is at ${material.stockLevel} ${material.unit}. Reorder point is ${material.reorderPoint} ${material.unit}.`,
            "warning"
          );
          // Optionally, send an email/admin notification
          // await NotificationSystem.sendNotification('adminUserId', 'low_stock', `...`);
        }
      }
    } catch (error) {
      console.error("Error checking low stock:", error);
    }
  }

  // Get materials that are low in stock
  async getLowStockMaterials() {
    try {
      const snapshot = await this.db.collection(this.inventoryCollection).get();
      const lowStockItems = [];
      snapshot.forEach(doc => {
        const material = doc.data();
        if (material.stockLevel <= material.reorderPoint) {
          lowStockItems.push({ id: doc.id, ...material });
        }
      });
      return lowStockItems;
    } catch (error) {
      console.error("Error fetching low stock materials:", error);
      return [];
    }
  }
}

// Export MaterialTracker
window.MaterialTracker = MaterialTracker; 