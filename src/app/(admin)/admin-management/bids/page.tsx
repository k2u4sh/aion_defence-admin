"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PlusIcon, SearchIcon, FilterIcon, EyeIcon, EditIcon, TrashIcon, BoltIcon, ClockIcon, CheckCircleIcon, AlertTriangleIcon, StarIcon } from "@/icons";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import BidFormModal from "@/components/bids/BidFormModal";
import { useModal } from "@/hooks/useModal";

interface Bid {
  _id: string;
  bidName: string;
  buyer: {
    _id: string;
    firstName: string;
    lastName: string;
    companyName?: string;
    email: string;
  };
  category?: {
    _id: string;
    name: string;
  };
  technicalRequirements: string;
  duration: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sellerResponses?: Array<{
    _id: string;
    seller: {
      _id: string;
      firstName: string;
      lastName: string;
      companyName?: string;
    };
    status: 'pending' | 'accepted' | 'rejected';
    quotedPrice?: number;
  }>;
  sellerResponse?: {
    _id?: string;
    seller: {
      _id: string;
      firstName: string;
      lastName: string;
      companyName?: string;
    };
    status: 'pending' | 'accepted' | 'rejected';
    quotedPrice?: number;
  };
  submittedAt: string;
  expiresAt: string;
  createdAt: string;
}

const BidsPage = () => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBids, setTotalBids] = useState(0);

  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const { isOpen: isBidModalOpen, openModal: openBidModal, closeModal: closeBidModal } = useModal();
  const [bidToDelete, setBidToDelete] = useState<string | null>(null);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);

  useEffect(() => {
    fetchBids();
  }, [currentPage, searchTerm, statusFilter, priorityFilter]);

  const fetchBids = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter })
      });

      const response = await fetch(`/api/admin/bids?${params}`);
      const data = await response.json();

      if (data.success) {
        setBids(data.data.bids);
        setTotalPages(data.data.totalPages);
        setTotalBids(data.data.totalBids);
      } else {
        setError(data.message || "Failed to fetch bids");
      }
    } catch (error) {
      console.error("Error fetching bids:", error);
      setError("Failed to fetch bids");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBid = async () => {
    if (!bidToDelete) return;

    try {
      const response = await fetch(`/api/admin/bids/${bidToDelete}`, {
        method: "DELETE"
      });

      const data = await response.json();
      if (data.success) {
        fetchBids(); // Refresh the list
        closeDeleteModal();
        setBidToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting bid:", error);
    }
  };

  const handleOpenDeleteModal = (bidId: string) => {
    setBidToDelete(bidId);
    openDeleteModal();
  };

  const handleOpenBidModal = (bid?: Bid) => {
    setSelectedBid(bid || null);
    openBidModal();
  };

  const handleBidSaved = () => {
    fetchBids(); // Refresh the list
  };

  const getStatusBadge = (bid: Bid) => {
    // Check if bid is expired first
    const isExpired = new Date(bid.expiresAt) < new Date();
    const actualStatus = isExpired && bid.status === 'pending' ? 'expired' : bid.status;
    
    const statusConfig = {
      pending: { color: "yellow", icon: ClockIcon, text: "Pending" },
      accepted: { color: "green", icon: CheckCircleIcon, text: "Accepted" },
      rejected: { color: "red", icon: AlertTriangleIcon, text: "Rejected" },
      expired: { color: "gray", icon: ClockIcon, text: "Expired" }
    };

    const config = statusConfig[actualStatus as keyof typeof statusConfig];
    const IconComponent = config.icon;

    return (
      <Badge color={config.color as any}>
        <IconComponent className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: "gray", text: "Low" },
      medium: { color: "blue", text: "Medium" },
      high: { color: "orange", text: "High" },
      urgent: { color: "red", text: "Urgent" }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig];

    return (
      <Badge color={config.color as any}>
        <StarIcon className="h-3 w-3" />
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

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
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
        <Button onClick={fetchBids} className="mt-2">
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bid Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and monitor all bids from buyers
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => handleOpenBidModal()}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Add Bid
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <BoltIcon className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Bids</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalBids}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {bids?.filter(bid => bid.status === 'pending').length || 0}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Accepted</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {bids?.filter(bid => bid.status === 'accepted').length || 0}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <AlertTriangleIcon className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Expired</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {bids?.filter(bid => bid.status === 'expired' || isExpired(bid.expiresAt)).length || 0}
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
                placeholder="Search bids..."
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
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bids Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Bid Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Buyer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Responses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {bids?.map((bid) => (
                <tr key={bid._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {bid.bidName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {bid.category?.name || "No Category"}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        Duration: {bid.duration}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {bid.buyer.firstName} {bid.buyer.lastName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {bid.buyer.companyName || bid.buyer.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(bid)}
                  </td>
                  <td className="px-6 py-4">
                    {getPriorityBadge(bid.priority)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {bid.sellerResponses ? bid.sellerResponses.length : (bid.sellerResponse ? 1 : 0)} responses
                    </div>
                    {((bid.sellerResponses?.length || 0) > 0 || bid.sellerResponse) && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {bid.sellerResponses ? 
                          bid.sellerResponses.filter(r => r.status === 'accepted').length : 
                          (bid.sellerResponse?.status === 'accepted' ? 1 : 0)} accepted
                      </div>
                    )}
                    {((bid.sellerResponses?.length || 0) > 0 || bid.sellerResponse) && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {bid.sellerResponses ? 
                          bid.sellerResponses.filter(r => r.status === 'pending').length : 
                          (bid.sellerResponse?.status === 'pending' ? 1 : 0)} pending
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatDate(bid.expiresAt)}
                    </div>
                    {isExpired(bid.expiresAt) && (
                      <div className="text-xs text-red-500">Expired</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Link href={`/admin-management/bids/${bid._id}`}>
                        <Button variant="outline" size="sm">
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenBidModal(bid)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDeleteModal(bid._id)}
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

        {(bids?.length || 0) === 0 && (
          <div className="text-center py-8">
            <BoltIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No bids found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new bid.
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
        onConfirm={handleDeleteBid}
        title="Delete Bid"
        message="Are you sure you want to delete this bid? This action cannot be undone."
      />

      {/* Bid Form Modal */}
      <BidFormModal
        isOpen={isBidModalOpen}
        onClose={closeBidModal}
        bid={selectedBid}
        onSaved={handleBidSaved}
      />
    </div>
  );
};

export default BidsPage;
