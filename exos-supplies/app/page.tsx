"use client";

import React, { useState, useEffect } from "react";
import { Search, ShoppingCart, Package, Filter, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import CartModal from "@/components/CartModal";
import { Product, GymId, GYMS } from "@/lib/types";
import firebaseService from "@/lib/firebaseService";
import Link from "next/link";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  // Individual filter toggles
  const [showPreferred, setShowPreferred] = useState(true);
  const [showCoach, setShowCoach] = useState(false);
  const [showAll, setShowAll] = useState(false);
  
  // Cart state
  const [selectedGym, setSelectedGym] = useState<GymId>("MP2");
  const [cartCounts, setCartCounts] = useState<Record<string, number>>({});
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Filter products when search/filter changes
  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory, selectedBrand, showPreferred, showCoach, showAll]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [catalogItems, categoriesData, brandsData] = await Promise.all([
        firebaseService.getCatalogItems(),
        firebaseService.getCategories(),
        firebaseService.getBrands()
      ]);
      
      setProducts(catalogItems);
      setCategories(categoriesData);
      setBrands(brandsData);
      
      // Load cart counts for selected gym
      await loadCartCounts();
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCartCounts = async () => {
    try {
      const cart = await firebaseService.getGymCart(selectedGym);
      const counts: Record<string, number> = {};
      cart.items.forEach(item => {
        counts[item.productId] = item.quantity;
      });
      setCartCounts(counts);
    } catch (error) {
      console.error("Error loading cart counts:", error);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Apply preference filters
    if (!showAll) {
      // If not showing all, apply specific filters
      if (showPreferred || showCoach) {
        filtered = filtered.filter(product => {
          const preferredValue = (product.Preferred || "").toUpperCase().trim();
          
          let matchesFilter = false;
          
          if (showPreferred) {
            // Show items marked as P or P+C
            matchesFilter = matchesFilter || preferredValue === 'P' || preferredValue === 'P+C';
          }
          
          if (showCoach) {
            // Show items marked as C or P+C
            matchesFilter = matchesFilter || preferredValue === 'C' || preferredValue === 'P+C';
          }
          
          return matchesFilter;
        });
      } else {
        // If no filters are selected, show nothing
        filtered = [];
      }
    }
    // If showAll is true, no filtering is applied

    // Apply search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product["Item Name"]?.toLowerCase().includes(term) ||
        product["Brand"]?.toLowerCase().includes(term) ||
        product["Category"]?.toLowerCase().includes(term) ||
        product["EXOS Part Number"]?.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(product => product.Category === selectedCategory);
    }

    // Apply brand filter
    if (selectedBrand) {
      filtered = filtered.filter(product => product.Brand === selectedBrand);
    }

    setFilteredProducts(filtered);
  };

  const handleAddToCart = async (product: Product, event: React.MouseEvent<HTMLButtonElement>) => {
    try {
      // Get the quantity from the input field in the same product card
      const card = event.currentTarget.closest('.product-card');
      const quantityInput = card?.querySelector('input[type="number"]') as HTMLInputElement;
      const statusSelect = card?.querySelector('select') as HTMLSelectElement;
      
      const quantity = parseInt(quantityInput?.value || '1', 10);
      const status = statusSelect?.value || 'Pending Approval';
      
      await firebaseService.addToCart(selectedGym, product, quantity);
      await loadCartCounts(); // Refresh cart counts
      
      // Reset the form
      if (quantityInput) quantityInput.value = '1';
      if (statusSelect) statusSelect.value = 'Pending Approval';
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const getTotalCartItems = () => {
    return Object.values(cartCounts).reduce((sum, count) => sum + count, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading Exos Supplies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side - Gym Selector */}
            <div className="flex items-center space-x-2 w-24 sm:w-28 md:w-32">
              <span className="hidden sm:inline text-sm font-medium text-gray-600">Gym:</span>
              <select 
                value={selectedGym}
                onChange={(e) => setSelectedGym(e.target.value as GymId)}
                className="px-2 py-1 sm:px-3 sm:py-2 border rounded-md text-sm w-full"
              >
                {GYMS.map(gym => (
                  <option key={gym} value={gym}>{gym}</option>
                ))}
              </select>
            </div>
            
            {/* Center - Logo and Title */}
            <div className="flex items-center space-x-3 flex-1 justify-center">
              <div className="text-center">
                <h1 className="text-xl font-bold">Exos Supplies</h1>
                <p className="text-sm text-muted-foreground">
                  <span className="hidden sm:inline">Equipment Management</span>
                  <span className="sm:hidden">Management</span>
                </p>
              </div>
            </div>
            
            {/* Right Side - Approvals and Cart */}
            <div className="flex items-center space-x-2 sm:space-x-4 w-24 sm:w-28 md:w-32 justify-end">
              {/* Approval Center Link */}
              <Link href="/approvals">
                <Button variant="outline" size="sm" className="p-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Approvals</span>
                </Button>
              </Link>
              
              {/* Cart Icon - Always visible on medium+ screens */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="relative p-2"
                  onClick={() => setIsCartModalOpen(true)}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {getTotalCartItems() > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {getTotalCartItems()}
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="container mx-auto px-4 py-6">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Search equipment, brands, categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-lg"
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="container mx-auto px-4 pb-6">
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant={showPreferred ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setShowPreferred(!showPreferred);
              if (showAll) setShowAll(false); // Turn off "All Items" when toggling individual filters
            }}
          >
            ⭐ Preferred
          </Button>
          
          <Button
            variant={showCoach ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setShowCoach(!showCoach);
              if (showAll) setShowAll(false); // Turn off "All Items" when toggling individual filters
            }}
          >
            🏆 Coach's Picks
          </Button>
          
          <Button
            variant={showAll ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (showAll) {
                // If turning off "All", reset to default (Preferred only)
                setShowAll(false);
                setShowPreferred(true);
                setShowCoach(false);
              } else {
                // If turning on "All", turn off other filters
                setShowAll(true);
                setShowPreferred(false);
                setShowCoach(false);
              }
            }}
          >
            📋 All Items
          </Button>
          
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              if (e.target.value) setSelectedBrand(""); // Clear brand when category is selected
            }}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <select
            value={selectedBrand}
            onChange={(e) => {
              setSelectedBrand(e.target.value);
              if (e.target.value) setSelectedCategory(""); // Clear category when brand is selected
            }}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="">All Brands</option>
            {brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product) => (
                              <Card key={product.id} className="product-card overflow-visible hover:shadow-lg transition-shadow bg-white border border-gray-200 relative">
              <CardContent className="p-2 sm:p-4">
                <div className="space-y-2 sm:space-y-3">
                  {/* Item Image Placeholder */}
                  <div className="w-full h-20 sm:h-24 bg-gradient-to-br from-blue-50 to-blue-100 rounded-md flex items-center justify-center border border-blue-200">
                    <span className="text-blue-500 text-xs font-medium">Item Image</span>
                  </div>
                  
                  {/* Product Title (Clickable) */}
                  <div>
                    {product.URL ? (
                      <a 
                        href={product.URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-sm sm:text-base text-blue-700 hover:text-blue-900 hover:underline line-clamp-2 leading-tight"
                      >
                        {product["Item Name"]}
                      </a>
                    ) : (
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900 line-clamp-2 leading-tight">
                        {product["Item Name"]}
                      </h3>
                    )}
                    
                    {/* Preferred Badge */}
                    {product.Preferred && (
                      <div className="mt-1">
                        {product.Preferred === 'P' && (
                          <span className="inline-flex items-center text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                            ⭐ Preferred Item
                          </span>
                        )}
                        {product.Preferred === 'C' && (
                          <span className="inline-flex items-center text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                            🏆 Coach's Recommended
                          </span>
                        )}
                        {product.Preferred === 'P+C' && (
                          <span className="inline-flex items-center text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                            ⭐🏆 Preferred & Coach's
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Brand and Category - Side by Side */}
                  <div className="flex justify-between items-center">
                    <div className="text-gray-600 font-medium text-xs sm:text-sm">
                      {product.Brand}
                    </div>
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      {product.Category}
                    </Badge>
                  </div>
                  
                  {/* Part Number and Price - Side by Side */}
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500 font-mono">
                      {product["EXOS Part Number"]}
                    </div>
                    <div className="text-base sm:text-lg font-bold text-blue-800">
                      ${typeof product.Cost === 'string' ? product.Cost.replace(/[$]/g, '') : product.Cost || '0'}
                    </div>
                  </div>
                  
                  {/* Cart Controls - Single Line */}
                  <div className="flex items-center gap-1 sm:gap-2 text-xs">
                    <span className="font-medium w-8 sm:w-12 hidden sm:inline">Qty:</span>
                    <input 
                      type="number" 
                      min="1" 
                      defaultValue="1"
                      className="w-8 sm:w-12 px-1 sm:px-2 py-1 border rounded text-center text-xs"
                    />
                    <span className="font-medium hidden sm:inline">Gym:</span>
                    <span className="font-medium text-blue-600">{selectedGym}</span>
                    <span className="font-medium w-8 sm:w-12 hidden sm:inline">Status:</span>
                    <select 
                      className="w-20 sm:w-24 px-1 sm:px-2 py-1 border rounded text-xs status-select"
                      defaultValue="Pending Approval"
                      onChange={(e) => {
                        const target = e.target;
                        const status = target.value;
                        // Apply dynamic styling based on selected status
                        if (status === 'Hold') {
                          target.style.backgroundColor = '#fff3cd';
                          target.style.color = '#856404';
                        } else if (status === 'Waitlist') {
                          target.style.backgroundColor = '#f8f9fa';
                          target.style.color = '#6c757d';
                        } else if (status === 'Pending Approval') {
                          target.style.backgroundColor = '#cce7ff';
                          target.style.color = '#004085';
                        } else if (status === 'Approved') {
                          target.style.backgroundColor = '#d4edda';
                          target.style.color = '#155724';
                        } else if (status === 'Not Approved') {
                          target.style.backgroundColor = '#f8d7da';
                          target.style.color = '#721c24';
                        } else {
                          target.style.backgroundColor = '#ffffff';
                          target.style.color = '#000000';
                        }
                      }}
                      style={{
                        backgroundColor: '#cce7ff',
                        color: '#004085'
                      }}
                    >
                      <option value="">Status</option>
                      <option value="Hold" style={{backgroundColor: '#fff3cd', color: '#856404'}}>Hold</option>
                      <option value="Waitlist" style={{backgroundColor: '#f8f9fa', color: '#6c757d'}}>Waitlist</option>
                      <option value="Pending Approval" style={{backgroundColor: '#cce7ff', color: '#004085'}}>Pending Approval</option>
                      <option value="Approved" style={{backgroundColor: '#d4edda', color: '#155724'}}>Approved</option>
                      <option value="Not Approved" style={{backgroundColor: '#f8d7da', color: '#721c24'}}>Not Approved</option>
                    </select>
                  </div>
                 
                  {/* Action Buttons - Stacked on mobile, side by side on desktop */}
                  <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                    <Button
                      onClick={(e) => handleAddToCart(product, e)}
                      size="sm"
                      className="bg-blue-700 hover:bg-blue-800 text-white text-xs h-8 px-3"
                    >
                      Add to Gym
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50 h-8 px-3"
                      onClick={() => {
                        const copyText = `${product["Item Name"]}\t${product.Brand}\t${product.Category}\t${product["EXOS Part Number"]}\t${product.Cost}`;
                        navigator.clipboard.writeText(copyText);
                      }}
                    >
                      Copy Info
                    </Button>
                  </div>
                  
                  {/* Cart Count Display */}
                  {cartCounts[product.id] && (
                    <div className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded text-center">
                      In cart: {cartCounts[product.id]}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Fixed Cart Button - Only show on mobile/small screens when header cart might be hidden */}
      {getTotalCartItems() > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 md:hidden">
          <Button 
            size="lg" 
            className="rounded-full shadow-lg bg-blue-700 hover:bg-blue-800 text-white"
            onClick={() => setIsCartModalOpen(true)}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            View Cart ({getTotalCartItems()})
          </Button>
        </div>
      )}

      {/* Cart Modal */}
      <CartModal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        gymId={selectedGym}
        onCartUpdate={loadCartCounts}
        onGymChange={(newGymId) => {
          setSelectedGym(newGymId);
          loadCartCounts(); // Refresh cart counts for the new gym
        }}
      />
    </div>
  );
} 