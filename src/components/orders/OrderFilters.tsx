"use client";
import React, { useState, useEffect } from "react";
import InputField from "@/components/form/input/InputField";

interface OrderFiltersProps {
  filters: {
    orderStatus?: string;
    paymentStatus?: string;
    dateRange?: {
      start: string;
      end: string;
    };
    search?: string;
    minAmount?: number;
    maxAmount?: number;
  };
  onFiltersChange: (filters: any) => void;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({ filters, onFiltersChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      orderStatus: undefined,
      paymentStatus: undefined,
      dateRange: undefined,
      search: undefined,
      minAmount: undefined,
      maxAmount: undefined,
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const orderStatusOptions = [
    { value: "", label: "All Order Statuses" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const paymentStatusOptions = [
    { value: "", label: "All Payment Statuses" },
    { value: "pending", label: "Pending" },
    { value: "paid", label: "Paid" },
    { value: "failed", label: "Failed" },
    { value: "refunded", label: "Refunded" },
  ];

  return (
    <div className="bg-white rounded-lg shadow dark:bg-gray-800">
      <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900 dark:text-white">
            Filter Orders
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs sm:text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {isExpanded ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-3 sm:space-y-4">
            {/* Search and Basic Filters */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Search
                </label>
                <InputField
                  type="text"
                  placeholder="Order #, Customer Name, Email"
                  value={localFilters.search || ""}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Order Status
                </label>
                <select
                  value={localFilters.orderStatus || ""}
                  onChange={(e) => handleFilterChange("orderStatus", e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                >
                  {orderStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Status
                </label>
                <select
                  value={localFilters.paymentStatus || ""}
                  onChange={(e) => handleFilterChange("paymentStatus", e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                >
                  {paymentStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Amount ($)
                </label>
                <InputField
                  type="number"
                  placeholder="0.00"
                  value={localFilters.minAmount || ""}
                  onChange={(e) => handleFilterChange("minAmount", e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
            </div>

            {/* Date Range and Max Amount */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <InputField
                  type="date"
                  value={localFilters.dateRange?.start || ""}
                  onChange={(e) => handleFilterChange("dateRange", {
                    ...localFilters.dateRange,
                    start: e.target.value
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <InputField
                  type="date"
                  value={localFilters.dateRange?.end || ""}
                  onChange={(e) => handleFilterChange("dateRange", {
                    ...localFilters.dateRange,
                    end: e.target.value
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Amount ($)
                </label>
                <InputField
                  type="number"
                  placeholder="1000.00"
                  value={localFilters.maxAmount || ""}
                  onChange={(e) => handleFilterChange("maxAmount", e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Clear Filters
              </button>
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
