import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardMetrics } from "@/components/ecommerce/DashboardMetrics";
import React from "react";
import { OrdersOverview } from "@/components/ecommerce/OrdersOverview";
import { ProductsOverview } from "@/components/ecommerce/ProductsOverview";
import { UsersOverview } from "@/components/ecommerce/UsersOverview";
import { BidsOverview } from "@/components/ecommerce/BidsOverview";
import { EnquiriesOverview } from "@/components/ecommerce/EnquiriesOverview";
import { ForecastOverview } from "@/components/ecommerce/ForecastOverview";
import { RevenueInsights } from "@/components/ecommerce/RevenueInsights";
import DashboardFilters from "@/components/ecommerce/DashboardFilters";
import { DashboardFilterProvider } from "@/contexts/DashboardFilterContext";

export const metadata: Metadata = {
  title: "Admin Dashboard | Aion Defence - Comprehensive Overview",
  description: "Complete admin dashboard with orders, products, users, and payments management",
};

export default async function Dashboard() {
  const cookieStore = await cookies();
  const session = cookieStore.get('auth_session');
  if (!session?.value) {
    redirect('/');
  }
  
  return (
    <DashboardFilterProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Dashboard Filters */}
            <DashboardFilters />

            {/* Dashboard Overview Metrics */}
            <DashboardMetrics />

            {/* Business Forecast */}
            <ForecastOverview />

            {/* Revenue Insights */}
            <RevenueInsights />

            {/* Orders Overview */}
            <OrdersOverview />

            {/* Bids and Enquiries Row - full width on desktop */}
            <div className="grid grid-cols-1 gap-6">
              <BidsOverview />
              <EnquiriesOverview />
            </div>

            {/* Products and Users Row - full width on desktop */}
            <div className="grid grid-cols-1 gap-6">
              <ProductsOverview />
              <UsersOverview />
            </div>
          </div>
        </div>
      </div>
    </DashboardFilterProvider>
  );
}


