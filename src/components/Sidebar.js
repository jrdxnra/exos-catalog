import React, { useState } from 'react';
import PropTypes from 'prop-types';

const STATUS_OPTIONS = [
  { value: 'Hold', label: 'Hold', color: '#ffc107', bgColor: '#fff3cd', description: 'Buy Later List' },
  { value: 'Waitlist', label: 'Waitlist', color: '#6c757d', bgColor: '#f8f9fa', description: 'Waiting for Approval' },
  { value: 'Pending Approval', label: 'Pending Approval', color: '#007bff', bgColor: '#cce7ff', description: 'Manager Review' },
  { value: 'Approved', label: 'Approved', color: '#28a745', bgColor: '#d4edda', description: 'Ready for Procurement' },
  { value: 'Not Approved', label: 'Not Approved', color: '#dc3545', bgColor: '#f8d7da', description: 'Requires Note' },
];

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
  statusNotes,
  onNoteSubmit,
  saveGymItems
}) => {
  const [activeTab, setActiveTab] = useState('filters'); // 'filters' or 'gyms'
  const [copySuccess, setCopySuccess] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [currentItemForNote, setCurrentItemForNote] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'approved', 'not-approved', 'hold', 'waitlist'

  const handleCategoryClick = (e, category) => {
    e.preventDefault();
    onCategoryChange(category);
  };

  const handleBrandClick = (e, brand) => {
    e.preventDefault();
    onBrandChange(brand);
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
    return `$${cost.replace(/[$]/g, '')}`;
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
    const cost = parseFloat(item.Cost?.replace(/[$]/g, '') || '0');
    const qty = parseInt(item.quantity, 10);
    if (!isNaN(cost) && !isNaN(qty)) {
      return sum + cost * qty;
    }
    return sum;
  }, 0);

  return (
    <div className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <style jsx>{`
        .sidebar {
          width: 350px;
          background: #f8f9fa;
          border-right: 1px solid #dee2e6;
          height: calc(100vh - 60px);
          overflow-y: auto;
          transition: all 0.3s ease;
          position: fixed;
          left: 0;
          top: 60px;
          z-index: 1000;
          transform: translateX(-100%);
        }

        .sidebar.expanded {
          transform: translateX(0);
        }

        .sidebar.collapsed {
          transform: translateX(-100%);
        }

        .sidebar-content {
          padding: 6px 4px;
        }

        .sidebar-tabs {
          display: flex;
          margin-bottom: 15px;
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
          top: 5px;
          right: 5px;
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
          margin-bottom: 20px;
        }

        .sidebar-search {
          width: 100%;
          padding: 10px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
        }

        .gym-tabs {
          display: flex;
          gap: 2px;
          margin-bottom: 16px;
          padding: 0 2px;
        }

        .gym-tab {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ced4da;
          background: white;
          cursor: pointer;
          font-size: 12px;
          border-radius: 4px;
          transition: all 0.2s ease;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 38px;
          box-sizing: border-box;
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
          padding: 6px;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          margin-bottom: 6px;
          background: white;
          transition: background-color 0.2s ease;
          position: relative;
        }

        .gym-item:hover {
          background: #f8f9fa;
          border-color: #007bff;
        }

        .gym-item:last-child {
          margin-bottom: 0;
        }

        .gym-item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .remove-item-button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
          color: #dc3545;
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 1;
        }

        .remove-item-button:hover {
          background: #f8d7da;
          color: #c82333;
          transform: scale(1.1);
        }

        .gym-item-name {
          font-weight: 500;
          font-size: 13px;
          color: #222;
          margin-bottom: 0;
          text-align: left;
          line-height: 1.2;
          width: 100%;
          padding-left: 0;
        }

        .gym-item-details {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 8px;
          padding-left: 0;
          min-height: 24px;
        }

        .gym-item-brand {
          font-size: 11px;
          color: #666;
          margin-bottom: 0;
        }

        .gym-item-part-number {
          font-size: 10px;
          color: #007bff;
          font-family: monospace;
          background: #f5f5f5;
          border-radius: 4px;
          padding: 2px 6px;
        }

        .gym-item-status {
          font-size: 8px;
          padding: 1px 4px;
          border: 1px solid #ced4da;
          border-radius: 3px;
          background: white;
          color: #333;
          cursor: pointer;
          width: 90px;
          height: 24px;
          margin-top: -4px;
          margin-left: 6px;
        }

        .gym-item-price {
          font-weight: 600;
          color: #28a745;
        }

        .gym-item-qty {
          background: #e9ecef;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .gym-item-status {
          font-size: 11px;
          font-weight: 550;
          padding: 1px 1px;
          border-radius: 8px;
          white-space: nowrap;
        }

        .status-note {
          margin-top: 8px;
          padding: 8px 12px;
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 4px;
          font-size: 12px;
          color: #721c24;
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

        .copy-list-button {
          width: 100%;
          padding: 12px;
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

        .save-button {
          width: 100%;
          padding: 12px;
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

        .button-group {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }

        .button-group .copy-list-button,
        .button-group .save-button {
          flex: 1;
          margin-top: 0;
        }

        .no-items-message {
          padding: 20px;
          text-align: center;
          color: #6c757d;
          font-style: italic;
        }

        .categories-section,
        .brands-section {
          margin-bottom: 20px;
        }

        .categories-section h3,
        .brands-section h3 {
          margin: 0 0 10px 0;
          font-size: 16px;
          color: #333;
          font-weight: 600;
        }

        .category-list,
        .brand-list {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .category-item,
        .brand-item {
          padding: 8px 12px;
          border: none;
          background: white;
          cursor: pointer;
          text-align: left;
          border-radius: 4px;
          transition: all 0.2s ease;
          font-size: 14px;
          color: #333;
          border-left: 3px solid transparent;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .category-item:hover,
        .brand-item:hover {
          background: #f0f7ff;
          color: #0046be;
          border-left-color: #0046be;
          transform: translateX(2px);
        }

        .category-item.active,
        .brand-item.active {
          background: #0046be;
          color: white;
          border-left-color: #003a9e;
          box-shadow: 0 4px 16px 0 rgba(0,70,190,0.18), 0 0 0 2px #0046be;
        }

        /* Note Modal Styles */
        .note-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }

        .note-modal {
          background: white;
          border-radius: 8px;
          padding: 20px;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .note-modal h3 {
          margin: 0 0 10px 0;
          color: #333;
          font-size: 18px;
        }

        .note-modal p {
          margin: 0 0 15px 0;
          color: #6c757d;
          font-size: 14px;
        }

        .note-textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }

        .note-textarea:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }

        .note-modal-buttons {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }

        .note-modal-buttons button {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s ease;
        }

        .note-modal-buttons button:first-child {
          background: #007bff;
          color: white;
        }

        .note-modal-buttons button:first-child:hover {
          background: #0056b3;
        }

        .note-modal-buttons button:last-child {
          background: #6c757d;
          color: white;
        }

        .note-modal-buttons button:last-child:hover {
          background: #545b62;
        }

        .gym-items-section h3 {
          font-size: 16px;
          color: #333;
          margin-bottom: 10px;
          font-weight: 600;
        }

        .gym-items-list {
          margin-bottom: 12px;
        }

        .gym-item-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 6px 4px;
          min-height: 60px;
        }

        .gym-item-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: space-between;
          gap: 4px;
          padding-left: 0;
        }

        .gym-item-name {
          font-weight: 500;
          font-size: 13px;
          color: #222;
          margin-bottom: 0;
          text-align: left;
          line-height: 1.2;
          width: 100%;
          padding-left: 0;
        }

        .gym-item-controls {
          flex: 0 0 auto;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          justify-content: flex-start;
        }

        .gym-item-center {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
          margin-top: -4px;
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

        @media (max-width: 600px) {
          .gym-item-row {
            flex-direction: column;
            align-items: stretch;
            gap: 6px;
          }
          .gym-item-price-col {
            align-items: flex-start;
          }
        }

        .gym-items-section {
          padding: 0 2px;
        }

        .gym-items-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .gym-items-header h3 {
          font-size: 16px;
          color: #333;
          margin: 0;
          font-weight: 500;
        }

        .status-filter-select {
          font-size: 12px;
          padding: 4px 8px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          background: white;
          color: #333;
          cursor: pointer;
          min-width: 120px;
        }

        .status-filter-select:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }
      `}</style>

      <div className="sidebar-content">
        {/* Tab Navigation */}
        <div className="sidebar-tabs">
          <button 
            className={`sidebar-tab ${activeTab === 'filters' ? 'active' : ''}`}
            onClick={() => setActiveTab('filters')}
          >
            Filters
          </button>
          <button 
            className={`sidebar-tab ${activeTab === 'gyms' ? 'active' : ''}`}
            onClick={() => setActiveTab('gyms')}
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
              <h3>Categories</h3>
              <div className="category-list">
                <button
                  key="preferred-items"
                  className={`category-item ${selectedCategory === 'preferred' ? 'active' : ''}`}
                  onClick={(e) => handleCategoryClick(e, 'preferred')}
                >
                  <span role="img" aria-label="star">⭐</span> Preferred Items
                </button>
                <button
                  key="all-categories"
                  className={`category-item ${!selectedCategory ? 'active' : ''}`}
                  onClick={(e) => handleCategoryClick(e, '')}
                >
                  All Categories
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`category-item ${selectedCategory === category ? 'active' : ''}`}
                    onClick={(e) => handleCategoryClick(e, category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="brands-section">
              <h3>Brands</h3>
              <div className="brand-list">
                {brands.map((brand) => (
                  <button
                    key={brand}
                    className={`brand-item ${selectedBrand === brand ? 'active' : ''}`}
                    onClick={(e) => handleBrandClick(e, brand)}
                  >
                    {brand}
                  </button>
                ))}
              </div>
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
                      <div key={index} className="gym-item gym-item-row">
                        {/* Left side: Item Info */}
                        <div className="gym-item-info">
                          <div className="gym-item-name">{item["Item Name"]}</div>
                          <div className="gym-item-details">
                            <div className="gym-item-brand">{item.Brand}</div>
                            <div className="gym-item-part-number">{item["Exos Part Number"]}</div>
                          </div>
                        </div>
                        {/* Right side: Status, Quantity and Price */}
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
                    ))}
                  </div>
                  <div className="gym-items-total">
                    Total: {formatCost(totalCost.toFixed(2))}
                  </div>
                </>
              )}
              
              {/* Always show Save and Copy buttons */}
              <button className="save-button" onClick={saveGymItems}>
                💾 Save
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
  statusNotes: PropTypes.object,
  onNoteSubmit: PropTypes.func,
  saveGymItems: PropTypes.func
};

export default React.memo(Sidebar); 