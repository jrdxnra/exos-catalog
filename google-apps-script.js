// Google Apps Script for Gym Items Management
// Deploy this as a web app to handle gym item operations

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || 'add';
    const items = data.items || [];
    
    console.log('Received request:', { action, itemsCount: items.length });
    
    if (action === 'add') {
      return addItems(items);
    } else if (action === 'update') {
      return updateItems(items);
    } else if (action === 'delete') {
      return deleteItems(items);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Invalid action'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Simple GET endpoint for testing
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Google Apps Script is running',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function addItems(items) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Gym Items List');
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Sheet not found'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const newRows = [];
  
  items.forEach(item => {
    const row = [];
    headers.forEach(header => {
      row.push(item[header] || '');
    });
    newRows.push(row);
  });
  
  if (newRows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, headers.length).setValues(newRows);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: `Added ${newRows.length} items`
  })).setMimeType(ContentService.MimeType.JSON);
}

function updateItems(items) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Gym Items List');
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Sheet not found'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  let updatedCount = 0;
  
  items.forEach(item => {
    // Find the row to update based on Item Name and Gym
    const itemNameIndex = headers.indexOf('Item Name');
    const gymIndex = headers.indexOf('Gym');
    
    if (itemNameIndex === -1 || gymIndex === -1) {
      return;
    }
    
    for (let i = 0; i < data.length; i++) {
      if (data[i][itemNameIndex] === item['Item Name'] && data[i][gymIndex] === item['Gym']) {
        // Update the row
        const updatedRow = [];
        headers.forEach(header => {
          updatedRow.push(item[header] || data[i][headers.indexOf(header)] || '');
        });
        
        sheet.getRange(i + 2, 1, 1, headers.length).setValues([updatedRow]);
        updatedCount++;
        break;
      }
    }
  });
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: `Updated ${updatedCount} items`
  })).setMimeType(ContentService.MimeType.JSON);
}

function deleteItems(items) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Gym Items List');
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Sheet not found'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  let deletedCount = 0;
  
  // Sort rows to delete from bottom to top to avoid index issues
  const rowsToDelete = [];
  
  items.forEach(item => {
    const itemNameIndex = headers.indexOf('Item Name');
    const gymIndex = headers.indexOf('Gym');
    
    if (itemNameIndex === -1 || gymIndex === -1) {
      return;
    }
    
    for (let i = 0; i < data.length; i++) {
      if (data[i][itemNameIndex] === item['Item Name'] && data[i][gymIndex] === item['Gym']) {
        rowsToDelete.push(i + 2); // +2 because sheet data starts at row 2 and array is 0-indexed
        break;
      }
    }
  });
  
  // Delete rows from bottom to top
  rowsToDelete.sort((a, b) => b - a).forEach(rowNum => {
    sheet.deleteRow(rowNum);
    deletedCount++;
  });
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: `Deleted ${deletedCount} items`
  })).setMimeType(ContentService.MimeType.JSON);
}

// Helper function to get all items (for debugging)
function getAllItems() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Gym Items List');
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Sheet not found'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  
  const items = data.map(row => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = row[index];
    });
    return item;
  });
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    items: items
  })).setMimeType(ContentService.MimeType.JSON);
} 