const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}

const app = express();
app.use(cors({ origin: true }));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'An internal error occurred',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});


// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Handle specific error types
    if (err.code === 'auth/user-not-found') {
        res.status(404).json({
            status: 'error',
            message: 'User not found'
        });
        return;
    }
    
    if (err.code === 'permission-denied') {
        res.status(403).json({
            status: 'error',
            message: 'Permission denied'
        });
        return;
    }
    
    // Default error response
    res.status(500).json({
        status: 'error',
        message: 'An internal error occurred',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Error logging function
const logError = (error, context = {}) => {
    const errorLog = {
        timestamp: new Date().toISOString(),
        error: {
            message: error.message,
            stack: error.stack,
            code: error.code
        },
        context
    };
    
    console.error('Error Log:', errorLog);
    
    // Store error in Firestore for monitoring
    return admin.firestore()
        .collection('error_logs')
        .add(errorLog)
        .catch(console.error);
};
exports.api = functions.https.onRequest(app);
