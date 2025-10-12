import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/utils/adminAccess";
import { connectToDatabase as connectDB } from "@/lib/db";

// Ensure models are registered
const ensureModelsRegistered = () => {
  require("@/models/userModel");
  require("@/models/categoryModel");
  require("@/models/bidModel");
};

// GET /api/admin/bids - Get all bids with pagination and filters
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

    // Import models - using dynamic imports for ES modules
    const Bid = (await import("@/models/bidModel")).default;
    const User = (await import("@/models/userModel")).default;
    const Category = (await import("@/models/categoryModel")).default;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const priority = searchParams.get("priority") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build query
    const query: any = { deletedAt: null };
    
    if (search) {
      query.$or = [
        { bidName: { $regex: search, $options: "i" } },
        { technicalRequirements: { $regex: search, $options: "i" } },
        { "buyer.firstName": { $regex: search, $options: "i" } },
        { "buyer.lastName": { $regex: search, $options: "i" } },
        { "buyer.email": { $regex: search, $options: "i" } }
      ];
    }

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Calculate skip value
    const skip = (page - 1) * limit;

    // Get bids with populated fields
    const bids = await Bid.find(query)
      .populate('buyer', 'firstName lastName email companyName')
      .populate('category', 'name')
      .populate('sellerResponses.seller', 'firstName lastName companyName')
      .populate('sellerResponse.seller', 'firstName lastName companyName')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalBids = await Bid.countDocuments(query);
    const totalPages = Math.ceil(totalBids / limit);

    return NextResponse.json({
      success: true,
      data: {
        bids,
        pagination: {
          currentPage: page,
          totalPages,
          totalBids,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error("Error fetching bids:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch bids" },
      { status: 500 }
    );
  }
}

// POST /api/admin/bids - Create a new bid
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

    // Import models - using dynamic imports for ES modules
    const Bid = (await import("@/models/bidModel")).default;
    const User = (await import("@/models/userModel")).default;
    const Category = (await import("@/models/categoryModel")).default;

    const body = await request.json();
    const {
      bidName,
      buyer,
      category,
      technicalRequirements,
      technicalDocuments,
      duration,
      priority,
      expiresAt
    } = body;

    // Validate required fields
    if (!bidName || !buyer || !duration || !expiresAt) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create new bid
    const newBid = new Bid({
      bidName,
      buyer,
      category,
      technicalRequirements,
      technicalDocuments: technicalDocuments || [],
      duration,
      priority: priority || 'medium',
      expiresAt: new Date(expiresAt),
      createdBy: authCheck.admin?._id,
      status: 'pending'
    });

    await newBid.save();

    // Populate the response
    await newBid.populate([
      { path: 'buyer', select: 'firstName lastName email companyName' },
      { path: 'category', select: 'name' }
    ]);

    return NextResponse.json({
      success: true,
      data: newBid,
      message: "Bid created successfully"
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating bid:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create bid" },
      { status: 500 }
    );
  }
}
