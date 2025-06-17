import React, { useState } from 'react';
import PropTypes from 'prop-types';

function ProductCard({ product, onCopyInfo, copySuccess, onAddToGym }) {
  const [quantity, setQuantity] = useState('1');
  const [selectedGym, setSelectedGym] = useState('');
  const [customQty, setCustomQty] = useState('');

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    if (value === 'custom') {
      setQuantity('custom');
      setCustomQty('');
    } else {
      setQuantity(value);
      setCustomQty('');
    }
  };

  const handleCustomQtyChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setCustomQty(value);
    }
  };

  const handleAddToGym = () => {
    const qty = quantity === 'custom' ? parseInt(customQty, 10) : parseInt(quantity, 10);
    if (selectedGym && qty > 0) {
      onAddToGym(product, selectedGym, qty);
      setQuantity('1');
      setCustomQty('');
      setSelectedGym('');
    }
  };

  // Format cost to ensure single $ symbol
  const formatCost = (cost) => {
    if (!cost) return '';
    // Remove any existing $ symbols and add a single one
    return `$${cost.replace(/[$]/g, '')}`;
  };

  return (
    <div className="product-card">
      <div className="product-card-content">
        <div className="product-card-header">
          <div className="title-container">
            <h3>{product["Item Name"]}</h3>
            {product.Preferred?.toLowerCase() === 'yes' && (
              <span className="preferred-badge">Preferred Item</span>
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

        <div className="product-actions">
          <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
            <select
              value={selectedGym}
              onChange={(e) => setSelectedGym(e.target.value)}
              className="gym-select"
            >
              <option value="">Select Gym</option>
              <option value="MP2">MP2</option>
              <option value="MAT3">MAT3</option>
              <option value="MP5">MP5</option>
            </select>
            <select
              value={quantity}
              onChange={handleQuantityChange}
              className="quantity-select"
              style={{ width: '80px', height: '38px' }}
            >
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
              <option value="custom">Custom</option>
            </select>
            {quantity === 'custom' && (
              <input
                type="number"
                min="1"
                value={customQty}
                onChange={handleCustomQtyChange}
                className="quantity-input"
                style={{ width: '60px', height: '38px' }}
                placeholder="Qty"
              />
            )}
          </div>
          <button
            onClick={handleAddToGym}
            disabled={!selectedGym || (quantity === 'custom' ? !customQty : false)}
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
  }).isRequired,
  onCopyInfo: PropTypes.func.isRequired,
  copySuccess: PropTypes.string,
  onAddToGym: PropTypes.func.isRequired,
};

export default ProductCard; 