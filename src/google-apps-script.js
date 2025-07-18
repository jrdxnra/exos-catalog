// Google Apps Script for Gym Equipment Manager
// This script handles both reading catalog data and updating individual products

function doGet(e) {
  // Handle GET requests (reading catalog data)
  return handleGetRequest(e);
}

function doPost(e) {
  // Handle POST requests (updating products)
  return handlePostRequest(e);
}

function handleGetRequest(e) {
  try {
    // Get the spreadsheet
    const spreadsheet = SpreadsheetApp.openById('1upZrYCdpe9BR9pSKm3dWkIRLD8K3AZyc4gmrzag_ANg');
    const sheet = spreadsheet.getSheetByName('Equipment List'); // Adjust sheet name as needed
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        error: 'Sheet not found'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get all data from the sheet
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    // Convert to array of objects
    const products = rows.map(row => {
      const product = {};
      headers.forEach((header, index) => {
        if (row[index] !== undefined && row[index] !== null) {
          product[header] = row[index];
        }
      });
      return product;
    });
    
    // Filter out empty rows
    const validProducts = products.filter(product => 
      product['Item Name'] && product['Item Name'].toString().trim() !== ''
    );
    
    return ContentService.createTextOutput(JSON.stringify(validProducts))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handlePostRequest(e) {
  try {
    // Parse the request data
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    
    if (action === 'updateProduct') {
      return updateProduct(requestData);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        error: 'Invalid action'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function updateProduct(requestData) {
  try {
    const partNumber = requestData.partNumber;
    const productData = requestData.data;
    
    // Get the spreadsheet
    const spreadsheet = SpreadsheetApp.openById('1upZrYCdpe9BR9pSKm3dWkIRLD8K3AZyc4gmrzag_ANg');
    const sheet = spreadsheet.getSheetByName('Equipment List'); // Adjust sheet name as needed
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        error: 'Sheet not found'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get all data from the sheet
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find the row with the matching part number
    let rowIndex = -1;
    const partNumberColumnIndex = headers.findIndex(header => 
      header === 'Exos Part Number' || header === 'Part Number'
    );
    
    if (partNumberColumnIndex === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        error: 'Part Number column not found'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Find the row to update (skip header row)
    for (let i = 1; i < data.length; i++) {
      if (data[i][partNumberColumnIndex] && data[i][partNumberColumnIndex].toString().trim() === partNumber.toString().trim()) {
        rowIndex = i + 1; // Convert to 1-based index for sheet operations
        break;
      }
    }
    
    if (rowIndex === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        error: 'Product not found in sheet'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Update the row with new data
    headers.forEach((header, columnIndex) => {
      if (productData[header] !== undefined) {
        sheet.getRange(rowIndex, columnIndex + 1).setValue(productData[header]);
      }
    });
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Product updated successfully',
      rowIndex: rowIndex
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Helper function to test the script
function testUpdate() {
  const testData = {
    action: 'updateProduct',
    partNumber: 'DB-001',
    data: {
      'Item Name': 'Dumbbell Set Updated',
      'Brand': 'PowerBlock',
      'Category': 'Strength',
      'Cost': '299.99',
      'Exos Part Number': 'DB-001',
      'Preferred': 'P',
      'URL': 'https://example.com/updated'
    }
  };
  
  const response = updateProduct(testData);
  Logger.log(response.getContent());
} 