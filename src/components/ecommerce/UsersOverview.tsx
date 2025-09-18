"use client";
import React, { useState } from "react";
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

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  companyName?: string;
  role: 'admin' | 'user' | 'vendor' | 'customer';
  status: 'active' | 'inactive' | 'pending' | 'blocked';
  isVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
}

export const UsersOverview = () => {
  const [timeFilter, setTimeFilter] = useState<'monthly' | 'yearly'>('monthly');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - in real app, this would come from API
  const getUsersData = (): User[] => {
    const baseUsers: User[] = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@email.com',
        mobile: '+1 (555) 123-4567',
        companyName: 'Tech Solutions Inc.',
        role: 'customer',
        status: 'active',
        isVerified: true,
        lastLogin: '2024-12-01T10:30:00Z',
        createdAt: '2024-11-15',
        totalOrders: 12,
        totalSpent: 3456.78
      },
      {
        id: '2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.j@email.com',
        mobile: '+1 (555) 234-5678',
        companyName: 'Digital Marketing Co.',
        role: 'vendor',
        status: 'active',
        isVerified: true,
        lastLogin: '2024-12-01T09:15:00Z',
        createdAt: '2024-10-20',
        totalOrders: 0,
        totalSpent: 0
      },
      {
        id: '3',
        firstName: 'Mike',
        lastName: 'Wilson',
        email: 'mike.w@email.com',
        mobile: '+1 (555) 345-6789',
        role: 'customer',
        status: 'active',
        isVerified: true,
        lastLogin: '2024-11-30T16:45:00Z',
        createdAt: '2024-09-10',
        totalOrders: 8,
        totalSpent: 1899.99
      },
      {
        id: '4',
        firstName: 'Emily',
        lastName: 'Davis',
        email: 'emily.d@email.com',
        mobile: '+1 (555) 456-7890',
        companyName: 'Startup Ventures',
        role: 'customer',
        status: 'pending',
        isVerified: false,
        lastLogin: '2024-11-28T14:20:00Z',
        createdAt: '2024-11-25',
        totalOrders: 2,
        totalSpent: 299.99
      },
      {
        id: '5',
        firstName: 'David',
        lastName: 'Brown',
        email: 'david.b@email.com',
        mobile: '+1 (555) 567-8901',
        role: 'admin',
        status: 'active',
        isVerified: true,
        lastLogin: '2024-12-01T08:00:00Z',
        createdAt: '2024-01-15',
        totalOrders: 0,
        totalSpent: 0
      }
    ];

    if (timeFilter === 'yearly') {
      // Add more historical data for yearly view
      return [
        ...baseUsers,
        {
          id: '6',
          firstName: 'Lisa',
          lastName: 'Anderson',
          email: 'lisa.a@email.com',
          mobile: '+1 (555) 678-9012',
          companyName: 'Global Enterprises',
          role: 'customer',
          status: 'active',
          isVerified: true,
          lastLogin: '2024-11-20T11:30:00Z',
          createdAt: '2024-08-15',
          totalOrders: 15,
          totalSpent: 4234.56
        },
        {
          id: '7',
          firstName: 'Robert',
          lastName: 'Taylor',
          email: 'robert.t@email.com',
          mobile: '+1 (555) 789-0123',
          role: 'vendor',
          status: 'inactive',
          isVerified: true,
          lastLogin: '2024-10-15T13:45:00Z',
          createdAt: '2024-07-20',
          totalOrders: 0,
          totalSpent: 0
        }
      ];
    }

    return baseUsers;
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
    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.companyName && user.companyName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesRole && matchesSearch;
  });

  const totalUsers = filteredUsers.length;
  const activeUsers = filteredUsers.filter(u => u.status === 'active').length;
  const verifiedUsers = filteredUsers.filter(u => u.isVerified).length;
  const totalRevenue = filteredUsers.reduce((sum, user) => sum + user.totalSpent, 0);

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
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
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
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <Badge color={getStatusColor(user.status)}>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {user.totalOrders} orders
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDollar(user.totalSpent)}
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
                    <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                      <EyeIcon className="size-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300">
                      <EditIcon className="size-4" />
                    </button>
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
          <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
            View All Users
          </button>
        </div>
      </div>
    </div>
  );
};

