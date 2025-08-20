"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Permission = { _id: string; key: string; name: string };
type Group = { _id: string; name: string; description?: string; permissions?: string[] };

export default function EditGroupPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [removingKey, setRemovingKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const token = localStorage.getItem('accessToken');
        const [groupRes, permsRes] = await Promise.all([
          fetch(`/api/admin/groups/${params.id}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined }),
          fetch('/api/admin/permissions?page=1&limit=200', { headers: token ? { Authorization: `Bearer ${token}` } : undefined }),
        ]);
        const groupData = await groupRes.json();
        const permsData = await permsRes.json();
        if (!groupRes.ok || !groupData?.success) throw new Error(groupData?.message || 'Failed to load group');
        if (!permsRes.ok || !permsData?.success) throw new Error(permsData?.message || 'Failed to load permissions');
        const g: Group = groupData.data;
        if (!cancelled) {
          setName(g.name || "");
          setDescription(g.description || "");
          setPermissions(Array.isArray(g.permissions) ? g.permissions : []);
          setAllPermissions(permsData.data || []);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [params.id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/admin/groups/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name, description, permissions }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to update group');
      router.replace('/admin-management/groups');
    } catch (err: any) {
      setError(err?.message || 'Failed to update group');
    } finally {
      setSaving(false);
    }
  }

  async function removePermission(key: string) {
    if (!key) return;
    setActionError(null);
    const confirmed = window.confirm(`Remove permission "${key}" from this group?`);
    if (!confirmed) return;
    try {
      setRemovingKey(key);
      const updated = permissions.filter(k => k !== key);
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/admin/groups/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name, description, permissions: updated }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to remove permission');
      setPermissions(updated);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to remove permission');
    } finally {
      setRemovingKey(null);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Edit Group</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input className="w-full border rounded px-3 py-2" value={name} onChange={e=>setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea className="w-full border rounded px-3 py-2" value={description} onChange={e=>setDescription(e.target.value)} />
        </div>
        <div>
          {actionError ? <p className="text-sm text-red-600 mb-2">{actionError}</p> : null}
          {permissions.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {permissions.map((key) => (
                <span key={key} className="inline-flex items-center gap-2 text-xs border rounded-full px-2 py-1">
                  <span>{key}</span>
                  <button type="button" onClick={() => removePermission(key)} className="text-red-600" disabled={removingKey === key}>
                    {removingKey === key ? '...' : '×'}
                  </button>
                </span>
              ))}
            </div>
          ) : null}
          <label className="block text-sm mb-1">Permissions</label>
          <div className="border rounded p-2 space-y-1 max-h-72 overflow-auto">
            {allPermissions.length === 0 ? <p className="text-sm text-gray-500">No permissions</p> : allPermissions.map(p => (
              <label key={p._id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={permissions.includes(p.key)} onChange={(e)=>{
                  setPermissions(prev => e.target.checked ? [...prev, p.key] : prev.filter(k => k !== p.key));
                }} />
                {p.key} — {p.name}
              </label>
            ))}
          </div>
        </div>
        <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-black text-white text-sm">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}


