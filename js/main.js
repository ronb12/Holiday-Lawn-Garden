// ✅ main.js — Shared Script for All Pages

// ✅ Firebase Setup
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "mobile-debt-crusher"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ✅ Dark Mode Toggle
function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark") ? "on" : "off");
}

if (localStorage.getItem("darkMode") === "on") {
  document.body.classList.add("dark");
}

// ✅ Global Error Handler
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

  window.onerror = function (message, source, lineno, colno, error) {
    handleError({ message, source, line: lineno, column: colno, stack: error?.stack || "No stack" });
    return true;
  };

  window.addEventListener("unhandledrejection", event => {
    handleError({ message: event.reason?.message || "Unhandled Promise Rejection", stack: event.reason?.stack || "No stack" });
  });

  window.addEventListener("offline", () => {
    alert("🚫 You are offline. Some features may not work.");
  });

  window.addEventListener("online", () => {
    console.log("✅ Back online.");
  });
})();
