"use client";
import React, { useState, useEffect } from "react";
import Badge from "../ui/badge/Badge";
import { formatDollar, formatDate } from "@/utils/formatters";
import { 
  SearchIcon,
  EyeIcon,
  BoltIcon,
  UserIcon,
  CalenderIcon,
  DollarLineIcon
} from "@/icons";
import Link from "next/link";

interface Bid {
  _id: string;
  bidName?: string;
  description?: string;
  budget?: number;
  status: 'open' | 'closed' | 'awarded' | 'cancelled';
  category?: {
    _id: string;
    name: string;
  };
  buyer?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    companyName?: string;
  };
  createdAt: string;
  updatedAt: string;
  sellerResponses?: Array<{
    _id: string;
    seller: {
      _id: string;
      firstName: string;
      lastName: string;
      companyName?: string;
    };
    status: 'pending' | 'accepted' | 'rejected';
    quotedPrice?: number;
    estimatedDelivery?: string;
    respondedAt: string;
  }>;
  sellerResponse?: {
    _id: string;
    seller: {
      _id: string;
      firstName: string;
      lastName: string;
      companyName?: string;
    };
    status: 'pending' | 'accepted' | 'rejected';
    quotedPrice?: number;
    estimatedDelivery?: string;
    respondedAt: string;
  };
}

interface DashboardData {
  recent: {
    bids: Bid[];
  };
  statusBreakdown: {
    bids: Array<{ _id: string; count: number }>;
  };
}

export const BidsOverview = () => {
  const [timeFilter, setTimeFilter] = useState<'monthly' | 'yearly'>('monthly');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setDashboardData(result.data);
      } else {
        setError(result.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'success';
      case 'closed': return 'info';
      case 'awarded': return 'success';
      case 'cancelled': return 'error';
      default: return 'primary';
    }
  };

  const getStatusBreakdown = () => {
    if (!dashboardData?.statusBreakdown.bids) return {};
    const breakdown: Record<string, number> = {};
    dashboardData.statusBreakdown.bids.forEach(item => {
      breakdown[item._id] = item.count;
    });
    return breakdown;
  };

  const filteredBids = dashboardData?.recent.bids.filter(bid => {
    const matchesStatus = statusFilter === 'all' || bid.status === statusFilter;
    const matchesSearch = (bid.bidName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (bid.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (bid.buyer?.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (bid.buyer?.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (bid.buyer?.companyName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  }) || [];

  const totalBids = filteredBids.length;
  const totalBudget = filteredBids.reduce((sum, bid) => sum + (bid.budget || 0), 0);
  const statusBreakdown = getStatusBreakdown();

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button 
          onClick={fetchDashboardData}
          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Bids Overview
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {totalBids} bids • {formatDollar(totalBudget)} total budget
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
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="awarded">Awarded</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-5" />
          <input
            type="text"
            placeholder="Search bids by name, description, or buyer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          />
        </div>
      </div>

      {/* Bids Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Bid Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Buyer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Budget
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Responses
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
            {filteredBids.map((bid) => {
              const responseCount = bid.sellerResponses?.length || (bid.sellerResponse ? 1 : 0);
              const acceptedResponses = bid.sellerResponses?.filter(r => r.status === 'accepted').length || 
                                       (bid.sellerResponse?.status === 'accepted' ? 1 : 0);
              
              return (
                <tr key={bid._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {bid.bidName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {bid.description}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(bid.createdAt)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {bid.buyer?.firstName} {bid.buyer?.lastName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {bid.buyer?.email}
                      </div>
                      {bid.buyer?.companyName && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {bid.buyer.companyName}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {bid.category?.name || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDollar(bid.budget)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {responseCount} responses
                      </div>
                      {responseCount > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {acceptedResponses} accepted
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge color={getStatusColor(bid.status)}>
                      {bid.status?.charAt(0).toUpperCase() + bid.status?.slice(1) || 'Unknown'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/admin-management/bids/${bid._id}`}>
                      <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                        <EyeIcon className="size-5" />
                      </button>
                    </Link>
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
          <span>Showing {filteredBids.length} bids</span>
          <Link href="/admin-management/bids">
            <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
              View All Bids
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};
