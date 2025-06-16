import React from 'react';
import PropTypes from 'prop-types';

function RequestedItemsModal({ isOpen, onClose, selectedGym, products, selectedItems, itemStatuses, onStatusChange, onSelect }) {
  if (!isOpen) return null;

  const selectedProducts = products.filter(product => selectedItems[product["item name"]]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Requested Items - {selectedGym}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          {selectedProducts.length === 0 ? (
            <div className="no-items-message">
              No items selected. Select items from the product list to add them to your request.
            </div>
          ) : (
            <div className="requested-items-list">
              {selectedProducts.map((product, index) => (
                <div key={index} className="requested-item">
                  <div className="item-info">
                    <h3>{product["item name"]}</h3>
                    <p className="item-brand">{product.brand}</p>
                    <p className="item-category">{product.category}</p>
                    <p className="item-cost">{product.cost ? `$${product.cost}` : ''}</p>
                    <p className="item-part-number">{product["exos part number"]}</p>
                  </div>
                  
                  <div className="item-actions">
                    <select
                      className="status-select"
                      value={itemStatuses[product["item name"]] || ''}
                      onChange={(e) => onStatusChange(product["item name"], e.target.value)}
                    >
                      <option value="">Select Status</option>
                      <option value="Hold">Hold</option>
                      <option value="Needs Approval">Needs Approval</option>
                      <option value="Approved">Approved</option>
                      <option value="Ordered">Ordered</option>
                      <option value="Received">Received</option>
                    </select>
                    
                    <button
                      className="remove-item-button"
                      onClick={() => onSelect(product["item name"], false)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

RequestedItemsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedGym: PropTypes.string.isRequired,
  products: PropTypes.array.isRequired,
  selectedItems: PropTypes.object.isRequired,
  itemStatuses: PropTypes.object.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired
};

export default RequestedItemsModal; 