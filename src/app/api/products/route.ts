import { connectDB } from "@/utils/db";
import { NextRequest } from "next/server";
import { withAuth } from "@/utils/auth";
import { ApiResponseHandler, ErrorMessages, SuccessMessages } from "@/utils/apiResponse";
import { Validator } from "@/utils/validation";
import type { JWTPayload } from "@/utils/jwt";

// Dynamic import for models
const getProductModel = async () => {
  const productModule = await import("@/models/productModel");
  return productModule.default;
};

const getCategoryModel = async () => {
  const categoryModule = await import("@/models/categoryModel");
  return categoryModule.default;
};

const getTagModel = async () => {
  const tagModule = await import("@/models/tagModel");
  return tagModule.default;
};

// GET: Fetch all products with filtering and pagination (Public)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const Product = await getProductModel();

    const { searchParams } = new URL(request.url);
    
    // Validate and sanitize pagination parameters
    const { page, limit } = Validator.validatePagination({
      page: searchParams.get('page'),
      limit: searchParams.get('limit')
    });
    const skip = (page - 1) * limit;

    // Filters
    const category = searchParams.get('category');
    const subCategory = searchParams.get('subCategory');
    const seller = searchParams.get('seller');
    const status = searchParams.get('status') || 'active';
    const isVisible = searchParams.get('isVisible');
    const isFeatured = searchParams.get('isFeatured');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const search = searchParams.get('search');
    const tags = searchParams.get('tags');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    const query: Record<string, unknown> = { deletedAt: null };

    if (status) query.status = status;
    if (isVisible !== null) query.isVisible = isVisible === 'true';
    if (isFeatured !== null) query.isFeatured = isFeatured === 'true';
    if (category) query.category = category;
    if (subCategory) query.subCategory = subCategory;
    if (seller) query.seller = seller;
    
    // Price range filter
    try {
      const priceRange = Validator.validatePriceRange(minPrice || undefined, maxPrice || undefined);
      if (priceRange) {
        (query as any).basePrice = {};
        if (priceRange.min !== undefined) (query as any).basePrice.$gte = priceRange.min;
        if (priceRange.max !== undefined) (query as any).basePrice.$lte = priceRange.max;
      }
    } catch (error) {
      if (error instanceof Error) {
        return ApiResponseHandler.validationError({}, error.message);
      }
    }

    // Tags filter
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    // Search functionality
    let products;
    if (search) {
      products = await Product.find({
        $and: [
          query,
          { $text: { $search: search } }
        ]
      }, { score: { $meta: 'textScore' } })
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .populate('tags', 'name slug color')
      .populate('seller', 'firstName lastName companyName sellerProfile.isVerifiedSeller sellerProfile.sellerRating')
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit);
    } else {
          // Validate and sanitize sorting parameters
    const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'basePrice', 'rating', 'salesCount'];
    const sortParams = Validator.validateSorting(
      { sortBy, sortOrder },
      allowedSortFields
    );
    
    const sortOptions: Record<string, number> = {};
    sortOptions[sortParams.field] = sortParams.order;

      products = await Product.find(query)
        .populate('category', 'name slug')
        .populate('subCategory', 'name slug')
        .populate('tags', 'name slug color')
        .populate('seller', 'firstName lastName companyName sellerProfile.isVerifiedSeller sellerProfile.sellerRating')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .sort(sortOptions as any)
        .skip(skip)
        .limit(limit);
    }

    // Get total count for pagination
    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return ApiResponseHandler.paginated(products, page, limit, total, "Products fetched successfully");

  } catch (error) {
    console.error("Get products error:", error);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}

