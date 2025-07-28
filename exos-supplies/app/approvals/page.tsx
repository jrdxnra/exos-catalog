'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Package, 
  ArrowLeft,
  Send,
  Settings,
  Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GYMS } from '@/lib/types';
import firebaseService from '@/lib/firebaseService';
import ApprovalSubmissionModal from '@/components/ApprovalSubmissionModal';
import ItemDetailsModal from '@/components/ItemDetailsModal';

interface GymItem {
  id: string;
  "Item Name": string;
  Brand: string;
  Category: string;
  Cost: string;
  "EXOS Part Number": string;
  URL: string;
  Gym: string;
  Quantity: number;
  Status: string;
  Note: string;
  Justification: string;
  Notes: string;
}

const statusConfig: Record<string, { bg: string; color: string; border: string }> = {
  "Hold": { bg: '#fff3cd', color: '#856404', border: '#ffeaa7' },
  "Waitlist": { bg: '#f8f9fa', color: '#6c757d', border: '#dee2e6' },
  "Pending Approval": { bg: '#cce7ff', color: '#004085', border: '#8cc8ff' },
  "Approved": { bg: '#d4edda', color: '#155724', border: '#a3d9a4' },
  "Not Approved": { bg: '#f8d7da', color: '#721c24', border: '#f1aeb5' }
};

