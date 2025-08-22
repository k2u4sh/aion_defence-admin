"use client";
import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import { formatDollar, formatDate } from "@/utils/formatters";
import { 
  SearchIcon,
  EyeIcon
} from "@/icons";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderDate: string;
  items: number;
}

export const OrdersOverview = () => {
  const [timeFilter, setTimeFilter] = useState<'monthly' | 'yearly'>('monthly');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - in real app, this would come from API
  const getOrdersData = (): Order[] => {
    const baseOrders: Order[] = [
      {
        id: '1',
        orderNumber: 'ORD-20241201-0001',
        customerName: 'John Smith',
        customerEmail: 'john.smith@email.com',
        totalAmount: 1299.99,
        orderStatus: 'delivered',
        paymentStatus: 'paid',
        orderDate: '2024-12-01',
        items: 3
      },
      {
        id: '2',
        orderNumber: 'ORD-20241201-0002',
        customerName: 'Sarah Johnson',
        customerEmail: 'sarah.j@email.com',
        totalAmount: 879.00,
        orderStatus: 'processing',
        paymentStatus: 'paid',
        orderDate: '2024-12-01',
        items: 1
      },
      {
        id: '3',
        orderNumber: 'ORD-20241201-0003',
        customerName: 'Mike Wilson',
        customerEmail: 'mike.w@email.com',
        totalAmount: 1869.00,
        orderStatus: 'shipped',
        paymentStatus: 'paid',
        orderDate: '2024-12-01',
        items: 2
      },
      {
        id: '4',
        orderNumber: 'ORD-20241130-0001',
        customerName: 'Emily Davis',
        customerEmail: 'emily.d@email.com',
        totalAmount: 1699.00,
        orderStatus: 'pending',
        paymentStatus: 'pending',
        orderDate: '2024-11-30',
        items: 1
      },
      {
        id: '5',
        orderNumber: 'ORD-20241130-0002',
        customerName: 'David Brown',
        customerEmail: 'david.b@email.com',
        totalAmount: 240.00,
        orderStatus: 'cancelled',
        paymentStatus: 'refunded',
        orderDate: '2024-11-30',
        items: 1
      }
    ];

    if (timeFilter === 'yearly') {
      // Add more historical data for yearly view
      return [
        ...baseOrders,
        {
          id: '6',
          orderNumber: 'ORD-20241115-0001',
          customerName: 'Lisa Anderson',
          customerEmail: 'lisa.a@email.com',
          totalAmount: 899.00,
          orderStatus: 'delivered',
          paymentStatus: 'paid',
          orderDate: '2024-11-15',
          items: 2
        },
        {
          id: '7',
          orderNumber: 'ORD-20241020-0001',
          customerName: 'Robert Taylor',
          customerEmail: 'robert.t@email.com',
          totalAmount: 1599.00,
          orderStatus: 'delivered',
          paymentStatus: 'paid',
          orderDate: '2024-10-20',
          items: 1
        }
      ];
    }

    return baseOrders;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'success';
      case 'shipped': return 'info';
      case 'processing': return 'warning';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'refunded': return 'info';
      default: return 'default';
    }
  };

  const filteredOrders = getOrdersData().filter(order => {
    const matchesStatus = statusFilter === 'all' || order.orderStatus === statusFilter;
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalOrders = filteredOrders.length;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Orders Overview
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {totalOrders} orders • {formatDollar(totalRevenue)}
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

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-5" />
          <input
            type="text"
            placeholder="Search orders by customer name or order number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Order Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Order Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-white/[0.03] divide-y divide-gray-200 dark:divide-gray-800">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.orderNumber}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {order.items} item{order.items !== 1 ? 's' : ''}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.customerName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {order.customerEmail}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDollar(order.totalAmount)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge color={getStatusColor(order.orderStatus)}>
                    {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <Badge color={getPaymentStatusColor(order.paymentStatus)}>
                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    <EyeIcon className="size-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Showing {filteredOrders.length} orders</span>
          <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
            View All Orders
          </button>
        </div>
      </div>
    </div>
  );
};

