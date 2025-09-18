"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeftIcon, EditIcon, TrashIcon, CheckCircleIcon, AlertTriangleIcon, ClockIcon, UserIcon, DollarIcon, PackageIcon, StarIcon, TagIcon, BoxIcon } from "@/icons";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import { useModal } from "@/hooks/useModal";

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  sku: string;
  barcode?: string;
  status: 'draft' | 'active' | 'inactive' | 'archived';
  basePrice: number;
  comparePrice?: number;
  cost?: number;
  quantity: number;
  quantityPerOrder: number;
  lowStockThreshold: number;
  trackQuantity: boolean;
  allowBackorder: boolean;
  taxable: boolean;
  taxRate: number;
  category: { _id: string; name: string };
  subCategory?: { _id: string; name: string };
  tags: Array<{ _id: string; name: string; color: string }>;
  seller: { _id: string; firstName: string; lastName: string; companyName?: string };
  images: Array<{ url: string; alt: string; isPrimary: boolean; order: number }>;
  specifications: Array<{ name: string; value: string; unit?: string }>;
  makeModel?: string;
  weight?: number;
  weightUnit: 'kg' | 'g';
  dimensions: { length: number; width: number; height: number };
  dimensionUnit: 'cm' | 'mm' | 'm' | 'in' | 'ft';
  isVisible: boolean;
  isFeatured: boolean;
  isDigital: boolean;
  hasVariants: boolean;
  variants: Array<any>;
  averageRating: number;
  totalReviews: number;
  vendor?: string;
  supplier?: string;
  supplierSku?: string;
  warranty?: string;
  warrantyPeriod?: number;
  warrantyUnit?: 'days' | 'months' | 'years';
  returnPolicy?: string;
  shippingClass?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  metaTags?: Array<{ name: string; content: string }>;
  customFields?: Array<{ name: string; value: string; type: string }>;
  relatedProducts?: string[];
  crossSellProducts?: string[];
  upSellProducts?: string[];
  bundleProducts?: string[];
  defenseCertification?: {
    certified: boolean;
    certificationNumber?: string;
    certificationBody?: string;
    validUntil?: string;
    documents?: Array<{ name: string; url: string; type: string }>;
  };
  createdAt: string;
  updatedAt: string;
}

