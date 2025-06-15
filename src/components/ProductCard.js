import React from 'react';
import PropTypes from 'prop-types';

const ProductCard = ({ product, onCopyInfo, copySuccess }) => {
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
    // Don't trigger if clicking on the copy button
    if (e.target.tagName === 'BUTTON') {
      return;
    }
    window.open(product.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className="product-card"
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <img 
        src={getPreviewUrl(product.url)} 
        alt={`${product["item name"]} preview`}
        className="product-preview-image"
        loading="lazy"
      />
      
      <div className="product-card-content">
        <div className="product-card-header">
          <img 
            src={getFavicon(product.url)} 
            alt="favicon" 
            className="favicon"
          />
          <div className="title-container">
            <h3>{product["item name"]}</h3>
            {isPreferred && <span className="preferred-badge">⭐ Preferred!</span>}
          </div>
        </div>

        <div className="product-details">
          <p className="product-brand">{product.brand}</p>
          <p className="product-category">{product.category}</p>
          <p className="product-cost">{formatCost(product.cost)}</p>
          <p className="product-part-number">{product["exos part number"]}</p>
        </div>

        <div className="product-buttons">
          <button 
            className={`copy-button ${copySuccess === product["item name"] ? 'success' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onCopyInfo(product);
            }}
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
    preferred: PropTypes.string
  }).isRequired,
  onCopyInfo: PropTypes.func.isRequired,
  copySuccess: PropTypes.string
};

export default ProductCard; 