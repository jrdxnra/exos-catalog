# Gym Equipment Manager

A React application for managing gym equipment inventory across multiple locations. The app uses **Firebase Cloud Firestore** as the primary database with **Google Sheets integration** for data import and coach accessibility.

## 🏗️ Architecture Overview

The app uses a **Firebase-first approach** designed for optimal performance and reliability:

### Data Flow Strategy

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Google Sheets │    │     Firebase    │    │   React App     │
│   (Import Only) │───►│  (Primary DB)   │◄──►│   (Frontend)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Why This Approach?

**For Performance (Firebase):**
- ✅ **Fast performance** - Real-time database with instant updates
- ✅ **Reliable** - Enterprise-grade infrastructure
- ✅ **Scalable** - Can handle thousands of users
- ✅ **Offline support** - Works without internet connection
- ✅ **Real-time sync** - Instant synchronization across users
- ✅ **No rate limits** - Generous free tier limits

**For Data Import (Google Sheets):**
- ✅ **Easy data entry** - Coaches can add items via familiar spreadsheet interface
- ✅ **Bulk import** - Import large catalogs at once
- ✅ **Version control** - Google Sheets maintains edit history
- ✅ **Collaboration** - Multiple people can contribute data
- ✅ **Mobile friendly** - Can edit from phones/tablets

## Features

- **Equipment Catalog**: Browse and search through equipment items with filtering by category, brand, and preference status
- **Multi-Gym Support**: Manage equipment for multiple gym locations (MP2, MAT3, MP5, HMBLT, CRSM, TM3, MPD237)
- **Inventory Management**: Add items to gyms with quantity tracking and status management
- **Real-time Updates**: Data is synchronized across all users instantly
- **Responsive Design**: Works on desktop and mobile devices
- **Infinite Scroll**: Efficient loading of large equipment catalogs
- **Search & Filter**: Advanced filtering and search capabilities
- **Product Editing**: Edit product details directly in the app
- **Performance Optimized**: Fast loading and real-time updates via Firebase

## Technology Stack

- **Frontend**: React 18 with hooks and functional components
- **Database**: Firebase Cloud Firestore (primary)
- **Data Import**: Google Sheets via Google Apps Script
- **Styling**: CSS3 with modern design patterns
- **Deployment**: Vercel with Speed Insights
- **Caching**: LocalStorage for offline capability
- **Real-time Sync**: Firebase real-time listeners

## Data Architecture

### Catalog Data (Equipment List)
```
Google Sheets → Firebase → React App
     ↑              ↓
  (Import)      (Primary DB)
```

**Flow:**
1. **Coaches add items** to Google Sheets
2. **App imports** data to Firebase on startup (if Firebase is empty)
3. **App reads/writes** directly to Firebase for performance
4. **Manual import** available for new data from Google Sheets

### Gym Items Data (Requests/Inventory)
```
React App → Firebase
    ↑          ↓
(User Input) (Primary DB)
```

**Flow:**
1. **Users add items** to gyms via the app
2. **Data saves** directly to Firebase
3. **Real-time updates** across all users

## Configuration

The Firebase-first approach is configured in `src/config.js`:

```javascript
export const CONFIG = {
  FIREBASE: {
    ENABLED: true, // Firebase is the primary database
    STATUS_INDICATOR: {
      SHOW_STATUS: true,
      POSITION: 'top-right',
      AUTO_HIDE_SECONDS: 10,
    }
  },
  GOOGLE_SHEETS: {
    CATALOG_IMPORT_URL: 'https://script.google.com/...', // For importing catalog data
    SHEETS_URL: 'https://docs.google.com/spreadsheets/...', // Direct link for editing
  },
  APP: {
    GYMS: ['MP2', 'MAT3', 'MP5', 'HMBLT', 'CRSM', 'TM3', 'MPD237'],
    DEFAULT_STATUS: 'Pending Approval',
  }
};
```

## 🔥 Firebase Usage & Limits

### Firebase Status Indicator

The app includes a **real-time Firebase status indicator** that shows connection status:

#### **Status Indicator Features:**
- **Visual indicator** in top-right corner showing Firebase connection status
- **Green dot** = Firebase connected (full features available)
- **Red pulsing dot** = Firebase offline (limited mode)
- **Click to retry** connection when offline
- **Auto-notification** when connection issues occur

