import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

function ProductCard({ product, onCopyInfo, copySuccess, onAddToGym }) {
  const [quantity, setQuantity] = useState('1');
  const [selectedGym, setSelectedGym] = useState('');
  const [customQty, setCustomQty] = useState('');
  const [previewUrl, setPreviewUrl] = useState("https://via.placeholder.com/300x200?text=Loading...");
  const [loading, setLoading] = useState(!!product.URL);

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
        .finally(() => setLoading(false));
    } else {
      setPreviewUrl("https://via.placeholder.com/300x200?text=No+Preview");
      setLoading(false);
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

        <div className="product-actions">
          <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
            <input
              list="gyms"
              value={selectedGym}
              onChange={e => setSelectedGym(e.target.value)}
              className="gym-select"
              style={{ width: '90px', height: '38px' }}
              placeholder="Select Gym"
            />
            <datalist id="gyms">
              <option value="MP2" />
              <option value="MAT3" />
              <option value="MP5" />
            </datalist>
            <div style={{ flex: 1 }}></div>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={e => setQuantity(e.target.value.replace(/^0+/, ''))}
              className="quantity-input"
              style={{ width: '90px', height: '38px' }}
              placeholder="Qty"
            />
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
};

export default ProductCard; 