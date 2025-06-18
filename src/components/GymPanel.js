import React, { useState } from 'react';
import GymTabs from './GymTabs';

const STATUS_OPTIONS = [
  { value: 'Hold', label: 'Hold', color: '#ffc107' }, // yellow
  { value: 'Waitlist', label: 'Waitlist', color: '#6c757d' }, // gray
  { value: 'Pending Approval', label: 'Pending Approval', color: '#007bff' }, // blue
  { value: 'Approved', label: 'Approved', color: '#28a745' }, // green
  { value: 'Not Approved', label: 'Not Approved', color: '#dc3545' }, // red
];

const GymPanel = ({ activeGym, gyms, gymItems, isGymListCollapsed, handleGymClick, handleRemoveFromGym }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [itemStatuses, setItemStatuses] = useState({});

  // Format cost to ensure single $ symbol
  const formatCost = (cost) => {
    if (!cost) return '';
    // Remove any existing $ symbols and add a single one
    return `$${cost.replace(/[$]/g, '')}`;
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

  const handleStatusChange = (itemName, status) => {
    setItemStatuses(prev => ({ ...prev, [itemName]: status }));
  };

  return (
    <div className="gym-panel-floating">
      <div className="gym-panel-inner">
        <GymTabs
          activeGym={activeGym}
          onGymChange={handleGymClick}
          gyms={gyms}
        />
        {!isGymListCollapsed && (
          <div className="gym-items" style={{ padding: '0.75rem 0.5rem', margin: '0.25rem 0' }}>
            <h2>{activeGym} Items</h2>
            {gymItems[activeGym].length === 0 ? (
              <p className="no-items-message">No items added to {activeGym} yet.</p>
            ) : (
              <>
                <div className="gym-items-list">
                  {gymItems[activeGym].map((item, index) => (
                    <div key={index} className="gym-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', minWidth: 0 }}>
                      {/* Status Dropdown */}
                      <select
                        className="status-select"
                        value={itemStatuses[item["Item Name"]] || ''}
                        onChange={e => handleStatusChange(item["Item Name"], e.target.value)}
                        style={{
                          fontWeight: 'bold',
                          color: STATUS_OPTIONS.find(opt => opt.value === (itemStatuses[item["Item Name"]] || ''))?.color || '#333',
                          background: '#f8f9fa',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          padding: '0.05rem 0.2rem',
                          minWidth: '65px',
                          fontSize: '0.85em',
                          marginRight: '0.25rem',
                          flexShrink: 0,
                          maxWidth: '90px',
                        }}
                      >
                        <option value="">Status</option>
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value} style={{ color: opt.color }}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {/* Item Name Only (no brand) */}
                      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1.05em', color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{item["Item Name"]}</span>
                      </div>
                      {/* Price x Qty */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', minWidth: '90px', justifyContent: 'flex-end', flexShrink: 0 }}>
                        <span style={{ fontWeight: 'bold', color: '#0046be', whiteSpace: 'nowrap' }}>{item.Cost ? formatCost(item.Cost) : ''}</span>
                        <span style={{ color: '#666', fontWeight: 500, whiteSpace: 'nowrap' }}>× {item.quantity}</span>
                      </div>
                      {/* Remove Button as Trash Icon */}
                      <button
                        onClick={() => handleRemoveFromGym(activeGym, index)}
                        className="remove-item-button"
                        style={{ marginLeft: '1rem', background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: '#dc3545', fontSize: '1.2rem', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                        aria-label="Remove"
                      >
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 8V15C6 15.5523 6.44772 16 7 16H13C13.5523 16 14 15.5523 14 15V8" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M9 11V13" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M11 11V13" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M4 6H16" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 6V5C8 4.44772 8.44772 4 9 4H11C11.5523 4 12 4.44772 12 5V6" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="gym-items-total" style={{ textAlign: 'right', fontWeight: 'bold', margin: '0.5rem 0 0.5rem 0' }}>
                  Total: {formatCost(totalCost.toFixed(2))}
                </div>
                <button className="copy-list-button" onClick={handleCopyList}>
                  {copySuccess ? 'Copied!' : 'Copy List'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(GymPanel); 