### Current Free Tier Limits (Spark Plan)

**Daily Limits:**
- **50,000 reads/day** (1.5M reads/month)
- **20,000 writes/day** (600K writes/month)
- **20,000 deletes/day** (600K deletes/month)
- **1GB stored data**
- **10GB/month data transfer**

### Current Usage Patterns (Conservative Estimates)

#### Read Operations
**Daily Read Estimates:**
- **App Startup**: ~2 reads (catalog + gym items)
- **User Sessions**: ~1 read per session (catalog cache)
- **Gym Items Loading**: ~1 read per gym tab switch
- **Infinite Scroll**: ~1 read per 6 items loaded

**Conservative Daily Estimate:**
- 10 users × 3 sessions/day × 2 reads = **60 reads/day**
- 5 gym tab switches × 1 read = **5 reads/day**
- Infinite scroll loads × 2 reads = **10 reads/day**
- **Total: ~75 reads/day** (0.15% of limit)

#### Write Operations
**Daily Write Estimates:**
- **Product Updates**: ~10 updates/day = **10 writes/day**
- **Gym Items Saves**: ~5 saves/day × 50 items = **250 writes/day**
- **Status Updates**: ~20 updates/day = **20 writes/day**
- **Batch Operations**: ~1 batch/day × 100 items = **100 writes/day**

**Conservative Daily Estimate:**
- **Total: ~380 writes/day** (1.9% of limit)

#### Delete Operations
**Daily Delete Estimates:**
- **Batch Updates**: ~1 batch/day × 50 items = **50 deletes/day**
- **Item Removals**: ~10 removals/day = **10 deletes/day**

**Conservative Daily Estimate:**
- **Total: ~60 deletes/day** (0.3% of limit)

### Current Usage vs Limits Summary

| Operation | Daily Usage | Daily Limit | Usage % |
|-----------|-------------|-------------|---------|
| **Reads** | ~75/day | 50,000/day | **0.15%** |
| **Writes** | ~380/day | 20,000/day | **1.9%** |
| **Deletes** | ~60/day | 20,000/day | **0.3%** |

### Optimizations Already in Place

#### Read Optimizations
✅ **LocalStorage caching** (30-minute cache)  
✅ **Single catalog read** per session  
✅ **Efficient queries** (no unnecessary reads)  
✅ **Real-time listeners** for live updates  

#### Write Optimizations
✅ **Batch operations** (single write for multiple items)  
✅ **Smart updates** (only write when needed)  
✅ **Local state management** (reduces writes)  

#### Delete Optimizations
✅ **Batch deletes** (efficient bulk operations)  
✅ **Soft deletes** (quantity = 0 instead of actual delete)  

### Scaling Considerations

#### Current Capacity
- **Easily supports 100+ daily active users**
- **Could handle 500+ users before hitting limits**
- **Very efficient usage patterns**

#### When to Consider Upgrading

**At ~1,000 daily active users:**
- Reads: ~7,500/day (15% of limit)
- Writes: ~3,800/day (19% of limit)
- **Still well within free tier**

**At ~5,000 daily active users:**
- Reads: ~37,500/day (75% of limit)
- Writes: ~19,000/day (95% of limit)
- **Getting close to limits**

#### Monitoring Usage
1. **Firebase Console**: Real-time usage monitoring
2. **Usage Alerts**: Set up notifications at 80% of limits
3. **Performance Monitoring**: Track query performance
4. **Cost Analysis**: Monitor when approaching limits

## Setup Instructions

### 1. Firebase Setup (Primary Database)

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Cloud Firestore Database in test mode

2. **Configure Firebase**:
   - Get your Firebase config from Project Settings
   - Update `src/firebase.js` with your actual configuration

3. **Test Connection**:
   - Start the app: `npm start`
   - Check browser console for Firebase connection status
   - The app will automatically import data from Google Sheets if Firebase is empty

### 2. Google Sheets Setup (For Data Import)

1. **Create Google Sheet**:
   - Create a new Google Sheet
   - Set up columns: Item Name, Brand, Category, Cost, Exos Part Number, Preferred, URL
   - Share with coaches (view/edit access)

