"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PlusIcon, EditIcon, TrashIcon, EyeIcon, FilterIcon, BoxIcon, CheckCircleIcon, AlertTriangleIcon } from "@/icons";
import { useModal } from "@/hooks/useModal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import CategoryFormModal from "@/components/categories/CategoryFormModal";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import ResponsiveTable from "@/components/tables/ResponsiveTable";
import UnifiedPagination from "@/components/common/UnifiedPagination";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentCategory?: {
    _id: string;
    name: string;
    level: number;
  };
  level: number;
  isActive: boolean;
  image?: string;
  icon?: string;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  createdAt: string;
  updatedAt: string;
}

interface CategoryStats {
  totalCategories: number;
  activeCategories: number;
  inactiveCategories: number;
}

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<CategoryStats>({
    totalCategories: 0,
    activeCategories: 0,
    inactiveCategories: 0
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
  const [statusFilter, setStatusFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [parentCategoryFilter, setParentCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Modals
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const { isOpen: isCategoryModalOpen, openModal: openCategoryModal, closeModal: closeCategoryModal } = useModal();
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories();
  }, [currentPage, search, statusFilter, levelFilter, parentCategoryFilter, sortBy, sortOrder]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search,
        status: statusFilter,
        level: levelFilter,
        parentCategory: parentCategoryFilter,
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/admin/categories?${params}`);
      const data = await response.json();

      if (data.success) {
        setCategories(data.data);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.total);
      } else {
        setError(data.message || "Failed to fetch categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      const response = await fetch(`/api/admin/categories/${categoryToDelete}`, {
        method: "DELETE"
      });

      const data = await response.json();
      if (data.success) {
        fetchCategories();
        closeDeleteModal();
      } else {
        setError(data.message || "Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      setError("Failed to delete category");
    }
  };

  const handleOpenDeleteModal = (categoryId: string) => {
    setCategoryToDelete(categoryId);
    openDeleteModal();
  };

  const openAddCategoryModal = () => {
    setSelectedCategory(null);
    openCategoryModal();
  };

  const openEditCategoryModal = (category: Category) => {
    setSelectedCategory(category);
    openCategoryModal();
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setLevelFilter("");
    setParentCategoryFilter("");
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

  const getLevelBadge = (level: number) => {
    const colors = ["info", "warning", "success", "error"];
    const color = colors[level % colors.length] as "info" | "warning" | "success" | "error";
    return <Badge color={color}>Level {level}</Badge>;
  };

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Category Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage product categories and subcategories</p>
        </div>
        <Button onClick={openAddCategoryModal} className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BoxIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Categories</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalCategories}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Categories</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.activeCategories}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Inactive Categories</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.inactiveCategories}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search categories..."
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
              defaultValue={levelFilter}
              onChange={(value) => setLevelFilter(value)}
              options={[
                { value: "", label: "All Levels" },
                { value: "0", label: "Level 0" },
                { value: "1", label: "Level 1" },
                { value: "2", label: "Level 2" },
                { value: "3", label: "Level 3" }
              ]}
            />
            <Select
              defaultValue={sortBy}
              onChange={(value) => setSortBy(value)}
              options={[
                { value: "name", label: "Sort by Name" },
                { value: "createdAt", label: "Sort by Date" },
                { value: "level", label: "Sort by Level" },
                { value: "sortOrder", label: "Sort by Order" }
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

      {/* Categories Table */}
      <ResponsiveTable className="bg-white dark:bg-gray-800 rounded-lg border">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Parent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Sort Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">Loading categories...</span>
                    </div>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-center">
                      <BoxIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No categories found</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {search || statusFilter || levelFilter ? "Try adjusting your filters." : "Get started by creating a new category."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {category.image ? (
                            <img
                              className="h-10 w-10 rounded-lg object-cover"
                              src={category.image}
                              alt={category.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                              <BoxIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {category.name}
                          </div>
                          {category.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {category.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getLevelBadge(category.level)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {category.parentCategory ? (
                        <span className="text-blue-600 dark:text-blue-400">
                          {category.parentCategory.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">Root Category</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(category.isActive)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {category.sortOrder}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(category.createdAt).toISOString().split('T')[0]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin-management/categories/${category._id}`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => openEditCategoryModal(category)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title="Edit Category"
                        >
                          <EditIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(category._id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete Category"
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

      {/* Category Form Modal */}
      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onClose={closeCategoryModal}
        onSaved={() => { closeCategoryModal(); fetchCategories(); }}
        category={selectedCategory}
        categories={categories}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
      />
    </div>
  );
};

export default CategoriesPage;