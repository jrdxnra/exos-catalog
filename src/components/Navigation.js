import React from 'react';
import PropTypes from 'prop-types';

const Navigation = ({ onSidebarToggle, onReset }) => {
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
    </nav>
  );
};

Navigation.propTypes = {
  onSidebarToggle: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired
};

export default React.memo(Navigation); 