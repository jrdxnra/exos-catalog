function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function doOptions(e) {
  // Handle CORS preflight requests
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
    .setHeader('Access-Control-Max-Age', '86400');
}

function handleRequest(e) {
  try {
    // Set CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    
    // Get the action from parameters
    const action = e.parameter.action || e.parameter.data?.action;
    
    if (action === 'getCatalog') {
      return getCatalog(headers);
    } else if (action === 'updateItem') {
      return updateItem(e, headers);
    } else {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: 'Invalid action' }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(headers);
    }
  } catch (error) {
    console.error('Error in handleRequest:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');
  }
}

function getCatalog(headers) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Equipment List');
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false, 
          error: 'Equipment List sheet not found' 
        }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(headers);
    }
    
    const data = sheet.getDataRange().getValues();
    const headers_row = data[0];
    const items = [];
    
    // Start from row 2 (index 1) to skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const item = {};
      
      headers_row.forEach((header, index) => {
        if (header && row[index] !== undefined) {
          item[header] = row[index];
        }
      });
      
      if (item['Item Name'] && item['Item Name'].toString().trim() !== '') {
        items.push(item);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        items: items 
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
      
  } catch (error) {
    console.error('Error in getCatalog:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
  }
}

function updateItem(e, headers) {
  try {
    // Parse the form data
    let updateData;
    if (e.parameter.data) {
      // If data is passed as a parameter
      updateData = JSON.parse(e.parameter.data);
    } else {
      // Try to parse from post data
      const postData = e.postData?.getDataAsString();
      if (postData) {
        try {
          updateData = JSON.parse(postData);
        } catch (parseError) {
          // If JSON parsing fails, try to parse form data
          const formData = new URLSearchParams(postData);
          updateData = {};
          formData.forEach((value, key) => {
            updateData[key] = value;
          });
        }
      }
    }
    
    if (!updateData || !updateData['EXOS Part Number']) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false, 
          error: 'Missing EXOS Part Number' 
        }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(headers);
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Equipment List');
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false, 
          error: 'Equipment List sheet not found' 
        }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(headers);
    }
    
    const data = sheet.getDataRange().getValues();
    const headers_row = data[0];
    
    // Find the row with the matching part number
    let rowIndex = -1;
    const partNumberColIndex = headers_row.findIndex(header => header === 'EXOS Part Number');
    
    if (partNumberColIndex === -1) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false, 
          error: 'EXOS Part Number column not found' 
        }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(headers);
    }
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][partNumberColIndex] && data[i][partNumberColIndex].toString().trim() === updateData['EXOS Part Number'].toString().trim()) {
        rowIndex = i + 1; // +1 because sheet rows are 1-indexed
        break;
      }
    }
    
    if (rowIndex === -1) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false, 
          error: 'Item not found with EXOS Part Number: ' + updateData['EXOS Part Number'] 
        }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(headers);
    }
    
    // Update the row with new data
    const fieldsToUpdate = ['Item Name', 'Brand', 'Category', 'Cost', 'URL', 'Preferred'];
    
    fieldsToUpdate.forEach(field => {
      const colIndex = headers_row.findIndex(header => header === field);
      if (colIndex !== -1 && updateData[field] !== undefined) {
        sheet.getRange(rowIndex, colIndex + 1).setValue(updateData[field]);
      }
    });
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        message: 'Item updated successfully',
        partNumber: updateData['EXOS Part Number']
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
      
  } catch (error) {
    console.error('Error in updateItem:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
  }
} 