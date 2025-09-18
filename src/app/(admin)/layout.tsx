"use client";

import { useSidebar } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { SidebarProvider } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import CMSSidebar from "@/layout/CMSSidebar";
import Backdrop from "@/layout/Backdrop";
import React, { useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <ThemeProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </ThemeProvider>
    </SidebarProvider>
  );
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const [showCMSSidebar, setShowCMSSidebar] = useState(false);

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[280px] xl:ml-[290px]"
    : "lg:ml-[70px] xl:ml-[90px]";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      
      {/* CMS Sidebar */}
      <CMSSidebar isOpen={showCMSSidebar} onClose={() => setShowCMSSidebar(false)} />
      
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin} flex flex-col min-h-screen`}
      >
        {/* Header */}
        <AppHeader onShowCMS={() => setShowCMSSidebar(true)} />
        {/* Page Content */}
        <div className="flex-1 p-3 sm:p-4 md:p-6 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
