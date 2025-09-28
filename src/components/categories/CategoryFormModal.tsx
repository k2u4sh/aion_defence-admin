"use client";

import React, { useState, useEffect } from "react";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Switch from "@/components/form/switch/Switch";

interface Category {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  level: number;
  parentCategory?: { _id: string; name: string };
  image?: string;
  icon?: string;
  metaTitle?: string;
  metaDescription?: string;
  tags?: string[];
}

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
  onSaved: () => void;
  categories: Category[];
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  category,
  onSaved,
  categories
}) => {
  const [loading, setLoading] = useState(false);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<Partial<Category>>({
    name: "",
    description: "",
    slug: "",
    isActive: true,
    sortOrder: 0,
    level: 0,
    parentCategory: undefined,
    image: "",
    icon: "",
    metaTitle: "",
    metaDescription: "",
    tags: []
  });

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setFormData(category);
      } else {
        resetForm();
      }
      fetchAllCategories();
    }
  }, [isOpen, category]);

  const fetchAllCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories?limit=100");
      const data = await response.json();
      if (data.success) {
        console.log("Fetched categories for parent dropdown:", data.data.length);
        setAllCategories(data.data);
      } else {
        console.error("Failed to fetch categories:", data.message);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      slug: "",
      isActive: true,
      sortOrder: 0,
      level: 0,
      parentCategory: undefined,
      image: "",
      icon: "",
      metaTitle: "",
      metaDescription: "",
      tags: []
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (name: string) => {
    handleInputChange("name", name);
    if (!category) { // Only auto-generate slug for new categories
      handleInputChange("slug", generateSlug(name));
    }
  };

  const getAvailableParentCategories = () => {
    if (!category) {
      console.log("Available parent categories (new category):", allCategories.length);
      return allCategories;
    }
    // Filter out the current category and its descendants to prevent circular references
    const filtered = allCategories.filter(cat => cat._id !== category._id);
    console.log("Available parent categories (edit category):", filtered.length);
    return filtered;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = category ? `/api/admin/categories/${category._id}` : "/api/admin/categories";
      const method = category ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        onSaved();
      } else {
        alert(data.message || "Failed to save category");
      }
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {category ? "Edit Category" : "Add New Category"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  type="text"
                  value={formData.slug || ""}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  placeholder="Auto-generated from name"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe this category..."
                />
              </div>
            </div>
          </div>

          {/* Parent Category */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Hierarchy</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parentCategory">Parent Category</Label>
                <select
                  id="parentCategory"
                  value={formData.parentCategory?._id || ""}
                  onChange={(e) => {
                    const parentId = e.target.value;
                    if (parentId) {
                      const parent = allCategories.find(cat => cat._id === parentId);
                      handleInputChange("parentCategory", parent);
                    } else {
                      handleInputChange("parentCategory", undefined);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Parent (Root Category)</option>
                  {getAvailableParentCategories().map(cat => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Leave empty to create a root category
                </p>
              </div>
              <div>
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder || 0}
                  onChange={(e) => handleInputChange("sortOrder", parseInt(e.target.value))}
                  placeholder="0"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Lower numbers appear first
                </p>
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Media</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  type="text"
                  value={formData.image || ""}
                  onChange={(e) => handleInputChange("image", e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <Label htmlFor="icon">Icon</Label>
                <Input
                  id="icon"
                  type="text"
                  value={formData.icon || ""}
                  onChange={(e) => handleInputChange("icon", e.target.value)}
                  placeholder="🏷️ or icon name"
                />
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">SEO</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  type="text"
                  value={formData.metaTitle || ""}
                  onChange={(e) => handleInputChange("metaTitle", e.target.value)}
                  placeholder="SEO title for search engines"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.metaTitle?.length || 0}/60 characters
                </p>
              </div>
              <div>
                <Label htmlFor="metaDescription">Meta Description</Label>
                <textarea
                  id="metaDescription"
                  value={formData.metaDescription || ""}
                  onChange={(e) => handleInputChange("metaDescription", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="SEO description for search engines"
                  maxLength={160}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.metaDescription?.length || 0}/160 characters
                </p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status</h3>
            <div className="flex items-center gap-4">
              <Switch
                label="Active"
                defaultChecked={formData.isActive || false}
                onChange={(checked) => handleInputChange("isActive", checked)}
              />
              <p className="text-sm text-gray-500">
                Inactive categories won't be visible to customers
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : category ? "Update Category" : "Create Category"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CategoryFormModal;
