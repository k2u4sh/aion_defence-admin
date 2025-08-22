"use client";
import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import { formatDollar } from "@/utils/formatters";
import { 
  PlusIcon,
  SearchIcon,
  EyeIcon,
  EditIcon,
  TrashIcon
} from "@/icons";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  comparePrice?: number;
  quantity: number;
  status: 'active' | 'inactive' | 'draft' | 'archived';
  image: string;
  rating: number;
  totalReviews: number;
  createdAt: string;
}

export const ProductsOverview = () => {
  const [timeFilter, setTimeFilter] = useState<'monthly' | 'yearly'>('monthly');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - in real app, this would come from API
  const getProductsData = (): Product[] => {
    const baseProducts: Product[] = [
      {
        id: '1',
        name: 'MacBook Pro 13"',
        sku: 'MBP-13-001',
        category: 'Laptop',
        price: 2399.00,
        comparePrice: 2599.00,
        quantity: 45,
        status: 'active',
        image: '/images/product/product-01.jpg',
        rating: 4.8,
        totalReviews: 156,
        createdAt: '2024-12-01'
      },
      {
        id: '2',
        name: 'Apple Watch Ultra',
        sku: 'AWU-001',
        category: 'Watch',
        price: 879.00,
        quantity: 23,
        status: 'active',
        image: '/images/product/product-02.jpg',
        rating: 4.6,
        totalReviews: 89,
        createdAt: '2024-11-28'
      },
      {
        id: '3',
        name: 'iPhone 15 Pro Max',
        sku: 'IP15PM-001',
        category: 'SmartPhone',
        price: 1869.00,
        quantity: 67,
        status: 'active',
        image: '/images/product/product-03.jpg',
        rating: 4.9,
        totalReviews: 234,
        createdAt: '2024-11-25'
      },
      {
        id: '4',
        name: 'iPad Pro 3rd Gen',
        sku: 'IPP3-001',
        category: 'Electronics',
        price: 1699.00,
        quantity: 12,
        status: 'inactive',
        image: '/images/product/product-04.jpg',
        rating: 4.7,
        totalReviews: 78,
        createdAt: '2024-11-20'
      },
      {
        id: '5',
        name: 'AirPods Pro 2nd Gen',
        sku: 'APP2-001',
        category: 'Accessories',
        price: 240.00,
        quantity: 89,
        status: 'active',
        image: '/images/product/product-05.jpg',
        rating: 4.5,
        totalReviews: 123,
        createdAt: '2024-11-18'
      }
    ];

    if (timeFilter === 'yearly') {
      // Add more historical data for yearly view
      return [
        ...baseProducts,
        {
          id: '6',
          name: 'MacBook Air M2',
          sku: 'MBA-M2-001',
          category: 'Laptop',
          price: 1899.00,
          quantity: 34,
          status: 'active',
          image: '/images/product/product-06.jpg',
          rating: 4.7,
          totalReviews: 92,
          createdAt: '2024-10-15'
        },
        {
          id: '7',
          name: 'Samsung Galaxy S24',
          sku: 'SGS24-001',
          category: 'SmartPhone',
          price: 1299.00,
          quantity: 56,
          status: 'active',
          image: '/images/product/product-07.jpg',
          rating: 4.6,
          totalReviews: 145,
          createdAt: '2024-09-20'
        }
      ];
    }

    return baseProducts;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'draft': return 'info';
      case 'archived': return 'error';
      default: return 'default';
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { status: 'Out of Stock', color: 'error' };
    if (quantity <= 10) return { status: 'Low Stock', color: 'warning' };
    return { status: 'In Stock', color: 'success' };
  };

  const filteredProducts = getProductsData().filter(product => {
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const totalProducts = filteredProducts.length;
  const activeProducts = filteredProducts.filter(p => p.status === 'active').length;
  const totalValue = filteredProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Products Overview
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {totalProducts} products • {activeProducts} active • {formatDollar(totalValue)} total value
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Filter */}
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setTimeFilter('monthly')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  timeFilter === 'monthly'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setTimeFilter('yearly')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  timeFilter === 'yearly'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Yearly
              </button>
            </div>

            {/* Add Product Button */}
            <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <PlusIcon className="size-4" />
              Add Product
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
          {/* Search Bar */}
          <div className="sm:col-span-2 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-5" />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="all">All Categories</option>
            <option value="Laptop">Laptop</option>
            <option value="SmartPhone">SmartPhone</option>
            <option value="Watch">Watch</option>
            <option value="Electronics">Electronics</option>
            <option value="Accessories">Accessories</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-white/[0.03] divide-y divide-gray-200 dark:divide-gray-800">
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product.quantity);
              return (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-[50px] w-[50px] overflow-hidden rounded-md">
                        <Image
                          width={50}
                          height={50}
                          src={product.image}
                          className="h-[50px] w-[50px] object-cover"
                          alt={product.name}
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ⭐ {product.rating} ({product.totalReviews} reviews)
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white font-mono">
                      {product.sku}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {product.category}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDollar(product.price)}
                      </div>
                      {product.comparePrice && (
                        <div className="text-xs text-gray-400 line-through">
                          {formatDollar(product.comparePrice)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {product.quantity}
                      </div>
                      <Badge color={stockStatus.color as any} size="sm">
                        {stockStatus.status}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge color={getStatusColor(product.status)}>
                      {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                        <EyeIcon className="size-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300">
                        <EditIcon className="size-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                        <TrashIcon className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Showing {filteredProducts.length} products</span>
          <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
            View All Products
          </button>
        </div>
      </div>
    </div>
  );
};

