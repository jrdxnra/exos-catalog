import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import './App.css';
import LoadingState from './components/LoadingState';
import Navigation from './components/Navigation';
import Sidebar from './components/Sidebar';

// Lazy load the ProductCard component
const ProductCard = lazy(() => import('./components/ProductCard'));

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(null);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);

  useEffect(() => {
    const fetchGoogleSheetData = async () => {
      try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbyPDJRGyVH0H9LCRBS4uMowMPE59KphrQf7g16RpbkrztR36OKGmSKMCpdA8uTAD62C/exec');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    fetchGoogleSheetData();
  }, []);

  // Get unique categories and brands
  const { categories, brands } = useMemo(() => {
    const uniqueCategories = [...new Set(products.map(product => product.category).filter(Boolean))];
    const uniqueBrands = [...new Set(products.map(product => product.brand).filter(Boolean))];
    return {
      categories: uniqueCategories.sort(),
      brands: uniqueBrands.sort()
    };
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = searchTerm === '' || 
        product["item name"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product["exos part number"]?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
      const matchesBrand = selectedBrand === '' || product.brand === selectedBrand;
      const isPreferred = product.preferred?.toLowerCase() === 'yes';

      // Show all items if searching or if showAllItems is true
      const shouldShow = showAllItems || searchTerm !== '' || selectedCategory !== '' || selectedBrand !== '';

      return matchesSearch && matchesCategory && matchesBrand && (shouldShow || isPreferred);
    });
  }, [products, searchTerm, selectedCategory, selectedBrand, showAllItems]);

  const copyProductInfo = (product) => {
    const productInfo = [
      product["item name"] || '',
      product.brand || '',
      product.category || '',
      product.cost ? `$${product.cost}` : '',
      product["exos part number"] || '',
      product.url || ''
    ].join('\t');

    navigator.clipboard.writeText(productInfo).then(() => {
      setCopySuccess(product["item name"]);
      setTimeout(() => setCopySuccess(null), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term !== '') {
      setShowAllItems(true);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setShowAllItems(true);
  };

  const handleBrandSelect = (brand) => {
    setSelectedBrand(brand);
    setShowAllItems(true);
  };

  const handleReset = (e) => {
    if (e) {
      e.preventDefault();
    }
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedBrand('');
    setShowAllItems(false);
    // Reset the URL to the base path
    window.history.pushState({}, '', '/');
  };

  if (loading) return <LoadingState type="category" message="Loading products..." />;
  if (error) return <div className="error">Error: {error}</div>;
  if (!products?.length && !loading) return <div className="no-products">No products found</div>;

  return (
    <div className="App">
      <Navigation 
        onSidebarToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
        onReset={handleReset}
      />
      
      <div className="main-content">
        <Sidebar
          categories={categories}
          brands={brands}
          selectedCategory={selectedCategory}
          selectedBrand={selectedBrand}
          searchTerm={searchTerm}
          onCategoryChange={handleCategorySelect}
          onBrandChange={handleBrandSelect}
          onSearchChange={handleSearch}
          isExpanded={isSidebarExpanded}
          onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
        />

        <div className={`content-area ${isSidebarExpanded ? 'sidebar-expanded' : ''}`}>
          {!showAllItems && (
            <div className="preferred-header">
              <h2>Preferred Items</h2>
              <p>Use the search or filters to view all items</p>
            </div>
          )}
          
          <div className="products-container">
            <Suspense fallback={<LoadingState type="products" />}>
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={index}
                  product={product}
                  onCopyInfo={copyProductInfo}
                  copySuccess={copySuccess}
                />
              ))}
            </Suspense>
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="no-results">
              No products match your filters. Try adjusting your search criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;