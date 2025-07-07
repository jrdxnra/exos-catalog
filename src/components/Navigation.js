import React, { useState } from 'react';
import PropTypes from 'prop-types';

const Navigation = ({ onSidebarToggle, onReset, onSearchToggle, isSearchVisible, searchTerm, onSearchChange, activeGym, onGymChange, gyms, onTabChange, onSidebarExpand }) => {
  const [isGymDropdownOpen, setIsGymDropdownOpen] = useState(false);

  const handleReset = (e) => {
    e.preventDefault();
    onReset(e);
  };

  const handleClearSearch = () => {
    onSearchChange('');
  };

  const handleGymSelect = (gym) => {
    onGymChange(gym);
    setIsGymDropdownOpen(false);
    // Removed auto-switch to gyms tab and sidebar expand
  };

  const toggleGymDropdown = () => {
    setIsGymDropdownOpen(!isGymDropdownOpen);
  };

  // Close dropdown if clicking outside
  React.useEffect(() => {
    if (!isGymDropdownOpen) return;
    const handleClick = (e) => {
      if (!e.target.closest('.gym-selector-dropdown') && !e.target.closest('.gym-selector-icon-button')) {
        setIsGymDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isGymDropdownOpen]);

  return (
    <nav className="main-nav" style={{ position: 'relative' }}>
      {/* Left side - Menu button */}
      <button 
        className="menu-button nav-chevron-left"
        onClick={onSidebarToggle}
        style={{ 
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: 0, 
          paddingLeft: 8,
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          fontSize: '1.4em',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          letterSpacing: '0.02em'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
          e.currentTarget.style.letterSpacing = '0.08em';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
          e.currentTarget.style.letterSpacing = '0.02em';
        }}
      >
        <span className="menu-icon">☰</span>
      </button>

      {/* Gym Selector - positioned after menu button */}
      <div style={{ 
        position: 'absolute', 
        left: 48, 
        top: '50%', 
        transform: 'translateY(-50%)',
        zIndex: 1000
      }}>
        <button
          className="gym-selector-icon-button"
          onClick={toggleGymDropdown}
          aria-label="Select default gym"
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            borderRadius: '50%',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            letterSpacing: '0.02em',
            zIndex: 1002
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.letterSpacing = '0.08em';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.letterSpacing = '0.02em';
          }}
        >
          {activeGym ? (
            <>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                marginRight: 2
              }}>{activeGym}</span>
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="white" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ marginLeft: 0 }}
              >
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </>
          ) : (
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
          )}
        </button>
      </div>

      {/* Dropdown Menu - positioned outside the button container */}
      {isGymDropdownOpen && (
        <div 
          className="gym-selector-dropdown"
          style={{
            position: 'fixed',
            top: '70px',
            left: '48px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e0e0e0',
            zIndex: 9999,
            minWidth: '90px',
            overflow: 'hidden',
            padding: 0
          }}
        >
          {gyms.map((gym) => (
            <button
              key={gym}
              onClick={() => handleGymSelect(gym)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: gym === activeGym ? '#f0f0f0' : 'transparent',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: gym === activeGym ? '600' : '400',
                color: gym === activeGym ? '#333' : '#666',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (gym !== activeGym) {
                  e.target.style.backgroundColor = '#f8f8f8';
                }
              }}
              onMouseLeave={(e) => {
                if (gym !== activeGym) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              {gym === activeGym && (
                <svg 
                  width="12" 
                  height="12" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="#333" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
              )}
              <span>{gym}</span>
            </button>
          ))}
        </div>
      )}

      {/* Search Bar - appears on the right near the search icon when active */}
      {isSearchVisible && (
        <div 
          className="nav-search-container"
          style={{
            position: 'absolute',
            right: '60px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1001
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '4px 10px',
            border: '1px solid #e0e0e0',
            maxWidth: '200px',
            minWidth: '160px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#666" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#333',
                fontSize: '13px',
                outline: 'none',
                minWidth: '0'
              }}
              autoFocus
            />
            <button
              onClick={handleClearSearch}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                cursor: 'pointer',
                padding: '2px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f0f0f0';
                e.target.style.color = '#333';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#666';
              }}
              aria-label="Clear search"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* Centered Title */}
      <div className="nav-container" style={{ padding: 0, justifyContent: 'center' }}>
        <div className="nav-center" style={{ flex: 1, textAlign: 'center' }}>
          <button className="nav-title" onClick={handleReset}>
            <h1>EXOs Equipment List</h1>
          </button>
        </div>
      </div>
      
      {/* Search Icon - positioned in top right */}
      <button 
        className="search-icon-button"
        onClick={onSearchToggle}
        aria-label="Toggle search"
        style={{
          position: 'absolute',
          right: 8,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          padding: 8,
          borderRadius: '50%',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1002,
          letterSpacing: '0.02em'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
          e.currentTarget.style.letterSpacing = '0.08em';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
          e.currentTarget.style.letterSpacing = '0.02em';
        }}
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="white" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className={isSearchVisible ? 'search-icon-active' : ''}
          style={{
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
      </button>
    </nav>
  );
};

Navigation.propTypes = {
  onSidebarToggle: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onSearchToggle: PropTypes.func.isRequired,
  isSearchVisible: PropTypes.bool.isRequired,
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  activeGym: PropTypes.string.isRequired,
  onGymChange: PropTypes.func.isRequired,
  gyms: PropTypes.arrayOf(PropTypes.string).isRequired,
  onTabChange: PropTypes.func.isRequired,
  onSidebarExpand: PropTypes.func.isRequired
};

export default React.memo(Navigation); 