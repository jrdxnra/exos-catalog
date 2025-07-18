import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

// Collection names
const COLLECTIONS = {
  CATALOG: 'catalog',
  GYM_ITEMS: 'gymItems'
};

// Firebase service class
class FirebaseService {
  
  // ===== CATALOG OPERATIONS =====
  
  // Get all catalog items
  async getCatalogItems() {
    try {
      console.log('Fetching catalog items from Firebase...');
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.CATALOG));
      
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('Fetched', items.length, 'catalog items from Firebase');
      return items;
    } catch (error) {
      console.error('Error fetching catalog items:', error);
      throw error;
    }
  }
  
  // Add catalog item
  async addCatalogItem(item) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.CATALOG), {
        ...item,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('Added catalog item with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding catalog item:', error);
      throw error;
    }
  }
  
  // Update catalog item
  async updateCatalogItem(id, updates) {
    try {
      const docRef = doc(db, COLLECTIONS.CATALOG, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      console.log('Updated catalog item:', id);
    } catch (error) {
      console.error('Error updating catalog item:', error);
      throw error;
    }
  }
  
  // Delete catalog item
  async deleteCatalogItem(id) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.CATALOG, id));
      console.log('Deleted catalog item:', id);
    } catch (error) {
      console.error('Error deleting catalog item:', error);
      throw error;
    }
  }
  
  // Clear all catalog items (for sync operations)
  async clearAllCatalogItems() {
    try {
      console.log('Clearing all catalog items from Firebase...');
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.CATALOG));
      
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log('Cleared all catalog items from Firebase');
    } catch (error) {
      console.error('Error clearing catalog items:', error);
      throw error;
    }
  }

  // Smart sync catalog items (only update changed items)
  async smartSyncCatalogItems(sheetsItems) {
    try {
      console.log('Starting smart sync of catalog items...');
      
      // Get existing items from Firebase
      const existingItems = await this.getCatalogItems();
      const existingItemsMap = new Map();
      existingItems.forEach(item => {
        existingItemsMap.set(item['EXOS Part Number'], item);
      });
      
      // Create a map of sheets items
      const sheetsItemsMap = new Map();
      sheetsItems.forEach(item => {
        sheetsItemsMap.set(item['EXOS Part Number'], item);
      });
      
      const batch = writeBatch(db);
      let addedCount = 0;
      let updatedCount = 0;
      let deletedCount = 0;
      let unchangedCount = 0;
      
      // Process each item from Google Sheets
      for (const [partNumber, sheetsItem] of sheetsItemsMap) {
        const existingItem = existingItemsMap.get(partNumber);
        
        if (!existingItem) {
          // New item - add it
          const docRef = doc(collection(db, COLLECTIONS.CATALOG));
          batch.set(docRef, {
            ...sheetsItem,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          addedCount++;
        } else {
          // Check if item has changed
          const hasChanged = this.hasItemChanged(existingItem, sheetsItem);
          
          if (hasChanged) {
            // Update existing item
            const docRef = doc(db, COLLECTIONS.CATALOG, existingItem.id);
            batch.update(docRef, {
              ...sheetsItem,
              updatedAt: serverTimestamp()
            });
            updatedCount++;
          } else {
            unchangedCount++;
          }
        }
      }
      
      // Check for items that exist in Firebase but not in Google Sheets (deletions)
      for (const [partNumber, existingItem] of existingItemsMap) {
        if (!sheetsItemsMap.has(partNumber)) {
          // Item was deleted from Google Sheets
          const docRef = doc(db, COLLECTIONS.CATALOG, existingItem.id);
          batch.delete(docRef);
          deletedCount++;
        }
      }
      
      // Commit all changes
      if (addedCount > 0 || updatedCount > 0 || deletedCount > 0) {
        await batch.commit();
        console.log(`Smart sync completed: ${addedCount} added, ${updatedCount} updated, ${deletedCount} deleted, ${unchangedCount} unchanged`);
      } else {
        console.log('Smart sync completed: No changes detected');
      }
      
      return {
        added: addedCount,
        updated: updatedCount,
        deleted: deletedCount,
        unchanged: unchangedCount,
        total: sheetsItems.length
      };
      
    } catch (error) {
      console.error('Error in smart sync:', error);
      throw error;
    }
  }

  // Apply only approved changes from sync approval modal
  async applyApprovedChanges(approvedChanges, sheetsItems) {
    try {
      console.log('Applying approved changes:', approvedChanges.length);
      console.log('Sample approved change:', approvedChanges[0]);
      console.log('Sample sheets item:', sheetsItems[0]);
      
      // Get fresh existing items from Firebase (don't use cached data)
      console.log('Fetching fresh data from Firebase for sync...');
      const existingItems = await this.getCatalogItems();
      const existingItemsMap = new Map();
      existingItems.forEach(item => {
        existingItemsMap.set(item['EXOS Part Number'], item);
      });
      
      // Also create a map by ID for quick lookup
      const existingItemsByIdMap = new Map();
      existingItems.forEach(item => {
        existingItemsByIdMap.set(item.id, item);
      });
      
      console.log('Fresh Firebase data loaded:', existingItems.length, 'items');
      
      // Create a map of sheets items for lookup
      const sheetsItemsMap = new Map();
      sheetsItems.forEach(item => {
        sheetsItemsMap.set(item['EXOS Part Number'], item);
      });
      
      console.log('Existing items count:', existingItems.length);
      console.log('Sheets items count:', sheetsItems.length);
      console.log('Sample existing item part number:', existingItems[0]?.['EXOS Part Number']);
      console.log('Sample sheets item part number:', sheetsItems[0]?.['EXOS Part Number']);
      
      // Debug: Check what part numbers are in the sheets data
      const sheetsPartNumbers = sheetsItems.map(item => item['EXOS Part Number']).slice(0, 10);
      console.log('First 10 sheets part numbers:', sheetsPartNumbers);
      
      // Debug: Check what part numbers are in the approved changes
      const approvedPartNumbers = approvedChanges.map(change => change.partNumber).slice(0, 10);
      console.log('First 10 approved part numbers:', approvedPartNumbers);
      
      // Debug: Check if any approved part numbers exist in sheets
      const foundInSheets = approvedPartNumbers.filter(pn => sheetsItemsMap.has(pn));
      console.log('Approved part numbers found in sheets:', foundInSheets.length, 'out of', approvedPartNumbers.length);
      
      const batch = writeBatch(db);
      let addedCount = 0;
      let updatedCount = 0;
      let deletedCount = 0;
      
      // Process each approved change
      for (const change of approvedChanges) {
        console.log(`Processing change: ${change.type} for part number: ${change.partNumber}`);
        
        // Skip any changes for documents that no longer exist in Firebase
        if (change.type === 'update') {
          const existingItem = existingItemsMap.get(change.partNumber);
          if (existingItem && !existingItemsByIdMap.has(existingItem.id)) {
            console.warn(`Skipping update for ${change.partNumber} - document ${existingItem.id} was deleted`);
            continue;
          }
        }
        
        if (change.type === 'add') {
          // Add new item
          const sheetsItem = sheetsItemsMap.get(change.partNumber);
          console.log('Found sheets item for add:', sheetsItem ? 'YES' : 'NO');
          if (sheetsItem) {
            const docRef = doc(collection(db, COLLECTIONS.CATALOG));
            batch.set(docRef, {
              ...sheetsItem,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            addedCount++;
            console.log('Added item to batch');
          }
        } else if (change.type === 'update') {
          // Update existing item - only update changed fields
          const existingItem = existingItemsMap.get(change.partNumber);
          const sheetsItem = sheetsItemsMap.get(change.partNumber);
          console.log('Found existing item for update:', existingItem ? 'YES' : 'NO');
          console.log('Found sheets item for update:', sheetsItem ? 'YES' : 'NO');
          
          // Skip if document was deleted by cleanup
          if (existingItem && !existingItemsByIdMap.has(existingItem.id)) {
            console.warn(`Document ${existingItem.id} was deleted, skipping update for ${change.partNumber}`);
            continue;
          }
          
          if (existingItem && sheetsItem) {
            
            console.log(`Processing update for ${change.partNumber} with document ID: ${existingItem.id}`);
            const docRef = doc(db, COLLECTIONS.CATALOG, existingItem.id);
            
            // Only include fields that have actually changed
            const fieldsToCompare = ['Item Name', 'Brand', 'Category', 'Cost', 'Preferred', 'URL'];
            const updateData = {
              updatedAt: serverTimestamp()
            };
            
            let hasChanges = false;
            for (const field of fieldsToCompare) {
              const existingValue = existingItem[field];
              const newValue = sheetsItem[field];
              
              if (field === 'Cost') {
                const existingCost = existingValue !== null && existingValue !== undefined ? String(existingValue) : '';
                const newCost = newValue !== null && newValue !== undefined ? String(newValue) : '';
                if (existingCost !== newCost) {
                  updateData[field] = newValue;
                  hasChanges = true;
                }
              } else {
                if (existingValue !== newValue) {
                  updateData[field] = newValue;
                  hasChanges = true;
                }
              }
            }
            
            // Only update if there are actual changes
            if (hasChanges) {
              console.log(`Adding update to batch for ${change.partNumber} (ID: ${existingItem.id})`);
              batch.update(docRef, updateData);
              updatedCount++;
            } else {
              console.log(`No changes detected for ${change.partNumber}, skipping update`);
            }
          } else {
            console.warn(`Missing data for ${change.partNumber}: existingItem=${!!existingItem}, sheetsItem=${!!sheetsItem}`);
          }
        } else if (change.type === 'delete') {
          // Delete existing item
          const existingItem = existingItemsMap.get(change.partNumber);
          console.log('Found existing item for delete:', existingItem ? 'YES' : 'NO');
          if (existingItem) {
            const docRef = doc(db, COLLECTIONS.CATALOG, existingItem.id);
            batch.delete(docRef);
            deletedCount++;
            console.log('Deleted item from batch');
          }
        }
      }
      
      // Commit all approved changes
      if (addedCount > 0 || updatedCount > 0 || deletedCount > 0) {
        console.log(`Committing batch with: ${addedCount} added, ${updatedCount} updated, ${deletedCount} deleted`);
        await batch.commit();
        console.log(`Approved changes applied: ${addedCount} added, ${updatedCount} updated, ${deletedCount} deleted`);
      } else {
        console.log('No approved changes to apply - batch is empty');
      }
      
      return {
        added: addedCount,
        updated: updatedCount,
        deleted: deletedCount,
        total: approvedChanges.length
      };
      
    } catch (error) {
      console.error('Error applying approved changes:', error);
      throw error;
    }
  }

  // Helper function to check if an item has changed
  hasItemChanged(existingItem, newItem) {
    const fieldsToCompare = ['Item Name', 'Brand', 'Category', 'Cost', 'Preferred', 'URL'];
    
    for (const field of fieldsToCompare) {
      const existingValue = existingItem[field];
      const newValue = newItem[field];
      
      // Handle different data types (string vs number for Cost)
      if (field === 'Cost') {
        const existingCost = existingValue !== null && existingValue !== undefined ? String(existingValue) : '';
        const newCost = newValue !== null && newValue !== undefined ? String(newValue) : '';
        if (existingCost !== newCost) {
          return true;
        }
      } else {
        // For other fields, do direct comparison
        if (existingValue !== newValue) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  // ===== GYM ITEMS OPERATIONS =====
  
  // Get all gym items
  async getGymItems() {
    try {
      console.log('Fetching gym items from Firebase...');
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.GYM_ITEMS));
      
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('Fetched', items.length, 'gym items from Firebase');
      return items;
    } catch (error) {
      console.error('Error fetching gym items:', error);
      throw error;
    }
  }
  
  // Get gym items by gym
  async getGymItemsByGym(gym) {
    try {
      const q = query(
        collection(db, COLLECTIONS.GYM_ITEMS),
        where('Gym', '==', gym),
        orderBy('Item Name')
      );
      
      const querySnapshot = await getDocs(q);
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('Fetched', items.length, 'items for gym:', gym);
      return items;
    } catch (error) {
      console.error('Error fetching gym items by gym:', error);
      throw error;
    }
  }
  
  // Add gym item
  async addGymItem(item) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.GYM_ITEMS), {
        ...item,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('Added gym item with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding gym item:', error);
      throw error;
    }
  }
  
  // Update gym item
  async updateGymItem(id, updates) {
    try {
      const docRef = doc(db, COLLECTIONS.GYM_ITEMS, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      console.log('Updated gym item:', id);
    } catch (error) {
      console.error('Error updating gym item:', error);
      throw error;
    }
  }
  
  // Delete gym item
  async deleteGymItem(id) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.GYM_ITEMS, id));
      console.log('Deleted gym item:', id);
    } catch (error) {
      console.error('Error deleting gym item:', error);
      throw error;
    }
  }
  
  // Batch operations for gym items
  async batchUpdateGymItems(items) {
    try {
      console.log('Starting batch update for', items.length, 'items');
      const batch = writeBatch(db);
      
      // First, delete all existing items
      const existingItems = await this.getGymItems();
      existingItems.forEach(item => {
        const docRef = doc(db, COLLECTIONS.GYM_ITEMS, item.id);
        batch.delete(docRef);
      });
      
      // Then add new items
      items.forEach(item => {
        const docRef = doc(collection(db, COLLECTIONS.GYM_ITEMS));
        batch.set(docRef, {
          ...item,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      console.log('Batch update completed successfully');
    } catch (error) {
      console.error('Error in batch update:', error);
      throw error;
    }
  }
  
  // ===== UTILITY FUNCTIONS =====
  
  // Convert SheetDB format to Firebase format
  convertSheetDBToFirebase(sheetDBItem) {
    return {
      "Item Name": sheetDBItem["Item Name"] || "",
      "Brand": sheetDBItem["Brand"] || "",
      "Category": sheetDBItem["Category"] || "",
      "Cost": sheetDBItem["Cost"] || "",
      "EXOS Part Number": sheetDBItem["EXOS Part Number"] || "",
      "URL": sheetDBItem["URL"] || "",
      "Preferred": sheetDBItem["Preferred"] || "",
      "Gym": sheetDBItem["Gym"] || "",
      "Quantity": parseInt(sheetDBItem["Quantity"]) || 1,
      "Status": sheetDBItem["Status"] || "Pending Approval",
      "Note": sheetDBItem["Note"] || ""
    };
  }
  
  // Convert Firebase format to app format
  convertFirebaseToApp(firebaseItem) {
    return {
      "Item Name": firebaseItem["Item Name"] || "",
      "Brand": firebaseItem["Brand"] || "",
      "Category": firebaseItem["Category"] || "",
      "Cost": firebaseItem["Cost"] || "",
      "EXOS Part Number": firebaseItem["EXOS Part Number"] || "",
      "URL": firebaseItem["URL"] || "",
      "Preferred": firebaseItem["Preferred"] || "",
      "Gym": firebaseItem["Gym"] || "",
      "quantity": parseInt(firebaseItem["Quantity"]) || 1,
      "status": firebaseItem["Status"] || "Pending Approval",
      "note": firebaseItem["Note"] || ""
    };
  }
}

const firebaseService = new FirebaseService();
export default firebaseService; 