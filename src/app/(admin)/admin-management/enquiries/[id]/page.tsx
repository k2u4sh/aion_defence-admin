"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeftIcon, EditIcon, TrashIcon, MessageIcon, CheckCircleIcon, AlertTriangleIcon, ClockIcon, StarIcon, UserIcon, DollarIcon, FileIcon, DownloadIcon } from "@/icons";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
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

const EnquiryDetailPage = () => {
  const params = useParams();
  const enquiryId = params.id as string;
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleDeleteEnquiry = async () => {
    if (!enquiryToDelete) return;

    try {
      const response = await fetch(`/api/admin/enquiries/${enquiryToDelete}`, {
        method: "DELETE"
      });

      const data = await response.json();
      if (data.success) {
        // Redirect back to enquiries list
        window.location.href = "/admin-management/enquiries";
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatPrice = (price: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(price);
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
          <Link href="/admin-management/enquiries">
            <Button variant="outline" size="sm">
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Back to Enquiries
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{enquiry.productName}</h1>
            <p className="text-gray-600 dark:text-gray-400">Enquiry Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin-management/enquiries/${enquiry._id}/edit`}>
            <Button variant="outline" className="flex items-center gap-2">
              <EditIcon className="h-4 w-4" />
              Edit Enquiry
            </Button>
          </Link>
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
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <StarIcon className="h-5 w-5" />
              Product Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Name
                </label>
                <p className="text-gray-900 dark:text-white">{enquiry.productName}</p>
              </div>
              {enquiry.productId?.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <p className="text-gray-900 dark:text-white">{enquiry.productId.description}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity Requested
                </label>
                <p className="text-gray-900 dark:text-white font-semibold">{enquiry.quantity}</p>
              </div>
            </div>
          </div>

          {/* Buyer Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Buyer Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <p className="text-gray-900 dark:text-white">{enquiry.buyerName}</p>
              </div>
              {enquiry.buyerEmail && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900 dark:text-white">{enquiry.buyerEmail}</p>
                </div>
              )}
              {enquiry.buyerPhone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <p className="text-gray-900 dark:text-white">{enquiry.buyerPhone}</p>
                </div>
              )}
              {enquiry.buyerId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Registered User
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {enquiry.buyerId.firstName} {enquiry.buyerId.lastName}
                    {enquiry.buyerId.companyName && ` (${enquiry.buyerId.companyName})`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Enquiry Message */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageIcon className="h-5 w-5" />
              Enquiry Message
            </h2>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{enquiry.message}</p>
            </div>
          </div>

          {/* Seller Response */}
          {enquiry.sellerResponse && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <DollarIcon className="h-5 w-5" />
                Seller Response
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quoted Price
                    </label>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatPrice(enquiry.sellerResponse.price, enquiry.sellerResponse.currency)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Valid Until
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {formatDate(enquiry.sellerResponse.validUntil)}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Response Message
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                      {enquiry.sellerResponse.message}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Responded At
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {formatDate(enquiry.sellerResponse.respondedAt)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Status
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Status
                </label>
                {getStatusBadge(enquiry.status)}
              </div>
            </div>
          </div>

          {/* Seller Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Seller
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {enquiry.sellerId.firstName} {enquiry.sellerId.lastName}
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

          {/* Timestamps */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Timeline
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Created
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {formatDate(enquiry.createdAt)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Updated
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {formatDate(enquiry.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {enquiry.notes && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Admin Notes
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                  {enquiry.notes}
                </p>
              </div>
            </div>
          )}
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

export default EnquiryDetailPage;
