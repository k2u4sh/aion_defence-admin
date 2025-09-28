import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/db";
import Tag from "@/models/tagModel";
import Product from "@/models/productModel";
import { requireAdminAuth } from "@/utils/adminAccess";

// Ensure models are registered
const ensureModelsRegistered = () => {
  // These imports will register the models with Mongoose
  Tag;
  Product;
};

// GET /api/admin/tags/[id] - Get a specific tag
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

    const tag = await Tag.findById(id).lean();

    if (!tag) {
      return NextResponse.json(
        { success: false, message: "Tag not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tag fetched successfully",
      data: tag
    });

  } catch (error) {
    console.error("Error fetching tag:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch tag" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/tags/[id] - Update a specific tag
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
    const adminId = authCheck.admin?._id;

    if (!adminId) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 401 }
      );
    }

    // Update tag with admin as updater
    const tagData = {
      ...body,
      updatedBy: adminId
    };

    const tag = await Tag.findByIdAndUpdate(
      id,
      tagData,
      { new: true, runValidators: true }
    );

    if (!tag) {
      return NextResponse.json(
        { success: false, message: "Tag not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tag updated successfully",
      data: tag
    });

  } catch (error: any) {
    console.error("Error updating tag:", error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "Tag with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to update tag" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/tags/[id] - Delete a specific tag
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
    const adminId = authCheck.admin?._id;

    if (!adminId) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 401 }
      );
    }

    // Check if tag exists and is not already deleted
    const existingTag = await Tag.findOne({ 
      _id: id, 
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } }
      ]
    });
    
    
    if (!existingTag) {
      return NextResponse.json(
        { success: false, message: "Tag not found" },
        { status: 404 }
      );
    }

    // Check if tag is a system tag
    if (existingTag.isSystem) {
      return NextResponse.json(
        { success: false, message: "System tags cannot be deleted" },
        { status: 403 }
      );
    }

    // Check if tag is being used by any products
    const productsUsingTag = await Product.countDocuments({
      tags: id,
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } }
      ]
    });


    if (productsUsingTag > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot delete tag. It is currently being used by ${productsUsingTag} product(s). Please remove the tag from all products first.` 
        },
        { status: 400 }
      );
    }

    // Soft delete the tag
    const tag = await Tag.findByIdAndUpdate(
      id,
      { 
        deletedAt: new Date(),
        updatedBy: adminId
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Tag deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete tag" },
      { status: 500 }
    );
  }
}