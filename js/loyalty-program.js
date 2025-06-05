// Customer Loyalty Program
class LoyaltyProgram {
  constructor() {
    this.db = firebase.firestore();
    this.pointsCollection = "loyaltyPoints";
    this.referralsCollection = "referrals";
    this.POINTS_PER_DOLLAR = 1; // Example: 1 point per dollar spent
    this.REFERRAL_BONUS_POINTS = 100; // Points for successful referral
  }

  // Get or create loyalty account for a customer
  async getLoyaltyAccount(customerId) {
    try {
      const accountRef = this.db.collection(this.pointsCollection).doc(customerId);
      const doc = await accountRef.get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
      // Create new account if it doesn't exist
      const newAccount = {
        customerId,
        points: 0,
        tier: "bronze", // Tiers: bronze, silver, gold
        history: [],
        createdAt: new Date(),
        lastUpdated: new Date(),
      };
      await accountRef.set(newAccount);
      return { id: customerId, ...newAccount };
    } catch (error) {
      console.error("Error getting/creating loyalty account:", error);
      return null;
    }
  }

  // Add points for a transaction (e.g., invoice payment)
  async addPointsForTransaction(customerId, transactionAmount) {
    try {
      const account = await this.getLoyaltyAccount(customerId);
      if (!account) throw new Error("Loyalty account not found.");

      const pointsEarned = Math.floor(transactionAmount * this.POINTS_PER_DOLLAR);
      const newTotalPoints = (account.points || 0) + pointsEarned;

      await this.db.collection(this.pointsCollection).doc(customerId).update({
        points: newTotalPoints,
        history: firebase.firestore.FieldValue.arrayUnion({
          type: "earned",
          points: pointsEarned,
          reason: `Transaction of $${transactionAmount.toFixed(2)}`,
          date: new Date(),
        }),
        lastUpdated: new Date(),
        tier: this.determineTier(newTotalPoints), // Update tier
      });
      NotificationSystem.showNotification(`${pointsEarned} points added successfully!`, "success");
      return { success: true, pointsEarned, newTotalPoints };
    } catch (error) {
      console.error("Error adding points:", error);
      NotificationSystem.showNotification("Error adding loyalty points.", "error");
      return { success: false, error: error.message };
    }
  }

  // Redeem points for a discount or reward
  async redeemPoints(customerId, pointsToRedeem, reason = "Reward Redemption") {
    try {
      const account = await this.getLoyaltyAccount(customerId);
      if (!account) throw new Error("Loyalty account not found.");
      if ((account.points || 0) < pointsToRedeem) {
        throw new Error("Insufficient points for redemption.");
      }

      const newTotalPoints = account.points - pointsToRedeem;
      await this.db.collection(this.pointsCollection).doc(customerId).update({
        points: newTotalPoints,
        history: firebase.firestore.FieldValue.arrayUnion({
          type: "redeemed",
          points: pointsToRedeem,
          reason: reason,
          date: new Date(),
        }),
        lastUpdated: new Date(),
        tier: this.determineTier(newTotalPoints), // Update tier
      });
      // Here, you might trigger a discount application or reward issuance
      NotificationSystem.showNotification(`${pointsToRedeem} points redeemed successfully!`, "success");
      return { success: true, pointsRedeemed: pointsToRedeem, newTotalPoints };
    } catch (error) {
      console.error("Error redeeming points:", error);
      NotificationSystem.showNotification(error.message, "error");
      return { success: false, error: error.message };
    }
  }

  // Determine customer tier based on points
  determineTier(points) {
    if (points >= 1000) return "gold";
    if (points >= 500) return "silver";
    return "bronze";
  }

  // Log a referral
  async addReferral(referrerCustomerId, referredCustomerEmail) {
    try {
      // Check if referred customer already exists or has been referred
      const existingReferral = await this.db.collection(this.referralsCollection)
        .where("referredCustomerEmail", "==", referredCustomerEmail)
        .limit(1).get();

      if (!existingReferral.empty) {
        throw new Error("This email has already been referred.");
      }

      const referralData = {
        referrerCustomerId,
        referredCustomerEmail,
        status: "pending", // pending, completed (e.g., after referred customer makes a purchase)
        referralCode: `REF-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        createdAt: new Date(),
      };
      const docRef = await this.db.collection(this.referralsCollection).add(referralData);
      NotificationSystem.showNotification("Referral logged successfully! We will notify you upon completion.", "success");
      return { success: true, referralId: docRef.id, ...referralData };
    } catch (error) {
      console.error("Error adding referral:", error);
      NotificationSystem.showNotification(error.message, "error");
      return { success: false, error: error.message };
    }
  }

  // Complete a referral (e.g., after referred customer makes first purchase)
  async completeReferral(referralId, referredCustomerId) {
    try {
      const referralRef = this.db.collection(this.referralsCollection).doc(referralId);
      const referralDoc = await referralRef.get();

      if (!referralDoc.exists || referralDoc.data().status !== "pending") {
        throw new Error("Invalid or already completed referral.");
      }

      await referralRef.update({
        status: "completed",
        referredCustomerId: referredCustomerId, // Link to the new customer's ID
        completedAt: new Date(),
      });

      // Award bonus points to the referrer
      const referrerId = referralDoc.data().referrerCustomerId;
      await this.addPointsForReferral(referrerId, referralId);

      NotificationSystem.showNotification("Referral completed! Bonus points awarded.", "success");
      return { success: true };
    } catch (error) {
      console.error("Error completing referral:", error);
      NotificationSystem.showNotification(error.message, "error");
      return { success: false, error: error.message };
    }
  }

  // Add points for a successful referral
  async addPointsForReferral(customerId, referralId) {
    const account = await this.getLoyaltyAccount(customerId);
    if (!account) return;

    const newTotalPoints = (account.points || 0) + this.REFERRAL_BONUS_POINTS;
    await this.db.collection(this.pointsCollection).doc(customerId).update({
      points: newTotalPoints,
      history: firebase.firestore.FieldValue.arrayUnion({
        type: "earned",
        points: this.REFERRAL_BONUS_POINTS,
        reason: `Successful Referral (ID: ${referralId})`,
        date: new Date(),
      }),
      lastUpdated: new Date(),
      tier: this.determineTier(newTotalPoints),
    });
  }

  // Get a customer's referrals
  async getCustomerReferrals(customerId) {
    try {
      const snapshot = await this.db.collection(this.referralsCollection)
        .where("referrerCustomerId", "==", customerId)
        .orderBy("createdAt", "desc")
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching customer referrals:", error);
      return [];
    }
  }
}

// Export LoyaltyProgram
window.LoyaltyProgram = LoyaltyProgram; 