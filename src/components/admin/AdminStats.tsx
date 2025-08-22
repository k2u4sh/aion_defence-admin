"use client";
import React from "react";

interface AdminStatsProps {
  stats: {
    totalAdmins: number;
    activeAdmins: number;
    inactiveAdmins: number;
    superAdmins: number;
    regularAdmins: number;
    moderators: number;
    supportUsers: number;
  };
}

export const AdminStats: React.FC<AdminStatsProps> = ({ stats }) => {
  const statCards = [
    {
      title: "Total Admins",
      value: stats.totalAdmins,
      change: "+2",
      changeType: "positive",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      color: "bg-blue-500",
    },
    {
      title: "Active Admins",
      value: stats.activeAdmins,
      change: "+1",
      changeType: "positive",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "bg-green-500",
    },
    {
      title: "Super Admins",
      value: stats.superAdmins,
      change: "0",
      changeType: "neutral",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "bg-purple-500",
    },
    {
      title: "Regular Admins",
      value: stats.regularAdmins,
      change: "+1",
      changeType: "positive",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: "bg-indigo-500",
    },
  ];

  const roleBreakdown = [
    { label: "Super Admin", value: stats.superAdmins, color: "bg-purple-500" },
    { label: "Admin", value: stats.regularAdmins, color: "bg-indigo-500" },
    { label: "Moderator", value: stats.moderators, color: "bg-blue-500" },
    { label: "Support", value: stats.supportUsers, color: "bg-green-500" },
  ];

  return (
    <div className="space-y-6 mb-6">
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

      {/* Role Breakdown */}
      <div className="bg-white rounded-lg shadow dark:bg-gray-800">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
            Admin Role Distribution
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {roleBreakdown.map((role, index) => (
              <div key={index} className="text-center">
                <div className={`${role.color} w-3 h-3 rounded-full mx-auto mb-2`}></div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {role.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {role.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="bg-white rounded-lg shadow dark:bg-gray-800">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
            Admin Status Summary
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.activeAdmins}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Active Admins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.inactiveAdmins}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Inactive Admins</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
