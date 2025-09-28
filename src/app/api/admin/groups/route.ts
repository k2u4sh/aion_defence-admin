import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/db";
import { requireAdminAuth } from "@/utils/adminAccess";

// Ensure models are registered
const ensureModelsRegistered = () => {
  // These imports will register the models with Mongoose
  require("@/models/adminGroupModel");
};

// GET /api/admin/groups - Get all admin groups with pagination and filters
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
    
    // Ensure models are registered
    ensureModelsRegistered();
    
    // Get the AdminGroup model
    const AdminGroup = require("@/models/adminGroupModel").default;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const isActive = searchParams.get("isActive") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

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

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Calculate skip value
    const skip = (page - 1) * limit;

    // Get groups
    const groups = await AdminGroup.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await AdminGroup.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: groups,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}

// POST /api/admin/groups - Create a new admin group
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
    
    // Ensure models are registered
    ensureModelsRegistered();
    
    // Get the AdminGroup model
    const AdminGroup = require("@/models/adminGroupModel").default;

    const body = await request.json();
    const adminId = authCheck.admin?._id;
    if (!adminId) return NextResponse.json(
      { success: false, message: "Admin not found" },
      { status: 401 }
    );

    // Create group with admin as creator
    const groupData = {
      ...body,
      createdBy: adminId,
      updatedBy: adminId
    };

    const group = new AdminGroup(groupData);
    await group.save();

    return NextResponse.json({
      success: true,
      message: "Group created successfully",
      data: group
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error creating group:", error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "Group with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || "Failed to create group" },
      { status: 500 }
    );
  }
}


