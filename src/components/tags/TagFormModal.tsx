"use client";

import React, { useState, useEffect } from "react";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Switch from "@/components/form/switch/Switch";

interface Tag {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  category?: { _id: string; name: string };
  isSystem: boolean;
}

interface Category {
  _id: string;
  name: string;
}

interface TagFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tag?: Tag | null;
  onSaved: () => void;
  categories: Category[];
}

const TagFormModal: React.FC<TagFormModalProps> = ({
  isOpen,
  onClose,
  tag,
  onSaved,
  categories
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Tag>>({
    name: "",
    description: "",
    slug: "",
    color: "#6B7280",
    isActive: true,
    sortOrder: 0,
    category: undefined,
    isSystem: false
  });

  const predefinedColors = [
    "#6B7280", "#EF4444", "#F59E0B", "#10B981", "#3B82F6",
    "#8B5CF6", "#EC4899", "#F97316", "#06B6D4", "#84CC16"
  ];

  useEffect(() => {
    if (isOpen) {
      if (tag) {
        setFormData(tag);
      } else {
        resetForm();
      }
    }
  }, [isOpen, tag]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      slug: "",
      color: "#6B7280",
      isActive: true,
      sortOrder: 0,
      category: undefined,
      isSystem: false
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
    if (!tag) { // Only auto-generate slug for new tags
      handleInputChange("slug", generateSlug(name));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = tag ? `/api/admin/tags/${tag._id}` : "/api/admin/tags";
      const method = tag ? "PUT" : "POST";

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
        alert(data.message || "Failed to save tag");
      }
    } catch (error) {
      console.error("Error saving tag:", error);
      alert("Failed to save tag");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {tag ? "Edit Tag" : "Add New Tag"}
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
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Tag Name *</Label>
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
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe this tag..."
                  maxLength={200}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.description?.length || 0}/200 characters
                </p>
              </div>
            </div>
          </div>

          {/* Color Selection */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Color</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="color">Custom Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="color"
                    type="color"
                    value={formData.color || "#6B7280"}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                    className="w-12 h-12 border border-gray-300 rounded cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={formData.color || "#6B7280"}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                    placeholder="#6B7280"
                    className="font-mono"
                  />
                </div>
              </div>
              
              <div>
                <Label>Quick Color Selection</Label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleInputChange("color", color)}
                      className={`w-8 h-8 rounded border-2 transition-all ${
                        formData.color === color
                          ? "border-gray-800 scale-110"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Category and Settings */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={formData.category?._id || ""}
                  onChange={(e) => {
                    const categoryId = e.target.value;
                    if (categoryId) {
                      const category = categories.find(cat => cat._id === categoryId);
                      handleInputChange("category", category);
                    } else {
                      handleInputChange("category", undefined);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Global Tag (Available for all categories)</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Leave empty to make this tag available for all categories
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

              <div className="flex items-center gap-4">
                <Switch
                  label="Active"
                  defaultChecked={formData.isActive || false}
                  onChange={(checked) => handleInputChange("isActive", checked)}
                />
                <p className="text-sm text-gray-500">
                  Inactive tags won't be available for selection
                </p>
              </div>

              {tag?.isSystem && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>System Tag:</strong> This tag is managed by the system and cannot be modified.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
            <div className="flex items-center gap-3">
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                style={{ backgroundColor: formData.color + '20', color: formData.color }}
              >
                {formData.name || "Tag Name"}
              </span>
              <p className="text-sm text-gray-500">
                This is how your tag will appear
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || tag?.isSystem}>
              {loading ? "Saving..." : tag ? "Update Tag" : "Create Tag"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default TagFormModal;
