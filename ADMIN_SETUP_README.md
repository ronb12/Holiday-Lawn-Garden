# Holliday's Lawn & Garden - Admin Setup Guide

This guide will help you set up the complete admin environment for Holliday's Lawn & Garden business management system.

## 📋 Prerequisites

1. **Firebase Project**: Make sure you have a Firebase project created
2. **Firebase CLI**: Install Firebase CLI globally (`npm install -g firebase-tools`)
3. **Admin Account**: Create a Firebase Auth account that will be used as the admin

## 🚀 Setup Process

### Step 1: Deploy Security Rules

First, deploy the Firestore security rules to your Firebase project:

```bash
# Login to Firebase (if not already logged in)
firebase login

# Initialize Firebase in your project directory (if not already done)
firebase init

# Deploy Firestore rules and indexes
firebase deploy --only firestore
```

### Step 2: Set Up Admin User

1. **Navigate to your deployed admin dashboard**: `https://ronb12.github.io/Holliday-Lawn-Garden/admin.html`

2. **Create/Login to Admin Account**:
   - Use your email address (e.g., ronellbradley@gmail.com)
   - This will be your admin account

3. **Run Admin Setup Script**:
   - Open browser developer tools (F12)
   - Go to the Console tab
   - The admin setup script should automatically load
   - Run the setup: `adminSetup.runCompleteSetup()`

4. **Wait for Setup Completion**:
   - The script will set up your admin role
   - Add sample customers to the database
   - Create sample service requests
   - All steps will be logged in the console

### Step 3: Verify Setup

After running the setup script, verify everything works:

1. **Refresh the admin dashboard**
2. **Check the Overview tab** - you should see real statistics
3. **Go to the Requests tab** - should show sample service requests
4. **Check the Customers tab** - should show sample customers
5. **Test creating a new quote** - verify admin permissions work

## 🔧 Manual Setup (Alternative)

If the automated setup doesn't work, you can manually configure:

### Set Admin Role Manually

In the Firebase Console:
1. Go to Firestore Database
2. Navigate to the `users` collection
3. Find your user document (by your UID)
4. Add these fields:
   ```json
   {
     "role": "admin",
     "permissions": [
       "read_all_data",
       "write_all_data", 
       "manage_users",
       "view_reports",
       "manage_billing",
       "system_admin"
     ]
   }
   ```

### Add Sample Data Manually

You can add sample customers and service requests directly in the Firestore console if needed.

## 🔒 Security Configuration

The Firestore rules are configured to:

- **Admin Access**: Users with `role: "admin"` have full read/write access to all collections
- **Customer Access**: Customers can only access their own data
- **Protected Collections**: Equipment, materials, expenses, etc. are admin-only
- **Public Collections**: Service catalog is publicly readable

### Key Security Rules:

```javascript
// Admin check function
function isAdmin() {
  return request.auth != null && 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

// Example admin-only collection
match /expenses/{expenseId} {
  allow read, write: if isAdmin();
}

// Example customer data access
match /service_requests/{requestId} {
  allow read, write: if isAdmin();
  allow read: if isAuthenticated() && resource.data.customerId == request.auth.uid;
}
```

## 📊 What Gets Set Up

### Admin User
- Role: `admin`
- Full system permissions
- Access to all dashboard features

### Sample Customers (5 customers)
- John Doe - Residential property
- Sarah Johnson - Residential with pool
- Mike Wilson - Small residential
- Lisa Brown - Residential with pool & sprinklers
- David Miller - Commercial property

### Sample Service Requests
- Lawn mowing request (pending)
- Landscape design (in-progress)
- Seasonal cleanup (completed)

## 🛠️ Troubleshooting

### Common Issues:

1. **"Missing or insufficient permissions" errors**:
   - Make sure you've deployed the Firestore rules
   - Verify your admin role is set correctly
   - Check Firebase Console > Authentication to confirm you're logged in

2. **Setup script not working**:
   - Check browser console for errors
   - Make sure Firebase is fully loaded
   - Try refreshing the page and running again

3. **No data showing in dashboard**:
   - Verify Firestore rules are deployed
   - Check that sample data was created successfully
   - Look for JavaScript errors in the console

### Getting Help:

1. Check browser console for error messages
2. Verify Firebase project configuration
3. Ensure you're logged in as the correct admin user
4. Check Firestore rules in Firebase Console

## 🎯 Next Steps

After setup is complete:

1. **Test all admin features**:
   - Create quotes and invoices
   - Manage service requests
   - View customer data

2. **Customize for your business**:
   - Update company information
   - Modify service types
   - Adjust pricing structures

3. **Add real customers**:
   - Replace sample data with real customers
   - Import existing customer data if needed

4. **Train staff**:
   - Show team members how to use the admin dashboard
   - Set up additional admin accounts if needed

## 📈 Business Ready Features

Your admin dashboard now includes:

- ✅ **Customer Management** - Full customer database with contact info
- ✅ **Service Request Tracking** - Manage incoming requests with status updates
- ✅ **Quote & Bid Management** - Generate professional quotes with PDF export
- ✅ **Invoice System** - Create and track invoices with payment status
- ✅ **Real-time Dashboard** - Statistics and business metrics
- ✅ **Professional UI** - Clean, modern interface for daily business use
- ✅ **Mobile Responsive** - Works on tablets and phones
- ✅ **Secure Access** - Role-based permissions and data protection

## 🔐 Security Best Practices

1. **Admin Account Security**:
   - Use a strong password
   - Enable 2FA if available
   - Don't share admin credentials

2. **Regular Backups**:
   - Firebase automatically backs up your data
   - Consider additional backups for critical data

3. **Monitor Access**:
   - Check Firebase Console regularly
   - Review user activity
   - Update permissions as needed

Your Holliday's Lawn & Garden admin system is now ready for production use! 🌿🏡 