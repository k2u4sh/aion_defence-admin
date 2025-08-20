"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GridIcon, SaveIcon, XIcon, PlusIcon } from "@/icons";

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  isActive: boolean;
}

interface FeaturesData {
  title: string;
  subtitle: string;
  features: Feature[];
  isActive: boolean;
}

export default function FeaturesPage() {
  const router = useRouter();
  const [featuresData, setFeaturesData] = useState<FeaturesData>({
    title: "Platform Features",
    subtitle: "Discover what makes our platform unique",
    features: [
      {
        id: "1",
        title: "Advanced Security",
        description: "Enterprise-grade security with encryption and compliance",
        icon: "🔒",
        isActive: true,
      },
      {
        id: "2",
        title: "Real-time Analytics",
        description: "Get insights with comprehensive reporting and dashboards",
        icon: "📊",
        isActive: true,
      },
      {
        id: "3",
        title: "Easy Integration",
        description: "Connect with your existing tools and workflows",
        icon: "🔗",
        isActive: true,
      },
      {
        id: "4",
        title: "24/7 Support",
        description: "Round-the-clock customer support and assistance",
        icon: "🛟",
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
    loadFeaturesData();
  }, []);

  const loadFeaturesData = async () => {
    try {
      setLoading(true);
      // Only access localStorage on the client side
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const response = await fetch('/api/cms?section=features', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setFeaturesData(data.data);
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
          section: 'features',
          data: featuresData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save features data');
      }

      setSuccess('Features data saved successfully!');
      setEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addFeature = () => {
    const newFeature: Feature = {
      id: Date.now().toString(),
      title: "",
      description: "",
      icon: "✨",
      isActive: true,
    };
    setFeaturesData(prev => ({
      ...prev,
      features: [...prev.features, newFeature]
    }));
  };

  const removeFeature = (id: string) => {
    setFeaturesData(prev => ({
      ...prev,
      features: prev.features.filter(feature => feature.id !== id)
    }));
  };

  const updateFeature = (id: string, field: keyof Feature, value: string | boolean) => {
    setFeaturesData(prev => ({
      ...prev,
      features: prev.features.map(feature => 
        feature.id === id ? { ...feature, [field]: value } : feature
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
              <GridIcon width={24} height={24} />
              Features Section
            </h1>
            <p className="text-gray-600 mt-2">Manage your platform features and capabilities</p>
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
                Edit Features
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
                value={featuresData.title}
                onChange={(e) => setFeaturesData(prev => ({ ...prev, title: e.target.value }))}
                disabled={!editing}
                placeholder="Platform Features"
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
                value={featuresData.subtitle}
                onChange={(e) => setFeaturesData(prev => ({ ...prev, subtitle: e.target.value }))}
                disabled={!editing}
                placeholder="Discover what makes our platform unique"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>

            {/* Features */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Features
                </label>
                {editing && (
                  <button
                    onClick={addFeature}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <PlusIcon width={14} height={14} />
                    Add Feature
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {featuresData.features.map((feature) => (
                  <div key={feature.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={feature.icon}
                          onChange={(e) => updateFeature(feature.id, 'icon', e.target.value)}
                          disabled={!editing}
                          placeholder="✨"
                          className="w-16 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 text-center"
                        />
                        <input
                          type="text"
                          value={feature.title}
                          onChange={(e) => updateFeature(feature.id, 'title', e.target.value)}
                          disabled={!editing}
                          placeholder="Feature Title"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                        />
                        {editing && (
                          <button
                            onClick={() => removeFeature(feature.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <XIcon width={16} height={16} />
                          </button>
                        )}
                      </div>
                      <textarea
                        value={feature.description}
                        onChange={(e) => updateFeature(feature.id, 'description', e.target.value)}
                        disabled={!editing}
                        placeholder="Feature description..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      />
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={feature.isActive}
                          onChange={(e) => updateFeature(feature.id, 'isActive', e.target.checked)}
                          disabled={!editing}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-600">Show this feature</span>
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
                  checked={featuresData.isActive}
                  onChange={(e) => setFeaturesData(prev => ({ ...prev, isActive: e.target.checked }))}
                  disabled={!editing}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">Enable Features Section</span>
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
                {/* Features Preview */}
                <section className="bg-white py-12">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                      <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        {featuresData.title}
                      </h2>
                      <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        {featuresData.subtitle}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {featuresData.features
                        .filter(feature => feature.isActive)
                        .map((feature) => (
                          <div key={feature.id} className="text-center">
                            <div className="text-4xl mb-4">{feature.icon}</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {feature.title}
                            </h3>
                            <p className="text-gray-600">
                              {feature.description}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <GridIcon width={48} height={48} className="mx-auto mb-4 text-gray-300" />
                <p>Click "Show Preview" to see how your features section will look</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