const ProductDetailPage = () => {
  const params = useParams();
  const productId = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/products/${productId}`);
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

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      const response = await fetch(`/api/admin/products/${productToDelete}`, {
        method: "DELETE"
      });

      const data = await response.json();
      if (data.success) {
        // Redirect back to products list (client-only)
        if (typeof window !== 'undefined') {
          window.location.href = "/admin-management/products";
        }
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleOpenDeleteModal = () => {
    setProductToDelete(productId);
    openDeleteModal();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: "warning" as const, label: "Draft" },
      active: { color: "success" as const, label: "Active" },
      inactive: { color: "error" as const, label: "Inactive" },
      archived: { color: "light" as const, label: "Archived" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge color={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    // Deterministic formatting to avoid SSR/CSR mismatch
    return new Date(dateString).toISOString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Product Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error || "The product you're looking for doesn't exist."}</p>
          <Link href="/admin-management/products">
            <Button variant="outline">
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Back to Products
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
          <Link href="/admin-management/products">
            <Button variant="outline" size="sm">
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">SKU: {product.sku}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin-management/products/${productId}/edit`}>
            <Button variant="outline" className="flex items-center gap-2">
              <EditIcon className="h-4 w-4" />
              Edit Product
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
          {/* Product Images */}
          {product.images && product.images.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Product Images</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {product.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image.url}
                      alt={image.alt || product.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {image.isPrimary && (
                      <div className="absolute top-2 right-2">
                        <Badge color="success">Primary</Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Product Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                <p className="mt-1 text-gray-900 dark:text-white whitespace-pre-wrap">{product.description}</p>
              </div>
              
              {product.shortDescription && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Short Description</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{product.shortDescription}</p>
                </div>
              )}

              {product.makeModel && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Make & Model</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{product.makeModel}</p>
                </div>
              )}
            </div>
          </div>

          {/* Specifications */}
          {product.specifications && product.specifications.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Specifications</h2>
              <div className="space-y-3">
                {product.specifications.map((spec, index) => (
                  <div key={index} className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="font-medium text-gray-900 dark:text-white">{spec.name}</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {spec.value} {spec.unit && `(${spec.unit})`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Defense Certification */}
          {product.defenseCertification && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Defense Certification</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {product.defenseCertification.certified ? 'Certified' : 'Not Certified'}
                  </span>
                </div>
                
                {product.defenseCertification.certificationNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Certification Number</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{product.defenseCertification.certificationNumber}</p>
                  </div>
                )}
                
                {product.defenseCertification.certificationBody && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Certification Body</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{product.defenseCertification.certificationBody}</p>
                  </div>
                )}
                
                {product.defenseCertification.validUntil && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Valid Until</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{formatDate(product.defenseCertification.validUntil)}</p>
                  </div>
                )}
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
                  {getStatusBadge(product.status)}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">SKU</label>
                <p className="mt-1 text-gray-900 dark:text-white font-mono">{product.sku}</p>
              </div>
              
              {product.barcode && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Barcode</label>
                  <p className="mt-1 text-gray-900 dark:text-white font-mono">{product.barcode}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Visibility</label>
                <div className="mt-1 flex gap-2">
                  {product.isVisible && <Badge color="success">Visible</Badge>}
                  {product.isFeatured && <Badge color="info">Featured</Badge>}
                  {product.isDigital && <Badge color="warning">Digital</Badge>}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pricing</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Base Price</label>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(product.basePrice)}</p>
              </div>
              
              {product.comparePrice && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Compare Price</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{formatCurrency(product.comparePrice)}</p>
                </div>
              )}
              
              {product.cost && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Cost</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{formatCurrency(product.cost)}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Taxable</label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {product.taxable ? `Yes (${product.taxRate}%)` : 'No'}
                </p>
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Inventory</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Quantity</label>
                <p className="mt-1 text-gray-900 dark:text-white">{product.quantity}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Low Stock Threshold</label>
                <p className="mt-1 text-gray-900 dark:text-white">{product.lowStockThreshold}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Track Quantity</label>
                <p className="mt-1 text-gray-900 dark:text-white">{product.trackQuantity ? 'Yes' : 'No'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Allow Backorder</label>
                <p className="mt-1 text-gray-900 dark:text-white">{product.allowBackorder ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

          {/* Category & Tags */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category & Tags</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</label>
                <p className="mt-1 text-gray-900 dark:text-white">{product.category.name}</p>
              </div>
              
              {product.subCategory && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Sub Category</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{product.subCategory.name}</p>
                </div>
              )}
              
              {product.tags && product.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Tags</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <Badge key={tag._id} color="info">{tag.name}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Seller Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Seller</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {product.seller.firstName} {product.seller.lastName}
                </p>
              </div>
              
              {product.seller.companyName && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Company</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{product.seller.companyName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Physical Properties */}
          {(product.weight || product.dimensions) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Physical Properties</h2>
              <div className="space-y-3">
                {product.weight && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Weight</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{product.weight} {product.weightUnit}</p>
                  </div>
                )}
                
                {product.dimensions && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Dimensions</label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} {product.dimensionUnit}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SEO Information */}
          {(product.seoTitle || product.seoDescription) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">SEO Information</h2>
              <div className="space-y-3">
                {product.seoTitle && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">SEO Title</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{product.seoTitle}</p>
                  </div>
                )}
                
                {product.seoDescription && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">SEO Description</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{product.seoDescription}</p>
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
                <p className="mt-1 text-gray-900 dark:text-white">{formatDate(product.createdAt)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
                <p className="mt-1 text-gray-900 dark:text-white">{formatDate(product.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteProduct}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
      />
    </div>
  );
};

export default ProductDetailPage;