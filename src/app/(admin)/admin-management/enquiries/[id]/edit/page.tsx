"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeftIcon, SaveIcon, TrashIcon, MessageIcon, CheckCircleIcon, AlertTriangleIcon, ClockIcon, StarIcon, UserIcon, DollarIcon } from "@/icons";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import { useModal } from "@/hooks/useModal";

interface Enquiry {
  _id: string;
  productId: {
    _id: string;
    name: string;
    images?: string[];
    description?: string;
  };
  productName: string;
  sellerId: {
    _id: string;
    firstName: string;
    lastName: string;
    companyName?: string;
    email: string;
  };
  buyerId?: {
    _id: string;
    firstName: string;
    lastName: string;
    companyName?: string;
    email: string;
  };
  buyerName: string;
  buyerEmail?: string;
  buyerPhone?: string;
  message: string;
  quantity: number;
  status: 'pending' | 'responded' | 'accepted' | 'rejected' | 'expired';
  sellerResponse?: {
    message: string;
    price: number;
    currency: string;
    validUntil: string;
    respondedAt: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const EditEnquiryPage = () => {
  const params = useParams();
  const router = useRouter();
  const enquiryId = params.id as string;
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    productName: '',
    buyerName: '',
    buyerEmail: '',
    buyerPhone: '',
    message: '',
    quantity: 1,
    status: 'pending' as 'pending' | 'responded' | 'accepted' | 'rejected' | 'expired',
    notes: '',
    sellerResponse: {
      message: '',
      price: 0,
      currency: 'INR',
      validUntil: ''
    }
  });

  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const [enquiryToDelete, setEnquiryToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (enquiryId) {
      fetchEnquiry();
    }
  }, [enquiryId]);

  const fetchEnquiry = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/enquiries/${enquiryId}`);
      const data = await response.json();

      if (data.success) {
        setEnquiry(data.data);
        setFormData({
          productName: data.data.productName,
          buyerName: data.data.buyerName,
          buyerEmail: data.data.buyerEmail || '',
          buyerPhone: data.data.buyerPhone || '',
          message: data.data.message,
          quantity: data.data.quantity,
          status: data.data.status,
          notes: data.data.notes || '',
          sellerResponse: {
            message: data.data.sellerResponse?.message || '',
            price: data.data.sellerResponse?.price || 0,
            currency: data.data.sellerResponse?.currency || 'INR',
            validUntil: data.data.sellerResponse?.validUntil ? 
              new Date(data.data.sellerResponse.validUntil).toISOString().slice(0, 16) : ''
          }
        });
      } else {
        setError(data.message || "Failed to fetch enquiry");
      }
    } catch (error) {
      console.error("Error fetching enquiry:", error);
      setError("Failed to fetch enquiry");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('sellerResponse.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        sellerResponse: {
          ...prev.sellerResponse,
          [field]: field === 'price' ? parseFloat(value) || 0 : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'quantity' ? parseInt(value) || 1 : value
      }));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/enquiries/${enquiryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          sellerResponse: formData.sellerResponse.message || formData.sellerResponse.price > 0 ? {
            ...formData.sellerResponse,
            validUntil: formData.sellerResponse.validUntil ? new Date(formData.sellerResponse.validUntil).toISOString() : undefined
          } : undefined
        }),
      });

      const data = await response.json();
      if (data.success) {
        router.push(`/admin-management/enquiries/${enquiryId}`);
      } else {
        setError(data.message || "Failed to update enquiry");
      }
    } catch (error) {
      console.error("Error updating enquiry:", error);
      setError("Failed to update enquiry");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEnquiry = async () => {
    if (!enquiryToDelete) return;

    try {
      const response = await fetch(`/api/admin/enquiries/${enquiryToDelete}`, {
        method: "DELETE"
      });

      const data = await response.json();
      if (data.success) {
        router.push("/admin-management/enquiries");
      }
    } catch (error) {
      console.error("Error deleting enquiry:", error);
    }
  };

  const handleOpenDeleteModal = () => {
    setEnquiryToDelete(enquiryId);
    openDeleteModal();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "yellow", icon: ClockIcon, text: "Pending" },
      responded: { color: "blue", icon: MessageIcon, text: "Responded" },
      accepted: { color: "green", icon: CheckCircleIcon, text: "Accepted" },
      rejected: { color: "red", icon: AlertTriangleIcon, text: "Rejected" },
      expired: { color: "gray", icon: ClockIcon, text: "Expired" }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const IconComponent = config.icon;

    return (
      <Badge color={config.color as any}>
        <IconComponent className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchEnquiry} className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }

  if (!enquiry) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-600">Enquiry not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/admin-management/enquiries/${enquiryId}`}>
            <Button variant="outline" size="sm">
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Back to Enquiry
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Enquiry</h1>
            <p className="text-gray-600 dark:text-gray-400">{enquiry.productName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <SaveIcon className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button 
            onClick={handleOpenDeleteModal}
            variant="outline" 
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <TrashIcon className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Name *
                </label>
                <Input
                  type="text"
                  name="productName"
                  value={formData.productName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quantity *
                </label>
                <Input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="1"
                  required
                />
              </div>
            </div>
          </div>

          {/* Buyer Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Buyer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Buyer Name *
                </label>
                <Input
                  type="text"
                  name="buyerName"
                  value={formData.buyerName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  name="buyerEmail"
                  value={formData.buyerEmail}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <Input
                  type="tel"
                  name="buyerPhone"
                  value={formData.buyerPhone}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Enquiry Message */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Enquiry Message
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Seller Response */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Seller Response
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Response Message
                </label>
                <textarea
                  name="sellerResponse.message"
                  value={formData.sellerResponse.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quoted Price
                  </label>
                  <Input
                    type="number"
                    name="sellerResponse.price"
                    value={formData.sellerResponse.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Currency
                  </label>
                  <select
                    name="sellerResponse.currency"
                    value={formData.sellerResponse.currency}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valid Until
                  </label>
                  <Input
                    type="datetime-local"
                    name="sellerResponse.validUntil"
                    value={formData.sellerResponse.validUntil}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Status
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="responded">Responded</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          {/* Admin Notes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Admin Notes
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add admin notes..."
              />
            </div>
          </div>

          {/* Seller Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Seller Information
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-900 dark:text-white">
                <strong>{enquiry.sellerId.firstName} {enquiry.sellerId.lastName}</strong>
              </p>
              {enquiry.sellerId.companyName && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {enquiry.sellerId.companyName}
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {enquiry.sellerId.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteEnquiry}
        title="Delete Enquiry"
        message="Are you sure you want to delete this enquiry? This action cannot be undone."
      />
    </div>
  );
};

export default EditEnquiryPage;
