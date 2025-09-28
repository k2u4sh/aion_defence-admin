"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Role = { _id: string; key: string; name: string; description?: string; permissions: string[] };
type Group = { _id: string; name: string };

export default function CreateAdminPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [groups, setGroups] = useState<string[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const [rolesRes, groupsRes] = await Promise.all([
          fetch('/api/admin/roles'),
          fetch('/api/admin/groups?page=1&limit=100', { headers: token ? { Authorization: `Bearer ${token}` } : undefined }),
        ]);
        const rolesData = await rolesRes.json();
        const groupsData = await groupsRes.json();
        if (rolesRes.ok && rolesData?.success) setRoles(rolesData.data || []);
        if (groupsRes.ok && groupsData?.success) setAllGroups(groupsData.data || []);
      } catch {}
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ firstName, lastName, email, password, role, groups }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to create admin');
      router.replace('/admin-management/admins');
    } catch (err: any) {
      setError(err?.message || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Create Admin</h1>
      {error ? <p className="text-red-600 text-sm">{error}</p> : null}
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">First name</label>
          <input className="w-full border rounded px-3 py-2" value={firstName} onChange={e=>setFirstName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Last name</label>
          <input className="w-full border rounded px-3 py-2" value={lastName} onChange={e=>setLastName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input type="email" className="w-full border rounded px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input type="password" className="w-full border rounded px-3 py-2" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Role</label>
          <select className="w-full border rounded px-3 py-2" value={role} onChange={e=>setRole(e.target.value)}>
            {roles.map(r => <option key={r._id} value={r.key}>{r.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Groups</label>
          <div className="border rounded p-2 space-y-1 max-h-48 overflow-auto">
            {allGroups.length === 0 ? <p className="text-sm text-gray-500">No groups</p> : allGroups.map(g => (
              <label key={g._id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={groups.includes(g._id)} onChange={(e)=>{
                  setGroups(prev => e.target.checked ? [...prev, g._id] : prev.filter(id => id !== g._id));
                }} />
                {g.name}
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


