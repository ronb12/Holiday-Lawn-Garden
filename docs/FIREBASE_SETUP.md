# Firebase Setup and Usage Guide

## Overview
This document outlines the Firebase configuration and usage in the Holliday's Lawn & Garden web application.

## Initial Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable required services:
   - Authentication
   - Firestore
   - Storage
   - Analytics
   - Performance Monitoring
   - App Check

## Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in Firebase configuration values:
   ```env
   FIREBASE_API_KEY=your-api-key
   FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   FIREBASE_APP_ID=your-app-id
   FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

## Security Configuration

### App Check
- Enable App Check in Firebase Console
- Add your domain to allowed domains
- Configure reCAPTCHA v3 site key
- Update `firebase-init.js` with your site key

### API Key Restrictions
1. In Firebase Console, go to Project Settings > API Keys
2. Add restrictions for:
   - HTTP referrers (your domains)
   - API usage quotas
   - IP address restrictions (if applicable)

## Features and Usage

### Authentication
```javascript
// Check if user is authenticated
const isAuthenticated = window.HollidayApp.isAuthenticated();

// Check if user is admin
const isAdmin = await window.HollidayApp.isAdmin();

// Listen for auth state changes
window.addEventListener('authStateChanged', (event) => {
  const user = event.detail.user;
  // Handle auth state change
});
```

### Firestore
```javascript
// Get Firestore instance
const db = window.HollidayApp.db;

// Example query with performance tracking
const trace = window.HollidayApp.perf.trace('getData');
trace.start();
const data = await db.collection('users').get();
trace.stop();
```

### Analytics
```javascript
// Enable analytics with user consent
localStorage.setItem('analyticsConsent', 'true');
window.HollidayApp.analytics.setAnalyticsCollectionEnabled(true);

// Log custom event
window.HollidayApp.analytics.logEvent('custom_event', {
  parameter: 'value'
});
```

## Performance Monitoring

The app automatically tracks:
- Page load times
- Authentication state changes
- Database operations
- Custom traces

### Custom Performance Traces
```javascript
// Start a custom trace
const trace = window.HollidayApp.perf.trace('customOperation');
trace.start();

// Add custom attributes
trace.putAttribute('key', 'value');

// Stop the trace
trace.stop();
```

## Testing

Run Firebase initialization tests:
```bash
npm test tests/firebase-init.test.js
```

## Troubleshooting

### Common Issues

1. **Firebase not initialized**
   - Check console for initialization errors
   - Verify environment variables
   - Check network connectivity

2. **Permission Denied**
   - Verify Firestore rules
   - Check user authentication state
   - Verify admin role assignment

3. **App Check Failures**
   - Verify domain configuration
   - Check reCAPTCHA site key
   - Ensure proper SSL setup

### Debug Mode
Enable Firebase debug mode in console:
```javascript
firebase.debug.enable();
```

## Best Practices

1. **Security**
   - Never expose API keys in client code
   - Use App Check in production
   - Implement proper Firestore rules
   - Enable authentication for sensitive operations

2. **Performance**
   - Use offline persistence
   - Implement proper caching
   - Monitor performance metrics
   - Use batch operations for multiple updates

3. **Testing**
   - Run tests before deployment
   - Use Firebase Emulator for local testing
   - Monitor error rates in Firebase Console

## Support

For issues or questions:
1. Check Firebase Console logs
2. Review Firebase documentation
3. Contact development team 