# Firebase Setup Guide for Harley Gaming Café

## Current Status
Your website is currently running with local demonstration data. To enable full Firebase functionality, you need to configure Firebase security rules.

## Quick Setup Steps

### 1. Configure Firebase Security Rules
Go to your Firebase Console > Firestore Database > Rules and replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents (for development)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 2. Enable Authentication (Optional)
For admin features:
1. Go to Authentication > Sign-in method
2. Enable Email/Password authentication
3. Add an admin user in the Users tab

### 3. Initialize Sample Data
The website will automatically create sample data when Firebase is properly configured.

## Current Features Working
- ✅ Website navigation and display
- ✅ Menu browsing with local data
- ✅ Device availability display
- ✅ Mobile responsive design
- ✅ Admin access (triple-click logo)

## Features Requiring Firebase
- 🔄 Real-time data synchronization
- 🔄 Booking persistence
- 🔄 Order management
- 🔄 Admin dashboard updates

## Firebase Project Details
- Project ID: harley-db
- Region: Default (us-central1)
- Authentication: Email/Password (optional)
- Database: Firestore in Native mode

## Security Note
The rules above allow full read/write access for development. For production, implement proper security rules based on your authentication requirements.