"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { PencilIcon, EyeIcon, PlusIcon, GridIcon } from "@/icons";
import UnifiedPagination from "@/components/common/UnifiedPagination";

interface Address {
  line1: string;
  line2?: string;
  line3?: string;
  city: string;
  zipCode: string;
  country: string;
  landline?: string;
  mobile?: string;
  email?: string;
  isMailing?: boolean;
}

interface UserDetail {
  name: string;
  designation?: string;
  email: string;
  mobile: string;
  isPrimary?: boolean;
}

interface Company {
  _id: string;
  userId: string;
  slug: string;
  name: string;
  logo?: string;
  description: string;
  addresses?: Address[];
  mailingAddresses?: Address[];
  parentCompany?: string;
  parentCompanyNotAvailable?: boolean;
  parentCompanyDescription?: string;
  website?: string;
  brochures?: string[];
  users?: UserDetail[];
  subscriptionPlan: "single" | "multiple" | "decide_later";
  natureOfBusiness?: string[];
  typeOfBusiness?: string[];
  registrationNumber?: string;
  yearEstablished?: string;
  numEmployees?: string;
  servicesOffered?: string;
  currency?: string;
  gstNumber?: string;
  gstCertificates?: string[];
  cin?: string;
  cinDocuments?: string[];
  categories?: string[];
  agreedToTerms: boolean;
  createdAt: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  companyName: string;
  companyType: string;
  company?: Company;
  roles: string[];
  isActive: boolean;
  isVerified: boolean;
  isBlocked: boolean;
  profilePicture?: string;
  lastLogin?: string;
  createdAt: string;
  fullName: string;
  primaryRole: string;
  // optional extended fields
  alternateEmail?: string;
  bio?: string;
  preferences?: any;
  subscription?: any;
  sellerProfile?: any;
  addresses?: any[];
  billingAddresses?: any[];
}

interface Filters {
  search: string;
  isActive: string;
  isVerified: string;
  isBlocked: string;
  role: string;
  companyType: string;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [companyForm, setCompanyForm] = useState<Partial<Company>>({});
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState<Filters>({
    search: "",
    isActive: "",
    isVerified: "",
    isBlocked: "",
    role: "",
    companyType: ""
  });

  const itemsPerPage = 20;

