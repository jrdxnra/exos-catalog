import React from 'react';
import PropTypes from 'prop-types';

const Navigation = ({ onSidebarToggle, onReset, isGymPanelCollapsed, onToggleGymPanel }) => {
  const handleReset = (e) => {
    e.preventDefault();
    onReset(e);
  };

  return (
    <nav className="main-nav">
      <div className="nav-container">
        <div className="nav-left">
          <button 
            className="menu-button"
            onClick={onSidebarToggle}
          >
            <span className="menu-icon">☰</span>
          </button>
        </div>
        <div className="nav-center">
          <button className="nav-title" onClick={handleReset}>
            <h1>Product Catalog</h1>
          </button>
        </div>
        <div className="nav-right">
          <button
            className="gym-panel-chevron"
            onClick={onToggleGymPanel}
            aria-label={isGymPanelCollapsed ? 'Expand equipment panel' : 'Collapse equipment panel'}
          >
            <span style={{fontSize: '2rem', lineHeight: 1}}>⋮</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

Navigation.propTypes = {
  onSidebarToggle: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  isGymPanelCollapsed: PropTypes.bool.isRequired,
  onToggleGymPanel: PropTypes.func.isRequired
};

export default Navigation; 