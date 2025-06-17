import React, { useState } from 'react';
import PropTypes from 'prop-types';

function ProductCard({ product, onCopyInfo, copySuccess, onAddToGym }) {
  const [quantity, setQuantity] = useState('1');
  const [selectedGym, setSelectedGym] = useState('');

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setQuantity(value);
    }
  };

  const handleAddToGym = () => {
    const qty = parseInt(quantity, 10);
    if (selectedGym && qty > 0) {
      onAddToGym(product, selectedGym, qty);
      setQuantity('1');
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
          {product["EXOS Part Number"] && (
            <p className="product-part-number">{product["EXOS Part Number"]}</p>
          )}
        </div>

        <div className="product-actions">
          <div style={{ display: 'flex', flexDirection: 'row', gap: '8rem', alignItems: 'center', marginBottom: '0.5rem' }}>
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
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={handleQuantityChange}
              className="quantity-input"
              style={{ height: '38px' }}
            />
          </div>
          <button
            onClick={handleAddToGym}
            disabled={!selectedGym}
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
    "EXOS Part Number": PropTypes.string,
    Preferred: PropTypes.string,
  }).isRequired,
  onCopyInfo: PropTypes.func.isRequired,
  copySuccess: PropTypes.string,
  onAddToGym: PropTypes.func.isRequired,
};

export default ProductCard; 