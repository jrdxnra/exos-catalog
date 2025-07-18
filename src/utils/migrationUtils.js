import firebaseService from '../services/firebaseService';

// Migration utility for moving data from SheetDB to Firebase
export class MigrationUtils {
  
  // Migrate catalog data from SheetDB format to Firebase
  static async migrateCatalogData(sheetDBData) {
    try {
      console.log('Starting catalog migration...');
      console.log('Source data count:', sheetDBData.length);
      
      const migratedItems = [];
      
      for (const item of sheetDBData) {
        // Skip empty or invalid items
        if (!item["Item Name"] || item["Item Name"].trim() === '') {
          continue;
        }
        
        const firebaseItem = firebaseService.convertSheetDBToFirebase(item);
        migratedItems.push(firebaseItem);
      }
      
      console.log('Processed', migratedItems.length, 'valid catalog items');
      
      // Add items to Firebase
      const addedIds = [];
      for (const item of migratedItems) {
        try {
          const id = await firebaseService.addCatalogItem(item);
          addedIds.push(id);
        } catch (error) {
          console.error('Failed to add catalog item:', item["Item Name"], error);
        }
      }
      
      console.log('Successfully migrated', addedIds.length, 'catalog items to Firebase');
      return addedIds;
      
    } catch (error) {
      console.error('Catalog migration failed:', error);
      throw error;
    }
  }
  
  // Migrate gym items data from SheetDB format to Firebase
  static async migrateGymItemsData(sheetDBData) {
    try {
      console.log('Starting gym items migration...');
      console.log('Source data count:', sheetDBData.length);
      
      const migratedItems = [];
      
      for (const item of sheetDBData) {
        // Skip empty sheet indicators
        if (item["Item Name"] === "EMPTY_SHEET" || !item["Item Name"]) {
          continue;
        }
        
        const firebaseItem = firebaseService.convertSheetDBToFirebase(item);
        migratedItems.push(firebaseItem);
      }
      
      console.log('Processed', migratedItems.length, 'valid gym items');
      
      // Use batch operation for better performance
      if (migratedItems.length > 0) {
        await firebaseService.batchUpdateGymItems(migratedItems);
        console.log('Successfully migrated', migratedItems.length, 'gym items to Firebase');
      } else {
        console.log('No gym items to migrate');
      }
      
      return migratedItems.length;
      
    } catch (error) {
      console.error('Gym items migration failed:', error);
      throw error;
    }
  }
  
  // Export current Firebase data back to SheetDB format (for backup)
  static async exportFirebaseData() {
    try {
      console.log('Exporting Firebase data...');
      
      // Get catalog data
      const catalogItems = await firebaseService.getCatalogItems();
      console.log('Exported', catalogItems.length, 'catalog items');
      
      // Get gym items
      const gymItems = await firebaseService.getGymItems();
      console.log('Exported', gymItems.length, 'gym items');
      
      return {
        catalog: catalogItems,
        gymItems: gymItems
      };
      
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }
  
  // Validate Firebase connection
  static async testFirebaseConnection() {
    try {
      console.log('Testing Firebase connection...');
      
      // Try to fetch a small amount of data
      const catalogItems = await firebaseService.getCatalogItems();
      const gymItems = await firebaseService.getGymItems();
      
      console.log('Firebase connection successful!');
      console.log('Catalog items:', catalogItems.length);
      console.log('Gym items:', gymItems.length);
      
      return {
        success: true,
        catalogCount: catalogItems.length,
        gymItemsCount: gymItems.length
      };
      
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default MigrationUtils; 