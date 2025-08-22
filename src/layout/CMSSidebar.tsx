"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutIcon, 
  TextIcon, 
  GridIcon, 
  SettingsIcon, 
  FileIcon, 
  ImageIcon,
  UploadIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  BoxIconLine,
  UserIcon,
  DollarLineIcon
} from "@/icons";

interface CMSSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CMSNavItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  children?: CMSNavItem[];
}

const cmsNavItems: CMSNavItem[] = [
  {
    id: 'overview',
    name: 'Dashboard Overview',
    description: 'Main dashboard and metrics',
    icon: <LayoutIcon width={20} height={20} />,
    href: '/admin-management/cms'
  },
  {
    id: 'orders',
    name: 'Orders Management',
    description: 'Manage customer orders',
    icon: <BoxIconLine width={20} height={20} />,
    href: '/admin-management/cms/orders',
    children: [
      {
        id: 'all-orders',
        name: 'All Orders',
        description: 'View and manage orders',
        icon: <BoxIconLine width={16} height={16} />,
        href: '/admin-management/cms/orders'
      },
      {
        id: 'order-status',
        name: 'Order Status',
        description: 'Track order progress',
        icon: <EyeIcon width={16} height={16} />,
        href: '/admin-management/cms/orders/status'
      },
      {
        id: 'returns',
        name: 'Returns & Refunds',
        description: 'Handle returns',
        icon: <SettingsIcon width={16} height={16} />,
        href: '/admin-management/cms/orders/returns'
      }
    ]
  },
  {
    id: 'products',
    name: 'Products Management',
    description: 'Manage product catalog',
    icon: <GridIcon width={20} height={20} />,
    href: '/admin-management/cms/products',
    children: [
      {
        id: 'all-products',
        name: 'All Products',
        description: 'View and manage products',
        icon: <GridIcon width={16} height={16} />,
        href: '/admin-management/cms/products'
      },
      {
        id: 'add-product',
        name: 'Add Product',
        description: 'Create new product',
        icon: <PlusIcon width={16} height={16} />,
        href: '/admin-management/cms/products/add'
      },
      {
        id: 'categories',
        name: 'Categories',
        description: 'Manage product categories',
        icon: <FileIcon width={16} height={16} />,
        href: '/admin-management/cms/products/categories'
      },
      {
        id: 'inventory',
        name: 'Inventory',
        description: 'Stock management',
        icon: <BoxIconLine width={16} height={16} />,
        href: '/admin-management/cms/products/inventory'
      }
    ]
  },
  {
    id: 'users',
    name: 'Users Management',
    description: 'Manage user accounts',
    icon: <UserIcon width={20} height={20} />,
    href: '/admin-management/cms/users',
    children: [
      {
        id: 'all-users',
        name: 'All Users',
        description: 'View and manage users',
        icon: <UserIcon width={16} height={16} />,
        href: '/admin-management/cms/users'
      },
      {
        id: 'add-user',
        name: 'Add User',
        description: 'Create new user account',
        icon: <PlusIcon width={16} height={16} />,
        href: '/admin-management/cms/users/add'
      },
      {
        id: 'user-roles',
        name: 'User Roles',
        description: 'Manage permissions',
        icon: <SettingsIcon width={16} height={16} />,
        href: '/admin-management/cms/users/roles'
      },
      {
        id: 'onboarding',
        name: 'User Onboarding',
        description: 'New user setup',
        icon: <EyeIcon width={16} height={16} />,
        href: '/admin-management/cms/users/onboarding'
      }
    ]
  },
  {
    id: 'payments',
    name: 'Payments & Finance',
    description: 'Manage payments and revenue',
    icon: <DollarLineIcon width={20} height={20} />,
    href: '/admin-management/cms/payments',
    children: [
      {
        id: 'all-payments',
        name: 'All Payments',
        description: 'View payment transactions',
        icon: <DollarLineIcon width={16} height={16} />,
        href: '/admin-management/cms/payments'
      },
      {
        id: 'payment-methods',
        name: 'Payment Methods',
        description: 'Configure payment options',
        icon: <SettingsIcon width={16} height={16} />,
        href: '/admin-management/cms/payments/methods'
      },
      {
        id: 'refunds',
        name: 'Refunds',
        description: 'Process refunds',
        icon: <SettingsIcon width={16} height={16} />,
        href: '/admin-management/cms/payments/refunds'
      },
      {
        id: 'financial-reports',
        name: 'Financial Reports',
        description: 'Revenue analytics',
        icon: <GridIcon width={16} height={16} />,
        href: '/admin-management/cms/payments/reports'
      }
    ]
  },
  {
    id: 'content',
    name: 'Content Sections',
    description: 'Manage website content',
    icon: <TextIcon width={20} height={20} />,
    href: '/admin-management/cms/content',
    children: [
      {
        id: 'hero',
        name: 'Hero Section',
        description: 'Landing page hero',
        icon: <LayoutIcon width={16} height={16} />,
        href: '/admin-management/cms/hero'
      },
      {
        id: 'header',
        name: 'Header & Navigation',
        description: 'Site header and menu',
        icon: <TextIcon width={16} height={16} />,
        href: '/admin-management/cms/header'
      },
      {
        id: 'features',
        name: 'Features Section',
        description: 'Platform features',
        icon: <GridIcon width={16} height={16} />,
        href: '/admin-management/cms/features'
      },
      {
        id: 'customize',
        name: 'Customize Section',
        description: 'Product customization',
        icon: <SettingsIcon width={16} height={16} />,
        href: '/admin-management/cms/customize'
      },
      {
        id: 'who-can-join',
        name: 'Who Can Join',
        description: 'User categories',
        icon: <FileIcon width={16} height={16} />,
        href: '/admin-management/cms/who-can-join'
      },
      {
        id: 'subscription-plans',
        name: 'Subscription Plans',
        description: 'Pricing plans',
        icon: <GridIcon width={16} height={16} />,
        href: '/admin-management/cms/subscription-plans'
      },
      {
        id: 'footer',
        name: 'Footer',
        description: 'Site footer',
        icon: <LayoutIcon width={16} height={16} />,
        href: '/admin-management/cms/footer'
      }
    ]
  },
  {
    id: 'media',
    name: 'Media Management',
    description: 'Files and assets',
    icon: <ImageIcon width={20} height={20} />,
    href: '/admin-management/cms/upload'
  },
  {
    id: 'settings',
    name: 'CMS Settings',
    description: 'Configuration',
    icon: <SettingsIcon width={20} height={20} />,
    href: '/admin-management/cms/settings',
    children: [
      {
        id: 'seo',
        name: 'SEO Settings',
        description: 'Search optimization',
        icon: <SettingsIcon width={16} height={16} />,
        href: '/admin-management/cms/seo'
      },
      {
        id: 'general-settings',
        name: 'General Settings',
        description: 'Site configuration',
        icon: <SettingsIcon width={16} height={16} />,
        href: '/admin-management/cms/general-settings'
      }
    ]
  }
];

