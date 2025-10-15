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
      parentLinked: 0,
      errors: [] as any[]
    };

    // Build a cache of existing categories for quick lookup
    const existing = await Category.find({}, { _id: 1, name: 1, slug: 1, level: 1 }).lean();
    const nameToId = new Map<string, string>();
    const slugToId = new Map<string, string>();
    existing.forEach((c: any) => {
      nameToId.set(String(c.name).toLowerCase(), String(c._id));
      slugToId.set(String(c.slug).toLowerCase(), String(c._id));
    });

    // First pass: create/update categories WITHOUT assigning parent
    for (let i = 0; i < data.length; i++) {
      try {
        const categoryData = data[i];
        if (!categoryData.name) {
          results.errors.push({ row: i + 1, error: "Name is required", data: categoryData });
          results.skipped++;
          continue;
        }

        const name = String(categoryData.name).trim();
        const slug = (categoryData.slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')).trim();

        const categoryPayload: any = {
          name,
          slug,
          description: categoryData.description || "",
          // Level will be set in pass 2 once parent is known
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

        // find by name/slug
        const existingId = nameToId.get(name.toLowerCase()) || slugToId.get(slug.toLowerCase());
        if (existingId) {
          if (updateExisting) {
            await Category.findByIdAndUpdate(existingId, categoryPayload, { runValidators: true });
            results.updated++;
          } else {
            results.skipped++;
          }
        } else {
          const created = await Category.create(categoryPayload);
          nameToId.set(name.toLowerCase(), String(created._id));
          slugToId.set(slug.toLowerCase(), String(created._id));
          results.created++;
        }
      } catch (error: any) {
        results.errors.push({ row: i + 1, error: error.message || "Unknown error", data: data[i] });
        results.skipped++;
      }
    }

    // Second pass: resolve parentCategory and update level for children
    for (let i = 0; i < data.length; i++) {
      const categoryData = data[i];
      const name = String(categoryData.name || '').trim();
      const slug = (categoryData.slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')).trim();
      const childId = nameToId.get(name.toLowerCase()) || slugToId.get(slug.toLowerCase());
      if (!childId) continue;

      const parentRef = categoryData.parentCategory;
      if (!parentRef) continue;

      let parentId: string | null = null;
      if (typeof parentRef === 'string') {
        parentId = nameToId.get(parentRef.toLowerCase()) || slugToId.get(parentRef.toLowerCase()) || null;
        if (!parentId) {
          // Try lookup by direct _id string
          try {
            const parentDoc = await Category.findOne({ $or: [ { _id: parentRef }, { name: parentRef } ] }, { _id: 1, name: 1, level: 1 }).lean() as any;
            if (parentDoc && parentDoc._id) {
              parentId = String(parentDoc._id);
              if (parentDoc.name) {
                nameToId.set(String(parentDoc.name).toLowerCase(), parentId);
              }
            }
          } catch {}
        }
      } else if (parentRef && parentRef._id) {
        parentId = String(parentRef._id);
      }

      if (parentId) {
        const parentDoc = await Category.findById(parentId, { level: 1 }).lean() as any;
        const newLevel = ((parentDoc && parentDoc.level) ? parentDoc.level : 0) + 1;
        await Category.findByIdAndUpdate(childId, { parentCategory: parentId, level: newLevel });
        results.parentLinked++;
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
