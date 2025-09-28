"use client";
import React, { useState, useEffect } from "react";
import Badge from "../ui/badge/Badge";
import { formatDate } from "@/utils/formatters";
import { 
  SearchIcon,
  EyeIcon,
  MessageIcon,
  UserIcon,
  MailIcon,
  PhoneIcon
} from "@/icons";
import Link from "next/link";

interface Enquiry {
  _id: string;
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sellerId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    mobile?: string;
    companyName?: string;
  };
  createdAt: string;
  updatedAt: string;
  response?: {
    message: string;
    respondedAt: string;
    respondedBy: string;
  };
}

interface DashboardData {
  recent: {
    enquiries: Enquiry[];
  };
  statusBreakdown: {
    enquiries: Array<{ _id: string; count: number }>;
  };
}

export const EnquiriesOverview = () => {
  const [timeFilter, setTimeFilter] = useState<'monthly' | 'yearly'>('monthly');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'info';
      case 'in_progress': return 'warning';
      case 'resolved': return 'success';
      case 'closed': return 'error';
      default: return 'primary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'primary';
    }
  };

  const getStatusBreakdown = () => {
    if (!dashboardData?.statusBreakdown.enquiries) return {};
    const breakdown: Record<string, number> = {};
    dashboardData.statusBreakdown.enquiries.forEach(item => {
      breakdown[item._id] = item.count;
    });
    return breakdown;
  };

  const filteredEnquiries = dashboardData?.recent.enquiries.filter(enquiry => {
    const matchesStatus = statusFilter === 'all' || enquiry.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || enquiry.priority === priorityFilter;
    const matchesSearch = enquiry.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         enquiry.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         enquiry.sellerId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         enquiry.sellerId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         enquiry.sellerId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (enquiry.sellerId?.companyName && enquiry.sellerId.companyName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesPriority && matchesSearch;
  }) || [];

  const totalEnquiries = filteredEnquiries.length;
  const newEnquiries = filteredEnquiries.filter(e => e.status === 'new').length;
  const urgentEnquiries = filteredEnquiries.filter(e => e.priority === 'urgent').length;
  const statusBreakdown = getStatusBreakdown();

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
              Enquiries Overview
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {totalEnquiries} enquiries • {newEnquiries} new • {urgentEnquiries} urgent
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

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-5" />
          <input
            type="text"
            placeholder="Search enquiries by subject, message, or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          />
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Enquiry Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-white/[0.03] divide-y divide-gray-200 dark:divide-gray-800">
            {filteredEnquiries.map((enquiry) => (
              <tr key={enquiry._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {enquiry.subject}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                      {enquiry.message}
                    </div>
                    {enquiry.response && (
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                        ✓ Responded on {formatDate(enquiry.response.respondedAt)}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {enquiry.sellerId?.firstName} {enquiry.sellerId?.lastName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {enquiry.sellerId?.email}
                    </div>
                    {enquiry.sellerId?.mobile && (
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {enquiry.sellerId.mobile}
                      </div>
                    )}
                    {enquiry.sellerId?.companyName && (
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {enquiry.sellerId.companyName}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge color={getPriorityColor(enquiry.priority)}>
                    {enquiry.priority?.charAt(0).toUpperCase() + enquiry.priority?.slice(1) || 'Unknown'}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <Badge color={getStatusColor(enquiry.status)}>
                    {enquiry.status?.charAt(0).toUpperCase() + enquiry.status?.slice(1).replace('_', ' ') || 'Unknown'}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatDate(enquiry.createdAt)}
                    </div>
                    {enquiry.updatedAt !== enquiry.createdAt && (
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        Updated: {formatDate(enquiry.updatedAt)}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Link href={`/admin-management/enquiries/${enquiry._id}`}>
                    <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                      <EyeIcon className="size-5" />
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Showing {filteredEnquiries.length} enquiries</span>
          <Link href="/admin-management/enquiries">
            <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
              View All Enquiries
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};
