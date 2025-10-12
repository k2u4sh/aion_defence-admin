"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeftIcon, EditIcon, TrashIcon, CheckCircleIcon, AlertTriangleIcon, ClockIcon, UserIcon, DollarIcon, PackageIcon, StarIcon, TagIcon, BoxIcon, EyeIcon } from "@/icons";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import ProductFormModal from "@/components/products/ProductFormModal";
import { useModal } from "@/hooks/useModal";
import { getImageUrl, handleImageError } from "@/utils/imageUtils";

interface Product {
  _id: string;
  slug?: string;
  name: string;
  description: string;
  category: string | { _id: string; name: string };
  subCategory?: string | { _id: string; name: string };
  currency: string;
  basePrice: number;
  images?: Array<string | { url?: string; alt?: string; isPrimary?: boolean; order?: number }>;
  videos?: Array<string | { url?: string; title?: string; description?: string }>;
  seller?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
  };
  tags?: string[] | Array<{ _id: string; name: string; color: string }>;
  weight?: number;
  pricing?: {
    basePrice: number;
    currency: string;
  };
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  stockType?: string;
  reviews?: Array<{
    rating: number;
    comment: string;
    user: string;
  }>;
  // Additional fields from ProductService
  title?: string;
  productHeading?: string;
  productDescription?: string;
  shortDescription?: string;
  makeModel?: string;
  materialType?: string;
  unitsAvailable?: string;
  daysToCompleteOrder?: string;
  quantityPerOrder?: string;
  certificationType?: string;
  defenseCertification?: string;
  registrationNumber?: string;
  restrictedBuyerAccess?: string;
  productWarranty?: string;
  certificationDocs?: Array<{
    url: string;
    originalName: string;
    uploadedAt: string;
  }>;
  // Legacy fields for backward compatibility
  sku?: string;
  barcode?: string;
  status?: 'draft' | 'active' | 'inactive' | 'archived';
  comparePrice?: number;
  cost?: number;
  quantity?: number;
  frozenStock?: number;
  lowStockThreshold?: number;
  trackQuantity?: boolean;
  allowBackorder?: boolean;
  taxable?: boolean;
  taxRate?: number;
  weightUnit?: 'kg' | 'g';
  dimensionUnit?: 'cm' | 'mm' | 'm' | 'in' | 'ft';
  isVisible?: boolean;
  isFeatured?: boolean;
  isDigital?: boolean;
  hasVariants?: boolean;
  variants?: Array<any>;
  averageRating?: number;
  totalReviews?: number;
  vendor?: string;
  supplier?: string;
  supplierSku?: string;
  specifications?: Array<{ name: string; value: string; unit?: string }>;
  sellerInfo?: {
    businessName?: string;
    location?: string;
    isVerified?: boolean;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    canonicalUrl?: string;
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
  const { isOpen: isProductModalOpen, openModal: openProductModal, closeModal: closeProductModal } = useModal();
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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

  const openEditModal = () => {
    if (product) {
      setSelectedProduct(product);
      openProductModal();
    }
  };

  const handleProductSaved = () => {
    // Refresh the product data after editing
    fetchProduct();
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

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
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
          <Button 
            onClick={openEditModal}
            variant="outline" 
            className="flex items-center gap-2"
          >
            <EditIcon className="h-4 w-4" />
            Edit Product
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
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Media Gallery */}
          {((product.images && product.images.length > 0) || (product.videos && product.videos.length > 0)) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Product Media</h2>
              
              {/* Images Section */}
              {product.images && product.images.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Images ({product.images.length})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {product.images.map((image, index) => {
                      const imageUrl = typeof image === 'string' ? image : image.url;
                      const imageAlt = typeof image === 'string' ? product.name : (image.alt || product.name);
                      const isPrimary = typeof image === 'object' ? image.isPrimary : false;
                      
                      if (!imageUrl) return null;
                      
                      return (
                        <div key={index} className="relative group">
                          <img
                            src={getImageUrl(imageUrl)}
                            alt={imageAlt}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => window.open(getImageUrl(imageUrl), '_blank')}
                            onError={handleImageError}
                          />
                          {isPrimary && (
                            <div className="absolute top-2 right-2">
                              <Badge color="success">Primary</Badge>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <EyeIcon className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Videos Section */}
              {product.videos && product.videos.length > 0 && (
                <div>
                  <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Videos ({product.videos.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.videos.map((video, index) => {
                      const videoUrl = typeof video === 'string' ? video : video.url;
                      const videoTitle = typeof video === 'object' ? video.title : `Video ${index + 1}`;
                      const videoDescription = typeof video === 'object' ? video.description : '';
                      
                      return (
                        <div key={index} className="relative">
                          <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                            <video
                              src={videoUrl}
                              controls
                              className="w-full h-full object-cover"
                              preload="metadata"
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                          <div className="mt-2">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">{videoTitle}</h4>
                            {videoDescription && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{videoDescription}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Product Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Product Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                <p className="mt-1 text-gray-900 dark:text-white whitespace-pre-wrap">{product.description}</p>
              </div>
              
              {product.title && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Title</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{product.title}</p>
                </div>
              )}

              {product.productHeading && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Product Heading</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{product.productHeading}</p>
                </div>
              )}

              {product.productDescription && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Product Description</label>
                  <p className="mt-1 text-gray-900 dark:text-white whitespace-pre-wrap">{product.productDescription}</p>
                </div>
              )}

              {product.shortDescription && (
                <div className="md:col-span-2">
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

              {product.materialType && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Material Type</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{product.materialType}</p>
                </div>
              )}

              {product.unitsAvailable && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Units Available</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{product.unitsAvailable}</p>
                </div>
              )}

              {product.daysToCompleteOrder && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Days to Complete Order</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{product.daysToCompleteOrder}</p>
                </div>
              )}

              {product.quantityPerOrder && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Quantity Per Order</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{product.quantityPerOrder}</p>
                </div>
              )}

              {product.restrictedBuyerAccess && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Restricted Buyer Access</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{product.restrictedBuyerAccess}</p>
                </div>
              )}

              {product.productWarranty && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Product Warranty</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{product.productWarranty}</p>
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

          {/* Product Reviews */}
          {product.reviews && product.reviews.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Product Reviews ({product.reviews.length})</h2>
              <div className="space-y-4">
                {product.reviews.map((review, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Rating: {review.rating}/5
                      </span>
                    </div>
                    <p className="text-gray-900 dark:text-white mb-2">{review.comment}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">User: {review.user}</p>
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
                    {typeof product.defenseCertification === 'string' 
                      ? product.defenseCertification 
                      : (product.defenseCertification as any).certified ? 'Certified' : 'Not Certified'
                    }
                  </span>
                </div>
                
                {typeof product.defenseCertification === 'object' && (product.defenseCertification as any).certificationNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Certification Number</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{(product.defenseCertification as any).certificationNumber}</p>
                  </div>
                )}
                
                {typeof product.defenseCertification === 'object' && (product.defenseCertification as any).certificationBody && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Certification Body</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{(product.defenseCertification as any).certificationBody}</p>
                  </div>
                )}
                
                {typeof product.defenseCertification === 'object' && (product.defenseCertification as any).validUntil && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Valid Until</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{formatDate((product.defenseCertification as any).validUntil)}</p>
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
                  {getStatusBadge(product.status || 'draft')}
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
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(product.basePrice, product.currency)}
                </p>
              </div>
              
              {product.currency && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Currency</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{product.currency}</p>
                </div>
              )}
              
              {product.comparePrice && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Compare Price</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{formatCurrency(product.comparePrice, product.currency)}</p>
                </div>
              )}
              
              {product.cost && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Cost</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{formatCurrency(product.cost, product.currency)}</p>
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
              
              {product.frozenStock !== undefined && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Frozen Stock</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{product.frozenStock}</p>
                </div>
              )}
              
              {product.quantityPerOrder && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Quantity Per Order</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{product.quantityPerOrder}</p>
                </div>
              )}
              
              {product.daysToCompleteOrder && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Days to Complete Order</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{product.daysToCompleteOrder}</p>
                </div>
              )}
              
              {product.stockType && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Stock Type</label>
                  <div className="mt-1">
                    <Badge color={product.stockType === 'instock' ? 'success' : 'warning'}>
                      {product.stockType === 'instock' ? 'In Stock' : 'By Order'}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Category & Tags */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category & Tags</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {typeof product.category === 'string' ? product.category : product.category?.name || 'N/A'}
                </p>
              </div>
              
              {product.subCategory && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Sub Category</label>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {typeof product.subCategory === 'string' ? product.subCategory : product.subCategory?.name || 'N/A'}
                  </p>
                </div>
              )}
              
              {product.tags && product.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Tags</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => {
                      const tagId = typeof tag === 'string' ? tag : tag._id;
                      const tagName = typeof tag === 'string' ? tag : tag.name;
                      return (
                        <Badge 
                          key={tagId || index} 
                          color="info"
                        >
                          <TagIcon className="h-3 w-3" />
                          {tagName}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Seller Information */}
          {product.seller && (
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

              {product.sellerInfo && (
                <>
                  {product.sellerInfo.businessName && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Business Name</label>
                      <p className="mt-1 text-gray-900 dark:text-white">{product.sellerInfo.businessName}</p>
                    </div>
                  )}
                  {product.sellerInfo.location && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</label>
                      <p className="mt-1 text-gray-900 dark:text-white">{product.sellerInfo.location}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Verification Status</label>
                    <div className="mt-1">
                      <Badge color={product.sellerInfo.isVerified ? 'success' : 'warning'}>
                        {product.sellerInfo.isVerified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </div>
                  </div>
                </>
              )}
              </div>
            </div>
          )}

          {/* Additional Product Information */}
          {(product.makeModel || product.materialType || product.restrictedBuyerAccess || product.productWarranty) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.makeModel && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Make & Model</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{product.makeModel}</p>
                  </div>
                )}
                {product.materialType && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Material Type</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{product.materialType}</p>
                  </div>
                )}
                {product.restrictedBuyerAccess && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Restricted Buyer Access</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{product.restrictedBuyerAccess}</p>
                  </div>
                )}
                {product.productWarranty && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Product Warranty</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{product.productWarranty}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Defense Certification */}
          {(product.certificationType || product.registrationNumber || product.certificationDocs) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Defense Certification</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.certificationType && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Certification Type</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{product.certificationType}</p>
                  </div>
                )}
                {product.registrationNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Registration Number</label>
                    <p className="mt-1 text-gray-900 dark:text-white font-mono">{product.registrationNumber}</p>
                  </div>
                )}
              </div>
              {product.certificationDocs && product.certificationDocs.length > 0 && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Certification Documents</label>
                  <div className="mt-2 space-y-2">
                    {product.certificationDocs.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.originalName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          View Document
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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
          {(product.seo?.metaTitle || product.seo?.metaDescription) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">SEO Information</h2>
              <div className="space-y-3">
                {product.seo?.metaTitle && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">SEO Title</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{product.seo.metaTitle}</p>
                  </div>
                )}
                
                {product.seo?.metaDescription && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">SEO Description</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{product.seo.metaDescription}</p>
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

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={closeProductModal}
        product={selectedProduct}
        onSaved={handleProductSaved}
      />
    </div>
  );
};

export default ProductDetailPage;