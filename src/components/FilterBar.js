import React from 'react';
import PropTypes from 'prop-types';

const FilterBar = ({ 
  categories, 
  brands, 
  selectedCategory, 
  selectedBrand, 
  searchTerm,
  onCategoryChange, 
  onBrandChange, 
  onSearchChange 
}) => {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="filter-group">
        <select 
          value={selectedCategory} 
          onChange={(e) => onCategoryChange(e.target.value)}
          className="filter-select"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <select 
          value={selectedBrand} 
          onChange={(e) => onBrandChange(e.target.value)}
          className="filter-select"
        >
          <option value="">All Brands</option>
          {brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

FilterBar.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.string).isRequired,
  brands: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedCategory: PropTypes.string.isRequired,
  selectedBrand: PropTypes.string.isRequired,
  searchTerm: PropTypes.string.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  onBrandChange: PropTypes.func.isRequired,
  onSearchChange: PropTypes.func.isRequired
};

export default FilterBar; 