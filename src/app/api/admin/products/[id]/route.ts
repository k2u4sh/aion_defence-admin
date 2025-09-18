import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/db";
import Product from "@/models/productModel";
import User from "@/models/userModel";
import Category from "@/models/categoryModel";
import Tag from "@/models/tagModel";
import { requireAdminAuth } from "@/utils/adminAccess";

// Ensure models are registered
const ensureModelsRegistered = () => {
  // These imports will register the models with Mongoose
  User;
  Category;
  Tag;
  Product;
};

// GET /api/admin/products/[id] - Get a specific product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Ensure models are registered
    ensureModelsRegistered();
    
    // Check admin authentication
    const authCheck = await requireAdminAuth(request);
    if (!authCheck.success) {
      return NextResponse.json(
        { success: false, message: authCheck.message || "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();
    const { id } = await params;

    const product = await Product.findById(id)
      .populate("category", "name parentCategory level")
      .populate("subCategory", "name parentCategory level")
      .populate("tags", "name color")
      .populate("seller", "firstName lastName companyName email")
      .populate("supplier", "name email phone")
      .lean();

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product fetched successfully",
      data: product
    });

  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/products/[id] - Update a specific product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Ensure models are registered
    ensureModelsRegistered();
    
    // Check admin authentication
    const authCheck = await requireAdminAuth(request);
    if (!authCheck.success) {
      return NextResponse.json(
        { success: false, message: authCheck.message || "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const adminId = authCheck.admin?._id;

    if (!adminId) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 401 }
      );
    }

    // Clean the data - convert empty strings to null for ObjectId fields
    const cleanData = { ...body };
    
    // ObjectId fields that should be null if empty string
    const objectIdFields = ['category', 'subCategory', 'seller', 'supplier'];
    objectIdFields.forEach(field => {
      if (cleanData[field] === '' || cleanData[field] === undefined) {
        cleanData[field] = null;
      }
    });
    
    // Handle defenseCertification field - clean empty values
    if (cleanData.defenseCertification && typeof cleanData.defenseCertification === 'object') {
      const cert = cleanData.defenseCertification;
      // Clean empty strings in certification fields
      if (cert.certificationNumber === '') cert.certificationNumber = undefined;
      if (cert.certificationBody === '') cert.certificationBody = undefined;
      if (cert.validUntil === '') cert.validUntil = undefined;
      // Clean empty documents array
      if (cert.documents && Array.isArray(cert.documents)) {
        cert.documents = cert.documents.filter((doc: any) => doc && doc.name && doc.url);
      }
    }
    
    // Clean tags array - remove empty strings
    if (cleanData.tags && Array.isArray(cleanData.tags)) {
      cleanData.tags = cleanData.tags.filter((tag: any) => tag && tag !== '');
    }
    
    // Clean images array
    if (cleanData.images && Array.isArray(cleanData.images)) {
      cleanData.images = cleanData.images.filter((img: any) => img && img.url && img.url !== '');
    }
    
    // Clean specifications array
    if (cleanData.specifications && Array.isArray(cleanData.specifications)) {
      cleanData.specifications = cleanData.specifications.filter((spec: any) => 
        spec && spec.name && spec.name !== '' && spec.value && spec.value !== ''
      );
    }

    // Update product with admin as updater
    const productData = {
      ...cleanData,
      updatedBy: adminId
    };

    const product = await Product.findByIdAndUpdate(
      id,
      productData,
      { new: true, runValidators: true }
    )
      .populate("category", "name parentCategory level")
      .populate("subCategory", "name parentCategory level")
      .populate("tags", "name color")
      .populate("seller", "firstName lastName companyName email")
      .populate("supplier", "name email phone");

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      data: product
    });

  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/[id] - Delete a specific product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Ensure models are registered
    ensureModelsRegistered();
    
    // Check admin authentication
    const authCheck = await requireAdminAuth(request);
    if (!authCheck.success) {
      return NextResponse.json(
        { success: false, message: authCheck.message || "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();
    const { id } = await params;
    const adminId = authCheck.admin?._id;

    if (!adminId) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 401 }
      );
    }

    // Soft delete the product
    const product = await Product.findByIdAndUpdate(
      id,
      { 
        deletedAt: new Date(),
        updatedBy: adminId
      },
      { new: true }
    );

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete product" },
      { status: 500 }
    );
  }
}