import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/db";
import Category from "@/models/categoryModel";
import { requireAdminAuth } from "@/utils/adminAccess";

// Ensure models are registered
const ensureModelsRegistered = () => {
  Category;
};

// GET /api/admin/categories/export - Export categories to CSV
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
    const format = searchParams.get("format") || "csv";
    const status = searchParams.get("status") || "";

    // Build query
    const query: any = { deletedAt: null };
    
    if (status) {
      query.isActive = status === "active";
    }

    // Get all categories with populated parent category
    const categories = await Category.find(query)
      .populate("parentCategory", "name")
      .sort({ level: 1, sortOrder: 1, name: 1 })
      .lean();

    if (format === "csv") {
      // Generate CSV content
      const csvHeaders = [
        "ID",
        "Name",
        "Slug",
        "Description",
        "Parent Category",
        "Level",
        "Is Active",
        "Sort Order",
        "Image",
        "Icon",
        "Meta Title",
        "Meta Description",
        "Keywords",
        "Created At",
        "Updated At"
      ];

      const csvRows = categories.map(category => [
        category._id,
        category.name,
        category.slug,
        category.description || "",
        category.parentCategory ? (category.parentCategory as any).name : "",
        category.level,
        category.isActive ? "Yes" : "No",
        category.sortOrder,
        category.image || "",
        category.icon || "",
        category.metaTitle || "",
        category.metaDescription || "",
        category.keywords ? category.keywords.join(", ") : "",
        new Date(category.createdAt).toISOString(),
        new Date(category.updatedAt).toISOString()
      ]);

      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="categories-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    } else if (format === "json") {
      // Return JSON format
      return NextResponse.json({
        success: true,
        data: categories,
        exportedAt: new Date().toISOString(),
        total: categories.length
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Unsupported format. Use 'csv' or 'json'" },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("Error exporting categories:", error);
    return NextResponse.json(
      { success: false, message: "Failed to export categories" },
      { status: 500 }
    );
  }
}