export default function CMSSidebar({ isOpen, onClose }: CMSSidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const isActive = (href: string) => {
    if (href === '/admin-management/cms') {
      return pathname === href || pathname.startsWith('/admin-management/cms/');
    }
    return pathname === href;
  };

  const isChildActive = (children: CMSNavItem[]) => {
    return children.some(child => pathname === child.href);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="relative flex h-full w-80 flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <LayoutIcon width={20} height={20} className="text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">CMS Management</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {cmsNavItems.map((item) => (
            <div key={item.id}>
              {/* Main Item */}
              <div className="space-y-1">
                <Link
                  href={item.href}
                  className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-3 flex h-5 w-5 items-center justify-center">
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.name}</span>
                  {item.children && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleSection(item.id);
                      }}
                      className="ml-auto rounded p-1 hover:bg-gray-200"
                    >
                      <svg
                        className={`h-4 w-4 transition-transform ${
                          expandedSections.has(item.id) ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </Link>
                
                {/* Description */}
                <p className="ml-11 text-xs text-gray-500">{item.description}</p>
              </div>

              {/* Children */}
              {item.children && expandedSections.has(item.id) && (
                <div className="ml-6 mt-2 space-y-1 border-l border-gray-200 pl-4">
                  {item.children.map((child) => (
                    <Link
                      key={child.id}
                      href={child.href}
                      className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        isActive(child.href)
                          ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className="mr-3 flex h-4 w-4 items-center justify-center">
                        {child.icon}
                      </span>
                      <span className="flex-1">{child.name}</span>
                      {isActive(child.href) && (
                        <div className="ml-auto">
                          <div className="h-2 w-2 rounded-full bg-blue-600" />
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <span>CMS System Active</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Manage your website content and settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
