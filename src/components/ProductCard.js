import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const STATUS_OPTIONS = [
  { value: 'Hold', label: 'Hold', color: '#ffc107', bgColor: '#fff3cd', description: 'Buy Later List' },
  { value: 'Waitlist', label: 'Waitlist', color: '#6c757d', bgColor: '#f8f9fa', description: 'Waiting for Approval' },
  { value: 'Pending Approval', label: 'Pending Approval', color: '#007bff', bgColor: '#cce7ff', description: 'Manager Review' },
  { value: 'Approved', label: 'Approved', color: '#28a745', bgColor: '#d4edda', description: 'Ready for Procurement' },
  { value: 'Not Approved', label: 'Not Approved', color: '#dc3545', bgColor: '#f8d7da', description: 'Requires Note' },
];

function ProductCard({ product, onCopyInfo, copySuccess, onAddToGym, itemStatuses, onStatusChange, statusNotes, onNoteSubmit }) {
  const [quantity, setQuantity] = useState('1');
  const [selectedGym, setSelectedGym] = useState('');
  const [customQty, setCustomQty] = useState('');
  const [previewUrl, setPreviewUrl] = useState("https://via.placeholder.com/300x200?text=Loading...");
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');

  const handleAddToGym = () => {
    const qty = quantity === 'custom' ? parseInt(customQty, 10) : parseInt(quantity, 10);
    if (selectedGym && qty > 0) {
      onAddToGym(product, selectedGym, qty, currentStatus);
      setQuantity('1');
      setCustomQty('');
      setSelectedGym('');
    }
  };

  const handleStatusChange = (status) => {
    if (status === 'Not Approved') {
      setShowNoteModal(true);
    } else {
      onStatusChange(product["Item Name"], status);
    }
  };

  const handleNoteSubmit = () => {
    if (noteText.trim()) {
      onNoteSubmit(product["Item Name"], noteText);
      setNoteText('');
      setShowNoteModal(false);
    }
  };

  const handleNoteCancel = () => {
    setNoteText('');
    setShowNoteModal(false);
  };

  // Format cost to ensure single $ symbol
  const formatCost = (cost) => {
    if (!cost) return '';
    // Remove any existing $ symbols and add a single one
    return `$${cost.replace(/[$]/g, '')}`;
  };

  const currentStatus = itemStatuses?.[product["Item Name"]] || '';
  const currentNote = statusNotes?.[product["Item Name"]] || '';

  useEffect(() => {
    let isMounted = true;
    if (product.URL) {
      fetch(`https://api.microlink.io/?url=${encodeURIComponent(product.URL)}&screenshot=true&meta=false`)
        .then(res => res.json())
        .then(data => {
          if (isMounted && data.status === 'success' && data.data.screenshot && data.data.screenshot.url) {
            setPreviewUrl(data.data.screenshot.url);
          } else {
            setPreviewUrl("https://via.placeholder.com/300x200?text=No+Preview");
          }
        })
        .catch(() => setPreviewUrl("https://via.placeholder.com/300x200?text=No+Preview"))
        .finally(() => {
          // Loading state is handled implicitly by the useEffect
        });
    } else {
      setPreviewUrl("https://via.placeholder.com/300x200?text=No+Preview");
    }
    return () => { isMounted = false; };
  }, [product.URL]);

  return (
    <div className={`product-card${product.URL ? ' has-url' : ''}`}>
      {product.URL ? (
        <a
          href={product.URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'block' }}
        >
          <img
            src={previewUrl}
            alt={product["Item Name"]}
            className="product-preview-image"
          />
        </a>
      ) : (
        <img
          src={previewUrl}
          alt={product["Item Name"]}
          className="product-preview-image"
        />
      )}
      <div className="product-card-content">
        <div className="product-card-header">
          <div className="title-container">
            <h3 className="product-title-fixed">{product["Item Name"]}</h3>
            {product.Preferred?.toLowerCase() === 'yes' && (
              <span className="preferred-badge"><span role="img" aria-label="star">⭐</span> Preferred Item</span>
            )}
          </div>
        </div>

        <div className="product-details">
          <p className="product-brand">{product.Brand}</p>
          <p className="product-category">{product.Category}</p>
          {product.Cost && <p className="product-cost">{formatCost(product.Cost)}</p>}
          {product["Exos Part Number"] && (
            <p className="product-part-number">{product["Exos Part Number"]}</p>
          )}
        </div>

        {/* Show note for Not Approved items */}
        {currentStatus === 'Not Approved' && currentNote && (
          <div className="status-note">
            <strong>Note:</strong> {currentNote}
          </div>
        )}

        <div className="product-actions">
          <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={e => setQuantity(e.target.value.replace(/^0+/, ''))}
              className="quantity-input"
              style={{ width: '60px', height: '38px' }}
              placeholder="Qty"
            />
            <select
              value={selectedGym}
              onChange={e => setSelectedGym(e.target.value)}
              className="gym-select"
              style={{ width: '90px', height: '38px' }}
            >
              <option value="">Gym</option>
              <option value="MP2">MP2</option>
              <option value="MAT3">MAT3</option>
              <option value="MP5">MP5</option>
            </select>
            <select
              className="status-select"
              value={currentStatus}
              onChange={e => handleStatusChange(e.target.value)}
              data-status={currentStatus}
              style={{ width: 'calc(100% - 160px)', height: '38px' }}
            >
              <option value="">Status</option>
              {STATUS_OPTIONS.map(opt => (
                <option 
                  key={opt.value} 
                  value={opt.value}
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddToGym}
            disabled={!selectedGym || !quantity || isNaN(Number(quantity)) || Number(quantity) < 1}
            className="add-to-gym-button"
          >
            Add to Gym
          </button>
          <button
            onClick={() => onCopyInfo(product)}
            className={`copy-button ${copySuccess === product["Item Name"] ? 'success' : ''}`}
          >
            {copySuccess === product["Item Name"] ? 'Copied!' : 'Copy Info'}
          </button>
        </div>
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
}

ProductCard.propTypes = {
  product: PropTypes.shape({
    "Item Name": PropTypes.string,
    Brand: PropTypes.string,
    Category: PropTypes.string,
    Cost: PropTypes.string,
    "Exos Part Number": PropTypes.string,
    Preferred: PropTypes.string,
    URL: PropTypes.string,
  }).isRequired,
  onCopyInfo: PropTypes.func.isRequired,
  copySuccess: PropTypes.string,
  onAddToGym: PropTypes.func.isRequired,
  itemStatuses: PropTypes.object,
  onStatusChange: PropTypes.func,
  statusNotes: PropTypes.object,
  onNoteSubmit: PropTypes.func,
};

export default React.memo(ProductCard); 