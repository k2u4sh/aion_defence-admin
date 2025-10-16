"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeftIcon, EditIcon, TrashIcon, CheckCircleIcon, AlertTriangleIcon, ClockIcon, UserIcon, DollarIcon, PackageIcon, StarIcon, TagIcon, BoxIcon } from "@/icons";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import { useModal } from "@/hooks/useModal";

interface Tag {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  status: 'active' | 'inactive' | 'archived';
  isVisible: boolean;
  isFeatured: boolean;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  metaTags?: Array<{ name: string; content: string }>;
  customFields?: Array<{ name: string; value: string; type: string }>;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

const TagDetailPage = () => {
  const params = useParams();
  const tagId = params.id as string;
  const [tag, setTag] = useState<Tag | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);

  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (tagId) {
      fetchTag();
      fetchProductsByTag();
    }
  }, [tagId]);

  const fetchTag = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/tags/${tagId}`);
      const data = await response.json();

      if (data.success) {
        setTag(data.data);
      } else {
        setError(data.message || "Failed to fetch tag");
      }
    } catch (error) {
      console.error("Error fetching tag:", error);
      setError("Failed to fetch tag");
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsByTag = async () => {
    try {
      const res = await fetch(`/api/admin/products?tag=${tagId}&limit=10`);
      const js = await res.json();
      if (js?.success) {
        setProducts(js.data.products || []);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleDeleteTag = async () => {
    if (!tagToDelete) return;

    try {
      const response = await fetch(`/api/admin/tags/${tagToDelete}`, {
        method: "DELETE"
      });

      const data = await response.json();
      if (data.success) {
        // Redirect back to tags list (client-only)
        if (typeof window !== 'undefined') {
          window.location.href = "/admin-management/tags";
        }
      }
    } catch (error) {
      console.error("Error deleting tag:", error);
    }
  };

  const handleOpenDeleteModal = () => {
    setTagToDelete(tagId);
    openDeleteModal();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: "success" as const, label: "Active" },
      inactive: { color: "error" as const, label: "Inactive" },
      archived: { color: "light" as const, label: "Archived" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge color={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading tag details...</p>
        </div>
      </div>
    );
  }

  if (error || !tag) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Tag Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error || "The tag you're looking for doesn't exist."}</p>
          <Link href="/admin-management/tags">
            <Button variant="outline">
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Back to Tags
            </Button>
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
          <Link href="/admin-management/tags">
            <Button variant="outline" size="sm">
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Back to Tags
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{tag.name}</h1>
              <Badge color="info">{tag.productCount || 0} products</Badge>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Slug: {tag.slug}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin-management/tags/${tagId}/edit`}>
            <Button variant="outline" className="flex items-center gap-2">
              <EditIcon className="h-4 w-4" />
              Edit Tag
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
          {/* Tag Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tag Information</h2>
            <div className="space-y-4">
              {tag.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                  <p className="mt-1 text-gray-900 dark:text-white whitespace-pre-wrap">{tag.description}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Color</label>
                <div className="mt-1 flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: tag.color }}
                  ></div>
                  <span className="text-gray-900 dark:text-white font-mono">{tag.color}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Preview</label>
                <div className="mt-1">
                  <Badge color="info">
                    {tag.name}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Fields */}
          {tag.customFields && tag.customFields.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Custom Fields</h2>
              <div className="space-y-3">
                {tag.customFields.map((field, index) => (
                  <div key={index} className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="font-medium text-gray-900 dark:text-white">{field.name}</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {field.value} ({field.type})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                <div className="mt-1">
                  {getStatusBadge(tag.status)}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Slug</label>
                <p className="mt-1 text-gray-900 dark:text-white font-mono">{tag.slug}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Visibility</label>
                <div className="mt-1 flex gap-2">
                  {tag.isVisible && <Badge color="success">Visible</Badge>}
                  {tag.isFeatured && <Badge color="info">Featured</Badge>}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Sort Order</label>
                <p className="mt-1 text-gray-900 dark:text-white">{tag.sortOrder}</p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Statistics</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Product Count</label>
                <p className="mt-1 text-gray-900 dark:text-white">{tag.productCount || 0}</p>
              </div>
            </div>
          </div>

          {/* Products (sample) */}
          {products && products.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Products with this Tag</h2>
              <ul className="space-y-3">
                {products.map((p) => (
                  <li key={p._id} className="flex items-center justify-between">
                    <span className="truncate max-w-[70%]" title={p.name}>{p.name}</span>
                    <Link href={`/admin-management/products/${p._id}`} className="text-blue-600 dark:text-blue-400 text-sm">View</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* SEO Information */}
          {(tag.seoTitle || tag.seoDescription) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">SEO Information</h2>
              <div className="space-y-3">
                {tag.seoTitle && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">SEO Title</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{tag.seoTitle}</p>
                  </div>
                )}
                
                {tag.seoDescription && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">SEO Description</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{tag.seoDescription}</p>
                  </div>
                )}

                {tag.seoKeywords && tag.seoKeywords.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">SEO Keywords</label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {tag.seoKeywords.map((keyword, index) => (
                        <Badge key={index} color="info">{keyword}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Timestamps</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</label>
                <p className="mt-1 text-gray-900 dark:text-white">{formatDate(tag.createdAt)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
                <p className="mt-1 text-gray-900 dark:text-white">{formatDate(tag.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteTag}
        title="Delete Tag"
        message="Are you sure you want to delete this tag? This action cannot be undone."
      />
    </div>
  );
};

export default TagDetailPage;