  useEffect(() => {
    loadUsers();
  }, [currentPage, filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.isActive && { isActive: filters.isActive }),
        ...(filters.isVerified && { isVerified: filters.isVerified }),
        ...(filters.isBlocked && { isBlocked: filters.isBlocked }),
        ...(filters.role && { role: filters.role }),
        ...(filters.companyType && { companyType: filters.companyType })
      });

      const res = await fetch(`/api/admin/users?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to load users');
      
      const usersWithFullName = data.data.users.map((user: User) => ({
        ...user,
        fullName: `${user.firstName} ${user.lastName}`,
        primaryRole: user.roles[0] || 'N/A'
      }));
      setUsers(usersWithFullName);

      // Fetch stats for current page users in parallel
      const statsResults = await Promise.all(
        usersWithFullName.map(async (u: any) => {
          try {
            const t = localStorage.getItem('accessToken');
            const res = await fetch(`/api/admin/users/${u._id}/stats`, { headers: t ? { Authorization: `Bearer ${t}` } : undefined });
            if (!res.ok) return null;
            const js = await res.json();
            return { id: u._id, stats: js?.data };
          } catch {
            return null;
          }
        })
      );
      const statsById: Record<string, any> = {};
      statsResults.filter(Boolean).forEach((r: any) => { statsById[r.id] = r.stats; });
      setUsers(prev => prev.map((u: any) => ({ ...u, __stats: statsById[u._id] || u.__stats })) as any);
      setTotalPages(data.data.pagination?.totalPages || 1);
      setTotalUsers(data.data.pagination?.total || 0);
    } catch (e: any) {
      setError(e?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      isActive: "",
      isVerified: "",
      isBlocked: "",
      role: "",
      companyType: ""
    });
    setCurrentPage(1);
  };

  

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobile: user.mobile,
      companyName: user.companyName,
      companyType: user.companyType,
      roles: [...user.roles],
      isActive: user.isActive,
      isVerified: user.isVerified,
      isBlocked: user.isBlocked,
      alternateEmail: (user as any).alternateEmail,
      bio: (user as any).bio,
      preferences: (user as any).preferences,
      subscription: (user as any).subscription,
      sellerProfile: (user as any).sellerProfile,
      addresses: (user as any).addresses,
      billingAddresses: (user as any).billingAddresses
    });
    setShowEditModal(true);
  };

  const handleEditCompany = async (user: User) => {
    setEditingUser(user);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const res = await fetch(`/api/admin/users/${user._id}/company`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      if (res.ok) {
        const js = await res.json();
        const apiCompany = js?.data?.company || {};
        const companyData = {
          name: apiCompany?.name || user.company?.name || user.companyName || "",
          description: apiCompany?.description || user.company?.description || "",
          website: apiCompany?.website || user.company?.website || "",
          logo: apiCompany?.logo || user.company?.logo || "",
          parentCompany: apiCompany?.parentCompany || user.company?.parentCompany || "",
          parentCompanyNotAvailable: apiCompany?.parentCompanyNotAvailable || user.company?.parentCompanyNotAvailable || false,
          parentCompanyDescription: apiCompany?.parentCompanyDescription || user.company?.parentCompanyDescription || "",
          registrationNumber: apiCompany?.registrationNumber || user.company?.registrationNumber || "",
          yearEstablished: apiCompany?.yearEstablished || user.company?.yearEstablished || "",
          numEmployees: apiCompany?.numEmployees || user.company?.numEmployees || "",
          servicesOffered: apiCompany?.servicesOffered || user.company?.servicesOffered || "",
          currency: apiCompany?.currency || user.company?.currency || "",
          gstNumber: apiCompany?.gstNumber || user.company?.gstNumber || "",
          cin: apiCompany?.cin || user.company?.cin || "",
          natureOfBusiness: apiCompany?.natureOfBusiness || user.company?.natureOfBusiness || [],
          typeOfBusiness: apiCompany?.typeOfBusiness || user.company?.typeOfBusiness || [],
          categories: apiCompany?.categories || user.company?.categories || [],
          subscriptionPlan: apiCompany?.subscriptionPlan || user.company?.subscriptionPlan || "single",
          agreedToTerms: apiCompany?.agreedToTerms || user.company?.agreedToTerms || false,
          addresses: apiCompany?.addresses || user.company?.addresses || [],
          mailingAddresses: apiCompany?.mailingAddresses || user.company?.mailingAddresses || [],
          users: apiCompany?.users || user.company?.users || [],
          brochures: apiCompany?.brochures || user.company?.brochures || [],
          gstCertificates: apiCompany?.gstCertificates || user.company?.gstCertificates || [],
          cinDocuments: apiCompany?.cinDocuments || user.company?.cinDocuments || []
        } as any;
        setCompanyForm(companyData);
      } else {
        // Fallback to existing embedded user data
        const companyData = {
          name: user.company?.name || user.companyName || "",
          description: user.company?.description || "",
          website: user.company?.website || "",
          logo: user.company?.logo || "",
          parentCompany: user.company?.parentCompany || "",
          parentCompanyNotAvailable: user.company?.parentCompanyNotAvailable || false,
          parentCompanyDescription: user.company?.parentCompanyDescription || "",
          registrationNumber: user.company?.registrationNumber || "",
          yearEstablished: user.company?.yearEstablished || "",
          numEmployees: user.company?.numEmployees || "",
          servicesOffered: user.company?.servicesOffered || "",
          currency: user.company?.currency || "",
          gstNumber: user.company?.gstNumber || "",
          cin: user.company?.cin || "",
          natureOfBusiness: user.company?.natureOfBusiness || [],
          typeOfBusiness: user.company?.typeOfBusiness || [],
          categories: user.company?.categories || [],
          subscriptionPlan: user.company?.subscriptionPlan || "single",
          agreedToTerms: user.company?.agreedToTerms || false,
          addresses: user.company?.addresses || [],
          mailingAddresses: user.company?.mailingAddresses || [],
          users: user.company?.users || [],
          brochures: user.company?.brochures || [],
          gstCertificates: user.company?.gstCertificates || [],
          cinDocuments: user.company?.cinDocuments || []
        } as any;
        setCompanyForm(companyData);
      }
    } catch {
      // Silent fallback
      const companyData = {
        name: user.company?.name || user.companyName || "",
        description: user.company?.description || "",
        website: user.company?.website || "",
        logo: user.company?.logo || "",
        parentCompany: user.company?.parentCompany || "",
        parentCompanyNotAvailable: user.company?.parentCompanyNotAvailable || false,
        parentCompanyDescription: user.company?.parentCompanyDescription || "",
        registrationNumber: user.company?.registrationNumber || "",
        yearEstablished: user.company?.yearEstablished || "",
        numEmployees: user.company?.numEmployees || "",
        servicesOffered: user.company?.servicesOffered || "",
        currency: user.company?.currency || "",
        gstNumber: user.company?.gstNumber || "",
        cin: user.company?.cin || "",
        natureOfBusiness: user.company?.natureOfBusiness || [],
        typeOfBusiness: user.company?.typeOfBusiness || [],
        categories: user.company?.categories || [],
        subscriptionPlan: user.company?.subscriptionPlan || "single",
        agreedToTerms: user.company?.agreedToTerms || false,
        addresses: user.company?.addresses || [],
        mailingAddresses: user.company?.mailingAddresses || [],
        users: user.company?.users || [],
        brochures: user.company?.brochures || [],
        gstCertificates: user.company?.gstCertificates || [],
        cinDocuments: user.company?.cinDocuments || []
      } as any;
      setCompanyForm(companyData);
    }
    setShowCompanyModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser || !editForm) return;
    
    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/users/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(editForm)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      
      // Update the user in the list
      setUsers(prev => prev.map(u => 
        u._id === editingUser._id 
          ? { ...u, ...editForm, fullName: `${editForm.firstName} ${editForm.lastName}` }
          : u
      ));
      
      setShowEditModal(false);
      setEditingUser(null);
      setEditForm({});
    } catch (err: any) {
      setError(err?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompany = async () => {
    if (!editingUser || !companyForm) return;
    
    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/users/${editingUser._id}/company`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          companyName: companyForm.name,
          companyType: editingUser.companyType,
          company: companyForm
        })
      });

      if (response.ok) {
        await loadUsers();
        setShowCompanyModal(false);
        setEditingUser(null);
        setCompanyForm({});
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update company information');
      }
    } catch (error) {
      console.error('Error updating company:', error);
      setError('Failed to update company information');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.isBlocked) {
      return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Blocked</span>;
    }
    if (!user.isActive) {
      return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">Inactive</span>;
    }
    if (!user.isVerified) {
      return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Unverified</span>;
    }
    return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Active</span>;
  };

  const getRoleBadge = (role: string) => (
    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full capitalize">
      {role}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">User Management</h1>
          <p className="text-gray-600">Manage system users and their permissions</p>
        </div>
        <Link 
          href="/admin-management/users/create" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon width={16} height={16} />
          Create User
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Filters</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <GridIcon width={16} height={16} />
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Name, email, company..."
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={filters.isActive}
                onChange={(e) => handleFilterChange('isActive', e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Verification</label>
              <select
                value={filters.isVerified}
                onChange={(e) => handleFilterChange('isVerified', e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="true">Verified</option>
                <option value="false">Unverified</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Blocked</label>
              <select
                value={filters.isBlocked}
                onChange={(e) => handleFilterChange('isBlocked', e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="true">Blocked</option>
                <option value="false">Not Blocked</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="partner">Partner</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Company Type</label>
              <select
                value={filters.companyType}
                onChange={(e) => handleFilterChange('companyType', e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="individual">Individual</option>
                <option value="sme">SME</option>
                <option value="corporation">Corporation</option>
                <option value="government">Government</option>
                <option value="ngo">NGO</option>
              </select>
            </div>
          </div>
        )}
        
        {showFilters && (
          <div className="flex justify-end mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border rounded hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">{totalUsers}</div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">
            {users.filter(u => u.isActive && !u.isBlocked).length}
          </div>
          <div className="text-sm text-gray-600">Active Users</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-yellow-600">
            {users.filter(u => !u.isVerified).length}
          </div>
          <div className="text-sm text-gray-600">Unverified</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-red-600">
            {users.filter(u => u.isBlocked).length}
          </div>
          <div className="text-sm text-gray-600">Blocked</div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-600">Loading users...</div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <div className="text-red-600">{error}</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-auto w-full">
          <div className="overflow-x-auto w-full">
            <table className="min-w-[1200px] w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-normal break-words">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.profilePicture ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={user.profilePicture}
                              alt={user.fullName}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {user.firstName[0]}{user.lastName[0]}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.fullName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-sm text-gray-500">{user.mobile}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-normal break-words">
                      <div className="text-sm text-gray-900">{user.companyName || 'N/A'}</div>
                      <div className="text-sm text-gray-500 capitalize">{user.companyType}</div>
                      {user.company && (
                        <div className="text-xs text-gray-400 mt-1 space-y-1">
                          {user.company.website && (
                            <div className="flex items-center">
                              <span className="w-2 h-2 bg-blue-400 rounded-full mr-1"></span>
                              {user.company.website}
                            </div>
                          )}
                          {user.company.registrationNumber && (
                            <div className="flex items-center">
                              <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                              Reg: {user.company.registrationNumber}
                            </div>
                          )}
                          {user.company.yearEstablished && (
                            <div className="flex items-center">
                              <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></span>
                              Est: {user.company.yearEstablished}
                            </div>
                          )}
                          {user.company.numEmployees && (
                            <div className="flex items-center">
                              <span className="w-2 h-2 bg-purple-400 rounded-full mr-1"></span>
                              {user.company.numEmployees} employees
                            </div>
                          )}
                          {user.company.subscriptionPlan && (
                            <div className="flex items-center">
                              <span className="w-2 h-2 bg-indigo-400 rounded-full mr-1"></span>
                              Plan: {user.company.subscriptionPlan}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map(role => getRoleBadge(role))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user)}
                      {(user as any).__stats && (
                        <div className="mt-1 text-xs text-gray-600">
                          <div>Total Sales: {(user as any).__stats.totalSales || 0}</div>
                          <div>Avg Given: {((user as any).__stats.averageRatingGiven || 0).toFixed?.(2) || '0.00'}</div>
                          <div>Avg Received: {((user as any).__stats.averageRatingReceived || 0).toFixed?.(2) || '0.00'}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-normal break-words text-sm text-gray-500">
                      {user.lastLogin ? new Date(user.lastLogin).toISOString().split('T')[0] : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-normal break-words text-sm font-medium sticky right-0 z-10 bg-white">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin-management/users/${user._id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <EyeIcon width={16} height={16} />
                        </Link>
                        {user.roles.includes('seller') && (
                          <button
                            onClick={() => handleEditCompany(user)}
                            className="text-green-600 hover:text-green-900"
                            title="Edit Company"
                          >
                            <GridIcon width={16} height={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      <UnifiedPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalUsers}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />

      

      {/* Edit User Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        <div className="p-6 max-w-2xl">
          <h3 className="text-lg font-medium mb-4">Edit User</h3>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={editForm.firstName || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={editForm.lastName || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* Preferences */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pref: Email Notifications</label>
                <input
                  type="checkbox"
                  checked={!!(editForm as any).preferences?.notifications?.email}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    preferences: {
                      ...(prev as any).preferences,
                      notifications: {
                        ...(prev as any).preferences?.notifications,
                        email: e.target.checked
                      }
                    }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pref: SMS Notifications</label>
                <input
                  type="checkbox"
                  checked={!!(editForm as any).preferences?.notifications?.sms}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    preferences: {
                      ...(prev as any).preferences,
                      notifications: {
                        ...(prev as any).preferences?.notifications,
                        sms: e.target.checked
                      }
                    }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Newsletter</label>
                <input
                  type="checkbox"
                  checked={!!(editForm as any).preferences?.newsletter}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    preferences: { ...(prev as any).preferences, newsletter: e.target.checked }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <input
                  type="text"
                  value={(editForm as any).preferences?.language || ''}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    preferences: { ...(prev as any).preferences, language: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <input
                  type="text"
                  value={(editForm as any).preferences?.timezone || ''}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    preferences: { ...(prev as any).preferences, timezone: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Subscription */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                <select
                  value={(editForm as any).subscription?.currentPlan || 'FREE'}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    subscription: { ...(prev as any).subscription, currentPlan: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="FREE">FREE</option>
                  <option value="GOLD">GOLD</option>
                  <option value="PLATINUM">PLATINUM</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Billing</label>
                <select
                  value={(editForm as any).subscription?.billingCycle || 'monthly'}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    subscription: { ...(prev as any).subscription, billingCycle: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!(editForm as any).subscription?.autoRenew}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      subscription: { ...(prev as any).subscription, autoRenew: e.target.checked }
                    }))}
                  />
                  <span>Auto Renew</span>
                </label>
              </div>
            </div>

            {/* Seller Profile (basic) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business License</label>
                <input
                  type="text"
                  value={(editForm as any).sellerProfile?.businessLicense || ''}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    sellerProfile: { ...(prev as any).sellerProfile, businessLicense: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
                <input
                  type="text"
                  value={(editForm as any).sellerProfile?.taxId || ''}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    sellerProfile: { ...(prev as any).sellerProfile, taxId: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Description</label>
                <textarea
                  value={(editForm as any).sellerProfile?.businessDescription || ''}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    sellerProfile: { ...(prev as any).sellerProfile, businessDescription: e.target.value }
                  }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={editForm.email || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
              <input
                type="tel"
                value={editForm.mobile || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, mobile: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={editForm.companyName || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, companyName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Type</label>
                <select
                  value={editForm.companyType || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, companyType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Type</option>
                  <option value="individual">Individual</option>
                  <option value="company">Company</option>
                  <option value="government">Government</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Roles</label>
              <div className="space-y-2">
                {['user', 'admin'].map(role => (
                  <label key={role} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editForm.roles?.includes(role) || false}
                      onChange={(e) => {
                        const currentRoles = editForm.roles || [];
                        if (e.target.checked) {
                          setEditForm(prev => ({ ...prev, roles: [...currentRoles, role] }));
                        } else {
                          setEditForm(prev => ({ ...prev, roles: currentRoles.filter(r => r !== role) }));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm capitalize">{role}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.isActive || false}
                  onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.isVerified || false}
                  onChange={(e) => setEditForm(prev => ({ ...prev, isVerified: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm">Verified</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.isBlocked || false}
                  onChange={(e) => setEditForm(prev => ({ ...prev, isBlocked: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm">Blocked</span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Company Modal */}
      <Modal isOpen={showCompanyModal} onClose={() => setShowCompanyModal(false)} size="7xl">
        <div className="flex flex-col h-[95vh] bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex-shrink-0 px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Edit Company Information</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Update company details for {editingUser?.firstName} {editingUser?.lastName}
                </p>
              </div>
              <button
                onClick={() => setShowCompanyModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Basic Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Basic Information</h4>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={companyForm.name || ''}
                      onChange={(e) => setCompanyForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter company name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                    <input
                      type="url"
                      value={companyForm.website || ''}
                      onChange={(e) => setCompanyForm(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="https://company-website.com"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={companyForm.description || ''}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Describe your company and its services..."
                    required
                  />
                </div>
              </div>

              {/* Business Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Business Information</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
                    <input
                      type="text"
                      value={companyForm.registrationNumber || ''}
                      onChange={(e) => setCompanyForm(prev => ({ ...prev, registrationNumber: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Company registration number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year Established</label>
                    <input
                      type="text"
                      value={companyForm.yearEstablished || ''}
                      onChange={(e) => setCompanyForm(prev => ({ ...prev, yearEstablished: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., 2020, Before 2000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Number of Employees</label>
                    <input
                      type="text"
                      value={companyForm.numEmployees || ''}
                      onChange={(e) => setCompanyForm(prev => ({ ...prev, numEmployees: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., 11-50, 51-200"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Services Offered</label>
                  <textarea
                    value={companyForm.servicesOffered || ''}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, servicesOffered: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Describe the services your company offers..."
                  />
                </div>
              </div>

              {/* Business Categories */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Business Categories</h4>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nature of Business</label>
                    <input
                      type="text"
                      value={Array.isArray(companyForm.natureOfBusiness) ? companyForm.natureOfBusiness.join(', ') : ''}
                      onChange={(e) => setCompanyForm(prev => ({ 
                        ...prev, 
                        natureOfBusiness: e.target.value.split(',').map(item => item.trim()).filter(item => item)
                      }))}
                      placeholder="OEM, MSME, Component Suppliers (comma separated)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type of Business</label>
                    <input
                      type="text"
                      value={Array.isArray(companyForm.typeOfBusiness) ? companyForm.typeOfBusiness.join(', ') : ''}
                      onChange={(e) => setCompanyForm(prev => ({ 
                        ...prev, 
                        typeOfBusiness: e.target.value.split(',').map(item => item.trim()).filter(item => item)
                      }))}
                      placeholder="Startup, MSME, Consulting Company (comma separated)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
                  <input
                    type="text"
                    value={Array.isArray(companyForm.categories) ? companyForm.categories.join(', ') : ''}
                    onChange={(e) => setCompanyForm(prev => ({ 
                      ...prev, 
                      categories: e.target.value.split(',').map(item => item.trim()).filter(item => item)
                    }))}
                    placeholder="Weapon System Sub-Components, Mobility & Propulsion Components (comma separated)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Financial Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Financial Information</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                    <select
                      value={companyForm.currency || ''}
                      onChange={(e) => setCompanyForm(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select Currency</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="INR">INR - Indian Rupee</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                      <option value="AUD">AUD - Australian Dollar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
                    <input
                      type="text"
                      value={companyForm.gstNumber || ''}
                      onChange={(e) => setCompanyForm(prev => ({ ...prev, gstNumber: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="GST registration number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CIN (Corporate Identity Number)</label>
                    <input
                      type="text"
                      value={companyForm.cin || ''}
                      onChange={(e) => setCompanyForm(prev => ({ ...prev, cin: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Corporate Identity Number"
                    />
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">GST Certificates</label>
                    <div className="space-y-2">
                      {Array.isArray(companyForm.gstCertificates) && companyForm.gstCertificates.length > 0 ? (
                        companyForm.gstCertificates.map((doc, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm text-gray-700 truncate" title={doc}>{doc}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">No GST certificates uploaded</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CIN Documents</label>
                    <div className="space-y-2">
                      {Array.isArray(companyForm.cinDocuments) && companyForm.cinDocuments.length > 0 ? (
                        companyForm.cinDocuments.map((doc, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm text-gray-700 truncate" title={doc}>{doc}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">No CIN documents uploaded</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Parent Company Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Parent Company Information</h4>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Parent Company</label>
                    <input
                      type="text"
                      value={companyForm.parentCompany || ''}
                      onChange={(e) => setCompanyForm(prev => ({ ...prev, parentCompany: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Parent company name"
                    />
                  </div>
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={companyForm.parentCompanyNotAvailable || false}
                      onChange={(e) => setCompanyForm(prev => ({ ...prev, parentCompanyNotAvailable: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="ml-3 text-sm font-medium text-gray-700">
                      Parent company not available
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Parent Company Description</label>
                    <textarea
                      value={companyForm.parentCompanyDescription || ''}
                      onChange={(e) => setCompanyForm(prev => ({ ...prev, parentCompanyDescription: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="Describe the parent company relationship..."
                    />
                  </div>
                </div>
              </div>

              {/* Subscription Plan */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Subscription Plan</h4>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plan Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={companyForm.subscriptionPlan || 'single'}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, subscriptionPlan: e.target.value as "single" | "multiple" | "decide_later" }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="single">Single User Plan</option>
                    <option value="multiple">Multiple User Plan</option>
                    <option value="decide_later">Decide Later</option>
                  </select>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={companyForm.agreedToTerms || false}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, agreedToTerms: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    required
                  />
                  <label className="ml-3 text-sm font-medium text-gray-700">
                    Agreed to Terms and Conditions <span className="text-red-500">*</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-8 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowCompanyModal(false)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCompany}
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Company Info
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

