"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PlusIcon, EditIcon, TrashIcon } from "@/icons";
import { useModal } from "@/hooks/useModal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";

type Role = { 
  _id: string;
  key: string; 
  name: string; 
  description?: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Modals
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/roles');
        const data = await res.json();
        if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to load roles');
        if (!cancelled) setRoles(Array.isArray(data?.data) ? data.data : []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load roles');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/roles/${roleToDelete}`, {
        method: "DELETE"
      });

      const data = await response.json();
      if (data.success) {
        setRoles(roles.filter(role => role._id !== roleToDelete));
        closeDeleteModal();
        setRoleToDelete(null);
      } else {
        setError(data.message || "Failed to delete role");
      }
    } catch (error) {
      console.error("Error deleting role:", error);
      setError("Failed to delete role");
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenDeleteModal = (roleId: string) => {
    setRoleToDelete(roleId);
    openDeleteModal();
  };

  const getRoleBadgeColor = (key: string) => {
    switch (key) {
      case 'super_admin': return 'error';
      case 'admin': return 'warning';
      case 'moderator': return 'info';
      case 'support': return 'success';
      default: return 'light';
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Role Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage system roles and permissions</p>
          </div>
          <Link href="/admin-management/roles/create">
            <Button className="flex items-center gap-2">
              <PlusIcon className="h-4 w-4" />
              Add Role
            </Button>
          </Link>
        </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading roles...</div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {roles.map((role) => (
                  <tr key={role._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Badge color={getRoleBadgeColor(role.key)}>
                          {role.name}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                        {role.key}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {role.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 3).map((permission, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                            {permission}
                          </span>
                        ))}
                        {role.permissions.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            +{role.permissions.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin-management/roles/${role._id}/edit`}>
                          <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <EditIcon className="h-3 w-3" />
                            Edit
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                          onClick={() => handleOpenDeleteModal(role._id)}
                        >
                          <TrashIcon className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteRole}
        title="Delete Role"
        message="Are you sure you want to delete this role? This action cannot be undone."
        isLoading={deleting}
      />
    </div>
  );
}


