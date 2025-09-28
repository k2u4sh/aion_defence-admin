import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/db";
import Product from "@/models/productModel";
import User from "@/models/userModel";
import Category from "@/models/categoryModel";
import Tag from "@/models/tagModel";
import { requireAdminAuth } from "@/utils/adminAccess";
import mongoose from "mongoose";

// Ensure models are registered
const ensureModelsRegistered = () => {
  // These imports will register the models with Mongoose
  User;
  Category;
  Tag;
  Product;
};

// Helper function to validate ObjectId
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
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
      if (isValidObjectId(category)) {
        query.category = category;
      } else {
        // If it's not a valid ObjectId, search by category name
        const categoryDoc = await Category.findOne({ name: { $regex: category, $options: "i" } });
        if (categoryDoc) {
          query.category = categoryDoc._id;
        }
      }
    }

    if (subCategory) {
      if (isValidObjectId(subCategory)) {
        query.subCategory = subCategory;
      } else {
        // If it's not a valid ObjectId, search by subcategory name
        const subCategoryDoc = await Category.findOne({ name: { $regex: subCategory, $options: "i" } });
        if (subCategoryDoc) {
          query.subCategory = subCategoryDoc._id;
        }
      }
    }

    if (seller) {
      if (isValidObjectId(seller)) {
        query.seller = seller;
      } else {
        // If it's not a valid ObjectId, search by seller name or company
        const sellerDoc = await User.findOne({
          $or: [
            { firstName: { $regex: seller, $options: "i" } },
            { lastName: { $regex: seller, $options: "i" } },
            { companyName: { $regex: seller, $options: "i" } }
          ]
        });
        if (sellerDoc) {
          query.seller = sellerDoc._id;
        }
      }
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
      .populate("seller", "firstName lastName companyName")
      .populate("supplier", "firstName lastName companyName")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Manually populate tags with error handling
    const productsWithTags = await Promise.all(
      products.map(async (product) => {
        if (product.tags && Array.isArray(product.tags)) {
          const validTagIds = product.tags.filter(tagId => 
            typeof tagId === 'string' && isValidObjectId(tagId)
          );
          
          if (validTagIds.length > 0) {
            try {
              const tags = await Tag.find({ _id: { $in: validTagIds } })
                .select('name color')
                .lean();
              product.tags = tags as any;
            } catch (error) {
              console.warn('Error populating tags for product:', product._id, error);
              product.tags = [];
            }
          } else {
            product.tags = [];
          }
        }
        return product;
      })
    );

    // Get total count
    const total = await Product.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        products: productsWithTags,
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

  } catch (error: any) {
    console.error("Error fetching products:", error);
    
    // Log more detailed error information
    if (error.name === 'BSONError' || error.message?.includes('ObjectId')) {
      console.error("ObjectId validation error:", {
        message: error.message,
        value: error.value,
        path: error.path
      });
      return NextResponse.json(
        { success: false, message: "Invalid ID format provided" },
        { status: 400 }
      );
    }
    
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
