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
  seller?: string;
  supplier?: string;
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
  parentCategory?: string | { _id: string; name: string; level: number };
}

interface Tag {
  _id: string;
  name: string;
  color: string;
}

interface Seller {
  _id: string;
  firstName: string;
  lastName: string;
  companyName?: string;
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
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    description: "",
    shortDescription: "",
    category: "",
    subCategory: "",
    seller: "",
    supplier: "",
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

  const normalizeProduct = (p: any): Partial<Product> => {
    const safeVal = <T,>(val: T | undefined, fallback: T) => (val === undefined || val === null ? fallback : val);
    return {
      _id: p._id,
      name: safeVal(p.name, ""),
      slug: p.slug,
      description: safeVal(p.description, ""),
      shortDescription: safeVal(p.shortDescription, ""),
      category: typeof p.category === 'object' ? p.category?._id : p.category || null,
      subCategory: typeof p.subCategory === 'object' ? p.subCategory?._id : p.subCategory || null,
      seller: typeof p.seller === 'object' ? p.seller?._id : p.seller || null,
      supplier: typeof p.supplier === 'object' ? p.supplier?._id : p.supplier || null,
      tags: (p.tags || []).map((t: any) => (typeof t === 'object' ? t._id : t)),
      basePrice: Number(safeVal(p.basePrice, 0)),
      comparePrice: Number(safeVal(p.comparePrice, 0)),
      cost: Number(safeVal(p.cost, 0)),
      sku: safeVal(p.sku, ""),
      barcode: safeVal(p.barcode, ""),
      quantity: Number(safeVal(p.quantity, 0)),
      lowStockThreshold: Number(safeVal(p.lowStockThreshold, 10)),
      weight: Number(safeVal(p.weight, 0)),
      weightUnit: safeVal(p.weightUnit, "kg"),
      dimensions: {
        length: Number(safeVal(p.dimensions?.length, 0)),
        width: Number(safeVal(p.dimensions?.width, 0)),
        height: Number(safeVal(p.dimensions?.height, 0)),
      },
      dimensionUnit: safeVal(p.dimensionUnit, "cm"),
      status: safeVal(p.status, "draft"),
      isVisible: Boolean(safeVal(p.isVisible, true)),
      isFeatured: Boolean(safeVal(p.isFeatured, false)),
      isDigital: Boolean(safeVal(p.isDigital, false)),
      trackQuantity: Boolean(safeVal(p.trackQuantity, true)),
      allowBackorder: Boolean(safeVal(p.allowBackorder, false)),
      taxable: Boolean(safeVal(p.taxable, true)),
      taxRate: Number(safeVal(p.taxRate, 0)),
      images: (p.images || []).map((img: any, idx: number) => ({
        url: img.url,
        alt: img.alt || "",
        isPrimary: Boolean(img.isPrimary),
        order: Number(img.order ?? idx),
      })),
      specifications: (p.specifications || []).map((s: any) => ({
        name: s.name,
        value: s.value,
        unit: s.unit || "",
      })),
      seo: {
        metaTitle: p.seo?.metaTitle || p.seoTitle || "",
        metaDescription: p.seo?.metaDescription || p.seoDescription || "",
        keywords: p.seo?.keywords || [],
        canonicalUrl: p.seo?.canonicalUrl || "",
      },
    };
  };

