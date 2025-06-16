import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import './App.css';
import LoadingState from './components/LoadingState';
import Navigation from './components/Navigation';
import Sidebar from './components/Sidebar';
import GymSelector from './components/GymSelector';
import RequestedItemsModal from './components/RequestedItemsModal';

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

  // Request items states
  const [selectedGym, setSelectedGym] = useState('');
  const [selectedItems, setSelectedItems] = useState({});
  const [itemStatuses, setItemStatuses] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchGoogleSheetData = async () => {
      try {
        const response = await fetch(process.env.REACT_APP_API_URL);
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
    window.history.pushState({}, '', '/');
  };

  const handleGymChange = (gym) => {
    setSelectedGym(gym);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleItemSelect = (itemName, isSelected) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemName]: isSelected
    }));
  };

  const handleStatusChange = (itemName, status) => {
    setItemStatuses(prev => ({
      ...prev,
      [itemName]: status
    }));
  };

  const copyRequestedItems = () => {
    const selectedProducts = filteredProducts.filter(product => selectedItems[product["item name"]]);
    const listItems = selectedProducts.map(product => {
      const status = itemStatuses[product["item name"]] || '';
      return [
        product["item name"],
        product.brand,
        product.category,
        product.cost ? `$${product.cost}` : '',
        product["exos part number"],
        status
      ].join('\t');
    });

    const header = `Requested Items for ${selectedGym}\n\n`;
    const list = listItems.join('\n');
    const fullList = header + list;

    navigator.clipboard.writeText(fullList).then(() => {
      setCopySuccess('requested-items');
      setTimeout(() => setCopySuccess(null), 2000);
    });
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
          <GymSelector
            selectedGym={selectedGym}
            onGymChange={handleGymChange}
          />

          {!showAllItems ? (
            <div className="preferred-section">
              <div className="preferred-header">
                <h2>Preferred Items</h2>
                <p>These are the recommended products to choose from.</p>
              </div>
              <div className="products-container">
                <Suspense fallback={<LoadingState type="products" />}>
                  {filteredProducts.map((product, index) => (
                    <ProductCard
                      key={index}
                      product={product}
                      onCopyInfo={copyProductInfo}
                      copySuccess={copySuccess}
                      onSelect={handleItemSelect}
                      isSelected={selectedItems[product["item name"]] || false}
                    />
                  ))}
                </Suspense>
              </div>
            </div>
          ) : (
            <div className="category-section">
              <div className="category-info">
                <h2>Browse Our Catalog</h2>
                <p>Use the sidebar to filter products by category, brand, or search for specific items.</p>
                <p>Each product card includes detailed information and direct purchase links.</p>
              </div>
              <div className="products-container">
                <Suspense fallback={<LoadingState type="products" />}>
                  {filteredProducts.map((product, index) => (
                    <ProductCard
                      key={index}
                      product={product}
                      onCopyInfo={copyProductInfo}
                      copySuccess={copySuccess}
                      onSelect={handleItemSelect}
                      isSelected={selectedItems[product["item name"]] || false}
                    />
                  ))}
                </Suspense>
              </div>
            </div>
          )}
          
          {filteredProducts.length === 0 && (
            <div className="no-results">
              No products match your filters. Try adjusting your search criteria.
            </div>
          )}
        </div>
      </div>

      <RequestedItemsModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        selectedGym={selectedGym}
        products={products}
        selectedItems={selectedItems}
        itemStatuses={itemStatuses}
        onStatusChange={handleStatusChange}
        onSelect={handleItemSelect}
      />
    </div>
  );
}

export default App;