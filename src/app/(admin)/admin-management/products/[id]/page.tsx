"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, EditIcon, TrashIcon } from "@/icons";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { useModal } from "@/hooks/useModal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import ProductFormModal from "@/components/products/ProductFormModal";

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  category: { _id: string; name: string };
  subCategory?: { _id: string; name: string };
  tags: Array<{ _id: string; name: string; color: string }>;
  basePrice: number;
  comparePrice?: number;
  cost?: number;
  sku: string;
  barcode?: string;
  quantity: number;
  lowStockThreshold: number;
  weight?: number;
  weightUnit: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  dimensionUnit: string;
  status: string;
  isVisible: boolean;
  isFeatured: boolean;
  isDigital: boolean;
  trackQuantity: boolean;
  allowBackorder: boolean;
  taxable: boolean;
  taxRate: number;
  images: Array<{
    url: string;
    alt?: string;
    isPrimary: boolean;
    order: number;
  }>;
  specifications: Array<{
    name: string;
    value: string;
    unit?: string;
  }>;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    canonicalUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const ProductDetailPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const { isOpen: isEditModalOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/products/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setProduct(data.data);
      } else {
        setError(data.message || "Failed to fetch product");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      setError("Failed to fetch product");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: "DELETE"
      });

      const data = await response.json();
      if (data.success) {
        router.push("/admin-management/products");
      } else {
        alert(data.message || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    }
  };

  const handleProductSaved = () => {
    fetchProduct();
    closeEditModal();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: "light" as const, label: "Draft" },
      active: { color: "success" as const, label: "Active" },
      inactive: { color: "error" as const, label: "Inactive" },
      archived: { color: "warning" as const, label: "Archived" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge color={config.color}>{config.label}</Badge>;
  };

  const getStockStatus = (quantity: number) => {
    if (quantity <= 0) return <span className="text-red-600 font-medium">Out of Stock</span>;
    if (quantity <= 10) return <span className="text-yellow-600 font-medium">Low Stock</span>;
    return <span className="text-green-600 font-medium">In Stock</span>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
        <p className="text-gray-600 mb-6">{error || "The product you're looking for doesn't exist."}</p>
        <Button onClick={() => router.push("/admin-management/products")}>
          Back to Products
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/admin-management/products")}
            className="flex items-center gap-2"
          >
            <ChevronLeftIcon />
            Back to Products
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-600">Product Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openEditModal()} className="flex items-center gap-2">
            <EditIcon />
            Edit Product
          </Button>
          <Button
            variant="destructive"
            onClick={() => openDeleteModal()}
            className="flex items-center gap-2"
          >
            <TrashIcon />
            Delete Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-gray-900">{product.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <p className="text-gray-900 font-mono">{product.sku}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="mt-1">{getStatusBadge(product.status)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                <p className="text-gray-900">{product.isVisible ? "Visible" : "Hidden"}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-gray-900">{product.description}</p>
              </div>
              {product.shortDescription && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                  <p className="text-gray-900">{product.shortDescription}</p>
                </div>
              )}
            </div>
          </div>

          {/* Categories and Tags */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories & Tags</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <p className="text-gray-900">{product.category?.name || "Uncategorized"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category</label>
                  <p className="text-gray-900">{product.subCategory?.name || "None"}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {product.tags && product.tags.length > 0 ? (
                    product.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded text-sm font-medium"
                        style={{ backgroundColor: tag.color + '20', color: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">No tags assigned</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Price</label>
                <p className="text-2xl font-bold text-gray-900">${product.basePrice.toFixed(2)}</p>
              </div>
              {product.comparePrice && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Compare Price</label>
                  <p className="text-lg text-gray-500 line-through">${product.comparePrice.toFixed(2)}</p>
                </div>
              )}
              {product.cost && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
                  <p className="text-lg text-gray-900">${product.cost.toFixed(2)}</p>
                </div>
              )}
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taxable</label>
                <p className="text-gray-900">{product.taxable ? "Yes" : "No"}</p>
              </div>
              {product.taxable && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate</label>
                  <p className="text-gray-900">{product.taxRate}%</p>
                </div>
              )}
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <p className="text-2xl font-bold text-gray-900">{product.quantity}</p>
                <div className="mt-1">{getStockStatus(product.quantity)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                <p className="text-gray-900">{product.lowStockThreshold}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Track Quantity</label>
                <p className="text-gray-900">{product.trackQuantity ? "Yes" : "No"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allow Backorder</label>
                <p className="text-gray-900">{product.allowBackorder ? "Yes" : "No"}</p>
              </div>
              {product.barcode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                  <p className="text-gray-900 font-mono">{product.barcode}</p>
                </div>
              )}
            </div>
          </div>

          {/* Specifications */}
          {product.specifications && product.specifications.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.specifications.map((spec, index) => (
                  <div key={index} className="border-b border-gray-100 pb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{spec.name}</label>
                    <p className="text-gray-900">
                      {spec.value}
                      {spec.unit && <span className="text-gray-500 ml-1">({spec.unit})</span>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEO */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO</h2>
            <div className="space-y-4">
              {product.seo.metaTitle && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                  <p className="text-gray-900">{product.seo.metaTitle}</p>
                </div>
              )}
              {product.seo.metaDescription && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                  <p className="text-gray-900">{product.seo.metaDescription}</p>
                </div>
              )}
              {product.seo.keywords && product.seo.keywords.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
                  <div className="flex flex-wrap gap-2">
                    {product.seo.keywords.map((keyword, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Images */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>
            {product.images && product.images.length > 0 ? (
              <div className="space-y-3">
                {product.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image.url}
                      alt={image.alt || product.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {image.isPrimary && (
                      <div className="absolute top-2 right-2">
                        <Badge color="primary" size="sm">Primary</Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No images uploaded</p>
            )}
          </div>

          {/* Properties */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Properties</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Digital Product</label>
                <p className="text-gray-900">{product.isDigital ? "Yes" : "No"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Featured</label>
                <p className="text-gray-900">{product.isFeatured ? "Yes" : "No"}</p>
              </div>
              {product.weight && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                  <p className="text-gray-900">{product.weight} {product.weightUnit}</p>
                </div>
              )}
              {product.dimensions && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions</label>
                  <p className="text-gray-900">
                    {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} {product.dimensionUnit}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timestamps</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                <p className="text-gray-900">{formatDate(product.createdAt)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                <p className="text-gray-900">{formatDate(product.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProductFormModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        product={product}
        onSaved={handleProductSaved}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
      />
    </div>
  );
};

export default ProductDetailPage;
