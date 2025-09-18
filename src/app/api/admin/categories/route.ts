import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/db";
import Category from "@/models/categoryModel";
import { requireAdminAuth } from "@/utils/adminAccess";

// Ensure models are registered
const ensureModelsRegistered = () => {
  // These imports will register the models with Mongoose
  Category;
};

// GET /api/admin/categories - Get all categories with pagination and filters
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const parentCategory = searchParams.get("parentCategory") || "";
    const level = searchParams.get("level") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    // Build query
    const query: any = { deletedAt: null };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    if (status) {
      query.isActive = status === "active";
    }

    if (parentCategory) {
      query.parentCategory = parentCategory;
    }

    if (level) {
      query.level = parseInt(level);
    }

    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Get categories with pagination
    const categories = await Category.find(query)
      .populate("parentCategory", "name level")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Category.countDocuments(query);

    // Get category statistics
    const stats = await Category.aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: null,
          totalCategories: { $sum: 1 },
          activeCategories: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] }
          },
          inactiveCategories: {
            $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] }
          }
        }
      }
    ]);

    const categoryStats = stats[0] || {
      totalCategories: 0,
      activeCategories: 0,
      inactiveCategories: 0
    };

    return NextResponse.json({
      success: true,
      message: "Categories fetched successfully",
      data: categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: categoryStats
    });

  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST /api/admin/categories - Create a new category
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const adminId = authCheck.admin?._id;

    if (!adminId) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 401 }
      );
    }

    // Calculate level based on parent category
    let level = 0;
    if (body.parentCategory) {
      const parent = await Category.findById(body.parentCategory);
      if (parent) {
        level = parent.level + 1;
      }
    }

    // Create category with admin as creator
    const categoryData = {
      ...body,
      level,
      createdBy: adminId,
      updatedBy: adminId
    };

    const category = new Category(categoryData);
    await category.save();

    // Populate the created category
    const populatedCategory = await Category.findById(category._id)
      .populate("parentCategory", "name level");

    return NextResponse.json({
      success: true,
      message: "Category created successfully",
      data: populatedCategory
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error creating category:", error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "Category with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to create category" },
      { status: 500 }
    );
  }
}