"use client";
import React, { useState, useEffect } from "react";
import { 
  DollarLineIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  ClockIcon
} from "@/icons";
import { useDashboardFilters } from "@/contexts/DashboardFilterContext";
import { formatDollar, formatNumber } from "@/utils/formatters";

interface RevenueBreakdown {
  byStatus: Array<{
    _id: string;
    count: number;
    totalRevenue: number;
    avgOrderValue: number;
  }>;
  totalRevenue: number;
  currentPeriodRevenue: number;
  previousPeriodRevenue: number;
  averageOrderValue: number;
}

interface DashboardData {
  revenueBreakdown: RevenueBreakdown;
}

export const RevenueInsights = () => {
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
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setDashboardData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
      case 'cancelled': return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      case 'completed': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircleIcon className="size-4" />;
      case 'pending': return <ClockIcon className="size-4" />;
      default: return <DollarLineIcon className="size-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Error loading revenue insights: {error}</p>
        </div>
      </div>
    );
  }

  if (!dashboardData?.revenueBreakdown) {
    return null;
  }

  const { revenueBreakdown } = dashboardData;
  const revenueGrowth = revenueBreakdown.previousPeriodRevenue > 0 
    ? ((revenueBreakdown.currentPeriodRevenue - revenueBreakdown.previousPeriodRevenue) / revenueBreakdown.previousPeriodRevenue) * 100
    : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <DollarLineIcon className="text-orange-600 dark:text-orange-400 size-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Revenue Insights
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filters.period === 'monthly' ? 'Monthly' : 'Yearly'} revenue breakdown
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatDollar(revenueBreakdown.totalRevenue)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Revenue
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Current Period Revenue */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Current {filters.period === 'monthly' ? 'Month' : 'Year'}
              </span>
              {revenueGrowth !== 0 && (
                <div className={`flex items-center space-x-1 ${
                  revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {revenueGrowth > 0 ? (
                    <ArrowUpIcon className="size-4" />
                  ) : (
                    <ArrowDownIcon className="size-4" />
                  )}
                  <span className="text-xs font-medium">
                    {Math.abs(revenueGrowth).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">
              {formatDollar(revenueBreakdown.currentPeriodRevenue)}
            </div>
          </div>

          {/* Average Order Value */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Average Order Value
            </div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">
              {formatDollar(revenueBreakdown.averageOrderValue)}
            </div>
          </div>

          {/* Previous Period Revenue */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Previous {filters.period === 'monthly' ? 'Month' : 'Year'}
            </div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">
              {formatDollar(revenueBreakdown.previousPeriodRevenue)}
            </div>
          </div>
        </div>

        {/* Revenue by Status */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Revenue by Order Status
          </h4>
          <div className="space-y-3">
            {revenueBreakdown.byStatus.map((status) => (
              <div key={status._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`p-1.5 rounded-full ${getStatusColor(status._id)}`}>
                    {getStatusIcon(status._id)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white capitalize">
                      {status._id}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatNumber(status.count)} orders
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {formatDollar(status.totalRevenue)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Avg: {formatDollar(status.avgOrderValue)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
