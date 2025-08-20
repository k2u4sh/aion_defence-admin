"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { 
  PencilIcon, 
  TrashBinIcon, 
  EyeIcon, 
  PlusIcon, 
  GridIcon, 
  SettingsIcon,
  FileIcon,
  ImageIcon,
  TextIcon,
  LayoutIcon
} from "@/icons";

interface CMSSection {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  status: 'configured' | 'not-configured';
  lastUpdated?: string;
  count: number;
}

interface CMSDashboard {
  overview: {
    totalSections: number;
    configuredSections: number;
    completionPercentage: number;
    maintenanceMode: boolean;
  };
  sectionStatus: Record<string, any>;
}

export default function CMSManagementPage() {
  const [dashboard, setDashboard] = useState<CMSDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCMSDashboard();
  }, []);

  const loadCMSDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/cms/dashboard', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (!response.ok) {
        throw new Error('Failed to load CMS dashboard');
      }
      
      const data = await response.json();
      setDashboard(data.data);
      setMaintenanceMode(data.data.overview.maintenanceMode);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
          maintenanceMode: !maintenanceMode
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle maintenance mode');
      }
      
      setMaintenanceMode(!maintenanceMode);
      await loadCMSDashboard();
      setShowMaintenanceModal(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const cmsSections: CMSSection[] = [
    {
      id: 'hero',
      name: 'Hero Section',
      description: 'Main landing page hero with title, subtitle, and call-to-action',
      icon: <LayoutIcon width={24} height={24} />,
      route: '/admin-management/cms/hero',
      status: dashboard?.sectionStatus?.hero?.configured ? 'configured' : 'not-configured',
      lastUpdated: dashboard?.sectionStatus?.hero?.lastUpdated,
      count: dashboard?.sectionStatus?.hero?.count || 0
    },
    {
      id: 'header',
      name: 'Header & Navigation',
      description: 'Site header, logo, navigation menu, and contact information',
      icon: <TextIcon width={24} height={24} />,
      route: '/admin-management/cms/header',
      status: dashboard?.sectionStatus?.header?.configured ? 'configured' : 'not-configured',
      lastUpdated: dashboard?.sectionStatus?.header?.lastUpdated,
      count: dashboard?.sectionStatus?.header?.count || 0
    },
    {
      id: 'features',
      name: 'Features Section',
      description: 'Why Defence Cart features and benefits',
      icon: <GridIcon width={24} height={24} />,
      route: '/admin-management/cms/features',
      status: dashboard?.sectionStatus?.features?.configured ? 'configured' : 'not-configured',
      lastUpdated: dashboard?.sectionStatus?.features?.lastUpdated,
      count: dashboard?.sectionStatus?.features?.count || 0
    },
    {
      id: 'customize',
      name: 'Customize Section',
      description: 'Product customization and requirements section',
      icon: <SettingsIcon width={24} height={24} />,
      route: '/admin-management/cms/customize',
      status: dashboard?.sectionStatus?.customize?.configured ? 'configured' : 'not-configured',
      lastUpdated: dashboard?.sectionStatus?.customize?.lastUpdated,
      count: dashboard?.sectionStatus?.customize?.count || 0
    },
    {
      id: 'who-can-join',
      name: 'Who Can Join',
      description: 'User types and categories that can join the platform',
      icon: <FileIcon width={24} height={24} />,
      route: '/admin-management/cms/who-can-join',
      status: dashboard?.sectionStatus?.whoCanJoin?.configured ? 'configured' : 'not-configured',
      lastUpdated: dashboard?.sectionStatus?.whoCanJoin?.lastUpdated,
      count: dashboard?.sectionStatus?.whoCanJoin?.count || 0
    },
    {
      id: 'subscription-plans',
      name: 'Subscription Plans',
      description: 'Pricing plans and features for different user tiers',
      icon: <GridIcon width={24} height={24} />,
      route: '/admin-management/cms/subscription-plans',
      status: dashboard?.sectionStatus?.subscriptionPlans?.configured ? 'configured' : 'not-configured',
      lastUpdated: dashboard?.sectionStatus?.subscriptionPlans?.lastUpdated,
      count: dashboard?.sectionStatus?.subscriptionPlans?.count || 0
    },
    {
      id: 'footer',
      name: 'Footer',
      description: 'Site footer with links, contact info, and social media',
      icon: <LayoutIcon width={24} height={24} />,
      route: '/admin-management/cms/footer',
      status: dashboard?.sectionStatus?.footer?.configured ? 'configured' : 'not-configured',
      lastUpdated: dashboard?.sectionStatus?.footer?.lastUpdated,
      count: dashboard?.sectionStatus?.footer?.count || 0
    },
    {
      id: 'seo',
      name: 'SEO Settings',
      description: 'Search engine optimization and meta information',
      icon: <SettingsIcon width={24} height={24} />,
      route: '/admin-management/cms/seo',
      status: dashboard?.sectionStatus?.seo?.configured ? 'configured' : 'not-configured',
      lastUpdated: dashboard?.sectionStatus?.seo?.lastUpdated,
      count: dashboard?.sectionStatus?.seo?.count || 0
    },
    {
      id: 'general-settings',
      name: 'General Settings',
      description: 'Site-wide settings, colors, fonts, and maintenance mode',
      icon: <SettingsIcon width={24} height={24} />,
      route: '/admin-management/cms/general-settings',
      status: dashboard?.sectionStatus?.settings?.configured ? 'configured' : 'not-configured',
      lastUpdated: dashboard?.sectionStatus?.settings?.lastUpdated,
      count: dashboard?.sectionStatus?.settings?.count || 0
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading CMS Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Content Management System</h1>
          <p className="text-gray-600">Manage website content, sections, and settings</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowMaintenanceModal(true)}
            className={`px-4 py-2 rounded border ${
              maintenanceMode 
                ? 'bg-red-100 text-red-700 border-red-300' 
                : 'bg-green-100 text-green-700 border-green-300'
            }`}
          >
            {maintenanceMode ? 'Maintenance Mode ON' : 'Maintenance Mode OFF'}
          </button>
          <Link
            href="/admin-management/cms/upload"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <ImageIcon width={16} height={16} />
            Media Upload
          </Link>
        </div>
      </div>

      {/* Overview Stats */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">{dashboard.overview.totalSections}</div>
            <div className="text-sm text-gray-600">Total Sections</div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">{dashboard.overview.configuredSections}</div>
            <div className="text-sm text-gray-600">Configured</div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="text-2xl font-bold text-yellow-600">{dashboard.overview.completionPercentage}%</div>
            <div className="text-sm text-gray-600">Completion</div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className={`text-2xl font-bold ${maintenanceMode ? 'text-red-600' : 'text-green-600'}`}>
              {maintenanceMode ? 'ON' : 'OFF'}
            </div>
            <div className="text-sm text-gray-600">Maintenance</div>
          </div>
        </div>
      )}

      {/* CMS Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cmsSections.map((section) => (
          <div key={section.id} className="bg-white rounded-lg border overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-blue-600">
                    {section.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{section.name}</h3>
                    <p className="text-sm text-gray-500">{section.description}</p>
                  </div>
                </div>
                <div className={`px-2 py-1 text-xs rounded-full ${
                  section.status === 'configured' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {section.status === 'configured' ? 'Configured' : 'Not Configured'}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>Items: {section.count}</span>
                {section.lastUpdated && (
                  <span>Updated: {new Date(section.lastUpdated).toLocaleDateString()}</span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Link
                  href={section.route}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 text-center"
                >
                  {section.status === 'configured' ? 'Edit' : 'Configure'}
                </Link>
                <Link
                  href={`${section.route}?preview=true`}
                  className="px-3 py-2 text-blue-600 text-sm border border-blue-600 rounded hover:bg-blue-50"
                  title="Preview"
                >
                  <EyeIcon width={16} height={16} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              // Implement backup functionality
            }}
            className="p-4 border rounded-lg hover:bg-gray-50 text-left"
          >
            <div className="font-medium text-gray-900">Create Backup</div>
            <div className="text-sm text-gray-500">Backup all CMS content</div>
          </button>
          
          <button
            onClick={() => {
              // Implement restore functionality
            }}
            className="p-4 border rounded-lg hover:bg-gray-50 text-left"
          >
            <div className="font-medium text-gray-900">Restore Backup</div>
            <div className="text-sm text-gray-500">Restore from backup file</div>
          </button>
          
          <button
            onClick={() => {
              // Implement cache clear
            }}
            className="p-4 border rounded-lg hover:bg-gray-50 text-left"
          >
            <div className="font-medium text-gray-900">Clear Cache</div>
            <div className="text-sm text-gray-500">Clear CMS cache</div>
          </button>
        </div>
      </div>

      {/* Maintenance Mode Modal */}
      <Modal isOpen={showMaintenanceModal} onClose={() => setShowMaintenanceModal(false)}>
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">
            {maintenanceMode ? 'Disable' : 'Enable'} Maintenance Mode
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {maintenanceMode 
              ? 'This will disable maintenance mode and make the website accessible to users.'
              : 'This will enable maintenance mode and show a maintenance page to users.'
            }
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowMaintenanceModal(false)}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={toggleMaintenanceMode}
              disabled={saving}
              className={`px-4 py-2 rounded text-white ${
                maintenanceMode 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              } disabled:opacity-50`}
            >
              {saving ? 'Updating...' : (maintenanceMode ? 'Disable' : 'Enable')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
