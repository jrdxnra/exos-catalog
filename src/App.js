import React, { useState, useEffect, useMemo, lazy, Suspense, useCallback, useRef } from 'react';
import './App.css';
import LoadingState from './components/LoadingState';
import Navigation from './components/Navigation';
import Sidebar from './components/Sidebar';
// Lazy load GymPanel and ProductCard
const GymPanel = lazy(() => import('./components/GymPanel'));
const ProductCard = lazy(() => import('./components/ProductCard'));

// Mock data for development
const mockData = [
  {
    "Item Name": "Dumbbell Set",
    "Brand": "PowerBlock",
    "Category": "Strength",
    "Cost": "299.99",
    "Exos Part Number": "DB-001",
    "Preferred": "Yes"
  },
  {
    "Item Name": "Resistance Bands",
    "Brand": "TheraBand",
    "Category": "Mobility",
    "Cost": "49.99",
    "Exos Part Number": "RB-002",
    "Preferred": "Yes"
  },
  {
    "Item Name": "Foam Roller",
    "Brand": "TriggerPoint",
    "Category": "Recovery",
    "Cost": "34.99",
    "Exos Part Number": "FR-003",
    "Preferred": "No"
  }
];

const GYM_ITEMS_API_URL = 'https://sheetdb.io/api/v1/uwc1t04gagpfq';
const SHEETDB_TAB_NAME = 'Gym Items List';
const CATALOG_API_URL = 'https://script.google.com/macros/s/AKfycbyPDJRGyVH0H9LCRBS4uMowMPE59KphrQf7g16RpbkrztR36OKGmSKMCpdA8uTAD62C/exec';

