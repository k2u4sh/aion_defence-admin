import { connectDB } from "@/utils/db";
import { NextRequest } from "next/server";
import { withAuth } from "@/utils/auth";
import type { JWTPayload } from "@/utils/jwt";
import { ApiResponseHandler, ErrorMessages, SuccessMessages } from "@/utils/apiResponse";
import { Validator, ValidationSchemas } from "@/utils/validation";

// Dynamic import for models
const getProductModel = async () => {
  const productModule = await import("@/models/productModel");
  return productModule.default;
};

// GET: Fetch single product by ID (Public)
export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    await connectDB();
    const Product = await getProductModel();

    const { id } = context.params;

    const product = await Product.findOne({
      _id: id,
      deletedAt: null
    })
    .populate('category', 'name slug')
    .populate('subCategory', 'name slug')
    .populate('tags', 'name slug color')
    .populate('seller', 'firstName lastName companyName sellerProfile.isVerifiedSeller sellerProfile.sellerRating')
    .populate('createdBy', 'firstName lastName email');

    if (!product) {
      return ApiResponseHandler.error("Product not found", 404);
    }

    return ApiResponseHandler.success({
      message: "Product fetched successfully",
      success: true,
      data: {
        product
      }
    }, 200);

  } catch (error) {
    console.error("Get product error:", error);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}

// PUT: Update product (Protected)
async function updateProduct(request: NextRequest, user: JWTPayload, context: { params: { id: string } }) {
  try {
    await connectDB();
    const Product = await getProductModel();

    const { id } = context.params;
    const body = await request.json();

    const product = await Product.findOne({
      _id: id,
      deletedAt: null
    });

    if (!product) {
      return ApiResponseHandler.error("Product not found", 404);
    }

    // Check if SKU is being changed and if it conflicts
    if (body.sku && body.sku.toUpperCase() !== product.sku) {
      const existingProduct = await Product.findOne({
        sku: body.sku.toUpperCase(),
        _id: { $ne: id },
        deletedAt: null
      });

      if (existingProduct) {
        return ApiResponseHandler.error("A product with this SKU already exists", 409);
      }
    }

    // Check if slug is being changed and if it conflicts
    if (body.slug && body.slug.toLowerCase() !== product.slug) {
      const existingSlug = await Product.findOne({
        slug: body.slug.toLowerCase(),
        _id: { $ne: id },
        deletedAt: null
      });

      if (existingSlug) {
        return ApiResponseHandler.error("A product with this slug already exists", 409);
      }
    }

    // Validate category if being changed
    if (body.category && body.category !== product.category.toString()) {
      const categoryModule = await import("@/models/categoryModel");
      const Category = categoryModule.default;
      
      const categoryDoc = await Category.findById(body.category);
      if (!categoryDoc) {
        return ApiResponseHandler.error("Category not found", 404);
      }
    }

    // Validate subcategory if being changed
    if (body.subCategory && body.subCategory !== product.subCategory?.toString()) {
      const categoryModule = await import("@/models/categoryModel");
      const Category = categoryModule.default;
      
      const subCategoryDoc = await Category.findOne({
        _id: body.subCategory,
        parentCategory: body.category || product.category
      });
      
      if (!subCategoryDoc) {
        return ApiResponseHandler.error("Subcategory not found or not a child of the specified category", 404);
      }
    }

    // Update fields
    const allowedFields = [
      'name', 'slug', 'description', 'shortDescription', 'category', 'subCategory',
      'basePrice', 'comparePrice', 'cost', 'sku', 'quantity', 'images', 'specifications',
      'tags', 'status', 'isVisible', 'isFeatured', 'weight', 'dimensions', 'seo',
      'lowStockThreshold', 'allowBackorder', 'barcode', 'vendor'
    ];

    /* eslint-disable @typescript-eslint/no-explicit-any */
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        if (field === 'sku') {
          (product as any)[field] = body[field].toUpperCase();
        } else if (field === 'slug') {
          (product as any)[field] = body[field].toLowerCase().trim();
        } else if (field === 'name' || field === 'description' || field === 'shortDescription') {
          (product as any)[field] = body[field]?.trim();
        } else if (field === 'tags') {
          (product as any)[field] = body[field].map((tag: string) => tag.toLowerCase().trim());
        } else {
          (product as any)[field] = body[field];
        }
      }
    });

    (product as any).updatedBy = user.userId;
    /* eslint-enable @typescript-eslint/no-explicit-any */
    const updatedProduct = await product.save();

    await updatedProduct.populate([
      { path: 'category', select: 'name slug' },
      { path: 'subCategory', select: 'name slug' }
    ]);

    return ApiResponseHandler.success({
      message: "Product updated successfully",
      success: true,
      data: {
        product: updatedProduct
      }
    }, 200);

  } catch (error) {
    console.error("Update product error:", error);
    
    if (error instanceof Error && error.name === 'ValidationError') {
      return ApiResponseHandler.error("Validation error", 400);
    }

    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}

// DELETE: Soft delete product (Protected)
async function deleteProduct(request: NextRequest, user: JWTPayload, context: { params: { id: string } }) {
  try {
    await connectDB();
    const Product = await getProductModel();

    const { id } = context.params;

    const product = await Product.findOne({
      _id: id,
      deletedAt: null
    });

    if (!product) {
      return ApiResponseHandler.error("Product not found", 404);
    }

    // Soft delete
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (product as any).deletedAt = new Date();
    (product as any).deletedBy = user.userId;
    (product as any).status = 'archived';
    (product as any).isVisible = false;
    /* eslint-enable @typescript-eslint/no-explicit-any */
    await product.save();

    return ApiResponseHandler.success(null, "Product deleted successfully");

  } catch (error) {
    console.error("Delete product error:", error);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}

// Create wrapper functions that match the expected signature
const wrappedUpdateProduct = async (request: NextRequest, user: JWTPayload) => {
  // Extract params from the URL
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const id = pathSegments[pathSegments.length - 1];
  
  return updateProduct(request, user, { params: { id } });
};

const wrappedDeleteProduct = async (request: NextRequest, user: JWTPayload) => {
  // Extract params from the URL
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const id = pathSegments[pathSegments.length - 1];
  
  return deleteProduct(request, user, { params: { id } });
};

// Export the protected routes
export const POST = withAuth(wrappedUpdateProduct);
// DELETE replaced by POST in Postman collection. Remove or refactor as needed.
