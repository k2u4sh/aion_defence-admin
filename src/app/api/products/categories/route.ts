import { NextRequest } from "next/server";
import { connectDB } from "@/utils/db";
import { ApiResponseHandler } from "@/utils/apiResponse";
import { withAuth } from "@/utils/auth";
import type { JWTPayload } from "@/utils/jwt";

// Dynamic model imports to avoid issues in Next.js edge/runtime
const getCategoryModel = async () => (await import("@/models/categoryModel")).default as any;
const getProductModel = async () => (await import("@/models/productModel")).default as any;

// GET: List categories (Public)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const Category = await getCategoryModel();

    const { searchParams } = new URL(request.url);

    // Filters and pagination
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const skip = (page - 1) * limit;

    const includeInactive = searchParams.get("includeInactive") === "true";
    const parentCategory = searchParams.get("parentCategory");
    const levelParam = searchParams.get("level");
    const level = levelParam !== null ? parseInt(levelParam, 10) : null;
    const search = searchParams.get("search");

    const sortBy = (searchParams.get("sortBy") || "sortOrder").toString();
    const sortOrder = (searchParams.get("sortOrder") || "asc").toString();

    const query: Record<string, any> = {};

    if (!includeInactive) {
      query.isActive = true;
    }

    if (level !== null && !Number.isNaN(level)) {
      query.level = level;
    }

    if (parentCategory !== null && parentCategory !== undefined) {
      if (parentCategory === "null" || parentCategory === "root") {
        query.parentCategory = null;
      } else {
        query.parentCategory = parentCategory;
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const sort: Record<string, 1 | -1> = {};
    const direction: 1 | -1 = sortOrder === "desc" ? -1 : 1;
    sort[sortBy] = direction;
    if (sortBy !== "name") {
      // Ensure stable secondary sort by name
      sort["name"] = 1;
    }

    const [categories, total] = await Promise.all([
      Category.find(query)
        .populate("parentCategory", "name slug")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Category.countDocuments(query)
    ]);

    return ApiResponseHandler.success(
      {
        categories
      },
      "Categories fetched successfully",
      200,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    );
  } catch (error) {
    console.error("Error fetching categories:", error);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}

// POST: Create category (Protected)
async function createCategory(request: NextRequest, _user: JWTPayload) {
  try {
    await connectDB();
    const Category = await getCategoryModel();

    const body = await request.json();
    const {
      name,
      description,
      image,
      icon,
      parentCategory,
      isActive = true,
      sortOrder = 0,
      tags = []
    } = body || {};

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return ApiResponseHandler.validationError({ name: ["Category name is required and must be at least 2 characters"] });
    }

    // Ensure unique name (case-insensitive)
    const existing = await Category.findOne({ name: new RegExp(`^${name}$`, "i") });
    if (existing) {
      return ApiResponseHandler.conflict("A category with this name already exists");
    }

    let level = 0;
    let validatedParent: any = null;
    if (parentCategory) {
      validatedParent = await Category.findById(parentCategory);
      if (!validatedParent) {
        return ApiResponseHandler.notFound("Parent category not found");
      }
      level = (validatedParent.level || 0) + 1;
      if (level > 3) {
        return ApiResponseHandler.validationError({ level: ["Maximum category depth (3) exceeded"] });
      }
    }

    const category = new Category({
      name: name.trim(),
      description: description?.toString().trim(),
      image: image?.toString().trim(),
      icon: icon?.toString().trim(),
      parentCategory: validatedParent ? validatedParent._id : null,
      level,
      isActive: Boolean(isActive),
      sortOrder: Number(sortOrder) || 0,
      tags: Array.isArray(tags) ? tags : []
    });

    const saved = await category.save();
    await saved.populate({ path: "parentCategory", select: "name slug" });

    return ApiResponseHandler.success({ category: saved }, "Category created successfully", 201);
  } catch (error) {
    console.error("Error creating category:", error);
    if (error instanceof Error && (error as any).name === "ValidationError") {
      return ApiResponseHandler.validationError({ general: [error.message] });
    }
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}
export const POST = withAuth(createCategory);

// PUT: Update category (Protected)
async function updateCategory(request: NextRequest, _user: JWTPayload) {
  try {
    await connectDB();
    const Category = await getCategoryModel();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return ApiResponseHandler.validationError({ id: ["Category ID is required"] });
    }

    const body = await request.json();
    const {
      name,
      description,
      image,
      icon,
      parentCategory,
      isActive,
      sortOrder,
      tags
    } = body || {};

    const category = await Category.findById(id);
    if (!category) {
      return ApiResponseHandler.notFound("Category not found");
    }

    const updates: Record<string, any> = {};

    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        return ApiResponseHandler.validationError({ name: ["Name must be at least 2 characters"] });
      }
      // Check duplicate name on update
      const duplicate = await Category.findOne({ _id: { $ne: id }, name: new RegExp(`^${name}$`, "i") });
      if (duplicate) {
        return ApiResponseHandler.conflict("Another category with this name already exists");
      }
      updates.name = name.trim();
    }

    if (description !== undefined) updates.description = description?.toString().trim();
    if (image !== undefined) updates.image = image?.toString().trim();
    if (icon !== undefined) updates.icon = icon?.toString().trim();
    if (isActive !== undefined) updates.isActive = Boolean(isActive);
    if (sortOrder !== undefined) updates.sortOrder = Number(sortOrder) || 0;
    if (Array.isArray(tags)) updates.tags = tags;

    if (parentCategory !== undefined) {
      if (parentCategory === null || parentCategory === "null" || parentCategory === "root") {
        updates.parentCategory = null;
        updates.level = 0;
      } else {
        if (String(parentCategory) === String(id)) {
          return ApiResponseHandler.validationError({ parentCategory: ["Category cannot be its own parent"] });
        }
        const parent = await Category.findById(parentCategory);
        if (!parent) {
          return ApiResponseHandler.notFound("Parent category not found");
        }
        const newLevel = (parent.level || 0) + 1;
        if (newLevel > 3) {
          return ApiResponseHandler.validationError({ level: ["Maximum category depth (3) exceeded"] });
        }
        updates.parentCategory = parent._id;
        updates.level = newLevel;
      }
    }

    const updated = await Category.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("parentCategory", "name slug");

    return ApiResponseHandler.success({ category: updated }, "Category updated successfully", 200);
  } catch (error) {
    console.error("Error updating category:", error);
    if (error instanceof Error && (error as any).name === "ValidationError") {
      return ApiResponseHandler.validationError({ general: [error.message] });
    }
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}
export const PUT = withAuth(updateCategory);

// DELETE: Delete category (Protected)
async function deleteCategory(request: NextRequest, _user: JWTPayload) {
  try {
    await connectDB();
    const Category = await getCategoryModel();
    const Product = await getProductModel();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return ApiResponseHandler.validationError({ id: ["Category ID is required"] });
    }

    const category = await Category.findById(id);
    if (!category) {
      return ApiResponseHandler.notFound("Category not found");
    }

    // Prevent delete if category has children
    const childrenCount = await Category.countDocuments({ parentCategory: id });
    if (childrenCount > 0) {
      return ApiResponseHandler.conflict("Cannot delete a category that has child categories");
    }

    // Prevent delete if products exist in this category
    const productsCount = await Product.countDocuments({ category: id });
    if (productsCount > 0) {
      return ApiResponseHandler.conflict("Cannot delete a category that has products");
    }

    await Category.deleteOne({ _id: id });

    return ApiResponseHandler.success({ message: "Category deleted successfully" }, "Category deleted successfully", 200);
  } catch (error) {
    console.error("Error deleting category:", error);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}
export const DELETE = withAuth(deleteCategory);
