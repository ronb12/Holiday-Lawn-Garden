// Global configuration
export const CONFIG = {
  BASE_PATH: '/Holliday-Lawn-Garden/assets/',
  API_VERSION: '1.0.4',
  FIREBASE_VERSION: '10.8.0',
  ERROR_MESSAGES: {
    SERVICE_WORKER: 'Service Worker registration failed. Some features may not work offline.',
    FIREBASE_INIT: 'Failed to initialize Firebase. Please refresh the page.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
    AUTH_ERROR: 'Authentication error. Please try again.',
  },
};

// Also make it available globally for non-module scripts
window.CONFIG = CONFIG;
