// Configuration file for the gym equipment manager app

export const CONFIG = {
  // Firebase Configuration
  FIREBASE: {
    // Firebase is the primary and only database
    ENABLED: true,
    
    // Firebase config will be loaded from src/firebase.js
    // Update the firebaseConfig object in that file with your actual Firebase project details
  
    // Status indicator settings
    STATUS_INDICATOR: {
      // Show Firebase status in the UI
      SHOW_STATUS: true,
      
      // Position of status indicator: 'top-right', 'top-left', 'bottom-right', 'bottom-left'
      POSITION: 'top-right',
      
      // Auto-hide notification after seconds (0 = don't auto-hide)
      AUTO_HIDE_SECONDS: 10,
    }
  },
    
  // Google Sheets Integration (for data import/export)
  GOOGLE_SHEETS: {
    // Google Apps Script URL for importing catalog data
    CATALOG_IMPORT_URL: 'https://script.google.com/macros/s/AKfycbwb5tO94xJoihX0qX3CjPE6BHvaTAtlh7M_oaZtNA9-F2AB387CcJzHbVuqxJFVjZK0/exec',
    
    // Google Apps Script URL for updating catalog data
    CATALOG_UPDATE_URL: 'https://script.google.com/macros/s/AKfycbwb5tO94xJoihX0qX3CjPE6BHvaTAtlh7M_oaZtNA9-F2AB387CcJzHbVuqxJFVjZK0/exec',
    
    // Direct Google Sheets URL for manual editing
    SHEETS_URL: 'https://docs.google.com/spreadsheets/d/1upZrYCdpe9BR9pSKm3dWkIRLD8K3AZyc4gmrzag_ANg/edit?usp=sharing',
  },
  
  // Local Storage Configuration
  STORAGE: {
    // Cache duration for catalog data (30 minutes)
    CACHE_DURATION: 30 * 60 * 1000,
    
    // Local storage key for cached products
    LOCAL_STORAGE_KEY: 'cachedProducts',
  },
  
  // App Configuration
  APP: {
    // Number of items to load per batch for infinite scroll
    ITEMS_PER_LOAD: 6,
    
    // Gyms available in the system
    GYMS: ['MP2', 'MAT3', 'MP5', 'HMBLT', 'CRSM', 'TM3', 'MPD237'],
    
    // Default status for new items
    DEFAULT_STATUS: 'Pending Approval',
  },
  
  // Notification Configuration
  NOTIFICATIONS: {
    // Enable/disable notification system
    ENABLED: true,
    
    // Notification types
    TYPES: {
      TAG: {
        ENABLED: true,
        SUBJECT: 'You have been tagged in a gym equipment request',
        TEMPLATE: `
Dear {userName},

You have been tagged in a gym equipment request by {taggerName}.

**Details:**
- Gym: {gymName}
- Item: {itemName}
- Brand: {itemBrand}
- Part Number: {partNumber}
- Status: {itemStatus}
- Justification: {justification}

**Note from {taggerName}:**
{noteText}

**Action Required:**
Please review this request and take appropriate action.

**Direct Link:**
{appLink}

Best regards,
Gym Equipment Management System
        `,
        EMAIL_FROM: 'noreply@gymequipment.com',
        EMAIL_FROM_NAME: 'Gym Equipment Manager'
      },
      APPROVAL: {
        ENABLED: true,
        SUBJECT: 'Gym equipment request requires your approval',
        TEMPLATE: `
Dear {userName},

A gym equipment request requires your approval.

**Request Details:**
- Gym: {gymName}
- Item: {itemName}
- Requested by: {requesterName}
- Quantity: {quantity}
- Total Cost: {totalCost}

**Justification:**
{justification}

**Notes:**
{notes}

**Action Required:**
Please review and approve/reject this request.

**Direct Link:**
{appLink}

Best regards,
Gym Equipment Management System
        `
      }
    },
    
    // Email service configuration (for future implementation)
    EMAIL_SERVICE: {
      PROVIDER: 'sendgrid', // 'sendgrid', 'mailgun', 'smtp'
      API_KEY: process.env.REACT_APP_SENDGRID_API_KEY || '',
      FROM_EMAIL: 'noreply@gymequipment.com',
      FROM_NAME: 'Gym Equipment Manager'
    },
    
    // Notification review settings
    REVIEW: {
      // Require approval before sending notifications
      REQUIRE_APPROVAL: false,
      
      // Auto-send after approval
      AUTO_SEND: true,
      
      // Notification queue timeout (24 hours)
      QUEUE_TIMEOUT: 24 * 60 * 60 * 1000
    }
  },
  
  // Gym Managers Configuration
  GYM_MANAGERS: {
    // Performance Managers (PM) for each gym
    PERFORMANCE_MANAGERS: {
      'MP2': { id: 'john', name: 'John Smith', email: 'john@exos.com' },
      'MAT3': { id: 'sarah', name: 'Sarah Johnson', email: 'sarah@exos.com' },
      'MP5': { id: 'mike', name: 'Mike Davis', email: 'mike@exos.com' },
      'HMBLT': { id: 'lisa', name: 'Lisa Wilson', email: 'lisa@exos.com' },
      'CRSM': { id: 'david', name: 'David Brown', email: 'david@exos.com' },
      'TM3': { id: 'emma', name: 'Emma Thompson', email: 'emma@exos.com' },
      'MPD237': { id: 'frank', name: 'Frank Miller', email: 'frank@exos.com' },
    },
    
    // Operations Managers (OM) for each gym
    OPERATIONS_MANAGERS: {
      'MP2': { id: 'alex', name: 'Alex Rodriguez', email: 'alex@exos.com' },
      'MAT3': { id: 'jessica', name: 'Jessica Lee', email: 'jessica@exos.com' },
      'MP5': { id: 'tom', name: 'Tom Wilson', email: 'tom@exos.com' },
      'HMBLT': { id: 'rachel', name: 'Rachel Green', email: 'rachel@exos.com' },
      'CRSM': { id: 'chris', name: 'Chris Martin', email: 'chris@exos.com' },
      'TM3': { id: 'diana', name: 'Diana Prince', email: 'diana@exos.com' },
      'MPD237': { id: 'grace', name: 'Grace Chen', email: 'grace@exos.com' },
    }
  },
  
  // Approval Workflow Configuration
  APPROVAL_WORKFLOW: {
    // Enable/disable approval workflow
    ENABLED: true,
    
    // Approval stages
    STAGES: [
      {
        name: 'PM_APPROVAL',
        label: 'Performance Manager Approval',
        description: 'Performance Manager reviews justification and approves/rejects',
        required: true,
        order: 1
      },
      {
        name: 'OM_APPROVAL', 
        label: 'Operations Manager Approval',
        description: 'Operations Manager reviews and final approval',
        required: true,
        order: 2
      }
    ],
    
    // Auto-notify managers when items are added
    AUTO_NOTIFY_MANAGERS: true,
    
    // Allow managers to add notes during approval
    ALLOW_MANAGER_NOTES: true,
    
    // Timeout for approval requests (7 days)
    APPROVAL_TIMEOUT: 7 * 24 * 60 * 60 * 1000,
  },
  
  // Tagging System Configuration
  TAGGING: {
    // Enable/disable tagging system
    ENABLED: true,
    
    // Available users for tagging
    AVAILABLE_USERS: [
      { id: 'john', name: 'John Smith', email: 'john@exos.com' },
      { id: 'sarah', name: 'Sarah Johnson', email: 'sarah@exos.com' },
      { id: 'mike', name: 'Mike Davis', email: 'mike@exos.com' },
      { id: 'lisa', name: 'Lisa Wilson', email: 'lisa@exos.com' },
      { id: 'david', name: 'David Brown', email: 'david@exos.com' },
      { id: 'emma', name: 'Emma Thompson', email: 'emma@exos.com' },
      { id: 'alex', name: 'Alex Rodriguez', email: 'alex@exos.com' },
      { id: 'jessica', name: 'Jessica Lee', email: 'jessica@exos.com' },
      { id: 'tom', name: 'Tom Wilson', email: 'tom@exos.com' },
      { id: 'rachel', name: 'Rachel Green', email: 'rachel@exos.com' },
      { id: 'chris', name: 'Chris Martin', email: 'chris@exos.com' },
      { id: 'diana', name: 'Diana Prince', email: 'diana@exos.com' },
    ],
    
    // Tagging behavior settings
    SETTINGS: {
      // Maximum number of suggestions to show
      MAX_SUGGESTIONS: 5,
      
      // Search behavior
      ALLOW_FIRST_NAME: true,
      ALLOW_LAST_NAME: true,
      ALLOW_EMAIL: true,
      
      // Display format for tags
      DISPLAY_FORMAT: 'name', // 'name', 'email', 'id'
      
      // Highlight tags in notes
      HIGHLIGHT_TAGS: true,
      
      // Tag color for highlighting
      TAG_COLOR: '#007bff',
      TAG_BACKGROUND: '#e3f2fd'
    }
  },
  
  // Debug Configuration
  DEBUG: {
    // Enable detailed console logging
    ENABLE_LOGGING: true,
    
    // Show Firebase connection status in console
    SHOW_FIREBASE_STATUS: true,
  }
};

export default CONFIG; 