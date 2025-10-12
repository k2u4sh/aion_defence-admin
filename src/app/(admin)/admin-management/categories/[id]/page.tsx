"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeftIcon, EditIcon, TrashIcon, CheckCircleIcon, AlertTriangleIcon, ClockIcon, UserIcon, DollarIcon, PackageIcon, StarIcon, TagIcon, BoxIcon } from "@/icons";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import { useModal } from "@/hooks/useModal";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  status: 'active' | 'inactive' | 'archived';
  parentCategory?: { _id: string; name: string };
  subCategories?: Array<{ _id: string; name: string; status: string }>;
  image?: { url: string; alt: string };
  icon?: string;
  color?: string;
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

const CategoryDetailPage = () => {
  const params = useParams();
  const categoryId = params.id as string;
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (categoryId) {
      fetchCategory();
    }
  }, [categoryId]);

  const fetchCategory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/categories/${categoryId}`);
      const data = await response.json();

      if (data.success) {
        setCategory(data.data);
      } else {
        setError(data.message || "Failed to fetch category");
      }
    } catch (error) {
      console.error("Error fetching category:", error);
      setError("Failed to fetch category");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      const response = await fetch(`/api/admin/categories/${categoryToDelete}`, {
        method: "DELETE"
      });

      const data = await response.json();
      if (data.success) {
        // Redirect back to categories list (client-only)
        if (typeof window !== 'undefined') {
          window.location.href = "/admin-management/categories";
        }
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const handleOpenDeleteModal = () => {
    setCategoryToDelete(categoryId);
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading category details...</p>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Category Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error || "The category you're looking for doesn't exist."}</p>
          <Link href="/admin-management/categories">
            <Button variant="outline">
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Back to Categories
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
          <Link href="/admin-management/categories">
            <Button variant="outline" size="sm">
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Back to Categories
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{category.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">Slug: {category.slug}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin-management/categories/${categoryId}/edit`}>
            <Button variant="outline" className="flex items-center gap-2">
              <EditIcon className="h-4 w-4" />
              Edit Category
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
          {/* Category Image */}
          {category.image && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Image</h2>
              <div className="flex justify-center">
                <img
                  src={category.image.url}
                  alt={category.image.alt || category.name}
                  className="max-w-full h-64 object-cover rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Category Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Information</h2>
            <div className="space-y-4">
              {category.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                  <p className="mt-1 text-gray-900 dark:text-white whitespace-pre-wrap">{category.description}</p>
                </div>
              )}
              
              {category.shortDescription && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Short Description</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{category.shortDescription}</p>
                </div>
              )}

              {category.icon && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Icon</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{category.icon}</p>
                </div>
              )}

              {category.color && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Color</label>
                  <div className="mt-1 flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full border"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="text-gray-900 dark:text-white">{category.color}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sub Categories */}
          {category.subCategories && category.subCategories.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sub Categories</h2>
              <div className="space-y-3">
                {category.subCategories.map((subCategory) => (
                  <div key={subCategory._id} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="font-medium text-gray-900 dark:text-white">{subCategory.name}</span>
                    <Badge color={subCategory.status === 'active' ? 'success' : 'error'}>
                      {subCategory.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Fields */}
          {category.customFields && category.customFields.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Custom Fields</h2>
              <div className="space-y-3">
                {category.customFields.map((field, index) => (
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
                  {getStatusBadge(category.status)}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Slug</label>
                <p className="mt-1 text-gray-900 dark:text-white font-mono">{category.slug}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Visibility</label>
                <div className="mt-1 flex gap-2">
                  {category.isVisible && <Badge color="success">Visible</Badge>}
                  {category.isFeatured && <Badge color="info">Featured</Badge>}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Sort Order</label>
                <p className="mt-1 text-gray-900 dark:text-white">{category.sortOrder}</p>
              </div>
            </div>
          </div>

          {/* Parent Category */}
          {category.parentCategory && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Parent Category</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{category.parentCategory.name}</p>
                </div>
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Statistics</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Product Count</label>
                <p className="mt-1 text-gray-900 dark:text-white">{category.productCount || 0}</p>
              </div>
              
              {category.subCategories && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Sub Categories</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{category.subCategories.length}</p>
                </div>
              )}
            </div>
          </div>

          {/* SEO Information */}
          {(category.seoTitle || category.seoDescription) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">SEO Information</h2>
              <div className="space-y-3">
                {category.seoTitle && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">SEO Title</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{category.seoTitle}</p>
                  </div>
                )}
                
                {category.seoDescription && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">SEO Description</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{category.seoDescription}</p>
                  </div>
                )}

                {category.seoKeywords && category.seoKeywords.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">SEO Keywords</label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {category.seoKeywords.map((keyword, index) => (
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
                <p className="mt-1 text-gray-900 dark:text-white">{formatDate(category.createdAt)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
                <p className="mt-1 text-gray-900 dark:text-white">{formatDate(category.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
      />
    </div>
  );
};

export default CategoryDetailPage;
