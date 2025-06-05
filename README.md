# Holliday's Lawn & Garden Management System

## Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Copy `firebase-config.example.js` to `firebase-config.js`
3. Replace the placeholder values in `firebase-config.js` with your Firebase project credentials:
   - Go to Project Settings in Firebase Console
   - Find the Firebase SDK configuration
   - Copy the values to your `firebase-config.js`

⚠️ IMPORTANT: Never commit `firebase-config.js` to version control. It contains sensitive API keys.

## Installation

1. Clone the repository
2. Set up Firebase configuration as described above
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm start
   ```

## Security Notes

- Keep your Firebase API keys private
- Use environment variables for sensitive data in production
- Enable Firebase Authentication and set up proper security rules
- Regularly rotate API keys if compromised

## Features

- Customer Management
- Service Requests
- Quotes & Invoicing
- Equipment Tracking
- Reports & Analytics

## License

Copyright © 2024 Holliday's Lawn & Garden. All rights reserved. 