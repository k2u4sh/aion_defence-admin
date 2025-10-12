"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeftIcon, EditIcon, TrashIcon, CheckCircleIcon, AlertTriangleIcon, ClockIcon, UserIcon, DollarIcon, PackageIcon, StarIcon, TagIcon, BoxIcon, TruckIcon, CreditCardIcon, EyeIcon } from "@/icons";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import { useModal } from "@/hooks/useModal";

interface Order {
  _id: string;
  orderNumber: string;
  orderType: 'product' | 'subscription' | 'mixed';
  status: 'pending' | 'ordered' | 'dispatched' | 'shipped' | 'delivered' | 'complete' | 'expired' | 'cancelled';
  delivery_status: 'pending' | 'processing' | 'shipped' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed_delivery' | 'returned_to_sender';
  buyer: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    companyName?: string;
  };
  items: Array<{
    _id: string;
    product?: {
      _id: string;
      name: string;
      sku: string;
      images?: Array<{ url: string; alt: string }>;
    };
    seller?: {
      _id: string;
      firstName: string;
      lastName: string;
      companyName?: string;
    };
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    itemType: 'product' | 'subscription';
    subscriptionPlan?: {
      name: string;
      billingCycle: string;
      duration: number;
    };
    productSnapshot?: {
      name: string;
      sku: string;
      image: string;
    };
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    phone: string;
  };
  billingAddress?: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    phone: string;
  };
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discount: number;
  totalAmount: number;
  payment: {
    method: string;
    status: 'pending' | 'paid' | 'failed' | 'refund' | 'partial_refund' | 'rejected';
    transactionId?: string;
    paidAt?: string;
    refundedAt?: string;
    refundAmount?: number;
  };
  parentOrder?: string;
  children?: string[];
  trackingNumber?: string;
  carrier?: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  delivery_status_updated_at: string;
  processing_at?: string;
  shipped_at?: string;
  in_transit_at?: string;
  out_for_delivery_at?: string;
  delivered_at?: string;
  failed_delivery_at?: string;
  returned_to_sender_at?: string;
  customerNotes?: string;
  adminNotes?: string;
  messages: Array<{
    from: string;
    message: string;
    timestamp: string;
    isFromBuyer: boolean;
    isFromSeller: boolean;
    isFromAdmin: boolean;
  }>;
  subscription?: {
    planName: string;
    billingCycle: string;
    startDate: string;
    endDate: string;
    autoRenew: boolean;
    subscriptionId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const OrderDetailPage = () => {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/orders/${orderId}`);
      const data = await response.json();

      if (data.success) {
        setOrder(data.data);
      } else {
        setError(data.message || "Failed to fetch order");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      setError("Failed to fetch order");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;

    try {
      const response = await fetch(`/api/admin/orders/${orderToDelete}`, {
        method: "DELETE"
      });

      const data = await response.json();
      if (data.success) {
        // Redirect back to orders list (client-only)
        if (typeof window !== 'undefined') {
          window.location.href = "/admin-management/orders";
        }
      }
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };

  const handleOpenDeleteModal = () => {
    setOrderToDelete(orderId);
    openDeleteModal();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "warning" as const, label: "Pending" },
      ordered: { color: "info" as const, label: "Ordered" },
      dispatched: { color: "info" as const, label: "Dispatched" },
      shipped: { color: "success" as const, label: "Shipped" },
      delivered: { color: "success" as const, label: "Delivered" },
      complete: { color: "success" as const, label: "Complete" },
      expired: { color: "light" as const, label: "Expired" },
      cancelled: { color: "error" as const, label: "Cancelled" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge color={config.color}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "warning" as const, label: "Pending" },
      paid: { color: "success" as const, label: "Paid" },
      failed: { color: "error" as const, label: "Failed" },
      refund: { color: "light" as const, label: "Refunded" },
      partial_refund: { color: "warning" as const, label: "Partially Refunded" },
      rejected: { color: "error" as const, label: "Rejected" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge color={config.color}>{config.label}</Badge>;
  };

  const getDeliveryStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "warning" as const, label: "Pending" },
      processing: { color: "info" as const, label: "Processing" },
      shipped: { color: "info" as const, label: "Shipped" },
      in_transit: { color: "info" as const, label: "In Transit" },
      out_for_delivery: { color: "success" as const, label: "Out for Delivery" },
      delivered: { color: "success" as const, label: "Delivered" },
      failed_delivery: { color: "error" as const, label: "Failed Delivery" },
      returned_to_sender: { color: "error" as const, label: "Returned to Sender" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge color={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return '—';
    }
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return '—';
      }
      
      // Return a more user-friendly date format
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      }).format(date);
    } catch (error) {
      console.warn('Invalid date string:', dateString);
      return '—';
    }
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Order Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error || "The order you're looking for doesn't exist."}</p>
          <Link href="/admin-management/orders">
            <Button variant="outline">
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Back to Orders
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
          <Link href="/admin-management/orders">
            <Button variant="outline" size="sm">
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order #{order.orderNumber}</h1>
            <p className="text-gray-600 dark:text-gray-400">Order ID: {order._id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Edit functionality not implemented yet */}
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

      {/* Parent Order Information */}
      {order.parentOrder && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <PackageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Parent Order</h3>
          </div>
          <p className="text-blue-800 dark:text-blue-200">
            This is a sub-order of parent order: <span className="font-mono font-semibold">{order.parentOrder}</span>
          </p>
          <Link 
            href={`/admin-management/orders/${order.parentOrder}`}
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mt-2"
          >
            <EyeIcon className="h-4 w-4" />
            View Parent Order
          </Link>
        </div>
      )}

      {/* Child Orders Information */}
      {order.children && order.children.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <PackageIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">Sub Orders</h3>
            <Badge color="success">{order.children.length}</Badge>
          </div>
          <p className="text-green-800 dark:text-green-200 mb-3">
            This order has been split into {order.children.length} sub-order(s) for different sellers.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {order.children.map((childOrderId) => (
              <div key={childOrderId} className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Order #{childOrderId.slice(-8)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{childOrderId}</p>
                  </div>
                  <Link 
                    href={`/admin-management/orders/${childOrderId}`}
                    className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item._id} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  {item.product?.images && item.product.images.length > 0 ? (
                    <img
                      src={item.product.images[0].url}
                      alt={item.product.images[0].alt || item.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : item.productSnapshot?.image ? (
                    <img
                      src={item.productSnapshot.image}
                      alt={item.productSnapshot.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <PackageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {item.product?.name || item.productSnapshot?.name || 'Product'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      SKU: {item.product?.sku || item.productSnapshot?.sku || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Quantity: {item.quantity}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Type: {item.itemType === 'subscription' ? 'Subscription' : 'Product'}
                    </p>
                    {item.seller && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Seller: {item.seller.firstName} {item.seller.lastName}
                        {item.seller.companyName && ` (${item.seller.companyName})`}
                      </p>
                    )}
                    {item.subscriptionPlan && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Plan: {item.subscriptionPlan.name} ({item.subscriptionPlan.billingCycle})
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(item.unitPrice)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total: {formatCurrency(item.totalPrice)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Shipping Address</h2>
            <div className="space-y-2">
              <p className="text-gray-900 dark:text-white">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
              </p>
              <p className="text-gray-600 dark:text-gray-400">{order.shippingAddress.street}</p>
              <p className="text-gray-600 dark:text-gray-400">
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
              </p>
              <p className="text-gray-600 dark:text-gray-400">{order.shippingAddress.country}</p>
              {order.shippingAddress.phone && (
                <p className="text-gray-600 dark:text-gray-400">Phone: {order.shippingAddress.phone}</p>
              )}
            </div>
          </div>

          {/* Billing Address */}
          {order.billingAddress && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Billing Address</h2>
              <div className="space-y-2">
                <p className="text-gray-900 dark:text-white">
                  {order.billingAddress.firstName} {order.billingAddress.lastName}
                </p>
                <p className="text-gray-600 dark:text-gray-400">{order.billingAddress.street}</p>
                <p className="text-gray-600 dark:text-gray-400">
                  {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.zipCode}
                </p>
                <p className="text-gray-600 dark:text-gray-400">{order.billingAddress.country}</p>
                {order.billingAddress.phone && (
                  <p className="text-gray-600 dark:text-gray-400">Phone: {order.billingAddress.phone}</p>
                )}
              </div>
            </div>
          )}

          {/* Order Notes */}
          {(order.customerNotes || order.adminNotes) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Notes</h2>
              {order.customerNotes && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Customer Notes</h3>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{order.customerNotes}</p>
                </div>
              )}
              {order.adminNotes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Admin Notes</h3>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{order.adminNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Status</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Order Status</label>
                <div className="mt-1">
                  {getStatusBadge(order.status)}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Status</label>
                <div className="mt-1">
                  {getPaymentStatusBadge(order.payment.status)}
                </div>
              </div>

              {order.trackingNumber && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Tracking Number</label>
                  <p className="mt-1 text-gray-900 dark:text-white font-mono">{order.trackingNumber}</p>
                </div>
              )}

              {order.deliveredAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Delivered At</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{formatDate(order.deliveredAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Customer</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {order.buyer.firstName} {order.buyer.lastName}
                </p>
              </div>
              
              {order.buyer.companyName && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Company</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{order.buyer.companyName}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                <p className="mt-1 text-gray-900 dark:text-white">{order.buyer.email}</p>
              </div>
              
              {order.buyer.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{order.buyer.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Method</label>
                <p className="mt-1 text-gray-900 dark:text-white">{order.payment.method}</p>
              </div>
              
            </div>
          </div>

          {/* Order Status & Type */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Status & Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Order Type</label>
                <div className="mt-1">
                  <Badge color={order.orderType === 'subscription' ? 'info' : order.orderType === 'mixed' ? 'warning' : 'success'}>
                    {order.orderType === 'subscription' ? 'Subscription' : order.orderType === 'mixed' ? 'Mixed' : 'Product'}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Order Status</label>
                <div className="mt-1">{getStatusBadge(order.status)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Delivery Status</label>
                <div className="mt-1">{getDeliveryStatusBadge(order.delivery_status)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Status</label>
                <div className="mt-1">{getPaymentStatusBadge(order.payment.status)}</div>
              </div>
            </div>
            
            {/* Tracking Information */}
            {order.trackingNumber && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Tracking Number</label>
                    <p className="mt-1 text-gray-900 dark:text-white font-mono">{order.trackingNumber}</p>
                  </div>
                  {order.carrier && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Carrier</label>
                      <p className="mt-1 text-gray-900 dark:text-white">{order.carrier}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Subscription Information */}
            {order.subscription && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">Subscription Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Plan Name</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{order.subscription.planName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Billing Cycle</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{order.subscription.billingCycle}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Date</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{formatDate(order.subscription?.startDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">End Date</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{formatDate(order.subscription?.endDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Auto Renew</label>
                    <div className="mt-1">
                      <Badge color={order.subscription.autoRenew ? 'success' : 'warning'}>
                        {order.subscription.autoRenew ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="text-gray-900 dark:text-white">{formatCurrency(order.subtotal)}</span>
              </div>
              
              {order.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tax</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(order.taxAmount)}</span>
                </div>
              )}
              
              {order.shippingCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(order.shippingCost)}</span>
                </div>
              )}
              
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Discount</span>
                  <span className="text-gray-900 dark:text-white">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              
              <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-3">
                <span className="font-medium text-gray-900 dark:text-white">Total</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Timestamps</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Order Date</label>
                <p className="mt-1 text-gray-900 dark:text-white">{formatDate(order.createdAt)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
                <p className="mt-1 text-gray-900 dark:text-white">{formatDate(order.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteOrder}
        title="Delete Order"
        message="Are you sure you want to delete this order? This action cannot be undone."
      />
    </div>
  );
};

export default OrderDetailPage;
