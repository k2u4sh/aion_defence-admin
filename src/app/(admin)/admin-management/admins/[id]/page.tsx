"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Admin = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive?: boolean;
};

export default function EditAdminPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("admin");
  const [isActive, setIsActive] = useState(true);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`/api/admin/${params.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await res.json();
        if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to load admin');
        const a: Admin = data.data;
        if (!cancelled) {
          setAdmin(a);
          setFirstName(a.firstName);
          setLastName(a.lastName);
          setRole(a.role);
          setIsActive(Boolean(a.isActive));
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load admin');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [params.id]);

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/admin/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ firstName, lastName, role, isActive }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to update admin');
      router.replace('/admin-management/admins');
    } catch (e: any) {
      setError(e?.message || 'Failed to update admin');
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/admin/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to change password');
      setPassword('');
      alert('Password changed');
    } catch (e: any) {
      setError(e?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!admin) return <p>Not found</p>;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">Edit Admin</h1>
        <p className="text-sm text-gray-600">{admin.email}</p>
      </div>

      <form onSubmit={saveDetails} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">First name</label>
          <input className="w-full border rounded px-3 py-2" value={firstName} onChange={e=>setFirstName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Last name</label>
          <input className="w-full border rounded px-3 py-2" value={lastName} onChange={e=>setLastName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Role</label>
          <select className="w-full border rounded px-3 py-2" value={role} onChange={e=>setRole(e.target.value)}>
            <option value="super_admin">super_admin</option>
            <option value="admin">admin</option>
            <option value="moderator">moderator</option>
            <option value="support">support</option>
          </select>
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={e=>setIsActive(e.target.checked)} /> Active
        </label>
        <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-black text-white text-sm">{saving ? 'Saving...' : 'Save'}</button>
      </form>

      <div className="pt-6 border-t">
        <h2 className="font-medium">Change Password</h2>
        <form onSubmit={changePassword} className="mt-2 space-y-3">
          <input type="password" className="w-full border rounded px-3 py-2" placeholder="New password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-black text-white text-sm">{saving ? 'Saving...' : 'Update Password'}</button>
        </form>
      </div>
    </div>
  );
}


