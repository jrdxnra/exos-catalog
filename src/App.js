import React, { useState, useEffect, useMemo, lazy, Suspense, useCallback, useRef } from 'react';
import './App.css';
import LoadingState from './components/LoadingState';
import Navigation from './components/Navigation';
import Sidebar from './components/Sidebar';
// Lazy load ProductCard
const ProductCard = lazy(() => import('./components/ProductCard'));

// Mock data for development and fallback
const mockData = [
  {
    "Item Name": "Dumbbell Set",
    "Brand": "PowerBlock",
    "Category": "Strength",
    "Cost": "299.99",
    "Exos Part Number": "DB-001",
    "Preferred": "P"
  },
  {
    "Item Name": "Resistance Bands",
    "Brand": "TheraBand",
    "Category": "Mobility",
    "Cost": "49.99",
    "Exos Part Number": "RB-002",
    "Preferred": "P/C"
  },
  {
    "Item Name": "Foam Roller",
    "Brand": "TriggerPoint",
    "Category": "Recovery",
    "Cost": "34.99",
    "Exos Part Number": "FR-003",
    "Preferred": "N"
  },
  {
    "Item Name": "Kettlebell",
    "Brand": "Rogue",
    "Category": "Strength",
    "Cost": "89.99",
    "Exos Part Number": "KB-004",
    "Preferred": "C"
  },
  {
    "Item Name": "Yoga Mat",
    "Brand": "Manduka",
    "Category": "Mobility",
    "Cost": "129.99",
    "Exos Part Number": "YM-005",
    "Preferred": "N"
  }
];

const GYM_ITEMS_API_URL = 'https://sheetdb.io/api/v1/uwc1t04gagpfq'; // Reverted to old endpoint to maintain data
const SHEETDB_TAB_NAME = 'Gym Items List';
const CATALOG_API_URL = 'https://script.google.com/macros/s/AKfycbyPDJRGyVH0H9LCRBS4uMowMPE59KphrQf7g16RpbkrztR36OKGmSKMCpdA8uTAD62C/exec';

const LOCAL_STORAGE_KEY = 'cachedProducts';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache instead of default

