import React from 'react';
import PropTypes from 'prop-types';

const ProductCard = ({ product, onCopyInfo, copySuccess, onStatusChange, onSelect, isSelected, status }) => {
  const getFavicon = (url) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}`;
    } catch {
      return null;
    }
  };

  const getPreviewUrl = (url) => {
    try {
      return `https://api.microlink.io/?url=${url}&screenshot=true&meta=false&embed=screenshot.url`;
    } catch {
      return null;
    }
  };

  const formatCost = (cost) => {
    const costStr = String(cost);
    if (costStr.startsWith('$')) return costStr;
    return `$${costStr}`;
  };

  const isPreferred = product.preferred?.toLowerCase() === 'yes';

  const handleCardClick = (e) => {
    if (e.target.tagName !== 'SELECT' && e.target.tagName !== 'INPUT') {
      window.open(product.url, '_blank');
    }
  };

  const handleCopyClick = (e) => {
    e.stopPropagation();
    onCopyInfo(product);
  };

  const handleStatusChange = (e) => {
    e.stopPropagation();
    onStatusChange(product["item name"], e.target.value);
  };

  const handleSelect = (e) => {
    e.stopPropagation();
    onSelect(product["item name"], e.target.checked);
  };

  return (
    <div className="product-card" onClick={handleCardClick}>
      <img
        src={product.preview || 'https://via.placeholder.com/300x200?text=No+Preview'}
        alt={product["item name"]}
        className="product-preview-image"
      />
      <div className="product-card-content">
        <div className="product-card-header">
          <img
            src={product.favicon || 'https://via.placeholder.com/24?text=🌐'}
            alt="favicon"
            className="favicon"
          />
          <div className="title-container">
            <h3>{product["item name"]}</h3>
            {product.preferred?.toLowerCase() === 'yes' && (
              <span className="preferred-badge">⭐ Preferred!</span>
            )}
          </div>
        </div>

        <div className="product-details">
          <p className="product-brand">{product.brand}</p>
          <p className="product-category">{product.category}</p>
          <p className="product-cost">${product.cost}</p>
          <p className="product-part-number">{product["exos part number"]}</p>
        </div>

        <div className="product-actions">
          <div className="product-selection">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleSelect}
              className="product-checkbox"
            />
            <select
              value={status}
              onChange={handleStatusChange}
              className="status-dropdown"
            >
              <option value="">Select Status</option>
              <option value="Hold">Hold</option>
              <option value="Needs Approval">Needs Approval</option>
              <option value="Approved">Approved</option>
              <option value="Ordered">Ordered</option>
              <option value="Received">Received</option>
            </select>
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
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    "item name": PropTypes.string,
    brand: PropTypes.string,
    category: PropTypes.string,
    cost: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    "exos part number": PropTypes.string,
    url: PropTypes.string,
    preview: PropTypes.string,
    favicon: PropTypes.string,
    preferred: PropTypes.string
  }).isRequired,
  onCopyInfo: PropTypes.func.isRequired,
  copySuccess: PropTypes.string,
  onStatusChange: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  isSelected: PropTypes.bool.isRequired,
  status: PropTypes.string
};

export default ProductCard; 