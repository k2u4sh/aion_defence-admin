import mongoose from "mongoose";

const quoteSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Can be null for non-authenticated users
  },
  buyerName: {
    type: String,
    required: true,
    trim: true
  },
  buyerEmail: {
    type: String,
    trim: true
  },
  buyerPhone: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['pending', 'responded', 'accepted', 'rejected', 'expired'],
    default: 'pending',
    index: true
  },
  sellerResponse: {
    message: String,
    price: Number,
    currency: { type: String, default: 'INR' },
    validUntil: Date,
    respondedAt: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
quoteSchema.index({ productId: 1, buyerId: 1 });
quoteSchema.index({ sellerId: 1, status: 1 });
quoteSchema.index({ createdAt: -1 });
quoteSchema.index({ status: 1, createdAt: -1 });

// Virtual for product details
quoteSchema.virtual('product', {
  ref: 'Product',
  localField: 'productId',
  foreignField: '_id',
  justOne: true
});

// Virtual for seller details
quoteSchema.virtual('seller', {
  ref: 'User',
  localField: 'sellerId',
  foreignField: '_id',
  justOne: true
});

// Virtual for buyer details
quoteSchema.virtual('buyer', {
  ref: 'User',
  localField: 'buyerId',
  foreignField: '_id',
  justOne: true
});

// Instance method to check if quote is expired
quoteSchema.methods.isExpired = function() {
  if (this.sellerResponse && this.sellerResponse.validUntil) {
    return new Date() > this.sellerResponse.validUntil;
  }
  return false;
};

// Static method to get quotes for a seller
quoteSchema.statics.getSellerQuotes = function(sellerId, status = null) {
  const query = { sellerId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('product', 'name images basePrice')
    .populate('buyer', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

// Static method to get quotes for a buyer
quoteSchema.statics.getBuyerQuotes = function(buyerId, status = null) {
  const query = { buyerId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('product', 'name images basePrice')
    .populate('seller', 'firstName lastName companyName')
    .sort({ createdAt: -1 });
};

const Quote = mongoose.models.Quote || mongoose.model("Quote", quoteSchema);
module.exports = Quote;
