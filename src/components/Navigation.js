import React from 'react';
import PropTypes from 'prop-types';

const Navigation = ({ onSidebarToggle, onReset, isGymPanelCollapsed, onToggleGymPanel }) => {
  const handleReset = (e) => {
    e.preventDefault();
    onReset(e);
  };

  return (
    <nav className="main-nav" style={{ position: 'relative' }}>
      <button 
        className="menu-button nav-chevron-left"
        onClick={onSidebarToggle}
        style={{ marginLeft: 0, paddingLeft: 8 }}
      >
        <span className="menu-icon">☰</span>
      </button>
      <div className="nav-container" style={{ padding: 0 }}>
        <div className="nav-center">
          <button className="nav-title" onClick={handleReset}>
            <h1>Equipment List</h1>
          </button>
        </div>
      </div>
      <button
        className="gym-panel-chevron nav-chevron-right"
        onClick={onToggleGymPanel}
        aria-label={isGymPanelCollapsed ? 'Expand equipment panel' : 'Collapse equipment panel'}
        style={{ marginRight: 0, paddingRight: 8 }}
      >
        <span style={{fontSize: '2rem', lineHeight: 1}}>⋮</span>
      </button>
    </nav>
  );
};

Navigation.propTypes = {
  onSidebarToggle: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  isGymPanelCollapsed: PropTypes.bool.isRequired,
  onToggleGymPanel: PropTypes.func.isRequired
};

export default React.memo(Navigation); 