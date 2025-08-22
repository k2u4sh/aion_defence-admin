"use client";
import React, { useState } from "react";
import Badge from "../ui/badge/Badge";
import { 
  ArrowDownIcon, 
  ArrowUpIcon, 
  BoxIconLine, 
  DollarLineIcon,
  UserIcon,
  CheckCircleIcon
} from "@/icons";

interface MetricData {
  label: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: React.ReactNode;
  color: string;
}

export const DashboardMetrics = () => {
  const [timeFilter, setTimeFilter] = useState<'monthly' | 'yearly'>('monthly');

  // Mock data - in real app, this would come from API
  const getMetricsData = (): MetricData[] => {
    if (timeFilter === 'monthly') {
      return [
        {
          label: 'Total Orders',
          value: '2,847',
          change: 12.5,
          changeType: 'increase',
          icon: <BoxIconLine className="text-blue-600 size-6" />,
          color: 'blue'
        },
        {
          label: 'Active Products',
          value: '1,234',
          change: 8.2,
          changeType: 'increase',
          icon: <CheckCircleIcon className="text-green-600 size-6" />,
          color: 'green'
        },
        {
          label: 'Onboard Users',
          value: '892',
          change: 15.3,
          changeType: 'increase',
          icon: <UserIcon className="text-purple-600 size-6" />,
          color: 'purple'
        },
        {
          label: 'Total Revenue',
          value: '$45,678',
          change: 5.7,
          changeType: 'decrease',
          icon: <DollarLineIcon className="text-orange-600 size-6" />,
          color: 'orange'
        }
      ];
    } else {
      return [
        {
          label: 'Total Orders',
          value: '28,456',
          change: 18.7,
          changeType: 'increase',
          icon: <BoxIconLine className="text-blue-600 size-6" />,
          color: 'blue'
        },
        {
          label: 'Active Products',
          value: '12,345',
          change: 12.4,
          changeType: 'increase',
          icon: <CheckCircleIcon className="text-green-600 size-6" />,
          color: 'green'
        },
        {
          label: 'Onboard Users',
          value: '8,923',
          change: 22.1,
          changeType: 'increase',
          icon: <UserIcon className="text-purple-600 size-6" />,
          color: 'purple'
        },
        {
          label: 'Total Revenue',
          value: '$456,789',
          change: 14.3,
          changeType: 'increase',
          icon: <DollarLineIcon className="text-orange-600 size-6" />,
          color: 'orange'
        }
      ];
    }
  };

  const metrics = getMetricsData();

  return (
    <div className="space-y-6">
      {/* Time Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Dashboard Overview
        </h2>
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
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
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-between">
              <div className={`flex items-center justify-center w-12 h-12 bg-${metric.color}-100 dark:bg-${metric.color}-900/20 rounded-xl`}>
                {metric.icon}
              </div>
              <Badge 
                color={metric.changeType === 'increase' ? 'success' : 'error'}
                className="text-xs"
              >
                {metric.changeType === 'increase' ? <ArrowUpIcon /> : <ArrowDownIcon />}
                {metric.change}%
              </Badge>
            </div>

            <div className="mt-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {metric.label}
              </span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {metric.value}
              </h4>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

