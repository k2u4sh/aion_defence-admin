import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/db";
import User from "@/models/userModel";
import Company from "@/models/companyModel";
import { requireAdminAuth } from "@/utils/adminAccess";

const ensureModelsRegistered = () => {
  User;
  Company;
};

// GET /api/admin/users - Get all users with pagination and filters
export async function GET(request: NextRequest) {
  try {
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
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const isActive = searchParams.get("isActive") || "";
    const isVerified = searchParams.get("isVerified") || "";
    const isBlocked = searchParams.get("isBlocked") || "";
    const role = searchParams.get("role") || "";
    const companyType = searchParams.get("companyType") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } }
      ];
    }

    if (isActive !== "") {
      query.isActive = isActive === "true";
    }

    if (isVerified !== "") {
      query.isVerified = isVerified === "true";
    }

    if (isBlocked !== "") {
      query.isBlocked = isBlocked === "true";
    }

    if (role) {
      query.roles = { $in: [role] };
    }

    if (companyType) {
      query.companyType = companyType;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Calculate skip value
    const skip = (page - 1) * limit;

    // Get users with company information
    const users = await User.find(query)
      .select("-password")
      .populate("company")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Debug logs removed - company data is now working

    // Get total count
    const total = await User.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        users,
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
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create a new user
export async function POST(request: NextRequest) {
  try {
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
    if (!adminId) return NextResponse.json(
      { success: false, message: "Admin not found" },
      { status: 401 }
    );

    // Create user with admin as creator
    const userData = {
      ...body,
      createdBy: adminId,
      updatedBy: adminId
    };

    const user = new User(userData);
    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      data: userResponse
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error creating user:", error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "User with this email already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}
