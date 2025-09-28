import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/utils/adminAccess";
import { connectToDatabase as connectDB } from "@/lib/db";
const Quote = require("@/models/quoteModel");
import User from "@/models/userModel";
import Product from "@/models/productModel";

// Ensure models are registered
const ensureModelsRegistered = () => {
  // These imports will register the models with Mongoose
  User;
  Product;
  Quote;
};

// GET /api/admin/enquiries - Get all enquiries (quotes) with pagination and filters
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
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: "i" } },
        { buyerName: { $regex: search, $options: "i" } },
        { buyerEmail: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } }
      ];
    }

    if (status) {
      query.status = status;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Calculate skip value
    const skip = (page - 1) * limit;

    // Get enquiries with populated fields
    const enquiries = await Quote.find(query)
      .populate('productId', 'name images')
      .populate('sellerId', 'firstName lastName email companyName')
      .populate('buyerId', 'firstName lastName email companyName')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalEnquiries = await Quote.countDocuments(query);
    const totalPages = Math.ceil(totalEnquiries / limit);

    return NextResponse.json({
      success: true,
      data: {
        enquiries,
        pagination: {
          currentPage: page,
          totalPages,
          totalEnquiries,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error("Error fetching enquiries:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch enquiries" },
      { status: 500 }
    );
  }
}

// POST /api/admin/enquiries - Create a new enquiry (quote)
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
    const {
      productId,
      productName,
      sellerId,
      buyerId,
      buyerName,
      buyerEmail,
      buyerPhone,
      message,
      quantity,
      notes
    } = body;

    // Validate required fields
    if (!productId || !productName || !sellerId || !buyerName || !message || !quantity) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create new enquiry
    const newEnquiry = new Quote({
      productId,
      productName,
      sellerId,
      buyerId,
      buyerName,
      buyerEmail,
      buyerPhone,
      message,
      quantity,
      notes,
      status: 'pending'
    });

    await newEnquiry.save();

    // Populate the response
    await newEnquiry.populate([
      { path: 'productId', select: 'name images' },
      { path: 'sellerId', select: 'firstName lastName email companyName' },
      { path: 'buyerId', select: 'firstName lastName email companyName' }
    ]);

    return NextResponse.json({
      success: true,
      data: newEnquiry,
      message: "Enquiry created successfully"
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating enquiry:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create enquiry" },
      { status: 500 }
    );
  }
}
