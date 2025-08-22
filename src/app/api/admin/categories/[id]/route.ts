import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/db";
import Category from "@/models/categoryModel";
import { adminAccess } from "@/utils/adminAccess";

// GET /api/admin/categories/[id] - Get a specific category
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

    const category = await Category.findById(params.id)
      .populate("parentCategory", "name")
      .populate("featuredProducts", "name");

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category
    });

  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/categories/[id] - Update a category
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

    // Calculate level based on parent category
    let level = 0;
    if (body.parentCategory) {
      const parent = await Category.findById(body.parentCategory);
      if (parent) {
        level = parent.level + 1;
        if (level > 3) {
          return NextResponse.json(
            { success: false, message: "Maximum category depth exceeded (max 3 levels)" },
            { status: 400 }
          );
        }
      }
    }

    const updateData = {
      ...body,
      level
    };

    const category = await Category.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("parentCategory", "name")
     .populate("featuredProducts", "name");

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Category updated successfully",
      data: category
    });

  } catch (error: any) {
    console.error("Error updating category:", error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "Category with this name or slug already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/categories/[id] - Delete a category
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

    // Check if category has children
    const hasChildren = await Category.exists({ parentCategory: params.id });
    if (hasChildren) {
      return NextResponse.json(
        { success: false, message: "Cannot delete category with subcategories. Please delete subcategories first." },
        { status: 400 }
      );
    }

    // Check if category has products
    const Product = (await import("@/models/productModel")).default;
    const hasProducts = await Product.exists({ category: params.id, deletedAt: null });
    if (hasProducts) {
      return NextResponse.json(
        { success: false, message: "Cannot delete category with products. Please remove or reassign products first." },
        { status: 400 }
      );
    }

    // Delete the category
    const category = await Category.findByIdAndDelete(params.id);

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete category" },
      { status: 500 }
    );
  }
}

