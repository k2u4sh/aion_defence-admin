"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Role = { _id: string; key: string; name: string; description?: string; permissions: string[] };

export default function EditRolePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissionsText, setPermissionsText] = useState("");
  const [allPermissions, setAllPermissions] = useState<Array<{ key: string; name: string; category?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        const [roleRes, permsRes] = await Promise.all([
          fetch(`/api/admin/roles/${params.id}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined }),
          fetch(`/api/admin/permissions?limit=200`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
        ]);
        const data = await roleRes.json();
        const permsData = await permsRes.json();
        if (!roleRes.ok || !data?.success) throw new Error(data?.message || 'Failed to load role');
        if (permsRes.ok && permsData?.success) {
          setAllPermissions((permsData.data?.items || permsData.data || []).map((p: any) => ({ key: p.key, name: p.name, category: p.category })));
        }
        const r: Role = data.data;
        if (!cancelled) {
          setRole(r);
          setKey(r.key || "");
          setName(r.name || "");
          setDescription(r.description || "");
          setPermissionsText(Array.isArray(r.permissions) ? r.permissions.join(", ") : "");
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load role');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [params.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    try {
      setSaving(true);
      setError(null);
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const permissions = permissionsText
        .split(',')
        .map(p => p.trim())
        .filter(Boolean);

      const res = await fetch(`/api/admin/roles/${role._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ key, name, description, permissions })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to update role');
      router.push('/admin-management/roles');
    } catch (e: any) {
      setError(e?.message || 'Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!role) return <div className="p-6">Role not found</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit Role</h1>
        <p className="text-gray-600">Update role details and permissions</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Key</label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="unique_key"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Role name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Permissions</label>
          <div className="max-h-72 overflow-auto border rounded p-3 space-y-2">
            {allPermissions.map((perm) => {
              const selected = (permissionsText.split(',').map(p => p.trim()).filter(Boolean)).includes(perm.key);
              return (
                <label key={perm.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => {
                      const set = new Set(permissionsText.split(',').map(p => p.trim()).filter(Boolean));
                      if (e.target.checked) set.add(perm.key); else set.delete(perm.key);
                      setPermissionsText(Array.from(set).join(', '));
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-800 dark:text-gray-200">
                    <span className="font-medium">{perm.name}</span>
                    <span className="ml-2 text-xs text-gray-500">{perm.key}{perm.category ? ` · ${perm.category}` : ''}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-gray-500">Selected: {permissionsText || 'none'}</p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin-management/roles')}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}


