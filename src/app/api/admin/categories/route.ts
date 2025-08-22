import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/db";
import Category from "@/models/categoryModel";
import { requireAdminAuth } from "@/utils/adminAccess";

// GET /api/admin/categories - Get all categories with pagination and filters
export async function GET(request: NextRequest) {
  try {
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
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const isActive = searchParams.get("isActive") || "";
    const parentCategory = searchParams.get("parentCategory") || "";
    const sortBy = searchParams.get("sortBy") || "sortOrder";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    if (isActive !== "") {
      query.isActive = isActive === "true";
    }

    if (parentCategory) {
      if (parentCategory === "root") {
        query.parentCategory = null;
      } else {
        query.parentCategory = parentCategory;
      }
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Calculate skip value
    const skip = (page - 1) * limit;

    // Get categories with populated fields
    const categories = await Category.find(query)
      .populate("parentCategory", "name")
      .populate("featuredProducts", "name")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Category.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        categories,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage,
          hasPrevPage
        }
      }
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
    const adminId = authCheck.admin._id;

    // Create category with admin as creator
    const categoryData = {
      ...body,
      createdBy: adminId,
      updatedBy: adminId
    };

    const category = new Category(categoryData);
    await category.save();

    // Populate the created category
    const populatedCategory = await Category.findById(category._id)
      .populate("parentCategory", "name");

    return NextResponse.json({
      success: true,
      message: "Category created successfully",
      data: populatedCategory
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error creating category:", error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "Category with this name or slug already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || "Failed to create category" },
      { status: 500 }
    );
  }
}

