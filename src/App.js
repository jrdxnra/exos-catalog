import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import './App.css';
import LoadingState from './components/LoadingState';
import Navigation from './components/Navigation';
import Sidebar from './components/Sidebar';
import GymPanel from './components/GymPanel';

// Lazy load the ProductCard component
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 12;

  // Fetch equipment list from Apps Script endpoint
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await fetch(CATALOG_API_URL);
        if (!response.ok) throw new Error('Failed to fetch catalog');
        const data = await response.json();
        // Normalize keys to match what the app expects
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
      } catch (err) {
        setProducts([]);
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
    return products.filter(product => {
      const matchesSearch = searchTerm === '' || 
        product["Item Name"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.Brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.Category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product["Exos Part Number"]?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === '' || product.Category === selectedCategory;
      const matchesBrand = selectedBrand === '' || product.Brand === selectedBrand;
      const isPreferred = product.Preferred?.toLowerCase() === 'yes';

      const shouldShow = showAllItems || searchTerm !== '' || selectedCategory !== '' || selectedBrand !== '';

      return matchesSearch && matchesCategory && matchesBrand && (shouldShow || isPreferred);
    });
  }, [products, searchTerm, selectedCategory, selectedBrand, showAllItems]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedBrand, showAllItems]);

  const copyProductInfo = (product) => {
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
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  // Add to gym and POST to SheetDB
  const handleAddToGym = async (product, gym, quantity) => {
    const newItem = { ...product, quantity, status: 'Pending', Gym: gym };
    setGymItems(prev => ({
      ...prev,
      [gym]: [...prev[gym], newItem]
    }));
    // POST to SheetDB
    try {
      const response = await fetch(`${GYM_ITEMS_API_URL}?sheet=${encodeURIComponent(SHEETDB_TAB_NAME)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [newItem] })
      });
      const result = await response.json();
      console.log('SheetDB POST result:', result);
    } catch (err) {
      console.error('SheetDB POST error:', err);
    }
  };

  // Remove from gym and DELETE from SheetDB
  const handleRemoveFromGym = async (gym, index) => {
    setGymItems(prev => {
      const itemToRemove = prev[gym][index];
      // DELETE from SheetDB by Exos Part Number (case-sensitive)
      if (itemToRemove && itemToRemove["Exos Part Number"]) {
        const deleteUrl = `${GYM_ITEMS_API_URL}/Exos%20Part%20Number/${encodeURIComponent(itemToRemove["Exos Part Number"])}?sheet=${encodeURIComponent(SHEETDB_TAB_NAME)}`;
        fetch(deleteUrl, { method: 'DELETE' })
          .then(res => res.json())
          .then(result => console.log('SheetDB DELETE result:', result))
          .catch(err => console.error('SheetDB DELETE error:', err));
      }
      return {
        ...prev,
        [gym]: prev[gym].filter((_, i) => i !== index)
      };
    });
  };

  // Update status and PATCH to SheetDB
  const handleStatusChange = async (gym, itemName, status) => {
    setGymItems(prev => {
      const updated = prev[gym].map(item =>
        item["Item Name"] === itemName ? { ...item, status } : item
      );
      // PATCH to SheetDB for the updated item
      const itemToUpdate = updated.find(item => item["Item Name"] === itemName);
      if (itemToUpdate && itemToUpdate["Exos Part Number"]) {
        const patchUrl = `${GYM_ITEMS_API_URL}/Exos%20Part%20Number/${encodeURIComponent(itemToUpdate["Exos Part Number"])}?sheet=${encodeURIComponent(SHEETDB_TAB_NAME)}`;
        fetch(patchUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: { status } })
        })
          .then(res => res.json())
          .then(result => console.log('SheetDB PATCH result:', result))
          .catch(err => console.error('SheetDB PATCH error:', err));
      }
      return { ...prev, [gym]: updated };
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
          <div className="products-container">
            <Suspense fallback={<LoadingState type="products" />}>
              {paginatedProducts.map((product, index) => (
                <ProductCard
                  key={index}
                  product={product}
                  onCopyInfo={copyProductInfo}
                  copySuccess={copySuccess}
                  onAddToGym={handleAddToGym}
                />
              ))}
            </Suspense>
          </div>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', margin: '2rem 0' }}>
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>&laquo; Prev</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  style={{ fontWeight: currentPage === i + 1 ? 'bold' : 'normal', minWidth: 32 }}
                >
                  {i + 1}
                </button>
              ))}
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next &raquo;</button>
            </div>
          )}
          {!isGymPanelCollapsed && (
            <GymPanel
              activeGym={activeGym}
              gyms={gyms}
              gymItems={gymItems}
              handleGymClick={handleGymClick}
              handleRemoveFromGym={handleRemoveFromGym}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;