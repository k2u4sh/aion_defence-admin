import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/db";
import Tag from "@/models/tagModel";
import { adminAccess } from "@/utils/adminAccess";

// GET /api/admin/tags/[id] - Get a specific tag
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin access
    const adminCheck = await adminAccess(request);
    if (!adminCheck.success) {
      return NextResponse.json(
        { success: false, message: adminCheck.message },
        { status: 401 }
      );
    }

    await connectDB();

    const tag = await Tag.findById(params.id)
      .populate("category", "name");

    if (!tag) {
      return NextResponse.json(
        { success: false, message: "Tag not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
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

// PUT /api/admin/tags/[id] - Update a tag
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin access
    const adminCheck = await adminAccess(request);
    if (!adminCheck.success) {
      return NextResponse.json(
        { success: false, message: adminCheck.message },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const adminId = adminCheck.adminId;

    // Check if trying to modify system tag
    const existingTag = await Tag.findById(params.id);
    if (existingTag?.isSystem && body.isSystem === false) {
      return NextResponse.json(
        { success: false, message: "Cannot modify system tag properties" },
        { status: 400 }
      );
    }

    const updateData = {
      ...body,
      updatedBy: adminId
    };

    const tag = await Tag.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("category", "name");

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
        { success: false, message: "Tag with this name or slug already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || "Failed to update tag" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/tags/[id] - Delete a tag
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin access
    const adminCheck = await adminAccess(request);
    if (!adminCheck.success) {
      return NextResponse.json(
        { success: false, message: adminCheck.message },
        { status: 401 }
      );
    }

    await connectDB();

    // Check if tag is system tag
    const tag = await Tag.findById(params.id);
    if (!tag) {
      return NextResponse.json(
        { success: false, message: "Tag not found" },
        { status: 404 }
      );
    }

    if (tag.isSystem) {
      return NextResponse.json(
        { success: false, message: "Cannot delete system tags" },
        { status: 400 }
      );
    }

    // Check if tag has products
    const Product = (await import("@/models/productModel")).default;
    const hasProducts = await Product.exists({ tags: params.id, deletedAt: null });
    if (hasProducts) {
      return NextResponse.json(
        { success: false, message: "Cannot delete tag with products. Please remove tag from products first." },
        { status: 400 }
      );
    }

    // Delete the tag
    await Tag.findByIdAndDelete(params.id);

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

