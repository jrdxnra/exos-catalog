import React, { useState, useEffect, useMemo, lazy, Suspense, useCallback, useRef } from 'react';
import { SpeedInsights } from "@vercel/speed-insights/react";
import './App.css';
import LoadingState from './components/LoadingState';
import Navigation from './components/Navigation';
import Sidebar from './components/Sidebar';
import NotificationManager from './components/NotificationManager';
import SyncApprovalModal from './components/SyncApprovalModal';

// Firebase imports
import firebaseService from './services/firebaseService';
import MigrationUtils from './utils/migrationUtils';
import CONFIG from './config';
// Lazy load ProductCard
const ProductCard = lazy(() => import('./components/ProductCard'));



// Use configuration values
const CATALOG_IMPORT_URL = CONFIG.GOOGLE_SHEETS.CATALOG_IMPORT_URL;
const CATALOG_UPDATE_URL = CONFIG.GOOGLE_SHEETS.CATALOG_UPDATE_URL;
const SHEETS_URL = CONFIG.GOOGLE_SHEETS.SHEETS_URL;

const LOCAL_STORAGE_KEY = CONFIG.STORAGE.LOCAL_STORAGE_KEY;
const CACHE_DURATION = CONFIG.STORAGE.CACHE_DURATION;

function App() {
  const [products, setProducts] = useState([]); // Start with empty array
  const [loading, setLoading] = useState(true); // Start as loading
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
  const gyms = CONFIG.APP.GYMS; // Add new gyms in config.js

  // Infinite scroll states
  const [visibleProducts, setVisibleProducts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const ITEMS_PER_LOAD = CONFIG.APP.ITEMS_PER_LOAD;
  const observerRef = useRef();
  const loadingRef = useRef();

  // Removed initialPreferredOnly state since we're always showing preferred items by default
  const [notification, setNotification] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [showNotificationManager, setShowNotificationManager] = useState(false);


  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Sync state
  const [isSyncInProgress, setIsSyncInProgress] = useState(false);
  
  // Sync approval modal state
  const [showSyncApproval, setShowSyncApproval] = useState(false);
  const [sheetsData, setSheetsData] = useState(null);
  
  // Duplicate cleanup state
  const [needsCleanup, setNeedsCleanup] = useState(false);

  // Check for stale sync state on app startup
  useEffect(() => {
    const syncInProgress = localStorage.getItem('syncInProgress');
    const syncStartTime = localStorage.getItem('syncStartTime');
    
    if (syncInProgress === 'true' && syncStartTime) {
      const startTime = parseInt(syncStartTime);
      const now = Date.now();
      const timeDiff = now - startTime;
      
      // If sync has been "in progress" for more than 5 minutes, it's probably stale
      if (timeDiff > 5 * 60 * 1000) {
        console.log('Detected stale sync state, clearing...');
        localStorage.removeItem('syncInProgress');
        localStorage.removeItem('syncStartTime');
        showNotification('Previous sync was interrupted. You can safely sync again.', 'info');
        } else {
        console.log('Sync in progress, preventing new syncs...');
        setIsSyncInProgress(true);
      }
    }
  }, []);

  // Listen for sync state changes
  useEffect(() => {
    const checkSyncState = () => {
      const syncInProgress = localStorage.getItem('syncInProgress') === 'true';
      setIsSyncInProgress(syncInProgress);
    };

    // Check immediately
    checkSyncState();

    // Set up interval to check for changes
    const interval = setInterval(checkSyncState, 1000);

    return () => clearInterval(interval);
  }, []);





  // Fetch equipment list from Firebase with Google Sheets import capability
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        console.log('Fetching catalog from Firebase...');
        
        // Try to load from localStorage first with cache duration check
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        const cacheTimestamp = localStorage.getItem(`${LOCAL_STORAGE_KEY}_timestamp`);
        const now = Date.now();
        
        if (cached && cacheTimestamp) {
          const cacheAge = now - parseInt(cacheTimestamp);
          if (cacheAge < CACHE_DURATION) {
            try {
              const parsed = JSON.parse(cached);
              console.log('Loading cached data (age:', Math.round(cacheAge / 1000), 'seconds)');
              if (parsed && parsed.length > 0) {
                setProducts(parsed);
                setLoading(false);
                console.log('Using cached data');
                return;
              }
            } catch (err) {
              console.error('Error parsing cached data:', err);
            }
          }
        }
        
        // Try Firebase first
        try {
          const firebaseItems = await firebaseService.getCatalogItems();
          
          if (firebaseItems && firebaseItems.length > 0) {
            console.log('Successfully fetched', firebaseItems.length, 'items from Firebase');
            
            // Convert Firebase format to app format and preserve Firebase IDs
            const normalizedProducts = firebaseItems.map(item => ({
              id: item.id, // Preserve Firebase ID for updates
              "Item Name": item["Item Name"] || "",
              "Brand": item["Brand"] || "",
              "Category": item["Category"] || "",
              "Cost": item["Cost"] || "",
              "EXOS Part Number": item["EXOS Part Number"] || "",
              "Preferred": item["Preferred"] || "",
              "URL": item["URL"] || ""
            }));
            
            setProducts(normalizedProducts);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalizedProducts));
            localStorage.setItem(`${LOCAL_STORAGE_KEY}_timestamp`, Date.now().toString());
            console.log('Using Firebase data');
            return;
          } else {
            console.log('Firebase returned empty catalog, trying Google Sheets import...');
          }
        } catch (firebaseError) {
          console.log('Firebase fetch failed, trying Google Sheets import:', firebaseError.message);
        }
        
        // If Firebase is empty or failed, try to import from Google Sheets
        console.log('Importing catalog from Google Sheets...');
        
        try {
          const response = await fetch(CATALOG_IMPORT_URL);
          if (response.ok) {
            const data = await response.json();
              
            if (Array.isArray(data) && data.length > 0) {
              console.log('Raw data from Google Sheets:', data.length, 'items');
        
              // Process data
        const normalized = data.map(item => ({
          "Item Name": (item["item name"] || item["Item Name"] || item["ItemName"] || "").trim(),
          "Brand": (item["brand"] || item["Brand"] || "").trim(),
          "Category": (item["category"] || item["Category"] || "").trim(),
          "Cost": item["cost"] !== undefined ? String(item["cost"]) : (item["Cost"] !== undefined ? String(item["Cost"]) : ""),
                "EXOS Part Number": (item["EXOS Part Number"] || item["exos part number"] || item["Exos Part Number"] || item["Part Number"] || "").trim(),
          "Preferred": (item["preferred"] || item["Preferred"] || "").trim().toUpperCase(),
          "URL": (item["url"] || item["URL"] || "").trim()
        }));
        
              // Filter valid products
        const validProducts = normalized.filter(product => 
          product["Item Name"] && product["Item Name"].length > 0
        );
        
        console.log('Valid products count:', validProducts.length);
        
        if (validProducts.length > 0) {
                console.log('Setting products from Google Sheets import:', validProducts.length, 'products');
          setProducts(validProducts);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(validProducts));
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_timestamp`, Date.now().toString());
          
                // Migrate this data to Firebase for future use
            MigrationUtils.migrateCatalogData(validProducts)
                  .then(() => {
                    console.log('Catalog migration to Firebase completed');
                    // After migration, reload from Firebase to get IDs
                    firebaseService.getCatalogItems()
                      .then(firebaseItems => {
                        if (firebaseItems && firebaseItems.length > 0) {
                          const normalizedProducts = firebaseItems.map(item => ({
                            id: item.id,
                            "Item Name": item["Item Name"] || "",
                            "Brand": item["Brand"] || "",
                            "Category": item["Category"] || "",
                            "Cost": item["Cost"] || "",
                            "EXOS Part Number": item["EXOS Part Number"] || "",
                            "Preferred": item["Preferred"] || "",
                            "URL": item["URL"] || ""
                          }));
                          setProducts(normalizedProducts);
                          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalizedProducts));
                          localStorage.setItem(`${LOCAL_STORAGE_KEY}_timestamp`, Date.now().toString());
                        }
                      })
                      .catch(error => console.log('Failed to reload from Firebase after migration:', error.message));
                  })
              .catch(error => console.log('Catalog migration failed (non-critical):', error.message));
              } else {
                console.log('Google Sheets returned empty data');
                setProducts([]);
          }
        } else {
              console.log('Google Sheets returned invalid data');
              setProducts([]);
            }
          } else {
            console.log('Google Sheets import failed');
            setProducts([]);
          }
        } catch (err) {
          console.error('Error importing from Google Sheets:', err);
          setProducts([]);
        }
      } catch (err) {
        console.error('Error fetching catalog:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  // Load existing gym items from Firebase
  useEffect(() => {
    const loadGymItems = async () => {
      try {
        console.log('Loading gym items from Firebase...');
        
            const firebaseItems = await firebaseService.getGymItems();
            
            if (firebaseItems && firebaseItems.length > 0) {
              console.log('Successfully loaded', firebaseItems.length, 'gym items from Firebase');
              
              // Convert to our local state format efficiently
              const newGymItems = {};
              
              firebaseItems.forEach(item => {
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
              "EXOS Part Number": (item["EXOS Part Number"] || item["Part Number"] || item["part_number"] || "").trim(),
                  "URL": item.URL || "",
                  "quantity": quantity,
                  "status": item.Status || "Pending Approval",
                  "note": item.Note || "",
                  "justification": item.Justification || "",
                  "notes": item.Notes || ""
                });
              });
              
              setGymItems(newGymItems);
              console.log('Loaded gym items from Firebase:', Object.keys(newGymItems).length, 'gyms');
            } else {
          console.log('No gym items found in Firebase');
        }
      } catch (err) {
        console.error('Failed to load gym items from Firebase:', err);
      }
    };
    
    loadGymItems();
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
    // Safety check - if no products, return empty array
    if (!Array.isArray(products) || products.length === 0) {
      return [];
    }
    
    // Debug: Check for duplicate part numbers (normalized)
    const partNumbers = products.map(p => p["EXOS Part Number"]).filter(Boolean);
    const normalizedPartNumbers = partNumbers.map(pn => pn.trim().toUpperCase());
    const duplicates = normalizedPartNumbers.filter((item, index) => normalizedPartNumbers.indexOf(item) !== index);
    
    if (duplicates.length > 0) {
      console.warn('Found duplicate part numbers (normalized):', duplicates);
      console.warn('Total products:', products.length);
      console.warn('Unique part numbers:', new Set(normalizedPartNumbers).size);
      
      // Show detailed information about duplicates
      const duplicateDetails = {};
      duplicates.forEach(normalizedPartNumber => {
        const itemsWithPartNumber = products.filter(p => 
          p["EXOS Part Number"] && p["EXOS Part Number"].trim().toUpperCase() === normalizedPartNumber
        );
        duplicateDetails[normalizedPartNumber] = itemsWithPartNumber.map(item => ({
          id: item.id,
          name: item["Item Name"],
          preferred: item.Preferred,
          brand: item.Brand,
          originalPartNumber: item["EXOS Part Number"]
        }));
      });
      console.warn('Duplicate details:', duplicateDetails);
      
      // Automatically clean up duplicates in the background
      setNeedsCleanup(true);
    }
    

    
    let base = products;
    
    // Default to showing preferred items on initial load
    if (!searchTerm && !selectedCategory && !selectedBrand && !showAllItems) {
      base = products.filter(product => {
        const preferredValue = (product.Preferred || "").toUpperCase().trim();
        return preferredValue === 'P' || preferredValue === 'P+C';
      });
    }
    
    const filtered = base.filter(product => {
      // Safety check for each product
      if (!product || typeof product !== 'object') {
        return false;
      }
      
      const matchesSearch = searchTerm === '' || 
        product["Item Name"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.Brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.Category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product["EXOS Part Number"]?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesBrand = selectedBrand === '' || product.Brand === selectedBrand;
      
      // Handle different dropdown values for Preferred field
      const preferredValue = (product.Preferred || "").toUpperCase().trim();
      const isPreferred = preferredValue === 'P' || preferredValue === 'P+C';
      const isCoachRecommended = preferredValue === 'C' || preferredValue === 'P+C';
      
      if (selectedCategory === 'preferred') {
        return matchesSearch && matchesBrand && isPreferred;
      }
      if (selectedCategory === 'coach-recommended') {
        return matchesSearch && matchesBrand && isCoachRecommended;
      }
      
      const matchesCategory = selectedCategory === '' || product.Category === selectedCategory;
      
      // Show all products if user has interacted with filters, otherwise show preferred OR coach recommended items
      const hasUserInteraction = searchTerm !== '' || selectedCategory !== '' || selectedBrand !== '' || showAllItems;
      const shouldShow = hasUserInteraction || isPreferred || isCoachRecommended;
      
      const finalResult = matchesSearch && matchesCategory && matchesBrand && shouldShow;
      
      return finalResult;
    });
    
    return filtered;
  }, [products, searchTerm, selectedCategory, selectedBrand, showAllItems]);

  // Reset visible products when filters change
  useEffect(() => {
    setVisibleProducts(filteredProducts.slice(0, ITEMS_PER_LOAD));
    setHasMore(filteredProducts.length > ITEMS_PER_LOAD);
  }, [filteredProducts, ITEMS_PER_LOAD]);

  // Ensure visible products are set when products are first loaded
  useEffect(() => {
    if (products.length > 0 && visibleProducts.length === 0) {
      const initialProducts = products.slice(0, ITEMS_PER_LOAD);
      setVisibleProducts(initialProducts);
      setHasMore(products.length > ITEMS_PER_LOAD);
    }
  }, [products, visibleProducts.length, ITEMS_PER_LOAD]);

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
  }, [visibleProducts.length, filteredProducts, isLoadingMore, hasMore, ITEMS_PER_LOAD]);

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
    
    // Re-observe the loading element whenever it changes
    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }
    
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMoreProducts, visibleProducts.length]);

  // Scroll to top functionality
  const scrollToTop = () => {
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
        target.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }
    
    // Fallback to window scroll
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
              product["EXOS Part Number"] || '',
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
        item["EXOS Part Number"] === product["EXOS Part Number"]
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

  // Remove unused function - sidebar toggle is already working correctly

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

  const handleJustificationChange = async (gym, index, justification) => {
    // Update justification in local state
    setGymItems(prev => {
      const updatedGymItems = { ...prev };
      if (updatedGymItems[gym] && updatedGymItems[gym][index]) {
        updatedGymItems[gym][index] = { 
          ...updatedGymItems[gym][index], 
          justification 
        };
      }
      return updatedGymItems;
    });
    
    // Justification updated locally - will be synced to sheet when Save is clicked
    console.log('Justification updated locally - click Save to sync to sheet');
  };

  const handleGymNoteChange = async (gym, index, notes) => {
    // Update notes in local state
    setGymItems(prev => {
      const updatedGymItems = { ...prev };
      if (updatedGymItems[gym] && updatedGymItems[gym][index]) {
        updatedGymItems[gym][index] = { 
          ...updatedGymItems[gym][index], 
          notes 
        };
      }
      return updatedGymItems;
    });
    
    // Notes updated locally - will be synced to sheet when Save is clicked
    console.log('Notes updated locally - click Save to sync to sheet');
  };

  const saveGymItems = async () => {
    try {
      setIsSaving(true);
      showLoadingCursor();
      console.log('Starting save process...');

      // Prepare new data (excluding 0 quantity items) efficiently
      console.log('Preparing new data...');
      
      const allItems = [];
      Object.entries(gymItems).forEach(([gym, items]) => {
        console.log(`Processing gym ${gym} with ${items.length} items`);
        
        // Group identical items by combining quantities efficiently
        const groupedItems = new Map();
        
        items.forEach(item => {
          // Skip items with 0 quantity - they will be effectively deleted
          if (item.quantity <= 0) {
            console.log(`Skipping item with 0 quantity: ${item["Item Name"]}`);
            return;
          }
          
          const key = `${item["Item Name"]}-${item["EXOS Part Number"]}-${gym}`;
          
          if (groupedItems.has(key)) {
            // Add quantities for identical items
            const existing = groupedItems.get(key);
            existing.quantity += item.quantity;
            
            // Use the most recent status if there are conflicts
            if (item.status && item.status !== 'Pending Approval') {
              existing.status = item.status;
            }
            // Combine notes if both have them
            if (item.note && existing.note) {
              existing.note = `${existing.note}; ${item.note}`;
            } else if (item.note) {
              existing.note = item.note;
            }
          } else {
            // First occurrence of this item
            groupedItems.set(key, {
              "Item Name": item["Item Name"],
              "Brand": item.Brand || "Unknown Brand",
              "Category": item.Category || "General",
              "Cost": item.Cost || "",
              "EXOS Part Number": item["EXOS Part Number"] || "",
              "URL": item.URL || "",
              "Gym": gym,
              "quantity": item.quantity,
              "status": item.status,
              "note": item.note || "",
              "justification": item.justification || "",
              "notes": item.notes || ""
            });
          }
        });
        
        // Add grouped items to the list
        groupedItems.forEach(item => {
          allItems.push({
            "Item Name": item["Item Name"],
            "Brand": item.Brand,
            "Category": item.Category,
            "Cost": item.Cost,
                          "EXOS Part Number": item["EXOS Part Number"],
            "URL": item.URL,
            "Gym": item.Gym,
            "Quantity": item.quantity,
            "Status": item.status,
            "Note": item.note,
            "Justification": item.justification,
            "Notes": item.notes
          });
        });
      });

      console.log('Prepared', allItems.length, 'items to save');

      // Save to Firebase
      console.log('Saving to Firebase...');
          await firebaseService.batchUpdateGymItems(allItems);
          console.log('Successfully saved to Firebase');
      
        // Remove 0 quantity items from local state after successful save
        setGymItems(prev => {
          const cleanedGymItems = {};
          Object.entries(prev).forEach(([gym, items]) => {
            const nonZeroItems = items.filter(item => item.quantity > 0);
            if (nonZeroItems.length > 0) {
              cleanedGymItems[gym] = nonZeroItems;
            }
          });
          return cleanedGymItems;
        });
        
        // Show fire emoji cursor effect
        showFireCursor();
        console.log('Save completed successfully!');
    } catch (err) {
      console.error('Failed to save gym items:', err);
        showNotification('Failed to save gym items. Please try again.', 'error');
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



  // Edit mode functions
  const handleEditModeToggle = () => {
    setIsEditMode(!isEditMode);
  };

  // Function to update Google Sheets with product changes
  const updateGoogleSheets = async (partNumber, updates) => {
    try {
      console.log('Updating Google Sheets with product changes...');
      console.log('Part Number:', partNumber);
      console.log('Updates:', updates);
      
      // Find the original product to get all fields - use correct field name
      const originalProduct = products.find(p => p["EXOS Part Number"] === partNumber);
      if (!originalProduct) {
        console.log('Product not found for Google Sheets update');
        return;
      }
      
      console.log('Original product:', originalProduct);
      
      // Prepare the updated product data for Google Sheets
      const updatedProduct = {
        ...originalProduct,
        ...updates
      };
      
      console.log('Updated product for Google Sheets:', updatedProduct);
      
      // Send update to Google Apps Script
      const response = await fetch(CATALOG_UPDATE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'updateItem',
          partNumber: partNumber,
          data: JSON.stringify(updatedProduct)
        }).toString()
      });
      
      if (response.ok) {
        const responseData = await response.text();
        console.log('Google Sheets response:', responseData);
        try {
          const parsedResponse = JSON.parse(responseData);
          console.log('Parsed Google Sheets response:', parsedResponse);
          showNotification('Google Sheets also updated successfully!', 'success');
        } catch (parseError) {
          console.log('Raw Google Sheets response (not JSON):', responseData);
          showNotification('Google Sheets updated, but response was not JSON', 'warning');
        }
      } else {
        console.warn('Failed to update Google Sheets:', response.status);
        showNotification('Firebase updated, but Google Sheets update failed', 'warning');
      }
    } catch (error) {
      console.error('Error updating Google Sheets:', error);
      // Don't throw error - Google Sheets update is secondary
    }
  };

  const handleProductUpdate = async (productId, updates) => {

    try {
      // Check if the product exists in Firebase by trying to get it first
      const existingProduct = products.find(p => p.id === productId || p["EXOS Part Number"] === productId);
      
      if (existingProduct && existingProduct.id) {
        // Product exists in Firebase, update it
        await firebaseService.updateCatalogItem(existingProduct.id, updates);
        
        // Update local state with the changes
        setProducts(prevProducts => 
          prevProducts.map(product => 
            product.id === existingProduct.id
              ? { ...product, ...updates }
              : product
          )
        );
      } else {
        // Product doesn't exist in Firebase, create it
        const newProduct = {
          ...updates,
          "EXOS Part Number": productId // Use the part number as identifier
        };
        const newId = await firebaseService.addCatalogItem(newProduct);
        
        // Add the new product to local state with Firebase ID
        const newProductWithId = { ...newProduct, id: newId };
        setProducts(prevProducts => [...prevProducts, newProductWithId]);
      }
      
      // Update localStorage to persist changes
      const updatedProducts = products.map(product => 
        (product.id === productId || product["EXOS Part Number"] === productId) 
          ? { ...product, ...updates }
          : product
      );
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProducts));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_timestamp`, Date.now().toString());
      
      // Update Google Sheets (non-blocking - don't wait for this to complete)
      // Use the actual part number instead of Firebase ID
      const partNumber = existingProduct ? existingProduct["EXOS Part Number"] : productId;
      updateGoogleSheets(partNumber, updates);
      
      showNotification('Product updated in Firebase!', 'success');
    } catch (error) {
      console.error('Error updating product:', error);
      showNotification('Failed to update product', 'error');
    }
  };

  const handleGoogleSheetsLink = () => {
    // Open Google Sheets in new tab
    window.open(SHEETS_URL, '_blank');
  };

  const syncFromGoogleSheets = async () => {
    try {
      // Check if sync is already in progress
      if (isSyncInProgress) {
        showNotification('Sync already in progress. Please wait for it to complete.', 'warning');
        return;
      }

      // Set sync in progress flag
      localStorage.setItem('syncInProgress', 'true');
      localStorage.setItem('syncStartTime', Date.now().toString());
      setIsSyncInProgress(true);
      
      showNotification('Fetching data from Google Sheets...', 'info');
      
      // Fetch all data from Google Sheets
      const response = await fetch(`${CATALOG_IMPORT_URL}?action=getCatalog`);
      if (!response.ok) {
        throw new Error(`Failed to fetch from Google Sheets: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Google Sheets response:', data);
      
      if (!data.success) {
        throw new Error(`Google Sheets error: ${data.message || 'Unknown error'}`);
      }
      
      if (!data.items) {
        throw new Error('Google Sheets response missing items array. The script may need to be updated to handle getCatalog action.');
      }
      
      console.log(`Fetched ${data.items.length} items from Google Sheets`);
      
      // Store sheets data and show approval modal
      setSheetsData(data.items);
      setShowSyncApproval(true);
      
      // Clear sync in progress flag
      localStorage.removeItem('syncInProgress');
      localStorage.removeItem('syncStartTime');
      setIsSyncInProgress(false);
      
    } catch (error) {
      console.error('Sync failed:', error);
      
      // Clear sync in progress flag on error
      localStorage.removeItem('syncInProgress');
      localStorage.removeItem('syncStartTime');
      setIsSyncInProgress(false);
      
      showNotification(`Sync failed: ${error.message}`, 'error');
    }
  };

  const handleSyncApproval = async (approvedChanges) => {
    try {
      setIsSyncInProgress(true);
      showNotification('Applying approved changes...', 'info');
      
      // Apply only the approved changes
      const syncResult = await firebaseService.applyApprovedChanges(approvedChanges, sheetsData);
      
      // Fetch updated items from Firebase
      const updatedItems = await firebaseService.getCatalogItems();
      
      // Update local state
      setProducts(updatedItems);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedItems));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_timestamp`, Date.now().toString());
      
      setIsSyncInProgress(false);
      
      // Show detailed sync results
      const message = `Sync completed! ${syncResult.added} added, ${syncResult.updated} updated, ${syncResult.deleted} deleted`;
      showNotification(message, 'success');
      console.log(`Sync completed:`, syncResult);
      
    } catch (error) {
      console.error('Error applying approved changes:', error);
      setIsSyncInProgress(false);
      showNotification(`Error applying changes: ${error.message}`, 'error');
    }
  };

  // Function to clean up specific duplicates
  const cleanupSpecificDuplicates = async () => {
    try {
      showLoadingCursor();
      
      // Get current products
      const currentProducts = [...products];
      const productsToDelete = [];
      const productsToKeep = [];
      
      // Group products by normalized part number
      const groupedByPartNumber = {};
      currentProducts.forEach(product => {
        const partNumber = product["EXOS Part Number"];
        if (partNumber) {
          const normalizedPartNumber = partNumber.trim().toUpperCase();
          if (!groupedByPartNumber[normalizedPartNumber]) {
            groupedByPartNumber[normalizedPartNumber] = [];
          }
          groupedByPartNumber[normalizedPartNumber].push(product);
        }
      });
      
      // Process each group of duplicates
      Object.entries(groupedByPartNumber).forEach(([normalizedPartNumber, items]) => {
        if (items.length > 1) {
          console.log(`Processing duplicates for ${normalizedPartNumber}:`, items);
          
          // Sort items by priority: P+C > P > C > (empty)
          const sortedItems = items.sort((a, b) => {
            const aPref = (a.Preferred || "").toUpperCase().trim();
            const bPref = (b.Preferred || "").toUpperCase().trim();
            
            const priority = { 'P+C': 4, 'P': 3, 'C': 1 };
            return (priority[bPref] || 0) - (priority[aPref] || 0);
          });
          
          // Keep the first (highest priority) item
          const itemToKeep = sortedItems[0];
          productsToKeep.push(itemToKeep);
          
          // Mark the rest for deletion
          const itemsToDelete = sortedItems.slice(1);
          productsToDelete.push(...itemsToDelete);
          
          console.log(`Keeping:`, itemToKeep);
          console.log(`Deleting:`, itemsToDelete);
        } else {
          // Single item, keep it
          productsToKeep.push(items[0]);
        }
      });
      
      if (productsToDelete.length === 0) {
        hideLoadingCursor();
        showNotification('No duplicates found to clean up!', 'success');
        return;
      }
      
      console.log(`Total items to delete: ${productsToDelete.length}`);
      console.log(`Total items to keep: ${productsToKeep.length}`);
      
      // Delete duplicate items from Firebase
      const deletePromises = productsToDelete.map(product => 
        firebaseService.deleteCatalogItem(product.id)
      );
      
      await Promise.all(deletePromises);
      
      // Update local state
      setProducts(productsToKeep);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(productsToKeep));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_timestamp`, Date.now().toString());
      
      hideLoadingCursor();
      
      const message = `Cleanup completed! Removed ${productsToDelete.length} duplicate items.`;
      showNotification(message, 'success');
      console.log('Cleanup completed:', { deleted: productsToDelete.length, kept: productsToKeep.length });
      
      // Force a refresh of the catalog data to ensure sync has current data
      setTimeout(() => {
        const fetchCatalog = async () => {
          try {
            const firebaseItems = await firebaseService.getCatalogItems();
            if (firebaseItems && firebaseItems.length > 0) {
              const normalizedProducts = firebaseItems.map(item => ({
                id: item.id,
                "Item Name": item["Item Name"] || "",
                "Brand": item["Brand"] || "",
                "Category": item["Category"] || "",
                "Cost": item["Cost"] || "",
                "EXOS Part Number": item["EXOS Part Number"] || "",
                "Preferred": item["Preferred"] || "",
                "URL": item["URL"] || ""
              }));
              setProducts(normalizedProducts);
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalizedProducts));
              localStorage.setItem(`${LOCAL_STORAGE_KEY}_timestamp`, Date.now().toString());
            }
          } catch (error) {
            console.error('Error refreshing catalog after cleanup:', error);
          }
        };
        fetchCatalog();
      }, 1000); // Small delay to ensure Firebase operations are complete
    } catch (error) {
      console.error('Error cleaning up duplicates:', error);
      hideLoadingCursor();
      showNotification(`Error cleaning up duplicates: ${error.message}`, 'error');
    }
  };

  // Effect to run cleanup when needed
  useEffect(() => {
    if (needsCleanup) {
      // Add a guard to prevent infinite loops - only run cleanup once per session
      const cleanupKey = 'cleanupCompleted';
      const hasRunCleanup = sessionStorage.getItem(cleanupKey);
      
      if (!hasRunCleanup) {
        console.log('Running duplicate cleanup...');
        cleanupSpecificDuplicates();
        sessionStorage.setItem(cleanupKey, 'true');
      } else {
        console.log('Cleanup already completed this session, skipping...');
      }
      
      setNeedsCleanup(false); // Reset the flag after cleanup
    }
  }, [needsCleanup]);


  if (loading) {
    return <LoadingState type="category" message="Loading products..." />;
  }
  
  if (!products?.length && !loading) {
    // Show error state when no products are loaded
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
              background: notification.type === 'success'
                ? 'linear-gradient(135deg, #28a745 0%, #218838 100%)'
                : notification.type === 'rate-limit'
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
              <span role="img" aria-label="notification">
                {notification.type === 'success' ? '✅' : notification.type === 'rate-limit' ? '⚠️' : '❌'}
              </span>
              <div>
                <strong>
                  {notification.type === 'success' ? 'Success' : notification.type === 'rate-limit' ? 'SheetDB Rate Limit' : 'Error'}
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
          onNotificationManagerToggle={() => setShowNotificationManager(true)}
          isEditMode={isEditMode}
          onEditModeToggle={handleEditModeToggle}
          onGoogleSheetsLink={handleGoogleSheetsLink}
          onSyncFromGoogleSheets={syncFromGoogleSheets}
          isSyncInProgress={isSyncInProgress}
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
            onNoteSubmit={handleGymNoteChange}
            onJustificationChange={handleJustificationChange}
            saveGymItems={saveGymItems}
            isSaving={isSaving}
            // Tab control
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          <div className={`content-area ${isSidebarExpanded ? 'sidebar-expanded' : ''}`}>
            <div className="products-container">
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                textAlign: 'center',
                padding: '40px 20px'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>📋</div>
                <h2 style={{ 
                  color: '#666', 
                  marginBottom: '16px',
                  fontSize: '24px',
                  fontWeight: '500'
                }}>
                  No Equipment Found
                </h2>
                <p style={{ 
                  color: '#888', 
                  marginBottom: '24px',
                  fontSize: '16px',
                  maxWidth: '400px',
                  lineHeight: '1.5'
                }}>
                  Unable to load the equipment catalog. This could be due to a connection issue or the catalog being empty.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0, 123, 255, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(0, 123, 255, 0.3)';
                  }}
                >
                  🔄 Try Again
                </button>
              </div>
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
            background: notification.type === 'success'
              ? 'linear-gradient(135deg, #28a745 0%, #218838 100%)'
              : notification.type === 'rate-limit'
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
            <span role="img" aria-label="notification">
              {notification.type === 'success' ? '✅' : notification.type === 'rate-limit' ? '⚠️' : '❌'}
            </span>
            <div>
              <strong>
                {notification.type === 'success' ? 'Success' : notification.type === 'rate-limit' ? 'SheetDB Rate Limit' : 'Error'}
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
        onNotificationManagerToggle={() => setShowNotificationManager(true)}
          isEditMode={isEditMode}
          onEditModeToggle={handleEditModeToggle}
          onGoogleSheetsLink={handleGoogleSheetsLink}
          onSyncFromGoogleSheets={syncFromGoogleSheets}
          isSyncInProgress={isSyncInProgress}
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
          onNoteSubmit={handleGymNoteChange}
          onJustificationChange={handleJustificationChange}
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
                  key={`${product["EXOS Part Number"]}-${index}`}
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
                  isEditMode={isEditMode}
                  onProductUpdate={handleProductUpdate}
                  onEditModeToggle={handleEditModeToggle}
                  isSyncInProgress={isSyncInProgress}
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
      
      {/* Vercel Speed Insights */}
      <SpeedInsights />
      
      {/* Notification Manager */}
      <NotificationManager 
        isVisible={showNotificationManager}
        onClose={() => setShowNotificationManager(false)}
      />

      {/* Sync Approval Modal */}
      <SyncApprovalModal
        isOpen={showSyncApproval}
        onClose={() => setShowSyncApproval(false)}
        onApprove={handleSyncApproval}
        sheetsData={sheetsData}
        currentData={products}
      />

      {/* Sync Overlay - Disables all interactions during sync */}
      {isSyncInProgress && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: 'white',
            fontSize: '18px',
            fontWeight: '500'
          }}
        >
          <div 
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '40px',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              maxWidth: '400px',
              width: '90%'
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔄</div>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '24px' }}>Syncing Data</h2>
            <p style={{ margin: '0 0 24px 0', opacity: 0.9, lineHeight: '1.5' }}>
              Please wait while we sync your equipment catalog from Google Sheets to Firebase.
            </p>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
              fontSize: '16px',
              opacity: 0.8
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <span>Processing...</span>
            </div>
            <p style={{ 
              margin: '16px 0 0 0', 
              fontSize: '14px', 
              opacity: 0.7,
              fontStyle: 'italic'
            }}>
              Do not refresh the page or close the browser during sync.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;