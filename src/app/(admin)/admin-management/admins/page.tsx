"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { PencilIcon, LockIcon, TrashBinIcon } from "@/icons";

type Admin = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive?: boolean;
};

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    } catch (err: any) {
      setActionError(err?.message || 'Failed to delete admin');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admins</h1>
        <Link href="/admin-management/admins/create" className="px-3 py-1.5 rounded bg-black text-white text-sm">Create Admin</Link>
      </div>
      {loading ? <p>Loading...</p> : error ? <p className="text-red-600 text-sm">{error}</p> : (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Role</th>
                <th className="p-2">Active</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(a => (
                <tr key={a._id} className="border-b">
                  <td className="p-2">{a.firstName} {a.lastName}</td>
                  <td className="p-2">{a.email}</td>
                  <td className="p-2">{a.role}</td>
                  <td className="p-2">{a.isActive ? 'Yes' : 'No'}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin-management/admins/${a._id}`} className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 dark:hover:bg-white/5" title="Edit">
                        <PencilIcon width={18} height={18} />
                      </Link>
                      <button onClick={() => openPasswordModal(a._id)} className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 dark:hover:bg-white/5" title="Change Password">
                        <LockIcon width={18} height={18} />
                      </button>
                      <button onClick={() => openDeleteModal(a._id)} className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-red-50 dark:hover:bg-white/5" title="Delete">
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

// Password Modal
export function PasswordModal({ open, onClose, onSubmit, saving, error, adminEmail, value, onChange }:{ open:boolean; onClose:()=>void; onSubmit:(e:React.FormEvent)=>void; saving:boolean; error:string|null; adminEmail?:string; value:string; onChange:(v:string)=>void }){
  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-md p-6">
      <h3 className="text-lg font-medium mb-2">Change Password</h3>
      {adminEmail ? <p className="text-sm text-gray-600 mb-3">{adminEmail}</p> : null}
      {error ? <p className="text-sm text-red-600 mb-2">{error}</p> : null}
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">New password</label>
          <input type="password" className="w-full border rounded px-3 py-2" value={value} onChange={e=>onChange(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded border">Cancel</button>
          <button type="submit" disabled={saving} className="px-3 py-1.5 rounded bg-black text-white">{saving ? 'Saving...' : 'Update'}</button>
        </div>
      </form>
    </Modal>
  );
}

// Delete Confirm Modal
export function DeleteConfirmModal({ open, onClose, onConfirm, saving, error, adminEmail }:{ open:boolean; onClose:()=>void; onConfirm:()=>void; saving:boolean; error:string|null; adminEmail?:string }){
  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-md p-6">
      <h3 className="text-lg font-medium mb-2">Delete Admin</h3>
      {adminEmail ? <p className="text-sm text-gray-600 mb-3">{adminEmail}</p> : null}
      <p className="text-sm">Are you sure you want to delete this admin? This action cannot be undone.</p>
      {error ? <p className="text-sm text-red-600 mt-2">{error}</p> : null}
      <div className="flex items-center gap-2 justify-end pt-4">
        <button type="button" onClick={onClose} className="px-3 py-1.5 rounded border">Cancel</button>
        <button type="button" onClick={onConfirm} disabled={saving} className="px-3 py-1.5 rounded bg-red-600 text-white">{saving ? 'Deleting...' : 'Confirm'}</button>
      </div>
    </Modal>
  );
}


