"use client";
import React, { useState, useEffect } from "react";
import Badge from "../ui/badge/Badge";
import { formatNumber, formatDollar } from "@/utils/formatters";
import { 
  ArrowUpIcon,
  ArrowDownIcon,
  BoxIconLine,
  DollarLineIcon,
  UserIcon,
  CheckCircleIcon,
  BoltIcon,
  MessageIcon,
  CalenderIcon
} from "@/icons";
import { useDashboardFilters } from "@/contexts/DashboardFilterContext";

interface ForecastData {
  nextMonth: {
    orders: number;
    revenue: number;
    users: number;
    products: number;
  };
  nextQuarter: {
    orders: number;
    revenue: number;
    users: number;
    products: number;
  };
}

interface DashboardData {
  current: {
    orders: { count: number; growth: number };
    revenue: { amount: number; growth: number };
    users: { count: number; growth: number };
    products: { count: number; growth: number };
  };
  forecast: ForecastData;
}

interface ForecastMetric {
  label: string;
  current: number;
  nextMonth: number;
  nextQuarter: number;
  growth: number;
  icon: React.ReactNode;
  color: string;
  format: 'number' | 'currency';
}

export const ForecastOverview = () => {
  const { filters, updatePeriod } = useDashboardFilters();
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

  const getForecastMetrics = (): ForecastMetric[] => {
    if (!dashboardData) return [];

    const data = dashboardData.current;
    const forecast = dashboardData.forecast;

    return [
      {
        label: 'Orders',
        current: data.orders.count,
        nextMonth: forecast.nextMonth.orders,
        nextQuarter: forecast.nextQuarter.orders,
        growth: data.orders.growth,
        icon: <BoxIconLine className="text-blue-600 size-6" />,
        color: 'blue',
        format: 'number'
      },
      {
        label: 'Revenue',
        current: data.revenue.amount,
        nextMonth: forecast.nextMonth.revenue,
        nextQuarter: forecast.nextQuarter.revenue,
        growth: data.revenue.growth,
        icon: <DollarLineIcon className="text-green-600 size-6" />,
        color: 'green',
        format: 'currency'
      },
      {
        label: 'Users',
        current: data.users.count,
        nextMonth: forecast.nextMonth.users,
        nextQuarter: forecast.nextQuarter.users,
        growth: data.users.growth,
        icon: <UserIcon className="text-purple-600 size-6" />,
        color: 'purple',
        format: 'number'
      },
      {
        label: 'Products',
        current: data.products.count,
        nextMonth: forecast.nextMonth.products,
        nextQuarter: forecast.nextQuarter.products,
        growth: data.products.growth,
        icon: <CheckCircleIcon className="text-orange-600 size-6" />,
        color: 'orange',
        format: 'number'
      }
    ];
  };

  const formatValue = (value: number, format: 'number' | 'currency') => {
    return format === 'currency' ? formatDollar(value) : formatNumber(value);
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? <ArrowUpIcon className="size-4" /> : <ArrowDownIcon className="size-4" />;
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'success' : 'error';
  };

  const metrics = getForecastMetrics();

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
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 flex items-center gap-2">
              <ArrowUpIcon className="size-5" />
              Business Forecast
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Predictive analytics based on current trends
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Filter */}
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => updatePeriod('monthly')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filters.period === 'monthly'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => updatePeriod('yearly')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filters.period === 'yearly'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Yearly
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forecast Metrics */}
      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <div key={index} className="space-y-4">
              {/* Current Period */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
                <div className="flex items-center justify-between mb-3">
                  <div className={`flex items-center justify-center w-10 h-10 bg-${metric.color}-100 dark:bg-${metric.color}-900/20 rounded-lg`}>
                    {metric.icon}
                  </div>
                  <Badge color={getGrowthColor(metric.growth)}>
                    {getGrowthIcon(metric.growth)}
                    {Math.abs(metric.growth)}%
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Current {filters.period === 'monthly' ? 'Month' : 'Year'}
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatValue(metric.current, metric.format)}
                  </p>
                </div>
              </div>

              {/* Next Month Forecast */}
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="flex items-center gap-2 mb-3">
                  <CalenderIcon className="size-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Next Month
                  </span>
                </div>
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Forecast
                  </p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {formatValue(metric.nextMonth, metric.format)}
                  </p>
                </div>
              </div>

              {/* Next Quarter Forecast */}
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                <div className="flex items-center gap-2 mb-3">
                  <ArrowUpIcon className="size-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    Next Quarter
                  </span>
                </div>
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Forecast
                  </p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-300">
                    {formatValue(metric.nextQuarter, metric.format)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Forecast Summary */}
        <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800/50">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            Forecast Summary
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatNumber(metrics.reduce((sum, m) => sum + m.nextMonth, 0))}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total Next Month
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatNumber(metrics.reduce((sum, m) => sum + m.nextQuarter, 0))}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total Next Quarter
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {Math.round(metrics.reduce((sum, m) => sum + m.growth, 0) / metrics.length)}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Average Growth
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {formatDollar(metrics.find(m => m.format === 'currency')?.nextQuarter || 0)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Revenue Forecast
              </div>
            </div>
          </div>
        </div>

        {/* Forecast Note */}
        <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="flex items-start gap-3">
            <ArrowUpIcon className="size-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <h5 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Forecast Methodology
              </h5>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                These forecasts are based on current growth trends and historical data. 
                Next month projections assume 10% growth for orders/revenue and 5% for users/products. 
                Next quarter projections are calculated as 3-month rolling averages with trend adjustments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
