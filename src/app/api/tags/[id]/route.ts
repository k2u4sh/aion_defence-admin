import { connectDB } from "@/utils/db";
import { NextRequest } from "next/server";
import { withAuth } from "@/utils/auth";
import type { JWTPayload } from "@/utils/jwt";
import { ApiResponseHandler, ErrorMessages, SuccessMessages } from "@/utils/apiResponse";
import { Validator, ValidationSchemas } from "@/utils/validation";

// Dynamic import for models
const getTagModel = async () => {
  const tagModule = await import("@/models/tagModel");
  return tagModule.default;
};

const getCategoryModel = async () => {
  const categoryModule = await import("@/models/categoryModel");
  return categoryModule.default;
};

const getProductModel = async () => {
  const productModule = await import("@/models/productModel");
  return productModule.default;
};

// GET: Fetch single tag by ID (Public)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const Tag = await getTagModel();

    // Extract ID from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const tagId = pathSegments[pathSegments.length - 1];

    const { searchParams } = new URL(request.url);
    const includeProducts = searchParams.get('includeProducts') === 'true';

    const tag = await Tag.findOne({
      _id: tagId,
      isActive: true
    })
    .populate('category', 'name slug')
    .populate('createdBy', 'firstName lastName');

    if (!tag) {
      return ApiResponseHandler.error("Tag not found", 404);
    }

    const responseData: Record<string, unknown> = { tag };

    // Include products if requested
    if (includeProducts) {
      const Product = await getProductModel();
      const products = await Product.find({
        tags: tagId,
        status: 'active',
        isVisible: true,
        deletedAt: null
      })
      .populate('category', 'name slug')
      .populate('seller', 'firstName lastName companyName')
      .select('name slug images basePrice comparePrice')
      .limit(20); // Limit to 20 products

      responseData.products = products;
    }

    return ApiResponseHandler.success(responseData
    , "Tag fetched successfully");

  } catch (error) {
    console.error("Get tag error:", error);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}

// PUT: Update tag (Protected)
async function updateTag(request: NextRequest, user: JWTPayload) {
  try {
    await connectDB();
    const Tag = await getTagModel();
    const Category = await getCategoryModel();

    // Extract ID from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const tagId = pathSegments[pathSegments.length - 1];

    const body = await request.json();

    const tag = await Tag.findById(tagId);
    if (!tag) {
      return ApiResponseHandler.error("Tag not found", 404);
    }

    // Check if user can edit this tag (admin or creator)
    if (!user.roles.includes('admin') && tag.createdBy.toString() !== user.userId) {
      return ApiResponseHandler.error("Access denied. You can only edit tags you created", 403);
    }

    // Check if tag is system tag
    if (tag.isSystem && !user.roles.includes('admin')) {
      return ApiResponseHandler.error("Access denied. System tags can only be edited by administrators", 403);
    }

    // Validate category if being changed
    if (body.category && body.category !== tag.category?.toString()) {
      const categoryDoc = await Category.findById(body.category);
      if (!categoryDoc) {
        return ApiResponseHandler.error("Category not found", 404);
      }
    }

    // Check for duplicate name if being changed
    if (body.name && body.name.toLowerCase().trim() !== tag.name) {
      const existingTag = await Tag.findOne({
        name: body.name.toLowerCase().trim(),
        _id: { $ne: tagId }
      });

      if (existingTag) {
        return ApiResponseHandler.error("A tag with this name already exists", 409);
      }
    }

    // Validate color format if provided
    if (body.color && !/^#[0-9A-F]{6}$/i.test(body.color)) {
      return ApiResponseHandler.error("Color must be a valid hex color code (e.g., #FF5733)", 400);
    }

    // Update fields
    const allowedFields = [
      'name', 'description', 'color', 'category', 'isActive', 'sortOrder'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        if (field === 'name') {
          tag[field] = body[field].trim();
        } else if (field === 'description') {
          tag[field] = body[field]?.trim() || null;
        } else if (field === 'category') {
          tag[field] = body[field] || null;
        } else {
          tag[field] = body[field];
        }
      }
    });

    tag.updatedBy = user.userId;
    await tag.save();

    // Populate the response
    await tag.populate([
      { path: 'category', select: 'name slug' },
      { path: 'createdBy', select: 'firstName lastName' },
      { path: 'updatedBy', select: 'firstName lastName' }
    ]);

    return ApiResponseHandler.success({
      message: "Tag updated successfully",
      success: true,
      data: { tag }
    });

  } catch (error) {
    console.error("Update tag error:", error);
    
    if (error instanceof Error && error.name === 'ValidationError') {
      return ApiResponseHandler.success({
        message: "Validation error",
        success: false,
        details: error.message
      }, 400);
    }

    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}

// DELETE: Delete tag (Protected)
async function deleteTag(request: NextRequest, user: JWTPayload) {
  try {
    await connectDB();
    const Tag = await getTagModel();
    const Product = await getProductModel();

    // Extract ID from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const tagId = pathSegments[pathSegments.length - 1];

    const tag = await Tag.findById(tagId);
    if (!tag) {
      return ApiResponseHandler.error("Tag not found", 404);
    }

    // Check if user can delete this tag (admin or creator)
    if (!user.roles.includes('admin') && tag.createdBy.toString() !== user.userId) {
      return ApiResponseHandler.error("Access denied. You can only delete tags you created", 403);
    }

    // Check if tag is system tag
    if (tag.isSystem) {
      return ApiResponseHandler.error("System tags cannot be deleted", 403);
    }

    // Check if tag is being used by products
    const productsUsingTag = await Product.countDocuments({
      tags: tagId,
      deletedAt: null
    });

    if (productsUsingTag > 0) {
      return ApiResponseHandler.success({
        message: `Tag cannot be deleted as it is being used by ${productsUsingTag} product(s)`,
        success: false,
        data: { productsCount: productsUsingTag }
      }, 400);
    }

    await Tag.findByIdAndDelete(tagId);

    return ApiResponseHandler.success(null, "Tag deleted successfully");

  } catch (error) {
    console.error("Delete tag error:", error);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}

// Apply auth middleware and export handlers
export const POST = withAuth(updateTag);
// DELETE replaced by POST in Postman collection. Remove or refactor as needed.