  useEffect(() => {
    if (isOpen) {
      const initializeModal = async () => {
        await Promise.all([
          fetchCategories(),
          fetchTags(),
          fetchSellers()
        ]);
        
        if (product) {
          setFormData(normalizeProduct(product));
        } else {
          resetForm();
        }
      };
      
      initializeModal();
    }
  }, [isOpen, product]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories?limit=100");
      const data = await response.json();
      if (data.success) {
        const categoriesData = data.data || [];
        setCategories(categoriesData);
      } else {
        console.error("Failed to fetch categories:", data.message);
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/admin/tags?limit=100");
      const data = await response.json();
      if (data.success) {
        setTags(data.data || []);
      } else {
        setTags([]);
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
      setTags([]);
    }
  };

  const fetchSellers = async () => {
    try {
      const response = await fetch("/api/admin/users?limit=100&role=seller");
      const data = await response.json();
      if (data.success) {
        setSellers(data.data?.users || []);
      } else {
        setSellers([]);
      }
    } catch (error) {
      console.error("Error fetching sellers:", error);
      setSellers([]);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      shortDescription: "",
      category: "",
      subCategory: "",
      seller: "",
      supplier: "",
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
        ...(prev[parent as keyof Product] as any || {}),
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

      // Build clean payload without undefined/nulls
      const payload: any = {
        name: formData.name,
        description: formData.description,
        shortDescription: formData.shortDescription,
        category: formData.category || null,
        subCategory: formData.subCategory || null,
        seller: formData.seller || null,
        supplier: formData.supplier || null,
        tags: formData.tags || [],
        basePrice: formData.basePrice,
        comparePrice: formData.comparePrice,
        cost: formData.cost,
        sku: formData.sku,
        barcode: formData.barcode,
        quantity: formData.quantity,
        lowStockThreshold: formData.lowStockThreshold,
        weight: formData.weight,
        weightUnit: formData.weightUnit,
        dimensions: formData.dimensions,
        dimensionUnit: formData.dimensionUnit,
        status: formData.status,
        isVisible: formData.isVisible,
        isFeatured: formData.isFeatured,
        isDigital: formData.isDigital,
        trackQuantity: formData.trackQuantity,
        allowBackorder: formData.allowBackorder,
        taxable: formData.taxable,
        taxRate: formData.taxRate,
        images: formData.images || [],
        specifications: formData.specifications || [],
        seo: formData.seo || { metaTitle: "", metaDescription: "", keywords: [], canonicalUrl: "" },
      };

      Object.keys(payload).forEach((k) => {
        if (payload[k] === undefined) delete payload[k];
      });

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
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
    if (!formData.category) return [] as Category[];
    const list = categories || [];
    
    const parentCategory = list.find(cat => cat._id === formData.category);
    if (!parentCategory) return [] as Category[];
    
    const subCategories = list.filter(cat => {
      if (!cat.parentCategory) return false;
      
      // Handle both populated and non-populated parentCategory
      const parentId = typeof cat.parentCategory === 'object' 
        ? cat.parentCategory._id 
        : cat.parentCategory;
      
      return parentId === formData.category;
    });
    
    return subCategories;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
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
                  {(categories || []).filter(cat => !cat.parentCategory).map(category => (
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
                  {(getSubCategories() || []).map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="seller">Seller *</Label>
                <select
                  id="seller"
                  value={formData.seller || ""}
                  onChange={(e) => handleInputChange("seller", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Seller</option>
                  {(sellers || []).map(seller => (
                    <option key={seller._id} value={seller._id}>
                      {seller.firstName} {seller.lastName} {seller.companyName ? `(${seller.companyName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <select
                  id="supplier"
                  value={formData.supplier || ""}
                  onChange={(e) => handleInputChange("supplier", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Supplier</option>
                  {(sellers || []).map(seller => (
                    <option key={seller._id} value={seller._id}>
                      {seller.firstName} {seller.lastName} {seller.companyName ? `(${seller.companyName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(tags || []).map(tag => (
                    <label key={tag._id} className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.tags?.includes(tag._id) || false}
                        onChange={(checked) => {
                          const currentTags = formData.tags || [];
                          if (checked) {
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
                <Switch
                  label="Track Quantity"
                  defaultChecked={formData.trackQuantity || false}
                  onChange={(checked) => handleInputChange("trackQuantity", checked)}
                />
                <Switch
                  label="Allow Backorder"
                  defaultChecked={formData.allowBackorder || false}
                  onChange={(checked) => handleInputChange("allowBackorder", checked)}
                />
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
                <Switch
                  label="Visible"
                  defaultChecked={formData.isVisible || false}
                  onChange={(checked) => handleInputChange("isVisible", checked)}
                />
                <Switch
                  label="Featured"
                  defaultChecked={formData.isFeatured || false}
                  onChange={(checked) => handleInputChange("isFeatured", checked)}
                />
                <Switch
                  label="Digital"
                  defaultChecked={formData.isDigital || false}
                  onChange={(checked) => handleInputChange("isDigital", checked)}
                />
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
                  {(formData.images || []).map((image, index) => (
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
                  {(formData.specifications || []).map((spec, index) => (
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
          <div className="flex justify-end gap-3 pt-6 border-t sticky bottom-0 bg-white dark:bg-gray-900 z-10">
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
