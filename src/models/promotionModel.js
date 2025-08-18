import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['discount', 'bogo', 'free_shipping', 'bundle', 'flash_sale', 'seasonal'],
    required: true,
    index: true
  },
  code: {
    type: String,
    unique: true,
    sparse: true, // Not all promotions need codes (like automatic sales)
    uppercase: true,
    trim: true
  },
  
  // Discount Configuration
  discountType: {
    type: String,
    enum: ['percentage', 'fixed_amount', 'buy_x_get_y'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  maxDiscountAmount: {
    type: Number, // For percentage discounts
    min: 0
  },
  minOrderAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Applicability
  applicableTo: {
    type: String,
    enum: ['all', 'categories', 'products', 'sellers', 'users'],
    default: 'all',
    index: true
  },
  targetCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  targetProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  targetSellers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  eligibleUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Usage Limits
  maxUses: {
    type: Number,
    min: 1
  },
  maxUsesPerUser: {
    type: Number,
    default: 1,
    min: 1
  },
  currentUses: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Time Constraints
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    required: true,
    index: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'expired', 'deleted'],
    default: 'draft',
    index: true
  },
  isAutomaticDiscount: {
    type: Boolean,
    default: false // If true, applies automatically without code
  },
  
  // Display Settings
  banner: {
    title: String,
    subtitle: String,
    image: String,
    backgroundColor: String,
    textColor: String
  },
  
  // Terms & Conditions
  terms: String,
  excludesSaleItems: {
    type: Boolean,
    default: false
  },
  
  // Analytics
  analytics: {
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  },
  
  // Creator Info
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
promotionSchema.index({ status: 1, startDate: 1, endDate: 1 });
promotionSchema.index({ code: 1, status: 1 });
promotionSchema.index({ type: 1, status: 1 });
promotionSchema.index({ applicableTo: 1, status: 1 });

// Virtual for active status
promotionSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         this.startDate <= now && 
         this.endDate >= now &&
         (this.maxUses ? this.currentUses < this.maxUses : true);
});

// Virtual for time remaining
promotionSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  if (this.endDate <= now) return 'Expired';
  
  const diff = this.endDate.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days} day(s) ${hours} hour(s)`;
  return `${hours} hour(s)`;
});

// Instance method to check if user can use promotion
promotionSchema.methods.canUserUse = async function(userId) {
  // Check if promotion is active
  if (!this.isActive) {
    return { canUse: false, reason: 'Promotion not active' };
  }
  
  // Check user eligibility
  if (this.eligibleUsers.length > 0 && !this.eligibleUsers.includes(userId)) {
    return { canUse: false, reason: 'User not eligible' };
  }
  
  // Check per-user usage limit
  if (this.maxUsesPerUser) {
    const Order = mongoose.model('Order');
    const userUsageCount = await Order.countDocuments({
      buyer: userId,
      'promotions.promotionId': this._id
    });
    
    if (userUsageCount >= this.maxUsesPerUser) {
      return { canUse: false, reason: 'Usage limit exceeded' };
    }
  }
  
  return { canUse: true };
};

// Instance method to apply promotion to cart/order
promotionSchema.methods.applyToOrder = function(orderItems, orderSubtotal) {
  let discount = 0;
  
  switch (this.discountType) {
    case 'percentage':
      discount = (orderSubtotal * this.discountValue) / 100;
      if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
        discount = this.maxDiscountAmount;
      }
      break;
      
    case 'fixed_amount':
      discount = Math.min(this.discountValue, orderSubtotal);
      break;
      
    case 'buy_x_get_y':
      // Implement BOGO logic here
      // This would need more complex logic based on specific items
      break;
  }
  
  return {
    discountAmount: discount,
    promotionApplied: {
      promotionId: this._id,
      promotionName: this.name,
      promotionCode: this.code,
      discountType: this.discountType,
      discountValue: this.discountValue,
      appliedAmount: discount
    }
  };
};

// Instance method to increment usage
promotionSchema.methods.incrementUsage = function(orderTotal = 0) {
  this.currentUses += 1;
  this.analytics.conversions += 1;
  this.analytics.revenue += orderTotal;
  return this.save();
};

// Static method to find applicable promotions
promotionSchema.statics.findApplicablePromotions = function(cartItems, userId, subtotal) {
  const now = new Date();
  
  return this.find({
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now },
    minOrderAmount: { $lte: subtotal },
    $or: [
      { maxUses: { $exists: false } },
      { $expr: { $lt: ['$currentUses', '$maxUses'] } }
    ]
  });
};

// Static method to get active promotions for display
promotionSchema.statics.getActivePromotions = function(limit = 10) {
  const now = new Date();
  
  return this.find({
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now }
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .select('name description type banner startDate endDate code isAutomaticDiscount');
};

const Promotion = mongoose.models.Promotion || mongoose.model('Promotion', promotionSchema);
export default Promotion;
