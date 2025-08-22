"use client";

import React, { useState, useEffect } from "react";
import { PlusIcon, EditIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon } from "@/icons";
import { useModal } from "@/hooks/useModal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import CategoryFormModal from "@/components/categories/CategoryFormModal";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";

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
  productsCount?: number;
  childCategories?: Category[];
}

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const { isOpen: isCategoryModalOpen, openModal: openCategoryModal, closeModal: closeCategoryModal } = useModal();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/categories?limit=100");
      const data = await response.json();

      if (data.success) {
        const categoriesData = data.data.categories;
        const organizedCategories = organizeCategoriesHierarchically(categoriesData);
        setCategories(organizedCategories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const organizeCategoriesHierarchically = (categories: Category[]): Category[] => {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    // First pass: create a map of all categories
    categories.forEach(category => {
      categoryMap.set(category._id, { ...category, childCategories: [] });
    });

    // Second pass: organize into hierarchy
    categories.forEach(category => {
      if (category.parentCategory) {
        const parent = categoryMap.get(category.parentCategory._id);
        if (parent) {
          parent.childCategories = parent.childCategories || [];
          parent.childCategories.push(categoryMap.get(category._id)!);
        }
      } else {
        rootCategories.push(categoryMap.get(category._id)!);
      }
    });

    return rootCategories;
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
        setCategoryToDelete(null);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    openCategoryModal();
  };

  const handleOpenDeleteModal = (categoryId: string) => {
    setCategoryToDelete(categoryId);
    openDeleteModal();
  };

  const handleCategorySaved = () => {
    fetchCategories();
    closeCategoryModal();
    setSelectedCategory(null);
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategoryRow = (category: Category, level: number = 0) => {
    const isExpanded = expandedCategories.has(category._id);
    const hasChildren = category.childCategories && category.childCategories.length > 0;

    return (
      <React.Fragment key={category._id}>
        <tr className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
              {hasChildren && (
                <button
                  onClick={() => toggleCategoryExpansion(category._id)}
                  className="mr-2 text-gray-400 hover:text-gray-600"
                >
                  {isExpanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                </button>
              )}
              {!hasChildren && <div className="w-6 mr-2" />}
              <div className="flex items-center">
                {category.image && (
                  <img
                    className="h-8 w-8 rounded object-cover mr-3"
                    src={category.image}
                    alt={category.name}
                  />
                )}
                {category.icon && !category.image && (
                  <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center mr-3">
                    <span className="text-gray-600 text-sm">{category.icon}</span>
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium text-gray-900">{category.name}</div>
                  {category.description && (
                    <div className="text-sm text-gray-500">{category.description}</div>
                  )}
                </div>
              </div>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {category.parentCategory ? category.parentCategory.name : "Root"}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {category.level}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {category.sortOrder}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <Badge color={category.isActive ? "success" : "error"}>
              {category.isActive ? "Active" : "Inactive"}
            </Badge>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {category.productsCount || 0}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <div className="flex gap-2">
              <button
                onClick={() => openEditModal(category)}
                className="text-indigo-600 hover:text-indigo-900"
              >
                <EditIcon className="h-4 w-4" />
              </button>
                                      <button
                          onClick={() => handleOpenDeleteModal(category._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </td>
        </tr>
        {isExpanded && hasChildren && category.childCategories?.map(childCategory =>
          renderCategoryRow(childCategory, level + 1)
        )}
      </React.Fragment>
    );
  };

  const filteredCategories = categories.filter(category => {
    if (!searchTerm) return true;
    return category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Manage your product categories and organize your catalog</p>
        </div>
        <Button onClick={() => openCategoryModal()} className="flex items-center gap-2">
          <PlusIcon />
          Add Category
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border p-4">
        <div className="max-w-md">
                      <Input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sort Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Loading categories...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No categories found
                  </td>
                </tr>
              ) : (
                filteredCategories.map(category => renderCategoryRow(category))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onClose={closeCategoryModal}
        category={selectedCategory}
        onSaved={handleCategorySaved}
        categories={categories}
      />

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
