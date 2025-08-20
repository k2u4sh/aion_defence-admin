"use client";
import React, { useEffect, useState } from "react";

type Role = { role: string; defaultPermissions: string[] };

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Roles</h1>
      {loading ? <p>Loading...</p> : error ? <p className="text-red-600 text-sm">{error}</p> : (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">Role</th>
                <th className="p-2">Default Permissions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(r => (
                <tr key={r.role} className="border-b">
                  <td className="p-2">{r.role}</td>
                  <td className="p-2">
                    {r.defaultPermissions && r.defaultPermissions.length ? r.defaultPermissions.join(', ') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


