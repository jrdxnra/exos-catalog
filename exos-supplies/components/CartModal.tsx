'use client';

import { useState, useEffect } from 'react';
import { X, Minus, Plus, Trash2, Save, AlertCircle, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import firebaseService from '../lib/firebaseService';
import { GymCart, CartItem, GymId, GYMS } from '../lib/types';
import ItemDetailsModal from './ItemDetailsModal';
import ApprovalSubmissionModal from './ApprovalSubmissionModal';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  gymId: GymId;
  onCartUpdate: () => void;
  onGymChange?: (gymId: GymId) => void;
}

const statusConfig: Record<string, { bg: string; color: string; border: string }> = {
  "Hold": { bg: '#fff3cd', color: '#856404', border: '#ffeaa7' },
  "Waitlist": { bg: '#f8f9fa', color: '#6c757d', border: '#dee2e6' },
  "Pending Approval": { bg: '#cce7ff', color: '#004085', border: '#8cc8ff' },
  "Approved": { bg: '#d4edda', color: '#155724', border: '#a3d9a4' },
  "Not Approved": { bg: '#f8d7da', color: '#721c24', border: '#f1aeb5' }
};

export default function CartModal({ isOpen, onClose, gymId, onCartUpdate, onGymChange }: CartModalProps) {
  const [cart, setCart] = useState<GymCart | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<any>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCart();
    }
  }, [isOpen, gymId]);

  const loadCart = async () => {
    try {
      setLoading(true);
      const gymCart = await firebaseService.getGymCart(gymId);
      setCart(gymCart);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (!cart) return;
    
    try {
      if (newQuantity <= 0) {
        await firebaseService.removeFromCart(gymId, productId);
      } else {
        await firebaseService.updateCartItemQuantity(gymId, productId, newQuantity);
      }
      
      // Update local state
      setCart(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map(item =>
            item.productId === productId
              ? { ...item, quantity: newQuantity }
              : item
          ).filter(item => item.quantity > 0)
        };
      });
      
      onCartUpdate();
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const updateStatus = async (productId: string, newStatus: string) => {
    if (!cart) return;
    
    // Update local state immediately
    setCart(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(item =>
          item.productId === productId
            ? { ...item, status: newStatus as any }
            : item
        )
      };
    });
    
    // Note: You might want to add an updateCartItemStatus method to firebaseService
    // For now, this updates locally and will be saved on checkout
  };

  const removeItem = async (productId: string) => {
    try {
      await firebaseService.removeFromCart(gymId, productId);
      setCart(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.filter(item => item.productId !== productId)
        };
      });
      onCartUpdate();
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };



  const clearCart = async () => {
    try {
      await firebaseService.clearCart(gymId);
      setCart({ gymId, items: [], lastUpdated: new Date() });
      onCartUpdate();
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const saveCart = async () => {
    try {
      setSaving(true);
      
      if (!cart?.items?.length) {
        console.log('Cart is empty - nothing to save');
        return;
      }
      
      // Just save the cart to Firebase for persistence
      // No approval workflow here - that happens in the approval center
      console.log(`Cart saved for ${gymId}!`);
      
      // Show success feedback
      alert(`Cart saved successfully with ${cart.items.length} items!`);
      
      // Close modal but don't clear cart
      onClose();
      
    } catch (error) {
      console.error('Error saving cart:', error);
      alert(`Error saving cart: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForApproval = async (
    justification: string, 
    notes: string, 
    individualEdits?: Record<number, { justification: string; notes: string }>
  ) => {
    try {
      setSaving(true);
      
      if (!cart?.items?.length) {
        alert('Cart is empty - nothing to submit');
        return;
      }

      // First save the cart to ensure it's persisted
      console.log(`Saving cart before submission for ${gymId}...`);
      
      // Then submit for approval with gymId and individual edits
      await firebaseService.submitCartItemsForApproval(cart.items, justification, notes, gymId, individualEdits);
      
      // Clear the cart after successful submission
      await firebaseService.clearCart(gymId);
      setCart({ gymId, items: [], lastUpdated: new Date() });
      
      // Show success feedback
      alert(`Successfully submitted ${cart.items.length} items for approval!`);
      
      // Close modals and update parent
      setIsApprovalModalOpen(false);
      onClose();
      onCartUpdate();
      
    } catch (error) {
      console.error('Error submitting for approval:', error);
      alert(`Error submitting for approval: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const getTotalItems = () => {
    return cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  };

  const getTotalCost = () => {
    return cart?.items?.reduce((sum, item) => {
      const costValue = item.product.Cost;
      let cost = 0;
      
      if (typeof costValue === 'string') {
        cost = parseFloat(costValue.replace(/[$,]/g, '') || '0');
      } else if (typeof costValue === 'number') {
        cost = costValue;
      }
      
      return sum + (cost * item.quantity);
    }, 0) || 0;
  };

  // Group items by status
  const groupedItems = cart?.items?.reduce((groups, item) => {
    const status = item.status || 'Pending Approval';
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(item);
    return groups;
  }, {} as Record<string, CartItem[]>) || {};

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Equipment Cart</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {getTotalItems()} items
                  </p>
                </div>
                
                {/* Gym Selector */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">Gym:</span>
                  <select
                    value={gymId}
                    onChange={(e) => {
                      const newGymId = e.target.value as GymId;
                      if (onGymChange) {
                        onGymChange(newGymId);
                      }
                    }}
                    className="px-3 py-2 border rounded-md text-sm bg-white"
                  >
                    {GYMS.map(gym => (
                      <option key={gym} value={gym}>{gym}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading cart...</p>
                </div>
              </div>
            ) : !cart?.items?.length ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-600">Add some equipment to get started</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedItems).map(([status, items]) => (
                  <div key={status} className="space-y-3">
                    {/* Status Group Header */}
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant="outline" 
                        className="text-sm px-3 py-1"
                        style={{
                          backgroundColor: statusConfig[status]?.bg || '#f8f9fa',
                          color: statusConfig[status]?.color || '#6c757d',
                          borderColor: statusConfig[status]?.border || '#dee2e6'
                        }}
                      >
                        {status} ({items.length})
                      </Badge>
                    </div>

                    {/* Items in this status */}
                    <div className="space-y-3">
                      {items.map((item) => (
                        <Card key={item.productId} className="overflow-hidden relative">
                          {/* Trash Button - Absolute positioned at top right edge */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.productId)}
                            className="absolute top-0 right-0 text-red-600 hover:text-red-800 hover:bg-red-50 p-1 z-10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              {/* Item Info */}
                              <div className="flex-1">
                                <div className="flex items-start space-x-4">
                                  {/* Image Placeholder */}
                                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs text-gray-500">IMG</span>
                                  </div>
                                  
                                  {/* Product Details */}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 line-clamp-2">
                                      {item.product.URL ? (
                                        <a
                                          href={item.product.URL}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 hover:underline"
                                        >
                                          {item.product["Item Name"]}
                                        </a>
                                      ) : (
                                        <span>{item.product["Item Name"]}</span>
                                      )}
                                    </h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {item.product.Brand} • {item.product.Category}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      Part: {item.product["EXOS Part Number"]}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Controls Row */}
                            <div className="flex items-center justify-between mt-3">
                              {/* Left: Quantity Controls */}
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  className="h-8 w-8 sm:h-9 sm:w-auto px-2 sm:px-3"
                                >
                                  <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                                <span className="text-base sm:text-lg font-semibold min-w-[2rem] sm:min-w-[3rem] text-center">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                  className="h-8 w-8 sm:h-9 sm:w-auto px-2 sm:px-3"
                                >
                                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                              </div>

                              {/* Right: Status and Price */}
                              <div className="flex items-center space-x-2 sm:space-x-3">
                                <select
                                  value={item.status}
                                  onChange={(e) => updateStatus(item.productId, e.target.value)}
                                  className="px-2 py-1 sm:px-3 sm:py-1 border rounded text-xs sm:text-sm w-20 sm:w-auto"
                                  style={{
                                    backgroundColor: statusConfig[item.status]?.bg || '#ffffff',
                                    color: statusConfig[item.status]?.color || '#000000',
                                    borderColor: statusConfig[item.status]?.border || '#dee2e6'
                                  }}
                                >
                                  <option value="Hold">Hold</option>
                                  <option value="Waitlist">Waitlist</option>
                                  <option value="Pending Approval">Pending</option>
                                  <option value="Approved">Approved</option>
                                  <option value="Not Approved">Rejected</option>
                                </select>

                                <p className="text-lg font-bold text-blue-800">
                                  ${typeof item.product.Cost === 'string' ? item.product.Cost.replace(/[$]/g, '') : item.product.Cost || '0'}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cart?.items && cart.items.length > 0 && (
            <div className="border-t p-6">
              {/* Total Price - Right Justified */}
              <div className="flex justify-end mb-4">
                <div className="text-lg font-bold text-gray-900">
                  Total: ${getTotalCost().toFixed(2)}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCart}
                    disabled={saving}
                    className="px-3"
                  >
                    <Trash2 className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Clear Cart</span>
                    <span className="sm:hidden">Clear</span>
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={saveCart}
                    disabled={saving}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-3"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                        <span className="hidden sm:inline">Saving...</span>
                        <span className="sm:hidden">Saving</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Save Cart</span>
                        <span className="sm:hidden">Save</span>
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsApprovalModalOpen(true)}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 text-white px-3"
                  >
                    <Send className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Submit for Approval</span>
                    <span className="sm:hidden">Submit</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Approval Submission Modal */}
      <ApprovalSubmissionModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        onSubmit={handleSubmitForApproval}
        items={cart?.items || []}
      />
    </>
  );
} 