import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/db";
import Tag from "@/models/tagModel";
import { requireAdminAuth } from "@/utils/adminAccess";

// Ensure models are registered
const ensureModelsRegistered = () => {
  // These imports will register the models with Mongoose
  Tag;
};

// GET /api/admin/tags - Get all tags with pagination and filters
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
    const color = searchParams.get("color") || "";
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

    if (color) {
      query.color = color;
    }

    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Get tags with pagination
    const tags = await Tag.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Tag.countDocuments(query);

    // Get tag statistics
    const stats = await Tag.aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: null,
          totalTags: { $sum: 1 },
          activeTags: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] }
          },
          inactiveTags: {
            $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] }
          }
        }
      }
    ]);

    const tagStats = stats[0] || {
      totalTags: 0,
      activeTags: 0,
      inactiveTags: 0
    };

    return NextResponse.json({
      success: true,
      message: "Tags fetched successfully",
      data: tags,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: tagStats
    });

  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}

// POST /api/admin/tags - Create a new tag
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

    // Create tag with admin as creator
    const tagData = {
      ...body,
      createdBy: adminId,
      updatedBy: adminId
    };

    const tag = new Tag(tagData);
    await tag.save();

    return NextResponse.json({
      success: true,
      message: "Tag created successfully",
      data: tag
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error creating tag:", error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "Tag with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to create tag" },
      { status: 500 }
    );
  }
}