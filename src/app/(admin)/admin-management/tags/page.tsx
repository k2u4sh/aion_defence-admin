"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PlusIcon, EditIcon, TrashIcon, EyeIcon, FilterIcon, TagIcon, CheckCircleIcon, AlertTriangleIcon } from "@/icons";
import { useModal } from "@/hooks/useModal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import TagFormModal from "@/components/tags/TagFormModal";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import ResponsiveTable from "@/components/tables/ResponsiveTable";
import UnifiedPagination from "@/components/common/UnifiedPagination";

interface Tag {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  category?: { _id: string; name: string };
  isSystem: boolean;
  usageCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface TagStats {
  totalTags: number;
  activeTags: number;
  inactiveTags: number;
}

const TagsPage = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [stats, setStats] = useState<TagStats>({
    totalTags: 0,
    activeTags: 0,
    inactiveTags: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Modals
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const { isOpen: isTagModalOpen, openModal: openTagModal, closeModal: closeTagModal } = useModal();
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetchTags();
  }, [currentPage, debouncedSearch, statusFilter, colorFilter, sortBy, sortOrder]);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: debouncedSearch,
        status: statusFilter,
        color: colorFilter,
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/admin/tags?${params}`);
      const data = await response.json();

      if (data.success) {
        setTags(data.data);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.total);
      } else {
        setError(data.message || "Failed to fetch tags");
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
      setError("Failed to fetch tags");
    } finally {
      setLoading(false);
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
      } else {
        setError(data.message || "Failed to delete tag");
      }
    } catch (error) {
      console.error("Error deleting tag:", error);
      setError("Failed to delete tag");
    }
  };

  const openAddTagModal = () => {
    setSelectedTag(null);
    openTagModal();
  };

  const openEditTagModal = (tag: Tag) => {
    setSelectedTag(tag);
    openTagModal();
  };

  const handleOpenDeleteModal = (tagId: string) => {
    setTagToDelete(tagId);
    openDeleteModal();
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setColorFilter("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge color="success">Active</Badge>
    ) : (
      <Badge color="error">Inactive</Badge>
    );
  };

  const getColorBadge = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      purple: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      pink: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      indigo: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      gray: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    };

    const colorClass = colorMap[color] || colorMap.gray;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {color}
      </span>
    );
  };

  if (loading && tags.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading tags...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tag Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage product tags and labels</p>
        </div>
        <Button onClick={openAddTagModal} className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          Add Tag
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TagIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tags</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalTags}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Tags</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.activeTags}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Inactive Tags</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.inactiveTags}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              defaultValue={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              options={[
                { value: "", label: "All Status" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" }
              ]}
            />
            <Select
              defaultValue={colorFilter}
              onChange={(value) => setColorFilter(value)}
              options={[
                { value: "", label: "All Colors" },
                { value: "blue", label: "Blue" },
                { value: "green", label: "Green" },
                { value: "yellow", label: "Yellow" },
                { value: "red", label: "Red" },
                { value: "purple", label: "Purple" },
                { value: "pink", label: "Pink" },
                { value: "indigo", label: "Indigo" },
                { value: "gray", label: "Gray" }
              ]}
            />
            <Select
              defaultValue={sortBy}
              onChange={(value) => setSortBy(value)}
              options={[
                { value: "name", label: "Sort by Name" },
                { value: "createdAt", label: "Sort by Date" },
                { value: "color", label: "Sort by Color" },
                { value: "usageCount", label: "Sort by Usage" }
              ]}
            />
            <Select
              defaultValue={sortOrder}
              onChange={(value) => setSortOrder(value)}
              options={[
                { value: "asc", label: "Ascending" },
                { value: "desc", label: "Descending" }
              ]}
            />
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Tags Table */}
      <ResponsiveTable className="bg-white dark:bg-gray-800 rounded-lg border">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Color
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider sticky right-0 z-20 bg-gray-50 dark:bg-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        {tags.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-center">
                      <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No tags found</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {search || statusFilter || colorFilter ? "Try adjusting your filters." : "Get started by creating a new tag."}
                      </p>
          </div>
                  </td>
                </tr>
              ) : (
                tags.map((tag) => (
                  <tr key={tag._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                            <TagIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {tag.name}
                          </div>
                          {tag.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {tag.description}
                            </div>
                    )}
                  </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getColorBadge(tag.color)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(tag.isActive)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {tag.usageCount || 0} products
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(tag.createdAt).toISOString().split('T')[0]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 z-10 bg-white dark:bg-gray-800">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin-management/tags/${tag._id}`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                    <button
                          onClick={() => openEditTagModal(tag)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title="Edit Tag"
                    >
                      <EditIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal(tag._id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete Tag"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
      </ResponsiveTable>

      {/* Pagination */}
      <UnifiedPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteTag}
        title="Delete Tag"
        message="Are you sure you want to delete this tag? This action cannot be undone."
      />

      {/* Tag Form Modal */}
      <TagFormModal
        isOpen={isTagModalOpen}
        onClose={closeTagModal}
        onSaved={() => { closeTagModal(); fetchTags(); }}
        tag={selectedTag}
        categories={[]}
      />
    </div>
  );
};

export default TagsPage;