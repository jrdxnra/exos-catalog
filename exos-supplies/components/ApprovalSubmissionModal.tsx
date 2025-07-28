'use client';

import { useState } from 'react';
import { X, Send, Edit3, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ApprovalSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (justification: string, notes: string, individualEdits?: Record<number, { justification: string; notes: string }>) => void;
  items: any[];
}

const JUSTIFICATION_OPTIONS = [
  { value: '', label: 'Select justification...' },
  { value: 'program_needs', label: 'Program Needs' },
  { value: 'replacement', label: 'Replacement' },
  { value: 'broken', label: 'Broken' },
  { value: 'new-equipment', label: 'New Equipment' },
  { value: 'expansion', label: 'Expansion' },
  { value: 'maintenance', label: 'Maintenance' },
];

export default function ApprovalSubmissionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  items 
}: ApprovalSubmissionModalProps) {
  const [justification, setJustification] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingMode, setEditingMode] = useState<'bulk' | 'individual'>('bulk');
  const [itemEdits, setItemEdits] = useState<Record<number, { justification: string; notes: string }>>({});

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (editingMode === 'bulk' && !justification) {
      alert('Please select a justification before submitting.');
      return;
    }

    if (editingMode === 'individual') {
      // Check if all items have justifications
      const missingJustifications = items.filter((_, index) => !itemEdits[index]?.justification);
      if (missingJustifications.length > 0) {
        alert('Please provide justification for all items before submitting.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (editingMode === 'bulk') {
        // Use bulk justification and notes for all items
        await onSubmit(justification, notes);
      } else {
        // Use individual justifications and notes
        // For now, we'll use the first item's justification as the main one
        // and combine all notes
        const firstEdit = itemEdits[0];
        const combinedNotes = items.map((_, index) => {
          const edit = itemEdits[index];
          const itemName = items[index].product?.["Item Name"] || items[index]["Item Name"];
          return `${itemName}: ${edit?.notes || 'No notes'}`;
        }).join('\n\n');
        
        await onSubmit(firstEdit?.justification || '', combinedNotes, itemEdits);
      }
      
      // Reset form
      setJustification('');
      setNotes('');
      setItemEdits({});
      setEditingMode('bulk');
      onClose();
    } catch (error) {
      console.error('Error submitting for approval:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setJustification('');
    setNotes('');
    setItemEdits({});
    setEditingMode('bulk');
    onClose();
  };

  const updateItemEdit = (index: number, field: 'justification' | 'notes', value: string) => {
    setItemEdits(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: value
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">
                Submit for Approval
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Editing Mode Toggle */}
            <div className="mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <span className="text-sm font-medium text-gray-700">Editing Mode:</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setEditingMode('bulk')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      editingMode === 'bulk'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Bulk Edit
                  </button>
                  <button
                    onClick={() => setEditingMode('individual')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      editingMode === 'individual'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Individual Edit
                  </button>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                {editingMode === 'bulk' 
                  ? 'Apply the same justification and notes to all items'
                  : 'Edit justification and notes for each item individually'
                }
              </div>
            </div>

            {/* Items List */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Items to Submit ({items.length})
              </h3>
              
              {editingMode === 'bulk' ? (
                // Bulk mode - simple list
                <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                  {items.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {item.product?.["Item Name"] || item["Item Name"]}
                        </div>
                        <div className="text-xs text-gray-600">
                          Qty: {item.quantity || item.Quantity}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        ${item.product?.Cost || item.Cost}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Individual mode - editable items
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {items.map((item, index) => (
                    <Card key={index} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {item.product?.["Item Name"] || item["Item Name"]}
                            </div>
                            <div className="text-xs text-gray-600">
                              Qty: {item.quantity || item.Quantity} • ${item.product?.Cost || item.Cost}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Item {index + 1}
                          </Badge>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Justification <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={itemEdits[index]?.justification || ''}
                              onChange={(e) => updateItemEdit(index, 'justification', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              required
                            >
                              {JUSTIFICATION_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Notes <span className="text-gray-500">(Optional)</span>
                            </label>
                            <textarea
                              value={itemEdits[index]?.notes || ''}
                              onChange={(e) => updateItemEdit(index, 'notes', e.target.value)}
                              placeholder="Add specific notes for this item..."
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              rows={2}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Bulk Edit Fields (only show in bulk mode) */}
            {editingMode === 'bulk' && (
              <>
                {/* Justification Dropdown */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Justification <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {JUSTIFICATION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {!justification && (
                    <p className="text-xs text-red-500 mt-1">
                      Please select a justification reason
                    </p>
                  )}
                </div>

                {/* Notes Textarea */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes <span className="text-gray-500">(Optional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional context or details about this request..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Provide any additional context that would help with the approval process
                  </p>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || (editingMode === 'bulk' && !justification)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit for Approval
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 