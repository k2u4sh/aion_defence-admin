"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PlusIcon, SearchIcon, FilterIcon, EyeIcon, EditIcon, TrashIcon, MessageIcon, ClockIcon, CheckCircleIcon, AlertTriangleIcon, StarIcon, DollarIcon } from "@/icons";
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

const EnquiriesPage = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEnquiries, setTotalEnquiries] = useState(0);

  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const [enquiryToDelete, setEnquiryToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchEnquiries();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/admin/enquiries?${params}`);
      const data = await response.json();

      if (data.success) {
        setEnquiries(data.data.enquiries);
        setTotalPages(data.data.totalPages);
        setTotalEnquiries(data.data.totalEnquiries);
      } else {
        setError(data.message || "Failed to fetch enquiries");
      }
    } catch (error) {
      console.error("Error fetching enquiries:", error);
      setError("Failed to fetch enquiries");
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
        fetchEnquiries(); // Refresh the list
        closeDeleteModal();
        setEnquiryToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting enquiry:", error);
    }
  };

  const handleOpenDeleteModal = (enquiryId: string) => {
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
        <Button onClick={fetchEnquiries} className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Enquiry Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and monitor all product enquiries and quotes
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin-management/enquiries/create">
            <Button className="flex items-center gap-2">
              <PlusIcon className="h-4 w-4" />
              Add Enquiry
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <MessageIcon className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Enquiries</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalEnquiries}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {enquiries?.filter(enquiry => enquiry.status === 'pending').length || 0}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Accepted</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {enquiries?.filter(enquiry => enquiry.status === 'accepted').length || 0}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <MessageIcon className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Responded</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {enquiries?.filter(enquiry => enquiry.status === 'responded').length || 0}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search enquiries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="responded">Responded</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Product & Buyer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Seller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Quote
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {enquiries?.map((enquiry) => (
                <tr key={enquiry._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {enquiry.productName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {enquiry.buyerName}
                      </div>
                      {enquiry.buyerEmail && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {enquiry.buyerEmail}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {enquiry.sellerId.firstName} {enquiry.sellerId.lastName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {enquiry.sellerId.companyName || enquiry.sellerId.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {enquiry.quantity}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(enquiry.status)}
                  </td>
                  <td className="px-6 py-4">
                    {enquiry.sellerResponse ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatPrice(enquiry.sellerResponse.price, enquiry.sellerResponse.currency)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Valid until: {formatDate(enquiry.sellerResponse.validUntil)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">No quote</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatDate(enquiry.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Link href={`/admin-management/enquiries/${enquiry._id}`}>
                        <Button variant="outline" size="sm">
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin-management/enquiries/${enquiry._id}/edit`}>
                        <Button variant="outline" size="sm">
                          <EditIcon className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDeleteModal(enquiry._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(enquiries?.length || 0) === 0 && (
          <div className="text-center py-8">
            <MessageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No enquiries found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new enquiry.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

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

export default EnquiriesPage;
