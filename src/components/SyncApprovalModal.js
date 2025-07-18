import React, { useState, useEffect } from 'react';
import './SyncApprovalModal.css';

const SyncApprovalModal = ({ 
  isOpen, 
  onClose, 
  onApprove, 
  sheetsData, 
  currentData 
}) => {
  const [changes, setChanges] = useState([]);
  const [selectedChanges, setSelectedChanges] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && sheetsData && currentData) {
      calculateChanges();
    }
  }, [isOpen, sheetsData, currentData]);

  const calculateChanges = () => {
    const changesList = [];
    const currentItemsMap = new Map();
    const sheetsItemsMap = new Map();

    // Create maps for easy lookup
    currentData.forEach(item => {
      currentItemsMap.set(item['EXOS Part Number'], item);
    });
    sheetsData.forEach(item => {
      sheetsItemsMap.set(item['EXOS Part Number'], item);
    });

    // Debug: Log a few items to see the data structure
    console.log('Sample current item:', currentData[0]);
    console.log('Sample sheets item:', sheetsData[0]);
    
    // Debug: Check what field names actually exist
    console.log('Current data field names:', Object.keys(currentData[0] || {}));
    console.log('Sheets data field names:', Object.keys(sheetsData[0] || {}));
    
    // Keep using 'EXOS Part Number' as the standard field name
    const partNumberField = 'EXOS Part Number';
    
    console.log('Using part number field:', partNumberField);
    
    const currentPartNumbers = currentData.map(item => item[partNumberField]);
    const sheetsPartNumbers = sheetsData.map(item => item[partNumberField]);
    
    console.log('Current part numbers (first 10):', currentPartNumbers.slice(0, 10));
    console.log('Sheets part numbers (first 10):', sheetsPartNumbers.slice(0, 10));
    
    // Check for duplicates
    const currentDuplicates = currentPartNumbers.filter((item, index) => currentPartNumbers.indexOf(item) !== index);
    const sheetsDuplicates = sheetsPartNumbers.filter((item, index) => sheetsPartNumbers.indexOf(item) !== index);
    
    console.log('Duplicate part numbers in current data:', currentDuplicates);
    console.log('Duplicate part numbers in sheets data:', sheetsDuplicates);

    // Debug: Specifically look at the problematic item
    const problematicPartNumber = 'X121-803OU2-45';
    const currentProblematicItems = currentData.filter(item => item[partNumberField] === problematicPartNumber);
    const sheetsProblematicItems = sheetsData.filter(item => item[partNumberField] === problematicPartNumber);
    
    console.log(`Found ${currentProblematicItems.length} current items with part number ${problematicPartNumber}:`, currentProblematicItems);
    console.log(`Found ${sheetsProblematicItems.length} sheets items with part number ${problematicPartNumber}:`, sheetsProblematicItems);

    // Find new items (in sheets but not in current)
    sheetsData.forEach(sheetsItem => {
      const partNumber = sheetsItem['EXOS Part Number'];
      const currentItem = currentItemsMap.get(partNumber);
      
      // Debug: Log a few matches to see what's happening
      if (changesList.length < 3) {
        console.log(`Matching part number: ${partNumber}`);
        console.log('Current item found:', currentItem ? currentItem['Item Name'] : 'NOT FOUND');
        console.log('Sheets item:', sheetsItem['Item Name']);
      }
      
      if (!currentItem) {
        changesList.push({
          type: 'add',
          partNumber,
          item: sheetsItem,
          description: `Add new item: ${sheetsItem['Item Name']} (${partNumber})`
        });
      } else {
        // Check if item has changed
        const hasChanged = hasItemChanged(currentItem, sheetsItem);
        if (hasChanged) {
          changesList.push({
            type: 'update',
            partNumber,
            currentItem,
            newItem: sheetsItem,
            description: `Update: ${sheetsItem['Item Name']} (${partNumber})`,
            changes: getFieldChanges(currentItem, sheetsItem)
          });
        }
      }
    });

    // Find deleted items (in current but not in sheets)
    currentData.forEach(currentItem => {
      const partNumber = currentItem['EXOS Part Number'];
      if (!sheetsItemsMap.has(partNumber)) {
        changesList.push({
          type: 'delete',
          partNumber,
          item: currentItem,
          description: `Delete: ${currentItem['Item Name']} (${partNumber})`
        });
      }
    });

    console.log(`Total changes found: ${changesList.length}`);
    console.log(`Adds: ${changesList.filter(c => c.type === 'add').length}`);
    console.log(`Updates: ${changesList.filter(c => c.type === 'update').length}`);
    console.log(`Deletes: ${changesList.filter(c => c.type === 'delete').length}`);

    setChanges(changesList);
    // Select all changes by default
    setSelectedChanges(new Set(changesList.map((_, index) => index)));
  };

  const hasItemChanged = (existingItem, newItem) => {
    const fieldsToCompare = ['Item Name', 'Brand', 'Category', 'Cost', 'Preferred', 'URL'];
    
    for (const field of fieldsToCompare) {
      const existingValue = existingItem[field];
      const newValue = newItem[field];
      
      if (field === 'Cost') {
        const existingCost = existingValue !== null && existingValue !== undefined ? String(existingValue) : '';
        const newCost = newValue !== null && newValue !== undefined ? String(newValue) : '';
        if (existingCost !== newCost) {
          return true;
        }
      } else {
        // Handle null/undefined values consistently
        const existingStr = existingValue !== null && existingValue !== undefined ? String(existingValue) : '';
        const newStr = newValue !== null && newValue !== undefined ? String(newValue) : '';
        if (existingStr !== newStr) {
          return true;
        }
      }
    }
    return false;
  };

  const getFieldChanges = (currentItem, newItem) => {
    const fieldsToCompare = ['Item Name', 'Brand', 'Category', 'Cost', 'Preferred', 'URL'];
    const changes = [];
    
    for (const field of fieldsToCompare) {
      const currentValue = currentItem[field];
      const newValue = newItem[field];
      
      if (field === 'Cost') {
        const currentCost = currentValue !== null && currentValue !== undefined ? String(currentValue) : '';
        const newCost = newValue !== null && newValue !== undefined ? String(newValue) : '';
        if (currentCost !== newCost) {
          changes.push({ field, oldValue: currentCost, newValue: newCost });
        }
      } else {
        // Handle null/undefined values consistently
        const currentStr = currentValue !== null && currentValue !== undefined ? String(currentValue) : '';
        const newStr = newValue !== null && newValue !== undefined ? String(newValue) : '';
        if (currentStr !== newStr) {
          changes.push({ field, oldValue: currentStr, newValue: newStr });
        }
      }
    }
    
    return changes;
  };

  const toggleChange = (index) => {
    const newSelected = new Set(selectedChanges);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedChanges(newSelected);
  };

  const selectAll = () => {
    setSelectedChanges(new Set(changes.map((_, index) => index)));
  };

  const deselectAll = () => {
    setSelectedChanges(new Set());
  };

  const handleApprove = async () => {
    if (selectedChanges.size === 0) {
      alert('Please select at least one change to approve.');
      return;
    }

    setIsProcessing(true);
    try {
      const approvedChanges = changes.filter((_, index) => selectedChanges.has(index));
      await onApprove(approvedChanges);
      onClose();
    } catch (error) {
      console.error('Error applying changes:', error);
      alert('Error applying changes: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getChangeIcon = (type) => {
    switch (type) {
      case 'add': return '➕';
      case 'update': return '✏️';
      case 'delete': return '🗑️';
      default: return '❓';
    }
  };

  const getChangeColor = (type) => {
    switch (type) {
      case 'add': return '#28a745';
      case 'update': return '#ffc107';
      case 'delete': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (!isOpen) return null;

  const addCount = changes.filter(c => c.type === 'add' && selectedChanges.has(changes.indexOf(c))).length;
  const updateCount = changes.filter(c => c.type === 'update' && selectedChanges.has(changes.indexOf(c))).length;
  const deleteCount = changes.filter(c => c.type === 'delete' && selectedChanges.has(changes.indexOf(c))).length;

  return (
    <div className="sync-approval-modal-overlay">
      <div className="sync-approval-modal">
        <div className="sync-approval-modal-header">
          <h2>Sync Approval</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="sync-approval-modal-content">
          <div className="sync-summary">
            <p>Review the following changes from Google Sheets before applying them:</p>
            <div className="sync-stats">
              <span className="stat add">Add: {addCount}</span>
              <span className="stat update">Update: {updateCount}</span>
              <span className="stat delete">Delete: {deleteCount}</span>
              <span className="stat total">Total: {selectedChanges.size}</span>
            </div>
          </div>

          <div className="sync-controls">
            <button onClick={selectAll} className="control-button">Select All</button>
            <button onClick={deselectAll} className="control-button">Deselect All</button>
          </div>

          <div className="changes-list">
            {changes.length === 0 ? (
              <div className="no-changes">
                <p>No changes detected. Your data is already in sync.</p>
              </div>
            ) : (
              changes.map((change, index) => (
                <div 
                  key={`${change.type}-${change.partNumber}-${index}`}
                  className={`change-item ${selectedChanges.has(index) ? 'selected' : ''}`}
                  onClick={() => toggleChange(index)}
                >
                  <div className="change-header">
                    <input
                      type="checkbox"
                      checked={selectedChanges.has(index)}
                      onChange={() => toggleChange(index)}
                      className="change-checkbox"
                    />
                    <span 
                      className="change-icon"
                      style={{ color: getChangeColor(change.type) }}
                    >
                      {getChangeIcon(change.type)}
                    </span>
                    <span className="change-description">{change.description}</span>
                  </div>
                  
                  {change.type === 'update' && change.changes && (
                    <div className="change-details">
                      {change.changes.map((fieldChange, fieldIndex) => (
                        <div key={fieldIndex} className="field-change">
                          <span className="field-name">{fieldChange.field}:</span>
                          <span className="old-value">{fieldChange.oldValue || '(empty)'}</span>
                          <span className="arrow">→</span>
                          <span className="new-value">{fieldChange.newValue || '(empty)'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="sync-approval-modal-footer">
          <button 
            onClick={onClose} 
            className="cancel-button"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button 
            onClick={handleApprove} 
            className="approve-button"
            disabled={selectedChanges.size === 0 || isProcessing}
          >
            {isProcessing ? 'Applying Changes...' : `Apply ${selectedChanges.size} Changes`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SyncApprovalModal; 