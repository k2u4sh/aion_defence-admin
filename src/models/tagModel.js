import mongoose from "mongoose";

const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Tag name is required"],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [2, "Tag name must be at least 2 characters"],
    maxlength: [50, "Tag name cannot exceed 50 characters"]
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, "Description cannot exceed 200 characters"]
  },
  color: {
    type: String,
    trim: true,
    default: "#6B7280", // Default gray color
    match: [/^#[0-9A-F]{6}$/i, "Color must be a valid hex color code"]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null // Tags can be category-specific or global
  },
  isSystem: {
    type: Boolean,
    default: false // System tags cannot be deleted by users
  },
  metadata: {
    totalProducts: {
      type: Number,
      default: 0
    },
    lastUsed: {
      type: Date,
      default: Date.now
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
tagSchema.index({ name: 1 });
tagSchema.index({ slug: 1 });
tagSchema.index({ isActive: 1, sortOrder: 1 });
tagSchema.index({ category: 1, isActive: 1 });
tagSchema.index({ 'metadata.totalProducts': -1 });

// Create slug from name before saving
tagSchema.pre('save', function(next) {
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

// Virtual for products count
tagSchema.virtual('productsCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'tags',
  count: true
});

// Static method to get popular tags
tagSchema.statics.getPopularTags = function(limit = 10, categoryId = null) {
  const query = { isActive: true };
  if (categoryId) {
    query.$or = [
      { category: categoryId },
      { category: null } // Include global tags
    ];
  }
  
  return this.find(query)
    .sort({ 'metadata.totalProducts': -1, name: 1 })
    .limit(limit);
};

// Static method to get tags by category
tagSchema.statics.getTagsByCategory = function(categoryId) {
  return this.find({
    $or: [
      { category: categoryId },
      { category: null } // Include global tags
    ],
    isActive: true
  }).sort({ sortOrder: 1, name: 1 });
};

// Instance method to increment product count
tagSchema.methods.incrementProductCount = function() {
  this.metadata.totalProducts += 1;
  this.metadata.lastUsed = new Date();
  return this.save();
};

// Instance method to decrement product count
tagSchema.methods.decrementProductCount = function() {
  if (this.metadata.totalProducts > 0) {
    this.metadata.totalProducts -= 1;
  }
  return this.save();
};

// Static method to update product counts
tagSchema.statics.updateProductCounts = async function() {
  const Product = mongoose.model('Product');
  const tags = await this.find({});
  
  for (const tag of tags) {
    const productCount = await Product.countDocuments({
      tags: tag._id,
      status: 'active',
      isVisible: true,
      deletedAt: null
    });
    
    tag.metadata.totalProducts = productCount;
    await tag.save();
  }
};

// Static method to clean unused tags
tagSchema.statics.cleanUnusedTags = function() {
  return this.deleteMany({
    'metadata.totalProducts': 0,
    isSystem: false,
    'metadata.lastUsed': { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // 90 days ago
  });
};

const Tag = mongoose.models.Tag || mongoose.model("Tag", tagSchema);
export default Tag;
