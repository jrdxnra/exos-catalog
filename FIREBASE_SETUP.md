# Firebase Setup Guide

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "gym-equipment-manager")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Cloud Firestore Database

1. In your Firebase project, click on "Cloud Firestore Database" in the left sidebar
2. Click "Create database"
3. Select a location close to your users
4. Choose "Start in test mode" (we'll add security rules later)
5. Click "Done"

## Step 3: Get Your Firebase Configuration

1. In your Firebase project, click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>)
5. Register your app with a nickname (e.g., "gym-equipment-web")
6. Copy the firebaseConfig object

## Step 4: Update Firebase Configuration

1. Open `src/firebase.js`
2. Replace the placeholder config with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

## Step 5: Test Firebase Connection

1. Start your development server: `npm start`
2. Open the browser console
3. The app will automatically test the Firebase connection
4. You should see "Firebase connection successful!" in the console

## Step 6: Migrate Your Data (Optional)

If you want to migrate your existing SheetDB data to Firebase:

1. The app will automatically attempt to migrate data on first load
2. Check the console for migration status
3. Your existing gym items and catalog data will be preserved

## Step 7: Security Rules (Recommended)

In the Firebase Console, go to Cloud Firestore Database > Rules and update them:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all users under any document
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Note:** This is for development. For production, you should implement proper authentication and security rules.

## Benefits of Firebase over SheetDB

1. **No Rate Limits**: Firebase free tier includes 50,000 reads and 20,000 writes per day
2. **Real-time Updates**: Data can be synchronized in real-time across devices
3. **Better Performance**: Faster queries and better scalability
4. **Offline Support**: Data can be cached and synced when online
5. **Better Error Handling**: More reliable and detailed error messages
6. **Future Features**: Easy to add authentication, file storage, etc.

## Troubleshooting

### Common Issues:

1. **"Firebase connection failed"**
   - Check your firebaseConfig in `src/firebase.js`
   - Ensure Cloud Firestore Database is enabled in your Firebase project
   - Check browser console for specific error messages

2. **"Permission denied"**
   - Make sure Firestore rules allow read/write access
   - Check that your project is in test mode

3. **"Network error"**
   - Check your internet connection
   - Ensure Firebase project is in the correct region

### Getting Help:

- Check the [Firebase Documentation](https://firebase.google.com/docs)
- Review the browser console for detailed error messages
- The app includes fallback to mock data if Firebase is unavailable

## Next Steps

Once Firebase is working:

1. Test adding items to gyms
2. Test the save functionality
3. Verify data persistence across browser sessions
4. Consider adding user authentication for production use

## Configuration Options

You can customize Firebase behavior in `src/config.js`:

```javascript
export const CONFIG = {
  FIREBASE: {
    ENABLED: true, // Set to false to disable Firebase and use only SheetDB
  },
  // ... other config options
};
```

## Migration Status

The app will show migration status in the console:

- ✅ **Firebase connection successful!** - Firebase is working
- ❌ **Firebase connection failed** - Check your configuration
- 📊 **Migrated X items** - Data migration completed
- 🔄 **Using SheetDB fallback** - Firebase unavailable, using backup

## Performance Tips

1. **Enable Caching**: The app automatically caches data in localStorage
2. **Batch Operations**: Large updates are batched for better performance
3. **Offline Support**: Data works offline and syncs when connection returns
4. **Retry Logic**: Automatic retries with exponential backoff for failed requests 