"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SettingsIcon, SaveIcon, XIcon, PlusIcon } from "@/icons";

interface CustomizationOption {
  id: string;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
}

interface CustomizeData {
  title: string;
  subtitle: string;
  description: string;
  options: CustomizationOption[];
  isActive: boolean;
}

export default function CustomizePage() {
  const router = useRouter();
  const [customizeData, setCustomizeData] = useState<CustomizeData>({
    title: "Customize Your Experience",
    subtitle: "Tailor our platform to your specific needs",
    description: "Choose from a variety of customization options to make our platform work exactly how you need it to.",
    options: [
      {
        id: "1",
        name: "Custom Branding",
        description: "Add your company logo, colors, and branding throughout the platform",
        price: 99,
        isActive: true,
      },
      {
        id: "2",
        name: "Advanced Analytics",
        description: "Get detailed insights and custom reporting capabilities",
        price: 149,
        isActive: true,
      },
      {
        id: "3",
        name: "API Access",
        description: "Integrate with your existing systems via our robust API",
        price: 199,
        isActive: true,
      },
    ],
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    loadCustomizeData();
  }, []);

  const loadCustomizeData = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const response = await fetch('/api/cms?section=customize', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setCustomizeData(data.data);
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
          section: 'customize',
          data: customizeData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save customization data');
      }

      setSuccess('Customization data saved successfully!');
      setEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addOption = () => {
    const newOption: CustomizationOption = {
      id: Date.now().toString(),
      name: "",
      description: "",
      price: 0,
      isActive: true,
    };
    setCustomizeData(prev => ({
      ...prev,
      options: [...prev.options, newOption]
    }));
  };

  const removeOption = (id: string) => {
    setCustomizeData(prev => ({
      ...prev,
      options: prev.options.filter(option => option.id !== id)
    }));
  };

  const updateOption = (id: string, field: keyof CustomizationOption, value: string | number | boolean) => {
    setCustomizeData(prev => ({
      ...prev,
      options: prev.options.map(option => 
        option.id === id ? { ...option, [field]: value } : option
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
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <SettingsIcon width={24} height={24} />
              Customize Section
            </h1>
            <p className="text-gray-600 mt-2">Manage product customization options and pricing</p>
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
                Edit Customization
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Section Configuration</h3>
            
            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section Title
              </label>
              <input
                type="text"
                value={customizeData.title}
                onChange={(e) => setCustomizeData(prev => ({ ...prev, title: e.target.value }))}
                disabled={!editing}
                placeholder="Customize Your Experience"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>

            {/* Subtitle */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section Subtitle
              </label>
              <input
                type="text"
                value={customizeData.subtitle}
                onChange={(e) => setCustomizeData(prev => ({ ...prev, subtitle: e.target.value }))}
                disabled={!editing}
                placeholder="Tailor our platform to your specific needs"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section Description
              </label>
              <textarea
                value={customizeData.description}
                onChange={(e) => setCustomizeData(prev => ({ ...prev, description: e.target.value }))}
                disabled={!editing}
                placeholder="Choose from a variety of customization options..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>

            {/* Customization Options */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Customization Options
                </label>
                {editing && (
                  <button
                    onClick={addOption}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <PlusIcon width={14} height={14} />
                    Add Option
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {customizeData.options.map((option) => (
                  <div key={option.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={option.name}
                          onChange={(e) => updateOption(option.id, 'name', e.target.value)}
                          disabled={!editing}
                          placeholder="Option Name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                        />
                        <input
                          type="number"
                          value={option.price}
                          onChange={(e) => updateOption(option.id, 'price', parseFloat(e.target.value) || 0)}
                          disabled={!editing}
                          placeholder="0"
                          min="0"
                          step="0.01"
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                        />
                        {editing && (
                          <button
                            onClick={() => removeOption(option.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <XIcon width={16} height={16} />
                          </button>
                        )}
                      </div>
                      <textarea
                        value={option.description}
                        onChange={(e) => updateOption(option.id, 'description', e.target.value)}
                        disabled={!editing}
                        placeholder="Option description..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      />
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={option.isActive}
                          onChange={(e) => updateOption(option.id, 'isActive', e.target.checked)}
                          disabled={!editing}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-600">Show this option</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Status */}
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={customizeData.isActive}
                  onChange={(e) => setCustomizeData(prev => ({ ...prev, isActive: e.target.checked }))}
                  disabled={!editing}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">Enable Customization Section</span>
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
                {/* Customize Preview */}
                <section className="bg-white py-12">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                      <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        {customizeData.title}
                      </h2>
                      <p className="text-xl text-gray-600 mb-4">
                        {customizeData.subtitle}
                      </p>
                      <p className="text-gray-600 max-w-3xl mx-auto">
                        {customizeData.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {customizeData.options
                        .filter(option => option.isActive)
                        .map((option) => (
                          <div key={option.id} className="border border-gray-200 rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {option.name}
                            </h3>
                            <p className="text-gray-600 mb-4">
                              {option.description}
                            </p>
                            <div className="text-2xl font-bold text-blue-600">
                              ${option.price}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <SettingsIcon width={48} height={48} className="mx-auto mb-4 text-gray-300" />
                <p>Click "Show Preview" to see how your customization section will look</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
