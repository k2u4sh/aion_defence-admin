import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/utils/adminAccess";
import { connectToDatabase as connectDB } from "@/lib/db";
const Bid = require("@/models/bidModel");
import User from "@/models/userModel";
import Category from "@/models/categoryModel";

// Ensure models are registered
const ensureModelsRegistered = () => {
  // These imports will register the models with Mongoose
  User;
  Category;
  Bid;
};

// GET /api/admin/bids/[id] - Get a specific bid
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
      .populate('buyer', 'firstName lastName email companyName')
      .populate('category', 'name')
      .populate('sellerResponses.seller', 'firstName lastName companyName email')
      .populate('sellerResponse.seller', 'firstName lastName companyName email')
      .populate('comments.author', 'firstName lastName')
      .lean();

    if (!bid) {
      return NextResponse.json(
        { success: false, message: "Bid not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: bid
    });

  } catch (error) {
    console.error("Error fetching bid:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch bid" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/bids/[id] - Update a specific bid
export async function PUT(
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
      bidName,
      category,
      technicalRequirements,
      technicalDocuments,
      duration,
      priority,
      status,
      expiresAt
    } = body;

    const bid = await Bid.findOne({ _id: id, deletedAt: null });

    if (!bid) {
      return NextResponse.json(
        { success: false, message: "Bid not found" },
        { status: 404 }
      );
    }

    // Update fields
    if (bidName !== undefined) bid.bidName = bidName;
    if (category !== undefined) bid.category = category;
    if (technicalRequirements !== undefined) bid.technicalRequirements = technicalRequirements;
    if (technicalDocuments !== undefined) bid.technicalDocuments = technicalDocuments;
    if (duration !== undefined) bid.duration = duration;
    if (priority !== undefined) bid.priority = priority;
    if (status !== undefined) bid.status = status;
    if (expiresAt !== undefined) bid.expiresAt = new Date(expiresAt);
    
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
      message: "Bid updated successfully"
    });

  } catch (error) {
    console.error("Error updating bid:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update bid" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/bids/[id] - Delete a specific bid (soft delete)
export async function DELETE(
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

    const bid = await Bid.findOne({ _id: id, deletedAt: null });

    if (!bid) {
      return NextResponse.json(
        { success: false, message: "Bid not found" },
        { status: 404 }
      );
    }

    // Soft delete
    bid.deletedAt = new Date();
    bid.updatedBy = authCheck.admin?._id;
    await bid.save();

    return NextResponse.json({
      success: true,
      message: "Bid deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting bid:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete bid" },
      { status: 500 }
    );
  }
}
