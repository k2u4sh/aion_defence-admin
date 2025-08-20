"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { TrashBinIcon } from "@/icons";

type Group = { _id: string; name: string; description?: string };

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Groups</h1>
        <Link href="/admin-management/groups/create" className="px-3 py-1.5 rounded bg-black text-white text-sm">Create Group</Link>
      </div>
      {loading ? <p>Loading...</p> : error ? <p className="text-red-600 text-sm">{error}</p> : (
        <ul className="space-y-2">
          {groups.map(g => (
            <li key={g._id} className="border rounded p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{g.name}</div>
                {g.description ? <div className="text-sm text-gray-600">{g.description}</div> : null}
              </div>
              <div className="flex items-center gap-3">
                <Link href={`/admin-management/groups/${g._id}`} className="text-blue-600 hover:underline text-sm">Edit</Link>
                <button
                  title="Delete group"
                  onClick={() => { setSelectedId(g._id); setActionError(null); setShowDelete(true); }}
                  className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-red-50 dark:hover:bg-white/5"
                >
                  <TrashBinIcon width={18} height={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
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


