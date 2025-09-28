"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { TrashBinIcon, PlusIcon, EditIcon } from "@/icons";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";

type Group = { 
  _id: string; 
  name: string; 
  description?: string;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
};

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        const res = await fetch('/api/admin/groups?page=1&limit=100', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await res.json();
        if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to load groups');
        if (!cancelled) setGroups(Array.isArray(data?.data) ? data.data : []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load groups');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Group Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage admin groups and their permissions</p>
        </div>
        <Link href="/admin-management/groups/create">
          <Button className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            Create Group
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading groups...</div>
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
                    Group Name
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
                {groups.map((group) => (
                  <tr key={group._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Badge color="info">
                          {group.name}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {group.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex flex-wrap gap-1">
                        {group.permissions && group.permissions.length > 0 ? (
                          <>
                            {group.permissions.slice(0, 3).map((permission, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                {permission}
                              </span>
                            ))}
                            {group.permissions.length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                +{group.permissions.length - 3} more
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400">No permissions</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin-management/groups/${group._id}`}>
                          <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <EditIcon className="h-3 w-3" />
                            Edit
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                          onClick={() => { setSelectedId(group._id); setActionError(null); setShowDelete(true); }}
                        >
                          <TrashBinIcon className="h-3 w-3" />
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

      <DeleteConfirmModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={async () => {
          if (!selectedId) return;
          try {
            setSaving(true);
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/admin/groups/${selectedId}`, {
              method: 'DELETE',
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            const data = await res.json();
            if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to delete group');
            setGroups(prev => prev.filter(x => x._id !== selectedId));
            setShowDelete(false);
          } catch (err: any) {
            setActionError(err?.message || 'Failed to delete group');
          } finally {
            setSaving(false);
          }
        }}
        saving={saving}
        error={actionError}
      />
    </div>
  );
}

function DeleteConfirmModal({ open, onClose, onConfirm, saving, error }:{ open:boolean; onClose:()=>void; onConfirm:()=>void; saving:boolean; error:string|null }){
  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-md p-6">
      <h3 className="text-lg font-medium mb-2">Delete Group</h3>
      <p className="text-sm">Are you sure you want to delete this group? This action cannot be undone.</p>
      {error ? <p className="text-sm text-red-600 mt-2">{error}</p> : null}
      <div className="flex items-center gap-2 justify-end pt-4">
        <button type="button" onClick={onClose} className="px-3 py-1.5 rounded border">Cancel</button>
        <button type="button" onClick={onConfirm} disabled={saving} className="px-3 py-1.5 rounded bg-red-600 text-white">{saving ? 'Deleting...' : 'Confirm'}</button>
      </div>
    </Modal>
  );
}


