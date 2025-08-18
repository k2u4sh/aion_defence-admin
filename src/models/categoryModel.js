import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, "Category name is required"], 
    unique: true, 
    trim: true,
    maxlength: [100, "Category name cannot exceed 100 characters"]
  },
  description: { 
    type: String, 
    trim: true,
    maxlength: [500, "Description cannot exceed 500 characters"]
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  image: {
    type: String,
    trim: true
  },
  icon: {
    type: String,
    trim: true
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    default: null
  },
  level: {
    type: Number,
    default: 0,
    min: 0,
    max: 3
  },
  metaTitle: {
    type: String,
    trim: true,
    maxlength: [60, "Meta title cannot exceed 60 characters"]
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: [160, "Meta description cannot exceed 160 characters"]
  },
  featuredProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
categorySchema.index({ isActive: 1, sortOrder: 1 });
categorySchema.index({ parentCategory: 1, level: 1 });
categorySchema.index({ slug: 1 });

// Create a slug from the name before saving
categorySchema.pre('save', function(next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim('-'); // Remove leading/trailing hyphens
  }
  next();
});

// Virtual for products count (direct products in this category)
categorySchema.virtual('productsCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  count: true
});

// Virtual for child categories
categorySchema.virtual('childCategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory'
});

// Static method to get root categories (top-level categories)
categorySchema.statics.getRootCategories = function() {
  return this.find({ parentCategory: null, isActive: true }).sort({ sortOrder: 1, name: 1 });
};

// Static method to get categories by level
categorySchema.statics.getCategoriesByLevel = function(level = 0) {
  return this.find({ level: level, isActive: true }).sort({ sortOrder: 1, name: 1 });
};

// Instance method to get all descendants (subcategories and their subcategories)
categorySchema.methods.getDescendants = async function() {
  const descendants = [];
  const queue = [this._id];
  
  while (queue.length > 0) {
    const currentId = queue.shift();
    const children = await this.constructor.find({ parentCategory: currentId, isActive: true });
    
    for (const child of children) {
      descendants.push(child);
      queue.push(child._id);
    }
  }
  
  return descendants;
};

// Instance method to get category path (breadcrumb)
categorySchema.methods.getPath = async function() {
  const path = [];
  let currentCategory = await this.constructor.findById(this._id);
  
  while (currentCategory) {
    path.unshift(currentCategory);
    if (currentCategory.parentCategory) {
      currentCategory = await this.constructor.findById(currentCategory.parentCategory);
    } else {
      currentCategory = null;
    }
  }
  
  return path;
};

// Instance method to check if category has children
categorySchema.methods.hasChildren = function() {
  return this.constructor.countDocuments({ parentCategory: this._id, isActive: true });
};

const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);
export default Category;
