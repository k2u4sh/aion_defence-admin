"use client";
import React, { useState, useEffect } from "react";
import Badge from "../ui/badge/Badge";
import { 
  ArrowDownIcon, 
  ArrowUpIcon, 
  BoxIconLine, 
  DollarLineIcon,
  UserIcon,
  CheckCircleIcon,
  BoltIcon,
  MessageIcon
} from "@/icons";
import { useDashboardFilters } from "@/contexts/DashboardFilterContext";
import { formatNumber, formatDollar } from "@/utils/formatters";
// Removed Admin Role Distribution pie chart per request

interface MetricData {
  label: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: React.ReactNode;
  color: string;
}

interface DashboardData {
  overview: {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalBids: number;
    totalEnquiries: number;
    totalRevenue: number;
  };
  current: {
    users: { count: number; growth: number };
    products: { count: number; growth: number };
    orders: { count: number; growth: number };
    bids: { count: number; growth: number };
    enquiries: { count: number; growth: number };
    revenue: { amount: number; growth: number };
  };
  admin?: {
    roleDistribution?: Record<string, number>;
  };
}

export const DashboardMetrics = () => {
  const { filters } = useDashboardFilters();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        period: filters.period,
        year: filters.year.toString(),
        month: filters.month.toString()
      });
      
      const response = await fetch(`/api/admin/dashboard?${params}`, {
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

  const getMetricsData = (): MetricData[] => {
    if (!dashboardData) return [];

    const data = dashboardData.current;
    const overview = dashboardData.overview;

    return [
      {
        label: 'Total Orders',
        value: formatNumber(overview.totalOrders),
        change: data.orders.growth,
        changeType: data.orders.growth >= 0 ? 'increase' : 'decrease',
        icon: <BoxIconLine className="text-blue-600 size-6" />,
        color: 'blue'
      },
      {
        label: 'Active Products',
        value: formatNumber(overview.totalProducts),
        change: data.products.growth,
        changeType: data.products.growth >= 0 ? 'increase' : 'decrease',
        icon: <CheckCircleIcon className="text-green-600 size-6" />,
        color: 'green'
      },
      {
        label: 'Onboard Users',
        value: formatNumber(overview.totalUsers),
        change: data.users.growth,
        changeType: data.users.growth >= 0 ? 'increase' : 'decrease',
        icon: <UserIcon className="text-purple-600 size-6" />,
        color: 'purple'
      },
      {
        label: 'Total Revenue',
        value: formatDollar(overview.totalRevenue),
        change: data.revenue.growth,
        changeType: data.revenue.growth >= 0 ? 'increase' : 'decrease',
        icon: <DollarLineIcon className="text-orange-600 size-6" />,
        color: 'orange'
      },
      {
        label: 'Active Bids',
        value: formatNumber(overview.totalBids),
        change: data.bids.growth,
        changeType: data.bids.growth >= 0 ? 'increase' : 'decrease',
        icon: <BoltIcon className="text-yellow-600 size-6" />,
        color: 'yellow'
      },
      {
        label: 'Enquiries',
        value: formatNumber(overview.totalEnquiries),
        change: data.enquiries.growth,
        changeType: data.enquiries.growth >= 0 ? 'increase' : 'decrease',
        icon: <MessageIcon className="text-indigo-600 size-6" />,
        color: 'indigo'
      }
    ];
  };

  const metrics = getMetricsData();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Dashboard Overview
          </h2>
          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <div className="px-3 py-1.5 text-sm font-medium rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm">
              {filters.period === 'monthly' ? 'Monthly' : 'Yearly'}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 md:gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-5">
              <div className="animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                  <div className="w-12 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

      
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Dashboard Overview
          </h2>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Dashboard Overview
        </h2>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 md:gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-5 dashboard-metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className={`flex items-center justify-center w-10 h-10 bg-${metric.color}-100 dark:bg-${metric.color}-900/20 rounded-xl`}>
                {metric.icon}
              </div>
              <Badge 
                color={metric.changeType === 'increase' ? 'success' : 'error'}
                size="sm"
              >
                {metric.changeType === 'increase' ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
                {Math.abs(metric.change)}%
              </Badge>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block">
                {metric.label}
              </span>
              <h4 className="text-lg font-bold text-gray-800 dark:text-white/90 leading-tight">
                {metric.value}
              </h4>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

