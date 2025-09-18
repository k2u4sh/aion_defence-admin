"use client";
import React from "react";
import { Modal } from "@/components/ui/modal";

// Password Modal
export function PasswordModal({ 
  open, 
  onClose, 
  onSubmit, 
  saving, 
  error, 
  adminEmail, 
  value, 
  onChange 
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  error: string | null;
  adminEmail?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-md p-6">
      <h3 className="text-lg font-medium mb-2">Change Password</h3>
      {adminEmail ? <p className="text-sm text-gray-600 mb-3">{adminEmail}</p> : null}
      {error ? <p className="text-sm text-red-600 mb-2">{error}</p> : null}
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">New password</label>
          <input 
            type="password" 
            className="w-full border rounded px-3 py-2" 
            value={value} 
            onChange={e => onChange(e.target.value)} 
          />
        </div>
        <div className="flex items-center gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded border">
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={saving} 
            className="px-3 py-1.5 rounded bg-black text-white"
          >
            {saving ? 'Saving...' : 'Update'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Delete Confirm Modal
export function DeleteConfirmModal({ 
  open, 
  onClose, 
  onConfirm, 
  saving, 
  error, 
  adminEmail 
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  saving: boolean;
  error: string | null;
  adminEmail?: string;
}) {
  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-md p-6">
      <h3 className="text-lg font-medium mb-2">Delete Admin</h3>
      {adminEmail ? <p className="text-sm text-gray-600 mb-3">{adminEmail}</p> : null}
      <p className="text-sm">Are you sure you want to delete this admin? This action cannot be undone.</p>
      {error ? <p className="text-sm text-red-600 mt-2">{error}</p> : null}
      <div className="flex items-center gap-2 justify-end pt-4">
        <button type="button" onClick={onClose} className="px-3 py-1.5 rounded border">
          Cancel
        </button>
        <button 
          type="button" 
          onClick={onConfirm} 
          disabled={saving} 
          className="px-3 py-1.5 rounded bg-red-600 text-white"
        >
          {saving ? 'Deleting...' : 'Confirm'}
        </button>
      </div>
    </Modal>
  );
}
