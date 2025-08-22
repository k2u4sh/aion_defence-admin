"use client";
import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import { formatDollar, formatDateTime } from "@/utils/formatters";
import { 
  DownloadIcon,
  SearchIcon,
  EyeIcon
} from "@/icons";

interface Payment {
  id: string;
  transactionId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  paymentMethod: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'crypto';
  status: 'completed' | 'pending' | 'failed' | 'refunded' | 'cancelled';
  gateway: string;
  transactionDate: string;
  fees: number;
  netAmount: number;
}

export const PaymentsOverview = () => {
  const [timeFilter, setTimeFilter] = useState<'monthly' | 'yearly'>('monthly');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - in real app, this would come from API
  const getPaymentsData = (): Payment[] => {
    const basePayments: Payment[] = [
      {
        id: '1',
        transactionId: 'TXN-20241201-001',
        orderNumber: 'ORD-20241201-0001',
        customerName: 'John Smith',
        customerEmail: 'john.smith@email.com',
        amount: 1299.99,
        paymentMethod: 'credit_card',
        status: 'completed',
        gateway: 'Stripe',
        transactionDate: '2024-12-01T10:30:00Z',
        fees: 39.00,
        netAmount: 1260.99
      },
      {
        id: '2',
        transactionId: 'TXN-20241201-002',
        orderNumber: 'ORD-20241201-0002',
        customerName: 'Sarah Johnson',
        customerEmail: 'sarah.j@email.com',
        amount: 879.00,
        paymentMethod: 'paypal',
        status: 'completed',
        gateway: 'PayPal',
        transactionDate: '2024-12-01T09:15:00Z',
        fees: 26.37,
        netAmount: 852.63
      },
      {
        id: '3',
        transactionId: 'TXN-20241201-003',
        orderNumber: 'ORD-20241201-0003',
        customerName: 'Mike Wilson',
        customerEmail: 'mike.w@email.com',
        amount: 1869.00,
        paymentMethod: 'credit_card',
        status: 'pending',
        gateway: 'Stripe',
        transactionDate: '2024-12-01T08:45:00Z',
        fees: 56.07,
        netAmount: 1812.93
      },
      {
        id: '4',
        transactionId: 'TXN-20241130-001',
        orderNumber: 'ORD-20241130-0001',
        customerName: 'Emily Davis',
        customerEmail: 'emily.d@email.com',
        amount: 1699.00,
        paymentMethod: 'debit_card',
        status: 'failed',
        gateway: 'Stripe',
        transactionDate: '2024-11-30T16:20:00Z',
        fees: 0,
        netAmount: 0
      },
      {
        id: '5',
        transactionId: 'TXN-20241130-002',
        orderNumber: 'ORD-20241130-0002',
        customerName: 'David Brown',
        customerEmail: 'david.b@email.com',
        amount: 240.00,
        paymentMethod: 'bank_transfer',
        status: 'refunded',
        gateway: 'Bank Transfer',
        transactionDate: '2024-11-30T14:10:00Z',
        fees: 5.00,
        netAmount: 235.00
      }
    ];

    if (timeFilter === 'yearly') {
      // Add more historical data for yearly view
      return [
        ...basePayments,
        {
          id: '6',
          transactionId: 'TXN-20241115-001',
          orderNumber: 'ORD-20241115-0001',
          customerName: 'Lisa Anderson',
          customerEmail: 'lisa.a@email.com',
          amount: 899.00,
          paymentMethod: 'credit_card',
          status: 'completed',
          gateway: 'Stripe',
          transactionDate: '2024-11-15T11:30:00Z',
          fees: 26.97,
          netAmount: 872.03
        },
        {
          id: '7',
          transactionId: 'TXN-20241020-001',
          orderNumber: 'ORD-20241020-0001',
          customerName: 'Robert Taylor',
          customerEmail: 'robert.t@email.com',
          amount: 1599.00,
          paymentMethod: 'crypto',
          status: 'completed',
          gateway: 'Coinbase',
          transactionDate: '2024-10-20T13:45:00Z',
          fees: 15.99,
          netAmount: 1583.01
        }
      ];
    }

    return basePayments;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'refunded': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'credit_card': return 'blue';
      case 'debit_card': return 'green';
      case 'paypal': return 'blue';
      case 'bank_transfer': return 'purple';
      case 'crypto': return 'orange';
      default: return 'gray';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card':
      case 'debit_card':
        return '💳';
      case 'paypal':
        return '🔵';
      case 'bank_transfer':
        return '🏦';
      case 'crypto':
        return '₿';
      default:
        return '💰';
    }
  };

  const filteredPayments = getPaymentsData().filter(payment => {
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || payment.paymentMethod === methodFilter;
    const matchesSearch = payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesMethod && matchesSearch;
  });

  const totalPayments = filteredPayments.length;
  const completedPayments = filteredPayments.filter(p => p.status === 'completed').length;
  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalFees = filteredPayments.reduce((sum, payment) => sum + payment.fees, 0);
  const totalNetAmount = filteredPayments.reduce((sum, payment) => sum + payment.netAmount, 0);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Payments Overview
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {totalPayments} transactions • {completedPayments} completed • {formatDollar(totalAmount)} total • {formatDollar(totalNetAmount)} net
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

            {/* Export Button */}
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
              <DownloadIcon className="size-4" />
              Export
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
              placeholder="Search payments by customer, transaction ID, or order number..."
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
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="all">All Methods</option>
            <option value="credit_card">Credit Card</option>
            <option value="debit_card">Debit Card</option>
            <option value="paypal">PayPal</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="crypto">Crypto</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Transaction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Payment Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Gateway
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-white/[0.03] divide-y divide-gray-200 dark:divide-gray-800">
            {filteredPayments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                      {payment.transactionId}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {payment.orderNumber}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(payment.transactionDate).toLocaleDateString()}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {payment.customerName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {payment.customerEmail}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDollar(payment.amount)}
                    </div>
                    {payment.fees > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Fees: ${payment.fees.toFixed(2)}
                      </div>
                    )}
                    {payment.status === 'completed' && (
                      <div className="text-xs text-green-600 dark:text-green-400">
                        Net: ${payment.netAmount.toFixed(2)}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getMethodIcon(payment.paymentMethod)}</span>
                    <Badge color={getMethodColor(payment.paymentMethod) as any}>
                      {payment.paymentMethod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge color={getStatusColor(payment.status)}>
                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {payment.gateway}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    <EyeIcon className="size-4" />
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
          <span>Showing {filteredPayments.length} payments</span>
          <div className="flex items-center gap-4">
            <span>Total Fees: ${totalFees.toFixed(2)}</span>
            <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
              View All Payments
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

