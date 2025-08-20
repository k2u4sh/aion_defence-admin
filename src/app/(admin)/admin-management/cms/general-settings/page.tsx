"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { PencilIcon, SaveIcon, EyeIcon, SettingsIcon } from "@/icons";

interface GeneralSettings {
  _id?: string;
  siteName: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    border: string;
  };
  fonts: {
    primary: string;
    secondary: string;
  };
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const FONT_OPTIONS = [
  'Roboto',
  'Open Sans',
  'Lato',
  'Poppins',
  'Inter',
  'Montserrat',
  'Source Sans Pro',
  'Roboto Condensed',
  'Nunito',
  'Ubuntu'
];

export default function GeneralSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<GeneralSettings>({
    siteName: "Defence Cart",
    maintenanceMode: false,
    maintenanceMessage: "We are currently under maintenance. Please check back soon.",
    colors: {
      primary: "#DCB13A",
      secondary: "#95A059",
      accent: "#E2E2E2",
      background: "#000000",
      border: "#313131"
    },
    fonts: {
      primary: "Roboto",
      secondary: "Roboto Condensed"
    },
    isActive: true
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);

  useEffect(() => {
    loadGeneralSettings();
  }, []);

  const loadGeneralSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/cms?section=settings', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setSettings(data.data);
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
      setError(null);
      setSuccess(null);
      
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/cms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          section: 'settings',
          data: settings
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save general settings');
      }
      
      setSuccess('General settings saved successfully!');
      setEditing(false);
      
      // Reload data to get updated timestamps
      await loadGeneralSettings();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof GeneralSettings, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleColorChange = (colorField: keyof GeneralSettings['colors'], value: string) => {
    setSettings(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorField]: value
      }
    }));
  };

  const handleFontChange = (fontField: keyof GeneralSettings['fonts'], value: string) => {
    setSettings(prev => ({
      ...prev,
      fonts: {
        ...prev.fonts,
        [fontField]: value
      }
    }));
  };

  const toggleMaintenanceMode = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/cms/dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          action: 'toggle-maintenance',
          maintenanceMode: !settings.maintenanceMode
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle maintenance mode');
      }
      
      handleInputChange('maintenanceMode', !settings.maintenanceMode);
      await loadGeneralSettings();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading General Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">General Settings</h1>
          <p className="text-gray-600">Configure site-wide settings and appearance</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/admin-management/cms"
            className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
          >
            Back to CMS
          </Link>
          <button
            onClick={() => setShowPreviewModal(true)}
            className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Preview
          </button>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <PencilIcon width={16} height={16} />
              Edit
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <SaveIcon width={16} height={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded text-green-700">
          {success}
        </div>
      )}

      {/* Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Basic Settings */}
        <div className="space-y-6">
          {/* Site Information */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-medium mb-4">Site Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Site Name *</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => handleInputChange('siteName', e.target.value)}
                  disabled={!editing}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  placeholder="Enter site name"
                />
              </div>
              
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    disabled={!editing}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <span className="text-sm font-medium">Site Active</span>
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  When disabled, the entire site will be inaccessible
                </p>
              </div>
            </div>
          </div>

          {/* Maintenance Mode */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-medium mb-4">Maintenance Mode</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={toggleMaintenanceMode}
                      disabled={saving}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500 disabled:opacity-50"
                    />
                    <span className="text-sm font-medium">Enable Maintenance Mode</span>
                  </label>
                  <p className="text-sm text-gray-500 mt-1">
                    When enabled, users will see a maintenance page
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs rounded-full ${
                  settings.maintenanceMode ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {settings.maintenanceMode ? 'ON' : 'OFF'}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Maintenance Message</label>
                <textarea
                  value={settings.maintenanceMessage}
                  onChange={(e) => handleInputChange('maintenanceMessage', e.target.value)}
                  disabled={!editing}
                  rows={3}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  placeholder="Enter maintenance message"
                />
              </div>
            </div>
          </div>

          {/* Fonts */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-medium mb-4">Typography</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Primary Font</label>
                <select
                  value={settings.fonts.primary}
                  onChange={(e) => handleFontChange('primary', e.target.value)}
                  disabled={!editing}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                >
                  {FONT_OPTIONS.map(font => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Secondary Font</label>
                <select
                  value={settings.fonts.secondary}
                  onChange={(e) => handleFontChange('secondary', e.target.value)}
                  disabled={!editing}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                >
                  {FONT_OPTIONS.map(font => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Colors */}
        <div className="space-y-6">
          {/* Color Scheme */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-medium mb-4">Color Scheme</h3>
            <div className="space-y-4">
              {Object.entries(settings.colors).map(([colorKey, colorValue]) => (
                <div key={colorKey}>
                  <label className="block text-sm font-medium mb-2 capitalize">
                    {colorKey.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div
                        className="w-12 h-12 rounded border cursor-pointer"
                        style={{ backgroundColor: colorValue }}
                        onClick={() => setShowColorPicker(colorKey)}
                      ></div>
                      {showColorPicker === colorKey && (
                        <div className="absolute z-10 mt-2">
                          <input
                            type="color"
                            value={colorValue}
                            onChange={(e) => handleColorChange(colorKey as keyof GeneralSettings['colors'], e.target.value)}
                            className="w-12 h-12 border-0 rounded cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      value={colorValue}
                      onChange={(e) => handleColorChange(colorKey as keyof GeneralSettings['colors'], e.target.value)}
                      disabled={!editing}
                      className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 font-mono text-sm"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Color Preview */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-medium mb-4">Color Preview</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded" style={{ backgroundColor: settings.colors.primary }}></div>
                <span className="text-sm">Primary - {settings.colors.primary}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded" style={{ backgroundColor: settings.colors.secondary }}></div>
                <span className="text-sm">Secondary - {settings.colors.secondary}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded" style={{ backgroundColor: settings.colors.accent }}></div>
                <span className="text-sm">Accent - {settings.colors.accent}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded border" style={{ backgroundColor: settings.colors.background }}></div>
                <span className="text-sm">Background - {settings.colors.background}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded" style={{ backgroundColor: settings.colors.border }}></div>
                <span className="text-sm">Border - {settings.colors.border}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium mb-4">Settings Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Status:</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${
              settings.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {settings.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          {settings.createdAt && (
            <div>
              <span className="text-gray-500">Created:</span>
              <span className="ml-2">{new Date(settings.createdAt).toLocaleDateString()}</span>
            </div>
          )}
          {settings.updatedAt && (
            <div>
              <span className="text-gray-500">Last Updated:</span>
              <span className="ml-2">{new Date(settings.updatedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <Modal isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)}>
        <div className="p-6 max-w-4xl">
          <h3 className="text-lg font-medium mb-4">Settings Preview</h3>
          
          <div className="space-y-6">
            {/* Site Header Preview */}
            <div className="border rounded-lg overflow-hidden">
              <div 
                className="p-4 text-center"
                style={{ backgroundColor: settings.colors.background }}
              >
                <h1 
                  className="text-2xl font-bold mb-2"
                  style={{ 
                    color: settings.colors.primary,
                    fontFamily: settings.fonts.primary
                  }}
                >
                  {settings.siteName}
                </h1>
                <p 
                  className="text-sm"
                  style={{ 
                    color: settings.colors.secondary,
                    fontFamily: settings.fonts.secondary
                  }}
                >
                  Strategic • Secure • Seamless
                </p>
              </div>
            </div>

            {/* Color Palette Preview */}
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(settings.colors).map(([colorKey, colorValue]) => (
                <div key={colorKey} className="text-center">
                  <div
                    className="w-16 h-16 rounded mx-auto mb-2 border"
                    style={{ backgroundColor: colorValue }}
                  ></div>
                  <div className="text-xs font-medium capitalize">
                    {colorKey.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    {colorValue}
                  </div>
                </div>
              ))}
            </div>

            {/* Typography Preview */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Typography Preview</h4>
              <div className="space-y-2">
                <h1 
                  className="text-2xl"
                  style={{ fontFamily: settings.fonts.primary }}
                >
                  Primary Font: {settings.fonts.primary}
                </h1>
                <h2 
                  className="text-lg"
                  style={{ fontFamily: settings.fonts.secondary }}
                >
                  Secondary Font: {settings.fonts.secondary}
                </h2>
                <p style={{ fontFamily: settings.fonts.primary }}>
                  This is a sample paragraph using the primary font to demonstrate how text will appear on your website.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setShowPreviewModal(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close Preview
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