2. **Set up Google Apps Script**:
   - Create a Google Apps Script to expose the sheet data as JSON
   - Update the script URL in `src/config.js`

3. **Test Data Import**:
   - Add some test data to Google Sheets
   - Start the app and verify data imports to Firebase

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd my-react-app
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase and Google Sheets (see setup instructions above)

4. Start the development server:
```bash
npm start
```

5. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Usage

### For Coaches (Google Sheets)

**Adding Equipment to Catalog:**
1. Open the Google Sheet shared with you
2. Add new rows with equipment details
3. Save changes
4. The app will import new data on next startup (if Firebase is empty)

**Viewing Requests:**
1. Use the app's "Google Sheets" link in the menu
2. Navigate to the appropriate sheet tab
3. See all equipment requests and their statuses

### For App Users

**Adding Equipment to Gyms:**
1. Browse the equipment catalog using filters and search
2. Click "Add to Gym" on any equipment item
3. Select the target gym and quantity
4. Set approval status (Pending Approval, Approved, Not Approved)
5. Add notes if needed
6. Click "Save" to sync changes to Firebase

**Managing Gym Inventory:**
1. Open the sidebar and switch to the "Gyms" tab
2. Select a gym to view its current inventory
3. Modify quantities, statuses, or remove items
4. Click "Save" to update Firebase

**Editing Product Details:**
1. Click the three-dot menu on any product card
2. Select "Edit Mode" to enable editing
3. Modify product details (URL, preferred status, etc.)
4. Click "Save" to update Firebase

### Filtering and Search

- Use the sidebar filters to narrow down equipment by category or brand
- Use the search bar to find specific items by name, brand, or part number
- Toggle between "Preferred Only" and "All Items" views

## Data Management

The app handles data management through Firebase:

### Automatic Data Import

1. **On App Startup**: If Firebase catalog is empty, automatically imports from Google Sheets
2. **Data Migration**: Existing data is preserved and enhanced with Firebase features
3. **Real-time Updates**: All changes are immediately reflected across all users

### Manual Data Import

If you need to import new data from Google Sheets:

1. **Clear Firebase Data**: (if needed) Clear the catalog collection in Firebase Console
2. **Restart App**: The app will automatically import fresh data from Google Sheets
3. **Verify Import**: Check that all data has been imported correctly

## Troubleshooting

### Common Issues

1. **Firebase Connection Failed**
   - Check your Firebase configuration in `src/firebase.js`
   - Ensure Firestore is enabled in your Firebase project
   - Verify your project is in test mode
   - Check browser console for detailed error messages

2. **Data Not Loading**
   - Check Firebase connection status indicator
   - Verify Firestore rules allow read/write access
   - Check browser console for error messages
   - Try refreshing the page

3. **Google Sheets Import Not Working**
   - Verify the Google Apps Script URL in config.js
   - Check that the Google Sheet is properly shared
   - Ensure the sheet has the correct column structure

4. **Approaching Firebase Limits**
   - Monitor usage in Firebase Console
   - Implement additional caching strategies
   - Consider upgrading to Blaze plan
   - Optimize batch operations

### Getting Help

- Check the browser console for detailed error messages
- Review the Firebase Console for usage and error logs
- The app includes comprehensive logging for debugging

## Development

### Project Structure

```
src/
├── components/          # React components
│   ├── Navigation.js   # Main navigation
│   ├── Sidebar.js      # Filters and gym management
│   ├── ProductCard.js  # Equipment item display
│   └── ...
├── services/           # Data services
│   ├── firebaseService.js    # Firebase operations
│   └── notificationService.js # Email notifications
├── utils/              # Utility functions
│   └── migrationUtils.js     # Data migration tools
├── config.js           # App configuration
├── firebase.js         # Firebase configuration
└── App.js              # Main application component
```

### Key Files

- `src/firebase.js` - Firebase configuration
- `src/services/firebaseService.js` - Database operations
- `src/utils/migrationUtils.js` - Data migration utilities
- `src/config.js` - App configuration

### Adding New Features

When adding new features, consider the Firebase-first architecture:

1. **Data storage**: Use Firebase for all persistent data
2. **Real-time features**: Leverage Firebase real-time listeners
3. **Performance**: Optimize for Firebase's strengths
4. **Offline support**: Use Firebase's offline capabilities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with Firebase
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.