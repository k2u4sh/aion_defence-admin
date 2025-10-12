"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PlusIcon, EditIcon, TrashIcon, EyeIcon, FilterIcon, BoxIcon, CheckCircleIcon, AlertTriangleIcon, DollarIcon } from "@/icons";
import { useModal } from "@/hooks/useModal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import ProductFormModal from "@/components/products/ProductFormModal";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import ResponsiveTable from "@/components/tables/ResponsiveTable";
import UnifiedPagination from "@/components/common/UnifiedPagination";
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
  shortDescription?: string;
  sku?: string;
  barcode?: string;
  status?: 'draft' | 'active' | 'inactive' | 'archived';
  comparePrice?: number;
  cost?: number;
  quantity?: number;
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
  supplier?: { _id: string; name: string };
  specifications?: Array<{ name: string; value: string; unit?: string }>;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    canonicalUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Category {
  _id: string;
  name: string;
  parentCategory?: string;
  level: number;
  isActive: boolean;
}

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedSeller, setSelectedSeller] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    draftProducts: 0,
    outOfStock: 0,
    lowStock: 0,
    totalValue: 0,
    averageRating: 0
  });

  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const { isOpen: isProductModalOpen, openModal: openProductModal, closeModal: closeProductModal } = useModal();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSellers();
    fetchStats();
  }, [currentPage, searchTerm, selectedStatus, selectedCategory, selectedSubCategory, selectedSeller, minPrice, maxPrice, stockFilter, featuredFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        sortBy: "createdAt",
        sortOrder: "desc"
      });

      // Only add non-empty filter parameters
      if (searchTerm) params.append("search", searchTerm);
      if (selectedStatus) params.append("status", selectedStatus);
      if (selectedCategory) params.append("category", selectedCategory);
      if (selectedSubCategory) params.append("subCategory", selectedSubCategory);
      if (selectedSeller) params.append("seller", selectedSeller);
      if (minPrice) params.append("minPrice", minPrice);
      if (maxPrice) params.append("maxPrice", maxPrice);
      if (stockFilter) params.append("stockFilter", stockFilter);
      if (featuredFilter) params.append("featured", featuredFilter);

      const response = await fetch(`/api/admin/products?${params}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data.products);
        setTotalPages(data.data.pagination.totalPages);
        setTotalProducts(data.data.pagination.total);
      } else {
        console.error("API returned error:", data.message);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories?limit=100");
      const data = await response.json();
      if (data.success) {
        setCategories(data.data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSellers = async () => {
    try {
      const response = await fetch("/api/admin/users?limit=100&role=seller");
      const data = await response.json();
      if (data.success) {
        setSellers(data.data.users);
      }
    } catch (error) {
      console.error("Error fetching sellers:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/products/stats");
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
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
        fetchProducts();
        closeDeleteModal();
        setProductToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    openProductModal();
  };

  const handleOpenDeleteModal = (productId: string) => {
    setProductToDelete(productId);
    openDeleteModal();
  };

  const handleProductSaved = () => {
    fetchProducts();
    closeProductModal();
    setSelectedProduct(null);
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

  const getStockStatus = (quantity: number, lowStockThreshold: number = 10) => {
    if (quantity <= 0) return <span className="text-red-600 font-medium">Out of Stock</span>;
    if (quantity <= lowStockThreshold) return <span className="text-yellow-600 font-medium">Low Stock</span>;
    return <span className="text-green-600 font-medium">In Stock</span>;
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("");
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSelectedSeller("");
    setMinPrice("");
    setMaxPrice("");
    setStockFilter("");
    setFeaturedFilter("");
    setCurrentPage(1);
  };

  const getSubCategories = () => {
    if (!selectedCategory) return [];
    const parentCategory = categories.find(cat => cat._id === selectedCategory);
    return categories.filter(cat => cat.parentCategory === selectedCategory);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your product catalog</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowFilters(!showFilters)} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <FilterIcon className="h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <BoxIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Products</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalProducts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Products</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeProducts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <AlertTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.lowStock}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <DollarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${stats.totalValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filters</h3>
            <Button onClick={clearFilters} variant="outline" size="sm">
              Clear All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <Input
                type="text"
                placeholder="Search products, SKU, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubCategory("");
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Categories</option>
                {(categories || []).map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sub Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sub Category
              </label>
              <select
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                disabled={!selectedCategory}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              >
                <option value="">All Sub Categories</option>
                {(getSubCategories() || []).map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Min Price
              </label>
              <Input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Price
              </label>
              <Input
                type="number"
                placeholder="1000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>

            {/* Stock Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stock Status
              </label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Stock</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            {/* Seller Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Seller
              </label>
              <select
                value={selectedSeller}
                onChange={(e) => setSelectedSeller(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Sellers</option>
                {(sellers || []).map(seller => (
                  <option key={seller._id} value={seller._id}>
                    {seller.firstName} {seller.lastName} {seller.companyName ? `(${seller.companyName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Featured Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Featured
              </label>
              <select
                value={featuredFilter}
                onChange={(e) => setFeaturedFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Products</option>
                <option value="true">Featured Only</option>
                <option value="false">Non-Featured</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <ResponsiveTable className="bg-white dark:bg-gray-800 rounded-lg border">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Seller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No products found
                  </td>
                </tr>
              ) : (
                (products || []).map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {product.images && product.images.length > 0 ? (
                            (() => {
                              const images = product.images;
                              let imageUrl = '';
                              if (typeof images[0] === 'string') {
                                imageUrl = images[0];
                              } else {
                                const primaryImg = images.find(img => typeof img === 'object' && img.isPrimary);
                                if (primaryImg && typeof primaryImg === 'object') {
                                  imageUrl = primaryImg.url || '';
                                } else {
                                  const firstImg = images[0];
                                  if (typeof firstImg === 'object') {
                                    imageUrl = firstImg.url || '';
                                  } else {
                                    imageUrl = firstImg || '';
                                  }
                                }
                              }
                              return imageUrl ? (
                                <img
                                  className="h-12 w-12 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                                  src={getImageUrl(imageUrl)}
                                  alt={product.name}
                                  onError={handleImageError}
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <BoxIcon className="h-6 w-6 text-gray-400" />
                                </div>
                              );
                            })()
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center border border-gray-200 dark:border-gray-600">
                              <BoxIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {product.title && (
                              <div className="truncate max-w-xs font-medium">{product.title}</div>
                            )}
                            {product.productHeading && (
                              <div className="truncate max-w-xs">{product.productHeading}</div>
                            )}
                            {product.shortDescription && (
                              <div className="truncate max-w-xs">{product.shortDescription}</div>
                            )}
                            {product.makeModel && (
                              <div className="truncate max-w-xs text-xs">{product.makeModel}</div>
                            )}
                            {product.videos && product.videos.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-xs text-blue-600 dark:text-blue-400">📹 {product.videos.length} video(s)</span>
                              </div>
                            )}
                            {product.tags && product.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {product.tags.slice(0, 2).map((tag, index) => {
                                  const tagName = typeof tag === 'string' ? tag : tag.name;
                                  const tagColor = typeof tag === 'string' ? '#6B7280' : tag.color;
                                  return (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                      style={{ backgroundColor: tagColor + '20', color: tagColor }}
                                    >
                                      {tagName}
                                    </span>
                                  );
                                })}
                                {product.tags.length > 2 && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">+{product.tags.length - 2}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-mono">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div>
                        <div>
                          {typeof product.category === 'string' ? product.category : product.category?.name || "Uncategorized"}
                        </div>
                        {product.subCategory && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {typeof product.subCategory === 'string' ? product.subCategory : product.subCategory?.name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div>
                        <div className="font-medium">${product.basePrice.toFixed(2)}</div>
                        {product.comparePrice && product.comparePrice > product.basePrice && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 line-through">
                            ${product.comparePrice.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div>
                        <div className="font-medium">{product.quantity || 0}</div>
                        {getStockStatus(product.quantity || 0, product.lowStockThreshold || 10)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div>
                        <div>{product.seller?.firstName} {product.seller?.lastName}</div>
                        {product.seller?.companyName && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{product.seller.companyName}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-sm ${
                                i < Math.floor(product.averageRating || 0)
                                  ? 'text-yellow-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                          ({product.totalReviews})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(product.status || 'draft')}
                        {product.isFeatured && (
                          <Badge color="warning" size="sm">Featured</Badge>
                        )}
                        {product.isDigital && (
                          <Badge color="info" size="sm">Digital</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin-management/products/${product._id}`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => openEditModal(product)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title="Edit Product"
                        >
                          <EditIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(product._id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete Product"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
      </ResponsiveTable>

      {/* Pagination */}
      <UnifiedPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalProducts}
        itemsPerPage={10}
        onPageChange={setCurrentPage}
      />

      {/* Modals */}
      <ProductFormModal
          isOpen={isProductModalOpen}
          onClose={closeProductModal}
          onSaved={() => { closeProductModal(); fetchProducts(); }}
          product={selectedProduct ? {
            _id: selectedProduct._id,
            name: selectedProduct.name,
            slug: (selectedProduct as any).slug || selectedProduct.name.toLowerCase().replace(/\s+/g, '-'),
            description: (selectedProduct as any).description || '',
            shortDescription: (selectedProduct as any).shortDescription || '',
            category: (selectedProduct as any).category?._id || '',
            subCategory: (selectedProduct as any).subCategory?._id || '',
            seller: (selectedProduct as any).seller?._id || '',
            supplier: (selectedProduct as any).supplier?._id || '',
            tags: (selectedProduct.tags || []).map((t: any) => t._id),
            basePrice: selectedProduct.basePrice,
            comparePrice: (selectedProduct as any).comparePrice || 0,
            cost: (selectedProduct as any).cost || 0,
            sku: selectedProduct.sku,
            barcode: (selectedProduct as any).barcode || '',
            quantity: selectedProduct.quantity,
            lowStockThreshold: (selectedProduct as any).lowStockThreshold || 5,
            weight: (selectedProduct as any).weight || 0,
            weightUnit: (selectedProduct as any).weightUnit || 'kg',
            dimensions: (selectedProduct as any).dimensions || { length: 0, width: 0, height: 0 },
            dimensionUnit: (selectedProduct as any).dimensionUnit || 'cm',
            status: selectedProduct.status,
            isVisible: (selectedProduct as any).isVisible ?? true,
            isFeatured: (selectedProduct as any).isFeatured ?? false,
            isDigital: (selectedProduct as any).isDigital ?? false,
            trackQuantity: (selectedProduct as any).trackQuantity ?? true,
            allowBackorder: (selectedProduct as any).allowBackorder ?? false,
            taxable: (selectedProduct as any).taxable ?? true,
            taxRate: (selectedProduct as any).taxRate || 0,
            images: (selectedProduct.images || []).map((img: any, idx: number) => ({
              url: img.url,
              alt: img.alt || '',
              isPrimary: Boolean(img.isPrimary),
              order: Number(img.order ?? idx)
            })),
            specifications: (selectedProduct as any).specifications || [],
            seo: {
              metaTitle: (selectedProduct as any).seoTitle || '',
              metaDescription: (selectedProduct as any).seoDescription || '',
              keywords: [],
              canonicalUrl: ''
            }
          } : null}
        />

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

export default ProductsPage;
