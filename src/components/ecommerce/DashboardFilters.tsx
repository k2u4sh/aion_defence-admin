"use client";
import React from "react";
import { CalenderIcon } from "@/icons";
import { useDashboardFilters } from "@/contexts/DashboardFilterContext";

export const DashboardFilters = () => {
  const { filters, updatePeriod, updateYear, updateMonth } = useDashboardFilters();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];


  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <CalenderIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Dashboard Filters
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Filter data by time period
            </p>
          </div>
        </div>
        
        {/* Quick Actions */}
        <button
          onClick={() => {
            updateYear(currentYear);
            updateMonth(new Date().getMonth() + 1);
          }}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg"
        >
          Reset to Current {filters.period === 'monthly' ? 'Month' : 'Year'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Period Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Time Period
          </label>
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800/50">
            <button
              onClick={() => updatePeriod('monthly')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                filters.period === 'monthly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => updatePeriod('yearly')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                filters.period === 'yearly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Year Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Year
          </label>
          <select
            value={filters.year}
            onChange={(e) => updateYear(parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Month Selection (only for monthly period) */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {filters.period === 'monthly' ? 'Month' : 'Period'}
          </label>
          {filters.period === 'monthly' ? (
            <select
              value={filters.month}
              onChange={(e) => updateMonth(parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          ) : (
            <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 text-sm text-gray-500 dark:text-gray-400">
              Full Year
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardFilters;
