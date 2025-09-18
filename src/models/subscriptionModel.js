import mongoose from "mongoose";

// Subscription Plan Schema
const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['FREE', 'GOLD', 'PLATINUM'],
    index: true
  },
  price: {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR']
    },
    period: {
      type: String,
      default: 'month',
      enum: ['month', 'year']
    }
  },
  features: [{
    name: {
      type: String,
      required: true
    },
    included: {
      type: Boolean,
      required: true
    },
    description: String
  }],
  maxProducts: {
    type: Number,
    default: 0 // 0 means unlimited
  },
  maxUsers: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: true });

// Payment Schema
const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  method: {
    type: String,
    enum: [
      'credit_card', 
      'debit_card', 
      'net_banking', 
      'upi', 
      'bank_transfer',
      'subscription',     // For subscription payments
      'manual'            // For manual payments
    ],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  gateway: {
    type: String,
    enum: ['razorpay', 'stripe', 'paypal', 'manual'],
    default: 'manual'
  },
  gatewayResponse: mongoose.Schema.Types.Mixed,
  paidAt: Date,
  refundedAt: Date,
  refundAmount: {
    type: Number,
    min: 0
  },
  notes: String
}, { _id: true });

// Main Subscription Schema
const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // company field temporarily removed for testing
  // company: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Company',
  //   required: false,
  //   index: true
  // },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  planName: {
    type: String,
    required: true,
    enum: ['FREE', 'GOLD', 'PLATINUM']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired', 'cancelled', 'suspended'],
    default: 'active',
    index: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  nextBillingDate: {
    type: Date,
    required: true
  },
  payments: [paymentSchema],
  features: [{
    name: String,
    included: Boolean,
    usage: {
      current: { type: Number, default: 0 },
      limit: { type: Number, default: 0 }
    }
  }],
  usage: {
    products: {
      current: { type: Number, default: 0 },
      limit: { type: Number, default: 0 }
    },
    users: {
      current: { type: Number, default: 1 },
      limit: { type: Number, default: 1 }
    },
    storage: {
      current: { type: Number, default: 0 }, // in MB
      limit: { type: Number, default: 0 }
    }
  },
  metadata: {
    source: String, // 'registration', 'upgrade', 'admin'
    notes: String,
    tags: [String]
  },
  isTrial: {
    type: Boolean,
    default: false
  },
  trialEndsAt: Date,
  cancelledAt: Date,
  cancellationReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
subscriptionSchema.index({ user: 1, status: 1 });
// subscriptionSchema.index({ company: 1, status: 1 }); // temporarily removed
subscriptionSchema.index({ endDate: 1 }, { expireAfterSeconds: 0 });
subscriptionSchema.index({ nextBillingDate: 1 });

// Virtual for subscription age
subscriptionSchema.virtual('age').get(function() {
  return Date.now() - this.startDate;
});

// Virtual for days until expiry
subscriptionSchema.virtual('daysUntilExpiry').get(function() {
  return Math.ceil((this.endDate - Date.now()) / (1000 * 60 * 60 * 24));
});

// Virtual for isExpired
subscriptionSchema.virtual('isExpired').get(function() {
  return Date.now() > this.endDate;
});

// Virtual for isActive
subscriptionSchema.virtual('isActiveSubscription').get(function() {
  return this.status === 'active' && !this.isExpired;
});

// Pre-save middleware to set end date and next billing date
subscriptionSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('startDate') || this.isModified('billingCycle')) {
    const startDate = this.startDate || new Date();
    const billingCycle = this.billingCycle || 'monthly';
    
    // Calculate end date
    if (billingCycle === 'monthly') {
      this.endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else if (billingCycle === 'yearly') {
      this.endDate = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);
    }
    
    // Set next billing date
    this.nextBillingDate = new Date(this.endDate);
  }
  next();
});

// Static methods
subscriptionSchema.statics.getActiveSubscription = function(userId) {
  return this.findOne({
    user: userId,
    status: 'active',
    endDate: { $gt: new Date() }
  }).populate('plan');
};

subscriptionSchema.statics.getExpiringSubscriptions = function(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  
  return this.find({
    status: 'active',
    endDate: { $lte: date, $gt: new Date() }
  }).populate('user', 'firstName lastName email companyName');
};

subscriptionSchema.statics.getSubscriptionStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: {
          $sum: {
            $reduce: {
              input: '$payments',
              initialValue: 0,
              in: {
                $add: [
                  '$$value',
                  { $cond: [{ $eq: ['$$this.status', 'completed'] }, '$$this.amount', 0] }
                ]
              }
            }
          }
        }
      }
    }
  ]);
};

// Instance methods
subscriptionSchema.methods.canAddProduct = function() {
  if (this.planName === 'FREE') return false;
  return this.usage.products.current < this.usage.products.limit;
};

subscriptionSchema.methods.canAddUser = function() {
  return this.usage.users.current < this.usage.users.limit;
};

subscriptionSchema.methods.canUseFeature = function(featureName) {
  const feature = this.features.find(f => f.name === featureName);
  return feature && feature.included;
};

subscriptionSchema.methods.addPayment = function(paymentData) {
  this.payments.push(paymentData);
  return this.save();
};

subscriptionSchema.methods.cancel = function(reason = '') {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  this.autoRenew = false;
  return this.save();
};

subscriptionSchema.methods.renew = function() {
  if (this.status === 'cancelled') {
    this.status = 'active';
    this.cancelledAt = undefined;
    this.cancellationReason = undefined;
  }
  
  const currentDate = new Date();
  this.startDate = currentDate;
  
  if (this.billingCycle === 'monthly') {
    this.endDate = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  } else if (this.billingCycle === 'yearly') {
    this.endDate = new Date(currentDate.getTime() + 365 * 24 * 60 * 60 * 1000);
  }
  
  this.nextBillingDate = new Date(this.endDate);
  return this.save();
};

// Create models
const SubscriptionPlan = mongoose.models.SubscriptionPlan || mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
export { SubscriptionPlan };
