import React, { useState } from 'react';
import PropTypes from 'prop-types';

function ProductCard({ product, onCopyInfo, copySuccess, onAddToGym }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedGym, setSelectedGym] = useState('');

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (value > 0) {
      setQuantity(value);
    }
  };

  const handleAddToGym = () => {
    if (selectedGym && quantity > 0) {
      onAddToGym(product, selectedGym, quantity);
      setQuantity(1);
      setSelectedGym('');
    }
  };

  return (
    <div className="product-card">
      <div className="product-card-content">
        <div className="product-card-header">
          <div className="title-container">
            <h3>{product["item name"]}</h3>
            {product.preferred?.toLowerCase() === 'yes' && (
              <span className="preferred-badge">Preferred Item</span>
            )}
          </div>
        </div>

        <div className="product-details">
          <p className="product-brand">{product.brand}</p>
          <p className="product-category">{product.category}</p>
          {product.cost && <p className="product-cost">${product.cost}</p>}
          {product["exos part number"] && (
            <p className="product-part-number">{product["exos part number"]}</p>
          )}
        </div>

        <div className="product-actions">
          <div className="gym-selector">
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
          </div>
          
          <div className="quantity-selector">
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={handleQuantityChange}
              className="quantity-input"
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
            className={`copy-button ${copySuccess === product["item name"] ? 'success' : ''}`}
          >
            {copySuccess === product["item name"] ? 'Copied!' : 'Copy Info'}
          </button>
        </div>
      </div>
    </div>
  );
}

ProductCard.propTypes = {
  product: PropTypes.shape({
    "item name": PropTypes.string,
    brand: PropTypes.string,
    category: PropTypes.string,
    cost: PropTypes.string,
    "exos part number": PropTypes.string,
    preferred: PropTypes.string,
  }).isRequired,
  onCopyInfo: PropTypes.func.isRequired,
  copySuccess: PropTypes.string,
  onAddToGym: PropTypes.func.isRequired,
};

export default ProductCard; 