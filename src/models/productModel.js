import mongoose from "mongoose";

// Product Image Schema
const productImageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    trim: true
  },
  alt: {
    type: String,
    default: ''
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: true });

// Product Variant Schema (for different sizes, colors, etc.)
const variantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  comparePrice: {
    type: Number,
    min: 0
  },
  cost: {
    type: Number,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  weight: {
    type: Number,
    min: 0
  },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  },
  attributes: {
    color: String,
    size: String,
    material: String,
    // Add more variant-specific attributes as needed
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: true, timestamps: true });

// Product Specification Schema
const specificationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: String,
    required: true,
    trim: true
  },
  unit: {
    type: String,
    trim: true
  }
}, { _id: true });

// SEO Schema
const seoSchema = new mongoose.Schema({
  metaTitle: {
    type: String,
    maxlength: 60,
    trim: true
  },
  metaDescription: {
    type: String,
    maxlength: 160,
    trim: true
  },
  keywords: [{
    type: String,
    trim: true
  }],
  canonicalUrl: {
    type: String,
    trim: true
  }
}, { _id: false });

// Main Product Schema
const productSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },

  // Categories
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    index: true
  },
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    index: true
  },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag',
    index: true
  }],

  // Seller Information
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller is required'],
    index: true
  },
  sellerInfo: {
    businessName: String,
    location: String,
    isVerified: {
      type: Boolean,
      default: false
    }
  },

  // Pricing
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Price cannot be negative']
  },
  comparePrice: {
    type: Number,
    min: [0, 'Compare price cannot be negative']
  },
  cost: {
    type: Number,
    min: [0, 'Cost cannot be negative']
  },
  taxable: {
    type: Boolean,
    default: true
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // Inventory
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  barcode: {
    type: String,
    trim: true
  },
  trackQuantity: {
    type: Boolean,
    default: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: 0
  },
  allowBackorder: {
    type: Boolean,
    default: false
  },

  // Physical Properties
  weight: {
    type: Number,
    min: 0
  },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  },
  weightUnit: {
    type: String,
    enum: ['kg', 'g', 'lb', 'oz'],
    default: 'kg'
  },
  dimensionUnit: {
    type: String,
    enum: ['cm', 'm', 'in', 'ft'],
    default: 'cm'
  },

  // Media
  images: [productImageSchema],
  videos: [{
    url: String,
    title: String,
    thumbnail: String
  }],

  // Variants
  hasVariants: {
    type: Boolean,
    default: false
  },
  variants: [variantSchema],

  // Specifications
  specifications: [specificationSchema],

  // Status & Visibility
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'archived'],
    default: 'draft',
    index: true
  },
  isVisible: {
    type: Boolean,
    default: true,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  isDigital: {
    type: Boolean,
    default: false
  },

  // SEO
  seo: seoSchema,

  // Ratings & Reviews
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  ratingDistribution: {
    5: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    1: { type: Number, default: 0 }
  },

  // Vendor/Supplier
  vendor: {
    type: String,
    trim: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Assuming suppliers are users with 'Supplier' role
  },

  // Dates
  publishedAt: {
    type: Date
  },
  availableFrom: {
    type: Date
  },
  availableUntil: {
    type: Date
  },

  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, subCategory: 1 });
productSchema.index({ status: 1, isVisible: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ basePrice: 1 });
productSchema.index({ quantity: 1 });
productSchema.index({ sku: 1 }, { unique: true });

// Virtual for discounted price
productSchema.virtual('discountPercentage').get(function() {
  if (this.comparePrice && this.comparePrice > this.basePrice) {
    return Math.round(((this.comparePrice - this.basePrice) / this.comparePrice) * 100);
  }
  return 0;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (!this.trackQuantity) return 'unlimited';
  if (this.quantity <= 0) return 'out_of_stock';
  if (this.quantity <= this.lowStockThreshold) return 'low_stock';
  return 'in_stock';
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0] || null;
});

// Virtual for total inventory value
productSchema.virtual('inventoryValue').get(function() {
  return this.quantity * (this.cost || this.basePrice);
});

// Pre-save middleware
productSchema.pre('save', function(next) {
  // Auto-generate slug if not provided
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }

  // Set published date when status changes to active
  if (this.status === 'active' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  // Ensure primary image is set
  if (this.images.length > 0) {
    const hasPrimary = this.images.some(img => img.isPrimary);
    if (!hasPrimary) {
      this.images[0].isPrimary = true;
    }
  }

  // Auto-generate SEO fields if not provided
  if (!this.seo.metaTitle) {
    this.seo.metaTitle = this.name.substring(0, 60);
  }
  if (!this.seo.metaDescription) {
    this.seo.metaDescription = this.shortDescription || this.description.substring(0, 160);
  }

  next();
});

// Instance methods
productSchema.methods.updateStock = function(quantity, operation = 'subtract') {
  if (operation === 'subtract') {
    this.quantity = Math.max(0, this.quantity - quantity);
  } else {
    this.quantity += quantity;
  }
  return this.save();
};

productSchema.methods.updateRating = function(newRating, oldRating = null) {
  if (oldRating) {
    // Update existing rating
    this.ratingDistribution[oldRating]--;
    this.ratingDistribution[newRating]++;
  } else {
    // Add new rating
    this.ratingDistribution[newRating]++;
    this.totalReviews++;
  }

  // Recalculate average rating
  let totalPoints = 0;
  let totalRatings = 0;
  
  for (let i = 1; i <= 5; i++) {
    totalPoints += i * this.ratingDistribution[i];
    totalRatings += this.ratingDistribution[i];
  }
  
  this.averageRating = totalRatings > 0 ? (totalPoints / totalRatings) : 0;
  this.totalReviews = totalRatings;
  
  return this.save();
};

productSchema.methods.softDelete = function(deletedBy) {
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.status = 'archived';
  this.isVisible = false;
  return this.save();
};

// Static methods
productSchema.statics.findActive = function() {
  return this.find({ 
    status: 'active', 
    isVisible: true, 
    deletedAt: null 
  });
};

productSchema.statics.findByCategory = function(categoryId, includeSubcategories = false) {
  const query = { 
    category: categoryId, 
    deletedAt: null 
  };
  
  if (includeSubcategories) {
    // This would need additional logic to include subcategories
    // For now, just return products in the main category
  }
  
  return this.find(query);
};

productSchema.statics.searchProducts = function(searchTerm, filters = {}) {
  const query = {
    $text: { $search: searchTerm },
    deletedAt: null,
    ...filters
  };
  
  return this.find(query, { score: { $meta: 'textScore' } })
             .sort({ score: { $meta: 'textScore' } });
};

// Clear any existing model to avoid conflicts
if (mongoose.models.Products) {
  delete mongoose.models.Products;
}

const Product = mongoose.model("Products", productSchema);
export default Product;