// POST: Create new product (Protected)
async function createProduct(request: NextRequest, user: JWTPayload) {
  try {
    await connectDB();
    const Product = await getProductModel();
    const Category = await getCategoryModel();
    const Tag = await getTagModel();

    const body = await request.json();
    const {
      name,
      slug,
      description,
      shortDescription,
      category,
      subCategory,
      basePrice,
      comparePrice,
      cost,
      sku,
      quantity = 0,
      images = [],
      specifications = [],
      tags = [],
      status = 'draft',
      isVisible = true,
      isFeatured = false,
      weight,
      dimensions,
      seo = {}
    } = body;

    // Check if user has seller role
    if (!user.roles.includes('seller')) {
      return ApiResponseHandler.error("You must be a seller to create products", 403);
    }

    // Validate required fields
    if (!name || !description || !category || !basePrice || !sku) {
      return ApiResponseHandler.error("Name, description, category, base price, and SKU are required", 400);
    }

    // Validate category exists
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return ApiResponseHandler.error("Category not found", 404);
    }

    // Validate subcategory if provided (must be a child category of the main category)
    if (subCategory) {
      const subCategoryDoc = await Category.findOne({
        _id: subCategory,
        parentCategory: category
      });
      if (!subCategoryDoc) {
        return ApiResponseHandler.error("Subcategory not found or not a child of the specified category", 404);
      }
    }

    // Validate tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      const validTags = await Tag.find({
        _id: { $in: tags },
        isActive: true
      });

      if (validTags.length !== tags.length) {
        return ApiResponseHandler.error("One or more tags are invalid or inactive", 400);
      }
    }

    // Check for duplicate SKU
    const existingProduct = await Product.findOne({
      sku: sku.toUpperCase(),
      deletedAt: null
    });

    if (existingProduct) {
      return ApiResponseHandler.error("A product with this SKU already exists", 409);
    }

    // Check for duplicate slug
    if (slug) {
      const existingSlug = await Product.findOne({
        slug: slug.toLowerCase(),
        deletedAt: null
      });

      if (existingSlug) {
        return ApiResponseHandler.error("A product with this slug already exists", 409);
      }
    }

    // Create product
    const getUserModel = await import("@/models/userModel");
    const User = getUserModel.default;
    
    // Get seller information
    const sellerUser = await User.findById(user.userId);
    if (!sellerUser) {
      return ApiResponseHandler.error("Seller not found", 404);
    }

    const product = new Product({
      name: name.trim(),
      slug: slug?.toLowerCase().trim(),
      description: description.trim(),
      shortDescription: shortDescription?.trim(),
      category,
      subCategory,
      seller: user.userId,
      sellerInfo: {
        businessName: sellerUser.companyName,
        location: sellerUser.addresses?.[0] ? 
          `${sellerUser.addresses[0].city}, ${sellerUser.addresses[0].country}` : '',
        isVerified: (sellerUser.sellerProfile && typeof sellerUser.sellerProfile === 'object' && 'isVerifiedSeller' in sellerUser.sellerProfile)
          ? Boolean((sellerUser.sellerProfile as { isVerifiedSeller?: boolean }).isVerifiedSeller)
          : false
      },
      basePrice,
      comparePrice,
      cost,
      sku: sku.toUpperCase(),
      quantity,
      images,
      specifications,
      tags: tags || [],
      status,
      isVisible,
      isFeatured,
      weight,
      dimensions,
      seo,
      createdBy: user.userId,
      updatedBy: user.userId
    });

    const savedProduct = await product.save();

    // Populate the response
    await savedProduct.populate([
      { path: 'category', select: 'name slug' },
      { path: 'subCategory', select: 'name slug' },
      { path: 'tags', select: 'name slug color' }
    ]);

    return ApiResponseHandler.success({
      message: "Product created successfully",
      success: true,
      data: {
        product: savedProduct
      }
    }, 201);

  } catch (error) {
    console.error("Create product error:", error);
    
    if (error instanceof Error && error.name === 'ValidationError') {
      return ApiResponseHandler.error("Validation error", 400);
    }

    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}

// Export the protected POST route
export const POST = withAuth(createProduct);
