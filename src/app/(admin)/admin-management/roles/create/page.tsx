"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreateRolePage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissionsText, setPermissionsText] = useState("");
  const [allPermissions, setAllPermissions] = useState<Array<{ key: string; name: string; category?: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const validateKeyFormat = (k: string) => /^[a-z0-9_\-]+$/.test(k);

  const checkKeyUnique = async (k: string) => {
    if (!k) { setKeyError('Key is required'); return false; }
    if (!validateKeyFormat(k)) { setKeyError('Use lowercase letters, numbers, dashes or underscores'); return false; }
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const res = await fetch(`/api/admin/roles/manage/${encodeURIComponent(k)}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      if (res.ok) {
        const js = await res.json();
        if (js?.success && js?.data) {
          setKeyError('This key is already in use');
          return false;
        }
      }
      setKeyError(null);
      return true;
    } catch {
      // If the lookup fails, do not block creation, but clear explicit uniqueness error
      setKeyError(null);
      return true;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        const res = await fetch(`/api/admin/permissions?limit=200`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        const js = await res.json();
        if (res.ok && js?.success) {
          setAllPermissions((js.data?.items || js.data || []).map((p: any) => ({ key: p.key, name: p.name, category: p.category })));
        }
      } catch {}
    })();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      // Inline validations
      if (!name.trim()) {
        setNameError('Name is required');
        setSaving(false);
        return;
      } else {
        setNameError(null);
      }
      const unique = await checkKeyUnique(key.trim());
      if (!unique) { setSaving(false); return; }
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const permissions = permissionsText
        .split(',')
        .map(p => p.trim())
        .filter(Boolean);

      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ key, name, description, permissions })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to create role');
      router.push('/admin-management/roles');
    } catch (e: any) {
      setError(e?.message || 'Failed to create role');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Create Role</h1>
        <p className="text-gray-600">Add a new role and set its permissions</p>
      </div>

      {error && (
        <div className="p-3 border border-red-200 bg-red-50 text-red-700 rounded">{error}</div>
      )}

      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Key</label>
          <input
            type="text"
            value={key}
            onChange={(e) => { setKey(e.target.value); setKeyError(null); }}
            onBlur={() => { if (key.trim()) void checkKeyUnique(key.trim()); }}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="unique_key"
            required
          />
          {keyError && <p className="mt-1 text-xs text-red-600">{keyError}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setNameError(null); }}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Role name"
            required
          />
          {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
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
            {saving ? 'Creating...' : 'Create Role'}
          </button>
        </div>
      </form>
    </div>
  );
}


