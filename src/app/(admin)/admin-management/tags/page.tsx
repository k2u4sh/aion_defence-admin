"use client";

import React, { useState, useEffect } from "react";
import { PlusIcon, EditIcon, TrashIcon } from "@/icons";
import { useModal } from "@/hooks/useModal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import TagFormModal from "@/components/tags/TagFormModal";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";

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
  metadata: {
    totalProducts: number;
    lastUsed: string;
  };
}

interface Category {
  _id: string;
  name: string;
}

const TagsPage = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const { isOpen: isTagModalOpen, openModal: openTagModal, closeModal: closeTagModal } = useModal();
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchTags();
    fetchCategories();
  }, [selectedCategory, selectedStatus]);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: "100",
        category: selectedCategory,
        isActive: selectedStatus
      });

      const response = await fetch(`/api/admin/tags?${params}`);
      const data = await response.json();

      if (data.success) {
        setTags(data.data.tags);
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories?limit=100");
      const data = await response.json();
      if (data.success) {
        setCategories(data.data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleDeleteTag = async () => {
    if (!tagToDelete) return;

    try {
      const response = await fetch(`/api/admin/tags/${tagToDelete}`, {
        method: "DELETE"
      });

      const data = await response.json();
      if (data.success) {
        fetchTags();
        closeDeleteModal();
        setTagToDelete(null);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error deleting tag:", error);
    }
  };

  const openEditModal = (tag: Tag) => {
    setSelectedTag(tag);
    openTagModal();
  };

  const handleOpenDeleteModal = (tagId: string) => {
    setTagToDelete(tagId);
    openDeleteModal();
  };

  const handleTagSaved = () => {
    fetchTags();
    closeTagModal();
    setSelectedTag(null);
  };

  const filteredTags = tags.filter(tag => {
    if (!searchTerm) return true;
    return tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (tag.description && tag.description.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return "Global";
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : "Unknown";
  };

  const formatLastUsed = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tags</h1>
          <p className="text-gray-600">Manage product tags and organize your catalog</p>
        </div>
        <Button onClick={() => openTagModal()} className="flex items-center gap-2">
          <PlusIcon />
          Add Tag
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            <option value="global">Global</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Tags Grid */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading tags...
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No tags found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
            {filteredTags.map((tag) => (
              <div
                key={tag._id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="font-medium text-gray-900">{tag.name}</span>
                    {tag.isSystem && (
                      <Badge color="info" size="sm">System</Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(tag)}
                      className="text-indigo-600 hover:text-indigo-900 p-1"
                      disabled={tag.isSystem}
                    >
                      <EditIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal(tag._id)}
                      className="text-red-600 hover:text-red-900 p-1"
                      disabled={tag.isSystem}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {tag.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {tag.description}
                  </p>
                )}

                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <span className="font-medium">{getCategoryName(tag.category?._id)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Products:</span>
                    <span className="font-medium">{tag.metadata.totalProducts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Used:</span>
                    <span className="font-medium">{formatLastUsed(tag.metadata.lastUsed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge color={tag.isActive ? "success" : "error"}>
                      {tag.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Color:</span>
                    <div
                      className="w-6 h-6 rounded border border-gray-200"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-xs font-mono text-gray-600">{tag.color}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <TagFormModal
        isOpen={isTagModalOpen}
        onClose={closeTagModal}
        tag={selectedTag}
        onSaved={handleTagSaved}
        categories={categories}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteTag}
        title="Delete Tag"
        message="Are you sure you want to delete this tag? This action cannot be undone."
      />
    </div>
  );
};

export default TagsPage;
