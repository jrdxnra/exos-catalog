import React from 'react';
import PropTypes from 'prop-types';

const LoadingState = ({ type = 'default', message }) => {
  const getLoadingContent = () => {
    switch (type) {
      case 'category':
        return (
          <div className="loading-category">
            <div className="loading-spinner"></div>
            <p>Loading categories...</p>
          </div>
        );
      
      case 'products':
        return (
          <div className="loading-products">
            <div className="loading-spinner"></div>
            <p>Loading products...</p>
            <div className="loading-progress">
              <div className="progress-bar"></div>
            </div>
          </div>
        );
      
      case 'preview':
        return (
          <div className="loading-preview">
            <div className="preview-placeholder">
              <div className="loading-spinner small"></div>
              <p>Loading preview...</p>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="loading-default">
            <div className="loading-spinner"></div>
            <p>{message || 'Loading...'}</p>
          </div>
        );
    }
  };

  return (
    <div className={`loading-state ${type}`}>
      {getLoadingContent()}
    </div>
  );
};

LoadingState.propTypes = {
  type: PropTypes.oneOf(['default', 'category', 'products', 'preview']),
  message: PropTypes.string
};

export default LoadingState; 