const LOCAL_STORAGE_KEY = 'cachedProducts';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(null);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);

  // Gym states
  const [activeGym, setActiveGym] = useState('MP2');
  const [gymItems, setGymItems] = useState({
    MP2: [],
    MAT3: [],
    MP5: []
  });

  const gyms = ['MP2', 'MAT3', 'MP5'];

  const [isGymPanelCollapsed, setIsGymPanelCollapsed] = useState(true);

  // Infinite scroll states
  const [visibleProducts, setVisibleProducts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const ITEMS_PER_LOAD = 12;
  const observerRef = useRef();
  const loadingRef = useRef();

  const [initialPreferredOnly, setInitialPreferredOnly] = useState(true);

  // Fetch equipment list from Apps Script endpoint with LocalStorage caching
  useEffect(() => {
    // Try to load from localStorage first
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setProducts(parsed);
        setLoading(false);
      } catch {}
    }
    // Always fetch fresh data in the background
    const fetchCatalog = async () => {
      try {
        const response = await fetch(CATALOG_API_URL);
        if (!response.ok) throw new Error('Failed to fetch catalog');
        const data = await response.json();
        const normalized = data.map(item => ({
          "Item Name": item["item name"] || "",
          "Brand": item["brand"] || "",
          "Category": item["category"] || "",
          "Cost": item["cost"] !== undefined ? String(item["cost"]) : "",
          "Exos Part Number": item["exos part number"] || "",
          "Preferred": item["preferred"] || "",
          "URL": item["url"] || ""
        }));
        setProducts(normalized);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
      } catch (err) {
        // If fetch fails, keep whatever is in state
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  // Get unique categories and brands
  const { categories, brands } = useMemo(() => {
    const uniqueCategories = [...new Set(products.map(product => product.Category).filter(Boolean))];
    const uniqueBrands = [...new Set(products.map(product => product.Brand).filter(Boolean))];
    return {
      categories: uniqueCategories.sort(),
      brands: uniqueBrands.sort()
    };
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let base = products;
    // On initial load, only show preferred products unless filters/search are used
    if (initialPreferredOnly && !searchTerm && !selectedCategory && !selectedBrand && !showAllItems) {
      base = products.filter(product => product.Preferred?.toLowerCase() === 'yes');
    }
    return base.filter(product => {
      const matchesSearch = searchTerm === '' || 
        product["Item Name"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.Brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.Category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product["Exos Part Number"]?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBrand = selectedBrand === '' || product.Brand === selectedBrand;
      const isPreferred = product.Preferred?.toLowerCase() === 'yes';
      if (selectedCategory === 'preferred') {
        return matchesSearch && matchesBrand && isPreferred;
      }
      const matchesCategory = selectedCategory === '' || product.Category === selectedCategory;
      const shouldShow = showAllItems || searchTerm !== '' || selectedCategory !== '' || selectedBrand !== '';
      return matchesSearch && matchesCategory && matchesBrand && (shouldShow || isPreferred);
    });
  }, [products, searchTerm, selectedCategory, selectedBrand, showAllItems, initialPreferredOnly]);

  // Reset visible products when filters change
  useEffect(() => {
    setVisibleProducts(filteredProducts.slice(0, ITEMS_PER_LOAD));
    setHasMore(filteredProducts.length > ITEMS_PER_LOAD);
  }, [filteredProducts]);

  // Infinite scroll intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMoreProducts();
        }
      },
      { threshold: 0.1 }
    );
    
    observerRef.current = observer;
    
    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }
    
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, filteredProducts]);

  // Load more products for infinite scroll
  const loadMoreProducts = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    
    setTimeout(() => {
      const currentLength = visibleProducts.length;
      const nextBatch = filteredProducts.slice(currentLength, currentLength + ITEMS_PER_LOAD);
      
      setVisibleProducts(prev => [...prev, ...nextBatch]);
      setHasMore(currentLength + ITEMS_PER_LOAD < filteredProducts.length);
      setIsLoadingMore(false);
    }, 500); // Simulate loading delay
  }, [visibleProducts.length, filteredProducts, isLoadingMore, hasMore]);

  // Scroll to top functionality
  const scrollToTop = () => {
    console.log('scrollToTop function called'); // Debug log
    console.log('Current scroll position:', window.scrollY); // Debug current position
    
    // Find the content-area element and scroll it
    const contentArea = document.querySelector('.content-area');
    if (contentArea) {
      console.log('Found content-area, scrolling it to top');
      contentArea.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      console.log('Content-area not found, trying window scroll');
      // Fallback to window scroll
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    
    console.log('Scroll attempted, new position:', window.scrollY); // Debug new position
  };

  // Show/hide back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // When user interacts with filters/search, show all products
  useEffect(() => {
    if (searchTerm || selectedCategory || selectedBrand || showAllItems) {
      setInitialPreferredOnly(false);
    }
  }, [searchTerm, selectedCategory, selectedBrand, showAllItems]);

  // Handlers with useCallback
  const copyProductInfo = useCallback((product) => {
    const productInfo = [
      product["Item Name"] || '',
      product.Brand || '',
      product.Category || '',
      product.Cost ? `$${product.Cost}` : '',
      product["Exos Part Number"] || '',
      product.URL || ''
    ].join('\t');
    navigator.clipboard.writeText(productInfo).then(() => {
      setCopySuccess(product["Item Name"]);
      setTimeout(() => setCopySuccess(null), 2000);
    }).catch(() => {});
  }, []);

  const handleAddToGym = useCallback(async (product, gym, quantity) => {
    const newItem = { ...product, quantity, status: 'Pending', Gym: gym };
    setGymItems(prev => ({
      ...prev,
      [gym]: [...prev[gym], newItem]
    }));
    try {
      await fetch(`${GYM_ITEMS_API_URL}?sheet=${encodeURIComponent(SHEETDB_TAB_NAME)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [newItem] })
      });
    } catch (err) {}
  }, []);

  const handleRemoveFromGym = useCallback(async (gym, index) => {
    setGymItems(prev => {
      const itemToRemove = prev[gym][index];
      if (itemToRemove && itemToRemove["Exos Part Number"]) {
        const deleteUrl = `${GYM_ITEMS_API_URL}/Exos%20Part%20Number/${encodeURIComponent(itemToRemove["Exos Part Number"])}?sheet=${encodeURIComponent(SHEETDB_TAB_NAME)}`;
        fetch(deleteUrl, { method: 'DELETE' });
      }
      return {
        ...prev,
        [gym]: prev[gym].filter((_, i) => i !== index)
      };
    });
  }, []);

  const handleStatusChange = useCallback(async (gym, itemName, status) => {
    setGymItems(prev => {
      const updated = prev[gym].map(item =>
        item["Item Name"] === itemName ? { ...item, status } : item
      );
      const itemToUpdate = updated.find(item => item["Item Name"] === itemName);
      if (itemToUpdate && itemToUpdate["Exos Part Number"]) {
        const patchUrl = `${GYM_ITEMS_API_URL}/Exos%20Part%20Number/${encodeURIComponent(itemToUpdate["Exos Part Number"])}?sheet=${encodeURIComponent(SHEETDB_TAB_NAME)}`;
        fetch(patchUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: { status } })
        });
      }
      return { ...prev, [gym]: updated };
    });
  }, []);

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term !== '') {
      setShowAllItems(true);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    // Only set showAllItems to true if not selecting 'preferred'
    if (category !== 'preferred') {
      setShowAllItems(true);
    } else {
      setShowAllItems(false);
    }
    // Collapse sidebar when category is selected
    setIsSidebarExpanded(false);
  };

  const handleBrandSelect = (brand) => {
    setSelectedBrand(brand);
    setShowAllItems(true);
    // Collapse sidebar when brand is selected
    setIsSidebarExpanded(false);
  };

  const handleContentClick = (e) => {
    // Collapse sidebar when clicking in dead space (not on sidebar or navigation)
    if (isSidebarExpanded && !e.target.closest('.sidebar') && !e.target.closest('.main-nav')) {
      setIsSidebarExpanded(false);
    }
  };

  const handleReset = (e) => {
    if (e) {
      e.preventDefault();
    }
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedBrand('');
    setShowAllItems(false);
    // Reset the URL to the base path for GitHub Pages subdirectory
    window.location.pathname = '/my-react-app/';
  };

  const handleGymClick = (gym) => {
    setActiveGym(gym);
  };

  if (loading) return <LoadingState type="category" message="Loading products..." />;
  if (!products?.length && !loading) return <div className="no-products">No products found</div>;

  return (
    <div className="App">
      <Navigation 
        onSidebarToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
        onReset={handleReset}
        isGymPanelCollapsed={isGymPanelCollapsed}
        onToggleGymPanel={() => setIsGymPanelCollapsed(!isGymPanelCollapsed)}
      />
      <div className="main-content" onClick={handleContentClick}>
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
          <div className="products-container">
            <Suspense fallback={<LoadingState type="products" />}>
              {visibleProducts.map((product, index) => (
                <ProductCard
                  key={`${product["Exos Part Number"]}-${index}`}
                  product={product}
                  onCopyInfo={copyProductInfo}
                  copySuccess={copySuccess}
                  onAddToGym={handleAddToGym}
                />
              ))}
            </Suspense>
            
            {/* Infinite scroll loading indicator */}
            {hasMore && (
              <div ref={loadingRef} className="infinite-scroll-loader">
                {isLoadingMore ? (
                  <div className="loading-spinner-container">
                    <div className="custom-loading-spinner">🏋️</div>
                    <p>Loading more equipment...</p>
                  </div>
                ) : (
                  <div className="scroll-hint">
                    <p>Scroll for more equipment</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* End of results - moved outside products-container */}
          <div 
            className="end-of-results"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Mouse down - starting scroll'); // Debug log
              
              // Add visual feedback
              const element = e.currentTarget;
              element.style.transform = 'scale(0.9)';
              element.style.backgroundColor = '#ff0000';
              
              // Start scrolling
              const contentArea = document.querySelector('.content-area');
              if (contentArea) {
                const scrollInterval = setInterval(() => {
                  contentArea.scrollBy(0, -35); // Scroll up by 35px each interval (faster)
                }, 16); // ~60fps
                
                // Store the interval ID on the element so we can clear it on mouse up
                element.scrollInterval = scrollInterval;
              }
            }}
            onMouseUp={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Mouse up - stopping scroll'); // Debug log
              
              // Remove visual feedback
              const element = e.currentTarget;
              element.style.transform = '';
              element.style.backgroundColor = '';
              
              // Stop scrolling
              if (element.scrollInterval) {
                clearInterval(element.scrollInterval);
                element.scrollInterval = null;
              }
            }}
            onMouseLeave={(e) => {
              // Also stop scrolling if mouse leaves the button
              const element = e.currentTarget;
              element.style.transform = '';
              element.style.backgroundColor = '';
              
              if (element.scrollInterval) {
                clearInterval(element.scrollInterval);
                element.scrollInterval = null;
              }
            }}
          >
            ▲
          </div>
          
          {/* Back to Top Button */}
          {showBackToTop && (
            <button 
              onClick={scrollToTop} 
              className="back-to-top-button"
              aria-label="Back to top"
            >
              ↑
            </button>
          )}
          
          {!isGymPanelCollapsed && (
            <Suspense fallback={<LoadingState type="gym" />}>
              <GymPanel
                activeGym={activeGym}
                gyms={gyms}
                gymItems={gymItems}
                handleGymClick={handleGymClick}
                handleRemoveFromGym={handleRemoveFromGym}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;