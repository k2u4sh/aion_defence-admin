"use client";
import React, { useState, useEffect } from "react";
import Badge from "../ui/badge/Badge";
import { formatNumber, formatDollar, formatDate } from "@/utils/formatters";
import { 
  UserIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  SearchIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  MailIcon,
  PhoneIcon
} from "@/icons";
import Link from "next/link";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  companyName?: string;
  role: 'admin' | 'user' | 'vendor' | 'customer' | 'seller' | 'buyer';
  status: 'active' | 'inactive' | 'pending' | 'blocked';
  isVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  totalOrders?: number;
  totalSpent?: number;
}

interface DashboardData {
  recent: {
    users: User[];
  };
  statusBreakdown: {
    users: Array<{ _id: string; count: number }>;
  };
}

export const UsersOverview = () => {
  const [timeFilter, setTimeFilter] = useState<'monthly' | 'yearly'>('monthly');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard', {
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

  const getUsersData = (): User[] => {
    return dashboardData?.recent.users || [];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'inactive': return 'info';
      case 'blocked': return 'error';
      default: return 'primary';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'purple';
      case 'vendor': return 'blue';
      case 'customer': return 'green';
      case 'user': return 'gray';
      default: return 'default';
    }
  };

  const filteredUsers = getUsersData().filter(user => {
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesSearch = user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.companyName && user.companyName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesRole && matchesSearch;
  });

  const totalUsers = filteredUsers.length;
  const activeUsers = filteredUsers.filter(u => u.status === 'active').length;
  const verifiedUsers = filteredUsers.filter(u => u.isVerified).length;
  const totalRevenue = filteredUsers.reduce((sum, user) => sum + (user.totalSpent || 0), 0);

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
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Users Overview
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {totalUsers} users • {activeUsers} active • {verifiedUsers} verified • {formatDollar(totalRevenue)} revenue
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Filter */}
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
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

            {/* Add User Button */}
            <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <PlusIcon className="size-4" />
              Add User
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
          {/* Search Bar */}
          <div className="sm:col-span-2 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-5" />
            <input
              type="text"
              placeholder="Search users by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="vendor">Vendor</option>
            <option value="customer">Customer</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Activity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-white/[0.03] divide-y divide-gray-200 dark:divide-gray-800">
            {filteredUsers.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <UserIcon className="size-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {user.isVerified ? (
                          <span className="flex items-center gap-1">
                            <CheckCircleIcon className="size-3 text-green-500" />
                            Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <ClockIcon className="size-3 text-yellow-500" />
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                      <MailIcon className="size-4 text-gray-400" />
                      {user.email}
                    </div>
                    {user.mobile && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <PhoneIcon className="size-4 text-gray-400" />
                        {user.mobile}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {user.companyName || '—'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge color={getRoleColor(user.role) as any}>
                    {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'Unknown'}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <Badge color={getStatusColor(user.status)}>
                    {user.status?.charAt(0).toUpperCase() + user.status?.slice(1) || 'Unknown'}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {user.totalOrders || 0} orders
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDollar(user.totalSpent || 0)}
                    </div>
                    {user.lastLogin && (
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        Last: {formatDate(user.lastLogin)}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin-management/users/${user._id}`}>
                      <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                        <EyeIcon className="size-4" />
                      </button>
                    </Link>
                    <Link href={`/admin-management/users/${user._id}/edit`}>
                      <button className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300">
                        <EditIcon className="size-4" />
                      </button>
                    </Link>
                    <button className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                      <TrashIcon className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Showing {filteredUsers.length} users</span>
          <Link href="/admin-management/users">
            <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
              View All Users
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