export default function ApprovalsPage() {
  const [savedCarts, setSavedCarts] = useState<any[]>([]);
  const [approvalItems, setApprovalItems] = useState<GymItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGym, setSelectedGym] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<string>('saved-carts'); // 'saved-carts' or 'submitted-items'
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [selectedItemsForSubmission, setSelectedItemsForSubmission] = useState<any[]>([]);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterItems();
  }, [savedCarts, approvalItems, selectedGym, selectedStatus, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [carts, items] = await Promise.all([
        firebaseService.getAllSavedCarts(),
        firebaseService.getGymItems()
      ]);
      setSavedCarts(carts);
      setApprovalItems(items);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    const dataToFilter = activeTab === 'saved-carts' ? savedCarts : approvalItems;
    let filtered = dataToFilter;

    // Filter by gym
    if (selectedGym !== 'All') {
      filtered = filtered.filter((item: any) => 
        activeTab === 'saved-carts' ? item.gymId === selectedGym : item.Gym === selectedGym
      );
    }

    // Filter by status for submitted items
    if (selectedStatus !== 'All' && activeTab === 'submitted-items') {
      filtered = filtered.filter((item: any) => item.Status === selectedStatus);
    }

    setFilteredItems(filtered);
  };

  const updateItemStatus = async (itemId: string, newStatus: string, managerNote?: string) => {
    try {
      await firebaseService.updateGymItemStatus(itemId, newStatus, managerNote);
      await loadData(); // Refresh the data
      
      // Show success message
      alert(`Item ${newStatus.toLowerCase()} successfully!`);
    } catch (error) {
      console.error('Error updating item status:', error);
      alert('Error updating item status. Please try again.');
    }
  };

  const openSubmissionModal = (cartItems: any[]) => {
    setSelectedItemsForSubmission(cartItems);
    setIsSubmissionModalOpen(true);
  };

  const handleSubmissionModalSubmit = async (justification: string, notes: string) => {
    try {
      // Update the Firebase service to include notes
      await firebaseService.submitCartItemsForApproval(selectedItemsForSubmission, justification, notes);
      await loadData(); // Refresh the data
      alert(`Successfully submitted ${selectedItemsForSubmission.length} items for approval!`);
    } catch (error) {
      console.error('Error submitting items for approval:', error);
      alert('Error submitting items for approval. Please try again.');
    }
  };

  const openDetailsModal = (item: any) => {
    setSelectedItemForDetails(item);
    setIsDetailsModalOpen(true);
  };

  const handleDetailsModalSave = async (itemId: string, updatedFields: any) => {
    try {
      // Update the item in Firebase
      await firebaseService.updateGymItemDetails(itemId, updatedFields);
      await loadData(); // Refresh the data
      alert('Item details updated successfully!');
    } catch (error) {
      console.error('Error updating item details:', error);
      alert('Error updating item details. Please try again.');
    }
  };

  const handleApproveWithNote = (item: GymItem) => {
    const note = prompt(`Add approval note for "${item["Item Name"]}" (optional):`);
    if (note !== null) { // User didn't cancel
      updateItemStatus(item.id, 'Approved', note || undefined);
    }
  };

  const handleRejectWithNote = (item: GymItem) => {
    const note = prompt(`Please provide a reason for rejecting "${item["Item Name"]}":`);
    if (note && note.trim()) {
      updateItemStatus(item.id, 'Not Approved', note.trim());
    } else if (note !== null) { // User didn't cancel but provided empty note
      alert('A reason is required when rejecting an item.');
    }
  };

  const sendNotificationToCoach = (item: GymItem, action: string, managerNote?: string) => {
    // This would integrate with email/notification service
    const subject = `${action}: ${item["Item Name"]} for ${item.Gym}`;
    const body = `
      Item: ${item["Item Name"]}
      Gym: ${item.Gym}
      Quantity: ${item.Quantity}
      Cost: ${item.Cost}
      Justification: ${item.Justification || 'Not provided'}
      Manager Note: ${managerNote || 'No additional notes'}
      
      Decision: ${action}
      Date: ${new Date().toLocaleDateString()}
    `;
    
    console.log('Notification would be sent:', { subject, body });
    // In production, this would send via email API
  };

  // Calculate stats for current tab
  const savedCartsCount = savedCarts.length;
  const submittedItemsCount = approvalItems.length;
  const totalItems = savedCartsCount + submittedItemsCount;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Loading approval data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side - Back Button */}
            <div className="flex items-center space-x-2 w-20 sm:w-24 md:w-32">
              <Link 
                href="/" 
                className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline md:hidden">Back</span>
                <span className="hidden md:inline">Back to Catalog</span>
              </Link>
            </div>
            
            {/* Center - Logo and Title */}
            <div className="flex items-center space-x-3 flex-1 justify-center">
              <div className="text-center">
                <h1 className="text-xl font-bold">
                  <span className="hidden sm:inline">Equipment Approval Center</span>
                  <span className="sm:hidden">Approval Center</span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  <span className="hidden sm:inline">Manage cart submissions and approval requests</span>
                  <span className="sm:hidden">Manage approvals</span>
                </p>
              </div>
            </div>
            
            {/* Right Side - Settings Icon */}
            <div className="flex items-center space-x-2 w-20 sm:w-24 md:w-32 justify-end">
              <Button variant="outline" size="sm" className="p-2">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveTab('saved-carts')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'saved-carts'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Saved Carts ({savedCarts.length})
            </button>
            <button
              onClick={() => setActiveTab('submitted-items')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'submitted-items'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Submitted Items ({approvalItems.length})
            </button>
          </div>


        </div>

        {/* Items List */}
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {activeTab === 'saved-carts' 
                    ? 'No saved cart items found'
                    : 'No submitted items found'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredItems.map((item: any, index: number) => (
              <Card key={activeTab === 'saved-carts' ? item.id : item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    {/* Header with Image and Title */}
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                      </div>
                      
                                             <div className="flex-1 min-w-0">
                         <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
                           {(activeTab === 'saved-carts' ? item.product?.URL : item.URL) ? (
                             <a
                               href={activeTab === 'saved-carts' ? item.product?.URL : item.URL}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="text-blue-600 hover:text-blue-800 hover:underline"
                             >
                               {activeTab === 'saved-carts' ? item.product?.["Item Name"] : item["Item Name"]}
                             </a>
                           ) : (
                             <span>{activeTab === 'saved-carts' ? item.product?.["Item Name"] : item["Item Name"]}</span>
                           )}
                         </div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-1">
                          {activeTab === 'saved-carts' 
                            ? `${item.product?.Brand} • ${item.product?.Category}`
                            : `${item.Brand} • ${item.Category}`
                          }
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Part: {activeTab === 'saved-carts' ? item.product?.["EXOS Part Number"] : item["EXOS Part Number"]}
                        </div>
                      </div>
                      
                      {/* Status Badge - Top Right on Mobile */}
                      <div className="flex-shrink-0">
                        {activeTab === 'saved-carts' ? (
                          <Badge 
                            variant="outline"
                            className={`text-xs ${item.submittedForApproval ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}
                          >
                            {item.submittedForApproval ? 'Submitted' : 'Not Submitted'}
                          </Badge>
                        ) : (
                          <Badge 
                            variant="outline"
                            className="text-xs"
                            style={{
                              backgroundColor: statusConfig[item.Status]?.bg || '#f8f9fa',
                              color: statusConfig[item.Status]?.color || '#6c757d',
                              borderColor: statusConfig[item.Status]?.border || '#dee2e6'
                            }}
                          >
                            {item.Status}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Gym and Quantity Info */}
                    <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-gray-600 items-center justify-between">
                      <div className="flex flex-wrap gap-4">
                        <span>Gym: {activeTab === 'saved-carts' ? item.gymId : item.Gym}</span>
                        <span>Qty: {item.quantity || item.Quantity}</span>
                        <span className="font-medium text-green-700">
                          ${activeTab === 'saved-carts' ? item.product?.Cost : item.Cost}
                        </span>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDetailsModal(item)}
                        className="text-gray-600 hover:text-gray-800 text-xs"
                      >
                        <Edit3 className="w-3 h-3 mr-1" />
                        Edit Notes
                      </Button>
                    </div>

                    {/* Notes Section */}
                    {(item.Justification || item.Note || item.Notes || (item as any).managerNote) && (
                      <div className="space-y-2">
                        {item.Justification && (
                          <div className="text-xs text-blue-600 font-medium">
                            <strong>Justification:</strong> {item.Justification}
                          </div>
                        )}
                        {item.Note && (
                          <div className="text-xs text-gray-500">
                            <strong>Coach Note:</strong> {item.Note}
                          </div>
                        )}
                        {item.Notes && (
                          <div className="text-xs text-indigo-600">
                            <strong>Additional Notes:</strong> {item.Notes}
                          </div>
                        )}
                        {(item as any).managerNote && (
                          <div className="text-xs text-purple-600">
                            <strong>Manager Note:</strong> {(item as any).managerNote}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex flex-wrap gap-2">
                        {activeTab === 'saved-carts' && !item.submittedForApproval && (
                          <Button
                            size="sm"
                            onClick={() => openSubmissionModal([item])}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Submit for Approval
                          </Button>
                        )}
                        
                        {activeTab === 'submitted-items' && item.Status === 'Pending Approval' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproveWithNote(item)}
                              className="text-green-700 border-green-300 hover:bg-green-50 text-xs"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectWithNote(item)}
                              className="text-red-700 border-red-300 hover:bg-red-50 text-xs"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                      
                      
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Approval Submission Modal */}
        <ApprovalSubmissionModal
          isOpen={isSubmissionModalOpen}
          onClose={() => setIsSubmissionModalOpen(false)}
          onSubmit={handleSubmissionModalSubmit}
          items={selectedItemsForSubmission}
        />

        {/* Item Details Modal */}
        <ItemDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          onSave={handleDetailsModalSave}
          item={selectedItemForDetails}
          userRole="manager" // All fields are now editable regardless of role
        />
      </div>
    </div>
  );
} 