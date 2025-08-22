"use client";

import React, { useState, useEffect } from "react";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Switch from "@/components/form/switch/Switch";
import Checkbox from "@/components/form/input/Checkbox";
import { PlusIcon, TrashIcon, UploadIcon } from "@/icons";

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  category: string;
  subCategory?: string;
  tags: string[];
  basePrice: number;
  comparePrice?: number;
  cost?: number;
  sku: string;
  barcode?: string;
  quantity: number;
  lowStockThreshold: number;
  weight?: number;
  weightUnit: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  dimensionUnit: string;
  status: string;
  isVisible: boolean;
  isFeatured: boolean;
  isDigital: boolean;
  trackQuantity: boolean;
  allowBackorder: boolean;
  taxable: boolean;
  taxRate: number;
  images: Array<{
    url: string;
    alt?: string;
    isPrimary: boolean;
    order: number;
  }>;
  specifications: Array<{
    name: string;
    value: string;
    unit?: string;
  }>;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    canonicalUrl?: string;
  };
}

interface Category {
  _id: string;
  name: string;
  level: number;
}

interface Tag {
  _id: string;
  name: string;
  color: string;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSaved: () => void;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  product,
  onSaved
}) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    description: "",
    shortDescription: "",
    category: "",
    subCategory: "",
    tags: [],
    basePrice: 0,
    comparePrice: 0,
    cost: 0,
    sku: "",
    barcode: "",
    quantity: 0,
    lowStockThreshold: 10,
    weight: 0,
    weightUnit: "kg",
    dimensions: { length: 0, width: 0, height: 0 },
    dimensionUnit: "cm",
    status: "draft",
    isVisible: true,
    isFeatured: false,
    isDigital: false,
    trackQuantity: true,
    allowBackorder: false,
    taxable: true,
    taxRate: 0,
    images: [],
    specifications: [],
    seo: {
      metaTitle: "",
      metaDescription: "",
      keywords: [],
      canonicalUrl: ""
    }
  });

  const [newSpecification, setNewSpecification] = useState({ name: "", value: "", unit: "" });
  const [newImage, setNewImage] = useState({ url: "", alt: "", isPrimary: false });

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchTags();
      if (product) {
        setFormData(product);
      } else {
        resetForm();
      }
    }
  }, [isOpen, product]);

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

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/admin/tags?limit=100");
      const data = await response.json();
      if (data.success) {
        setTags(data.data.tags);
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      shortDescription: "",
      category: "",
      subCategory: "",
      tags: [],
      basePrice: 0,
      comparePrice: 0,
      cost: 0,
      sku: "",
      barcode: "",
      quantity: 0,
      lowStockThreshold: 10,
      weight: 0,
      weightUnit: "kg",
      dimensions: { length: 0, width: 0, height: 0 },
      dimensionUnit: "cm",
      status: "draft",
      isVisible: true,
      isFeatured: false,
      isDigital: false,
      trackQuantity: true,
      allowBackorder: false,
      taxable: true,
      taxRate: 0,
      images: [],
      specifications: [],
      seo: {
        metaTitle: "",
        metaDescription: "",
        keywords: [],
        canonicalUrl: ""
      }
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof Product],
        [field]: value
      }
    }));
  };

  const addSpecification = () => {
    if (newSpecification.name && newSpecification.value) {
      setFormData(prev => ({
        ...prev,
        specifications: [...(prev.specifications || []), { ...newSpecification }]
      }));
      setNewSpecification({ name: "", value: "", unit: "" });
    }
  };

  const removeSpecification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications?.filter((_, i) => i !== index)
    }));
  };

  const addImage = () => {
    if (newImage.url) {
      const imageData = {
        ...newImage,
        order: formData.images?.length || 0
      };
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), imageData]
      }));
      setNewImage({ url: "", alt: "", isPrimary: false });
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index)
    }));
  };

  const setPrimaryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }))
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = product ? `/api/admin/products/${product._id}` : "/api/admin/products";
      const method = product ? "PUT" : "POST";

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
        alert(data.message || "Failed to save product");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const getSubCategories = () => {
    if (!formData.category) return [];
    const parentCategory = categories.find(cat => cat._id === formData.category);
    if (!parentCategory) return [];
    return categories.filter(cat => cat.parentCategory === formData.category);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {product ? "Edit Product" : "Add New Product"}
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
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  type="text"
                  value={formData.sku || ""}
                  onChange={(e) => handleInputChange("sku", e.target.value)}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="shortDescription">Short Description</Label>
                <textarea
                  id="shortDescription"
                  value={formData.shortDescription || ""}
                  onChange={(e) => handleInputChange("shortDescription", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Categories and Tags */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Categories & Tags</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={formData.category || ""}
                  onChange={(e) => {
                    handleInputChange("category", e.target.value);
                    handleInputChange("subCategory", "");
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.filter(cat => !cat.parentCategory).map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="subCategory">Sub Category</Label>
                <select
                  id="subCategory"
                  value={formData.subCategory || ""}
                  onChange={(e) => handleInputChange("subCategory", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!formData.category}
                >
                  <option value="">Select Sub Category</option>
                  {getSubCategories().map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map(tag => (
                    <label key={tag._id} className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.tags?.includes(tag._id) || false}
                        onChange={(e) => {
                          const currentTags = formData.tags || [];
                          if (e.target.checked) {
                            handleInputChange("tags", [...currentTags, tag._id]);
                          } else {
                            handleInputChange("tags", currentTags.filter(t => t !== tag._id));
                          }
                        }}
                      />
                      <span
                        className="px-2 py-1 rounded text-sm"
                        style={{ backgroundColor: tag.color + '20', color: tag.color }}
                      >
                        {tag.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="basePrice">Base Price *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.basePrice || 0}
                  onChange={(e) => handleInputChange("basePrice", parseFloat(e.target.value))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="comparePrice">Compare Price</Label>
                <Input
                  id="comparePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.comparePrice || 0}
                  onChange={(e) => handleInputChange("comparePrice", parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost || 0}
                  onChange={(e) => handleInputChange("cost", parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity || 0}
                  onChange={(e) => handleInputChange("quantity", parseInt(e.target.value))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min="0"
                  value={formData.lowStockThreshold || 10}
                  onChange={(e) => handleInputChange("lowStockThreshold", parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  type="text"
                  value={formData.barcode || ""}
                  onChange={(e) => handleInputChange("barcode", e.target.value)}
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <Switch
                    checked={formData.trackQuantity || false}
                    onChange={(checked) => handleInputChange("trackQuantity", checked)}
                  />
                  <span className="text-sm">Track Quantity</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch
                    checked={formData.allowBackorder || false}
                    onChange={(checked) => handleInputChange("allowBackorder", checked)}
                  />
                  <span className="text-sm">Allow Backorder</span>
                </label>
              </div>
            </div>
          </div>

          {/* Status and Visibility */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status & Visibility</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status || "draft"}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <Switch
                    checked={formData.isVisible || false}
                    onChange={(checked) => handleInputChange("isVisible", checked)}
                  />
                  <span className="text-sm">Visible</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch
                    checked={formData.isFeatured || false}
                    onChange={(checked) => handleInputChange("isFeatured", checked)}
                  />
                  <span className="text-sm">Featured</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch
                    checked={formData.isDigital || false}
                    onChange={(checked) => handleInputChange("isDigital", checked)}
                  />
                  <span className="text-sm">Digital</span>
                </label>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Images</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  type="text"
                  placeholder="Image URL"
                  value={newImage.url}
                  onChange={(e) => setNewImage(prev => ({ ...prev, url: e.target.value }))}
                />
                <Input
                  type="text"
                  placeholder="Alt text"
                  value={newImage.alt}
                  onChange={(e) => setNewImage(prev => ({ ...prev, alt: e.target.value }))}
                />
                <Button type="button" onClick={addImage} className="flex items-center gap-2">
                  <PlusIcon />
                  Add Image
                </Button>
              </div>
              
              {formData.images && formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative border rounded-lg p-2">
                      <img
                        src={image.url}
                        alt={image.alt || ""}
                        className="w-full h-24 object-cover rounded"
                      />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(index)}
                          className={`p-1 rounded text-xs ${
                            image.isPrimary
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                          }`}
                        >
                          {image.isPrimary ? "Primary" : "Set Primary"}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="p-1 rounded bg-red-500 text-white text-xs hover:bg-red-600"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Specifications */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Specifications</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  type="text"
                  placeholder="Specification name"
                  value={newSpecification.name}
                  onChange={(e) => setNewSpecification(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  type="text"
                  placeholder="Value"
                  value={newSpecification.value}
                  onChange={(e) => setNewSpecification(prev => ({ ...prev, value: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Unit (optional)"
                    value={newSpecification.unit}
                    onChange={(e) => setNewSpecification(prev => ({ ...prev, unit: e.target.value }))}
                  />
                  <Button type="button" onClick={addSpecification} className="flex items-center gap-2">
                    <PlusIcon />
                    Add
                  </Button>
                </div>
              </div>
              
              {formData.specifications && formData.specifications.length > 0 && (
                <div className="space-y-2">
                  {formData.specifications.map((spec, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
                      <span className="font-medium">{spec.name}:</span>
                      <span>{spec.value}</span>
                      {spec.unit && <span className="text-gray-500">({spec.unit})</span>}
                      <button
                        type="button"
                        onClick={() => removeSpecification(index)}
                        className="ml-auto text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : product ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ProductFormModal;
