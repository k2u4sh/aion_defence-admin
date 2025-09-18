import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/db";
import Product from "@/models/productModel";
import User from "@/models/userModel";
import Category from "@/models/categoryModel";
import Tag from "@/models/tagModel";
import { requireAdminAuth } from "@/utils/adminAccess";

// Ensure models are registered
const ensureModelsRegistered = () => {
  // These imports will register the models with Mongoose
  User;
  Category;
  Tag;
  Product;
};

// GET /api/admin/products - Get all products with pagination and filters
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
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const subCategory = searchParams.get("subCategory") || "";
    const seller = searchParams.get("seller") || "";
    const minPrice = searchParams.get("minPrice") || "";
    const maxPrice = searchParams.get("maxPrice") || "";
    const stockFilter = searchParams.get("stockFilter") || "";
    const featured = searchParams.get("featured") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build query
    const query: any = { deletedAt: null };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { shortDescription: { $regex: search, $options: "i" } }
      ];
    }

    if (status) {
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    if (subCategory) {
      query.subCategory = subCategory;
    }

    if (seller) {
      query.seller = seller;
    }

    if (minPrice) {
      query.basePrice = { ...query.basePrice, $gte: parseFloat(minPrice) };
    }

    if (maxPrice) {
      query.basePrice = { ...query.basePrice, $lte: parseFloat(maxPrice) };
    }

    if (stockFilter) {
      switch (stockFilter) {
        case 'out_of_stock':
          query.quantity = { $lte: 0 };
          break;
        case 'low_stock':
          query.$expr = { $lte: ["$quantity", "$lowStockThreshold"] };
          query.quantity = { $gt: 0 };
          break;
        case 'in_stock':
          query.$expr = { $gt: ["$quantity", "$lowStockThreshold"] };
          break;
      }
    }

    if (featured && featured !== "") {
      query.isFeatured = featured === "true";
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Calculate skip value
    const skip = (page - 1) * limit;

    // Get products with populated fields
    const products = await Product.find(query)
      .populate("category", "name")
      .populate("subCategory", "name")
      .populate("tags", "name color")
      .populate("seller", "firstName lastName companyName")
      .populate("supplier", "firstName lastName companyName")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Product.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/admin/products - Create a new product
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
    const adminId = authCheck.admin?._id;
    if (!adminId) return NextResponse.json(
      { success: false, message: "Admin not found" },
      { status: 401 }
    );

    // Create product with admin as creator
    const productData = {
      ...body,
      createdBy: adminId,
      updatedBy: adminId
    };

    const product = new Product(productData);
    await product.save();

    // Populate the created product
    const populatedProduct = await Product.findById(product._id)
      .populate("category", "name")
      .populate("subCategory", "name")
      .populate("tags", "name color")
      .populate("seller", "name email");

    return NextResponse.json({
      success: true,
      message: "Product created successfully",
      data: populatedProduct
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error creating product:", error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "Product with this SKU or slug already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
