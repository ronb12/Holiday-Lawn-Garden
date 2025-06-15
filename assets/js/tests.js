// Test utilities and functions
const runTests = () => {
  console.log('Running application tests...');

  // Test service worker registration
  if ('serviceWorker' in navigator) {
    console.log('Service Worker is supported');
  }

  // Test cache functionality
  if ('caches' in window) {
    console.log('Cache API is supported');
  }

  // Test analytics
  if (window.HollidayApp && window.HollidayApp.analytics) {
    console.log('Analytics is initialized');
  }

  // Test authentication
  if (window.HollidayApp && window.HollidayApp.auth) {
    console.log('Authentication is initialized');
  }
};

// Run tests when DOM is loaded
document.addEventListener('DOMContentLoaded', runTests);

// Export for module usage
export { runTests };
