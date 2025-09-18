"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Order } from "@/app/(admin)/admin-management/orders/page";
import { formatDate } from "@/utils/formatters";
import { EyeIcon } from "@/icons";
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

  const getStatusBadge = (status: string, type: 'order' | 'payment') => {
    const statusColors = {
      order: {
        pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        processing: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
        shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
        delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      },
      payment: {
        pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        refunded: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
        partially_refunded: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
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
        { value: "confirmed", label: "Confirmed" },
        { value: "processing", label: "Processing" },
        { value: "shipped", label: "Shipped" },
        { value: "delivered", label: "Delivered" },
        { value: "cancelled", label: "Cancelled" },
        { value: "refunded", label: "Refunded" },
        { value: "returned", label: "Returned" },
      ];
    } else {
      return [
        { value: "pending", label: "Pending" },
        { value: "completed", label: "Completed" },
        { value: "failed", label: "Failed" },
        { value: "refunded", label: "Refunded" },
        { value: "partially_refunded", label: "Partially Refunded" },
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
      <div className="px-4 py-5 sm:p-6">
        <ResponsiveTable>
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Order Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Order Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {orders.map((order) => (
                <React.Fragment key={order._id}>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
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
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {order.orderNumber}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(order.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {order.buyer.firstName} {order.buyer.lastName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {order.buyer.email}
                        </div>
                        {order.buyer.companyName && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {order.buyer.companyName}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        ${order.totalAmount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.payment.status}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
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
                      <td colSpan={6} className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
                        <div className="space-y-4">
                          {/* Order Items */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                              Order Items ({order.items.length})
                            </h4>
                            <div className="space-y-3">
                              {order.items.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                                  <div className="flex items-center space-x-3">
                                    {item.product?.images && item.product.images.length > 0 ? (
                                      <img
                                        className="h-10 w-10 rounded-lg object-cover"
                                        src={item.product.images.find(img => img.isPrimary)?.url || item.product.images[0]?.url}
                                        alt={item.product.name}
                                      />
                                    ) : (
                                      <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-500 flex items-center justify-center">
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
                                      {item.seller && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          Seller: {item.seller.firstName} {item.seller.lastName}
                                        </div>
                                      )}
                                      {item.itemType === 'subscription' && item.subscriptionPlan && (
                                        <div className="text-xs text-blue-600 dark:text-blue-400">
                                          Subscription: {item.subscriptionPlan.name}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      ${item.totalPrice.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {item.quantity} x ${item.unitPrice.toFixed(2)}
                                    </div>
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
                              {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
                              {order.shippingAddress.street}<br />
                              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                              {order.shippingAddress.country}<br />
                              Phone: {order.shippingAddress.phone}
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
                                  {order.payment.method.replace('_', ' ')}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                                <span className="ml-2 text-gray-900 dark:text-white capitalize">
                                  {order.payment.status.replace('_', ' ')}
                                </span>
                              </div>
                              {order.payment.transactionId && (
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
                                  <span className="ml-2 text-gray-900 dark:text-white">{order.subscription.planName}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Billing:</span>
                                  <span className="ml-2 text-gray-900 dark:text-white">{order.subscription.billingCycle}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Start Date:</span>
                                  <span className="ml-2 text-gray-900 dark:text-white">
                                    {formatDate(order.subscription.startDate)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">End Date:</span>
                                  <span className="ml-2 text-gray-900 dark:text-white">
                                    {formatDate(order.subscription.endDate)}
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

