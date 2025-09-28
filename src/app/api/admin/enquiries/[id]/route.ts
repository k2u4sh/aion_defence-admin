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

// GET /api/admin/enquiries/[id] - Get a specific enquiry
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

    const enquiry = await Quote.findOne({ _id: id })
      .populate('productId', 'name images description')
      .populate('sellerId', 'firstName lastName email companyName')
      .populate('buyerId', 'firstName lastName email companyName')
      .lean();

    if (!enquiry) {
      return NextResponse.json(
        { success: false, message: "Enquiry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: enquiry
    });

  } catch (error) {
    console.error("Error fetching enquiry:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch enquiry" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/enquiries/[id] - Update a specific enquiry
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
      productId,
      productName,
      sellerId,
      buyerId,
      buyerName,
      buyerEmail,
      buyerPhone,
      message,
      quantity,
      status,
      sellerResponse,
      notes
    } = body;

    const enquiry = await Quote.findOne({ _id: id });

    if (!enquiry) {
      return NextResponse.json(
        { success: false, message: "Enquiry not found" },
        { status: 404 }
      );
    }

    // Update fields
    if (productId !== undefined) enquiry.productId = productId;
    if (productName !== undefined) enquiry.productName = productName;
    if (sellerId !== undefined) enquiry.sellerId = sellerId;
    if (buyerId !== undefined) enquiry.buyerId = buyerId;
    if (buyerName !== undefined) enquiry.buyerName = buyerName;
    if (buyerEmail !== undefined) enquiry.buyerEmail = buyerEmail;
    if (buyerPhone !== undefined) enquiry.buyerPhone = buyerPhone;
    if (message !== undefined) enquiry.message = message;
    if (quantity !== undefined) enquiry.quantity = quantity;
    if (status !== undefined) enquiry.status = status;
    if (sellerResponse !== undefined) enquiry.sellerResponse = sellerResponse;
    if (notes !== undefined) enquiry.notes = notes;

    await enquiry.save();

    // Populate the response
    await enquiry.populate([
      { path: 'productId', select: 'name images description' },
      { path: 'sellerId', select: 'firstName lastName email companyName' },
      { path: 'buyerId', select: 'firstName lastName email companyName' }
    ]);

    return NextResponse.json({
      success: true,
      data: enquiry,
      message: "Enquiry updated successfully"
    });

  } catch (error) {
    console.error("Error updating enquiry:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update enquiry" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/enquiries/[id] - Delete a specific enquiry
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

    const enquiry = await Quote.findOne({ _id: id });

    if (!enquiry) {
      return NextResponse.json(
        { success: false, message: "Enquiry not found" },
        { status: 404 }
      );
    }

    // Hard delete for enquiries (quotes)
    await Quote.deleteOne({ _id: id });

    return NextResponse.json({
      success: true,
      message: "Enquiry deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting enquiry:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete enquiry" },
      { status: 500 }
    );
  }
}
