"use client";
import React, { useState, useEffect } from "react";
import { OrderManagementTable } from "@/components/orders/OrderManagementTable";
import { OrderStats } from "@/components/orders/OrderStats";
import { OrderFilters } from "@/components/orders/OrderFilters";
import UnifiedPagination from "@/components/common/UnifiedPagination";

export interface Order {
  _id: string;
  orderNumber: string;
  orderType: 'product' | 'subscription' | 'mixed';
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
      images: Array<{ url: string; isPrimary: boolean }>;
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
    variant?: string;
    productSnapshot?: {
      name: string;
      sku: string;
      image: string;
    };
    itemType: 'product' | 'subscription';
    subscriptionPlan?: {
      name: string;
      billingCycle: string;
      duration: number;
    };
  }>;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discount: number;
  totalAmount: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  billingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  payment: {
    method: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'cash_on_delivery' | 'manual' | 'subscription' | 'razorpay' | 'stripe' | 'upi';
    status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
    transactionId?: string;
    paidAt?: string;
    refundedAt?: string;
    refundAmount?: number;
  };
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'returned';
  trackingNumber?: string;
  carrier?: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  customerNotes?: string;
  adminNotes?: string;
  messages: Array<{
    _id: string;
    from: {
      _id: string;
      firstName: string;
      lastName: string;
    };
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

export interface OrderFilters {
  orderStatus?: string;
  paymentStatus?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
  minAmount?: number;
  maxAmount?: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [filters, setFilters] = useState<OrderFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const itemsPerPage = 20;
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    paidOrders: 0,
  });

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [currentPage, filters]);

  useEffect(() => {
    applyFilters();
  }, [orders, filters]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.orderStatus && { status: filters.orderStatus }),
        ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus }),
        ...(filters.dateRange?.start && { startDate: filters.dateRange.start }),
        ...(filters.dateRange?.end && { endDate: filters.dateRange.end }),
        ...(filters.minAmount !== undefined && { minAmount: filters.minAmount.toString() }),
        ...(filters.maxAmount !== undefined && { maxAmount: filters.maxAmount.toString() })
      });
      
      const response = await fetch(`/api/admin/orders?${params}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data.data?.orders || []);
        setTotalPages(data.data?.pagination?.totalPages || 1);
        setTotalOrders(data.data?.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/orders/stats', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data || {});
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...(orders || [])];

    if (filters.orderStatus) {
      filtered = filtered.filter(order => order.status === filters.orderStatus);
    }

    if (filters.paymentStatus) {
      filtered = filtered.filter(order => order.payment.status === filters.paymentStatus);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(searchTerm) ||
        `${order.buyer.firstName} ${order.buyer.lastName}`.toLowerCase().includes(searchTerm) ||
        order.buyer.email.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.dateRange?.start) {
      filtered = filtered.filter(order => 
        new Date(order.createdAt) >= new Date(filters.dateRange!.start)
      );
    }

    if (filters.dateRange?.end) {
      filtered = filtered.filter(order => 
        new Date(order.createdAt) <= new Date(filters.dateRange!.end)
      );
    }

    if (filters.minAmount !== undefined) {
      filtered = filtered.filter(order => order.totalAmount >= filters.minAmount!);
    }

    if (filters.maxAmount !== undefined) {
      filtered = filtered.filter(order => order.totalAmount <= filters.maxAmount!);
    }

    setFilteredOrders(filtered);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string, statusType: 'order' | 'payment') => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          [statusType === 'order' ? 'status' : 'payment']: statusType === 'order' ? newStatus : { status: newStatus }
        }),
      });

      if (response.ok) {
        // Update local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? { 
                  ...order, 
                  [statusType === 'order' ? 'status' : 'payment']: statusType === 'order' ? newStatus : { ...order.payment, status: newStatus },
                  updatedAt: new Date().toISOString()
                }
              : order
          )
        );
        
        // Refresh stats
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const handleFiltersChange = (newFilters: OrderFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Order Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and track all customer orders
          </p>
        </div>
      </div>

      {/* Order Statistics */}
      <OrderStats stats={stats} />

      {/* Filters */}
      <OrderFilters 
        filters={filters} 
        onFiltersChange={handleFiltersChange} 
      />

      {/* Orders Table */}
      <OrderManagementTable
        orders={filteredOrders}
        isLoading={isLoading}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* Pagination */}
      <UnifiedPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalOrders}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
