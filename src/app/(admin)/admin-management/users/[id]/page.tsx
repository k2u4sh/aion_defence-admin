"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
// Icons removed as they are not used

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  companyName: string;
  companyType: string;
  roles: string[];
  alternateEmail?: string;
  bio?: string;
  isActive: boolean;
  isVerified: boolean;
  isBlocked: boolean;
  profilePicture?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  addresses?: Array<{
    street?: string;
    city: string;
    state?: string;
    country: string;
    zipCode: string;
    isDefault: boolean;
  }>;
  sellerProfile?: {
    businessLicense?: string;
    taxId?: string;
    businessDescription?: string;
    isVerifiedSeller: boolean;
    sellerRating: number;
    totalSales: number;
  };
}

interface EditFormData {
  firstName: string;
  lastName: string;
  mobile: string;
  companyName: string;
  companyType: string;
  roles: string[];
  alternateEmail?: string;
  bio?: string;
}

const COMPANY_TYPES = [
  { value: "individual", label: "Individual" },
  { value: "sme", label: "Small & Medium Enterprise" },
  { value: "corporation", label: "Corporation" },
  { value: "government", label: "Government" },
  { value: "ngo", label: "NGO" }
];

const USER_ROLES = [
  { value: "buyer", label: "Buyer" },
  { value: "seller", label: "Seller" },
  { value: "partner", label: "Partner" },
  { value: "admin", label: "Admin" }
];

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState<'verify' | 'block' | 'activate' | null>(null);

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/users/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (!response.ok) {
        throw new Error('Failed to load user');
      }
      
      const data = await response.json();
      setUser(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (!user) return;
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      mobile: user.mobile,
      companyName: user.companyName,
      companyType: user.companyType,
      roles: [...user.roles],
      alternateEmail: user.alternateEmail,
      bio: user.bio
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!editForm || !user) return;
    
    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(editForm)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      
      await loadUser();
      setEditing(false);
      setEditForm(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (action: 'verify' | 'block' | 'activate') => {
    if (!user) return;
    
    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');
      
      let updates: any = {};
      switch (action) {
        case 'verify':
          updates.isVerified = !user.isVerified;
          break;
        case 'block':
          updates.isBlocked = !user.isBlocked;
          break;
        case 'activate':
          updates.isActive = !user.isActive;
          break;
      }
      
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id: userId, ...updates })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user status');
      }
      
      await loadUser();
      setShowStatusModal(false);
      setStatusAction(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRoleToggle = (role: string) => {
    if (!editForm) return;
    setEditForm(prev => ({
      ...prev!,
      roles: prev!.roles.includes(role)
        ? prev!.roles.filter(r => r !== role)
        : [...prev!.roles, role]
    }));
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!user) return <div className="p-4">User not found</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-gray-600">{user.email}</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/admin-management/users"
            className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
          >
            Back to Users
          </Link>
          {!editing && (
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Edit User
            </button>
          )}
        </div>
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <span className={`px-2 py-1 text-xs rounded ${
              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {user.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <button
            onClick={() => {
              setStatusAction('activate');
              setShowStatusModal(true);
            }}
            className="text-xs text-blue-600 hover:underline mt-2"
          >
            Toggle Status
          </button>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Verification</span>
            <span className={`px-2 py-1 text-xs rounded ${
              user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {user.isVerified ? 'Verified' : 'Unverified'}
            </span>
          </div>
          <button
            onClick={() => {
              setStatusAction('verify');
              setShowStatusModal(true);
            }}
            className="text-xs text-blue-600 hover:underline mt-2"
          >
            Toggle Verification
          </button>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Blocked</span>
            <span className={`px-2 py-1 text-xs rounded ${
              user.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              {user.isBlocked ? 'Blocked' : 'Not Blocked'}
            </span>
          </div>
          <button
            onClick={() => {
              setStatusAction('block');
              setShowStatusModal(true);
            }}
            className="text-xs text-blue-600 hover:underline mt-2"
          >
            Toggle Block
          </button>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Last Login</span>
            <span className="text-xs text-gray-600">
              {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
            </span>
          </div>
        </div>
      </div>

      {/* User Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-medium mb-4">Personal Information</h2>
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm(prev => ({ ...prev!, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm(prev => ({ ...prev!, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Mobile</label>
                <input
                  type="tel"
                  value={editForm.mobile}
                  onChange={(e) => setEditForm(prev => ({ ...prev!, mobile: e.target.value }))}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Alternate Email</label>
                <input
                  type="email"
                  value={editForm.alternateEmail || ""}
                  onChange={(e) => setEditForm(prev => ({ ...prev!, alternateEmail: e.target.value }))}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Bio</label>
                <textarea
                  value={editForm.bio || ""}
                  onChange={(e) => setEditForm(prev => ({ ...prev!, bio: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Full Name:</span>
                <span className="font-medium">{user.firstName} {user.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Mobile:</span>
                <span className="font-medium">{user.mobile}</span>
              </div>
              {user.alternateEmail && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Alternate Email:</span>
                  <span className="font-medium">{user.alternateEmail}</span>
                </div>
              )}
              {user.bio && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Bio:</span>
                  <span className="font-medium">{user.bio}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Company Information */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-medium mb-4">Company Information</h2>
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Company Name</label>
                <input
                  type="text"
                  value={editForm.companyName}
                  onChange={(e) => setEditForm(prev => ({ ...prev!, companyName: e.target.value }))}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Company Type</label>
                <select
                  value={editForm.companyType}
                  onChange={(e) => setEditForm(prev => ({ ...prev!, companyType: e.target.value }))}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  {COMPANY_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Company Name:</span>
                <span className="font-medium">{user.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Company Type:</span>
                <span className="font-medium capitalize">{user.companyType}</span>
              </div>
            </div>
          )}
        </div>

        {/* Roles */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-medium mb-4">User Roles</h2>
          {editing ? (
            <div className="space-y-3">
              {USER_ROLES.map(role => (
                <label key={role.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.roles.includes(role.value)}
                    onChange={() => handleRoleToggle(role.value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{role.label}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {user.roles.map(role => (
                <span
                  key={role}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full capitalize"
                >
                  {role}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Additional Information */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-medium mb-4">Additional Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Created:</span>
              <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Last Updated:</span>
              <span className="font-medium">{new Date(user.updatedAt).toLocaleDateString()}</span>
            </div>
            {user.sellerProfile && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Seller Rating:</span>
                  <span className="font-medium">{user.sellerProfile.sellerRating}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Sales:</span>
                  <span className="font-medium">{user.sellerProfile.totalSales}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Actions */}
      {editing && (
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              setEditing(false);
              setEditForm(null);
            }}
            className="px-6 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* Status Change Modal */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)}>
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">
            Confirm Status Change
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to {statusAction === 'verify' ? (user.isVerified ? 'unverify' : 'verify') : 
                                   statusAction === 'block' ? (user.isBlocked ? 'unblock' : 'block') :
                                   (user.isActive ? 'deactivate' : 'activate')} this user?
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowStatusModal(false)}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleStatusChange(statusAction!)}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