function App() {
  const [products, setProducts] = useState(mockData); // Start with mock data immediately
  const [loading, setLoading] = useState(false); // Start as not loading
  const [copySuccess, setCopySuccess] = useState(null);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);

  // Gym states
  const [activeGym, setActiveGym] = useState('');
  const [gymItems, setGymItems] = useState({
    MP2: [],
    MAT3: [],
    MP5: []
  });

  // Status states
  const [itemStatuses, setItemStatuses] = useState({});
  const [statusNotes, setStatusNotes] = useState({});

  // Sidebar tab state
  const [activeTab, setActiveTab] = useState('filters');

  // Gym configuration - easy to add/remove gyms
  const gyms = ['MP2', 'MAT3', 'MP5', 'HMBLT', 'CRSM', 'TM3']; // Add new gyms here

  // Infinite scroll states
  const [visibleProducts, setVisibleProducts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const ITEMS_PER_LOAD = 12;
  const observerRef = useRef();
  const loadingRef = useRef();

  // Removed initialPreferredOnly state since we're always showing preferred items by default
  const [notification, setNotification] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // Helper function to handle rate limiting with retry logic
  const fetchWithRetry = async (url, options = {}, maxRetries = 2, showWarning = false) => {
    let rateLimited = false;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        
        if (response.status === 429) {
          rateLimited = true;
          if (showWarning) {
            console.log('🚨 429 Rate limit detected during user action - showing warning');
          } else {
            console.log('🚨 429 Rate limit detected during background operation - not showing warning');
          }
          
          // Wait with longer exponential backoff to avoid rate limits
          const delay = Math.pow(3, attempt) * 2000; // 6s, 18s
          console.log(`Rate limited (attempt ${attempt}/${maxRetries}). Waiting ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        return response;
      } catch (error) {
        if (attempt === maxRetries) {
          // If we've exhausted all retries and had rate limiting, throw a specific error
          if (rateLimited) {
            const rateLimitError = new Error('SheetDB rate limit reached after all retries');
            rateLimitError.isRateLimit = true;
            throw rateLimitError;
          }
          throw error;
        }
        console.log(`Request failed (attempt ${attempt}/${maxRetries}). Retrying...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
    
    // If we get here, all retries were exhausted due to rate limiting
    if (rateLimited) {
      const rateLimitError = new Error('SheetDB rate limit reached after all retries');
      rateLimitError.isRateLimit = true;
      throw rateLimitError;
    }
  };

  // Fetch equipment list from Apps Script endpoint with LocalStorage caching
  useEffect(() => {
    // Try to load from localStorage first with cache duration check
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    const cacheTimestamp = localStorage.getItem(`${LOCAL_STORAGE_KEY}_timestamp`);
    const now = Date.now();
    
    if (cached && cacheTimestamp) {
      const cacheAge = now - parseInt(cacheTimestamp);
      if (cacheAge < CACHE_DURATION) {
        try {
          const parsed = JSON.parse(cached);
          console.log('Loading cached data (age:', Math.round(cacheAge / 1000), 'seconds):', parsed);
          if (parsed && parsed.length > 0) {
            setProducts(parsed);
            setLoading(false);
            console.log('Using cached data, skipping API call to avoid rate limits');
            return; // Skip API call if cache is fresh
          }
        } catch (err) {
          console.error('Error parsing cached data:', err);
        }
      } else {
        console.log('Cache expired (age:', Math.round(cacheAge / 1000), 'seconds), fetching fresh data');
      }
    }
    
    // Always fetch fresh data in the background
    const fetchCatalog = async () => {
      try {
        console.log('Fetching catalog from:', CATALOG_API_URL);
        
        // Try different approaches to get the actual data
        const urls = [
          CATALOG_API_URL,
          `${CATALOG_API_URL}?action=getCatalog`,
          `${CATALOG_API_URL}?type=catalog`,
          `${CATALOG_API_URL}?data=catalog`,
          // Use the same SheetDB endpoint with different sheet names
          `${GYM_ITEMS_API_URL}?sheet=Equipment List`,
          `${GYM_ITEMS_API_URL}?sheet=Catalog`,
          `${GYM_ITEMS_API_URL}?sheet=Products`,
          `${GYM_ITEMS_API_URL}?sheet=Equipment`
        ];
        
        let data = null;
        
        for (const url of urls) {
          try {
            console.log('Trying URL:', url);
            const response = await fetch(url);
            if (!response.ok) continue;
            
            const responseData = await response.json();
            console.log('Response from', url, ':', responseData);
            
            // Check if this response contains actual catalog data
            if (Array.isArray(responseData) || 
                (responseData && typeof responseData === 'object' && 
                 (responseData.data || responseData.values || responseData.rows || responseData.items))) {
              data = responseData;
              console.log('Found catalog data at:', url);
              break;
            }
          } catch (err) {
            console.log('Failed to fetch from:', url, err);
          }
        }
        
        // If no data found via GET, try POST to Google Apps Script
        if (!data) {
          try {
            console.log('Trying POST to Google Apps Script for catalog data');
            const postResponse = await fetch(CATALOG_API_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                action: 'getAllItems',
                sheetName: 'Equipment List'
              })
            });
            
            if (postResponse.ok) {
              const postData = await postResponse.json();
              console.log('POST response:', postData);
              
              if (postData.success && postData.items) {
                data = postData.items;
                console.log('Found catalog data via POST');
              }
            }
          } catch (err) {
            console.log('POST request failed:', err);
          }
        }
        
        if (!data) {
          console.log('No catalog data found from any URL, keeping current products');
          return;
        }
        
        console.log('Raw data from API:', data);
        console.log('Data type:', typeof data);
        console.log('Data keys:', Object.keys(data || {}));
        
        // Handle different data formats from Google Sheets
        let itemsArray = [];
        
        if (Array.isArray(data)) {
          // Data is already an array
          itemsArray = data;
          console.log('Data is already an array, length:', itemsArray.length);
          console.log('Sample raw item:', itemsArray[0]);
          console.log('Sample raw item keys:', itemsArray[0] ? Object.keys(itemsArray[0]) : 'No items');
        } else if (data && typeof data === 'object') {
          // Data might be an object with different structures
          if (data.items && Array.isArray(data.items)) {
            // Data is in 'items' property (Google Apps Script format)
            itemsArray = data.items;
            console.log('Data found in data.items, length:', itemsArray.length);
          } else if (data.data && Array.isArray(data.data)) {
            // Data is wrapped in a 'data' property
            itemsArray = data.data;
            console.log('Data found in data.data, length:', itemsArray.length);
          } else if (data.values && Array.isArray(data.values)) {
            // Data is in 'values' property (Google Sheets API format)
            itemsArray = data.values;
            console.log('Data found in data.values, length:', itemsArray.length);
          } else if (data.rows && Array.isArray(data.rows)) {
            // Data is in 'rows' property
            itemsArray = data.rows;
            console.log('Data found in data.rows, length:', itemsArray.length);
          } else {
            // Try to convert object to array
            itemsArray = Object.values(data);
            console.log('Converted object to array, length:', itemsArray.length);
          }
        }
        
        console.log('Processed items array:', itemsArray);
        console.log('First few items:', itemsArray.slice(0, 3));
        
        // Only update products if we have valid data
        if (Array.isArray(itemsArray) && itemsArray.length > 0) {
          const normalized = itemsArray.map(item => {
            const normalizedItem = {
              "Item Name": (item["item name"] || item["Item Name"] || item["ItemName"] || "").trim(),
              "Brand": (item["brand"] || item["Brand"] || "").trim(),
              "Category": (item["category"] || item["Category"] || "").trim(),
              "Cost": item["cost"] !== undefined ? String(item["cost"]) : (item["Cost"] !== undefined ? String(item["Cost"]) : ""),
              "Exos Part Number": (item["EXOS Part Number"] || item["exos part number"] || item["Exos Part Number"] || item["Part Number"] || "").trim(),
              "Preferred": (item["preferred"] || item["Preferred"] || "").trim().toUpperCase(),
              "URL": (item["url"] || item["URL"] || "").trim()
            };
            
            // Debug: Log part number mapping for first few items
            if (itemsArray.indexOf(item) < 3) {
              console.log('Normalizing item:', item["Item Name"] || item["item name"]);
              console.log('  Raw part number fields:', {
                "EXOS Part Number": item["EXOS Part Number"],
                "exos part number": item["exos part number"],
                "Exos Part Number": item["Exos Part Number"],
                "Part Number": item["Part Number"]
              });
              console.log('  Final part number:', normalizedItem["Exos Part Number"]);
            }
            
            return normalizedItem;
          });
          console.log('Normalized products from Google Sheet:', normalized);
          
          // Only update if we have meaningful data (not just empty objects)
          const validProducts = normalized.filter(product => 
            product["Item Name"] && product["Item Name"].length > 0
          );
          
          console.log('Valid products count:', validProducts.length);
          console.log('Sample valid product:', validProducts[0]);
          
          if (validProducts.length > 0) {
            console.log('Setting products from Google Sheet:', validProducts.length, 'products');
            setProducts(validProducts);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(validProducts));
            localStorage.setItem(`${LOCAL_STORAGE_KEY}_timestamp`, Date.now().toString());
          } else {
            console.log('Google Sheet returned empty data, keeping current products');
            console.log('All normalized products were filtered out as invalid');
            console.log('Sample normalized product:', normalized[0]);
          }
        } else {
          console.log('Google Sheet returned no valid data, keeping current products');
          console.log('ItemsArray:', itemsArray);
          console.log('Is array:', Array.isArray(itemsArray));
          console.log('Length:', itemsArray?.length);
        }
      } catch (err) {
        console.error('Error fetching catalog:', err);
        console.log('Keeping current products due to fetch error');
        // Don't overwrite current products on error
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  // Load existing gym items from SheetDB
  useEffect(() => {
    const loadGymItems = async () => {
      try {
        console.log('Testing SheetDB connection...');
        console.log('API URL:', GYM_ITEMS_API_URL);
        console.log('Sheet name:', SHEETDB_TAB_NAME);
        
        // First, try to test the connection without specifying a sheet
        try {
          const testResponse = await fetch(GYM_ITEMS_API_URL);
          console.log('Test response status:', testResponse.status);
          if (testResponse.ok) {
            const testData = await testResponse.json();
            console.log('Test response data (first few items):', testData.slice(0, 3));
          }
        } catch (testErr) {
          console.log('Test connection failed:', testErr);
        }
        
        const response = await fetchWithRetry(`${GYM_ITEMS_API_URL}?sheet=${encodeURIComponent(SHEETDB_TAB_NAME)}`, {}, 3, false);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Load response error:', {
            status: response.status,
            statusText: response.statusText,
            errorText: errorText
          });
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Loaded data from SheetDB:', data);
        console.log('Sample item keys:', data[0] ? Object.keys(data[0]) : 'No data');
        
        if (!Array.isArray(data) || data.length === 0) {
          console.log('No data found in sheet');
          return;
        }
        
        // Filter out empty sheet indicators
        const validItems = data.filter(item => 
          item["Item Name"] && 
          item["Item Name"] !== "EMPTY_SHEET"
        );
        
        if (validItems.length === 0) {
          console.log('No valid items found');
          return;
        }
        
        console.log('Loading', validItems.length, 'items from sheet');
        
        // Convert to our local state format
        const newGymItems = {};
        
        validItems.forEach(item => {
          const gym = item.Gym || 'Unknown Gym';
          const quantity = parseInt(item.Quantity) || 1;
          
          if (!newGymItems[gym]) {
            newGymItems[gym] = [];
          }
          
          newGymItems[gym].push({
            "Item Name": item["Item Name"] || "Unknown Item",
            "Brand": item.Brand || "Unknown Brand",
            "Category": item.Category || "General",
            "Cost": item.Cost || "",
            "Exos Part Number": (item["Exos Part Number"] || item["Part Number"] || item["part_number"] || "").trim(),
            "URL": item.URL || "",
            "quantity": quantity,
            "status": item.Status || "Pending Approval",
            "note": item.Note || ""
          });
        });
        
        setGymItems(newGymItems);
        console.log('Loaded gym items:', newGymItems);
      } catch (err) {
        console.error('Failed to load gym items:', err);
      }
    };
    
    loadGymItems();
  }, []);

  // Get unique categories and brands
  const { categories, brands } = useMemo(() => {
    const uniqueCategories = [...new Set(products.map(product => product.Category).filter(Boolean))];
    const uniqueBrands = [...new Set(products.map(product => product.Brand).filter(Boolean))];
    
    // Debug: Log sample product structure
    if (products.length > 0) {
      console.log('Sample product structure:', products[0]);
      console.log('Sample product keys:', Object.keys(products[0]));
      console.log('Sample product part number:', products[0]["Exos Part Number"]);
    }
    
    return {
      categories: uniqueCategories.sort(),
      brands: uniqueBrands.sort()
    };
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    console.log('=== FILTERING DEBUG ===');
    console.log('Products state:', products);
    console.log('Products length:', products?.length);
    console.log('Products type:', typeof products);
    console.log('Is products array:', Array.isArray(products));
    
    console.log('Filtering products:', {
      totalProducts: products?.length || 0,
      searchTerm,
      selectedCategory,
      selectedBrand,
      showAllItems
    });
    
    // Safety check - if no products, return empty array
    if (!Array.isArray(products) || products.length === 0) {
      console.log('No products to filter - returning empty array');
      return [];
    }
    
    let base = products;
    
    // Default to showing preferred items on initial load
    if (!searchTerm && !selectedCategory && !selectedBrand && !showAllItems) {
      base = products.filter(product => {
        const preferredValue = (product.Preferred || "").toUpperCase().trim();
        const isPreferred = preferredValue === 'P' || preferredValue === 'P/C' || preferredValue === 'YES' || preferredValue === 'TRUE';
        console.log(`Product ${product["Item Name"]} preferred value: "${preferredValue}", isPreferred: ${isPreferred}`);
        return isPreferred;
      });
      console.log('Filtered to preferred only:', base.length, 'products');
    }
    
    const filtered = base.filter(product => {
      // Safety check for each product
      if (!product || typeof product !== 'object') {
        console.warn('Invalid product found:', product);
        return false;
      }
      
      const matchesSearch = searchTerm === '' || 
        product["Item Name"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.Brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.Category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product["Exos Part Number"]?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBrand = selectedBrand === '' || product.Brand === selectedBrand;
      
      // Handle different dropdown values for Preferred field
      const preferredValue = (product.Preferred || "").toUpperCase().trim();
      const isPreferred = preferredValue === 'P' || preferredValue === 'P/C' || preferredValue === 'YES' || preferredValue === 'TRUE';
      const isCoachRecommended = preferredValue === 'C' || preferredValue === 'P/C' || preferredValue === 'COACH' || preferredValue === 'RECOMMENDED';
      
      if (selectedCategory === 'preferred') {
        return matchesSearch && matchesBrand && isPreferred;
      }
      if (selectedCategory === 'coach-recommended') {
        return matchesSearch && matchesBrand && isCoachRecommended;
      }
      const matchesCategory = selectedCategory === '' || product.Category === selectedCategory;
      const shouldShow = showAllItems || searchTerm !== '' || selectedCategory !== '' || selectedBrand !== '';
      const finalResult = matchesSearch && matchesCategory && matchesBrand && (shouldShow || isPreferred);
      
      console.log(`Product ${product["Item Name"]}: matchesSearch=${matchesSearch}, matchesBrand=${matchesBrand}, matchesCategory=${matchesCategory}, shouldShow=${shouldShow}, isPreferred=${isPreferred}, finalResult=${finalResult}`);
      
      return finalResult;
    });
    
    console.log('Final filtered products:', filtered.length, 'products');
    console.log('=== END FILTERING DEBUG ===');
    return filtered;
  }, [products, searchTerm, selectedCategory, selectedBrand, showAllItems]);

  // Reset visible products when filters change
  useEffect(() => {
    console.log('=== VISIBLE PRODUCTS DEBUG ===');
    console.log('Filtered products length:', filteredProducts.length);
    console.log('ITEMS_PER_LOAD:', ITEMS_PER_LOAD);
    console.log('Slice result:', filteredProducts.slice(0, ITEMS_PER_LOAD));
    
    setVisibleProducts(filteredProducts.slice(0, ITEMS_PER_LOAD));
    setHasMore(filteredProducts.length > ITEMS_PER_LOAD);
    
    console.log('Set visible products to:', filteredProducts.slice(0, ITEMS_PER_LOAD).length);
    console.log('Set hasMore to:', filteredProducts.length > ITEMS_PER_LOAD);
    console.log('=== END VISIBLE PRODUCTS DEBUG ===');
  }, [filteredProducts]);

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
  }, [hasMore, isLoadingMore, loadMoreProducts]);

  // Scroll to top functionality
  const scrollToTop = () => {
    console.log("scrollToTop function called"); // Debug log
    
    // Try all possible scroll containers
    const scrollTargets = [
      document.querySelector(".content-area"),
      document.querySelector(".products-container"),
      document.querySelector("main"),
      document.documentElement,
      document.body
    ];
    
    // Find the first target that has scroll content
    for (const target of scrollTargets) {
      if (target && (target.scrollTop > 0 || target.scrollY > 0)) {
        console.log("Scrolling target:", target.className || target.tagName);
        target.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }
    
    // Fallback to window scroll
    console.log("Using window scroll to top");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Show/hide back to top button
  useEffect(() => {
    const handleScroll = () => {
      // Check all possible scroll containers
      const scrollTargets = [
        document.querySelector(".content-area"),
        document.querySelector(".products-container"),
        document.querySelector("main"),
        document.documentElement,
        document.body
      ];
      
      let scrollTop = 0;
      
      // Find the first target with scroll content
      for (const target of scrollTargets) {
        if (target && (target.scrollTop > 0 || target.scrollY > 0)) {
          scrollTop = target.scrollTop || target.scrollY || 0;
          break;
        }
      }
      
      // Fallback to window scroll
      if (scrollTop === 0) {
        scrollTop = window.pageYOffset || window.scrollY || 0;
      }
      
      console.log('Scroll position detected:', scrollTop);
      setShowBackToTop(scrollTop > 300);
    };
    
    // Setup listeners after DOM is ready
    const setupScrollListeners = () => {
      const targets = [
        window,
        document.querySelector(".content-area"),
        document.querySelector(".products-container"),
        document.querySelector("main")
      ].filter(Boolean);
      
      targets.forEach(target => {
        target.addEventListener('scroll', handleScroll);
      });
      
      // Initial check
      handleScroll();
    };
    
    // Setup listeners after a short delay
    const timeoutId = setTimeout(setupScrollListeners, 100);
    
    return () => {
      clearTimeout(timeoutId);
      const targets = [
        window,
        document.querySelector(".content-area"),
        document.querySelector(".products-container"),
        document.querySelector("main")
      ].filter(Boolean);
      
      targets.forEach(target => {
        target.removeEventListener('scroll', handleScroll);
      });
    };
  }, []);

  // When user interacts with filters/search, show all products
  useEffect(() => {
    if (searchTerm || selectedCategory || selectedBrand || showAllItems) {
      // Keep the current behavior - user interaction shows all products
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

  const handleAddToGym = useCallback(async (product, gym, quantity, status) => {
    const currentStatus = status || itemStatuses[product["Item Name"]] || 'Pending Approval';
    const newItem = { ...product, quantity, status: currentStatus, Gym: gym };
    
    // Check if this item already exists in the gym
    setGymItems(prev => {
      const existingItems = prev[gym] || [];
      const existingIndex = existingItems.findIndex(item => 
        item["Item Name"] === product["Item Name"] && 
        item["Exos Part Number"] === product["Exos Part Number"]
      );
      
      if (existingIndex !== -1) {
        // Update existing item quantity
        const updatedItems = [...existingItems];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: updatedItems[existingIndex].quantity + quantity
        };
        return { ...prev, [gym]: updatedItems };
      } else {
        // Add new item
        return { ...prev, [gym]: [...existingItems, newItem] };
      }
    });
    
    // Reset the status for this item after adding to gym
    setItemStatuses(prev => {
      const newStatuses = { ...prev };
      delete newStatuses[product["Item Name"]];
      return newStatuses;
    });
    setStatusNotes(prev => {
      const newNotes = { ...prev };
      delete newNotes[product["Item Name"]];
      return newNotes;
    });
    
    // Auto-switch to gyms tab, set the active gym, and expand sidebar
    setActiveTab('gyms');
    setActiveGym(gym);
    setIsSidebarExpanded(true);
    
    // No automatic save to SheetDB - user will click Save button when ready
    console.log('Item added to gym (local only - click Save to sync to sheet)');
  }, [itemStatuses]);

  const handleRemoveFromGym = useCallback((gym, index) => {
    setGymItems(prev => {
      return {
        ...prev,
        [gym]: prev[gym].filter((_, i) => i !== index)
      };
    });
  }, []);

  const handleStatusChange = useCallback((itemName, status) => {
    setItemStatuses(prev => ({ ...prev, [itemName]: status }));
    // Clear any existing note for this item if status is not "Not Approved"
    if (status !== 'Not Approved') {
      setStatusNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[itemName];
        return newNotes;
      });
    }
  }, []);

  const handleNoteSubmit = useCallback((itemName, note) => {
    setItemStatuses(prev => ({ ...prev, [itemName]: 'Not Approved' }));
    setStatusNotes(prev => ({ ...prev, [itemName]: note }));
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
    // Don't automatically collapse sidebar - let user control it
  };

  const handleBrandSelect = (brand) => {
    setSelectedBrand(brand);
    setShowAllItems(true);
    // Don't automatically collapse sidebar - let user control it
  };

  const handleContentClick = (e) => {
    // Collapse sidebar when clicking in dead space (not on sidebar, navigation, product cards, or scroll buttons)
    if (isSidebarExpanded && 
        !e.target.closest('.sidebar') && 
        !e.target.closest('.main-nav') && 
        !e.target.closest('.product-card') &&
        !e.target.closest('.end-of-results') &&
        !e.target.closest('.back-to-top-button')) {
      setIsSidebarExpanded(false);
    }
    
    // Close search when clicking outside search area
    if (isSearchVisible && 
        !e.target.closest('.nav-search-container') && 
        !e.target.closest('.search-icon-button')) {
      setIsSearchVisible(false);
    }
  };

  const handleSidebarToggle = () => {
    console.log('Sidebar toggle called, current state:', isSidebarExpanded);
    setIsSidebarExpanded(!isSidebarExpanded);
    console.log('Sidebar state will be:', !isSidebarExpanded);
  };

  const handleSearchToggle = () => {
    setIsSearchVisible(!isSearchVisible);
    // Don't open sidebar - keep it independent for mobile space efficiency
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

  const handleQtyChange = async (gym, index, newQty) => {
    if (newQty < 0) return;
    
    // Update quantity in local state (including 0)
    setGymItems(prev => {
      const items = [...prev[gym]];
      items[index] = { ...items[index], quantity: newQty };
      return { ...prev, [gym]: items };
    });
    
    // Quantity updated locally - will be synced to sheet when Save is clicked
    console.log('Quantity updated locally - click Save to sync to sheet');
  };

  const handleGymStatusChange = async (itemName, status) => {
    // Find the item in gymItems and update its status
    const updatedGymItems = { ...gymItems };
    let updatedItem = null;
    
    for (const gym of gyms) {
      const itemIndex = updatedGymItems[gym]?.findIndex(item => item["Item Name"] === itemName);
      if (itemIndex !== -1) {
        updatedGymItems[gym][itemIndex] = { ...updatedGymItems[gym][itemIndex], status };
        updatedItem = updatedGymItems[gym][itemIndex];
        break;
      }
    }
    
    if (updatedItem) {
      setGymItems(updatedGymItems);
      
      // Status updated locally - will be synced to sheet when Save is clicked
      console.log('Status updated locally - click Save to sync to sheet');
    }
  };

  const handleGymNoteSubmit = async (itemName, note) => {
    // Find the item in gymItems and update its status and note
    const updatedGymItems = { ...gymItems };
    let updatedItem = null;
    
    for (const gym of gyms) {
      const itemIndex = updatedGymItems[gym]?.findIndex(item => item["Item Name"] === itemName);
      if (itemIndex !== -1) {
        updatedGymItems[gym][itemIndex] = { 
          ...updatedGymItems[gym][itemIndex], 
          status: 'Not Approved',
          note 
        };
        updatedItem = updatedGymItems[gym][itemIndex];
        break;
      }
    }
    
    if (updatedItem) {
      setGymItems(updatedGymItems);
      
      // Note updated locally - will be synced to sheet when Save is clicked
      console.log('Note updated locally - click Save to sync to sheet');
    }
  };

  const saveGymItems = async () => {
    try {
      setIsSaving(true);
      showLoadingCursor();
      console.log('Starting two-step save process...');

      // STEP 1: Pull existing data from sheet
      console.log('Step 1: Pulling existing data...');
      const existingDataResponse = await fetchWithRetry(`${GYM_ITEMS_API_URL}?sheet=${encodeURIComponent(SHEETDB_TAB_NAME)}`, {}, 3, true);
      if (!existingDataResponse.ok) {
        throw new Error(`Failed to fetch existing data: ${existingDataResponse.status}`);
      }
      
      const existingData = await existingDataResponse.json();
      console.log('Found', existingData.length, 'existing rows in sheet');

      // STEP 2: Delete all existing rows using correct SheetDB syntax
      console.log('Step 2: Deleting existing rows...');
      let deletedCount = 0;
      for (const row of existingData) {
        try {
          console.log('Attempting to delete row:', row["Item Name"]);
          
          // SheetDB DELETE requires query parameters: column and value
          const deleteUrl = `${GYM_ITEMS_API_URL}?sheet=${encodeURIComponent(SHEETDB_TAB_NAME)}&column=Item%20Name&value=${encodeURIComponent(row["Item Name"])}`;
          console.log('Delete URL:', deleteUrl);
          
          const deleteResponse = await fetchWithRetry(deleteUrl, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          }, 3, true);
          
          console.log('Delete response status:', deleteResponse.status);
          
          if (deleteResponse.ok) {
            deletedCount++;
            console.log('Successfully deleted row:', row["Item Name"]);
          } else {
            console.warn('Failed to delete row:', row["Item Name"], 'Status:', deleteResponse.status);
            const errorText = await deleteResponse.text();
            console.warn('Delete error response:', errorText);
          }
        } catch (deleteErr) {
          console.warn('Error deleting row:', row["Item Name"], deleteErr);
        }
      }
      
      console.log('Successfully deleted', deletedCount, 'out of', existingData.length, 'rows');

      // STEP 3: Prepare new data (excluding 0 quantity items)
      console.log('Step 3: Preparing new data...');
      console.log('Current gymItems state:', gymItems);
      
      const allItems = [];
      Object.entries(gymItems).forEach(([gym, items]) => {
        console.log(`Processing gym ${gym} with ${items.length} items`);
        
        // Group identical items by combining quantities
        const groupedItems = {};
        
        items.forEach(item => {
          console.log(`Processing item: ${item["Item Name"]} with quantity: ${item.quantity}`);
          
          // Skip items with 0 quantity - they will be effectively deleted
          if (item.quantity <= 0) {
            console.log(`Skipping item with 0 quantity: ${item["Item Name"]}`);
            return;
          }
          
          const key = `${item["Item Name"]}-${item["Exos Part Number"]}-${gym}`;
          
          if (groupedItems[key]) {
            // Add quantities for identical items
            groupedItems[key].quantity += item.quantity;
            console.log(`Combined quantities for ${item["Item Name"]}: ${groupedItems[key].quantity}`);
            // Use the most recent status if there are conflicts
            if (item.status && item.status !== 'Pending Approval') {
              groupedItems[key].status = item.status;
            }
            // Combine notes if both have them
            if (item.note && groupedItems[key].note) {
              groupedItems[key].note = `${groupedItems[key].note}; ${item.note}`;
            } else if (item.note) {
              groupedItems[key].note = item.note;
            }
          } else {
            // First occurrence of this item
            groupedItems[key] = {
              "Item Name": item["Item Name"],
              "Brand": item.Brand || "Unknown Brand",
              "Category": item.Category || "General",
              "Cost": item.Cost || "",
              "Exos Part Number": item["Exos Part Number"] || "",
              "URL": item.URL || "",
              "Gym": gym,
              "quantity": item.quantity,
              "status": item.status,
              "note": item.note || ""
            };
            console.log(`Added new item: ${item["Item Name"]} with quantity: ${item.quantity}`);
          }
        });
        
        // Add grouped items to the list
        Object.values(groupedItems).forEach(item => {
          allItems.push({
            "Item Name": item["Item Name"],
            "Brand": item.Brand,
            "Category": item.Category,
            "Cost": item.Cost,
            "Exos Part Number": item["Exos Part Number"],
            "URL": item.URL,
            "Gym": item.Gym,
            "Quantity": item.quantity,
            "Status": item.status,
            "Note": item.note
          });
        });
      });

      console.log('Prepared', allItems.length, 'items to save');
      console.log('Items to save:', allItems);

      // STEP 4: Add new data (or empty indicator if no items)
      console.log('Step 4: Adding new data...');
      if (allItems.length === 0) {
        console.log('No items to save - adding empty indicator');
        const emptyResponse = await fetchWithRetry(`${GYM_ITEMS_API_URL}?sheet=${encodeURIComponent(SHEETDB_TAB_NAME)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            data: [{
              "Item Name": "EMPTY_SHEET",
              "Brand": "",
              "Category": "",
              "Cost": "",
              "Exos Part Number": "",
              "URL": "",
              "Gym": "",
              "Quantity": "",
              "Status": "",
              "Note": ""
            }]
          })
        }, 3, true);
        
        if (emptyResponse.ok) {
          console.log('Empty sheet indicator added');
          // Clear local state since sheet is now empty
          setGymItems({});
          console.log('Cleared local state - sheet is now empty');
          showFireCursor();
          return;
        }
      }

      const response = await fetchWithRetry(`${GYM_ITEMS_API_URL}?sheet=${encodeURIComponent(SHEETDB_TAB_NAME)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: allItems })
      }, 3, true);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Save response error:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        throw new Error(`Failed to add new data: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Save response result:', result);
      console.log('Successfully added', allItems.length, 'new items');
      
      // Remove 0 quantity items from local state after successful save
      setGymItems(prev => {
        console.log('Before cleanup - current state:', prev);
        const cleanedGymItems = {};
        Object.entries(prev).forEach(([gym, items]) => {
          console.log(`Processing gym ${gym} with ${items.length} items`);
          const nonZeroItems = items.filter(item => item.quantity > 0);
          console.log(`Found ${nonZeroItems.length} non-zero items in ${gym}`);
          if (nonZeroItems.length > 0) {
            cleanedGymItems[gym] = nonZeroItems;
          }
        });
        console.log('After cleanup - new state:', cleanedGymItems);
        return cleanedGymItems;
      });
      
      // Show fire emoji cursor effect
      showFireCursor();
      
      console.log('Two-step save completed successfully!');
    } catch (err) {
      console.error('Failed to save gym items:', err);
      
      // Check if it's a rate limit error
      if (err.isRateLimit || err.message.includes('rate limit') || err.message.includes('429')) {
        showNotification('SheetDB rate limit reached. The app will automatically retry. If this persists, you may need to create a new API endpoint.', 'rate-limit');
      } else {
        showNotification('Failed to save gym items. Please try again.', 'error');
      }
    } finally {
      hideLoadingCursor();
      setIsSaving(false);
    }
  };

  // Fire emoji cursor effect for save success
  const showFireCursor = () => {
    const fireEmoji = document.createElement('div');
    fireEmoji.textContent = '🔥 SAVED! 🔥';
    fireEmoji.style.cssText = `
      position: fixed;
      pointer-events: none;
      font-size: 18px;
      font-weight: bold;
      color: #ff6b35;
      background: rgba(255, 255, 255, 0.95);
      padding: 8px 16px;
      border-radius: 20px;
      border: 2px solid #ff6b35;
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
      z-index: 10000;
      transition: all 0.3s ease;
      transform: translate(-50%, -50%);
      animation: firePop 0.5s ease-out;
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes firePop {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
        50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    // Random position (but keep it visible)
    const maxX = window.innerWidth - 200;
    const maxY = window.innerHeight - 100;
    const x = Math.max(100, Math.random() * maxX);
    const y = Math.max(100, Math.random() * maxY);
    
    fireEmoji.style.left = x + 'px';
    fireEmoji.style.top = y + 'px';
    
    document.body.appendChild(fireEmoji);
    
    setTimeout(() => {
      fireEmoji.remove();
      style.remove();
    }, 2000);
  };

  // Custom notification function
  const showNotification = (message, type = 'error') => {
    setNotification({ message, type });
    // Auto-clear after 5 seconds
    setTimeout(() => setNotification(null), 5000);
  };
  
  // Show loading cursor
  const showLoadingCursor = () => {
    document.body.style.cursor = 'wait';
  };
  
  // Hide loading cursor
  const hideLoadingCursor = () => {
    document.body.style.cursor = '';
  };

  if (loading) {
    console.log('Rendering loading state');
    return <LoadingState type="category" message="Loading products..." />;
  }
  
  console.log('=== RENDER DEBUG ===');
  console.log('Products length:', products?.length);
  console.log('Loading state:', loading);
  console.log('Visible products length:', visibleProducts?.length);
  console.log('Filtered products length:', filteredProducts?.length);
  
  if (!products?.length && !loading) {
    console.log('No products found, showing mock data as fallback');
    // Fallback to mock data if no products are loaded
    return (
      <div className="App">
        {/* Custom Notification */}
        {notification && (
          <div 
            onClick={() => setNotification(null)}
            style={{
              position: 'fixed',
              top: '70px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: notification.type === 'rate-limit' 
                ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)'
                : 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              zIndex: 1001,
              fontSize: '14px',
              fontWeight: '500',
              textAlign: 'center',
              maxWidth: '400px',
              animation: 'slideDown 0.3s ease-out',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateX(-50%) scale(1.02)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateX(-50%) scale(1)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span role="img" aria-label="warning">
                {notification.type === 'rate-limit' ? '⚠️' : '❌'}
              </span>
              <div>
                <strong>
                  {notification.type === 'rate-limit' ? 'SheetDB Rate Limit' : 'Error'}
                </strong>
                <div style={{ fontSize: '12px', marginTop: '2px' }}>
                  {notification.message}
                </div>
              </div>
            </div>
          </div>
        )}
        

        
        <Navigation
          onSidebarToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
          onReset={handleReset}
          onSearchToggle={handleSearchToggle}
          isSearchVisible={isSearchVisible}
          searchTerm={searchTerm}
          onSearchChange={handleSearch}
          activeGym={activeGym}
          onGymChange={setActiveGym}
          gyms={gyms}
          onTabChange={setActiveTab}
          onSidebarExpand={setIsSidebarExpanded}
        />
        <div className="main-content" onClick={handleContentClick}>
          <Sidebar
            categories={['Strength', 'Mobility', 'Recovery']}
            brands={['PowerBlock', 'TheraBand', 'TriggerPoint', 'Rogue', 'Manduka']}
            selectedCategory={selectedCategory}
            selectedBrand={selectedBrand}
            searchTerm={searchTerm}
            onCategoryChange={handleCategorySelect}
            onBrandChange={handleBrandSelect}
            onSearchChange={handleSearch}
            isExpanded={isSidebarExpanded}
            onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
            // Gym-related props
            activeGym={activeGym}
            gyms={gyms}
            gymItems={gymItems}
            handleGymClick={handleGymClick}
            handleRemoveFromGym={handleRemoveFromGym}
            onQtyChange={handleQtyChange}
            onStatusChange={handleGymStatusChange}
            onNoteSubmit={handleGymNoteSubmit}
            saveGymItems={saveGymItems}
            isSaving={isSaving}
            // Tab control
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          <div className={`content-area ${isSidebarExpanded ? 'sidebar-expanded' : ''}`}>
            <div className="products-container">
              <Suspense fallback={<LoadingState type="products" />}>
                {mockData.map((product, index) => (
                  <ProductCard
                    key={`${product["Exos Part Number"]}-${index}`}
                    product={product}
                    onCopyInfo={copyProductInfo}
                    copySuccess={copySuccess}
                    onAddToGym={handleAddToGym}
                    itemStatuses={itemStatuses}
                    onStatusChange={handleStatusChange}
                    statusNotes={statusNotes}
                    onNoteSubmit={handleNoteSubmit}
                    activeGym={activeGym}
                    gyms={gyms}
                  />
                ))}
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {/* Custom Notification */}
      {notification && (
        <div 
          onClick={() => setNotification(null)}
          style={{
            position: 'fixed',
            top: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: notification.type === 'rate-limit' 
              ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)'
              : 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 1001,
            fontSize: '14px',
            fontWeight: '500',
            textAlign: 'center',
            maxWidth: '400px',
            animation: 'slideDown 0.3s ease-out',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'translateX(-50%) scale(1.02)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateX(-50%) scale(1)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span role="img" aria-label="warning">
              {notification.type === 'rate-limit' ? '⚠️' : '❌'}
            </span>
            <div>
              <strong>
                {notification.type === 'rate-limit' ? 'SheetDB Rate Limit' : 'Error'}
              </strong>
              <div style={{ fontSize: '12px', marginTop: '2px' }}>
                {notification.message}
              </div>
            </div>
          </div>
        </div>
      )}
      
              <Navigation
          onSidebarToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
          onReset={handleReset}
          onSearchToggle={handleSearchToggle}
          isSearchVisible={isSearchVisible}
          searchTerm={searchTerm}
          onSearchChange={handleSearch}
          activeGym={activeGym}
          onGymChange={setActiveGym}
          gyms={gyms}
          onTabChange={setActiveTab}
          onSidebarExpand={setIsSidebarExpanded}
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
          // Gym-related props
          activeGym={activeGym}
          gyms={gyms}
          gymItems={gymItems}
          handleGymClick={handleGymClick}
          handleRemoveFromGym={handleRemoveFromGym}
          onQtyChange={handleQtyChange}
          onStatusChange={handleGymStatusChange}
          onNoteSubmit={handleGymNoteSubmit}
          saveGymItems={saveGymItems}
          isSaving={isSaving}
          // Tab control
          activeTab={activeTab}
          onTabChange={setActiveTab}
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
                    itemStatuses={itemStatuses}
                    onStatusChange={handleStatusChange}
                    statusNotes={statusNotes}
                    onNoteSubmit={handleNoteSubmit}
                    activeGym={activeGym}
                    gyms={gyms}
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
        </div>
      </div>
    </div>
  );
}

export default App;