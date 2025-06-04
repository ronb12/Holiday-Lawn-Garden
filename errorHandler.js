(function () {
  const getUserEmail = () => {
    try {
      return window.HollidayApp.currentUser?.email || "unauthenticated";
    } catch (error) {
      console.warn('Failed to get user email:', error);
      return "unauthenticated";
    }
  };

  const logErrorToFirestore = async (errObj) => {
    try {
      // Only log to Firestore if Firebase is initialized
      if (window.HollidayApp.db) {
        await window.HollidayApp.db.collection("adminErrors").add({
          ...errObj,
          user: getUserEmail(),
          timestamp: new Date().toISOString(),
          page: window.location.pathname
        });
      } else {
        console.warn("Firebase not initialized - error logged to console only");
      }
    } catch (err) {
      console.error("🔥 Failed to log error to Firestore:", err);
    }
  };

  const handleError = (errObj) => {
    console.warn("🔍 Error caught:", errObj.message);
    
    // Handle Firebase initialization errors specially
    if (errObj.message?.includes("Firebase") || errObj.message?.includes("firestore")) {
      console.error("Firebase-related error:", errObj);
      // Don't try to log Firebase initialization errors to Firestore
      return;
    }
    
    logErrorToFirestore(errObj);

    if (errObj.message?.includes("Cannot read properties of null")) {
      alert("Something went wrong. Fixing the page...");
      setTimeout(() => location.reload(), 1000);
    }
  };

  // Catch synchronous errors
  window.onerror = function (message, source, lineno, colno, error) {
    handleError({
      message,
      source,
      line: lineno,
      column: colno,
      stack: error?.stack || "No stack"
    });
    return true;
  };

  // Catch unhandled promise rejections
  window.addEventListener("unhandledrejection", event => {
    handleError({
      message: event.reason?.message || "Unhandled Promise Rejection",
      stack: event.reason?.stack || "No stack"
    });
  });

  // Watch for offline status
  window.addEventListener("offline", () => {
    alert("🚫 You are offline. Some features may not work.");
  });

  window.addEventListener("online", () => {
    console.log("✅ Back online.");
  });
})();
