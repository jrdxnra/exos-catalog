'use client';

import { useState, useEffect } from 'react';
import { X, Save, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const JUSTIFICATION_OPTIONS = [
  { value: '', label: 'Select justification...' },
  { value: 'program_needs', label: 'Program Needs' },
  { value: 'replacement', label: 'Replacement' },
  { value: 'broken', label: 'Broken' },
  { value: 'new-equipment', label: 'New Equipment' },
  { value: 'expansion', label: 'Expansion' },
  { value: 'maintenance', label: 'Maintenance' },
];

interface ItemDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemId: string, updatedFields: any) => void;
  item: any;
  userRole: 'coach' | 'manager'; // Who is viewing/editing
}

const statusConfig: Record<string, { bg: string; color: string; border: string }> = {
  "Hold": { bg: '#fff3cd', color: '#856404', border: '#ffeaa7' },
  "Waitlist": { bg: '#f8f9fa', color: '#6c757d', border: '#dee2e6' },
  "Pending Approval": { bg: '#cce7ff', color: '#004085', border: '#8cc8ff' },
  "Approved": { bg: '#d4edda', color: '#155724', border: '#a3d9a4' },
  "Not Approved": { bg: '#f8d7da', color: '#721c24', border: '#f1aeb5' }
};

export default function ItemDetailsModal({ 
  isOpen, 
  onClose, 
  onSave, 
  item, 
  userRole 
}: ItemDetailsModalProps) {
  const [editedJustification, setEditedJustification] = useState('');
  const [editedCoachNote, setEditedCoachNote] = useState('');
  const [editedManagerNote, setEditedManagerNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setEditedJustification(item.Justification || '');
      setEditedCoachNote(item.Note || '');
      setEditedManagerNote(item.managerNote || '');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedFields: any = {};
      
      // All fields are editable
      if (editedJustification !== (item.Justification || '')) {
        updatedFields.Justification = editedJustification;
      }
      
      if (editedCoachNote !== (item.Note || '')) {
        updatedFields.Note = editedCoachNote;
      }
      
      if (editedManagerNote !== (item.managerNote || '')) {
        updatedFields.managerNote = editedManagerNote;
      }

      if (Object.keys(updatedFields).length > 0) {
        await onSave(item.id, updatedFields);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving item details:', error);
      alert('Error saving changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // Reset to original values
    setEditedJustification(item.Justification || '');
    setEditedCoachNote(item.Note || '');
    setEditedManagerNote(item.managerNote || '');
    onClose();
  };



  const hasChanges = 
    editedJustification !== (item.Justification || '') ||
    editedCoachNote !== (item.Note || '') ||
    editedManagerNote !== (item.managerNote || '');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">
                Item Details
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

          <CardContent className="p-6 space-y-6">
            {/* Item Header */}
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {(item.URL || item.product?.URL) ? (
                        <a
                          href={item.URL || item.product?.URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 hover:text-blue-900 hover:underline"
                        >
                          {item["Item Name"] || item.product?.["Item Name"]}
                        </a>
                      ) : (
                        item["Item Name"] || item.product?.["Item Name"]
                      )}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Brand: {item.Brand || item.product?.Brand}</p>
                      <p>Category: {item.Category || item.product?.Category}</p>
                      <p>Part Number: {item["EXOS Part Number"] || item.product?.["EXOS Part Number"]}</p>
                      <p>Gym: {item.Gym || item.gymId}</p>
                      <p>Quantity: {item.Quantity || item.quantity}</p>
                      <p className="font-medium text-green-700">
                        Cost: ${item.Cost || item.product?.Cost}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <Badge 
                      variant="outline"
                      style={{
                        backgroundColor: statusConfig[item.Status]?.bg || '#f8f9fa',
                        color: statusConfig[item.Status]?.color || '#6c757d',
                        borderColor: statusConfig[item.Status]?.border || '#dee2e6'
                      }}
                    >
                      {item.Status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Justification (Editable Dropdown) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Justification
              </label>
              <select
                value={editedJustification}
                onChange={(e) => setEditedJustification(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {JUSTIFICATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Coach Note (Editable) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coach Note
              </label>
              <textarea
                value={editedCoachNote}
                onChange={(e) => setEditedCoachNote(e.target.value)}
                placeholder="Add a note about this item..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>

            {/* Manager Note (Editable) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager Note
              </label>
              <textarea
                value={editedManagerNote}
                onChange={(e) => setEditedManagerNote(e.target.value)}
                placeholder="Add manager comments or feedback..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSaving}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
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