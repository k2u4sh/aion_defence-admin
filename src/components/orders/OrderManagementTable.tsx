"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Order } from "@/app/(admin)/admin-management/orders/page";
import { formatDate } from "@/utils/formatters";
import { EyeIcon, UserIcon, TruckIcon, PackageIcon, CreditCardIcon, StarIcon } from "@/icons";
import ResponsiveTable from "@/components/tables/ResponsiveTable";

interface OrderManagementTableProps {
  orders: Order[];
  isLoading: boolean;
  onStatusUpdate: (orderId: string, newStatus: string, statusType: 'order' | 'payment') => void;
}

export const OrderManagementTable: React.FC<OrderManagementTableProps> = ({
  orders,
  isLoading,
  onStatusUpdate,
}) => {
  const [mounted, setMounted] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getStatusBadge = (status: string, type: 'order' | 'payment' | 'delivery') => {
    const statusColors = {
      order: {
        pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        ordered: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        dispatched: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
        shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
        delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        complete: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        expired: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
        cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      },
      payment: {
        pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        refund: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
        partial_refund: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
        rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      },
      delivery: {
        pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
        in_transit: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
        out_for_delivery: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
        delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        failed_delivery: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        returned_to_sender: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      },
    };

    const colorClass = statusColors[type][status as keyof typeof statusColors[typeof type]] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getStatusOptions = (type: 'order' | 'payment') => {
    if (type === 'order') {
      return [
        { value: "pending", label: "Pending" },
        { value: "ordered", label: "Ordered" },
        { value: "dispatched", label: "Dispatched" },
        { value: "shipped", label: "Shipped" },
        { value: "delivered", label: "Delivered" },
        { value: "complete", label: "Complete" },
        { value: "expired", label: "Expired" },
        { value: "cancelled", label: "Cancelled" },
      ];
    } else {
      return [
        { value: "pending", label: "Pending" },
        { value: "paid", label: "Paid" },
        { value: "failed", label: "Failed" },
        { value: "refund", label: "Refunded" },
        { value: "partial_refund", label: "Partially Refunded" },
        { value: "rejected", label: "Rejected" },
      ];
    }
  };

  const handleStatusChange = (orderId: string, newStatus: string, statusType: 'order' | 'payment') => {
    onStatusUpdate(orderId, newStatus, statusType);
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (!mounted || isLoading) {
    return (
      <div className="bg-white rounded-lg shadow dark:bg-gray-800">
        <div className="px-4 py-5 sm:p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow dark:bg-gray-800">
        <div className="px-4 py-5 sm:p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No orders found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow dark:bg-gray-800">
      <div className="px-2 py-3 sm:px-4 sm:py-5 lg:p-6">
        <ResponsiveTable>
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider sm:px-4 sm:py-3">
                  Order Details
                </th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider sm:px-4 sm:py-3">
                  Amount
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Order Status
                </th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Delivery Status
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider sm:px-4 sm:py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {orders.map((order) => (
                <React.Fragment key={order._id}>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-2 py-3 whitespace-nowrap sm:px-4 sm:py-4">
                      <div className="flex items-center">
                        <button
                          onClick={() => toggleOrderExpansion(order._id)}
                          className="mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <svg
                            className={`w-4 h-4 transform transition-transform ${
                              expandedOrder === order._id ? 'rotate-90' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {order.orderNumber}
                            </span>
                            {order.parentOrder && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                Sub-Order
                              </span>
                            )}
                            {order.children && order.children.length > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Parent ({order.children.length})
                              </span>
                            )}
                          </div>
                          
                          {/* Parent Order ID */}
                          {order.parentOrder && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                              <span className="font-medium">Parent:</span> 
                              <Link 
                                href={`/admin-management/orders/${order.parentOrder}`}
                                className="ml-1 font-mono hover:underline"
                              >
                                {order.parentOrder.slice(-8)}
                              </Link>
                            </div>
                          )}
                          
                          {/* Sub-Order IDs */}
                          {order.children && order.children.length > 0 && (
                            <div className="text-xs text-green-600 dark:text-green-400 mb-1">
                              <span className="font-medium">Sub-Orders:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {order.children.slice(0, 3).map((childId) => (
                                  <Link 
                                    key={childId}
                                    href={`/admin-management/orders/${childId}`}
                                    className="font-mono hover:underline bg-green-100 dark:bg-green-800 px-1 py-0.5 rounded text-xs"
                                  >
                                    {childId.slice(-8)}
                                  </Link>
                                ))}
                                {order.children.length > 3 && (
                                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                                    +{order.children.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(order.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {order.buyer?.firstName || 'N/A'} {order.buyer?.lastName || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {order.buyer?.email || 'N/A'}
                        </div>
                        {order.buyer?.companyName && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {order.buyer.companyName}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap sm:px-4 sm:py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        ${(order.totalAmount || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value, 'order')}
                        className="text-sm border-0 bg-transparent focus:ring-2 focus:ring-blue-500 rounded"
                      >
                        {getStatusOptions('order').map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="hidden lg:table-cell px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(order.delivery_status || 'pending', 'delivery')}
                    </td>
                    <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap">
                      <select
                        value={order.payment?.status || 'pending'}
                        onChange={(e) => handleStatusChange(order._id, e.target.value, 'payment')}
                        className="text-sm border-0 bg-transparent focus:ring-2 focus:ring-blue-500 rounded"
                      >
                        {getStatusOptions('payment').map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-sm font-medium sm:px-4 sm:py-4">
                      <div className="flex gap-1 sm:gap-2">
                        <Link
                          href={`/admin-management/orders/${order._id}`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="View Order Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => toggleOrderExpansion(order._id)}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                          title={expandedOrder === order._id ? 'Hide Details' : 'Show Details'}
                        >
                          {expandedOrder === order._id ? 'Hide' : 'View'} Details
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded Order Details */}
                  {expandedOrder === order._id && (
                    <tr>
                      <td colSpan={7} className="px-2 py-3 bg-gray-50 dark:bg-gray-700 sm:px-4 sm:py-4">
                        <div className="space-y-4">
                          {/* Parent/Child Order Information */}
                          {(order.parentOrder || (order.children && order.children.length > 0)) && (
                            <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                                <PackageIcon className="h-4 w-4 mr-2" />
                                Order Hierarchy & Relationships
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {order.parentOrder && (
                                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3">
                                    <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                      Parent Order
                                    </h5>
                                    <div className="space-y-1">
                                      <div className="text-xs text-blue-800 dark:text-blue-200">
                                        <strong>Full ID:</strong>
                                        <div className="font-mono text-xs bg-blue-200 dark:bg-blue-800 p-1 rounded mt-1 break-all">
                                          {order.parentOrder}
                                        </div>
                                      </div>
                                      <div className="text-xs text-blue-800 dark:text-blue-200">
                                        <strong>Short ID:</strong> {order.parentOrder.slice(-8)}
                                      </div>
                                      <Link 
                                        href={`/admin-management/orders/${order.parentOrder}`}
                                        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                                      >
                                        <EyeIcon className="h-3 w-3 mr-1" />
                                        View Parent Order
                                      </Link>
                                    </div>
                                  </div>
                                )}
                                
                                {order.children && order.children.length > 0 && (
                                  <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3">
                                    <h5 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2 flex items-center">
                                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                      Sub-Orders ({order.children.length})
                                    </h5>
                                    <div className="space-y-2">
                                      <div className="text-xs text-green-800 dark:text-green-200">
                                        <strong>Sub-Order IDs:</strong>
                                      </div>
                                      <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {order.children.map((childId, index) => (
                                          <div key={childId} className="flex items-center justify-between bg-green-200 dark:bg-green-800 p-2 rounded">
                                            <div className="flex-1">
                                              <div className="font-mono text-xs text-green-900 dark:text-green-100 break-all">
                                                {childId}
                                              </div>
                                              <div className="text-xs text-green-700 dark:text-green-300">
                                                Short: {childId.slice(-8)}
                                              </div>
                                            </div>
                                            <Link 
                                              href={`/admin-management/orders/${childId}`}
                                              className="ml-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                                              title="View Sub-Order"
                                            >
                                              <EyeIcon className="h-3 w-3" />
                                            </Link>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Order Items */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                              Order Items ({order.items?.length || 0})
                            </h4>
                            <div className="space-y-4">
                              {order.items?.map((item, index) => (
                                <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700">
                                  {/* Item Header */}
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                      {item.product?.images && item.product.images.length > 0 ? (
                                        <img
                                          className="h-12 w-12 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                                          src={item.product.images.find(img => img.isPrimary)?.url || item.product.images[0]?.url}
                                          alt={item.product.name}
                                        />
                                      ) : (
                                        <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-500 flex items-center justify-center border border-gray-200 dark:border-gray-600">
                                          <span className="text-gray-400 dark:text-gray-600 text-xs">No Image</span>
                                        </div>
                                      )}
                                      <div>
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                          {item.product?.name || item.productSnapshot?.name || 'Product'}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          SKU: {item.product?.sku || item.productSnapshot?.sku || 'N/A'}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          Type: <span className="capitalize">{item.itemType || 'product'}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        ${(item.totalPrice || 0).toFixed(2)}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {item.quantity || 0} x ${(item.unitPrice || 0).toFixed(2)}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Detailed Information Grid */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                                    {/* Seller Information */}
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                      <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                                        <UserIcon className="h-3 w-3 mr-1" />
                                        Seller Details
                                      </h5>
                                      {item.seller ? (
                                        <div className="space-y-1">
                                          <div className="text-blue-800 dark:text-blue-200">
                                            <strong>Name:</strong> {item.seller.firstName || 'N/A'} {item.seller.lastName || 'N/A'}
                                          </div>
                                          {item.seller.companyName && (
                                            <div className="text-blue-800 dark:text-blue-200">
                                              <strong>Company:</strong> {item.seller.companyName}
                                            </div>
                                          )}
                                          <div className="text-blue-800 dark:text-blue-200">
                                            <strong>ID:</strong> {item.seller._id?.slice(-8) || 'N/A'}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-blue-800 dark:text-blue-200">No seller assigned</div>
                                      )}
                                    </div>

                                    {/* Buyer Information */}
                                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                      <h5 className="font-medium text-green-900 dark:text-green-100 mb-2 flex items-center">
                                        <UserIcon className="h-3 w-3 mr-1" />
                                        Buyer Details
                                      </h5>
                                      <div className="space-y-1">
                                        <div className="text-green-800 dark:text-green-200">
                                          <strong>Name:</strong> {order.buyer?.firstName || 'N/A'} {order.buyer?.lastName || 'N/A'}
                                        </div>
                                        <div className="text-green-800 dark:text-green-200">
                                          <strong>Email:</strong> {order.buyer?.email || 'N/A'}
                                        </div>
                                        {order.buyer?.companyName && (
                                          <div className="text-green-800 dark:text-green-200">
                                            <strong>Company:</strong> {order.buyer.companyName}
                                          </div>
                                        )}
                                        <div className="text-green-800 dark:text-green-200">
                                          <strong>ID:</strong> {order.buyer?._id?.slice(-8) || 'N/A'}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Shipping Information */}
                                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                                      <h5 className="font-medium text-purple-900 dark:text-purple-100 mb-2 flex items-center">
                                        <TruckIcon className="h-3 w-3 mr-1" />
                                        Shipping Details
                                      </h5>
                                      <div className="space-y-1">
                                        <div className="text-purple-800 dark:text-purple-200">
                                          <strong>Name:</strong> {order.shippingAddress?.firstName || 'N/A'} {order.shippingAddress?.lastName || 'N/A'}
                                        </div>
                                        <div className="text-purple-800 dark:text-purple-200">
                                          <strong>Address:</strong> {order.shippingAddress?.street || 'N/A'}
                                        </div>
                                        <div className="text-purple-800 dark:text-purple-200">
                                          <strong>City:</strong> {order.shippingAddress?.city || 'N/A'}, {order.shippingAddress?.state || 'N/A'}
                                        </div>
                                        <div className="text-purple-800 dark:text-purple-200">
                                          <strong>Phone:</strong> {order.shippingAddress?.phone || 'N/A'}
                                        </div>
                                        {order.trackingNumber && (
                                          <div className="text-purple-800 dark:text-purple-200">
                                            <strong>Tracking:</strong> {order.trackingNumber}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Order Status Information */}
                                    <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                                      <h5 className="font-medium text-orange-900 dark:text-orange-100 mb-2 flex items-center">
                                        <PackageIcon className="h-3 w-3 mr-1" />
                                        Order Status
                                      </h5>
                                      <div className="space-y-1">
                                        <div className="text-orange-800 dark:text-orange-200">
                                          <strong>Status:</strong> {getStatusBadge(order.status || 'pending', 'order')}
                                        </div>
                                        <div className="text-orange-800 dark:text-orange-200">
                                          <strong>Delivery:</strong> {getStatusBadge(order.delivery_status || 'pending', 'delivery')}
                                        </div>
                                        <div className="text-orange-800 dark:text-orange-200">
                                          <strong>Payment:</strong> {getStatusBadge(order.payment?.status || 'pending', 'payment')}
                                        </div>
                                        <div className="text-orange-800 dark:text-orange-200">
                                          <strong>Type:</strong> <span className="capitalize">{order.orderType || 'product'}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Order Hierarchy Information */}
                                    {(order.parentOrder || (order.children && order.children.length > 0)) && (
                                      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
                                        <h5 className="font-medium text-indigo-900 dark:text-indigo-100 mb-2 flex items-center">
                                          <PackageIcon className="h-3 w-3 mr-1" />
                                          Order Hierarchy
                                        </h5>
                                        <div className="space-y-2">
                                          {order.parentOrder && (
                                            <div className="text-indigo-800 dark:text-indigo-200">
                                              <strong>Parent Order ID:</strong>
                                              <div className="font-mono text-xs bg-indigo-200 dark:bg-indigo-800 p-1 rounded mt-1 break-all">
                                                {order.parentOrder}
                                              </div>
                                              <div className="text-xs mt-1">
                                                Short: {order.parentOrder.slice(-8)}
                                              </div>
                                            </div>
                                          )}
                                          {order.children && order.children.length > 0 && (
                                            <div className="text-indigo-800 dark:text-indigo-200">
                                              <strong>Sub-Order IDs ({order.children.length}):</strong>
                                              <div className="space-y-1 mt-1 max-h-20 overflow-y-auto">
                                                {order.children.map((childId) => (
                                                  <div key={childId} className="font-mono text-xs bg-indigo-200 dark:bg-indigo-800 p-1 rounded break-all">
                                                    {childId}
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Payment Information */}
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                                      <h5 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2 flex items-center">
                                        <CreditCardIcon className="h-3 w-3 mr-1" />
                                        Payment Details
                                      </h5>
                                      <div className="space-y-1">
                                        <div className="text-yellow-800 dark:text-yellow-200">
                                          <strong>Method:</strong> {order.payment?.method?.replace('_', ' ') || 'Not specified'}
                                        </div>
                                        <div className="text-yellow-800 dark:text-yellow-200">
                                          <strong>Status:</strong> {getStatusBadge(order.payment?.status || 'pending', 'payment')}
                                        </div>
                                        {order.payment?.transactionId && (
                                          <div className="text-yellow-800 dark:text-yellow-200">
                                            <strong>Txn ID:</strong> {order.payment.transactionId.slice(-8)}
                                          </div>
                                        )}
                                        {order.payment?.paidAt && (
                                          <div className="text-yellow-800 dark:text-yellow-200">
                                            <strong>Paid:</strong> {formatDate(order.payment.paidAt)}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Subscription Information (if applicable) */}
                                    {item.itemType === 'subscription' && item.subscriptionPlan && (
                                      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
                                        <h5 className="font-medium text-indigo-900 dark:text-indigo-100 mb-2 flex items-center">
                                          <StarIcon className="h-3 w-3 mr-1" />
                                          Subscription Details
                                        </h5>
                                        <div className="space-y-1">
                                          <div className="text-indigo-800 dark:text-indigo-200">
                                            <strong>Plan:</strong> {item.subscriptionPlan.name || 'N/A'}
                                          </div>
                                          <div className="text-indigo-800 dark:text-indigo-200">
                                            <strong>Billing:</strong> {item.subscriptionPlan.billingCycle || 'N/A'}
                                          </div>
                                          <div className="text-indigo-800 dark:text-indigo-200">
                                            <strong>Duration:</strong> {item.subscriptionPlan.duration || 'N/A'} months
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Order Summary */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                Order Summary
                              </h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500 dark:text-gray-400">Subtotal:</span>
                                  <span className="text-gray-900 dark:text-white">${order.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500 dark:text-gray-400">Tax:</span>
                                  <span className="text-gray-900 dark:text-white">${order.taxAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500 dark:text-gray-400">Shipping:</span>
                                  <span className="text-gray-900 dark:text-white">${order.shippingCost.toFixed(2)}</span>
                                </div>
                                {order.discount > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Discount:</span>
                                    <span className="text-green-600 dark:text-green-400">-${order.discount.toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between font-medium border-t pt-1">
                                  <span className="text-gray-900 dark:text-white">Total:</span>
                                  <span className="text-gray-900 dark:text-white">${order.totalAmount.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                Order Type
                              </h4>
                              <div className="text-sm">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  order.orderType === 'product' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                  order.orderType === 'subscription' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                  'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                }`}>
                                  {order.orderType.charAt(0).toUpperCase() + order.orderType.slice(1)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Shipping Address */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                              Shipping Address
                            </h4>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {order.shippingAddress?.firstName || 'N/A'} {order.shippingAddress?.lastName || 'N/A'}<br />
                              {order.shippingAddress?.street || 'N/A'}<br />
                              {order.shippingAddress?.city || 'N/A'}, {order.shippingAddress?.state || 'N/A'} {order.shippingAddress?.zipCode || 'N/A'}<br />
                              {order.shippingAddress?.country || 'N/A'}<br />
                              Phone: {order.shippingAddress?.phone || 'N/A'}
                            </div>
                          </div>

                          {/* Payment Information */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                              Payment Information
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Method:</span>
                                <span className="ml-2 text-gray-900 dark:text-white capitalize">
                                  {order.payment?.method?.replace('_', ' ') || 'Not specified'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                                <span className="ml-2 text-gray-900 dark:text-white capitalize">
                                  {order.payment?.status?.replace('_', ' ') || 'Not specified'}
                                </span>
                              </div>
                              {order.payment?.transactionId && (
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Transaction ID:</span>
                                  <span className="ml-2 text-gray-900 dark:text-white font-mono text-xs">
                                    {order.payment.transactionId}
                                  </span>
                                </div>
                              )}
                              {order.trackingNumber && (
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Tracking:</span>
                                  <span className="ml-2 text-gray-900 dark:text-white font-mono text-xs">
                                    {order.trackingNumber}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Subscription Details */}
                          {order.subscription && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                Subscription Details
                              </h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Plan:</span>
                                  <span className="ml-2 text-gray-900 dark:text-white">{order.subscription?.planName || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Billing:</span>
                                  <span className="ml-2 text-gray-900 dark:text-white">{order.subscription?.billingCycle || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Start Date:</span>
                                  <span className="ml-2 text-gray-900 dark:text-white">
                                    {order.subscription?.startDate ? formatDate(order.subscription.startDate) : 'N/A'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">End Date:</span>
                                  <span className="ml-2 text-gray-900 dark:text-white">
                                    {order.subscription?.endDate ? formatDate(order.subscription.endDate) : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Messages */}
                          {order.messages && order.messages.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                Messages ({order.messages.length})
                              </h4>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {order.messages.map((message, index) => (
                                  <div key={index} className="p-2 bg-gray-50 dark:bg-gray-600 rounded text-sm">
                                    <div className="flex justify-between items-start">
                                      <span className="font-medium text-gray-900 dark:text-white">
                                        {message.from.firstName} {message.from.lastName}
                                      </span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatDate(message.timestamp)}
                                      </span>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">{message.message}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Notes */}
                          {(order.customerNotes || order.adminNotes) && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                Notes
                              </h4>
                              {order.customerNotes && (
                                <div className="mb-2">
                                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Customer:</span>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{order.customerNotes}</p>
                                </div>
                              )}
                              {order.adminNotes && (
                                <div>
                                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Admin:</span>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{order.adminNotes}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
        </ResponsiveTable>
      </div>
    </div>
  );
};

