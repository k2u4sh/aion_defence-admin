import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/db";
import Category from "@/models/categoryModel";
import { requireAdminAuth } from "@/utils/adminAccess";
import { csvToJSON, mapCategoryCSVToJSON } from "@/utils/csvParser";

// Ensure models are registered
const ensureModelsRegistered = () => {
  Category;
};

// POST /api/admin/categories/import - Import categories from CSV/JSON
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const updateExisting = formData.get('updateExisting') === 'true';

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided." },
        { status: 400 }
      );
    }

    const fileContent = await file.text();
    const fileName = file.name.toLowerCase();
    let data: any[];

    try {
      if (fileName.endsWith('.csv')) {
        // Parse CSV file
        const csvData = csvToJSON(fileContent);
        data = mapCategoryCSVToJSON(csvData);
      } else if (fileName.endsWith('.json')) {
        // Parse JSON file
        const jsonData = JSON.parse(fileContent);
        data = Array.isArray(jsonData) ? jsonData : [jsonData];
      } else {
        return NextResponse.json(
          { success: false, message: "Unsupported file format. Please use CSV or JSON files." },
          { status: 400 }
        );
      }
    } catch (error: any) {
      return NextResponse.json(
        { success: false, message: `Error parsing file: ${error.message}` },
        { status: 400 }
      );
    }

    const results = {
      total: data.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as any[]
    };

    // Process each category
    for (let i = 0; i < data.length; i++) {
      try {
        const categoryData = data[i];
        
        // Validate required fields
        if (!categoryData.name) {
          results.errors.push({
            row: i + 1,
            error: "Name is required",
            data: categoryData
          });
          results.skipped++;
          continue;
        }

        // Prepare category data
        const categoryPayload: any = {
          name: categoryData.name.trim(),
          slug: categoryData.slug || categoryData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          description: categoryData.description || "",
          level: parseInt(categoryData.level) || 0,
          isActive: categoryData.isActive !== undefined ? Boolean(categoryData.isActive) : true,
          sortOrder: parseInt(categoryData.sortOrder) || 0,
          image: categoryData.image || "",
          icon: categoryData.icon || "",
          metaTitle: categoryData.metaTitle || "",
          metaDescription: categoryData.metaDescription || "",
          keywords: categoryData.keywords ? (Array.isArray(categoryData.keywords) ? categoryData.keywords : categoryData.keywords.split(',').map((k: string) => k.trim())) : [],
          createdAt: categoryData.createdAt ? new Date(categoryData.createdAt) : new Date(),
          updatedAt: new Date()
        };

        // Handle parent category
        if (categoryData.parentCategory) {
          if (typeof categoryData.parentCategory === 'string') {
            // If it's a string, try to find the parent category by name or ID
            const parentCategory = await Category.findOne({
              $or: [
                { name: categoryData.parentCategory },
                { _id: categoryData.parentCategory }
              ]
            });
            
            if (parentCategory) {
              categoryPayload.parentCategory = parentCategory._id;
              categoryPayload.level = parentCategory.level + 1;
            }
          } else if (categoryData.parentCategory._id) {
            categoryPayload.parentCategory = categoryData.parentCategory._id;
            categoryPayload.level = (categoryData.parentCategory.level || 0) + 1;
          }
        }

        // Check if category already exists
        const existingCategory = await Category.findOne({
          $or: [
            { name: categoryPayload.name },
            { slug: categoryPayload.slug }
          ]
        });

        if (existingCategory) {
          if (updateExisting) {
            // Update existing category
            await Category.findByIdAndUpdate(existingCategory._id, categoryPayload, { runValidators: true });
            results.updated++;
          } else {
            // Skip existing category
            results.skipped++;
            results.errors.push({
              row: i + 1,
              error: "Category already exists",
              data: { name: categoryPayload.name, slug: categoryPayload.slug }
            });
          }
        } else {
          // Create new category
          const newCategory = new Category(categoryPayload);
          await newCategory.save();
          results.created++;
        }

      } catch (error: any) {
        results.errors.push({
          row: i + 1,
          error: error.message || "Unknown error",
          data: data[i]
        });
        results.skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Import completed",
      results
    });

  } catch (error) {
    console.error("Error importing categories:", error);
    return NextResponse.json(
      { success: false, message: "Failed to import categories" },
      { status: 500 }
    );
  }
}
