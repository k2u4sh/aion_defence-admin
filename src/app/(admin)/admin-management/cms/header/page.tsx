"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LayoutIcon, SaveIcon, XIcon, CheckIcon } from "@/icons";

interface HeaderData {
  logo: string;
  companyName: string;
  navigationItems: {
    label: string;
    href: string;
    isActive: boolean;
  }[];
  contactInfo: {
    phone: string;
    email: string;
  };
  authButtons: {
    loginText: string;
    registerText: string;
  };
  searchPlaceholder: string;
  bidNowText: string;
  isActive: boolean;
}

export default function HeaderPage() {
  const router = useRouter();
  const [headerData, setHeaderData] = useState<HeaderData>({
    logo: "/images/defence-cart-logo.png",
    companyName: "DEFENCE CART",
    navigationItems: [
      { label: "Home", href: "/", isActive: true },
      { label: "About", href: "/about", isActive: true },
      { label: "Services", href: "/services", isActive: true },
      { label: "Contact", href: "/contact", isActive: true },
    ],
    contactInfo: {
      phone: "8888 444 555",
      email: "CONTACT US"
    },
    authButtons: {
      loginText: "LOGIN",
      registerText: "REGISTER NOW"
    },
    searchPlaceholder: "Search",
    bidNowText: "BID NOW",
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    loadHeaderData();
  }, []);

  const loadHeaderData = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const response = await fetch('/api/cms?section=header', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setHeaderData(data.data);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const response = await fetch('/api/cms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          action: 'upsert',
          section: 'header',
          data: headerData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save header data');
      }

      setSuccess('Header data saved successfully!');
      setEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addNavigationItem = () => {
    setHeaderData(prev => ({
      ...prev,
      navigationItems: [...prev.navigationItems, { label: "", href: "", isActive: true }]
    }));
  };

  const removeNavigationItem = (index: number) => {
    setHeaderData(prev => ({
      ...prev,
      navigationItems: prev.navigationItems.filter((_, i) => i !== index)
    }));
  };

  const updateNavigationItem = (index: number, field: string, value: string | boolean) => {
    setHeaderData(prev => ({
      ...prev,
      navigationItems: prev.navigationItems.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <LayoutIcon width={24} height={24} />
              Header & Navigation
            </h1>
            <p className="text-gray-600 mt-2">Manage your website header, logo, and navigation menu</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPreview(!preview)}
              className={`px-4 py-2 rounded-lg border ${
                preview 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : 'bg-white text-gray-700 border-gray-300'
              } hover:bg-gray-50 transition-colors`}
            >
              {preview ? 'Hide Preview' : 'Show Preview'}
            </button>
            {editing ? (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <SaveIcon width={16} height={16} />
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <XIcon width={16} height={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Header
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Edit Form */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Header Configuration</h3>
            
            {/* Logo */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo URL
              </label>
              <input
                type="text"
                value={headerData.logo}
                onChange={(e) => setHeaderData(prev => ({ ...prev, logo: e.target.value }))}
                disabled={!editing}
                placeholder="https://example.com/logo.png"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>

            {/* Company Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={headerData.companyName}
                onChange={(e) => setHeaderData(prev => ({ ...prev, companyName: e.target.value }))}
                disabled={!editing}
                placeholder="Company Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>

            {/* Navigation Items */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Navigation Menu
                </label>
                {editing && (
                  <button
                    onClick={addNavigationItem}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add Item
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {headerData.navigationItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => updateNavigationItem(index, 'label', e.target.value)}
                      disabled={!editing}
                      placeholder="Menu Label"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    />
                    <input
                      type="text"
                      value={item.href}
                      onChange={(e) => updateNavigationItem(index, 'href', e.target.value)}
                      disabled={!editing}
                      placeholder="/path"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    />
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={item.isActive}
                        onChange={(e) => updateNavigationItem(index, 'isActive', e.target.checked)}
                        disabled={!editing}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">Active</span>
                    </label>
                    {editing && (
                      <button
                        onClick={() => removeNavigationItem(index)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <XIcon width={16} height={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Information
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={headerData.contactInfo.phone}
                  onChange={(e) => setHeaderData(prev => ({ 
                    ...prev, 
                    contactInfo: { ...prev.contactInfo, phone: e.target.value }
                  }))}
                  disabled={!editing}
                  placeholder="Phone"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
                <input
                  type="text"
                  value={headerData.contactInfo.email}
                  onChange={(e) => setHeaderData(prev => ({ 
                    ...prev, 
                    contactInfo: { ...prev.contactInfo, email: e.target.value }
                  }))}
                  disabled={!editing}
                  placeholder="Email"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Authentication Buttons
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={headerData.authButtons.loginText}
                  onChange={(e) => setHeaderData(prev => ({ 
                    ...prev, 
                    authButtons: { ...prev.authButtons, loginText: e.target.value }
                  }))}
                  disabled={!editing}
                  placeholder="Login Text"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
                <input
                  type="text"
                  value={headerData.authButtons.registerText}
                  onChange={(e) => setHeaderData(prev => ({ 
                    ...prev, 
                    authButtons: { ...prev.authButtons, registerText: e.target.value }
                  }))}
                  disabled={!editing}
                  placeholder="Register Text"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>
            </div>

            {/* Search and Bid */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search and Bid
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={headerData.searchPlaceholder}
                  onChange={(e) => setHeaderData(prev => ({ ...prev, searchPlaceholder: e.target.value }))}
                  disabled={!editing}
                  placeholder="Search Placeholder"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
                <input
                  type="text"
                  value={headerData.bidNowText}
                  onChange={(e) => setHeaderData(prev => ({ ...prev, bidNowText: e.target.value }))}
                  disabled={!editing}
                  placeholder="Bid Now Text"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>
            </div>

            {/* Active Status */}
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={headerData.isActive}
                  onChange={(e) => setHeaderData(prev => ({ ...prev, isActive: e.target.checked }))}
                  disabled={!editing}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">Enable Header Section</span>
              </label>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>
            
            {preview ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Header Preview */}
                <header className="bg-white shadow-sm">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                      {/* Logo */}
                      <div className="flex-shrink-0">
                        {headerData.logo ? (
                          <img src={headerData.logo} alt="Logo" className="h-8 w-auto" />
                        ) : (
                          <div className="h-8 w-32 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-sm">
                            Logo
                          </div>
                        )}
                      </div>

                      {/* Company Name */}
                      <div className="text-xl font-bold text-gray-900">
                        {headerData.companyName}
                      </div>

                      {/* Navigation */}
                      <nav className="hidden md:flex space-x-8">
                        {headerData.navigationItems
                          .filter(item => item.isActive)
                          .map((item, index) => (
                            <a
                              key={index}
                              href={item.href}
                              className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                            >
                              {item.label}
                            </a>
                          ))}
                      </nav>

                      {/* Contact Info */}
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{headerData.contactInfo.phone}</span>
                        <span>{headerData.contactInfo.email}</span>
                      </div>

                      {/* Auth Buttons */}
                      <div className="flex items-center space-x-3">
                        <button className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                          {headerData.authButtons.loginText}
                        </button>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                          {headerData.authButtons.registerText}
                        </button>
                      </div>

                      {/* Search and Bid */}
                      <div className="flex items-center space-x-3">
                        <input
                          type="text"
                          placeholder={headerData.searchPlaceholder}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                          {headerData.bidNowText}
                        </button>
                      </div>
                    </div>
                  </div>
                </header>

                {/* Content Preview */}
                <div className="p-8 bg-gray-50">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Header Preview
                    </h2>
                    <p className="text-gray-600">
                      This is how your header will appear on your website.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <LayoutIcon width={48} height={48} className="mx-auto mb-4 text-gray-300" />
                <p>Click "Show Preview" to see how your header will look</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
