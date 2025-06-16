import React from 'react';
import PropTypes from 'prop-types';

function ProductCard({ product, onCopyInfo, copySuccess, onSelect, isSelected }) {
  const handleCardClick = (e) => {
    if (product.url) {
      window.open(product.url, '_blank');
    }
  };

  const handleCopyClick = (e) => {
    e.stopPropagation();
    onCopyInfo(product);
  };

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    onSelect(product["item name"], !isSelected);
  };

  return (
    <div 
      className={`product-card ${isSelected ? 'selected' : ''}`}
      onClick={handleCardClick}
    >
      {product.url && (
        <img
          src={product.url}
          alt={product["item name"]}
          className="product-preview-image"
        />
      )}
      
      <div className="product-card-content">
        <div className="product-card-header">
          <div className="title-container">
            <h3>{product["item name"]}</h3>
            {product.preferred?.toLowerCase() === 'yes' && (
              <span className="preferred-badge">Preferred</span>
            )}
          </div>
        </div>

        <div className="product-details">
          <p className="product-brand">{product.brand}</p>
          <p className="product-category">{product.category}</p>
          <p className="product-cost">{product.cost ? `$${product.cost}` : ''}</p>
          <p className="product-part-number">{product["exos part number"]}</p>
        </div>

        <div className="product-buttons">
          <div className="product-checkbox">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxClick}
              onClick={e => e.stopPropagation()}
            />
            <label onClick={e => e.stopPropagation()}>Add to List</label>
          </div>
          
          <button
            className={`copy-button ${copySuccess === product["item name"] ? 'success' : ''}`}
            onClick={handleCopyClick}
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
    url: PropTypes.string,
    preferred: PropTypes.string
  }).isRequired,
  onCopyInfo: PropTypes.func.isRequired,
  copySuccess: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  isSelected: PropTypes.bool.isRequired
};

export default ProductCard; 