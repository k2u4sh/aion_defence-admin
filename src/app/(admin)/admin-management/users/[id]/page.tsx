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
  company?: any;
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
  billingAddresses?: any[];
  preferences?: {
    notifications?: { email?: boolean; sms?: boolean };
    newsletter?: boolean;
    language?: string;
    timezone?: string;
  };
  subscription?: {
    currentPlan?: 'FREE' | 'GOLD' | 'PLATINUM';
    autoRenew?: boolean;
    billingCycle?: 'monthly' | 'yearly';
    planStartDate?: string;
    planEndDate?: string;
    subscriptionId?: string;
  };
}

interface EditFormData {
  firstName: string;
  lastName: string;
  email?: string;
  mobile: string;
  companyName: string;
  companyType: string;
  roles: string[];
  alternateEmail?: string;
  bio?: string;
  // New mapped fields based on schema
  addresses?: Array<{
    firstName?: string;
    lastName?: string;
    email?: string;
    mobile?: string;
    address?: string;
    street?: string;
    city: string;
    state?: string;
    country: string;
    zipCode: string;
    isDefault: boolean;
  }>;
  billingAddresses?: Array<{
    firstName?: string;
    lastName?: string;
    email?: string;
    mobile?: string;
    address?: string;
    street?: string;
    city: string;
    state?: string;
    country: string;
    zipCode: string;
    isDefault: boolean;
  }>;
  preferences?: {
    notifications?: { email?: boolean; sms?: boolean };
    newsletter?: boolean;
    language?: string;
    timezone?: string;
  };
  subscription?: {
    currentPlan?: 'FREE' | 'GOLD' | 'PLATINUM';
    autoRenew?: boolean;
    billingCycle?: 'monthly' | 'yearly';
    planStartDate?: string;
    planEndDate?: string;
    subscriptionId?: string;
  };
  sellerProfile?: {
    businessLicense?: string;
    taxId?: string;
    businessDescription?: string;
    businessAddress?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      zipCode?: string;
    };
    isVerifiedSeller?: boolean;
    sellerRating?: number;
    totalSales?: number;
    joinedAsSellerAt?: string;
  };
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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadUser();
    // Load stats
    (async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`/api/admin/users/${userId}/stats`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (res.ok) {
          const json = await res.json();
          setUser(prev => prev ? ({ ...(prev as any), __stats: json.data }) : prev);
        }
      } catch {}
    })();
  }, [userId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/users/${userId}`, {
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
      email: user.email,
      mobile: user.mobile,
      companyName: user.company?.name || user.companyName || '',
      companyType: (user.company as any)?.type || user.companyType || '',
      roles: [...user.roles],
      alternateEmail: user.alternateEmail,
      bio: user.bio,
      addresses: user.addresses || [],
      billingAddresses: (user as any).billingAddresses || [],
      preferences: (user as any).preferences || undefined,
      subscription: (user as any).subscription || undefined,
      sellerProfile: user.sellerProfile || undefined
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!editForm || !user) return;
    
    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');
      // 1) Update base user fields (exclude company)
      const { companyName, companyType, ...userPayload } = editForm;
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(userPayload)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      // 2) Update company fields through admin endpoint to keep user & company in sync
      const companyPayload = {
        companyName: companyName || '',
        companyType: companyType || '',
        company: (user as any)?.company ? {
          name: companyName || (user as any)?.company?.name || '',
          type: companyType || (user as any)?.company?.type || 'individual'
        } : undefined
      };

      await fetch(`/api/admin/users/${userId}/company`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(companyPayload)
      });
      
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

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/users/${userId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ newPassword })
      });
      
      if (!response.ok) {
        throw new Error('Failed to change password');
      }
      
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!user) return <div className="p-4">User not found</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
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
            <div className="flex space-x-3">
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit User
              </button>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Change Password
              </button>
            </div>
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
              {user.lastLogin ? new Date(user.lastLogin).toISOString().split('T')[0] : 'Never'}
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
                    value={editForm?.firstName || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev!, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name</label>
                  <input
                    type="text"
                    value={editForm?.lastName || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev!, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={editForm?.email || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev!, email: e.target.value }))}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Mobile</label>
                  <input
                    type="tel"
                    value={editForm?.mobile || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev!, mobile: e.target.value }))}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Alternate Email</label>
                <input
                  type="email"
                  value={editForm?.alternateEmail || ""}
                  onChange={(e) => setEditForm(prev => ({ ...prev!, alternateEmail: e.target.value }))}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Bio</label>
                <textarea
                  value={editForm?.bio || ""}
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
                  value={editForm?.companyName || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev!, companyName: e.target.value }))}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Company Type</label>
                <select
                  value={editForm?.companyType || ''}
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
                <span className="font-medium">{(user as any)?.company?.name || user.companyName || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Company Type:</span>
                <span className="font-medium capitalize">{(user as any)?.company?.type || user.companyType || '—'}</span>
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
                    checked={editForm?.roles.includes(role.value) || false}
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

        {/* Preferences */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-medium mb-4">Preferences</h2>
          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium mb-1">Notifications</label>
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!editForm?.preferences?.notifications?.email}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev!,
                      preferences: {
                        ...prev!.preferences,
                        notifications: {
                          ...prev!.preferences?.notifications,
                          email: e.target.checked
                        }
                      }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Email</span>
                </label>
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!editForm?.preferences?.notifications?.sms}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev!,
                      preferences: {
                        ...prev!.preferences,
                        notifications: {
                          ...prev!.preferences?.notifications,
                          sms: e.target.checked
                        }
                      }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>SMS</span>
                </label>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Newsletter</label>
                  <input
                    type="checkbox"
                    checked={!!editForm?.preferences?.newsletter}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev!,
                      preferences: { ...prev!.preferences, newsletter: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Language</label>
                  <input
                    type="text"
                    value={editForm?.preferences?.language || ''}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev!,
                      preferences: { ...prev!.preferences, language: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Timezone</label>
                  <input
                    type="text"
                    value={editForm?.preferences?.timezone || ''}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev!,
                      preferences: { ...prev!.preferences, timezone: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div>Notifications: Email {user.preferences?.notifications?.email ? 'On' : 'Off'}, SMS {user.preferences?.notifications?.sms ? 'On' : 'Off'}</div>
              <div>Newsletter: {user.preferences?.newsletter ? 'Subscribed' : 'Not Subscribed'}</div>
              <div>Language: {user.preferences?.language || '—'}</div>
              <div>Timezone: {user.preferences?.timezone || '—'}</div>
            </div>
          )}
        </div>

        {/* Subscription */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-medium mb-4">Subscription</h2>
          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Current Plan</label>
                <select
                  value={editForm?.subscription?.currentPlan || 'FREE'}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev!,
                    subscription: { ...prev!.subscription, currentPlan: e.target.value as any }
                  }))}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="FREE">FREE</option>
                  <option value="GOLD">GOLD</option>
                  <option value="PLATINUM">PLATINUM</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Billing Cycle</label>
                <select
                  value={editForm?.subscription?.billingCycle || 'monthly'}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev!,
                    subscription: { ...prev!.subscription, billingCycle: e.target.value as any }
                  }))}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!editForm?.subscription?.autoRenew}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev!,
                      subscription: { ...prev!.subscription, autoRenew: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Auto Renew</span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div>Plan: {user.subscription?.currentPlan || 'FREE'}</div>
              <div>Billing: {user.subscription?.billingCycle || 'monthly'}</div>
              <div>Auto Renew: {user.subscription?.autoRenew ? 'Yes' : 'No'}</div>
            </div>
          )}
        </div>

        {/* Seller Profile (basic) */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-medium mb-4">Seller Profile</h2>
          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Business License</label>
                <input
                  type="text"
                  value={editForm?.sellerProfile?.businessLicense || ''}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev!,
                    sellerProfile: { ...prev!.sellerProfile, businessLicense: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tax ID</label>
                <input
                  type="text"
                  value={editForm?.sellerProfile?.taxId || ''}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev!,
                    sellerProfile: { ...prev!.sellerProfile, taxId: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Business Description</label>
                <textarea
                  value={editForm?.sellerProfile?.businessDescription || ''}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev!,
                    sellerProfile: { ...prev!.sellerProfile, businessDescription: e.target.value }
                  }))}
                  rows={3}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div>Business License: {user.sellerProfile?.businessLicense || '—'}</div>
              <div>Tax ID: {user.sellerProfile?.taxId || '—'}</div>
              <div>Description: {user.sellerProfile?.businessDescription || '—'}</div>
            </div>
          )}
        </div>

      {/* Additional Information */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-medium mb-4">Additional Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Created:</span>
              <span className="font-medium">{new Date(user.createdAt).toISOString().split('T')[0]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Last Updated:</span>
              <span className="font-medium">{new Date(user.updatedAt).toISOString().split('T')[0]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Login Attempts:</span>
              <span className="font-medium">{(user as any).loginAttempts ?? 0}</span>
            </div>
            {user.sellerProfile && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Seller Rating:</span>
                  <span className="font-medium">{user.sellerProfile.sellerRating}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Sales:</span>
                  <span className="font-medium">{(user as any).__stats?.totalSales ?? user.sellerProfile.totalSales}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Rating Given (products):</span>
                  <span className="font-medium">{(user as any).__stats?.averageRatingGiven ? (user as any).__stats.averageRatingGiven.toFixed(2) : '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Rating Received (products):</span>
                  <span className="font-medium">{(user as any).__stats?.averageRatingReceived ? (user as any).__stats.averageRatingReceived.toFixed(2) : '0.00'}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-medium mb-4">Addresses</h2>
          <div className="space-y-3 text-sm">
            {Array.isArray(user.addresses) && user.addresses.length > 0 ? (
              user.addresses.map((addr, idx) => (
                <div key={idx} className="p-3 border rounded">
                  <div className="font-medium mb-1">{addr.city}, {addr.state} {addr.zipCode}</div>
                  <div className="text-gray-600">{addr.country}</div>
                  {addr.street && <div className="text-gray-600">{addr.street}</div>}
                  <div className="mt-1 text-xs">Default: {addr.isDefault ? 'Yes' : 'No'}</div>
                </div>
              ))
            ) : (
              <div className="text-gray-500">No addresses</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-medium mb-4">Billing Addresses</h2>
          <div className="space-y-3 text-sm">
            {Array.isArray((user as any).billingAddresses) && (user as any).billingAddresses.length > 0 ? (
              (user as any).billingAddresses.map((addr: any, idx: number) => (
                <div key={idx} className="p-3 border rounded">
                  <div className="font-medium mb-1">{addr.city}, {addr.state} {addr.zipCode}</div>
                  <div className="text-gray-600">{addr.country}</div>
                  {addr.street && <div className="text-gray-600">{addr.street}</div>}
                  <div className="mt-1 text-xs">Default: {addr.isDefault ? 'Yes' : 'No'}</div>
                </div>
              ))
            ) : (
              <div className="text-gray-500">No billing addresses</div>
            )}
          </div>
        </div>
      </div>

      {/* Company Details (read-only summary) */}
      <div className="bg-white p-6 rounded-lg border mt-6">
        <h2 className="text-lg font-medium mb-4">Company Details</h2>
        {((user as any).company || user.companyName) ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Company Name</div>
              <div className="font-medium">{(user as any)?.company?.name || user.companyName || '—'}</div>
            </div>
            <div>
              <div className="text-gray-600">Company Type</div>
              <div className="font-medium capitalize">{user.companyType || '—'}</div>
            </div>
            <div>
              <div className="text-gray-600">Website</div>
              <div className="font-medium">{(user as any)?.company?.website || '—'}</div>
            </div>
            <div>
              <div className="text-gray-600">Registration Number</div>
              <div className="font-medium">{(user as any)?.company?.registrationNumber || '—'}</div>
            </div>
            <div>
              <div className="text-gray-600">Year Established</div>
              <div className="font-medium">{(user as any)?.company?.yearEstablished || '—'}</div>
            </div>
            <div>
              <div className="text-gray-600">Employees</div>
              <div className="font-medium">{(user as any)?.company?.numEmployees || '—'}</div>
            </div>
            <div>
              <div className="text-gray-600">GST Number</div>
              <div className="font-medium">{(user as any)?.company?.gstNumber || '—'}</div>
            </div>
            <div>
              <div className="text-gray-600">CIN</div>
              <div className="font-medium">{(user as any)?.company?.cin || '—'}</div>
            </div>
            <div className="md:col-span-3">
              <div className="text-gray-600">Description</div>
              <div className="font-medium">{(user as any)?.company?.description || '—'}</div>
            </div>
            <div className="md:col-span-3">
              <div className="text-gray-600">GST Certificates</div>
              <div className="font-medium">
                {Array.isArray((user as any)?.company?.gstCertificates) && (user as any).company.gstCertificates.length > 0
                  ? (user as any).company.gstCertificates.join(', ')
                  : '—'}
              </div>
            </div>
            <div className="md:col-span-3">
              <div className="text-gray-600">CIN Documents</div>
              <div className="font-medium">
                {Array.isArray((user as any)?.company?.cinDocuments) && (user as any).company.cinDocuments.length > 0
                  ? (user as any).company.cinDocuments.join(', ')
                  : '—'}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-sm">No company details available</div>
        )}
      </div>

      {/* Subscription Details (extended) */}
      <div className="bg-white p-6 rounded-lg border mt-6">
        <h2 className="text-lg font-medium mb-4">Subscription Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Plan</div>
            <div className="font-medium">{(user as any)?.subscription?.currentPlan || 'FREE'}</div>
          </div>
          <div>
            <div className="text-gray-600">Billing Cycle</div>
            <div className="font-medium">{(user as any)?.subscription?.billingCycle || 'monthly'}</div>
          </div>
          <div>
            <div className="text-gray-600">Auto Renew</div>
            <div className="font-medium">{(user as any)?.subscription?.autoRenew ? 'Yes' : 'No'}</div>
          </div>
          <div>
            <div className="text-gray-600">Subscription ID</div>
            <div className="font-medium">{(user as any)?.subscription?.subscriptionId || '—'}</div>
          </div>
          <div>
            <div className="text-gray-600">Start Date</div>
            <div className="font-medium">{(user as any)?.subscription?.planStartDate ? new Date((user as any).subscription.planStartDate).toISOString().split('T')[0] : '—'}</div>
          </div>
          <div>
            <div className="text-gray-600">End Date</div>
            <div className="font-medium">{(user as any)?.subscription?.planEndDate ? new Date((user as any).subscription.planEndDate).toISOString().split('T')[0] : '—'}</div>
          </div>
        </div>
      </div>

      {/* OTP Details (read-only) */}
      <div className="bg-white p-6 rounded-lg border mt-6">
        <h2 className="text-lg font-medium mb-4">OTP (Read-only)</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Type</div>
            <div className="font-medium">{(user as any)?.otp?.type || '—'}</div>
          </div>
          <div>
            <div className="text-gray-600">Expires At</div>
            <div className="font-medium">{(user as any)?.otp?.expiresAt ? new Date((user as any).otp.expiresAt).toISOString().split('T')[0] : '—'}</div>
          </div>
          <div>
            <div className="text-gray-600">Attempts</div>
            <div className="font-medium">{(user as any)?.otp?.attempts ?? '—'}</div>
          </div>
          <div>
            <div className="text-gray-600">Used</div>
            <div className="font-medium">{(user as any)?.otp?.isUsed ? 'Yes' : 'No'}</div>
          </div>
        </div>
      </div>

      {/* Seller Profile Details (read-only) */}
      {user.sellerProfile && (
        <div className="bg-white p-6 rounded-lg border mt-6">
          <h2 className="text-lg font-medium mb-4">Seller Profile Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Business License</div>
              <div className="font-medium">{user.sellerProfile.businessLicense || '—'}</div>
            </div>
            <div>
              <div className="text-gray-600">Tax ID (TIN)</div>
              <div className="font-medium">{user.sellerProfile.taxId || '—'}</div>
            </div>
            <div className="md:col-span-3">
              <div className="text-gray-600">Business Description</div>
              <div className="font-medium">{user.sellerProfile.businessDescription || '—'}</div>
            </div>
          </div>
        </div>
      )}

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

      {/* Change Password Modal */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)}>
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">Change Password</h3>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter new password"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm new password"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowPasswordModal(false);
                setNewPassword('');
                setConfirmPassword('');
                setError(null);
              }}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleChangePassword}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
