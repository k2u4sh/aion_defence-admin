"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { useModal } from "@/hooks/useModal";

interface Bid {
  _id?: string;
  bidName: string;
  buyer: string | {
    _id: string;
    firstName: string;
    lastName: string;
    companyName?: string;
    email: string;
  };
  category?: string | {
    _id: string;
    name: string;
  };
  product?: string;
  technicalRequirements: string;
  technicalDocuments?: Array<{
    url: string;
    originalName: string;
    fileType: string;
    fileSize: number;
  }>;
  duration: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  budgetRange?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  expiresAt: string;
  submittedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Category {
  _id: string;
  name: string;
}

interface Product {
  _id: string;
  name: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName?: string;
}

interface BidFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  bid?: Bid | null;
  onSaved: () => void;
}

const BidFormModal: React.FC<BidFormModalProps> = ({
  isOpen,
  onClose,
  bid,
  onSaved
}) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [buyers, setBuyers] = useState<User[]>([]);
  const [formData, setFormData] = useState<Partial<Bid>>({
    bidName: "",
    buyer: "",
    category: "",
    product: "",
    technicalRequirements: "",
    duration: "",
    status: "pending",
    priority: "medium",
    budgetRange: {
      min: undefined,
      max: undefined,
      currency: "USD"
    },
    expiresAt: "",
    technicalDocuments: []
  });

  const [newDocument, setNewDocument] = useState({
    url: "",
    originalName: "",
    fileType: "",
    fileSize: 0
  });

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
      if (bid) {
        setFormData({
          bidName: bid.bidName || "",
          buyer: typeof bid.buyer === 'string' ? bid.buyer : bid.buyer?._id || "",
          category: typeof bid.category === 'string' ? bid.category : bid.category?._id || "",
          product: bid.product || "",
          technicalRequirements: bid.technicalRequirements || "",
          duration: bid.duration || "",
          status: bid.status || "pending",
          priority: bid.priority || "medium",
          budgetRange: bid.budgetRange || {
            min: undefined,
            max: undefined,
            currency: "USD"
          },
          expiresAt: bid.expiresAt ? new Date(bid.expiresAt).toISOString().slice(0, 16) : "",
          technicalDocuments: bid.technicalDocuments || []
        });
      } else {
        // Reset form for new bid
        setFormData({
          bidName: "",
          buyer: "",
          category: "",
          product: "",
          technicalRequirements: "",
          duration: "",
          status: "pending",
          priority: "medium",
          budgetRange: {
            min: undefined,
            max: undefined,
            currency: "USD"
          },
          expiresAt: "",
          technicalDocuments: []
        });
      }
    }
  }, [isOpen, bid]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, productsRes, buyersRes] = await Promise.all([
        fetch('/api/admin/categories?limit=100'),
        fetch('/api/admin/products?limit=100'),
        fetch('/api/admin/users?limit=100&role=buyer')
      ]);

      const [categoriesData, productsData, buyersData] = await Promise.all([
        categoriesRes.json(),
        productsRes.json(),
        buyersRes.json()
      ]);

      if (categoriesData.success) {
        setCategories(categoriesData.data.categories || []);
      }
      if (productsData.success) {
        setProducts(productsData.data.products || []);
      }
      if (buyersData.success) {
        setBuyers(buyersData.data.users || []);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBudgetRangeChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      budgetRange: {
        ...prev.budgetRange,
        [field]: value
      }
    }));
  };

  const addDocument = () => {
    if (newDocument.url && newDocument.originalName) {
      setFormData(prev => ({
        ...prev,
        technicalDocuments: [...(prev.technicalDocuments || []), { ...newDocument }]
      }));
      setNewDocument({ url: "", originalName: "", fileType: "", fileSize: 0 });
    }
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      technicalDocuments: prev.technicalDocuments?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.bidName || !formData.buyer || !formData.technicalRequirements || !formData.duration || !formData.expiresAt) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const url = bid ? `/api/admin/bids/${bid._id}` : '/api/admin/bids';
      const method = bid ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          expiresAt: new Date(formData.expiresAt!).toISOString()
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSaved();
        onClose();
      } else {
        alert(data.message || 'Failed to save bid');
      }
    } catch (error) {
      console.error('Error saving bid:', error);
      alert('Failed to save bid');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {bid ? "Edit Bid" : "Add New Bid"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bidName">Bid Name *</Label>
                <Input
                  id="bidName"
                  type="text"
                  value={formData.bidName || ""}
                  onChange={(e) => handleInputChange("bidName", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="buyer">Buyer *</Label>
                <select
                  id="buyer"
                  value={typeof formData.buyer === 'string' ? formData.buyer : formData.buyer?._id || ""}
                  onChange={(e) => handleInputChange("buyer", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select Buyer</option>
                  {buyers.map((buyer) => (
                    <option key={buyer._id} value={buyer._id}>
                      {buyer.firstName} {buyer.lastName} {buyer.companyName && `(${buyer.companyName})`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={typeof formData.category === 'string' ? formData.category : formData.category?._id || ""}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="product">Product</Label>
                <select
                  id="product"
                  value={formData.product || ""}
                  onChange={(e) => handleInputChange("product", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="duration">Duration/Validity *</Label>
                <Input
                  id="duration"
                  type="text"
                  value={formData.duration || ""}
                  onChange={(e) => handleInputChange("duration", e.target.value)}
                  placeholder="e.g., 30 days, 3 months"
                  required
                />
              </div>
              <div>
                <Label htmlFor="expiresAt">Expires At *</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={formData.expiresAt || ""}
                  onChange={(e) => handleInputChange("expiresAt", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  value={formData.priority || "medium"}
                  onChange={(e) => handleInputChange("priority", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status || "pending"}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
          </div>

          {/* Technical Requirements */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Technical Requirements</h3>
            <div>
              <Label htmlFor="technicalRequirements">Technical Requirements *</Label>
              <textarea
                id="technicalRequirements"
                value={formData.technicalRequirements || ""}
                onChange={(e) => handleInputChange("technicalRequirements", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                rows={4}
                required
              />
            </div>
          </div>

          {/* Budget Range */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Budget Range</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="budgetMin">Minimum Budget</Label>
                <Input
                  id="budgetMin"
                  type="number"
                  value={formData.budgetRange?.min || ""}
                  onChange={(e) => handleBudgetRangeChange("min", e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="budgetMax">Maximum Budget</Label>
                <Input
                  id="budgetMax"
                  type="number"
                  value={formData.budgetRange?.max || ""}
                  onChange={(e) => handleBudgetRangeChange("max", e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={formData.budgetRange?.currency || "USD"}
                  onChange={(e) => handleBudgetRangeChange("currency", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                </select>
              </div>
            </div>
          </div>

          {/* Technical Documents */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Technical Documents</h3>
            
            {/* Add New Document */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <Label htmlFor="docUrl">Document URL</Label>
                <Input
                  id="docUrl"
                  type="url"
                  value={newDocument.url}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="docName">Document Name</Label>
                <Input
                  id="docName"
                  type="text"
                  value={newDocument.originalName}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, originalName: e.target.value }))}
                  placeholder="Document name"
                />
              </div>
              <div>
                <Label htmlFor="docType">File Type</Label>
                <Input
                  id="docType"
                  type="text"
                  value={newDocument.fileType}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, fileType: e.target.value }))}
                  placeholder="PDF, DOC, etc."
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={addDocument}
                  variant="outline"
                  className="w-full"
                >
                  Add Document
                </Button>
              </div>
            </div>

            {/* Existing Documents */}
            {formData.technicalDocuments && formData.technicalDocuments.length > 0 && (
              <div className="space-y-2">
                {formData.technicalDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{doc.originalName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{doc.url}</p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => removeDocument(index)}
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? "Saving..." : (bid ? "Update Bid" : "Create Bid")}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default BidFormModal;
