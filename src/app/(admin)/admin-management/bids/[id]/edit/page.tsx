"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeftIcon, SaveIcon, TrashIcon, BoltIcon, CheckCircleIcon, AlertTriangleIcon, ClockIcon, StarIcon, UserIcon, MessageIcon, FileIcon, DownloadIcon } from "@/icons";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import SellerResponsesModal from "@/components/bids/SellerResponsesModal";
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
  technicalDocuments: Array<{
    url: string;
    originalName: string;
    fileType: string;
    fileSize: number;
  }>;
  duration: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sellerResponses: Array<{
    _id: string;
    seller: {
      _id: string;
      firstName: string;
      lastName: string;
      companyName?: string;
      email: string;
    };
    status: 'pending' | 'accepted' | 'rejected';
    respondedAt: string;
    quotedPrice?: number;
    estimatedDelivery?: string;
    notes?: string;
    attachments: Array<{
      url: string;
      originalName: string;
      fileType: string;
      fileSize: number;
    }>;
  }>;
  comments: Array<{
    _id: string;
    message: string;
    author: {
      _id: string;
      firstName: string;
      lastName: string;
    };
    authorRole: 'buyer' | 'seller';
    createdAt: string;
  }>;
  submittedAt: string;
  expiresAt: string;
  respondedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const EditBidPage = () => {
  const params = useParams();
  const router = useRouter();
  const bidId = params.id as string;
  const [bid, setBid] = useState<Bid | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    bidName: '',
    technicalRequirements: '',
    duration: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    status: 'pending' as 'pending' | 'accepted' | 'rejected' | 'expired',
    expiresAt: ''
  });

  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const { isOpen: isSellerModalOpen, openModal: openSellerModal, closeModal: closeSellerModal } = useModal();
  const [bidToDelete, setBidToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (bidId) {
      fetchBid();
    }
  }, [bidId]);

  const fetchBid = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/bids/${bidId}`);
      const data = await response.json();

      if (data.success) {
        setBid(data.data);
        setFormData({
          bidName: data.data.bidName,
          technicalRequirements: data.data.technicalRequirements,
          duration: data.data.duration,
          priority: data.data.priority,
          status: data.data.status,
          expiresAt: new Date(data.data.expiresAt).toISOString().slice(0, 16)
        });
      } else {
        setError(data.message || "Failed to fetch bid");
      }
    } catch (error) {
      console.error("Error fetching bid:", error);
      setError("Failed to fetch bid");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/bids/${bidId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        router.push(`/admin-management/bids/${bidId}`);
      } else {
        setError(data.message || "Failed to update bid");
      }
    } catch (error) {
      console.error("Error updating bid:", error);
      setError("Failed to update bid");
    } finally {
      setSaving(false);
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
        router.push("/admin-management/bids");
      }
    } catch (error) {
      console.error("Error deleting bid:", error);
    }
  };

  const handleOpenDeleteModal = () => {
    setBidToDelete(bidId);
    openDeleteModal();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "warning" as const, label: "Pending" },
      accepted: { color: "success" as const, label: "Accepted" },
      rejected: { color: "error" as const, label: "Rejected" },
      expired: { color: "light" as const, label: "Expired" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge color={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: "light" as const, label: "Low" },
      medium: { color: "info" as const, label: "Medium" },
      high: { color: "warning" as const, label: "High" },
      urgent: { color: "error" as const, label: "Urgent" }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return <Badge color={config.color}>{config.label}</Badge>;
  };

  const getSellerStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "warning" as const, label: "Pending" },
      accepted: { color: "success" as const, label: "Accepted" },
      rejected: { color: "error" as const, label: "Rejected" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge color={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading bid details...</p>
        </div>
      </div>
    );
  }

  if (error || !bid) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error || "Bid not found"}</p>
          <Link href="/admin-management/bids">
            <Button variant="outline">Back to Bids</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/admin-management/bids/${bidId}`}>
            <Button variant="outline" size="sm">
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Back to Bid Details
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Bid</h1>
            <p className="text-gray-600 dark:text-gray-400">Update bid information and view seller responses</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <SaveIcon className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
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
        {/* Main Content - Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bid Information Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bid Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bid Name *
                </label>
                <Input
                  type="text"
                  name="bidName"
                  value={formData.bidName}
                  onChange={handleInputChange}
                  placeholder="Enter bid name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Technical Requirements *
                </label>
                <textarea
                  name="technicalRequirements"
                  value={formData.technicalRequirements}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Describe the technical requirements..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Duration *
                  </label>
                  <Input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder="e.g., 30 days, 3 months"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expires At *
                  </label>
                  <Input
                    type="datetime-local"
                    name="expiresAt"
                    value={formData.expiresAt}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Technical Documents */}
          {bid.technicalDocuments && bid.technicalDocuments.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Technical Documents</h2>
              <div className="space-y-2">
                {bid.technicalDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.originalName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(doc.fileSize)}</p>
                      </div>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <DownloadIcon className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          {bid.comments && bid.comments.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Comments</h2>
              <div className="space-y-4">
                {bid.comments.map((comment) => (
                  <div key={comment._id} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <UserIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {comment.author.firstName} {comment.author.lastName}
                      </span>
                      <Badge color={comment.authorRole === 'buyer' ? 'info' : 'success'}>
                        {comment.authorRole}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{comment.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Buyer Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Buyer Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                <p className="text-gray-900 dark:text-white">{bid.buyer.firstName} {bid.buyer.lastName}</p>
              </div>
              {bid.buyer.companyName && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Company</label>
                  <p className="text-gray-900 dark:text-white">{bid.buyer.companyName}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                <p className="text-gray-900 dark:text-white">{bid.buyer.email}</p>
              </div>
            </div>
          </div>

          {/* Seller Responses */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Seller Responses</h2>
              {bid.sellerResponses && bid.sellerResponses.length > 0 && (
                <Button 
                  onClick={openSellerModal}
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <UserIcon className="h-4 w-4" />
                  View All Sellers
                </Button>
              )}
            </div>
            {bid.sellerResponses && bid.sellerResponses.length > 0 ? (
              <div className="space-y-4">
                {bid.sellerResponses.map((response) => (
                  <div key={response._id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {response.seller.firstName} {response.seller.lastName}
                        </p>
                        {response.seller.companyName && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{response.seller.companyName}</p>
                        )}
                      </div>
                      {getSellerStatusBadge(response.status)}
                    </div>
                    
                    {response.quotedPrice && (
                      <div className="mb-2">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Quoted Price</label>
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                          ${response.quotedPrice.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        </p>
                      </div>
                    )}
                    
                    {response.estimatedDelivery && (
                      <div className="mb-2">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated Delivery</label>
                        <p className="text-gray-900 dark:text-white">{response.estimatedDelivery}</p>
                      </div>
                    )}
                    
                    {response.notes && (
                      <div className="mb-2">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</label>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">{response.notes}</p>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Responded: {formatDate(response.respondedAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No seller responses yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteBid}
        title="Delete Bid"
        message="Are you sure you want to delete this bid? This action cannot be undone."
      />
      
      {/* Seller Responses Modal */}
      <SellerResponsesModal
        isOpen={isSellerModalOpen}
        onClose={closeSellerModal}
        sellerResponses={bid?.sellerResponses || []}
        bidName={bid?.bidName || ""}
      />
    </div>
  );
};

export default EditBidPage;
