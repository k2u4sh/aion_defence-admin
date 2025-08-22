"use client";
import React, { useState, useEffect } from "react";
import { OrderManagementTable } from "@/components/orders/OrderManagementTable";
import { OrderStats } from "@/components/orders/OrderStats";
import { OrderFilters } from "@/components/orders/OrderFilters";

export interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderDate: string;
  totalAmount: number;
  orderStatus: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentMethod: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  notes?: string;
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
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, filters]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/orders', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data.data || []);
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
    let filtered = [...orders];

    if (filters.orderStatus) {
      filtered = filtered.filter(order => order.orderStatus === filters.orderStatus);
    }

    if (filters.paymentStatus) {
      filtered = filtered.filter(order => order.paymentStatus === filters.paymentStatus);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(searchTerm) ||
        order.customerName.toLowerCase().includes(searchTerm) ||
        order.customerEmail.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.dateRange?.start) {
      filtered = filtered.filter(order => 
        new Date(order.orderDate) >= new Date(filters.dateRange!.start)
      );
    }

    if (filters.dateRange?.end) {
      filtered = filtered.filter(order => 
        new Date(order.orderDate) <= new Date(filters.dateRange!.end)
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
          [statusType === 'order' ? 'orderStatus' : 'paymentStatus']: newStatus
        }),
      });

      if (response.ok) {
        // Update local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? { 
                  ...order, 
                  [statusType === 'order' ? 'orderStatus' : 'paymentStatus']: newStatus,
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
    </div>
  );
}
