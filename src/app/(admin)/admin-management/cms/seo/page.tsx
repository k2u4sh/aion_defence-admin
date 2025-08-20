"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SettingsIcon, SaveIcon, XIcon, EyeIcon } from "@/icons";

interface SEOSettings {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  canonicalUrl: string;
  robots: string;
  isActive: boolean;
}

export default function SEOPage() {
  const router = useRouter();
  const [seoSettings, setSeoSettings] = useState<SEOSettings>({
    metaTitle: "Aion Defence - Advanced Security Solutions",
    metaDescription: "Professional security and defence solutions for modern businesses. Advanced analytics, real-time monitoring, and comprehensive protection.",
    keywords: ["security", "defence", "analytics", "monitoring", "protection"],
    ogTitle: "Aion Defence - Advanced Security Solutions",
    ogDescription: "Professional security and defence solutions for modern businesses.",
    ogImage: "",
    twitterCard: "summary_large_image",
    twitterTitle: "Aion Defence - Advanced Security Solutions",
    twitterDescription: "Professional security and defence solutions for modern businesses.",
    twitterImage: "",
    canonicalUrl: "https://aiondefence.com",
    robots: "index, follow",
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");

  useEffect(() => {
    loadSEOSettings();
  }, []);

  const loadSEOSettings = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const response = await fetch('/api/cms?section=seo', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSeoSettings(data.data);
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
          section: 'seo',
          data: seoSettings
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save SEO settings');
      }

      setSuccess('SEO settings saved successfully!');
      setEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !seoSettings.keywords.includes(newKeyword.trim())) {
      setSeoSettings(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }));
      setNewKeyword("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setSeoSettings(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
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
              SEO Settings
            </h1>
            <p className="text-gray-600 mt-2">Manage search engine optimization and social media meta tags</p>
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
              <EyeIcon width={16} height={16} />
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
                Edit SEO Settings
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
          {/* Basic SEO */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic SEO</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Title
              </label>
              <input
                type="text"
                value={seoSettings.metaTitle}
                onChange={(e) => setSeoSettings(prev => ({ ...prev, metaTitle: e.target.value }))}
                disabled={!editing}
                placeholder="Page title for search engines"
                maxLength={60}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                {seoSettings.metaTitle.length}/60 characters
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Description
              </label>
              <textarea
                value={seoSettings.metaDescription}
                onChange={(e) => setSeoSettings(prev => ({ ...prev, metaDescription: e.target.value }))}
                disabled={!editing}
                placeholder="Page description for search engines"
                rows={3}
                maxLength={160}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                {seoSettings.metaDescription.length}/160 characters
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keywords
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  disabled={!editing}
                  placeholder="Add keyword"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                />
                {editing && (
                  <button
                    onClick={addKeyword}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {seoSettings.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {keyword}
                    {editing && (
                      <button
                        onClick={() => removeKeyword(keyword)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <XIcon width={12} height={12} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Canonical URL
              </label>
              <input
                type="url"
                value={seoSettings.canonicalUrl}
                onChange={(e) => setSeoSettings(prev => ({ ...prev, canonicalUrl: e.target.value }))}
                disabled={!editing}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Robots Directive
              </label>
              <select
                value={seoSettings.robots}
                onChange={(e) => setSeoSettings(prev => ({ ...prev, robots: e.target.value }))}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              >
                <option value="index, follow">Index, Follow</option>
                <option value="noindex, follow">No Index, Follow</option>
                <option value="index, nofollow">Index, No Follow</option>
                <option value="noindex, nofollow">No Index, No Follow</option>
              </select>
            </div>
          </div>

          {/* Open Graph */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Open Graph (Facebook/LinkedIn)</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OG Title
              </label>
              <input
                type="text"
                value={seoSettings.ogTitle}
                onChange={(e) => setSeoSettings(prev => ({ ...prev, ogTitle: e.target.value }))}
                disabled={!editing}
                placeholder="Title for social media sharing"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OG Description
              </label>
              <textarea
                value={seoSettings.ogDescription}
                onChange={(e) => setSeoSettings(prev => ({ ...prev, ogDescription: e.target.value }))}
                disabled={!editing}
                placeholder="Description for social media sharing"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OG Image URL
              </label>
              <input
                type="url"
                value={seoSettings.ogImage}
                onChange={(e) => setSeoSettings(prev => ({ ...prev, ogImage: e.target.value }))}
                disabled={!editing}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>
          </div>

          {/* Twitter Card */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Twitter Card</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Twitter Card Type
              </label>
              <select
                value={seoSettings.twitterCard}
                onChange={(e) => setSeoSettings(prev => ({ ...prev, twitterCard: e.target.value }))}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              >
                <option value="summary">Summary</option>
                <option value="summary_large_image">Summary Large Image</option>
                <option value="app">App</option>
                <option value="player">Player</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Twitter Title
              </label>
              <input
                type="text"
                value={seoSettings.twitterTitle}
                onChange={(e) => setSeoSettings(prev => ({ ...prev, twitterTitle: e.target.value }))}
                disabled={!editing}
                placeholder="Title for Twitter sharing"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Twitter Description
              </label>
              <textarea
                value={seoSettings.twitterDescription}
                onChange={(e) => setSeoSettings(prev => ({ ...prev, twitterDescription: e.target.value }))}
                disabled={!editing}
                placeholder="Description for Twitter sharing"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Twitter Image URL
              </label>
              <input
                type="url"
                value={seoSettings.twitterImage}
                onChange={(e) => setSeoSettings(prev => ({ ...prev, twitterImage: e.target.value }))}
                disabled={!editing}
                placeholder="https://example.com/twitter-image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={seoSettings.isActive}
                onChange={(e) => setSeoSettings(prev => ({ ...prev, isActive: e.target.checked }))}
                disabled={!editing}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">Enable SEO Settings</span>
            </label>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>
            
            {preview ? (
              <div className="space-y-6">
                {/* Search Result Preview */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-4 border-b border-gray-200">
                    <h4 className="font-medium text-gray-900">Google Search Result Preview</h4>
                  </div>
                  <div className="p-4">
                    <div className="text-blue-600 text-sm mb-1">{seoSettings.canonicalUrl}</div>
                    <div className="text-xl text-blue-800 font-medium mb-1">
                      {seoSettings.metaTitle || "Page Title"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {seoSettings.metaDescription || "Page description will appear here..."}
                    </div>
                  </div>
                </div>

                {/* Social Media Preview */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-4 border-b border-gray-200">
                    <h4 className="font-medium text-gray-900">Social Media Preview</h4>
                  </div>
                  <div className="p-4">
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {seoSettings.ogImage ? (
                        <img src={seoSettings.ogImage} alt="OG Image" className="w-full h-32 object-cover" />
                      ) : (
                        <div className="w-full h-32 bg-gray-200 flex items-center justify-center text-gray-500">
                          No image set
                        </div>
                      )}
                      <div className="p-3">
                        <div className="text-sm text-gray-500 mb-1">aiondefence.com</div>
                        <div className="font-medium text-gray-900 mb-1">
                          {seoSettings.ogTitle || "Page Title"}
                        </div>
                        <div className="text-sm text-gray-600">
                          {seoSettings.ogDescription || "Page description..."}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Meta Tags Preview */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-4 border-b border-gray-200">
                    <h4 className="font-medium text-gray-900">Generated Meta Tags</h4>
                  </div>
                  <div className="p-4 bg-gray-900 text-green-400 font-mono text-xs overflow-x-auto">
                    <div>&lt;title&gt;{seoSettings.metaTitle}&lt;/title&gt;</div>
                    <div>&lt;meta name="description" content="{seoSettings.metaDescription}" /&gt;</div>
                    <div>&lt;meta name="keywords" content="{seoSettings.keywords.join(', ')}" /&gt;</div>
                    <div>&lt;meta name="robots" content="{seoSettings.robots}" /&gt;</div>
                    <div>&lt;link rel="canonical" href="{seoSettings.canonicalUrl}" /&gt;</div>
                    <div>&lt;meta property="og:title" content="{seoSettings.ogTitle}" /&gt;</div>
                    <div>&lt;meta property="og:description" content="{seoSettings.ogDescription}" /&gt;</div>
                    <div>&lt;meta property="og:image" content="{seoSettings.ogImage}" /&gt;</div>
                    <div>&lt;meta name="twitter:card" content="{seoSettings.twitterCard}" /&gt;</div>
                    <div>&lt;meta name="twitter:title" content="{seoSettings.twitterTitle}" /&gt;</div>
                    <div>&lt;meta name="twitter:description" content="{seoSettings.twitterDescription}" /&gt;</div>
                    <div>&lt;meta name="twitter:image" content="{seoSettings.twitterImage}" /&gt;</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <EyeIcon width={48} height={48} className="mx-auto mb-4 text-gray-300" />
                <p>Click "Show Preview" to see how your SEO settings will appear</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
