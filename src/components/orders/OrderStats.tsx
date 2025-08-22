"use client";
import React from "react";
import { formatDollar, formatNumber } from "@/utils/formatters";

interface OrderStatsProps {
  stats: {
    totalOrders: number;
    pendingOrders: number;
    confirmedOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    pendingPayments: number;
    paidOrders: number;
  };
}

export const OrderStats: React.FC<OrderStatsProps> = ({ stats }) => {
  const statCards = [
    {
      title: "Total Orders",
      value: stats.totalOrders,
      change: "+12%",
      changeType: "positive",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "bg-blue-500",
    },
    {
      title: "Total Revenue",
      value: formatDollar(stats.totalRevenue),
      change: "+8.2%",
      changeType: "positive",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      color: "bg-green-500",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      change: "+5.1%",
      changeType: "neutral",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "bg-yellow-500",
    },
    {
      title: "Delivered Orders",
      value: stats.deliveredOrders,
      change: "+15.3%",
      changeType: "positive",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      color: "bg-green-600",
    },
  ];

  const statusBreakdown = [
    { label: "Pending", value: stats.pendingOrders, color: "bg-yellow-500" },
    { label: "Confirmed", value: stats.confirmedOrders, color: "bg-blue-500" },
    { label: "Processing", value: stats.processingOrders, color: "bg-purple-500" },
    { label: "Shipped", value: stats.shippedOrders, color: "bg-indigo-500" },
    { label: "Delivered", value: stats.deliveredOrders, color: "bg-green-500" },
    { label: "Cancelled", value: stats.cancelledOrders, color: "bg-red-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow dark:bg-gray-800 sm:px-6"
          >
            <div className="flex items-center">
              <div className={`${stat.color} rounded-lg p-3 text-white`}>
                {stat.icon}
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <span className={`text-sm font-medium ${
                stat.changeType === "positive" 
                  ? "text-green-600 dark:text-green-400" 
                  : stat.changeType === "negative"
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}>
                {stat.change}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                from last month
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-lg shadow dark:bg-gray-800">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
            Order Status Breakdown
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {statusBreakdown.map((status, index) => (
              <div key={index} className="text-center">
                <div className={`${status.color} w-3 h-3 rounded-full mx-auto mb-2`}></div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {status.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {status.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Status Summary */}
      <div className="bg-white rounded-lg shadow dark:bg-gray-800">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
            Payment Status Summary
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.paidOrders}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Paid Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.pendingPayments}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Pending Payments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatNumber(stats.totalRevenue)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Revenue ($)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
