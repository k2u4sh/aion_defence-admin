"use client";
import React, { useEffect, useState } from "react";

type Permission = { _id: string; key: string; name: string };

export default function CreateGroupPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('/api/admin/permissions?page=1&limit=200', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await res.json();
        if (res.ok && data?.success) setAllPermissions(data.data || []);
      } catch {}
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name, description, permissions }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to create group');
      window.location.href = '/admin-management/groups';
    } catch (err: any) {
      setError(err?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Create Group</h1>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
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
        <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-black text-white text-sm">
          {loading ? 'Creating...' : 'Create'}
        </button>
      </form>
    </div>
  );
}


