"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PencilIcon, LockIcon, TrashBinIcon } from "@/icons";
import { AdminFilters } from "@/components/admin/AdminFilters";
import { AdminStats } from "@/components/admin/AdminStats";
import { PasswordModal, DeleteConfirmModal } from "@/components/admin/AdminModals";

type Admin = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive?: boolean;
  createdAt?: string;
};

interface AdminFilters {
  search?: string;
  role?: string;
  isActive?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([]);
  const [filters, setFilters] = useState<AdminFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    totalAdmins: 0,
    activeAdmins: 0,
    inactiveAdmins: 0,
    superAdmins: 0,
    regularAdmins: 0,
    moderators: 0,
    supportUsers: 0,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        const res = await fetch('/api/admin?page=1&limit=50', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await res.json();
        if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to load admins');
        if (!cancelled) setAdmins(Array.isArray(data?.data) ? data.data : []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load admins');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [admins, filters]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/stats', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data || {});
      }
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...admins];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(admin => 
        admin.firstName.toLowerCase().includes(searchTerm) ||
        admin.lastName.toLowerCase().includes(searchTerm) ||
        admin.email.toLowerCase().includes(searchTerm) ||
        admin.role.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.role) {
      filtered = filtered.filter(admin => admin.role === filters.role);
    }

    if (filters.isActive !== undefined && filters.isActive !== "") {
      const isActive = filters.isActive === "true";
      filtered = filtered.filter(admin => admin.isActive === isActive);
    }

    if (filters.dateRange?.start) {
      filtered = filtered.filter(admin => 
        admin.createdAt && new Date(admin.createdAt) >= new Date(filters.dateRange!.start)
      );
    }

    if (filters.dateRange?.end) {
      filtered = filtered.filter(admin => 
        admin.createdAt && new Date(admin.createdAt) <= new Date(filters.dateRange!.end)
      );
    }

    setFilteredAdmins(filtered);
  };

  const selectedAdmin = useMemo(() => admins.find(a => a._id === selectedId) || null, [admins, selectedId]);

  function openPasswordModal(id: string) {
    setSelectedId(id);
    setNewPassword("");
    setActionError(null);
    setShowPasswordModal(true);
  }

  function openDeleteModal(id: string) {
    setSelectedId(id);
    setActionError(null);
    setShowDeleteModal(true);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    if (!newPassword || newPassword.length < 8) {
      setActionError('Password must be at least 8 characters');
      return;
    }
    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/admin/${selectedId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to change password');
      setShowPasswordModal(false);
      setNewPassword("");
    } catch (err: any) {
      setActionError(err?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedId) return;
    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/admin/${selectedId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to delete admin');
      setAdmins(prev => prev.filter(a => a._id !== selectedId));
      setShowDeleteModal(false);
      // Refresh stats after deletion
      fetchStats();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to delete admin');
    } finally {
      setSaving(false);
    }
  }

  const handleFiltersChange = (newFilters: AdminFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Admin Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and monitor all admin users
          </p>
        </div>
        <Link href="/admin-management/admins/create" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors">
          Create Admin
        </Link>
      </div>

      {/* Admin Statistics */}
      <AdminStats stats={stats} />

      {/* Filters */}
      <AdminFilters 
        filters={filters} 
        onFiltersChange={handleFiltersChange} 
      />

      {/* Admins Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow dark:bg-gray-800 p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow dark:bg-gray-800 p-6">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow dark:bg-gray-800">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Admin Users ({filteredAdmins.length})
              </h3>
            </div>
            
            {filteredAdmins.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No admins found matching your filters.</p>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                      <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Name</th>
                      <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Email</th>
                      <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Role</th>
                      <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Status</th>
                      <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdmins.map(admin => (
                      <tr key={admin._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="p-3">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {admin.firstName} {admin.lastName}
                          </div>
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-400">{admin.email}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            admin.role === 'super_admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                            admin.role === 'admin' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            admin.role === 'moderator' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {admin.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            admin.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Link 
                              href={`/admin-management/admins/${admin._id}`} 
                              className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" 
                              title="Edit"
                            >
                              <PencilIcon width={18} height={18} />
                            </Link>
                            <button 
                              onClick={() => openPasswordModal(admin._id)} 
                              className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" 
                              title="Change Password"
                            >
                              <LockIcon width={18} height={18} />
                            </button>
                            <button 
                              onClick={() => openDeleteModal(admin._id)} 
                              className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" 
                              title="Delete"
                            >
                              <TrashBinIcon width={18} height={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <PasswordModal
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handleChangePassword}
        saving={saving}
        error={actionError}
        adminEmail={selectedAdmin?.email}
        value={newPassword}
        onChange={setNewPassword}
      />
      <DeleteConfirmModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        saving={saving}
        error={actionError}
        adminEmail={selectedAdmin?.email}
      />
    </div>
  );
}



