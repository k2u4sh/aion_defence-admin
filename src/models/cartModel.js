import mongoose from "mongoose";

// Cart Item Schema
const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  variant: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// Cart Schema
const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  items: [cartItemSchema],
  subtotal: {
    type: Number,
    default: 0,
    min: 0
  },
  totalItems: {
    type: Number,
    default: 0,
    min: 0
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
cartSchema.index({ user: 1 }, { unique: true });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for cart total by seller
cartSchema.virtual('itemsBySeller').get(function() {
  const sellerMap = new Map();
  
  this.items.forEach(item => {
    const sellerId = item.seller.toString();
    if (!sellerMap.has(sellerId)) {
      sellerMap.set(sellerId, {
        seller: item.seller,
        items: [],
        subtotal: 0,
        totalItems: 0
      });
    }
    
    const sellerData = sellerMap.get(sellerId);
    sellerData.items.push(item);
    sellerData.subtotal += item.totalPrice;
    sellerData.totalItems += item.quantity;
  });
  
  return Array.from(sellerMap.values());
});

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
  this.subtotal = this.items.reduce((total, item) => total + item.totalPrice, 0);
  this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
  
  // Update expiry date on each save
  this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  
  next();
});

// Instance methods
cartSchema.methods.addItem = function(productId, sellerId, quantity = 1, variantId = null) {
  const existingItemIndex = this.items.findIndex(item => 
    item.product.toString() === productId && 
    item.seller.toString() === sellerId &&
    (variantId ? item.variant?.toString() === variantId : !item.variant)
  );
  
  if (existingItemIndex > -1) {
    this.items[existingItemIndex].quantity += quantity;
    this.items[existingItemIndex].totalPrice = 
      this.items[existingItemIndex].quantity * this.items[existingItemIndex].unitPrice;
  } else {
    // This would need to be populated with actual product price
    // In a real implementation, you'd fetch the product first
    this.items.push({
      product: productId,
      seller: sellerId,
      quantity,
      variant: variantId,
      unitPrice: 0, // To be set when product is populated
      totalPrice: 0 // To be calculated after unitPrice is set
    });
  }
  
  return this.save();
};

cartSchema.methods.removeItem = function(itemId) {
  this.items = this.items.filter(item => item._id.toString() !== itemId);
  return this.save();
};

cartSchema.methods.updateItemQuantity = function(itemId, quantity) {
  const item = this.items.find(item => item._id.toString() === itemId);
  if (item) {
    if (quantity <= 0) {
      return this.removeItem(itemId);
    }
    item.quantity = quantity;
    item.totalPrice = item.quantity * item.unitPrice;
    return this.save();
  }
  throw new Error('Item not found in cart');
};

cartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

cartSchema.methods.clearSellerItems = function(sellerId) {
  this.items = this.items.filter(item => item.seller.toString() !== sellerId);
  return this.save();
};

// Static methods
cartSchema.statics.findByUser = function(userId) {
  return this.findOne({ user: userId })
    .populate('items.product', 'name images basePrice slug status isVisible')
    .populate('items.seller', 'firstName lastName companyName sellerProfile.isVerifiedSeller');
};

cartSchema.statics.createOrUpdateCart = async function(userId, productId, sellerId, quantity, variantId) {
  let cart = await this.findOne({ user: userId });
  
  if (!cart) {
    cart = new this({ user: userId, items: [] });
  }
  
  return cart.addItem(productId, sellerId, quantity, variantId);
};

const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);
export default Cart;
