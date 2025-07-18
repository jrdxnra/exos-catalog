import React, { useState } from 'react';
import PropTypes from 'prop-types';

const Navigation = ({ onSidebarToggle, onReset, onSearchToggle, isSearchVisible, searchTerm, onSearchChange, activeGym, onGymChange, gyms, onTabChange, onSidebarExpand, onNotificationManagerToggle, isEditMode, onEditModeToggle, onGoogleSheetsLink, onSyncFromGoogleSheets, isSyncInProgress }) => {
  const [isGymDropdownOpen, setIsGymDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    setIsMenuOpen(false); // Also close the main menu when gym is selected
  };

  const toggleGymDropdown = () => {
    setIsGymDropdownOpen(!isGymDropdownOpen);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Remove the double click handler since we want toggle behavior instead

  // Close dropdowns if clicking outside
  React.useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('.gym-selector-dropdown') && !e.target.closest('.gym-selector-icon-button')) {
        setIsGymDropdownOpen(false);
      }
      if (!e.target.closest('.menu-dropdown') && !e.target.closest('.nav-menu-dots')) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isGymDropdownOpen, isMenuOpen]);

  return (
    <nav className="main-nav" style={{ position: 'relative' }}>
      {/* Left side - Menu button */}
      <button 
        className="menu-button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Sidebar toggle clicked');
          onSidebarToggle();
        }}
        style={{ 
          position: 'absolute',
          left: 8,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          fontSize: '1.6em',
          fontWeight: 'normal',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          letterSpacing: '0.02em',
          padding: 8,
          borderRadius: '50%',
          minWidth: '44px',
          minHeight: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1003,
          lineHeight: '1'
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

      {/* Centered Title */}
      <div className="nav-container" style={{ padding: '0 60px', justifyContent: 'center' }}>
        <div className="nav-center" style={{ flex: 1, textAlign: 'center' }}>
          <button className="nav-title" onClick={handleReset}>
            <h1>EXOS Equipment List</h1>
          </button>
        </div>
      </div>
      
      {/* Right side - Search Icon */}
      <button 
        className="search-icon-button"
        onClick={onSearchToggle}
        aria-label="Toggle search"
        style={{
          position: 'absolute',
          right: 50,
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
          letterSpacing: '0.02em',
          minWidth: '44px',
          minHeight: '44px',
          lineHeight: '1'
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
          width="22" 
          height="22" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="white" 
          strokeWidth="2.5" 
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

      {/* Right side - Three dots menu */}
      <button 
        className="nav-menu-dots"
        onClick={toggleMenu}
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
          letterSpacing: '0.02em',
          fontSize: '1.6em',
          fontWeight: 'normal',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
          minWidth: '44px',
          minHeight: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1002,
          lineHeight: '1'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
          e.currentTarget.style.letterSpacing = '0.08em';
          e.currentTarget.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.4), 0 0 8px rgba(255, 255, 255, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
          e.currentTarget.style.letterSpacing = '0.02em';
          e.currentTarget.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
        }}
      >
        ⋮
      </button>

      {/* Three dots menu dropdown */}
      {isMenuOpen && (
        <div 
          className="menu-dropdown"
          style={{
            position: 'fixed',
            top: '70px',
            right: '12px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e0e0e0',
            zIndex: 1000,
            minWidth: '150px',
            maxWidth: '200px',
            overflow: 'hidden',
            padding: 0
          }}
        >
          {/* Gym Selector in menu */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #e0e0e0' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Default Gym</div>
            <button
              className="gym-selector-icon-button"
              onClick={toggleGymDropdown}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'transparent',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                minHeight: '44px'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f8f8f8';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <span>{activeGym || 'Select Gym'}</span>
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#666" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </button>
          </div>
          
          {/* Other menu options */}
          <button
            onClick={() => {
              onTabChange('gyms');
              onSidebarExpand(true);
              setIsMenuOpen(false);
            }}
            style={{
              width: '100%',
              padding: '12px 12px',
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#333',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minHeight: '44px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f8f8f8';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            <span role="img" aria-label="gym">🏋️</span>
            <span>Gym Items</span>
          </button>
          
          <button
            onClick={() => {
              onTabChange('filters');
              onSidebarExpand(true);
              setIsMenuOpen(false);
            }}
            style={{
              width: '100%',
              padding: '12px 12px',
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#333',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minHeight: '44px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f8f8f8';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            <span role="img" aria-label="filter">🔍</span>
            <span>Filters</span>
          </button>
          
          <button
            onClick={() => {
              onGoogleSheetsLink();
              setIsMenuOpen(false);
            }}
            style={{
              width: '100%',
              padding: '12px 12px',
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#333',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minHeight: '44px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f8f8f8';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            <span role="img" aria-label="sheets">📊</span>
            <span>Google Sheets</span>
          </button>
          
          {isEditMode && (
            <button
              onClick={() => {
                onSyncFromGoogleSheets();
                setIsMenuOpen(false);
              }}
              disabled={isSyncInProgress}
              style={{
                width: '100%',
                padding: '12px 12px',
                background: isSyncInProgress ? '#f0f0f0' : 'transparent',
                border: 'none',
                textAlign: 'left',
                cursor: isSyncInProgress ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                color: isSyncInProgress ? '#999' : '#333',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minHeight: '44px'
              }}
              onMouseEnter={(e) => {
                if (!isSyncInProgress) {
                  e.target.style.backgroundColor = '#f8f8f8';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSyncInProgress) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span role="img" aria-label="sync">
                {isSyncInProgress ? '⏳' : '🔄'}
              </span>
              <span>
                {isSyncInProgress ? 'Syncing...' : 'Sync from Sheets'}
              </span>
            </button>
          )}
          

          
          <button
            onClick={() => {
              onEditModeToggle();
              setIsMenuOpen(false);
            }}
            style={{
              width: '100%',
              padding: '12px 12px',
              background: isEditMode ? '#e3f2fd' : 'transparent',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
              color: isEditMode ? '#1976d2' : '#333',
              fontWeight: isEditMode ? '600' : '400',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minHeight: '44px'
            }}
            onMouseEnter={(e) => {
              if (!isEditMode) {
                e.target.style.backgroundColor = '#f8f8f8';
              }
            }}
            onMouseLeave={(e) => {
              if (!isEditMode) {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span role="img" aria-label="edit">✏️</span>
            <span>{isEditMode ? 'Exit Edit Mode' : 'Edit Mode'}</span>
          </button>
          
          <button
            onClick={() => {
              onNotificationManagerToggle();
              setIsMenuOpen(false);
            }}
            style={{
              width: '100%',
              padding: '12px 12px',
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#333',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minHeight: '44px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f8f8f8';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            <span role="img" aria-label="notifications">📧</span>
            <span>Notifications</span>
          </button>
        </div>
      )}

      {/* Gym Selector Dropdown - positioned relative to menu */}
      {isGymDropdownOpen && (
        <div 
          className="gym-selector-dropdown"
          style={{
            position: 'fixed',
            top: '120px',
            right: '12px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e0e0e0',
            zIndex: 1001,
            minWidth: '90px',
            maxWidth: '120px',
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
                padding: '12px 12px',
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
                gap: '8px',
                minHeight: '44px'
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
            right: '50px',
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
            padding: '6px 12px',
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
                minWidth: '0',
                padding: '4px 0'
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
                padding: '4px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                transition: 'all 0.2s ease',
                minWidth: '24px',
                minHeight: '24px'
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
  onSidebarExpand: PropTypes.func.isRequired,
  onNotificationManagerToggle: PropTypes.func.isRequired,
  isEditMode: PropTypes.bool,
  onEditModeToggle: PropTypes.func,
  onGoogleSheetsLink: PropTypes.func,
  onSyncFromGoogleSheets: PropTypes.func,
  isSyncInProgress: PropTypes.bool
};

export default React.memo(Navigation); 