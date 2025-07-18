import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

const STATUS_OPTIONS = [
  { value: 'Hold', label: 'Hold', color: '#ffc107', bgColor: '#fff3cd', description: 'Buy Later List' },
  { value: 'Waitlist', label: 'Waitlist', color: '#6c757d', bgColor: '#f8f9fa', description: 'Waiting for Approval' },
  { value: 'Pending Approval', label: 'Pending Approval', color: '#007bff', bgColor: '#cce7ff', description: 'Manager Review' },
  { value: 'Approved', label: 'Approved', color: '#28a745', bgColor: '#d4edda', description: 'Ready for Procurement' },
  { value: 'Not Approved', label: 'Not Approved', color: '#dc3545', bgColor: '#f8d7da', description: 'Requires Note' },
];

function ProductCard({ product, onCopyInfo, copySuccess, onAddToGym, itemStatuses, onStatusChange, statusNotes, onNoteSubmit, activeGym, gyms, isEditMode, onProductUpdate, onEditModeToggle, isSyncInProgress }) {
  const [quantity, setQuantity] = useState('1');
  const [selectedGym, setSelectedGym] = useState('');
  const [customQty, setCustomQty] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [manualGym, setManualGym] = useState(false);
  
  // Edit mode state
  const [editingProduct, setEditingProduct] = useState({ ...product });
  const [isSaving, setIsSaving] = useState(false);

  // If activeGym changes and user hasn't manually selected a gym, update selectedGym
  useEffect(() => {
    if (!manualGym) {
      setSelectedGym(activeGym || '');
    }
  }, [activeGym, manualGym]);

  const handleGymChange = (e) => {
    setSelectedGym(e.target.value);
    setManualGym(true);
  };

  const handleAddToGym = () => {
    if (isSyncInProgress) return; // Disable during sync
    
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

  // Edit mode functions
  const handleFieldEdit = (field, value) => {
    setEditingProduct(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!onProductUpdate) return;
    
    setIsSaving(true);
    try {
              await onProductUpdate(product.id || product["EXOS Part Number"], editingProduct);
      setEditingProduct({ ...editingProduct }); // Reset to current state
    } catch (error) {
      console.error('Error saving product:', error);
      // Re-throw the error so the parent component can handle it
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDone = () => {
    // Reset editing state and exit edit mode
    setEditingProduct({ ...product });
    if (onEditModeToggle) {
      onEditModeToggle();
    }
  };

  // Format cost to ensure single $ symbol
  const formatCost = (cost) => {
    if (!cost) return '';
    try {
      // Convert to string and remove any existing $ symbols, then add a single one
      return `$${String(cost || '').replace(/[$]/g, '')}`;
    } catch (error) {
      console.error('Error formatting cost:', error);
      return '';
    }
  };

  const currentStatus = itemStatuses?.[product["Item Name"]] || '';
  const currentNote = statusNotes?.[product["Item Name"]] || '';

  // Function to fetch microlink preview with rate limiting and caching
  const fetchMicrolinkPreview = useCallback(async (url) => {
    if (!url) {
      setPreviewUrl(null);
      setIsLoadingPreview(false);
      return;
    }

    // Skip microlink for known problematic URLs
    const problematicUrls = ['x.com', 'twitter.com', 'amazon.com', 'amzn.to', 'bit.ly', 'tinyurl.com'];
    const urlLower = url.toLowerCase();
    const isProblematicUrl = problematicUrls.some(domain => urlLower.includes(domain));
    
    if (isProblematicUrl) {
      console.log('Skipping microlink for problematic URL:', url);
      setPreviewUrl(null);
      setIsLoadingPreview(false);
      return;
    }
    
    // Check cache first
    const cacheKey = `microlink_cache_${btoa(url)}`;
    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        const cacheAge = Date.now() - parsed.timestamp;
        // Cache for 1 hour
        if (cacheAge < 3600000) {
          console.log('Using cached microlink preview for:', url);
          setPreviewUrl(parsed.previewUrl);
          setIsLoadingPreview(false);
          return;
        }
      } catch (e) {
        // Invalid cache data, continue with fetch
      }
    }
    
    // Check if we've been rate limited recently
    const rateLimitKey = 'microlink_rate_limited';
    const rateLimitTime = sessionStorage.getItem(rateLimitKey);
    const now = Date.now();
    
    if (rateLimitTime && (now - parseInt(rateLimitTime)) < 60000) { // 1 minute cooldown
      console.log('Skipping microlink due to recent rate limit');
      setPreviewUrl(null);
      setIsLoadingPreview(false);
      return;
    }
    
    // Check if there's already a request in progress globally
    const globalRequestKey = 'microlink_request_in_progress';
    if (sessionStorage.getItem(globalRequestKey)) {
      console.log('Skipping microlink - another request in progress');
      setPreviewUrl(null);
      setIsLoadingPreview(false);
      return;
    }
    
    try {
      console.log('Fetching microlink preview for:', url);
      // Set global request flag
      sessionStorage.setItem(globalRequestKey, 'true');
      
      const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false`);
      
      if (response.status === 429) {
        console.log('Rate limited by microlink API, setting cooldown');
        sessionStorage.setItem(rateLimitKey, now.toString());
        throw new Error('Rate limited');
      }
      if (response.status === 400) {
        throw new Error('Bad request');
      }
      
      const data = await response.json();
      console.log('Microlink response:', data);
      
      if (data.status === 'success' && data.data.screenshot && data.data.screenshot.url) {
        console.log('Setting preview URL:', data.data.screenshot.url);
        setPreviewUrl(data.data.screenshot.url);
        
        // Cache the successful result
        const cacheData = {
          previewUrl: data.data.screenshot.url,
          timestamp: Date.now()
        };
        sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } else {
        throw new Error('API error');
      }
    } catch (error) {
      console.log('Microlink failed for URL:', url, 'Error:', error.message);
      setPreviewUrl(null);
    } finally {
      // Clear global request flag
      sessionStorage.removeItem(globalRequestKey);
      setIsLoadingPreview(false);
    }
  }, []);

  // Single effect to handle microlink previews for both normal and edit modes
  useEffect(() => {
    const url = isEditMode ? editingProduct.URL : product.URL;
    
    if (url) {
      if (isEditMode) {
        // Edit mode - fetch immediately
        console.log('Edit mode - fetching preview for:', url);
        setIsLoadingPreview(true);
        fetchMicrolinkPreview(url);
      } else {
        // Normal mode - add delay to avoid overwhelming the API
        const timer = setTimeout(() => {
          console.log('Normal mode - fetching preview for:', url);
          setIsLoadingPreview(true);
          fetchMicrolinkPreview(url);
        }, Math.random() * 2000); // Random delay 0-2 seconds (back to original)
        
        return () => clearTimeout(timer);
      }
    }
  }, [isEditMode ? editingProduct.URL : product.URL, isEditMode, fetchMicrolinkPreview]);

  return (
    <div className={`product-card${product.URL ? ' has-url' : ''}${isEditMode ? ' edit-mode' : ''}${product.id ? ' firebase-item' : ''}`}>
      {/* Preview Image - clickable to edit URL in edit mode */}
      {isEditMode ? (
        <div 
          className="product-preview-image-container"
          onClick={() => {
            const newUrl = prompt('Enter new URL:', editingProduct.URL || '');
            if (newUrl !== null) {
              handleFieldEdit('URL', newUrl);
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          {isLoadingPreview ? (
            <div className="product-preview-placeholder">
              <div className="loading-spinner small"></div>
              <p>Loading preview...</p>
            </div>
          ) : previewUrl ? (
            <img
              src={previewUrl}
              alt={editingProduct["Item Name"]}
              className="product-preview-image"
            />
          ) : (
            <div className="product-preview-placeholder">
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔗</div>
              <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>
                {editingProduct.URL ? 'Preview unavailable' : 'No URL'}
              </p>
            </div>
          )}
          <div className="edit-overlay">
            <span>Click to edit URL</span>
          </div>
        </div>
      ) : (
        <>
          {product.URL ? (
            <a
              href={product.URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block' }}
            >
              {isLoadingPreview ? (
                <div className="product-preview-placeholder">
                  <div className="loading-spinner small"></div>
                  <p>Loading preview...</p>
                </div>
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt={product["Item Name"]}
                  className="product-preview-image"
                />
              ) : (
                <div className="product-preview-placeholder">
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔗</div>
                  <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>
                    Click to visit website
                  </p>
                </div>
              )}
            </a>
          ) : (
            <div className="product-preview-placeholder">
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔗</div>
              <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>
                Update product link
              </p>
            </div>
          )}
        </>
      )}
      <div className="product-card-content">
        <div className="product-card-header">
          <div className="title-container">
            {isEditMode ? (
              <input
                type="text"
                value={editingProduct["Item Name"] || ''}
                onChange={(e) => handleFieldEdit("Item Name", e.target.value)}
                className="edit-input title-input"
                placeholder="Item Name"
              />
            ) : (
            <h3 className="product-title-fixed">{product["Item Name"]}</h3>
            )}
            {isEditMode ? (
              <select
                value={editingProduct.Preferred || ''}
                onChange={(e) => handleFieldEdit('Preferred', e.target.value)}
                className="edit-select preferred-select"
              >
                <option value="">Not Preferred</option>
                <option value="P">Preferred (P)</option>
                <option value="C">Coach's Recommended (C)</option>
                <option value="P+C">Both Preferred & Coach's (P+C)</option>
              </select>
            ) : (
              product.Preferred && (
              <span className="preferred-badge">
                  {product.Preferred === 'P' && <span role="img" aria-label="star">⭐</span>}
                  {product.Preferred === 'C' && <span role="img" aria-label="trophy">🏆</span>}
                  {product.Preferred === 'P+C' && <span role="img" aria-label="star and trophy">⭐🏆</span>}
                  {product.Preferred === 'P' && ' Preferred Item'}
                  {product.Preferred === 'C' && ' Coach\'s Recommended'}
                  {product.Preferred === 'P+C' && ' Preferred & Coach\'s Recommended'}
              </span>
              )
            )}
          </div>
        </div>

        <div className="product-details">
          {isEditMode ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={editingProduct.Brand || ''}
                  onChange={(e) => handleFieldEdit('Brand', e.target.value)}
                  className="edit-input brand-input"
                  placeholder="Brand"
                />
                <input
                  type="text"
                  value={editingProduct.Category || ''}
                  onChange={(e) => handleFieldEdit('Category', e.target.value)}
                  className="edit-input category-input"
                  placeholder="Category"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <input
                  type="text"
                  value={editingProduct["EXOS Part Number"] || editingProduct["Part Number"] || ''}
                  onChange={(e) => handleFieldEdit('EXOS Part Number', e.target.value)}
                  className="edit-input part-number-input"
                  placeholder="Part Number"
                  disabled={true}
                  style={{ 
                    backgroundColor: '#f5f5f5', 
                    color: '#666', 
                    cursor: 'not-allowed',
                    border: '1px solid #ddd'
                  }}
                  title="Part Number cannot be changed - it's used as a unique identifier"
                />
                <input
                  type="text"
                  value={editingProduct.Cost ? String(editingProduct.Cost || '').replace(/[$]/g, '') : ''}
                  onChange={(e) => handleFieldEdit('Cost', e.target.value)}
                  className="edit-input cost-input"
                  placeholder="Cost"
                />
              </div>
            </>
          ) : (
            <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p className="product-brand" style={{ margin: 0 }}>{product.Brand}</p>
            <p className="product-category" style={{ margin: 0, textAlign: 'right' }}>{product.Category}</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p className="product-part-number" style={{ margin: 0 }}>
                  {product["EXOS Part Number"] || product["Part Number"] || product["part_number"] || 'No Part Number'}
            </p>
            {product.Cost && <p className="product-cost" style={{ margin: 0, textAlign: 'right' }}>{formatCost(product.Cost)}</p>}
          </div>
            </>
          )}
        </div>

        {/* Show note for Not Approved items */}
        {currentStatus === 'Not Approved' && currentNote && (
          <div className="status-note">
            <strong>Note:</strong> {currentNote}
          </div>
        )}

        <div className="product-actions">
          {isEditMode ? (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="save-button"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleDone}
                className="done-button"
              >
                Done
              </button>
            </>
          ) : (
            <>
          <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={e => setQuantity(String(e.target.value || '').replace(/^0+/, ''))}
              className="quantity-input"
              style={{ width: '60px', height: '38px' }}
              placeholder="Qty"
            />
            <select
              value={selectedGym}
              onChange={handleGymChange}
              className="gym-select"
              style={{ width: '90px', height: '38px' }}
            >
              <option value="">Gym</option>
              {gyms.map((gym) => (
                <option key={gym} value={gym}>{gym}</option>
              ))}
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
            </>
          )}
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
    Cost: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    "EXOS Part Number": PropTypes.string,
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
  activeGym: PropTypes.string,
  gyms: PropTypes.arrayOf(PropTypes.string),
  isEditMode: PropTypes.bool,
  onProductUpdate: PropTypes.func,
  onEditModeToggle: PropTypes.func,
  isSyncInProgress: PropTypes.bool,
};

export default React.memo(ProductCard); 