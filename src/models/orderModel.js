import mongoose from "mongoose";

// Order Item Schema
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false // Made optional to support subscription orders
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Made optional to support subscription orders
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
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
  variant: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  productSnapshot: {
    name: String,
    sku: String,
    image: String
  },
  // New fields for subscription orders
  itemType: {
    type: String,
    enum: ['product', 'subscription'],
    default: 'product'
  },
  subscriptionPlan: {
    name: String,
    billingCycle: String,
    duration: Number // in months
  }
}, { _id: true });

// Shipping Address Schema
const shippingAddressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  zipCode: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true }
}, { _id: false });

// Payment Information Schema
const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: [
      'credit_card', 
      'debit_card', 
      'paypal', 
      'bank_transfer', 
      'cash_on_delivery',
      'manual',           // For manual subscription payments
      'subscription',     // For subscription-related payments
      'razorpay',         // For Indian payment gateway
      'stripe',           // For international payments
      'upi'               // For UPI payments
    ],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  transactionId: String,
  paidAt: Date,
  refundedAt: Date,
  refundAmount: {
    type: Number,
    min: 0
  }
}, { _id: false });

// Order Schema
const orderSchema = new mongoose.Schema({
  // Order Identification
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Order Type
  orderType: {
    type: String,
    enum: ['product', 'subscription', 'mixed'],
    default: 'product',
    index: true
  },
  
  // Parties
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Order Items
  items: [orderItemSchema],
  
  // Pricing
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Addresses
  shippingAddress: shippingAddressSchema,
  billingAddress: shippingAddressSchema,
  
  // Payment
  payment: paymentSchema,
  
  // Order Status
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
      'returned'
    ],
    default: 'pending',
    index: true
  },
  
  // Tracking
  trackingNumber: String,
  carrier: String,
  
  // Timestamps
  confirmedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  
  // Notes
  customerNotes: String,
  adminNotes: String,
  
  // Communication
  messages: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isFromBuyer: Boolean,
    isFromSeller: Boolean,
    isFromAdmin: Boolean
  }],
  
  // Subscription-specific fields
  subscription: {
    planName: String,
    billingCycle: String,
    startDate: Date,
    endDate: Date,
    autoRenew: {
      type: Boolean,
      default: true
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription'
    }
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ 'items.seller': 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });

// Virtual for order age
orderSchema.virtual('orderAge').get(function() {
  return Date.now() - this.createdAt;
});

// Virtual for sellers involved in order
orderSchema.virtual('sellers').get(function() {
  if (!this.items || !Array.isArray(this.items)) {
    return [];
  }
  
  return [...new Set(this.items
    .filter(item => item && item.seller && typeof item.seller.toString === 'function') // More robust filtering
    .map(item => item.seller.toString())
  )];
});

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  try {
    if (this.isNew) {
      // Only generate order number if it's not already set
      if (!this.orderNumber) {
        const count = await this.constructor.countDocuments();
        this.orderNumber = `ORD-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
      }
      
      // Auto-determine order type based on items
      if (this.items && this.items.length > 0) {
        const hasProducts = this.items.some(item => item.itemType === 'product' || !item.itemType);
        const hasSubscriptions = this.items.some(item => item.itemType === 'subscription');
        
        if (hasProducts && hasSubscriptions) {
          this.orderType = 'mixed';
        } else if (hasSubscriptions) {
          this.orderType = 'subscription';
        } else {
          this.orderType = 'product';
        }
      }
    }
    next();
  } catch (error) {
    console.error('❌ Error in pre-save middleware:', error);
    next(error);
  }
});

// Static methods
orderSchema.statics.getOrdersByBuyer = function(buyerId, options = {}) {
  const { page = 1, limit = 10, status, orderType } = options;
  const query = { buyer: buyerId };
  if (status) query.status = status;
  if (orderType) query.orderType = orderType;
  
  return this.find(query)
    .populate('items.product', 'name images slug')
    .populate('items.seller', 'firstName lastName companyName')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

orderSchema.statics.getOrdersBySeller = function(sellerId, options = {}) {
  const { page = 1, limit = 10, status } = options;
  const query = { 'items.seller': sellerId, orderType: { $ne: 'subscription' } }; // Exclude subscription orders
  if (status) query.status = status;
  
  return this.find(query)
    .populate('buyer', 'firstName lastName companyName email')
    .populate('items.product', 'name images slug')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

// New method for subscription orders
orderSchema.statics.getSubscriptionOrdersByBuyer = function(buyerId, options = {}) {
  const { page = 1, limit = 10, status } = options;
  const query = { buyer: buyerId, orderType: { $in: ['subscription', 'mixed'] } };
  if (status) query.status = status;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

// Instance methods
orderSchema.methods.canBeCancelled = function() {
  return ['pending', 'confirmed'].includes(this.status);
};

orderSchema.methods.canBeShipped = function() {
  return this.status === 'confirmed' || this.status === 'processing';
};

orderSchema.methods.addMessage = function(fromUserId, message, userType) {
  this.messages.push({
    from: fromUserId,
    message,
    isFromBuyer: userType === 'buyer',
    isFromSeller: userType === 'seller',
    isFromAdmin: userType === 'admin'
  });
  return this.save();
};

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;
