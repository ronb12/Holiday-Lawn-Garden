(function () {
  const getUserEmail = () => firebase.auth().currentUser?.email || "unauthenticated";

  const logErrorToFirestore = (errObj) => {
    try {
      db.collection("adminErrors").add({
        ...errObj,
        user: getUserEmail(),
        timestamp: new Date().toISOString(),
        page: window.location.pathname
      });
    } catch (err) {
      console.error("🔥 Failed to log error to Firestore", err);
    }
  };

  const handleError = (errObj) => {
    console.warn("🔍 Error caught:", errObj.message);
    logErrorToFirestore(errObj);

    if (errObj.message?.includes("Cannot read properties of null")) {
      alert("Something went wrong. Fixing the page...");
      setTimeout(() => location.reload(), 1000);
    }
  };

  // ✅ Catch synchronous errors
  window.onerror = function (message, source, lineno, colno, error) {
    handleError({
      message, source,
      line: lineno,
      column: colno,
      stack: error?.stack || "No stack"
    });
    return true; // Suppress default console
  };

  // ✅ Catch unhandled promise rejections
  window.addEventListener("unhandledrejection", event => {
    handleError({
      message: event.reason?.message || "Unhandled Promise Rejection",
      stack: event.reason?.stack || "No stack"
    });
  });

  // ✅ Watch for offline status
  window.addEventListener("offline", () => {
    alert("🚫 You are offline. Some features may not work.");
  });

  window.addEventListener("online", () => {
    console.log("✅ Back online.");
  });

})();
