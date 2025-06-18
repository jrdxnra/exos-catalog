import React from 'react';
import PropTypes from 'prop-types';

const Sidebar = ({ 
  categories, 
  brands, 
  selectedCategory, 
  selectedBrand, 
  searchTerm,
  onCategoryChange,
  onBrandChange,
  onSearchChange,
  isExpanded,
  onToggle
}) => {
  const handleCategoryClick = (e, category) => {
    e.preventDefault();
    onCategoryChange(category);
  };

  const handleBrandClick = (e, brand) => {
    e.preventDefault();
    onBrandChange(brand);
  };

  return (
    <div className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="sidebar-content">
        <div className="search-section">
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="sidebar-search"
          />
        </div>

        <div className="categories-section">
          <h3>Categories</h3>
          <div className="category-list">
            <button
              key="preferred-items"
              className={`category-item ${selectedCategory === 'preferred' ? 'active' : ''}`}
              onClick={(e) => handleCategoryClick(e, 'preferred')}
            >
              <span role="img" aria-label="star">⭐</span> Preferred Items
            </button>
            <button
              key="all-categories"
              className={`category-item ${!selectedCategory ? 'active' : ''}`}
              onClick={(e) => handleCategoryClick(e, '')}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category}
                className={`category-item ${selectedCategory === category ? 'active' : ''}`}
                onClick={(e) => handleCategoryClick(e, category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="brands-section">
          <h3>Brands</h3>
          <div className="brand-list">
            {brands.map((brand) => (
              <button
                key={brand}
                className={`brand-item ${selectedBrand === brand ? 'active' : ''}`}
                onClick={(e) => handleBrandClick(e, brand)}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

Sidebar.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.string).isRequired,
  brands: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedCategory: PropTypes.string,
  selectedBrand: PropTypes.string,
  searchTerm: PropTypes.string,
  onCategoryChange: PropTypes.func.isRequired,
  onBrandChange: PropTypes.func.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired
};

export default React.memo(Sidebar); 