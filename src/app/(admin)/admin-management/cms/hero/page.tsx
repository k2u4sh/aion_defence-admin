"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { PencilIcon, EyeIcon, SaveIcon, XIcon } from "@/icons";

interface HeroSection {
  _id?: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  backgroundImage: string;
  heroImage: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function HeroSectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';
  
  const [heroData, setHeroData] = useState<HeroSection>({
    title: "INDIA'S DEFENCE MARKETPLACE",
    subtitle: "STRATEGIC • SECURE • SEAMLESS",
    description: "We connect OEMs, MSMEs, and component suppliers with verified buyers, enabling seamless sourcing, customized bidding, regulatory support, and enterprise SaaS integration — all under one digital roof.",
    ctaText: "LEARN MORE",
    backgroundImage: "/images/hero-background.jpg",
    heroImage: "/images/fighter-jet.jpg",
    isActive: true
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageField, setSelectedImageField] = useState<'backgroundImage' | 'heroImage' | null>(null);

  useEffect(() => {
    loadHeroSection();
  }, []);

  const loadHeroSection = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const response = await fetch('/api/cms?section=hero', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setHeroData(data.data);
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
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const response = await fetch('/api/cms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          section: 'hero',
          data: heroData
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save hero section');
      }
      
      setSuccess('Hero section saved successfully!');
      setEditing(false);
      
      // Reload data to get updated timestamps
      await loadHeroSection();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelect = (field: 'backgroundImage' | 'heroImage') => {
    setSelectedImageField(field);
    setShowImageModal(true);
  };

  const handleImageUpload = (imageUrl: string) => {
    if (selectedImageField) {
      setHeroData(prev => ({
        ...prev,
        [selectedImageField]: imageUrl
      }));
    }
    setShowImageModal(false);
    setSelectedImageField(null);
  };

  const handleInputChange = (field: keyof HeroSection, value: string | boolean) => {
    setHeroData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Hero Section...</p>
        </div>
      </div>
    );
  }

  if (isPreview) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link
                href="/admin-management/cms/hero"
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800"
              >
                ← Back to Editor
              </Link>
              <h1 className="text-lg font-medium">Hero Section Preview</h1>
            </div>
          </div>
        </div>
        
        {/* Hero Section Preview */}
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroData.backgroundImage})` }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              {heroData.title}
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-yellow-400">
              {heroData.subtitle}
            </h2>
            <p className="text-lg md:text-xl mb-10 leading-relaxed max-w-3xl mx-auto">
              {heroData.description}
            </p>
            <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 px-8 rounded-lg text-lg transition-colors">
              {heroData.ctaText}
            </button>
          </div>
          
          {/* Hero Image */}
          {heroData.heroImage && (
            <div className="absolute right-8 bottom-8 w-64 h-64">
              <img
                src={heroData.heroImage}
                alt="Hero"
                className="w-full h-full object-cover rounded-lg shadow-2xl"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Hero Section Management</h1>
          <p className="text-gray-600">Configure the main landing page hero section</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/admin-management/cms"
            className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
          >
            Back to CMS
          </Link>
          <Link
            href="/admin-management/cms/hero?preview=true"
            className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Preview
          </Link>
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

      {/* Hero Section Form */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Text Content */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Main Title *</label>
                <input
                  type="text"
                  value={heroData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  disabled={!editing}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  placeholder="Enter main title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Subtitle *</label>
                <input
                  type="text"
                  value={heroData.subtitle}
                  onChange={(e) => handleInputChange('subtitle', e.target.value)}
                  disabled={!editing}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  placeholder="Enter subtitle"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  value={heroData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={!editing}
                  rows={4}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  placeholder="Enter description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Call-to-Action Text *</label>
                <input
                  type="text"
                  value={heroData.ctaText}
                  onChange={(e) => handleInputChange('ctaText', e.target.value)}
                  disabled={!editing}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  placeholder="Enter CTA text"
                />
              </div>
              
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={heroData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    disabled={!editing}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <span className="text-sm font-medium">Active</span>
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  When active, this hero section will be displayed on the website
                </p>
              </div>
            </div>
            
            {/* Right Column - Images */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Background Image</label>
                <div className="relative">
                  <img
                    src={heroData.backgroundImage}
                    alt="Background"
                    className="w-full h-48 object-cover rounded border"
                  />
                  {editing && (
                    <button
                      onClick={() => handleImageSelect('backgroundImage')}
                      className="absolute inset-0 bg-black bg-opacity-50 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded"
                    >
                      Change Image
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={heroData.backgroundImage}
                  onChange={(e) => handleInputChange('backgroundImage', e.target.value)}
                  disabled={!editing}
                  className="w-full px-3 py-2 border rounded mt-2 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  placeholder="Image URL"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Hero Image</label>
                <div className="relative">
                  <img
                    src={heroData.heroImage}
                    alt="Hero"
                    className="w-full h-48 object-cover rounded border"
                  />
                  {editing && (
                    <button
                      onClick={() => handleImageSelect('heroImage')}
                      className="absolute inset-0 bg-black bg-opacity-50 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded"
                    >
                      Change Image
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={heroData.heroImage}
                  onChange={(e) => handleInputChange('heroImage', e.target.value)}
                  disabled={!editing}
                  className="w-full px-3 py-2 border rounded mt-2 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  placeholder="Image URL"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium mb-4">Section Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Status:</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${
              heroData.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {heroData.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          {heroData.createdAt && (
            <div>
              <span className="text-gray-500">Created:</span>
              <span className="ml-2">{new Date(heroData.createdAt).toLocaleDateString()}</span>
            </div>
          )}
          {heroData.updatedAt && (
            <div>
              <span className="text-gray-500">Last Updated:</span>
              <span className="ml-2">{new Date(heroData.updatedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Image Selection Modal */}
      <Modal isOpen={showImageModal} onClose={() => setShowImageModal(false)}>
        <div className="p-6 max-w-2xl">
          <h3 className="text-lg font-medium mb-4">Select Image</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Image URL</label>
              <input
                type="text"
                placeholder="Enter image URL"
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.target as HTMLInputElement;
                    handleImageUpload(input.value);
                  }
                }}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Enter image URL"]') as HTMLInputElement;
                  if (input && input.value) {
                    handleImageUpload(input.value);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Use Image
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
