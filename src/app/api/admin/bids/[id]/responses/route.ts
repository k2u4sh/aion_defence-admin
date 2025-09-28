import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/utils/adminAccess";
import { connectToDatabase as connectDB } from "@/lib/db";
const Bid = require("@/models/bidModel");
import User from "@/models/userModel";

// Ensure models are registered
const ensureModelsRegistered = () => {
  // These imports will register the models with Mongoose
  User;
  Bid;
};

// POST /api/admin/bids/[id]/responses - Add a seller response to a bid
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;

    const body = await request.json();
    const {
      sellerId,
      status = 'pending',
      quotedPrice,
      estimatedDelivery,
      notes,
      attachments = []
    } = body;

    // Validate required fields
    if (!sellerId) {
      return NextResponse.json(
        { success: false, message: "Seller ID is required" },
        { status: 400 }
      );
    }

    // Find the bid
    const bid = await Bid.findOne({ _id: id, deletedAt: null });

    if (!bid) {
      return NextResponse.json(
        { success: false, message: "Bid not found" },
        { status: 404 }
      );
    }

    // Check if seller already responded (check both fields)
    const existingResponse = bid.sellerResponses?.find(
      (response: any) => response.seller.toString() === sellerId
    ) || (bid.sellerResponse?.seller?.toString() === sellerId ? bid.sellerResponse : null);

    if (existingResponse) {
      return NextResponse.json(
        { success: false, message: "Seller has already responded to this bid" },
        { status: 400 }
      );
    }

    // Add the seller response - use sellerResponses array if it exists, otherwise create it
    if (!bid.sellerResponses) {
      bid.sellerResponses = [];
    }
    
    bid.sellerResponses.push({
      seller: sellerId,
      status,
      quotedPrice,
      estimatedDelivery,
      notes,
      attachments,
      respondedAt: new Date()
    });

    bid.updatedBy = authCheck.admin?._id;
    await bid.save();

    // Populate the response
    await bid.populate([
      { path: 'buyer', select: 'firstName lastName email companyName' },
      { path: 'category', select: 'name' },
      { path: 'sellerResponses.seller', select: 'firstName lastName companyName email' },
      { path: 'sellerResponse.seller', select: 'firstName lastName companyName email' }
    ]);

    return NextResponse.json({
      success: true,
      data: bid,
      message: "Seller response added successfully"
    });

  } catch (error) {
    console.error("Error adding seller response:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add seller response" },
      { status: 500 }
    );
  }
}

// GET /api/admin/bids/[id]/responses - Get all seller responses for a bid
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;

    const bid = await Bid.findOne({ _id: id, deletedAt: null })
      .populate('sellerResponses.seller', 'firstName lastName companyName email')
      .populate('sellerResponse.seller', 'firstName lastName companyName email')
      .lean();

    if (!bid) {
      return NextResponse.json(
        { success: false, message: "Bid not found" },
        { status: 404 }
      );
    }

    // Return responses from both fields
    const responses = bid.sellerResponses || [];
    if (bid.sellerResponse) {
      responses.push(bid.sellerResponse);
    }

    return NextResponse.json({
      success: true,
      data: responses
    });

  } catch (error) {
    console.error("Error fetching seller responses:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch seller responses" },
      { status: 500 }
    );
  }
}
