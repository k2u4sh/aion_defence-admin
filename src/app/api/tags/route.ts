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

// GET: Fetch all tags (Public)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const Tag = await getTagModel();

    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Filters
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');
    const popular = searchParams.get('popular') === 'true';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Build query
    const query: Record<string, unknown> = {};

    if (isActive !== null) {
      query.isActive = isActive === 'true';
    } else {
      query.isActive = true; // Default to active tags only
    }

    if (category) {
      query.$or = [
        { category: category },
        { category: null } // Include global tags
      ];
    }

    // Search functionality
    if (search) {
      query.$and = (query.$and as Array<Record<string, unknown>>) || [];
      (query.$and as Array<Record<string, unknown>>).push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }

    let tags;
    
    if (popular) {
      // Get popular tags
      const popularLimit = Math.min(limit, 20); // Max 20 for popular tags
      tags = await (Tag as unknown as { getPopularTags(limit: number, categoryId?: string | null): Promise<unknown[]> }).getPopularTags(popularLimit, category);
    } else {
      // Regular query with sorting
      const sortOptions: Record<string, 1 | -1> = {};
      if (sortBy === 'popularity') {
        sortOptions['metadata.totalProducts'] = sortOrder === 'asc' ? 1 : -1;
      } else {
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
      }

      tags = await Tag.find(query)
        .populate('category', 'name slug')
        .populate('createdBy', 'firstName lastName')
        .sort(sortOptions as { [key: string]: 1 | -1 })
        .skip(skip)
        .limit(limit);
    }

    // Get total count for pagination (only if not popular)
    let total = 0;
    let totalPages = 0;
    
    if (!popular) {
      total = await Tag.countDocuments(query);
      totalPages = Math.ceil(total / limit);
    }

    return ApiResponseHandler.success({
      tags,
      pagination: popular ? null : {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    }, "Tags fetched successfully");

  } catch (error) {
    console.error("Get tags error:", error);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}

// POST: Create new tag (Protected)
async function createTag(request: NextRequest, user: JWTPayload) {
  try {
    await connectDB();
    const Tag = await getTagModel();
    const Category = await getCategoryModel();

    const body = await request.json();
    const {
      name,
      description,
      color,
      category,
      isActive = true,
      sortOrder = 0
    } = body;

    // Validate required fields
    if (!name || name.trim().length < 2) {
      return ApiResponseHandler.error("Tag name is required and must be at least 2 characters", 400);
    }

    // Check if tag already exists
    const existingTag = await Tag.findOne({
      name: name.toLowerCase().trim()
    });

    if (existingTag) {
      return ApiResponseHandler.error("A tag with this name already exists", 409);
    }

    // Validate category if provided
    if (category) {
      const categoryDoc = await Category.findById(category);
      if (!categoryDoc) {
        return ApiResponseHandler.error("Category not found", 404);
      }
    }

    // Validate color format if provided
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return ApiResponseHandler.error("Color must be a valid hex color code (e.g., #FF5733)", 400);
    }

    // Create tag
    const tag = new Tag({
      name: name.trim(),
      description: description?.trim(),
      color: color || "#6B7280",
      category: category || null,
      isActive,
      sortOrder,
      createdBy: user.userId,
      updatedBy: user.userId
    });

    const savedTag = await tag.save();

    // Populate the response
    await savedTag.populate([
      { path: 'category', select: 'name slug' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);

    return ApiResponseHandler.success({
      tag: savedTag
    }, "Tag created successfully", 201);

  } catch (error) {
    console.error("Create tag error:", error);
    
    if (error instanceof Error && error.name === 'ValidationError') {
      return ApiResponseHandler.error("Validation error: " + error.message, 400);
    }

    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}

// Export the protected POST route
export const POST = withAuth(createTag);
