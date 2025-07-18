import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import notificationService from '../services/notificationService';
import CONFIG from '../config';

const STATUS_OPTIONS = [
  { value: 'Hold', label: 'Hold', color: '#ffc107', bgColor: '#fff3cd', description: 'Buy Later List' },
  { value: 'Waitlist', label: 'Waitlist', color: '#6c757d', bgColor: '#f8f9fa', description: 'Waiting for Approval' },
  { value: 'Pending Approval', label: 'Pending Approval', color: '#007bff', bgColor: '#cce7ff', description: 'Manager Review' },
  { value: 'Approved', label: 'Approved', color: '#28a745', bgColor: '#d4edda', description: 'Ready for Procurement' },
  { value: 'Not Approved', label: 'Not Approved', color: '#dc3545', bgColor: '#f8d7da', description: 'Requires Note' },
];

const JUSTIFICATION_OPTIONS = [
  { value: '', label: 'Select justification...' },
  { value: 'program_needs', label: 'Program Needs' },
  { value: 'replacement', label: 'Replacement' },
  { value: 'broken', label: 'Broken' },
];

// Get available users from config
const AVAILABLE_USERS = CONFIG.TAGGING.ENABLED ? CONFIG.TAGGING.AVAILABLE_USERS : [];

const Sidebar = ({ 
  categories, 
  brands, 
  selectedCategory, 
  selectedBrand, 
  searchTerm,
  onCategoryChange,
  onBrandChange,
  onSearchChange,
  isExpanded,
  onToggle,
  // Gym-related props
  activeGym,
  gyms,
  gymItems,
  handleGymClick,
  handleRemoveFromGym,
  onQtyChange,
  onStatusChange,
  onNoteSubmit,
  onJustificationChange,
  saveGymItems,
  isSaving,
  // Tab control
  activeTab,
  onTabChange
}) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [currentItemForNote, setCurrentItemForNote] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'approved', 'not-approved', 'hold', 'waitlist'
  
  // Tagging system state
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [currentTagInput, setCurrentTagInput] = useState('');
  const [activeTextarea, setActiveTextarea] = useState(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  // Pending notifications state
  const [pendingNotifications, setPendingNotifications] = useState({});
  const [savingNotes, setSavingNotes] = useState({});
  
  // Collapsible sections state
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [brandsExpanded, setBrandsExpanded] = useState(false);
  const itemClickedRef = useRef(false);

  const handleCategoryClick = (e, category) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent the click from bubbling up to the section header
    itemClickedRef.current = true; // Mark that an item was clicked
    onCategoryChange(category);
    // Reset the flag after a short delay
    setTimeout(() => {
      itemClickedRef.current = false;
    }, 100);
  };

  const handleBrandClick = (e, brand) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent the click from bubbling up to the section header
    itemClickedRef.current = true; // Mark that an item was clicked
    onBrandChange(brand);
    // Reset the flag after a short delay
    setTimeout(() => {
      itemClickedRef.current = false;
    }, 100);
  };

  const handleCategoryHeaderClick = (e) => {
    // Don't toggle if an item was just clicked
    if (itemClickedRef.current || e.target.closest('.category-item')) {
      return;
    }
    setCategoriesExpanded(!categoriesExpanded);
  };

  const handleBrandHeaderClick = (e) => {
    // Don't toggle if an item was just clicked
    if (itemClickedRef.current || e.target.closest('.brand-item')) {
      return;
    }
    setBrandsExpanded(!brandsExpanded);
  };

  const handleStatusChange = (itemName, status) => {
    if (status === 'Not Approved') {
      setCurrentItemForNote(itemName);
      setShowNoteModal(true);
    } else {
      onStatusChange && onStatusChange(itemName, status);
    }
  };

  const handleNoteSubmit = () => {
    if (noteText.trim() && onNoteSubmit) {
      onNoteSubmit(currentItemForNote, noteText);
      setNoteText('');
      setShowNoteModal(false);
      setCurrentItemForNote('');
    }
  };

  const handleNoteCancel = () => {
    setNoteText('');
    setShowNoteModal(false);
    setCurrentItemForNote('');
  };

  // Tagging system functions
  const handleTagInput = (e, gym, index) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    // Check if tagging is enabled
    if (!CONFIG.TAGGING.ENABLED) {
      onNoteSubmit && onNoteSubmit(gym, index, value);
      return;
    }
    
    // Check if we're typing a tag (starting with @)
    const beforeCursor = value.substring(0, cursorPos);
    const tagMatch = beforeCursor.match(/@(\w*)$/);
    
    if (tagMatch) {
      const tagInput = tagMatch[1].toLowerCase();
      const settings = CONFIG.TAGGING.SETTINGS;
      
      // Filter users based on config settings
      const suggestions = AVAILABLE_USERS.filter(user => {
        const nameLower = user.name.toLowerCase();
        const idLower = user.id.toLowerCase();
        const emailLower = user.email.toLowerCase();
        
        // Split name into first and last
        const nameParts = user.name.toLowerCase().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts[nameParts.length - 1] || '';
        
        return (
          nameLower.includes(tagInput) ||
          idLower.includes(tagInput) ||
          (settings.ALLOW_FIRST_NAME && firstName.startsWith(tagInput)) ||
          (settings.ALLOW_LAST_NAME && lastName.startsWith(tagInput)) ||
          (settings.ALLOW_EMAIL && emailLower.includes(tagInput))
        );
      }).slice(0, settings.MAX_SUGGESTIONS);
      
      setTagSuggestions(suggestions);
      setCurrentTagInput(tagInput);
      setShowTagSuggestions(true);
      setActiveTextarea({ gym, index });
      setCursorPosition(cursorPos);
    } else {
      setShowTagSuggestions(false);
    }
    
    // Update the notes value
    onNoteSubmit && onNoteSubmit(gym, index, value);
  };

  const selectTag = (user) => {
    if (!activeTextarea) return;
    
    const { gym, index } = activeTextarea;
    const currentNotes = gymItems[gym]?.[index]?.notes || '';
    
    // Replace the @tag with the full user mention
    const beforeTag = currentNotes.substring(0, cursorPosition - currentTagInput.length - 1);
    const afterTag = currentNotes.substring(cursorPosition);
    const newNotes = `${beforeTag}@${user.name} ${afterTag}`;
    
    // Update the notes
    onNoteSubmit && onNoteSubmit(gym, index, newNotes);
    
    // Store pending notification instead of sending immediately
    const itemKey = `${gym}-${index}`;
    const currentPending = pendingNotifications[itemKey] || [];
    const newPending = [...currentPending, { user, gym, item: gymItems[gym]?.[index] }];
    
    setPendingNotifications(prev => ({
      ...prev,
      [itemKey]: newPending
    }));
    
    // Show success message for tagging
    showTagSuccessMessage(user.name);
    
    // Reset tagging state
    setShowTagSuggestions(false);
    setActiveTextarea(null);
    setCurrentTagInput('');
  };

  const saveNote = async (gym, index) => {
    const itemKey = `${gym}-${index}`;
    const pending = pendingNotifications[itemKey] || [];
    
    if (pending.length === 0) {
      showNotification('No pending notifications to send', 'info');
      return;
    }
    
    setSavingNotes(prev => ({ ...prev, [itemKey]: true }));
    
    try {
      // Send all pending notifications
      const item = gymItems[gym]?.[index];
      const notes = item?.notes || '';
      
      for (const pendingNotification of pending) {
        const notification = notificationService.createTagNotification(
          pendingNotification.user,
          'Current User', // In real app, get current user name
          gym,
          item,
          notes
        );
        
        if (notification) {
          notificationService.addToQueue(notification);
        }
      }
      
      // Clear pending notifications for this item
      setPendingNotifications(prev => {
        const newPending = { ...prev };
        delete newPending[itemKey];
        return newPending;
      });
      
      showNotification(`${pending.length} notification(s) sent successfully!`, 'success');
      
    } catch (error) {
      console.error('Failed to send notifications:', error);
      showNotification('Failed to send notifications', 'error');
    } finally {
      setSavingNotes(prev => ({ ...prev, [itemKey]: false }));
    }
  };

  const showNotification = (message, type = 'info') => {
    const colors = {
      success: '#28a745',
      error: '#dc3545',
      info: '#17a2b8'
    };
    
    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${colors[type]};
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
      messageEl.remove();
    }, 3000);
  };

  const showTagSuccessMessage = (userName) => {
    // Create a temporary success message
    const message = document.createElement('div');
    message.textContent = `✅ ${userName} has been notified!`;
    message.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
    `;
    
    // Add animation CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.remove();
      style.remove();
    }, 3000);
  };

  // Close tag suggestions when clicking outside
  const handleClickOutside = (e) => {
    if (!e.target.closest('.tag-suggestions') && !e.target.closest('.notes-textarea')) {
      setShowTagSuggestions(false);
      setActiveTextarea(null);
    }
  };

  // Add click outside listener
  React.useEffect(() => {
    if (showTagSuggestions) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showTagSuggestions]);

  // Function to render notes with highlighted tags
  const renderNotesWithTags = (notes) => {
    if (!notes || !CONFIG.TAGGING.ENABLED) return notes || '';
    
    try {
      const notesString = String(notes);
      const highlighting = CONFIG.TAGGING.HIGHLIGHTING;
      const style = `background-color: ${highlighting.BACKGROUND_COLOR}; color: ${highlighting.TEXT_COLOR}; border-radius: ${highlighting.BORDER_RADIUS}; padding: ${highlighting.PADDING};`;
      
      // Replace @mentions with highlighted spans
      return notesString.replace(/@(\w+)/g, `<span class="tag-highlight" style="${style}">@$1</span>`);
    } catch (error) {
      console.error('Error rendering notes with tags:', error);
      return String(notes || '');
    }
  };

  // Filter gym items based on status
  const getFilteredGymItems = () => {
    const items = gymItems[activeGym] || [];
    if (statusFilter === 'all') return items;
    
    return items.filter(item => {
      const status = item.status || 'Pending Approval';
      switch (statusFilter) {
        case 'pending':
          return status === 'Pending Approval';
        case 'approved':
          return status === 'Approved';
        case 'not-approved':
          return status === 'Not Approved';
        case 'hold':
          return status === 'Hold';
        case 'waitlist':
          return status === 'Waitlist';
        default:
          return true;
      }
    });
  };

  // Format cost to ensure single $ symbol
  const formatCost = (cost) => {
    if (!cost) return '';
    try {
      const costString = String(cost);
      return `$${costString.replace(/[$]/g, '')}`;
    } catch (error) {
      console.error('Error formatting cost:', error);
      return '';
    }
  };

  // Get status color from STATUS_OPTIONS
  const getStatusColor = (status) => {
    const statusOption = STATUS_OPTIONS.find(opt => opt.value === status);
    return statusOption ? { color: statusOption.color, bgColor: statusOption.bgColor } : { color: '#6c757d', bgColor: '#f8f9fa' };
  };

  const handleCopyList = () => {
    const items = gymItems[activeGym] || [];
    if (items.length === 0) return;
    const lines = items.map(item => [
      item.quantity,
      item["Item Name"] || '',
      item.Brand || '',
      item.Category || '',
      formatCost(item.Cost),
      item["EXOS Part Number"] || '',
      item.URL || ''
    ].join('\t'));
    const text = lines.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  // Calculate total cost
  const totalCost = (gymItems[activeGym] || []).reduce((sum, item) => {
    try {
      console.log('Processing item for total cost:', item);
      const costString = String(item?.Cost || '0');
      console.log('Cost string:', costString, 'Type:', typeof costString);
      const cost = parseFloat(costString.replace(/[$]/g, '') || '0');
      const qty = parseInt(item?.quantity || 1, 10);
      if (!isNaN(cost) && !isNaN(qty)) {
        return sum + cost * qty;
      }
      return sum;
    } catch (error) {
      console.error('Error calculating cost for item:', item, error);
      return sum;
    }
  }, 0);

  return (
    <div className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
              <style>{`
        .sidebar {
          width: 0;
          background: #f8f9fa;
          border-right: 1px solid #dee2e6;
          height: calc(100vh - 60px);
          overflow-y: auto;
          transition: all 0.3s ease;
          position: fixed;
          left: 0;
          top: 60px;
          z-index: 1000;
        }

        .sidebar.expanded {
          width: 280px;
        }

        .sidebar.collapsed {
          width: 0;
        }

        /* Mobile sidebar adjustments */
        @media (max-width: 768px) {
          .sidebar.expanded {
            width: 220px;
          }
        }

        @media (max-width: 480px) {
          .sidebar.expanded {
            width: 180px;
          }
        }

        .sidebar-content {
          padding: 4px;
          width: 100%;
          box-sizing: border-box;
          height: 100%;
          overflow-y: auto;
        }

        .sidebar-tabs {
          display: flex;
          margin-bottom: 6px;
          border-bottom: 1px solid #dee2e6;
        }

        .sidebar-tab {
          flex: 1;
          padding: 10px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 14px;
          color: #6c757d;
          border-bottom: 2px solid transparent;
          transition: all 0.2s ease;
          position: relative;
        }

        .sidebar-tab:hover {
          background: #e9ecef;
          color: #333;
        }

        .sidebar-tab.active {
          color: #007bff;
          border-bottom-color: #007bff;
        }

        .gym-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #dc3545;
          color: white;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .search-section {
          margin-bottom: 8px;
          width: 100%;
          box-sizing: border-box;
        }

        .sidebar-search {
          width: 100%;
          padding: 10px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;
        }

        .gym-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 2px;
          margin-bottom: 6px;
          width: 100%;
          box-sizing: border-box;
          justify-content: center;
          align-items: center;
        }

        .gym-tab {
          flex: 0 0 auto;
          padding: 4px 6px;
          border: 1px solid #ced4da;
          background: white;
          cursor: pointer;
          font-size: 11px;
          border-radius: 4px;
          transition: all 0.2s ease;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 24px;
          box-sizing: border-box;
          width: 55px;
        }

        .gym-tab.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .gym-tab:hover:not(.active) {
          background: #e9ecef;
        }

        .item-count {
          position: absolute;
          top: -6px;
          right: -6px;
          background: #dc3545;
          color: white;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          z-index: 1;
        }

        .status-section {
          margin-bottom: 15px;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .status-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 15px;
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
          transition: background-color 0.2s ease;
        }

        .status-section-header:hover {
          filter: brightness(0.95);
        }

        .status-title {
          font-weight: 600;
        }

        .status-count {
          background: rgba(255, 255, 255, 0.8);
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
          min-width: 20px;
          text-align: center;
        }

        .collapse-arrow {
          font-size: 12px;
          transition: transform 0.2s ease;
        }

        .collapse-arrow.collapsed {
          transform: rotate(-90deg);
        }

        .status-items {
          background: white;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
        }

        .gym-item {
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .gym-item-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 0;
        }

        .gym-item-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }

        .gym-item-name {
          font-weight: 500;
          font-size: 13px;
          color: #222;
          margin: 0;
          line-height: 1.2;
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .item-icons {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .item-name-text {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .gym-item-status-container {
          width: 100%;
          margin-top: 2px;
        }

        .gym-item-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
          width: 100%;
        }

        .gym-item-brand {
          font-size: 11px;
          color: #666;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .gym-item-part-number {
          font-size: 10px;
          color: #888;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .gym-item-controls {
          flex: 0 0 auto;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
          min-width: 70px;
        }

        .gym-item-center {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
          min-height: 24px;
        }

        .qty-btn {
          background: #e9ecef;
          border: none;
          border-radius: 3px;
          font-size: 11px;
          width: 12px;
          height: 20px;
          cursor: pointer;
          color: #007bff;
          font-weight: bold;
          transition: background 0.2s;
          padding: 0;
        }

        .qty-btn:hover {
          background: #d0e2ff;
        }

        .qty-input {
          width: 12px;
          text-align: center;
          border: 1px solid #ced4da;
          border-radius: 3px;
          font-size: 11px;
          padding: 1px 2px;
          -webkit-appearance: none;
          -moz-appearance: textfield;
        }

        .qty-input::-webkit-outer-spin-button,
        .qty-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .gym-item-price {
          font-weight: 700;
          color: #28a745;
          font-size: 13px;
          margin-bottom: 0;
          text-align: right;
        }

        .gym-item-status {
          font-size: 10px;
          font-weight: 550;
          padding: 2px 4px;
          border-radius: 3px;
          white-space: nowrap;
          width: 100%;
          box-sizing: border-box;
          cursor: pointer;
        }

        .gym-item-notes {
          margin-top: 12px;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 4px;
          border: 1px solid #e9ecef;
        }



        .notes-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
          position: relative;
        }

        .justification-dropdown {
          width: 100%;
          font-size: 11px;
          padding: 4px 6px;
          border: 1px solid #ced4da;
          border-radius: 3px;
          background: white;
          color: #333;
        }

        .justification-dropdown:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 1px rgba(0, 123, 255, 0.25);
        }

        .notes-textarea {
          width: 100%;
          font-size: 11px;
          padding: 4px 6px;
          border: 1px solid #ced4da;
          border-radius: 3px;
          background: white;
          color: #333;
          resize: vertical;
          min-height: 40px;
          font-family: inherit;
        }

        .notes-textarea:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 1px rgba(0, 123, 255, 0.25);
        }

        .notes-textarea::placeholder {
          color: #6c757d;
          font-style: italic;
        }

        .tag-suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ced4da;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          max-height: 150px;
          overflow-y: auto;
        }

        .tag-suggestion-item {
          padding: 6px 8px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 1px;
          border-bottom: 1px solid #f8f9fa;
        }

        .tag-suggestion-item:hover {
          background: #f8f9fa;
        }

        .tag-suggestion-item:last-child {
          border-bottom: none;
        }

        .tag-user-name {
          font-size: 11px;
          font-weight: 500;
          color: #333;
        }

        .tag-user-email {
          font-size: 9px;
          color: #666;
        }

        .tag-user-role {
          font-size: 9px;
          color: #007bff;
          font-weight: 500;
        }

        .tag-highlight {
          background: #007bff;
          color: white;
          padding: 1px 3px;
          border-radius: 2px;
          font-weight: 500;
        }

        .save-note-section {
          margin-top: 8px;
          padding: 8px;
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 4px;
        }

        .pending-notifications {
          margin-bottom: 6px;
        }

        .pending-count {
          font-size: 10px;
          font-weight: 600;
          color: #495057;
          display: block;
          margin-bottom: 4px;
        }

        .pending-users {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .pending-user {
          background: #007bff;
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 9px;
          font-weight: 500;
        }

        .save-note-btn {
          width: 100%;
          padding: 6px 8px;
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .save-note-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
          transform: translateY(-1px);
        }

        .save-note-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .gym-items-section {
          width: 100%;
          box-sizing: border-box;
          padding: 0;
          margin: 0;
          overflow: hidden;
        }

        .gym-items-header {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          margin-bottom: 16px;
          width: 100%;
          box-sizing: border-box;
          gap: 12px;
        }

        .gym-items-header h3 {
          font-size: 16px;
          color: #333;
          margin: 0;
          font-weight: 500;
          flex: 1;
          min-width: 0;
          text-align: left;
        }

        .status-filter-select {
          font-size: 10px;
          padding: 2px 4px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          background: white;
          color: #333;
          cursor: pointer;
          min-width: 60px;
          max-width: 80px;
        }

        .status-filter-select:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }

        .gym-items-list {
          margin-bottom: 12px;
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
        }

        .gym-items-total {
          padding: 15px;
          background: #f8f9fa;
          border-top: 1px solid #dee2e6;
          font-weight: bold;
          font-size: 16px;
          color: #333;
          border-radius: 0 0 8px 8px;
        }

        .save-button {
          width: 100%;
          padding: 8px 12px;
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s ease;
          margin-top: 10px;
          box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
        }

        .save-button:hover {
          background: linear-gradient(135deg, #218838 0%, #1ea085 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
        }

        .save-button:active {
          transform: translateY(0);
          box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
        }

        .copy-list-button {
          width: 100%;
          padding: 8px 12px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: background-color 0.2s ease;
          margin-top: 8px;
        }

        .copy-list-button:hover {
          background: #0056b3;
        }

        .no-items-message {
          padding: 20px;
          text-align: center;
          color: #6c757d;
          font-style: italic;
        }

        /* Filter Section Styles */
        .filters-content {
          width: 100%;
          box-sizing: border-box;
        }

        .categories-section {
          margin-bottom: 20px;
        }

        .special-filters {
          margin-bottom: 16px;
        }

        .categories-subsection {
          margin-bottom: 16px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 15px;
          background: #e9ecef;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
          margin-bottom: 8px;
          transition: background-color 0.2s ease;
        }

        .section-header:hover {
          background: #dee2e6;
        }

        .section-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .collapse-arrow {
          font-size: 12px;
          transition: transform 0.2s ease;
        }

        .collapse-arrow.collapsed {
          transform: rotate(-90deg);
        }

        .category-item {
          display: block;
          width: 100%;
          padding: 8px 12px;
          margin-bottom: 4px;
          border: none;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          color: #333;
          text-align: left;
          transition: all 0.2s ease;
          border: 1px solid #e9ecef;
        }

        .category-item:hover {
          background: #f8f9fa;
          border-color: #007bff;
        }

        .category-item.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .brands-section {
          margin-bottom: 20px;
        }

        .brand-item {
          display: block;
          width: 100%;
          padding: 8px 12px;
          margin-bottom: 4px;
          border: none;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          color: #333;
          text-align: left;
          transition: all 0.2s ease;
          border: 1px solid #e9ecef;
        }

        .brand-item:hover {
          background: #f8f9fa;
          border-color: #007bff;
        }

        .brand-item.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .toggle-icon {
          font-size: 12px;
          color: #666;
          transition: transform 0.2s ease;
        }

        .categories-list,
        .brands-list {
          margin-top: 8px;
        }

        .filter-item {
          display: block;
          width: 100%;
          padding: 8px 12px;
          margin-bottom: 4px;
          border: none;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          color: #333;
          text-align: left;
          transition: all 0.2s ease;
          border: 1px solid #e9ecef;
        }

        .filter-item:hover {
          background: #f8f9fa;
          border-color: #007bff;
        }

        .filter-item.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        /* Fix notes textarea sizing */
        .notes-textarea {
          width: 100%;
          font-size: 11px;
          padding: 4px 6px;
          border: 1px solid #ced4da;
          border-radius: 3px;
          background: white;
          color: #333;
          resize: vertical;
          min-height: 40px;
          max-height: 120px;
          font-family: inherit;
          box-sizing: border-box;
        }

        @media (max-width: 600px) {
          .gym-item-row {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }
          
          .gym-item-controls {
            align-items: flex-start;
            min-width: auto;
          }
          
          .gym-item-notes {
            margin-top: 8px;
            padding: 6px;
          }
          
          .notes-content {
            gap: 4px;
          }
          
          .justification-dropdown,
          .notes-textarea {
            font-size: 10px;
            padding: 3px 4px;
          }
        }
      `}</style>

      <div className="sidebar-content">
        {/* Tab Navigation */}
        <div className="sidebar-tabs">
          <button 
            className={`sidebar-tab ${activeTab === 'filters' ? 'active' : ''}`}
            onClick={() => onTabChange('filters')}
          >
            Filters
          </button>
          <button 
            className={`sidebar-tab ${activeTab === 'gyms' ? 'active' : ''}`}
            onClick={() => onTabChange('gyms')}
          >
            Gyms
            {Object.values(gymItems).some(items => items.length > 0) && (
              <span className="gym-badge">
                {Object.values(gymItems).reduce((sum, items) => sum + items.length, 0)}
              </span>
            )}
          </button>
        </div>

        {/* Filters Tab */}
        {activeTab === 'filters' && (
          <div className="filters-content">
            <div className="search-section">
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="sidebar-search"
              />
            </div>

            <div className="categories-section">
              {/* Special filters - always visible */}
              <div className="special-filters">
                <button
                  key="preferred-items"
                  className={`category-item ${selectedCategory === 'preferred' ? 'active' : ''}`}
                  onClick={(e) => handleCategoryClick(e, 'preferred')}
                >
                  <span role="img" aria-label="star">⭐</span> Preferred Items
                </button>
                <button
                  key="coach-recommended"
                  className={`category-item ${selectedCategory === 'coach-recommended' ? 'active' : ''}`}
                  onClick={(e) => handleCategoryClick(e, 'coach-recommended')}
                >
                  <span role="img" aria-label="trophy">🏆</span> Coach's Recommended
                </button>
                <button
                  key="all-categories"
                  className={`category-item ${!selectedCategory ? 'active' : ''}`}
                  onClick={(e) => handleCategoryClick(e, '')}
                >
                  All Categories
                </button>
              </div>
              
              {/* Individual categories - collapsible */}
              <div className="categories-subsection">
                <div className="section-header" onClick={handleCategoryHeaderClick}>
                  <h3>Categories</h3>
                  <span className="toggle-icon">{categoriesExpanded ? '▼' : '▶'}</span>
                </div>
                {categoriesExpanded && (
                  <div className="categories-list">
                    {categories.map((category) => (
                      <div
                        key={category}
                        className={`filter-item category-item ${selectedCategory === category ? 'active' : ''}`}
                        onClick={(e) => handleCategoryClick(e, category)}
                      >
                        {category}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="brands-section">
              <div className="section-header" onClick={handleBrandHeaderClick}>
                <h3>Brands</h3>
                <span className="toggle-icon">{brandsExpanded ? '▼' : '▶'}</span>
              </div>
              {brandsExpanded && (
                <div className="brands-list">
                  {brands.map((brand) => (
                    <div
                      key={brand}
                      className={`filter-item brand-item ${selectedBrand === brand ? 'active' : ''}`}
                      onClick={(e) => handleBrandClick(e, brand)}
                    >
                      {brand}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gyms Tab */}
        {activeTab === 'gyms' && (
          <div className="gyms-content">
            {/* Gym Tabs - positioned exactly like search bar */}
            <div className="search-section">
              <div className="gym-tabs">
                {gyms.map((gym) => (
                  <button
                    key={gym}
                    className={`gym-tab ${activeGym === gym ? 'active' : ''}`}
                    onClick={() => handleGymClick(gym)}
                  >
                    {gym}
                    {gymItems[gym]?.length > 0 && (
                      <span className="item-count">{gymItems[gym].length}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Gym Items */}
            <div className="gym-items-section">
              <div className="gym-items-header">
                <h3>{activeGym} Items</h3>
                <select 
                  className="status-filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Items</option>
                  <option value="pending">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="not-approved">Not Approved</option>
                  <option value="hold">Hold</option>
                  <option value="waitlist">Waitlist</option>
                </select>
              </div>
              {getFilteredGymItems().length === 0 ? (
                <p className="no-items-message">
                  {statusFilter === 'all' 
                    ? `No items added to ${activeGym} yet.` 
                    : `No ${statusFilter.replace('-', ' ')} items in ${activeGym}.`
                  }
                </p>
              ) : (
                <>
                  <div className="gym-items-list">
                    {getFilteredGymItems().map((item, index) => (
                      <div key={index} className="gym-item">
                        {/* Main item row */}
                        <div className="gym-item-row">
                          {/* Left side: Item Info */}
                          <div className="gym-item-info">
                            <div className="gym-item-name">
                              <span className="item-icons">
                                {item.Preferred === 'P' && (
                                  <span role="img" aria-label="star">⭐</span>
                                )}
                                {item.Preferred === 'C' && (
                                  <span role="img" aria-label="trophy">🏆</span>
                                )}
                                {item.Preferred === 'P+C' && (
                                  <span role="img" aria-label="star and trophy">⭐🏆</span>
                                )}
                              </span>
                              <span className="item-name-text">{item["Item Name"]}</span>
                            </div>
                            <div className="gym-item-status-container">
                              <select 
                                className="gym-item-status"
                                value={item.status || 'Pending Approval'}
                                onChange={(e) => handleStatusChange(item["Item Name"], e.target.value)}
                                style={{
                                  color: getStatusColor(item.status || 'Pending Approval').color,
                                  backgroundColor: getStatusColor(item.status || 'Pending Approval').bgColor,
                                  borderColor: getStatusColor(item.status || 'Pending Approval').color
                                }}
                              >
                                {STATUS_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          {/* Right side: Quantity and Price */}
                          <div className="gym-item-controls">
                            <div className="gym-item-price">{item.Cost ? formatCost(item.Cost) : ''}</div>
                            <div className="gym-item-center">
                              <button className="qty-btn" onClick={() => onQtyChange(activeGym, index, (parseInt(item.quantity, 10) || 1) - 1)}>-</button>
                              <input
                                type="number"
                                className="qty-input"
                                min="0"
                                value={item.quantity}
                                onChange={e => onQtyChange(activeGym, index, parseInt(e.target.value) || 0)}
                              />
                              <button className="qty-btn" onClick={() => onQtyChange(activeGym, index, (parseInt(item.quantity, 10) || 1) + 1)}>+</button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Notes Section - Full width underneath */}
                        <div className="gym-item-notes">
                          <div className="notes-content">
                            <select 
                              className="justification-dropdown"
                              value={item.justification || ''}
                              onChange={(e) => onJustificationChange && onJustificationChange(activeGym, index, e.target.value)}
                            >
                              {JUSTIFICATION_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <textarea
                              className="notes-textarea"
                              placeholder="Add notes about this item (optional)... Use @ to tag someone (e.g., @john)"
                              value={item.notes || ''}
                              onChange={(e) => handleTagInput(e, activeGym, index)}
                              onKeyDown={(e) => {
                                if (showTagSuggestions && e.key === 'Enter') {
                                  e.preventDefault();
                                  if (tagSuggestions.length > 0) {
                                    selectTag(tagSuggestions[0]);
                                  }
                                }
                              }}
                              rows="2"
                            />
                            {/* Tag suggestions dropdown */}
                            {showTagSuggestions && activeTextarea?.gym === activeGym && activeTextarea?.index === index && (
                              <div className="tag-suggestions">
                                {tagSuggestions.map((user) => {
                                  try {
                                    const displayFormat = String(CONFIG.TAGGING.SETTINGS.DISPLAY_FORMAT || '');
                                    const displayName = displayFormat
                                      .replace('{name}', String(user?.name || ''))
                                      .replace('{role}', String(user?.role || ''))
                                      .replace('{email}', String(user?.email || ''));
                                    
                                    return (
                                      <div
                                        key={user?.id || Math.random()}
                                        className="tag-suggestion-item"
                                        onClick={() => selectTag(user)}
                                      >
                                        <span className="tag-user-name">{displayName}</span>
                                        {CONFIG.TAGGING.SETTINGS.SHOW_ROLES && user?.role && (
                                          <span className="tag-user-role">{user.role}</span>
                                        )}
                                      </div>
                                    );
                                  } catch (error) {
                                    console.error('Error rendering tag suggestion:', error);
                                    return null;
                                  }
                                })}
                              </div>
                            )}
                            
                            {/* Save Note Button */}
                            {pendingNotifications[`${activeGym}-${index}`]?.length > 0 && (
                              <div className="save-note-section">
                                <div className="pending-notifications">
                                  <span className="pending-count">
                                    📧 {pendingNotifications[`${activeGym}-${index}`].length} pending notification(s)
                                  </span>
                                  <div className="pending-users">
                                    {pendingNotifications[`${activeGym}-${index}`].map((pending, idx) => (
                                      <span key={idx} className="pending-user">
                                        @{pending.user.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <button
                                  className="save-note-btn"
                                  onClick={() => saveNote(activeGym, index)}
                                  disabled={savingNotes[`${activeGym}-${index}`]}
                                >
                                  {savingNotes[`${activeGym}-${index}`] ? (
                                    <>
                                      <span className="spinning">📧</span> Sending...
                                    </>
                                  ) : (
                                    <>
                                      📧 Send Notifications
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="gym-items-total">
                    Total: {formatCost(totalCost.toFixed(2))}
                  </div>
                </>
              )}
              
              {/* Always show Save and Copy buttons */}
              <button 
                className="save-button" 
                onClick={saveGymItems}
                disabled={isSaving}
                style={{
                  opacity: isSaving ? 0.7 : 1,
                  cursor: isSaving ? 'not-allowed' : 'pointer'
                }}
              >
                <span style={{ 
                  display: 'inline-block',
                  animation: isSaving ? 'spin 1s linear infinite' : 'none'
                }}>
                  💾
                </span>
                {isSaving ? ' Saving...' : ' Save'}
              </button>
              <button className="copy-list-button" onClick={handleCopyList}>
                {copySuccess ? 'Copied!' : 'Copy List'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Note Modal for Not Approved Status */}
      {showNoteModal && (
        <div className="note-modal-overlay">
          <div className="note-modal">
            <h3>Add Note for "Not Approved"</h3>
            <p>Please provide a reason why this item was not approved:</p>
            <textarea
              className="note-textarea"
              placeholder="Enter reason for disapproval..."
              rows="3"
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleNoteSubmit();
                }
              }}
            />
            <div className="note-modal-buttons">
              <button onClick={handleNoteSubmit}>
                Submit
              </button>
              <button onClick={handleNoteCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Sidebar.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.string).isRequired,
  brands: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedCategory: PropTypes.string,
  selectedBrand: PropTypes.string,
  searchTerm: PropTypes.string,
  onCategoryChange: PropTypes.func.isRequired,
  onBrandChange: PropTypes.func.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  // Gym-related props
  activeGym: PropTypes.string,
  gyms: PropTypes.arrayOf(PropTypes.string),
  gymItems: PropTypes.object,
  handleGymClick: PropTypes.func,
  handleRemoveFromGym: PropTypes.func,
  onQtyChange: PropTypes.func,
  onStatusChange: PropTypes.func,
  onNoteSubmit: PropTypes.func,
  onJustificationChange: PropTypes.func,
  saveGymItems: PropTypes.func,
  isSaving: PropTypes.bool,
  // Tab control
  activeTab: PropTypes.string,
  onTabChange: PropTypes.func
};

export default React.memo(Sidebar); 