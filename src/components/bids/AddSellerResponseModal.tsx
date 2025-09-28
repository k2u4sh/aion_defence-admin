"use client";

import React, { useState, useEffect } from "react";
import { XIcon, UserIcon, DollarIcon, CalenderIcon, MessageIcon } from "@/icons";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";

interface Seller {
  _id: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  email: string;
}

interface AddSellerResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bidId: string;
  bidName: string;
}

const AddSellerResponseModal: React.FC<AddSellerResponseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  bidId,
  bidName
}) => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    sellerId: '',
    status: 'pending' as 'pending' | 'accepted' | 'rejected',
    quotedPrice: '',
    estimatedDelivery: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchSellers();
    }
  }, [isOpen]);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users?limit=100&role=seller');
      const data = await response.json();

      if (data.success) {
        setSellers(data.data.users || []);
      } else {
        setError('Failed to fetch sellers');
      }
    } catch (error) {
      console.error('Error fetching sellers:', error);
      setError('Failed to fetch sellers');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quotedPrice' ? value : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sellerId) {
      setError('Please select a seller');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/admin/bids/${bidId}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sellerId: formData.sellerId,
          status: formData.status,
          quotedPrice: formData.quotedPrice ? parseFloat(formData.quotedPrice) : undefined,
          estimatedDelivery: formData.estimatedDelivery || undefined,
          notes: formData.notes || undefined
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          sellerId: '',
          status: 'pending',
          quotedPrice: '',
          estimatedDelivery: '',
          notes: ''
        });
      } else {
        setError(data.message || 'Failed to add seller response');
      }
    } catch (error) {
      console.error('Error adding seller response:', error);
      setError('Failed to add seller response');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Add Seller Response
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {bidName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="px-4 pb-4 sm:p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Seller Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <UserIcon className="h-4 w-4 inline mr-1" />
                  Select Seller *
                </label>
                {loading ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">Loading sellers...</div>
                ) : (
                  <select
                    name="sellerId"
                    value={formData.sellerId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a seller...</option>
                    {sellers.map((seller) => (
                      <option key={seller._id} value={seller._id}>
                        {seller.firstName} {seller.lastName}
                        {seller.companyName && ` (${seller.companyName})`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Quoted Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <DollarIcon className="h-4 w-4 inline mr-1" />
                  Quoted Price
                </label>
                <Input
                  type="number"
                  name="quotedPrice"
                  value={formData.quotedPrice}
                  onChange={handleInputChange}
                  placeholder="Enter quoted price"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Estimated Delivery */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <CalenderIcon className="h-4 w-4 inline mr-1" />
                  Estimated Delivery
                </label>
                <Input
                  type="text"
                  name="estimatedDelivery"
                  value={formData.estimatedDelivery}
                  onChange={handleInputChange}
                  placeholder="e.g., 2-3 weeks, 30 days"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MessageIcon className="h-4 w-4 inline mr-1" />
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any additional notes or comments..."
                />
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button
              type="submit"
              onClick={() => handleSubmit(new Event('submit') as any)}
              disabled={saving}
              className="w-full sm:w-auto sm:ml-3"
            >
              {saving ? "Adding..." : "Add Response"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="mt-3 w-full sm:mt-0 sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSellerResponseModal;
