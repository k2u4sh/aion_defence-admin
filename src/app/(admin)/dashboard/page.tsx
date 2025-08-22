import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardMetrics } from "@/components/ecommerce/DashboardMetrics";
import React from "react";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import { OrdersOverview } from "@/components/ecommerce/OrdersOverview";
import { ProductsOverview } from "@/components/ecommerce/ProductsOverview";
import { UsersOverview } from "@/components/ecommerce/UsersOverview";
import { PaymentsOverview } from "@/components/ecommerce/PaymentsOverview";
import DemographicCard from "@/components/ecommerce/DemographicCard";

export const metadata: Metadata = {
  title: "Admin Dashboard | Aion Defence - Comprehensive Overview",
  description: "Complete admin dashboard with orders, products, users, and payments management",
};

export default async function Dashboard() {
  const session = await cookies().get('auth_session');
  if (!session?.value) {
    redirect('/');
  }
  
  return (
    <div className="space-y-6">
      {/* Dashboard Overview Metrics */}
      <DashboardMetrics />

      {/* Charts Row */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-7">
          <MonthlySalesChart />
        </div>
        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget />
        </div>
      </div>

      {/* Statistics Chart */}
      <div className="col-span-12">
        <StatisticsChart />
      </div>

      {/* Orders Overview */}
      <OrdersOverview />

      {/* Products and Users Row */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-6">
          <ProductsOverview />
        </div>
        <div className="col-span-12 xl:col-span-6">
          <UsersOverview />
        </div>
      </div>

      {/* Payments Overview */}
      <PaymentsOverview />

      {/* Additional Analytics */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-5">
          <DemographicCard />
        </div>
        <div className="col-span-12 xl:col-span-7">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-blue-600 dark:hover:bg-blue-900/20 transition-colors">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-2xl">📦</span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Product</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 dark:border-gray-700 dark:hover:border-green-600 dark:hover:bg-green-900/20 transition-colors">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-2xl">👤</span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Add User</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 dark:border-gray-700 dark:hover:border-purple-600 dark:hover:bg-purple-900/20 transition-colors">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-2xl">📊</span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View Reports</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 dark:border-gray-700 dark:hover:border-orange-600 dark:hover:bg-orange-900/20 transition-colors">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-2xl">⚙️</span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


